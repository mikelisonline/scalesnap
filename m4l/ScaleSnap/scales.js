/* GENERATED FILE - DO NOT EDIT.
 * Source: Source/ScaleLibrary.h   Generator: m4l/tools/gen_scales.py
 * Regenerate with: python3 m4l/tools/gen_scales.py
 *
 * ES5 module: loads in Max's legacy [js] object (global ScaleSnapScales) and in Node (require).
 * mask: 12-bit pitch-class set, bit i set => i semitones above the root is in the scale.
 * uid:  stable 24-bit id hash (FNV-1a of `id`), stored in the Live Set instead of the list index.
 */
var ScaleSnapScales = (function () {
    var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    var CATEGORIES = [
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
    ];

    var SCALES = [
        { id: "major", name: "Major", category: "Major & Modes", mask: 2741, uid: 4114085, info: "Ionian. Bright and happy." },
        { id: "dorian", name: "Dorian", category: "Major & Modes", mask: 1709, uid: 10467561, info: "Minor with a bright 6th. Funky, soulful." },
        { id: "phrygian", name: "Phrygian", category: "Major & Modes", mask: 1451, uid: 124060, info: "Minor with a flat 2nd. Spanish, tense." },
        { id: "lydian", name: "Lydian", category: "Major & Modes", mask: 2773, uid: 11048933, info: "Major with a raised 4th. Dreamy, floating." },
        { id: "mixolydian", name: "Mixolydian", category: "Major & Modes", mask: 1717, uid: 7051683, info: "Major with a flat 7th. Bluesy, rock." },
        { id: "aeolian", name: "Aeolian", category: "Major & Modes", mask: 1453, uid: 14882563, info: "Church mode VI; = natural minor, Asavari thaat" },
        { id: "locrian", name: "Locrian", category: "Major & Modes", mask: 1387, uid: 2750290, info: "Flat 2nd and flat 5th. Unstable, dark." },
        { id: "harmonic_major", name: "Harmonic Major", category: "Major & Modes", mask: 2485, uid: 12405287, info: "Major with a flat 6th. Bittersweet." },
        { id: "locrian_nat6", name: "Locrian #6", category: "Major & Modes", mask: 1643, uid: 10693115, info: "Mode 2 of harmonic minor" },
        { id: "ionian_aug", name: "Ionian #5", category: "Major & Modes", mask: 2869, uid: 10589894, info: "Mode 3 of harmonic minor; a.k.a. Ionian augmented" },
        { id: "lydian_sharp2", name: "Lydian #2", category: "Major & Modes", mask: 2777, uid: 7163525, info: "Mode 6 of harmonic minor; a.k.a. Lydian #9" },
        { id: "natural_minor", name: "Natural Minor", category: "Minor", mask: 1453, uid: 7202807, info: "Aeolian. Dark, the everyday minor." },
        { id: "harmonic_minor", name: "Harmonic Minor", category: "Minor", mask: 2477, uid: 6555413, info: "Minor with a raised 7th. Dramatic, classical." },
        { id: "melodic_minor", name: "Melodic Minor", category: "Minor", mask: 2733, uid: 2495534, info: "Minor with raised 6th and 7th. Smooth, jazzy." },
        { id: "neapolitan_minor", name: "Neapolitan Minor", category: "Minor", mask: 2475, uid: 13663917, info: "Harmonic minor with b2" },
        { id: "neapolitan_major", name: "Neapolitan Major", category: "Minor", mask: 2731, uid: 11832134, info: "Melodic minor with b2; 'major' refers to its 6th and 7th" },
        { id: "major_pentatonic", name: "Major Pentatonic", category: "Pentatonic", mask: 661, uid: 10656278, info: "Five notes, no clashes. Folk, pop, country." },
        { id: "egyptian_pentatonic", name: "Egyptian (Suspended)", category: "Pentatonic", mask: 1189, uid: 14560018, info: "Mode 2 of major pentatonic; = Shang, Madhyamavati" },
        { id: "blues_minor_pentatonic", name: "Man Gong (Blues Minor)", category: "Pentatonic", mask: 1321, uid: 836207, info: "Mode 3 of major pentatonic; = Jue, Malkauns, Hindolam" },
        { id: "blues_major_pentatonic", name: "Ritsusen (Blues Major)", category: "Pentatonic", mask: 677, uid: 5097420, info: "Mode 4 of major pentatonic; = Zhi, Yo, Durga" },
        { id: "minor_pentatonic", name: "Minor Pentatonic", category: "Pentatonic", mask: 1193, uid: 4378557, info: "Five notes. Rock, blues and hip-hop leads." },
        { id: "dominant_pentatonic", name: "Dominant Pentatonic", category: "Pentatonic", mask: 1173, uid: 15685700, info: "1 2 3 5 b7; over dominant 7th chords" },
        { id: "minor6_pentatonic", name: "Minor 6 Pentatonic", category: "Pentatonic", mask: 681, uid: 2081420, info: "1 b3 4 5 6; minor added-sixth pentatonic" },
        { id: "major_hexatonic", name: "Major Hexatonic", category: "Pentatonic", mask: 693, uid: 16705455, info: "Major without 7th; Guidonian hexachord" },
        { id: "minor_hexatonic", name: "Minor Hexatonic", category: "Pentatonic", mask: 1197, uid: 12813150, info: "Minor without 6th (most common form; some lists use maj7)" },
        { id: "blues", name: "Blues", category: "Blues & Jazz", mask: 1257, uid: 10738410, info: "Minor pentatonic plus the blue note." },
        { id: "blues_major", name: "Blues (Major)", category: "Blues & Jazz", mask: 669, uid: 6139726, info: "Major pentatonic + b3" },
        { id: "bebop_dominant", name: "Bebop Dominant", category: "Blues & Jazz", mask: 3765, uid: 1573489, info: "Mixolydian + maj7 passing tone (Baker)" },
        { id: "bebop_major", name: "Bebop Major", category: "Blues & Jazz", mask: 2997, uid: 10648051, info: "Major + #5/b6 passing tone (Baker)" },
        { id: "bebop_dorian", name: "Bebop Dorian", category: "Blues & Jazz", mask: 1725, uid: 762622, info: "Dorian + maj3 passing tone (Baker); some use maj7 instead" },
        { id: "bebop_melodic_minor", name: "Bebop Melodic Minor", category: "Blues & Jazz", mask: 2989, uid: 1989458, info: "Melodic minor + b6 passing tone" },
        { id: "altered", name: "Altered", category: "Blues & Jazz", mask: 1371, uid: 11851479, info: "Super Locrian; mode 7 of melodic minor" },
        { id: "lydian_dominant", name: "Lydian Dominant", category: "Blues & Jazz", mask: 1749, uid: 3755695, info: "Overtone / Lydian b7; mode 4 of melodic minor; = Vachaspati" },
        { id: "lydian_augmented", name: "Lydian Augmented", category: "Blues & Jazz", mask: 2901, uid: 506648, info: "Mode 3 of melodic minor" },
        { id: "half_diminished", name: "Half-Diminished", category: "Blues & Jazz", mask: 1389, uid: 9431319, info: "Locrian #2; mode 6 of melodic minor" },
        { id: "dorian_b2", name: "Dorian b2", category: "Blues & Jazz", mask: 1707, uid: 10256856, info: "Phrygian #6; mode 2 of melodic minor" },
        { id: "mixolydian_b6", name: "Mixolydian b6", category: "Blues & Jazz", mask: 1461, uid: 5996422, info: "Aeolian dominant / 'Hindu'; mode 5 of melodic minor; = Charukesi" },
        { id: "whole_tone", name: "Whole Tone", category: "Symmetric", mask: 1365, uid: 376371, info: "Six equal steps. Dreamy, no resolution." },
        { id: "diminished_wh", name: "Diminished (W-H)", category: "Symmetric", mask: 2925, uid: 11591736, info: "Octatonic, whole-half; over dim7 chords" },
        { id: "diminished_hw", name: "Diminished (H-W)", category: "Symmetric", mask: 1755, uid: 15674097, info: "Octatonic, half-whole; Messiaen mode 2; over 7b9 chords" },
        { id: "augmented", name: "Augmented", category: "Symmetric", mask: 2457, uid: 13176458, info: "Hexatonic, alternating m3 and m2 steps" },
        { id: "augmented_inverse", name: "Six-Tone Symmetric", category: "Symmetric", mask: 819, uid: 14819424, info: "Augmented inverse; alternating m2 and m3 steps" },
        { id: "tritone", name: "Tritone", category: "Symmetric", mask: 1235, uid: 3750576, info: "Two major triads a tritone apart (Petrushka-type)" },
        { id: "messiaen_3", name: "Messiaen Mode 3", category: "Symmetric", mask: 3549, uid: 6571297, info: "Mode of limited transposition 3 (W-H-H repeated)" },
        { id: "messiaen_4", name: "Messiaen Mode 4", category: "Symmetric", mask: 2535, uid: 6569661, info: "Mode of limited transposition 4" },
        { id: "messiaen_5", name: "Messiaen Mode 5", category: "Symmetric", mask: 2275, uid: 6569165, info: "Mode of limited transposition 5" },
        { id: "messiaen_6", name: "Messiaen Mode 6", category: "Symmetric", mask: 3445, uid: 6570473, info: "Mode of limited transposition 6" },
        { id: "messiaen_7", name: "Messiaen Mode 7", category: "Symmetric", mask: 3055, uid: 6569769, info: "Mode of limited transposition 7" },
        { id: "chromatic", name: "Chromatic", category: "Symmetric", mask: 4095, uid: 16343933, info: "All twelve notes. Nothing is corrected." },
        { id: "hirajoshi", name: "Hirajoshi", category: "Japanese", mask: 397, uid: 13615143, info: "Koto tuning; Speed/Kostka-Payne form; other authors give rotations" },
        { id: "in_miyakobushi", name: "In (Miyako-bushi)", category: "Japanese", mask: 419, uid: 16077650, info: "Sakura scale; = Kumoijoshi koto tuning" },
        { id: "insen", name: "Insen", category: "Japanese", mask: 1187, uid: 5155165, info: "In scale with b7 instead of b6; shakuhachi" },
        { id: "iwato", name: "Iwato", category: "Japanese", mask: 1123, uid: 86154, info: "Mode of In scale; = Hirajoshi per Sachs/Slonimsky" },
        { id: "kumoi", name: "Kumoi", category: "Japanese", mask: 653, uid: 12397921, info: "1 2 b3 5 6; a.k.a. Akebono I (Western-book form)" },
        { id: "yo", name: "Yo", category: "Japanese", mask: 677, uid: 6274659, info: "Anhemitonic folk scale (steps 2-3-2-2-3); = Ritsu pentatonic" },
        { id: "minyo", name: "Min'yo", category: "Japanese", mask: 1193, uid: 1485875, info: "Folk-song scale in Koizumi's tetrachord theory" },
        { id: "ryukyu", name: "Ryukyu (Okinawan)", category: "Japanese", mask: 2225, uid: 2588628, info: "Okinawan folk scale; same set as Ethiopian Bati major" },
        { id: "gong", name: "Gong", category: "Chinese", mask: 661, uid: 6465429, info: "Pentatonic mode on gong (do); = major pentatonic" },
        { id: "shang", name: "Shang", category: "Chinese", mask: 1189, uid: 8616689, info: "Pentatonic mode on shang (re)" },
        { id: "jue", name: "Jue", category: "Chinese", mask: 1321, uid: 12336303, info: "Pentatonic mode on jue (mi)" },
        { id: "zhi", name: "Zhi", category: "Chinese", mask: 677, uid: 8701562, info: "Pentatonic mode on zhi (sol)" },
        { id: "yu", name: "Yu", category: "Chinese", mask: 1193, uid: 6264155, info: "Pentatonic mode on yu (la); = minor pentatonic" },
        { id: "qingyue", name: "Qingyue (Heptatonic)", category: "Chinese", mask: 2741, uid: 15791180, info: "Gong scale + qingjue (4) & biangong (7); = Ionian" },
        { id: "yayue", name: "Yayue (Heptatonic)", category: "Chinese", mask: 2773, uid: 8081933, info: "Gong scale + bianzhi (#4) & biangong (7); = Lydian" },
        { id: "yanyue", name: "Yanyue (Heptatonic)", category: "Chinese", mask: 1717, uid: 2576977, info: "Gong scale + qingjue (4) & run (b7); = Mixolydian" },
        { id: "thaat_bilawal", name: "Bilawal", category: "Indian (Hindustani)", mask: 2741, uid: 14534586, info: "Thaat; = Major / Ionian" },
        { id: "thaat_kalyan", name: "Kalyan", category: "Indian (Hindustani)", mask: 2773, uid: 10872738, info: "Thaat (tivra Ma); = Lydian" },
        { id: "thaat_khamaj", name: "Khamaj", category: "Indian (Hindustani)", mask: 1717, uid: 775684, info: "Thaat (komal Ni); = Mixolydian" },
        { id: "thaat_kafi", name: "Kafi", category: "Indian (Hindustani)", mask: 1709, uid: 16643054, info: "Thaat (komal Ga, Ni); = Dorian" },
        { id: "thaat_asavari", name: "Asavari", category: "Indian (Hindustani)", mask: 1453, uid: 15529608, info: "Thaat (komal Ga, Dha, Ni); = Aeolian" },
        { id: "thaat_bhairavi", name: "Bhairavi", category: "Indian (Hindustani)", mask: 1451, uid: 5601925, info: "Thaat (komal Re, Ga, Dha, Ni); = Phrygian" },
        { id: "thaat_bhairav", name: "Bhairav", category: "Indian (Hindustani)", mask: 2483, uid: 7507216, info: "Thaat (komal Re, Dha); = Double Harmonic, Mayamalavagowla" },
        { id: "thaat_marwa", name: "Marwa (Thaat)", category: "Indian (Hindustani)", mask: 2771, uid: 14688874, info: "Thaat (komal Re, tivra Ma); = Gamanashrama" },
        { id: "thaat_purvi", name: "Purvi", category: "Indian (Hindustani)", mask: 2515, uid: 3394853, info: "Thaat (komal Re, Dha, tivra Ma); = Kamavardhani" },
        { id: "thaat_todi", name: "Todi", category: "Indian (Hindustani)", mask: 2507, uid: 4034338, info: "Thaat (komal Re, Ga, Dha, tivra Ma); = Shubhapantuvarali" },
        { id: "raga_yaman", name: "Yaman", category: "Indian (Hindustani)", mask: 2773, uid: 8088597, info: "Raga of Kalyan thaat; same notes as thaat (asc. often skips Sa/Pa)" },
        { id: "raga_bhupali", name: "Bhupali", category: "Indian (Hindustani)", mask: 661, uid: 7488625, info: "Raga, audav S R G P D; = Mohanam / major pentatonic" },
        { id: "raga_durga", name: "Durga", category: "Indian (Hindustani)", mask: 677, uid: 11592040, info: "Raga, audav S R M P D (Bilawal thaat)" },
        { id: "raga_malkauns", name: "Malkauns", category: "Indian (Hindustani)", mask: 1321, uid: 2028092, info: "Raga, audav S g M d n (Bhairavi thaat); = Hindolam" },
        { id: "raga_bageshri", name: "Bageshri", category: "Indian (Hindustani)", mask: 1581, uid: 15464110, info: "Raga (Kafi thaat); Pa omitted (used sparingly in descent)" },
        { id: "raga_desh", name: "Desh", category: "Indian (Hindustani)", mask: 3765, uid: 460117, info: "Raga; union: asc S R M P N, desc S n D P M G R" },
        { id: "raga_marwa", name: "Marwa", category: "Indian (Hindustani)", mask: 2643, uid: 14991753, info: "Raga, shadav S r G M D N, Pa omitted" },
        { id: "raga_lalit", name: "Lalit", category: "Indian (Hindustani)", mask: 2419, uid: 2190071, info: "Raga with both Ma, Pa omitted; komal Dha form (some use shuddha)" },
        { id: "raga_ahir_bhairav", name: "Ahir Bhairav", category: "Indian (Hindustani)", mask: 1715, uid: 9761706, info: "Raga; Bhairav lower + Kafi upper; = Chakravakam" },
        { id: "raga_jog", name: "Jog", category: "Indian (Hindustani)", mask: 1209, uid: 9461137, info: "Raga; union: asc S G M P n, desc uses komal Ga too" },
        { id: "raga_bairagi", name: "Bairagi", category: "Indian (Hindustani)", mask: 1187, uid: 5368696, info: "Raga, audav S r M P n; = Revati / Insen set" },
        { id: "raga_madhmad_sarang", name: "Madhmad Sarang", category: "Indian (Hindustani)", mask: 1189, uid: 1571526, info: "Raga, audav S R M P n" },
        { id: "raga_shivranjani", name: "Shivranjani", category: "Indian (Hindustani)", mask: 653, uid: 145215, info: "Raga, audav S R g P D" },
        { id: "raga_hindol", name: "Hindol", category: "Indian (Hindustani)", mask: 2641, uid: 4203847, info: "Raga, audav S G M# D N (Kalyan thaat); not Carnatic Hindolam" },
        { id: "mela_hanumatodi", name: "Hanumatodi (Todi)", category: "Indian (Carnatic)", mask: 1451, uid: 16270321, info: "Melakarta 8; = Phrygian, Bhairavi thaat" },
        { id: "mela_vakulabharanam", name: "Vakulabharanam", category: "Indian (Carnatic)", mask: 1459, uid: 8426704, info: "Melakarta 14; = Phrygian Dominant" },
        { id: "mela_mayamalavagowla", name: "Mayamalavagowla", category: "Indian (Carnatic)", mask: 2483, uid: 5172091, info: "Melakarta 15; = Bhairav thaat / Double Harmonic" },
        { id: "mela_chakravakam", name: "Chakravakam", category: "Indian (Carnatic)", mask: 1715, uid: 16741792, info: "Melakarta 16; = Ahir Bhairav" },
        { id: "mela_natabhairavi", name: "Natabhairavi", category: "Indian (Carnatic)", mask: 1453, uid: 3251429, info: "Melakarta 20; = natural minor" },
        { id: "mela_kiravani", name: "Kiravani", category: "Indian (Carnatic)", mask: 2477, uid: 9409792, info: "Melakarta 21; = harmonic minor (Hindustani Kirwani)" },
        { id: "mela_kharaharapriya", name: "Kharaharapriya", category: "Indian (Carnatic)", mask: 1709, uid: 14835531, info: "Melakarta 22; = Dorian, Kafi thaat" },
        { id: "mela_gourimanohari", name: "Gourimanohari", category: "Indian (Carnatic)", mask: 2733, uid: 1187888, info: "Melakarta 23; = melodic minor (ascending)" },
        { id: "mela_charukesi", name: "Charukesi", category: "Indian (Carnatic)", mask: 1461, uid: 9083163, info: "Melakarta 26; = Mixolydian b6" },
        { id: "mela_harikambhoji", name: "Harikambhoji", category: "Indian (Carnatic)", mask: 1717, uid: 16354162, info: "Melakarta 28; = Mixolydian, Khamaj thaat" },
        { id: "mela_shankarabharanam", name: "Shankarabharanam", category: "Indian (Carnatic)", mask: 2741, uid: 909191, info: "Melakarta 29 (Dheerasankarabharanam); = Major" },
        { id: "mela_shubhapantuvarali", name: "Shubhapantuvarali", category: "Indian (Carnatic)", mask: 2507, uid: 16388231, info: "Melakarta 45; = Todi thaat" },
        { id: "mela_kamavardhani", name: "Pantuvarali", category: "Indian (Carnatic)", mask: 2515, uid: 13549174, info: "Melakarta 51 (Kamavardhani); = Purvi thaat" },
        { id: "mela_simhendramadhyamam", name: "Simhendramadhyamam", category: "Indian (Carnatic)", mask: 2509, uid: 7803718, info: "Melakarta 57; = Hungarian minor" },
        { id: "mela_dharmavati", name: "Dharmavati", category: "Indian (Carnatic)", mask: 2765, uid: 5404819, info: "Melakarta 59; melodic minor with #4" },
        { id: "mela_vachaspati", name: "Vachaspati", category: "Indian (Carnatic)", mask: 1749, uid: 11569944, info: "Melakarta 64; = Lydian Dominant" },
        { id: "mela_mechakalyani", name: "Kalyani", category: "Indian (Carnatic)", mask: 2773, uid: 1847684, info: "Melakarta 65 (Mechakalyani); = Lydian, Kalyan thaat" },
        { id: "raga_mohanam", name: "Mohanam", category: "Indian (Carnatic)", mask: 661, uid: 9740098, info: "Janya of 28, S R2 G3 P D2; = Bhupali" },
        { id: "raga_hindolam", name: "Hindolam", category: "Indian (Carnatic)", mask: 1321, uid: 2167804, info: "Janya of 20, S G2 M1 D1 N2; = Malkauns" },
        { id: "raga_hamsadhwani", name: "Hamsadhwani", category: "Indian (Carnatic)", mask: 2197, uid: 12410563, info: "Janya of 29, S R2 G3 P N3" },
        { id: "raga_abhogi", name: "Abhogi", category: "Indian (Carnatic)", mask: 557, uid: 4234216, info: "Janya of 22, S R2 G2 M1 D2" },
        { id: "raga_madhyamavati", name: "Madhyamavati", category: "Indian (Carnatic)", mask: 1189, uid: 3303725, info: "Janya of 22, S R2 M1 P N2; = Madhmad Sarang" },
        { id: "raga_shuddha_saveri", name: "Shuddha Saveri", category: "Indian (Carnatic)", mask: 677, uid: 7412591, info: "Janya of 29, S R2 M1 P D2; = Durga" },
        { id: "raga_shuddha_dhanyasi", name: "Shuddha Dhanyasi", category: "Indian (Carnatic)", mask: 1193, uid: 5463024, info: "S G2 M1 P N2 (Udayaravichandrika); sources vary on Ni" },
        { id: "raga_revati", name: "Revati", category: "Indian (Carnatic)", mask: 1187, uid: 3453667, info: "Janya of 2, S R1 M1 P N2; = Bairagi" },
        { id: "raga_amritavarshini", name: "Amritavarshini", category: "Indian (Carnatic)", mask: 2257, uid: 7196428, info: "Janya of 66, S G3 M2 P N3" },
        { id: "maqam_ajam", name: "Ajam", category: "Arabic & Turkish", mask: 2741, uid: 6134668, info: "Maqam Ajam; = major scale" },
        { id: "maqam_nahawand", name: "Nahawand", category: "Arabic & Turkish", mask: 2477, uid: 16232919, info: "Ascending form (Hijaz upper jins); descends with b7 (Kurd)" },
        { id: "maqam_kurd", name: "Kurd", category: "Arabic & Turkish", mask: 1451, uid: 9455270, info: "Maqam Kurd; = Phrygian" },
        { id: "maqam_hijaz", name: "Hijaz", category: "Arabic & Turkish", mask: 1459, uid: 8122108, info: "Hijaz + Nahawand on 4th; = Phrygian dominant; Turkish Hicaz" },
        { id: "maqam_hijazkar", name: "Hijazkar", category: "Arabic & Turkish", mask: 2483, uid: 14343797, info: "Hijaz on 1 & 5; = Double Harmonic; Turkish Hicazkar" },
        { id: "maqam_zanjaran", name: "Zanjaran", category: "Arabic & Turkish", mask: 1715, uid: 16038505, info: "Hijaz + Ajam on 4th (Hijaz family)" },
        { id: "maqam_nikriz", name: "Nikriz", category: "Arabic & Turkish", mask: 1741, uid: 5556361, info: "Nikriz + Nahawand on 5th; = Ukrainian Dorian" },
        { id: "maqam_nawa_athar", name: "Nawa Athar", category: "Arabic & Turkish", mask: 2509, uid: 445778, info: "Nawa Athar + Hijaz on 5th; = Hungarian minor" },
        { id: "maqam_athar_kurd", name: "Athar Kurd", category: "Arabic & Turkish", mask: 2507, uid: 1055882, info: "Athar Kurd + Hijaz on 5th; = Todi thaat" },
        { id: "maqam_bayati", name: "Bayati", category: "Arabic & Turkish", mask: 1451, uid: 4643627, info: "Approx. 12-TET: Half-flat 2nd rounded down (= Kurd set)" },
        { id: "maqam_rast", name: "Rast", category: "Arabic & Turkish", mask: 1717, uid: 10808901, info: "Approx. 12-TET: Half-flat 3rd rounded up, 7th as desc. b7" },
        { id: "maqam_saba", name: "Saba", category: "Arabic & Turkish", mask: 1435, uid: 13165826, info: "Approx. 12-TET: Half-flat 2nd rounded down (= Saba Zamzam)" },
        { id: "maqam_sikah", name: "Sikah", category: "Arabic & Turkish", mask: 1451, uid: 1290062, info: "Approx. 12-TET: Half-flat tonic rounded up, all steps round down" },
        { id: "makam_suzinak", name: "Suzinak", category: "Arabic & Turkish", mask: 2485, uid: 8127101, info: "Approx. 12-TET: Rast + Hijaz on 5th, 3rd rounded up" },
        { id: "dastgah_shur", name: "Shur", category: "Persian", mask: 1451, uid: 10481169, info: "Approx. 12-TET: Koron 2nd rounded down; 5th may be lowered" },
        { id: "dastgah_homayun", name: "Homayun", category: "Persian", mask: 1459, uid: 9307320, info: "Approx. 12-TET: On G; koron 2nd rounded down" },
        { id: "dastgah_chahargah", name: "Chahargah", category: "Persian", mask: 2483, uid: 14057062, info: "Approx. 12-TET: Koron 2nd and 6th rounded down" },
        { id: "dastgah_mahur", name: "Mahur", category: "Persian", mask: 2741, uid: 16289005, info: "Dastgah Mahur; = major (also Rast-Panjgah scale)" },
        { id: "ahava_rabbah", name: "Ahava Rabbah (Freygish)", category: "Jewish & Klezmer", mask: 1459, uid: 11236510, info: "Ashkenazi prayer mode; = Phrygian dominant / Hijaz" },
        { id: "mi_sheberach", name: "Mi Sheberach", category: "Jewish & Klezmer", mask: 1741, uid: 14958940, info: "Altered/Ukrainian Dorian (Av HaRachamim); klezmer" },
        { id: "adonai_malach", name: "Adonai Malach", category: "Jewish & Klezmer", mask: 1717, uid: 3841904, info: "Ashkenazi prayer mode; major with b7 (core form)" },
        { id: "magen_avot", name: "Magen Avot", category: "Jewish & Klezmer", mask: 1453, uid: 13820284, info: "Ashkenazi prayer mode; resembles natural minor" },
        { id: "hungarian_minor", name: "Hungarian Minor", category: "Eastern European", mask: 2509, uid: 2151177, info: "Harmonic minor with #4; = Nawa Athar" },
        { id: "hungarian_major", name: "Hungarian Major", category: "Eastern European", mask: 1753, uid: 6151255, info: "1 #2 3 #4 5 6 b7" },
        { id: "romanian_minor", name: "Romanian Minor", category: "Eastern European", mask: 1741, uid: 9511914, info: "= Ukrainian Dorian / Dorian #4 / Mi Sheberach" },
        { id: "romanian_major", name: "Romanian Major", category: "Eastern European", mask: 1747, uid: 8568686, info: "1 b2 3 #4 5 6 b7" },
        { id: "gypsy_minor", name: "Gypsy (Romani Minor)", category: "Eastern European", mask: 1485, uid: 12148379, info: "Romani scale; 'Gypsy' also used for Hungarian minor" },
        { id: "double_harmonic", name: "Double Harmonic", category: "Eastern European", mask: 2483, uid: 5399672, info: "Byzantine / Gypsy major; = Hijazkar, Bhairav" },
        { id: "phrygian_dominant", name: "Phrygian Dominant", category: "Spanish & Flamenco", mask: 1459, uid: 4333545, info: "Phrygian with a major 3rd. Flamenco, Middle Eastern." },
        { id: "flamenco_mode", name: "Flamenco (Andalusian)", category: "Spanish & Flamenco", mask: 1467, uid: 14438000, info: "Phrygian with both 3rds (Andalusian cadence mode)" },
        { id: "spanish_8_tone", name: "Spanish 8-Tone", category: "Spanish & Flamenco", mask: 1403, uid: 1909262, info: "Espla's scale; Phrygian with maj3 and b5" },
        { id: "tizita_major", name: "Tizita Major", category: "African", mask: 661, uid: 16524861, info: "Ethiopian qenet; = major pentatonic" },
        { id: "tizita_minor", name: "Tizita Minor", category: "African", mask: 397, uid: 1579409, info: "Ethiopian qenet ('half Tizita'); some list b6->6" },
        { id: "bati_major", name: "Bati Major", category: "African", mask: 2225, uid: 1001665, info: "Ethiopian qenet; = Ryukyu set; sources vary" },
        { id: "bati_minor", name: "Bati Minor", category: "African", mask: 1193, uid: 7179110, info: "Ethiopian qenet; = minor pentatonic (most cited form)" },
        { id: "ambassel", name: "Ambassel", category: "African", mask: 419, uid: 11434673, info: "Ethiopian qenet; = In/Miyako-bushi set" },
        { id: "anchihoye", name: "Anchihoye", category: "African", mask: 611, uid: 1506038, info: "Ethiopian qenet; 1 b2 4 b5 6" },
        { id: "slendro", name: "Slendro", category: "Indonesian & SE Asian", mask: 677, uid: 10633867, info: "Approx. 12-TET: ~5 equal steps (~240c each)" },
        { id: "pelog_selisir", name: "Pelog Selisir", category: "Indonesian & SE Asian", mask: 395, uid: 3808525, info: "Approx. 12-TET: Balinese pelog degrees 1 2 3 5 6" },
        { id: "pelog_tembung", name: "Pelog Tembung", category: "Indonesian & SE Asian", mask: 419, uid: 8961360, info: "Approx. 12-TET: Balinese pelog degrees 1 2 4 5 6" },
        { id: "enigmatic", name: "Enigmatic", category: "Other & Exotic", mask: 3411, uid: 155813, info: "Verdi's scala enigmatica (ascending form)" },
        { id: "prometheus", name: "Prometheus (Mystic)", category: "Other & Exotic", mask: 1621, uid: 8046005, info: "Scriabin's mystic chord as a scale" },
        { id: "persian_western", name: "Persian (Western)", category: "Other & Exotic", mask: 2419, uid: 9608843, info: "Western-theory name; not a Persian dastgah" },
        { id: "oriental", name: "Oriental", category: "Other & Exotic", mask: 1651, uid: 6126718, info: "Western-theory name; 1 b2 3 4 b5 6 b7" },
        { id: "arabian", name: "Arabian (Major Locrian)", category: "Other & Exotic", mask: 1397, uid: 13472945, info: "Western-theory name; not an Arabic maqam" },
        { id: "balinese", name: "Balinese", category: "Other & Exotic", mask: 395, uid: 1248077, info: "Western-book name; = Pelog Selisir set" },
        { id: "hawaiian", name: "Hawaiian", category: "Other & Exotic", mask: 2733, uid: 16539914, info: "Western-book name; = melodic minor (some lists omit 4th)" }
    ];

    var byId = {};
    var byUid = {};
    (function () {
        for (var i = 0; i < SCALES.length; i++) {
            SCALES[i].index = i;
            byId[SCALES[i].id] = i;
            byUid[SCALES[i].uid] = i;
        }
    })();

    function popcount(mask) {
        var n = 0;
        while (mask) { n += mask & 1; mask >>= 1; }
        return n;
    }

    return {
        NOTE_NAMES: NOTE_NAMES,
        CATEGORIES: CATEGORIES,
        SCALES: SCALES,
        /** Library position of a scale id, or -1. */
        indexById: function (id) { return byId.hasOwnProperty(id) ? byId[id] : -1; },
        /** Library position of a scale uid, or -1. */
        indexByUid: function (uid) { return byUid.hasOwnProperty(uid) ? byUid[uid] : -1; },
        /** Number of notes in a scale mask. */
        popcount: popcount,
        /** Library positions of all scales in a category (by category name), in library order. */
        indicesInCategory: function (category) {
            var out = [];
            for (var i = 0; i < SCALES.length; i++) {
                if (SCALES[i].category === category) { out.push(i); }
            }
            return out;
        }
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapScales;
}
