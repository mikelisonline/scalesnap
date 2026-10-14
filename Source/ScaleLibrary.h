#pragma once

// The scale table. Pure C++ (no JUCE) so the engine and its tests can use it.
//
// The table holds the Western modes plus scales from many traditions (Japanese, Chinese,
// Indian, Arabic, Persian, Jewish, Eastern European, Spanish, African, Indonesian and more).
// Every scale is a 12-tone-equal-temperament set. Scales that are normally played with
// microtones (maqam, dastgah, slendro, pelog) are rounded to the nearest semitone and their
// info text starts with "Approx. 12-TET:".
//
// To add a scale, add a row to getScales(); to add a category, add it to getCategories()
// (the order there is the order shown in the browser). Ids must be unique and never change
// once released, because saved sessions and favorites refer to scales by id. The plugin state
// stores the id, so the list order may change; only host automation of the Scale parameter
// refers to the list position, so prefer adding new scales at the end of their category.
// State saved by the first release has no id, only a position in its 16-entry list; see
// getLegacyScaleIds() / legacyScaleIndexToIndex().
// This table was generated from a reviewed list of scales; keep rows grouped by category.

#include <array>
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
        // Major & Modes
        { "major",                   "Major",                   "Major & Modes",         makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Ionian. Bright and happy." },
        { "dorian",                  "Dorian",                  "Major & Modes",         makeMask ({ 0, 2, 3, 5, 7, 9, 10 }),             "Minor with a bright 6th. Funky, soulful." },
        { "phrygian",                "Phrygian",                "Major & Modes",         makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Minor with a flat 2nd. Spanish, tense." },
        { "lydian",                  "Lydian",                  "Major & Modes",         makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),             "Major with a raised 4th. Dreamy, floating." },
        { "mixolydian",              "Mixolydian",              "Major & Modes",         makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Major with a flat 7th. Bluesy, rock." },
        { "aeolian",                 "Aeolian",                 "Major & Modes",         makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),             "Church mode VI; = natural minor, Asavari thaat" },
        { "locrian",                 "Locrian",                 "Major & Modes",         makeMask ({ 0, 1, 3, 5, 6, 8, 10 }),             "Flat 2nd and flat 5th. Unstable, dark." },
        { "harmonic_major",          "Harmonic Major",          "Major & Modes",         makeMask ({ 0, 2, 4, 5, 7, 8, 11 }),             "Major with a flat 6th. Bittersweet." },
        { "locrian_nat6",            "Locrian #6",              "Major & Modes",         makeMask ({ 0, 1, 3, 5, 6, 9, 10 }),             "Mode 2 of harmonic minor" },
        { "ionian_aug",              "Ionian #5",               "Major & Modes",         makeMask ({ 0, 2, 4, 5, 8, 9, 11 }),             "Mode 3 of harmonic minor; a.k.a. Ionian augmented" },
        { "lydian_sharp2",           "Lydian #2",               "Major & Modes",         makeMask ({ 0, 3, 4, 6, 7, 9, 11 }),             "Mode 6 of harmonic minor; a.k.a. Lydian #9" },
        // Minor
        { "natural_minor",           "Natural Minor",           "Minor",                 makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),             "Aeolian. Dark, the everyday minor." },
        { "harmonic_minor",          "Harmonic Minor",          "Minor",                 makeMask ({ 0, 2, 3, 5, 7, 8, 11 }),             "Minor with a raised 7th. Dramatic, classical." },
        { "melodic_minor",           "Melodic Minor",           "Minor",                 makeMask ({ 0, 2, 3, 5, 7, 9, 11 }),             "Minor with raised 6th and 7th. Smooth, jazzy." },
        { "neapolitan_minor",        "Neapolitan Minor",        "Minor",                 makeMask ({ 0, 1, 3, 5, 7, 8, 11 }),             "Harmonic minor with b2" },
        { "neapolitan_major",        "Neapolitan Major",        "Minor",                 makeMask ({ 0, 1, 3, 5, 7, 9, 11 }),             "Melodic minor with b2; 'major' refers to its 6th and 7th" },
        // Pentatonic
        { "major_pentatonic",        "Major Pentatonic",        "Pentatonic",            makeMask ({ 0, 2, 4, 7, 9 }),                    "Five notes, no clashes. Folk, pop, country." },
        { "egyptian_pentatonic",     "Egyptian (Suspended)",    "Pentatonic",            makeMask ({ 0, 2, 5, 7, 10 }),                   "Mode 2 of major pentatonic; = Shang, Madhyamavati" },
        { "blues_minor_pentatonic",  "Man Gong (Blues Minor)",  "Pentatonic",            makeMask ({ 0, 3, 5, 8, 10 }),                   "Mode 3 of major pentatonic; = Jue, Malkauns, Hindolam" },
        { "blues_major_pentatonic",  "Ritsusen (Blues Major)",  "Pentatonic",            makeMask ({ 0, 2, 5, 7, 9 }),                    "Mode 4 of major pentatonic; = Zhi, Yo, Durga" },
        { "minor_pentatonic",        "Minor Pentatonic",        "Pentatonic",            makeMask ({ 0, 3, 5, 7, 10 }),                   "Five notes. Rock, blues and hip-hop leads." },
        { "dominant_pentatonic",     "Dominant Pentatonic",     "Pentatonic",            makeMask ({ 0, 2, 4, 7, 10 }),                   "1 2 3 5 b7; over dominant 7th chords" },
        { "minor6_pentatonic",       "Minor 6 Pentatonic",      "Pentatonic",            makeMask ({ 0, 3, 5, 7, 9 }),                    "1 b3 4 5 6; minor added-sixth pentatonic" },
        { "major_hexatonic",         "Major Hexatonic",         "Pentatonic",            makeMask ({ 0, 2, 4, 5, 7, 9 }),                 "Major without 7th; Guidonian hexachord" },
        { "minor_hexatonic",         "Minor Hexatonic",         "Pentatonic",            makeMask ({ 0, 2, 3, 5, 7, 10 }),                "Minor without 6th (most common form; some lists use maj7)" },
        // Blues & Jazz
        { "blues",                   "Blues",                   "Blues & Jazz",          makeMask ({ 0, 3, 5, 6, 7, 10 }),                "Minor pentatonic plus the blue note." },
        { "blues_major",             "Blues (Major)",           "Blues & Jazz",          makeMask ({ 0, 2, 3, 4, 7, 9 }),                 "Major pentatonic + b3" },
        { "bebop_dominant",          "Bebop Dominant",          "Blues & Jazz",          makeMask ({ 0, 2, 4, 5, 7, 9, 10, 11 }),         "Mixolydian + maj7 passing tone (Baker)" },
        { "bebop_major",             "Bebop Major",             "Blues & Jazz",          makeMask ({ 0, 2, 4, 5, 7, 8, 9, 11 }),          "Major + #5/b6 passing tone (Baker)" },
        { "bebop_dorian",            "Bebop Dorian",            "Blues & Jazz",          makeMask ({ 0, 2, 3, 4, 5, 7, 9, 10 }),          "Dorian + maj3 passing tone (Baker); some use maj7 instead" },
        { "bebop_melodic_minor",     "Bebop Melodic Minor",     "Blues & Jazz",          makeMask ({ 0, 2, 3, 5, 7, 8, 9, 11 }),          "Melodic minor + b6 passing tone" },
        { "altered",                 "Altered",                 "Blues & Jazz",          makeMask ({ 0, 1, 3, 4, 6, 8, 10 }),             "Super Locrian; mode 7 of melodic minor" },
        { "lydian_dominant",         "Lydian Dominant",         "Blues & Jazz",          makeMask ({ 0, 2, 4, 6, 7, 9, 10 }),             "Overtone / Lydian b7; mode 4 of melodic minor; = Vachaspati" },
        { "lydian_augmented",        "Lydian Augmented",        "Blues & Jazz",          makeMask ({ 0, 2, 4, 6, 8, 9, 11 }),             "Mode 3 of melodic minor" },
        { "half_diminished",         "Half-Diminished",         "Blues & Jazz",          makeMask ({ 0, 2, 3, 5, 6, 8, 10 }),             "Locrian #2; mode 6 of melodic minor" },
        { "dorian_b2",               "Dorian b2",               "Blues & Jazz",          makeMask ({ 0, 1, 3, 5, 7, 9, 10 }),             "Phrygian #6; mode 2 of melodic minor" },
        { "mixolydian_b6",           "Mixolydian b6",           "Blues & Jazz",          makeMask ({ 0, 2, 4, 5, 7, 8, 10 }),             "Aeolian dominant / 'Hindu'; mode 5 of melodic minor; = Charukesi" },
        // Symmetric
        { "whole_tone",              "Whole Tone",              "Symmetric",             makeMask ({ 0, 2, 4, 6, 8, 10 }),                "Six equal steps. Dreamy, no resolution." },
        { "diminished_wh",           "Diminished (W-H)",        "Symmetric",             makeMask ({ 0, 2, 3, 5, 6, 8, 9, 11 }),          "Octatonic, whole-half; over dim7 chords" },
        { "diminished_hw",           "Diminished (H-W)",        "Symmetric",             makeMask ({ 0, 1, 3, 4, 6, 7, 9, 10 }),          "Octatonic, half-whole; Messiaen mode 2; over 7b9 chords" },
        { "augmented",               "Augmented",               "Symmetric",             makeMask ({ 0, 3, 4, 7, 8, 11 }),                "Hexatonic, alternating m3 and m2 steps" },
        { "augmented_inverse",       "Six-Tone Symmetric",      "Symmetric",             makeMask ({ 0, 1, 4, 5, 8, 9 }),                 "Augmented inverse; alternating m2 and m3 steps" },
        { "tritone",                 "Tritone",                 "Symmetric",             makeMask ({ 0, 1, 4, 6, 7, 10 }),                "Two major triads a tritone apart (Petrushka-type)" },
        { "messiaen_3",              "Messiaen Mode 3",         "Symmetric",             makeMask ({ 0, 2, 3, 4, 6, 7, 8, 10, 11 }),      "Mode of limited transposition 3 (W-H-H repeated)" },
        { "messiaen_4",              "Messiaen Mode 4",         "Symmetric",             makeMask ({ 0, 1, 2, 5, 6, 7, 8, 11 }),          "Mode of limited transposition 4" },
        { "messiaen_5",              "Messiaen Mode 5",         "Symmetric",             makeMask ({ 0, 1, 5, 6, 7, 11 }),                "Mode of limited transposition 5" },
        { "messiaen_6",              "Messiaen Mode 6",         "Symmetric",             makeMask ({ 0, 2, 4, 5, 6, 8, 10, 11 }),         "Mode of limited transposition 6" },
        { "messiaen_7",              "Messiaen Mode 7",         "Symmetric",             makeMask ({ 0, 1, 2, 3, 5, 6, 7, 8, 9, 11 }),    "Mode of limited transposition 7" },
        { "chromatic",               "Chromatic",               "Symmetric",             makeMask ({ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 }), "All twelve notes. Nothing is corrected." },
        // Japanese
        { "hirajoshi",               "Hirajoshi",               "Japanese",              makeMask ({ 0, 2, 3, 7, 8 }),                    "Koto tuning; Speed/Kostka-Payne form; other authors give rotations" },
        { "in_miyakobushi",          "In (Miyako-bushi)",       "Japanese",              makeMask ({ 0, 1, 5, 7, 8 }),                    "Sakura scale; = Kumoijoshi koto tuning" },
        { "insen",                   "Insen",                   "Japanese",              makeMask ({ 0, 1, 5, 7, 10 }),                   "In scale with b7 instead of b6; shakuhachi" },
        { "iwato",                   "Iwato",                   "Japanese",              makeMask ({ 0, 1, 5, 6, 10 }),                   "Mode of In scale; = Hirajoshi per Sachs/Slonimsky" },
        { "kumoi",                   "Kumoi",                   "Japanese",              makeMask ({ 0, 2, 3, 7, 9 }),                    "1 2 b3 5 6; a.k.a. Akebono I (Western-book form)" },
        { "yo",                      "Yo",                      "Japanese",              makeMask ({ 0, 2, 5, 7, 9 }),                    "Anhemitonic folk scale (steps 2-3-2-2-3); = Ritsu pentatonic" },
        { "minyo",                   "Min'yo",                  "Japanese",              makeMask ({ 0, 3, 5, 7, 10 }),                   "Folk-song scale in Koizumi's tetrachord theory" },
        { "ryukyu",                  "Ryukyu (Okinawan)",       "Japanese",              makeMask ({ 0, 4, 5, 7, 11 }),                   "Okinawan folk scale; same set as Ethiopian Bati major" },
        // Chinese
        { "gong",                    "Gong",                    "Chinese",               makeMask ({ 0, 2, 4, 7, 9 }),                    "Pentatonic mode on gong (do); = major pentatonic" },
        { "shang",                   "Shang",                   "Chinese",               makeMask ({ 0, 2, 5, 7, 10 }),                   "Pentatonic mode on shang (re)" },
        { "jue",                     "Jue",                     "Chinese",               makeMask ({ 0, 3, 5, 8, 10 }),                   "Pentatonic mode on jue (mi)" },
        { "zhi",                     "Zhi",                     "Chinese",               makeMask ({ 0, 2, 5, 7, 9 }),                    "Pentatonic mode on zhi (sol)" },
        { "yu",                      "Yu",                      "Chinese",               makeMask ({ 0, 3, 5, 7, 10 }),                   "Pentatonic mode on yu (la); = minor pentatonic" },
        { "qingyue",                 "Qingyue (Heptatonic)",    "Chinese",               makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Gong scale + qingjue (4) & biangong (7); = Ionian" },
        { "yayue",                   "Yayue (Heptatonic)",      "Chinese",               makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),             "Gong scale + bianzhi (#4) & biangong (7); = Lydian" },
        { "yanyue",                  "Yanyue (Heptatonic)",     "Chinese",               makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Gong scale + qingjue (4) & run (b7); = Mixolydian" },
        // Indian (Hindustani)
        { "thaat_bilawal",           "Bilawal",                 "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Thaat; = Major / Ionian" },
        { "thaat_kalyan",            "Kalyan",                  "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),             "Thaat (tivra Ma); = Lydian" },
        { "thaat_khamaj",            "Khamaj",                  "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Thaat (komal Ni); = Mixolydian" },
        { "thaat_kafi",              "Kafi",                    "Indian (Hindustani)",   makeMask ({ 0, 2, 3, 5, 7, 9, 10 }),             "Thaat (komal Ga, Ni); = Dorian" },
        { "thaat_asavari",           "Asavari",                 "Indian (Hindustani)",   makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),             "Thaat (komal Ga, Dha, Ni); = Aeolian" },
        { "thaat_bhairavi",          "Bhairavi",                "Indian (Hindustani)",   makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Thaat (komal Re, Ga, Dha, Ni); = Phrygian" },
        { "thaat_bhairav",           "Bhairav",                 "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 5, 7, 8, 11 }),             "Thaat (komal Re, Dha); = Double Harmonic, Mayamalavagowla" },
        { "thaat_marwa",             "Marwa (Thaat)",           "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 6, 7, 9, 11 }),             "Thaat (komal Re, tivra Ma); = Gamanashrama" },
        { "thaat_purvi",             "Purvi",                   "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 6, 7, 8, 11 }),             "Thaat (komal Re, Dha, tivra Ma); = Kamavardhani" },
        { "thaat_todi",              "Todi",                    "Indian (Hindustani)",   makeMask ({ 0, 1, 3, 6, 7, 8, 11 }),             "Thaat (komal Re, Ga, Dha, tivra Ma); = Shubhapantuvarali" },
        { "raga_yaman",              "Yaman",                   "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),             "Raga of Kalyan thaat; same notes as thaat (asc. often skips Sa/Pa)" },
        { "raga_bhupali",            "Bhupali",                 "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 7, 9 }),                    "Raga, audav S R G P D; = Mohanam / major pentatonic" },
        { "raga_durga",              "Durga",                   "Indian (Hindustani)",   makeMask ({ 0, 2, 5, 7, 9 }),                    "Raga, audav S R M P D (Bilawal thaat)" },
        { "raga_malkauns",           "Malkauns",                "Indian (Hindustani)",   makeMask ({ 0, 3, 5, 8, 10 }),                   "Raga, audav S g M d n (Bhairavi thaat); = Hindolam" },
        { "raga_bageshri",           "Bageshri",                "Indian (Hindustani)",   makeMask ({ 0, 2, 3, 5, 9, 10 }),                "Raga (Kafi thaat); Pa omitted (used sparingly in descent)" },
        { "raga_desh",               "Desh",                    "Indian (Hindustani)",   makeMask ({ 0, 2, 4, 5, 7, 9, 10, 11 }),         "Raga; union: asc S R M P N, desc S n D P M G R" },
        { "raga_marwa",              "Marwa",                   "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 6, 9, 11 }),                "Raga, shadav S r G M D N, Pa omitted" },
        { "raga_lalit",              "Lalit",                   "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 5, 6, 8, 11 }),             "Raga with both Ma, Pa omitted; komal Dha form (some use shuddha)" },
        { "raga_ahir_bhairav",       "Ahir Bhairav",            "Indian (Hindustani)",   makeMask ({ 0, 1, 4, 5, 7, 9, 10 }),             "Raga; Bhairav lower + Kafi upper; = Chakravakam" },
        { "raga_jog",                "Jog",                     "Indian (Hindustani)",   makeMask ({ 0, 3, 4, 5, 7, 10 }),                "Raga; union: asc S G M P n, desc uses komal Ga too" },
        { "raga_bairagi",            "Bairagi",                 "Indian (Hindustani)",   makeMask ({ 0, 1, 5, 7, 10 }),                   "Raga, audav S r M P n; = Revati / Insen set" },
        { "raga_madhmad_sarang",     "Madhmad Sarang",          "Indian (Hindustani)",   makeMask ({ 0, 2, 5, 7, 10 }),                   "Raga, audav S R M P n" },
        { "raga_shivranjani",        "Shivranjani",             "Indian (Hindustani)",   makeMask ({ 0, 2, 3, 7, 9 }),                    "Raga, audav S R g P D" },
        { "raga_hindol",             "Hindol",                  "Indian (Hindustani)",   makeMask ({ 0, 4, 6, 9, 11 }),                   "Raga, audav S G M# D N (Kalyan thaat); not Carnatic Hindolam" },
        // Indian (Carnatic)
        { "mela_hanumatodi",         "Hanumatodi (Todi)",       "Indian (Carnatic)",     makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Melakarta 8; = Phrygian, Bhairavi thaat" },
        { "mela_vakulabharanam",     "Vakulabharanam",          "Indian (Carnatic)",     makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),             "Melakarta 14; = Phrygian Dominant" },
        { "mela_mayamalavagowla",    "Mayamalavagowla",         "Indian (Carnatic)",     makeMask ({ 0, 1, 4, 5, 7, 8, 11 }),             "Melakarta 15; = Bhairav thaat / Double Harmonic" },
        { "mela_chakravakam",        "Chakravakam",             "Indian (Carnatic)",     makeMask ({ 0, 1, 4, 5, 7, 9, 10 }),             "Melakarta 16; = Ahir Bhairav" },
        { "mela_natabhairavi",       "Natabhairavi",            "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),             "Melakarta 20; = natural minor" },
        { "mela_kiravani",           "Kiravani",                "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 5, 7, 8, 11 }),             "Melakarta 21; = harmonic minor (Hindustani Kirwani)" },
        { "mela_kharaharapriya",     "Kharaharapriya",          "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 5, 7, 9, 10 }),             "Melakarta 22; = Dorian, Kafi thaat" },
        { "mela_gourimanohari",      "Gourimanohari",           "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 5, 7, 9, 11 }),             "Melakarta 23; = melodic minor (ascending)" },
        { "mela_charukesi",          "Charukesi",               "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 5, 7, 8, 10 }),             "Melakarta 26; = Mixolydian b6" },
        { "mela_harikambhoji",       "Harikambhoji",            "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Melakarta 28; = Mixolydian, Khamaj thaat" },
        { "mela_shankarabharanam",   "Shankarabharanam",        "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Melakarta 29 (Dheerasankarabharanam); = Major" },
        { "mela_shubhapantuvarali",  "Shubhapantuvarali",       "Indian (Carnatic)",     makeMask ({ 0, 1, 3, 6, 7, 8, 11 }),             "Melakarta 45; = Todi thaat" },
        { "mela_kamavardhani",       "Pantuvarali",             "Indian (Carnatic)",     makeMask ({ 0, 1, 4, 6, 7, 8, 11 }),             "Melakarta 51 (Kamavardhani); = Purvi thaat" },
        { "mela_simhendramadhyamam", "Simhendramadhyamam",      "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 6, 7, 8, 11 }),             "Melakarta 57; = Hungarian minor" },
        { "mela_dharmavati",         "Dharmavati",              "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 6, 7, 9, 11 }),             "Melakarta 59; melodic minor with #4" },
        { "mela_vachaspati",         "Vachaspati",              "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 6, 7, 9, 10 }),             "Melakarta 64; = Lydian Dominant" },
        { "mela_mechakalyani",       "Kalyani",                 "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 6, 7, 9, 11 }),             "Melakarta 65 (Mechakalyani); = Lydian, Kalyan thaat" },
        { "raga_mohanam",            "Mohanam",                 "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 7, 9 }),                    "Janya of 28, S R2 G3 P D2; = Bhupali" },
        { "raga_hindolam",           "Hindolam",                "Indian (Carnatic)",     makeMask ({ 0, 3, 5, 8, 10 }),                   "Janya of 20, S G2 M1 D1 N2; = Malkauns" },
        { "raga_hamsadhwani",        "Hamsadhwani",             "Indian (Carnatic)",     makeMask ({ 0, 2, 4, 7, 11 }),                   "Janya of 29, S R2 G3 P N3" },
        { "raga_abhogi",             "Abhogi",                  "Indian (Carnatic)",     makeMask ({ 0, 2, 3, 5, 9 }),                    "Janya of 22, S R2 G2 M1 D2" },
        { "raga_madhyamavati",       "Madhyamavati",            "Indian (Carnatic)",     makeMask ({ 0, 2, 5, 7, 10 }),                   "Janya of 22, S R2 M1 P N2; = Madhmad Sarang" },
        { "raga_shuddha_saveri",     "Shuddha Saveri",          "Indian (Carnatic)",     makeMask ({ 0, 2, 5, 7, 9 }),                    "Janya of 29, S R2 M1 P D2; = Durga" },
        { "raga_shuddha_dhanyasi",   "Shuddha Dhanyasi",        "Indian (Carnatic)",     makeMask ({ 0, 3, 5, 7, 10 }),                   "S G2 M1 P N2 (Udayaravichandrika); sources vary on Ni" },
        { "raga_revati",             "Revati",                  "Indian (Carnatic)",     makeMask ({ 0, 1, 5, 7, 10 }),                   "Janya of 2, S R1 M1 P N2; = Bairagi" },
        { "raga_amritavarshini",     "Amritavarshini",          "Indian (Carnatic)",     makeMask ({ 0, 4, 6, 7, 11 }),                   "Janya of 66, S G3 M2 P N3" },
        // Arabic & Turkish
        { "maqam_ajam",              "Ajam",                    "Arabic & Turkish",      makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Maqam Ajam; = major scale" },
        { "maqam_nahawand",          "Nahawand",                "Arabic & Turkish",      makeMask ({ 0, 2, 3, 5, 7, 8, 11 }),             "Ascending form (Hijaz upper jins); descends with b7 (Kurd)" },
        { "maqam_kurd",              "Kurd",                    "Arabic & Turkish",      makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Maqam Kurd; = Phrygian" },
        { "maqam_hijaz",             "Hijaz",                   "Arabic & Turkish",      makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),             "Hijaz + Nahawand on 4th; = Phrygian dominant; Turkish Hicaz" },
        { "maqam_hijazkar",          "Hijazkar",                "Arabic & Turkish",      makeMask ({ 0, 1, 4, 5, 7, 8, 11 }),             "Hijaz on 1 & 5; = Double Harmonic; Turkish Hicazkar" },
        { "maqam_zanjaran",          "Zanjaran",                "Arabic & Turkish",      makeMask ({ 0, 1, 4, 5, 7, 9, 10 }),             "Hijaz + Ajam on 4th (Hijaz family)" },
        { "maqam_nikriz",            "Nikriz",                  "Arabic & Turkish",      makeMask ({ 0, 2, 3, 6, 7, 9, 10 }),             "Nikriz + Nahawand on 5th; = Ukrainian Dorian" },
        { "maqam_nawa_athar",        "Nawa Athar",              "Arabic & Turkish",      makeMask ({ 0, 2, 3, 6, 7, 8, 11 }),             "Nawa Athar + Hijaz on 5th; = Hungarian minor" },
        { "maqam_athar_kurd",        "Athar Kurd",              "Arabic & Turkish",      makeMask ({ 0, 1, 3, 6, 7, 8, 11 }),             "Athar Kurd + Hijaz on 5th; = Todi thaat" },
        { "maqam_bayati",            "Bayati",                  "Arabic & Turkish",      makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Approx. 12-TET: Half-flat 2nd rounded down (= Kurd set)" },
        { "maqam_rast",              "Rast",                    "Arabic & Turkish",      makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Approx. 12-TET: Half-flat 3rd rounded up, 7th as desc. b7" },
        { "maqam_saba",              "Saba",                    "Arabic & Turkish",      makeMask ({ 0, 1, 3, 4, 7, 8, 10 }),             "Approx. 12-TET: Half-flat 2nd rounded down (= Saba Zamzam)" },
        { "maqam_sikah",             "Sikah",                   "Arabic & Turkish",      makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Approx. 12-TET: Half-flat tonic rounded up, all steps round down" },
        { "makam_suzinak",           "Suzinak",                 "Arabic & Turkish",      makeMask ({ 0, 2, 4, 5, 7, 8, 11 }),             "Approx. 12-TET: Rast + Hijaz on 5th, 3rd rounded up" },
        // Persian
        { "dastgah_shur",            "Shur",                    "Persian",               makeMask ({ 0, 1, 3, 5, 7, 8, 10 }),             "Approx. 12-TET: Koron 2nd rounded down; 5th may be lowered" },
        { "dastgah_homayun",         "Homayun",                 "Persian",               makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),             "Approx. 12-TET: On G; koron 2nd rounded down" },
        { "dastgah_chahargah",       "Chahargah",               "Persian",               makeMask ({ 0, 1, 4, 5, 7, 8, 11 }),             "Approx. 12-TET: Koron 2nd and 6th rounded down" },
        { "dastgah_mahur",           "Mahur",                   "Persian",               makeMask ({ 0, 2, 4, 5, 7, 9, 11 }),             "Dastgah Mahur; = major (also Rast-Panjgah scale)" },
        // Jewish & Klezmer
        { "ahava_rabbah",            "Ahava Rabbah (Freygish)", "Jewish & Klezmer",      makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),             "Ashkenazi prayer mode; = Phrygian dominant / Hijaz" },
        { "mi_sheberach",            "Mi Sheberach",            "Jewish & Klezmer",      makeMask ({ 0, 2, 3, 6, 7, 9, 10 }),             "Altered/Ukrainian Dorian (Av HaRachamim); klezmer" },
        { "adonai_malach",           "Adonai Malach",           "Jewish & Klezmer",      makeMask ({ 0, 2, 4, 5, 7, 9, 10 }),             "Ashkenazi prayer mode; major with b7 (core form)" },
        { "magen_avot",              "Magen Avot",              "Jewish & Klezmer",      makeMask ({ 0, 2, 3, 5, 7, 8, 10 }),             "Ashkenazi prayer mode; resembles natural minor" },
        // Eastern European
        { "hungarian_minor",         "Hungarian Minor",         "Eastern European",      makeMask ({ 0, 2, 3, 6, 7, 8, 11 }),             "Harmonic minor with #4; = Nawa Athar" },
        { "hungarian_major",         "Hungarian Major",         "Eastern European",      makeMask ({ 0, 3, 4, 6, 7, 9, 10 }),             "1 #2 3 #4 5 6 b7" },
        { "romanian_minor",          "Romanian Minor",          "Eastern European",      makeMask ({ 0, 2, 3, 6, 7, 9, 10 }),             "= Ukrainian Dorian / Dorian #4 / Mi Sheberach" },
        { "romanian_major",          "Romanian Major",          "Eastern European",      makeMask ({ 0, 1, 4, 6, 7, 9, 10 }),             "1 b2 3 #4 5 6 b7" },
        { "gypsy_minor",             "Gypsy (Romani Minor)",    "Eastern European",      makeMask ({ 0, 2, 3, 6, 7, 8, 10 }),             "Romani scale; 'Gypsy' also used for Hungarian minor" },
        { "double_harmonic",         "Double Harmonic",         "Eastern European",      makeMask ({ 0, 1, 4, 5, 7, 8, 11 }),             "Byzantine / Gypsy major; = Hijazkar, Bhairav" },
        // Spanish & Flamenco
        { "phrygian_dominant",       "Phrygian Dominant",       "Spanish & Flamenco",    makeMask ({ 0, 1, 4, 5, 7, 8, 10 }),             "Phrygian with a major 3rd. Flamenco, Middle Eastern." },
        { "flamenco_mode",           "Flamenco (Andalusian)",   "Spanish & Flamenco",    makeMask ({ 0, 1, 3, 4, 5, 7, 8, 10 }),          "Phrygian with both 3rds (Andalusian cadence mode)" },
        { "spanish_8_tone",          "Spanish 8-Tone",          "Spanish & Flamenco",    makeMask ({ 0, 1, 3, 4, 5, 6, 8, 10 }),          "Espla's scale; Phrygian with maj3 and b5" },
        // African
        { "tizita_major",            "Tizita Major",            "African",               makeMask ({ 0, 2, 4, 7, 9 }),                    "Ethiopian qenet; = major pentatonic" },
        { "tizita_minor",            "Tizita Minor",            "African",               makeMask ({ 0, 2, 3, 7, 8 }),                    "Ethiopian qenet ('half Tizita'); some list b6->6" },
        { "bati_major",              "Bati Major",              "African",               makeMask ({ 0, 4, 5, 7, 11 }),                   "Ethiopian qenet; = Ryukyu set; sources vary" },
        { "bati_minor",              "Bati Minor",              "African",               makeMask ({ 0, 3, 5, 7, 10 }),                   "Ethiopian qenet; = minor pentatonic (most cited form)" },
        { "ambassel",                "Ambassel",                "African",               makeMask ({ 0, 1, 5, 7, 8 }),                    "Ethiopian qenet; = In/Miyako-bushi set" },
        { "anchihoye",               "Anchihoye",               "African",               makeMask ({ 0, 1, 5, 6, 9 }),                    "Ethiopian qenet; 1 b2 4 b5 6" },
        // Indonesian & SE Asian
        { "slendro",                 "Slendro",                 "Indonesian & SE Asian", makeMask ({ 0, 2, 5, 7, 9 }),                    "Approx. 12-TET: ~5 equal steps (~240c each)" },
        { "pelog_selisir",           "Pelog Selisir",           "Indonesian & SE Asian", makeMask ({ 0, 1, 3, 7, 8 }),                    "Approx. 12-TET: Balinese pelog degrees 1 2 3 5 6" },
        { "pelog_tembung",           "Pelog Tembung",           "Indonesian & SE Asian", makeMask ({ 0, 1, 5, 7, 8 }),                    "Approx. 12-TET: Balinese pelog degrees 1 2 4 5 6" },
        // Other & Exotic
        { "enigmatic",               "Enigmatic",               "Other & Exotic",        makeMask ({ 0, 1, 4, 6, 8, 10, 11 }),            "Verdi's scala enigmatica (ascending form)" },
        { "prometheus",              "Prometheus (Mystic)",     "Other & Exotic",        makeMask ({ 0, 2, 4, 6, 9, 10 }),                "Scriabin's mystic chord as a scale" },
        { "persian_western",         "Persian (Western)",       "Other & Exotic",        makeMask ({ 0, 1, 4, 5, 6, 8, 11 }),             "Western-theory name; not a Persian dastgah" },
        { "oriental",                "Oriental",                "Other & Exotic",        makeMask ({ 0, 1, 4, 5, 6, 9, 10 }),             "Western-theory name; 1 b2 3 4 b5 6 b7" },
        { "arabian",                 "Arabian (Major Locrian)", "Other & Exotic",        makeMask ({ 0, 2, 4, 5, 6, 8, 10 }),             "Western-theory name; not an Arabic maqam" },
        { "balinese",                "Balinese",                "Other & Exotic",        makeMask ({ 0, 1, 3, 7, 8 }),                    "Western-book name; = Pelog Selisir set" },
        { "hawaiian",                "Hawaiian",                "Other & Exotic",        makeMask ({ 0, 2, 3, 5, 7, 9, 11 }),             "Western-book name; = melodic minor (some lists omit 4th)" },
    };
    return scales;
}

/** Ordered category names, as shown in the browser. */
inline const std::vector<const char*>& getCategories()
{
    static const std::vector<const char*> categories {
        "Major & Modes",
        "Minor",
        "Pentatonic",
        "Blues & Jazz",
        "Symmetric",
        "Japanese",
        "Chinese",
        "Indian (Hindustani)",
        "Indian (Carnatic)",
        "Arabic & Turkish",
        "Persian",
        "Jewish & Klezmer",
        "Eastern European",
        "Spanish & Flamenco",
        "African",
        "Indonesian & SE Asian",
        "Other & Exotic"
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

/** The scales of the first release, in the order of its 16-entry list.
    That release saved only the position in this list (there was no scale id), and host
    automation of the Scale parameter was written against it. This table is frozen: never edit it. */
inline const std::array<const char*, 16>& getLegacyScaleIds()
{
    static const std::array<const char*, 16> ids {{ "major", "natural_minor", "harmonic_minor", "melodic_minor",
                                                    "dorian", "phrygian", "lydian", "mixolydian", "locrian",
                                                    "phrygian_dominant", "major_pentatonic", "minor_pentatonic",
                                                    "blues", "harmonic_major", "whole_tone", "chromatic" }};
    return ids;
}

/** Position in getScales() of the scale that sat at this position in the first release's list,
    or -1 if the first release had no such position. */
inline int legacyScaleIndexToIndex (int legacyIndex)
{
    const auto& ids = getLegacyScaleIds();

    if (legacyIndex < 0 || legacyIndex >= (int) ids.size())
        return -1;

    return findScaleIndexById (ids[(size_t) legacyIndex]);
}

} // namespace scalesnap
