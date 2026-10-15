# Scale Snap

Keeps what you play in key, like Logic's Scale Quantize, with a library of 162 scales from many traditions.

## Install (1 minute)

For **Ableton Live 11 Suite** (or Standard with Max for Live), Mac or Windows. No Terminal, no plugin folders.

1. **Download** [ScaleSnap-Ableton.zip](https://github.com/mikelisonline/scalesnap/releases/latest/download/ScaleSnap-Ableton.zip)
   and unzip it. You get a folder called `Scale Snap`.
   *(This repository is private: you must be signed in to GitHub, with access to it, for the link to work.)*
2. **Keep it:** drag the `Scale Snap` folder into Live's browser, onto **Places > User Library**
   (or, in Finder, put it in `~/Music/Ableton/User Library/`).
3. **Use it:** open **User Library > Scale Snap** in the browser.
   - Drag **`Scale Snap.amxd`** onto a **MIDI track, in front of the instrument**. Pick a key and a scale: wrong notes
     are moved into the scale, and the clip records the corrected notes.
   - Drag **`Scale Snap Detect.amxd`** onto an **audio track** to find the key and scale of the audio and send it to Scale Snap.

Just want to try it? Skip step 2 and drag `Scale Snap.amxd` straight from the unzipped folder onto a MIDI track.
Each device is a single self-contained file, so there is nothing else to copy.

Newer versions are published as [Releases](https://github.com/mikelisonline/scalesnap/releases); the link above
always points to the latest one. If a device stays empty or Live reports a missing file, see
[m4l/INSTALL.md](m4l/INSTALL.md). How the devices work: [m4l/README.md](m4l/README.md).

## What you get

- **Max for Live devices (recommended in Live 11 Suite):** `Scale Snap.amxd` sits in the MIDI-effect slot right in
  front of your instrument on the same track: no second track, no routing. It also detects the key and scale of what
  you play or of a MIDI clip, and can snap a recorded clip to a scale. `Scale Snap Detect.amxd` does the key detection
  for audio.
- **VST3 plugin:** for other DAWs, for Live without Max for Live (Standard without the add-on, Intro, Lite), and for
  the chord mode. See the next section.

The scale library and the correction rules are the same in both. The sections below describe the VST3 plugin and its
window.

## For other DAWs / Live without Max for Live

A small MIDI plugin (VST3, Mac and Windows) that works in other DAWs and in Ableton Live without Max for Live. It keeps what you play in key, like
Logic's Scale Quantize:

- **Live correction**: pick a key and a scale, and every wrong note you play is moved to the
  nearest note in the scale.
- **Records the corrected notes**: the MIDI clip ends up with the corrected notes, not what
  your fingers actually hit.
- **Chords (optional)**: each key you press plays a diatonic triad, 7th or 9th chord built
  from the scale.

### Installing the VST3

Download from the [latest release](https://github.com/mikelisonline/scalesnap/releases/latest) (same sign-in note as above):

- Mac (Apple Silicon and Intel): [ScaleSnap-VST3-macOS.zip](https://github.com/mikelisonline/scalesnap/releases/latest/download/ScaleSnap-VST3-macOS.zip)
- Windows: [ScaleSnap-VST3-Windows.zip](https://github.com/mikelisonline/scalesnap/releases/latest/download/ScaleSnap-VST3-Windows.zip)

Unzip it, then:

**Mac**: copy `Scale Snap.vst3` to `~/Library/Audio/Plug-Ins/VST3/`. The plugin isn't
notarized by Apple, so clear the "downloaded from the internet" flag once in Terminal:

```sh
xattr -dr com.apple.quarantine ~/Library/Audio/Plug-Ins/VST3/"Scale Snap.vst3"
```

**Windows**: copy the `Scale Snap.vst3` folder to `C:\Program Files\Common Files\VST3\`.

Then in Ableton: Settings > Plug-Ins > turn on "Use VST3 Plug-in System Folders" and
press **Rescan**.

### Setting it up in Ableton Live (two tracks)

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

## Controls and scale list

The VST3 window and the scale library (shared by both forms). For the Max for Live device see [m4l/README.md](m4l/README.md).

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
