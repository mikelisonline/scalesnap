#pragma once

// The scale table. Pure C++ (no JUCE) so the engine and its tests can use it.
//
// To add a scale, append a row to getScales(); to add a category, add it to getCategories()
// (the order there is the order shown in the browser). Ids must be unique and never change
// once released, because saved sessions and favorites refer to scales by id. New scales
// should go at the end so that old automation (which stores the list position) keeps working.

#include <cstdint>
#include <cstring>
#include <initializer_list>
#include <vector>

namespace scalesnap
{

struct ScaleDef
{
    const char* id;       // stable identifier, e.g. "natural_minor"
    const char* name;     // shown in the UI
    const char* category; // must match an entry of getCategories()
    uint16_t mask;        // bit i set => semitone i above the root is in the scale
    const char* info;     // short description / character
};

constexpr uint16_t makeMask (std::initializer_list<int> degrees)
{
    uint16_t m = 0;
    for (auto d : degrees)
        m = (uint16_t) (m | (1u << d));
    return m;
}

inline const std::vector<ScaleDef>& getScales()
{
    static const std::vector<ScaleDef> scales {
        // Index 0 must stay Major: it is the default for new instances.
        { "major",             "Major",             "Major & Modes", makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),                      "Ionian. Bright and happy." },
        { "natural_minor",     "Natural Minor",     "Minor",         makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),                      "Aeolian. Dark, the everyday minor." },
        { "harmonic_minor",    "Harmonic Minor",    "Minor",         makeMask ({ 0, 2, 3, 5, 7, 8, 11 }),                      "Minor with a raised 7th. Dramatic, classical." },
        { "melodic_minor",     "Melodic Minor",     "Minor",         makeMask ({ 0, 2, 3, 5, 7, 9, 11 }),                      "Minor with raised 6th and 7th. Smooth, jazzy." },
        { "dorian",            "Dorian",            "Major & Modes", makeMask ({ 0, 2, 3, 5, 7, 9, 10 }),                      "Minor with a bright 6th. Funky, soulful." },
        { "phrygian",          "Phrygian",          "Major & Modes", makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),                      "Minor with a flat 2nd. Spanish, tense." },
        { "lydian",            "Lydian",            "Major & Modes", makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),                      "Major with a raised 4th. Dreamy, floating." },
        { "mixolydian",        "Mixolydian",        "Major & Modes", makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),                      "Major with a flat 7th. Bluesy, rock." },
        { "locrian",           "Locrian",           "Major & Modes", makeMask ({ 0, 1, 3, 5, 6, 8, 10 }),                      "Flat 2nd and flat 5th. Unstable, dark." },
        { "phrygian_dominant", "Phrygian Dominant", "Other & Exotic", makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),                     "Phrygian with a major 3rd. Flamenco, Middle Eastern." },
        { "major_pentatonic",  "Major Pentatonic",  "Pentatonic",    makeMask ({ 0, 2, 4, 7, 9 }),                             "Five notes, no clashes. Folk, pop, country." },
        { "minor_pentatonic",  "Minor Pentatonic",  "Pentatonic",    makeMask ({ 0, 3, 5, 7, 10 }),                            "Five notes. Rock, blues and hip-hop leads." },
        { "blues",             "Blues",             "Blues & Jazz",  makeMask ({ 0, 3, 5, 6, 7, 10 }),                         "Minor pentatonic plus the blue note." },
        { "harmonic_major",    "Harmonic Major",    "Other & Exotic", makeMask ({ 0, 2, 4, 5, 7, 8, 11 }),                     "Major with a flat 6th. Bittersweet." },
        { "whole_tone",        "Whole Tone",        "Symmetric",     makeMask ({ 0, 2, 4, 6, 8, 10 }),                         "Six equal steps. Dreamy, no resolution." },
        { "chromatic",         "Chromatic",         "Symmetric",     makeMask ({ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 }),      "All twelve notes. Nothing is corrected." },
    };
    return scales;
}

/** Ordered category names, as shown in the browser. */
inline const std::vector<const char*>& getCategories()
{
    static const std::vector<const char*> categories {
        "Major & Modes", "Minor", "Pentatonic", "Blues & Jazz", "Symmetric", "Other & Exotic"
    };
    return categories;
}

/** Position of the scale with this id in getScales(), or -1 if there is none. */
inline int findScaleIndexById (const char* id)
{
    if (id == nullptr)
        return -1;

    const auto& scales = getScales();
    for (size_t i = 0; i < scales.size(); ++i)
        if (std::strcmp (scales[i].id, id) == 0)
            return (int) i;

    return -1;
}

} // namespace scalesnap
