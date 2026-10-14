# Scale Snap

A small MIDI plugin for Ableton Live (VST3, Mac and Windows) that keeps what you play in key, like
Logic's Scale Quantize:

- **Live correction**: pick a key and a scale, and every wrong note you play is moved to the
  nearest note in the scale.
- **Records the corrected notes**: the MIDI clip ends up with the corrected notes, not what
  your fingers actually hit.
- **Chords (optional)**: each key you press plays a diatonic triad, 7th or 9th chord built
  from the scale.

## Controls

| Control    | What it does |
|------------|--------------|
| Key        | Root note of the scale (C to B). |
| Scale      | Major, Natural/Harmonic/Melodic Minor, the modes, Phrygian Dominant, Pentatonics, Blues, Harmonic Major, Whole Tone, Chromatic. |
| Correction | **Nearest (tie: down/up)**: go to the closest scale note; when it's exactly in between, go down or up. **Always up / Always down**. **Block wrong notes**: wrong notes make no sound. |
| Chords     | Off, Triads, 7th chords, 9th chords. Works best with 7-note scales. |
| Bypass     | Lets notes through unchanged (handy for A/B comparing). |

The keyboard shows the scale (bright keys), the keys you press (yellow dot = was in key,
red dot = got corrected) and the notes that come out (green).

Everything else (pitch bend, mod wheel, sustain pedal, aftertouch) passes straight through.

## Installing

Download the build from the **Actions** tab on GitHub (latest "Scale Snap plugin" run →
Artifacts → `ScaleSnap-macOS` or `ScaleSnap-Windows`), unzip, then:

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
cd scale-snap
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
ctest --test-dir build          # unit tests for the scale logic
```

The plugin ends up in `build/ScaleSnap_artefacts/Release/`.

## Code layout

- `Source/ScaleEngine.h`: the scale/chord logic and note tracking. Plain C++ with no JUCE, unit
  tested in `Tests/ScaleEngineTests.cpp`.
- `Source/PluginProcessor.*`: the plugin itself (parameters, MIDI in and out, saved state).
- `Source/PluginEditor.*`: the window with the controls and keyboard.
