#pragma once

// Pure C++ core of Scale Snap: no JUCE dependency, so it can be unit tested
// on its own (see Tests/ScaleEngineTests.cpp).

#include <array>
#include <cstddef>
#include <cstdint>
#include <initializer_list>

#include "ScaleLibrary.h"

namespace scalesnap
{

//==============================================================================
inline const std::array<const char*, 12>& getNoteNames()
{
    static const std::array<const char*, 12> names {{ "C", "C#", "D", "D#", "E", "F",
                                                      "F#", "G", "G#", "A", "A#", "B" }};
    return names;
}

enum class SnapMode
{
    nearestPreferDown = 0,
    nearestPreferUp,
    alwaysUp,
    alwaysDown,
    block // out-of-scale notes are muted
};

inline const std::array<const char*, 5>& getSnapModeNames()
{
    static const std::array<const char*, 5> names {{ "Nearest (tie: down)", "Nearest (tie: up)",
                                                     "Always up", "Always down", "Block wrong notes" }};
    return names;
}

enum class ChordType
{
    off = 0,
    triad,
    seventh,
    ninth
};

inline const std::array<const char*, 4>& getChordTypeNames()
{
    static const std::array<const char*, 4> names {{ "Off (single notes)", "Triads", "7th chords", "9th chords" }};
    return names;
}

constexpr int maxNotesPerKey = 5;

//==============================================================================
/** Maps an incoming note onto the selected scale (and optionally onto a diatonic chord). */
class ScaleEngine
{
public:
    void setScale (int newRoot, int scaleIndex)
    {
        root = ((newRoot % 12) + 12) % 12;
        const auto& scales = getScales();
        if (scaleIndex < 0 || scaleIndex >= (int) scales.size())
            scaleIndex = 0;
        mask = scales[(std::size_t) scaleIndex].mask;
    }

    int getRoot() const noexcept { return root; }

    bool isInScale (int note) const noexcept
    {
        const int interval = (((note - root) % 12) + 12) % 12;
        return (mask >> interval) & 1u;
    }

    /** Returns the corrected note, or -1 if the note should be muted. */
    int snap (int note, SnapMode mode) const noexcept
    {
        if (note < 0 || note > 127)
            return -1;

        if (isInScale (note))
            return note;

        if (mode == SnapMode::block)
            return -1;

        for (int d = 1; d < 12; ++d)
        {
            const int down = note - d;
            const int up   = note + d;
            const bool downOk = down >= 0 && isInScale (down);
            const bool upOk   = up <= 127 && isInScale (up);

            switch (mode)
            {
                case SnapMode::alwaysUp:          if (upOk) return up;   break;
                case SnapMode::alwaysDown:        if (downOk) return down; break;
                case SnapMode::nearestPreferUp:   if (upOk) return up;   if (downOk) return down; break;
                case SnapMode::nearestPreferDown:
                case SnapMode::block:             if (downOk) return down; if (upOk) return up; break;
            }
        }

        // Only reachable at the edges of the MIDI range with "always up/down": fall back to nearest.
        return mode == SnapMode::nearestPreferDown ? -1 : snap (note, SnapMode::nearestPreferDown);
    }

    /** Moves an in-scale note up by a number of scale degrees. Returns -1 if it leaves the MIDI range. */
    int stepUp (int note, int degrees) const noexcept
    {
        for (int i = 0; i < degrees; ++i)
        {
            do
            {
                if (++note > 127)
                    return -1;
            }
            while (! isInScale (note));
        }
        return note;
    }

    /** Fills `out` with the notes to play for one incoming key. Returns how many notes were written. */
    int process (int note, SnapMode mode, ChordType chord, std::array<int, maxNotesPerKey>& out) const noexcept
    {
        const int base = snap (note, mode);
        if (base < 0)
            return 0;

        int count = 0;
        out[(std::size_t) count++] = base;

        const int numStacked = chord == ChordType::triad   ? 2
                             : chord == ChordType::seventh ? 3
                             : chord == ChordType::ninth   ? 4
                                                           : 0;

        // Stack thirds: every other scale degree above the (corrected) root.
        for (int i = 1; i <= numStacked; ++i)
        {
            const int n = stepUp (base, i * 2);
            if (n >= 0)
                out[(std::size_t) count++] = n;
        }

        return count;
    }

private:
    int root = 0;
    uint16_t mask = getScales()[0].mask;
};

//==============================================================================
struct NoteEvent
{
    enum class Type : uint8_t { noteOn, noteOff };
    Type type;
    int channel;  // 1..16
    int note;     // 0..127
    uint8_t velocity;
};

/** Keeps track of which output notes each held key produced, so that note-offs always
    match their note-ons (even if the scale changes while a key is held), and so that
    two keys snapping to the same note don't cut each other off. Realtime safe. */
class NoteTracker
{
public:
    using Events = std::array<NoteEvent, maxNotesPerKey * 2 * 2>;

    void clear() noexcept
    {
        for (auto& ch : held)    for (auto& k : ch) k.count = 0;
        for (auto& ch : sounding) ch.fill (0);
    }

    /** Handles a key press. `outNotes`/`numOut` are the engine's result for this key. */
    int noteOn (int channel, int inNote, uint8_t velocity,
                const std::array<int, maxNotesPerKey>& outNotes, int numOut, Events& events) noexcept
    {
        int numEvents = 0;
        if (! valid (channel, inNote))
            return 0;

        // Same key pressed again without a release: release what it was playing first.
        numEvents += noteOff (channel, inNote, 0, events, numEvents);

        auto& key = held[(std::size_t) channel - 1][(std::size_t) inNote];
        key.count = 0;

        for (int i = 0; i < numOut; ++i)
        {
            const int n = outNotes[(std::size_t) i];
            if (n < 0 || n > 127 || key.contains (n))
                continue;

            auto& refCount = sounding[(std::size_t) channel - 1][(std::size_t) n];

            // Already sounding from another key: retrigger it so the new key gets a fresh attack.
            if (refCount > 0)
                events[(std::size_t) numEvents++] = { NoteEvent::Type::noteOff, channel, n, 0 };

            events[(std::size_t) numEvents++] = { NoteEvent::Type::noteOn, channel, n, velocity };
            ++refCount;
            key.notes[(std::size_t) key.count++] = (int8_t) n;
        }

        return numEvents;
    }

    /** Handles a key release. Events are written starting at `offset`; returns how many were added. */
    int noteOff (int channel, int inNote, uint8_t velocity, Events& events, int offset = 0) noexcept
    {
        if (! valid (channel, inNote))
            return 0;

        auto& key = held[(std::size_t) channel - 1][(std::size_t) inNote];
        int numEvents = 0;

        for (int i = 0; i < key.count; ++i)
        {
            const int n = key.notes[(std::size_t) i];
            auto& refCount = sounding[(std::size_t) channel - 1][(std::size_t) n];

            if (refCount > 0 && --refCount == 0)
                events[(std::size_t) (offset + numEvents++)] = { NoteEvent::Type::noteOff, channel, n, velocity };
        }

        key.count = 0;
        return numEvents;
    }

    /** First output note a held key is playing (for routing polyphonic aftertouch), or -1. */
    int firstOutputFor (int channel, int inNote) const noexcept
    {
        if (! valid (channel, inNote))
            return -1;
        const auto& key = held[(std::size_t) channel - 1][(std::size_t) inNote];
        return key.count > 0 ? key.notes[0] : -1;
    }

    bool isKeyHeld (int channel, int inNote) const noexcept
    {
        return valid (channel, inNote) && held[(std::size_t) channel - 1][(std::size_t) inNote].count > 0;
    }

    bool isSounding (int channel, int note) const noexcept
    {
        return valid (channel, note) && sounding[(std::size_t) channel - 1][(std::size_t) note] > 0;
    }

    /** Releases everything that is sounding on a channel (e.g. on "All Notes Off"). */
    template <typename Callback>
    void releaseAll (int channel, Callback&& emitNoteOff) noexcept
    {
        if (channel < 1 || channel > 16)
            return;

        for (int n = 0; n < 128; ++n)
            if (sounding[(std::size_t) channel - 1][(std::size_t) n] > 0)
                emitNoteOff (channel, n);

        for (auto& k : held[(std::size_t) channel - 1]) k.count = 0;
        sounding[(std::size_t) channel - 1].fill (0);
    }

private:
    struct HeldKey
    {
        uint8_t count = 0;
        std::array<int8_t, maxNotesPerKey> notes {};

        bool contains (int n) const noexcept
        {
            for (int i = 0; i < count; ++i)
                if (notes[(std::size_t) i] == n)
                    return true;
            return false;
        }
    };

    static bool valid (int channel, int note) noexcept
    {
        return channel >= 1 && channel <= 16 && note >= 0 && note <= 127;
    }

    std::array<std::array<HeldKey, 128>, 16> held {};
    std::array<std::array<uint8_t, 128>, 16> sounding {};
};

} // namespace scalesnap
