# Scale Snap

Keeps what you play in key, like Logic's Scale Quantize, with a library of 162 scales from many traditions.
It comes in two forms:

- **Max for Live MIDI effect: the recommended way in Ableton Live 11 Suite** (or Standard with Max for Live).
  `Scale Snap.amxd` (one self-contained file: just drag it into Live, or put it anywhere in your User Library)
  goes in the MIDI-effect slot right in front of your instrument on the same track: no second
  track, no routing. It also detects the key and scale of what you play or of a MIDI clip, and can snap a
  recorded clip to a scale. See [m4l/README.md](m4l/README.md) (download: `ScaleSnap-M4L` artifact of the
  latest "Build" run).
- **VST3 plugin** (below): for other hosts, for Live without Max for Live (Standard without the add-on, Intro, Lite),
  and for the chord mode. In Ableton it needs the two-track setup described further down, because Live does not
  host third-party plugins in the MIDI-effect slot.

The rest of this page describes the VST3 plugin; the scale library and the correction rules are the same in both.

## VST3 plugin

A small MIDI plugin for Ableton Live (VST3, Mac and Windows) that keeps what you play in key, like
Logic's Scale Quantize:

- **Live correction**: pick a key and a scale, and every wrong note you play is moved to the
  nearest note in the scale.
- **Records the corrected notes**: the MIDI clip ends up with the corrected notes, not what
  your fingers actually hit.
- **Chords (optional)**: each key you press plays a diatonic triad, 7th or 9th chord built
  from the scale.

## Controls

![Scale Snap](docs/screenshot.png)

The window is laid out like a device in Live's browser: scale browser on the left, controls and
scale list on the right, keyboard at the bottom.

| Control    | What it does |
|------------|--------------|
| Power (round button, top left) | On: notes are corrected. Off: bypass, notes pass through unchanged (handy for A/B comparing). |
| Key        | Root note of the scale: one button per note, C to B. |
| Scale      | Pick a scale in the list (see below). The arrow buttons next to the name step to the previous/next scale, and the star next to them adds or removes it from your favorites. |
| Correction | **Nearest ↓ / ↑**: go to the closest scale note; when it's exactly in between, go down or up. **Always ↑ / ↓**. **Block**: wrong notes make no sound. Hover a button for its full name. |
| Chords     | Off, Triad, 7th, 9th. Works best with 7-note scales. |

**Scale browser.** The search box filters by name, category and description. Under it, pick a
collection (**Favorites**) or a category (**All Scales**, Major & Modes, Minor, ...) to narrow the
list. Click a scale to select it; click the star on its row to favorite it. When the Favorites
collection is selected, the previous/next buttons step through your favorites only; otherwise they
step through whatever the list is currently showing.

**The scale list** has 162 scales in 17 categories, from the church modes and jazz scales to
Japanese, Chinese, Indian, Arabic, Persian, Jewish, Eastern European, Spanish, African and Indonesian
scales:

| Category | Scales | Examples |
|---|---|---|
| Major & Modes | 11 | Major, Dorian, Lydian, Locrian #6, ... |
| Minor | 5 | Natural, Harmonic and Melodic Minor, Neapolitan |
| Pentatonic | 9 | Major, Minor, Egyptian, Man Gong, Ritsusen, hexatonics |
| Blues & Jazz | 12 | Blues, Bebop, Altered, Lydian Dominant |
| Symmetric | 12 | Whole Tone, Diminished, Augmented, Messiaen modes, Chromatic |
| Japanese | 8 | Hirajoshi, In, Insen, Iwato, Kumoi, Yo, Ryukyu |
| Chinese | 8 | Gong, Shang, Jue, Zhi, Yu and the heptatonic forms |
| Indian (Hindustani) | 24 | the ten thaats plus ragas such as Yaman, Bhupali, Malkauns |
| Indian (Carnatic) | 26 | Melakarta scales and ragas such as Mohanam, Hindolam |
| Arabic & Turkish | 14 | Hijaz, Nahawand, Kurd, Ajam, Rast, Bayati, Saba |
| Persian | 4 | Shur, Homayun, Chahargah, Mahur |
| Jewish & Klezmer | 4 | Ahava Rabbah (Freygish), Mi Sheberach, Adonai Malach |
| Eastern European | 6 | Hungarian, Romanian, Gypsy, Double Harmonic |
| Spanish & Flamenco | 3 | Phrygian Dominant, Flamenco, Spanish 8-Tone |
| African | 6 | Tizita, Bati, Ambassel, Anchihoye (Ethiopian) |
| Indonesian & SE Asian | 3 | Slendro, Pelog |
| Other & Exotic | 7 | Enigmatic, Prometheus, Oriental, Hawaiian, ... |

Scales are listed by the same name used in their tradition (for example Hirajoshi, Bhairav, Hijaz).
Some entries are the same set of notes under different names (Bilawal, Shankarabharanam and Ajam
are all the major scale), because that is what you look for when you know the name.

**12-TET approximations.** Scale Snap sends ordinary MIDI notes, which are tuned in 12 equal
semitones. Scales that are really played with quarter tones or other tunings (Arabic and Turkish
maqamat such as Rast, Bayati, Saba and Sikah, Persian dastgah such as Shur, Homayun and Chahargah,
and the Indonesian Slendro and Pelog) are rounded to the nearest semitone. Their description starts
with "Approx. 12-TET:" and says how each note was rounded. They give you the right set of notes to
play in key, but not the microtonal pitches. To get those, use a synth that can be retuned (MPE or a
tuning table) after Scale Snap.

**Favorites** are global: they are shared by every Scale Snap instance and every Live set, and are
saved immediately in a small settings file:

- Mac: `~/Library/Application Support/mikel.studio/Scale Snap.settings`
- Windows: `%APPDATA%\mikel.studio\Scale Snap.settings`

Delete that file to clear them. The scale itself is saved with your Live set by its id, so sets keep
the right scale even if the list of scales grows.

The keyboard shows the scale (cream keys, with the root in a stronger orange), the keys you press
(white dot = was in key, red dot = got corrected) and the notes that come out (bright orange).
Middle C is C3, as in Live. The line above it spells out the notes of the current scale.

Everything else (pitch bend, mod wheel, sustain pedal, aftertouch) passes straight through.

## Installing

Download the build from this repo's **Actions** tab (latest "Build" workflow run →
Artifacts → `ScaleSnap-macOS` or `ScaleSnap-Windows`), unzip it, then unzip the inner `ScaleSnap-macOS.zip` /
`ScaleSnap-Windows.zip` (this keeps file permissions intact), then:

**Mac**: copy `Scale Snap.vst3` to `~/Library/Audio/Plug-Ins/VST3/`. The plugin isn't
notarized by Apple, so clear the "downloaded from the internet" flag once in Terminal:

```sh
xattr -dr com.apple.quarantine ~/Library/Audio/Plug-Ins/VST3/"Scale Snap.vst3"
```

**Windows**: copy the `Scale Snap.vst3` folder to `C:\Program Files\Common Files\VST3\`.

Then in Ableton: Settings → Plug-Ins → turn on "Use VST3 Plug-in System Folders" and
press **Rescan**.

## Setting it up in Ableton Live (two tracks)

Ableton doesn't let third-party plugins sit in the MIDI-effect slot, so Scale Snap loads as
an *instrument* that outputs MIDI instead of sound. A second track takes that MIDI, plays
your synth and records the corrected notes.

1. **Track 1, "Keys in"**: a MIDI track with **Scale Snap** on it.
   - *MIDI From*: your keyboard (or "All Ins").
   - *Monitor*: **In**. Don't arm this track.
2. **Track 2, "Synth"**: a MIDI track with your instrument (piano, synth, etc.).
   - *MIDI From*: **1-Keys in**, and in the second drop-down choose **Scale Snap**.
   - *Monitor*: Auto. **Arm** this track.
3. Play. You hear the corrected notes on Track 2. Press record (Session or Arrangement) and
   Track 2 records the corrected MIDI.

To use another key or scale for a different part, open Scale Snap on Track 1 and change it.
The settings are saved with your Live set, and Key/Scale/Correction/Chords can be automated or
mapped to a controller.

Tip: save Track 1 + Track 2 as a group or in a template set so it's ready every time.

## Building it yourself

Needs CMake 3.22+ and a C++17 compiler (Xcode on Mac, Visual Studio 2022 on Windows).
JUCE is downloaded automatically.

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build          # unit tests for the scale logic
```

The plugin ends up in `build/ScaleSnap_artefacts/Release/`.

## Code layout

- `Source/ScaleLibrary.h`: the table of scales (id, name, category, notes, description). Plain C++.
- `Source/ScaleEngine.h`: the scale/chord logic and note tracking. Plain C++ with no JUCE, unit
  tested in `Tests/ScaleEngineTests.cpp`.
- `Source/PluginProcessor.*`: the plugin itself (parameters, MIDI in and out, saved state).
- `Source/PluginEditor.*`, `Source/UiComponents.h`: the window, its widgets and the keyboard.
- `Source/Favorites.*`: the global favorites list stored in the settings file.
