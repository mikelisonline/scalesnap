// Plain C++ tests for the scale/note logic. Run with `ctest` after building.

#include "ScaleEngine.h"

#include <cstdio>
#include <cstring>
#include <string_view>
#include <vector>

using namespace scalesnap;

static int failures = 0;

#define CHECK_EQ(actual, expected)                                                             \
    do                                                                                         \
    {                                                                                          \
        const auto a_ = (actual);                                                              \
        const auto e_ = (expected);                                                            \
        if (! (a_ == e_))                                                                      \
        {                                                                                      \
            std::printf ("FAIL %s:%d  %s == %d, expected %d\n", __FILE__, __LINE__, #actual,   \
                         (int) a_, (int) e_);                                                  \
            ++failures;                                                                        \
        }                                                                                      \
    } while (0)

static int scaleIndex (const char* id)
{
    return findScaleIndexById (id);
}

static std::vector<int> play (const ScaleEngine& e, int note, SnapMode m, ChordType c)
{
    std::array<int, maxNotesPerKey> out {};
    const int n = e.process (note, m, c, out);
    return { out.begin(), out.begin() + n };
}

static void testSnapping()
{
    ScaleEngine e;
    e.setScale (0, scaleIndex ("major")); // C major

    // In-scale notes are untouched.
    for (int n : { 60, 62, 64, 65, 67, 69, 71, 72 })
        CHECK_EQ (e.snap (n, SnapMode::nearestPreferDown), n);

    // C# (61) is between C and D: tie -> down gives C, tie -> up gives D.
    CHECK_EQ (e.snap (61, SnapMode::nearestPreferDown), 60);
    CHECK_EQ (e.snap (61, SnapMode::nearestPreferUp), 62);
    CHECK_EQ (e.snap (61, SnapMode::alwaysUp), 62);
    CHECK_EQ (e.snap (61, SnapMode::alwaysDown), 60);
    CHECK_EQ (e.snap (61, SnapMode::block), -1);
    CHECK_EQ (e.snap (60, SnapMode::block), 60);

    // A minor pentatonic: A C D E G. Bb (70) -> A (69) nearest, F (65) -> E (64) or G (67).
    e.setScale (9, scaleIndex ("minor_pentatonic"));
    CHECK_EQ (e.snap (70, SnapMode::nearestPreferDown), 69);
    CHECK_EQ (e.snap (70, SnapMode::nearestPreferUp), 69);  // A is 1 away, C is 2 away
    CHECK_EQ (e.snap (65, SnapMode::nearestPreferDown), 64);
    CHECK_EQ (e.snap (66, SnapMode::nearestPreferDown), 67); // F# -> G is nearest
    CHECK_EQ (e.snap (66, SnapMode::alwaysDown), 64);

    // Edges of the MIDI range never produce invalid notes.
    e.setScale (0, scaleIndex ("major"));
    CHECK_EQ (e.snap (126, SnapMode::alwaysUp), 127);    // F#9 -> G9
    e.setScale (1, scaleIndex ("major"));               // Db major: 127 (G) not in scale
    CHECK_EQ (e.snap (127, SnapMode::alwaysUp), 126);   // falls back to nearest (F#)
    e.setScale (11, scaleIndex ("major"));              // B major: 0 (C) not in scale
    CHECK_EQ (e.snap (0, SnapMode::alwaysDown), 1);

    // Chromatic changes nothing.
    e.setScale (0, scaleIndex ("chromatic"));
    for (int n = 0; n < 128; ++n)
        CHECK_EQ (e.snap (n, SnapMode::block), n);
}

static void testChords()
{
    ScaleEngine e;
    e.setScale (0, scaleIndex ("major"));

    auto triad = play (e, 62, SnapMode::nearestPreferDown, ChordType::triad); // D -> Dm
    CHECK_EQ ((int) triad.size(), 3);
    CHECK_EQ (triad[0], 62); CHECK_EQ (triad[1], 65); CHECK_EQ (triad[2], 69);

    auto seventh = play (e, 67, SnapMode::nearestPreferDown, ChordType::seventh); // G -> G7
    CHECK_EQ ((int) seventh.size(), 4);
    CHECK_EQ (seventh[1], 71); CHECK_EQ (seventh[2], 74); CHECK_EQ (seventh[3], 77);

    // Wrong note is corrected first, then the chord is built: C# -> C -> C E G B D.
    auto ninth = play (e, 61, SnapMode::nearestPreferDown, ChordType::ninth);
    CHECK_EQ ((int) ninth.size(), 5);
    CHECK_EQ (ninth[0], 60); CHECK_EQ (ninth[4], 74);

    // Chord notes that would go past 127 are dropped.
    CHECK_EQ ((int) play (e, 127, SnapMode::nearestPreferDown, ChordType::triad).size(), 1);

    // Blocked notes produce nothing.
    CHECK_EQ ((int) play (e, 61, SnapMode::block, ChordType::triad).size(), 0);
}

static void testTracker()
{
    NoteTracker t;
    NoteTracker::Events ev;
    std::array<int, maxNotesPerKey> notes {};

    // C (60) and C# (61 -> 60) held together: one C sounding, released only when both keys are up.
    notes[0] = 60;
    CHECK_EQ (t.noteOn (1, 60, 100, notes, 1, ev), 1);
    CHECK_EQ ((int) ev[0].type, (int) NoteEvent::Type::noteOn);

    CHECK_EQ (t.noteOn (1, 61, 90, notes, 1, ev), 2); // retrigger: off + on
    CHECK_EQ ((int) ev[0].type, (int) NoteEvent::Type::noteOff);
    CHECK_EQ ((int) ev[1].type, (int) NoteEvent::Type::noteOn);
    CHECK_EQ (ev[1].note, 60);

    CHECK_EQ (t.noteOff (1, 60, 0, ev), 0); // C# key still holds the C
    CHECK_EQ (t.isSounding (1, 60), true);
    CHECK_EQ (t.noteOff (1, 61, 0, ev), 1);
    CHECK_EQ (ev[0].note, 60);
    CHECK_EQ (t.isSounding (1, 60), false);

    // Note-off goes to the note that was actually played, even if the scale changed meanwhile.
    notes[0] = 62;
    t.noteOn (2, 61, 100, notes, 1, ev);
    CHECK_EQ (t.noteOff (2, 61, 0, ev), 1);
    CHECK_EQ (ev[0].note, 62);
    CHECK_EQ (ev[0].channel, 2);

    // Chords: release of the key releases every chord note.
    notes = { 60, 64, 67, 0, 0 };
    CHECK_EQ (t.noteOn (1, 60, 100, notes, 3, ev), 3);
    CHECK_EQ (t.noteOff (1, 60, 0, ev), 3);

    // Double note-on of the same key without a note-off doesn't leave stuck notes.
    notes[0] = 50;
    t.noteOn (1, 50, 100, notes, 1, ev);
    t.noteOn (1, 50, 100, notes, 1, ev);
    t.noteOff (1, 50, 0, ev);
    CHECK_EQ (t.isSounding (1, 50), false);

    // Release-all reports everything sounding.
    notes = { 60, 64, 67, 0, 0 };
    t.noteOn (3, 60, 100, notes, 3, ev);
    int released = 0;
    t.releaseAll (3, [&] (int, int) { ++released; });
    CHECK_EQ (released, 3);
    CHECK_EQ (t.isKeyHeld (3, 60), false);
}

static void testLibrary()
{
    const auto& scales = getScales();
    const auto& categories = getCategories();

    CHECK_EQ ((int) (scales.size() >= 160), 1);
    CHECK_EQ ((int) categories.size(), 17);
    CHECK_EQ (findScaleIndexById ("major"), 0);   // default scale must stay first
    CHECK_EQ ((int) (std::string_view (scales[0].name) == "Major"), 1);
    CHECK_EQ (findScaleIndexById ("no_such_scale"), -1);
    CHECK_EQ (findScaleIndexById (nullptr), -1);

    for (size_t i = 0; i < scales.size(); ++i)
    {
        const auto& s = scales[i];

        // Ids are unique, so lookups by id find the right entry.
        CHECK_EQ (findScaleIndexById (s.id), (int) i);
        for (size_t j = 0; j < i; ++j)
            if (std::strcmp (scales[j].id, s.id) == 0)
            {
                std::printf ("duplicate scale id '%s'\n", s.id);
                ++failures;
            }

        // Every scale contains its root, has a name, and belongs to a known category.
        CHECK_EQ ((int) (s.mask & 1u), 1);
        CHECK_EQ ((int) (s.name != nullptr && s.name[0] != '\0'), 1);
        CHECK_EQ ((int) (s.info != nullptr), 1);

        bool known = false;
        for (auto* c : categories)
            known = known || std::string_view (c) == s.category;
        if (! known)
            std::printf ("unknown category '%s' for scale '%s'\n", s.category, s.id);
        CHECK_EQ (known, true);
    }

    // Scale ids that older versions saved must still resolve.
    for (auto* id : { "major", "natural_minor", "harmonic_minor", "melodic_minor", "dorian", "phrygian",
                      "lydian", "mixolydian", "locrian", "phrygian_dominant", "major_pentatonic",
                      "minor_pentatonic", "blues", "harmonic_major", "whole_tone", "chromatic" })
        CHECK_EQ ((int) (findScaleIndexById (id) >= 0), 1);

    // Every category in the browser has at least one scale, and the first one is Major & Modes.
    CHECK_EQ ((int) (std::string_view (categories[0]) == "Major & Modes"), 1);
    CHECK_EQ ((int) (std::string_view (categories.back()) == "Other & Exotic"), 1);
    for (auto* c : categories)
    {
        int count = 0;
        for (const auto& s : scales)
            count += std::string_view (s.category) == c ? 1 : 0;
        if (count == 0)
            std::printf ("empty category '%s'\n", c);
        CHECK_EQ ((int) (count > 0), 1);
    }

    // The engine follows the library: D Dorian is C major shifted to start on D.
    ScaleEngine e;
    e.setScale (2, scaleIndex ("dorian"));
    for (int n : { 62, 64, 65, 67, 69, 71, 72 })
        CHECK_EQ (e.isInScale (n), true);
    CHECK_EQ (e.isInScale (63), false);

    // An out-of-range index falls back to the first scale (Major).
    e.setScale (0, 9999);
    CHECK_EQ (e.isInScale (61), false);
    CHECK_EQ (e.isInScale (62), true);
}

// Spot checks of scales from different traditions: the notes are the semitones above the root.
static void testWorldScales()
{
    auto maskOf = [] (const char* id) -> int
    {
        const int i = findScaleIndexById (id);
        return i < 0 ? -1 : (int) getScales()[(size_t) i].mask;
    };
    auto isApprox = [] (const char* id)
    {
        const int i = findScaleIndexById (id);
        return i >= 0 && std::string_view (getScales()[(size_t) i].info).substr (0, 16) == "Approx. 12-TET: ";
    };
    auto categoryOf = [] (const char* id) -> std::string_view
    {
        const int i = findScaleIndexById (id);
        return i < 0 ? std::string_view() : std::string_view (getScales()[(size_t) i].category);
    };

    CHECK_EQ (maskOf ("hirajoshi"), (int) makeMask ({ 0, 2, 3, 7, 8 }));
    CHECK_EQ (maskOf ("maqam_hijaz"), (int) makeMask ({ 0, 1, 4, 5, 7, 8, 10 }));
    CHECK_EQ (maskOf ("thaat_bhairav"), (int) makeMask ({ 0, 1, 4, 5, 7, 8, 11 }));
    CHECK_EQ (maskOf ("raga_malkauns"), (int) makeMask ({ 0, 3, 5, 8, 10 }));
    CHECK_EQ (maskOf ("hungarian_minor"), (int) makeMask ({ 0, 2, 3, 6, 7, 8, 11 }));
    CHECK_EQ (maskOf ("phrygian_dominant"), (int) makeMask ({ 0, 1, 4, 5, 7, 8, 10 }));
    CHECK_EQ (maskOf ("blues"), (int) makeMask ({ 0, 3, 5, 6, 7, 10 }));
    CHECK_EQ (maskOf ("major"), (int) makeMask ({ 0, 2, 4, 5, 7, 9, 11 }));

    CHECK_EQ ((int) (categoryOf ("hirajoshi") == "Japanese"), 1);
    CHECK_EQ ((int) (categoryOf ("maqam_hijaz") == "Arabic & Turkish"), 1);
    CHECK_EQ ((int) (categoryOf ("thaat_bhairav") == "Indian (Hindustani)"), 1);
    CHECK_EQ ((int) (categoryOf ("mela_shankarabharanam") == "Indian (Carnatic)"), 1);
    CHECK_EQ ((int) (categoryOf ("dastgah_shur") == "Persian"), 1);

    // Gamelan and quarter-tone scales are labelled as 12-TET approximations; exact ones are not.
    for (auto* id : { "slendro", "pelog_selisir", "pelog_tembung", "maqam_rast", "maqam_bayati", "maqam_saba",
                      "maqam_sikah", "dastgah_shur" })
        CHECK_EQ (isApprox (id), true);
    for (auto* id : { "major", "hirajoshi", "maqam_hijaz", "thaat_bhairav" })
        CHECK_EQ (isApprox (id), false);

    // The engine plays a world scale: Hirajoshi on A is A B C E F.
    ScaleEngine e;
    e.setScale (9, scaleIndex ("hirajoshi"));
    for (int n : { 57, 59, 60, 64, 65, 69 })
        CHECK_EQ (e.isInScale (n), true);
    for (int n : { 58, 61, 62, 63, 66, 67, 68 })
        CHECK_EQ (e.isInScale (n), false);
}

int main()
{
    testLibrary();
    testWorldScales();
    testSnapping();
    testChords();
    testTracker();

    if (failures == 0)
        std::printf ("All Scale Snap tests passed.\n");

    return failures == 0 ? 0 : 1;
}
