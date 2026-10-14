# Scale Snap for Max for Live (MIDI effect)

`Scale Snap.amxd` keeps what you play in key. It sits in the MIDI-effect slot **in front of your
instrument on the same track** (no second track, no routing), with the same 162-scale library as the
VST3 plus key/scale **detection** from your playing or from a clip.

Target: **Ableton Live 11 Suite** (or Standard with Max for Live) with the Max 8 that ships inside Live.
It is plain Max 8: no `[v8]`, and the JavaScript is ES5 for the legacy `[js]` object.

> Status: everything that can be tested outside Live is tested (see *Tests*). The device has been built
> to the documented `.amxd` format but **has not been opened in Live yet**. The list of things to
> confirm on a real Live 11 is at the end of this file.

## Install

1. Get `Scale Snap.amxd` **and** `scalesnap.js` from the `ScaleSnap-M4L` artifact of the latest
   successful "Build" run (GitHub, Actions tab), or build them yourself (`python3 m4l/tools/build_amxd.py`,
   output in `m4l/dist/`).
2. Put both files **in the same folder**. A good place is your User Library:
   `Presets/MIDI Effects/Max MIDI Effect/` (in Live's browser: right-click *Max MIDI Effect* >
   *Show in Finder/Explorer*).
3. Drag **Scale Snap** onto a MIDI track, before the instrument.
4. **One-time, recommended: freeze it** so it no longer needs `scalesnap.js` next to it.
   Click the Edit button in the device's title bar, click the snowflake (*Freeze Device*) in the Max
   window, then *File > Save* (or *Save As* into your User Library). The frozen file is self-contained.
   Do not commit frozen devices.

The `.amxd` references `scalesnap.js` by name. Unfrozen, Max finds it next to the device. If the scale
menu stays empty, open the Max console (Edit button, *Window > Max Console*) and look for errors
mentioning `scalesnap.js`. If the script fails to load the device passes notes through unchanged
(it never goes silent): the realtime path does not depend on the script.

## Using it

![layout](../docs/screenshot.png)
*(the screenshot shows the VST3; the M4L device has the same controls in Live's own look)*

| Control | What it does |
|---|---|
| **Snap** (toggle) | On: notes are corrected. Off: notes pass through unchanged (notes already held are still released correctly). Automatable. |
| **Key** | Root note, C to B. Automatable. |
| **Category** | Filters the Scale menu: All Scales, Favorites, or one of the 17 categories. |
| **Scale menu**, **<** **>** | Pick a scale. The arrows step through the scales in the current Category (wrap around). The arrows are mappable to a controller or footswitch. |
| **Fav** | Adds or removes the current scale from your favorites. |
| **Correction** | Nearest (tie down), Nearest (tie up), Always up, Always down, **Block** (wrong notes make no sound). |
| keyboard | Shows the notes of the current scale over three octaves. |
| **Snap Clip** | Rewrites the selected MIDI clip to the current key/scale (see below). |
| **Detect** | See below. |

Non-note MIDI (CC, pitch bend, channel and polyphonic aftertouch, sustain) passes through unchanged.
Polyphonic aftertouch follows the corrected note of the key that is held.

**No stuck notes.** The device remembers which note each key actually produced. Releasing a key always
releases that note, even if you changed key/scale in the meantime. Two keys that snap to the same note
share it (the note is released when the last of them is released). If the device is switched off while
keys are held, it releases what it is sounding.

### Recording and Snap Clip

Live records the **input** of a track (what you played, before MIDI effects). You hear the corrected
notes, but a clip you record from this track contains your original notes. Two ways to get corrected notes
into a clip:

* **Snap Clip** (recommended): select the MIDI clip (so it shows in the Clip View), set the key and scale,
  press **Snap Clip**. Notes are moved to the chosen scale using the same rules as the live correction.
  With *Block*, wrong notes are **muted, not deleted**. If two notes end up on the same pitch at the same
  time, the later one is muted. Undo with Cmd/Ctrl-Z (check that it is one step on your system).
* Record the device's *output* on a second track: set that track's *MIDI From* to this track and choose the
  device (Scale Snap) or *Post FX* in the second drop-down.

### Detect: find the key and scale of what you play

* **Listen** on, then play. After at least 8 notes, 4 different pitch classes and 3 seconds of material the
  results menu shows the top five matches such as `A Natural Minor 82%`. The first result is preselected.
  Below it, *same notes:* lists other names of the same set of notes (a major scale and its relative minor
  and modes contain the same notes: C Major, A Natural Minor, D Dorian, ...). Detection from a few notes
  cannot know which one you mean, so it says so instead of pretending.
* **Memory** controls how long old notes count: Short (10 s), Medium (30 s, default), Hold (never forget).
* **Reset** clears what it has heard. **Apply** sets Key and Scale to the selected result.
* **Analyze Clip** does the same for the selected MIDI clip (at least 4 notes and 3 pitch classes).
* The percentages are relative scores among the candidates, not a probability that the answer is right.

How it scores (all 162 scales except Chromatic, 12 roots each): a weighted pitch-class histogram (note length
x velocity, bass notes counted extra) is compared with each scale by in-scale coverage (penalising larger
scales), a tonic/dominant/third profile fit and the weight of the bass on the root; scales with identical
notes count once per root. See `m4l/ScaleSnap/detect.js`.

### Audio detection (next step)

The device already listens on the global Max send `scalesnap.detect` and shows
`Audio (<track>): A Minor Pentatonic 71%` with an **Apply** button. The companion audio device that
sends it (`Scale Snap Detect`) is not part of this build.

### Favorites

Favorites are global (all devices, all Live sets) and are stored by scale id in a JSON file:

* `~/Documents/Max 8/Scale Snap/favorites.json` (Mac and Windows; `~` is your home folder), or, if Max cannot
  create that folder, `~/Documents/Max 8/Scale Snap favorites.json`, or `~/Documents/Scale Snap favorites.json`.

Format: `{"version": 1, "favorites": ["natural_minor", "hirajoshi"]}`. Delete the file to clear them.
Several Scale Snap devices stay in sync (they re-read the file when another one changes it). The
Category *Favorites* lists them.

### Saving, automation

The scale is saved in the Live Set as its **stable id** (a hidden *Scale ID* parameter holding a hash of the
scale's string id), never as a list position, so adding or reordering scales in a future version does not
change what an old Set selects. Power, Key, Category, Correction, Detect Memory, Previous/Next Scale are
normal automatable and MIDI-mappable parameters.

## How it works

```
midiin -> midiparse -> [p snapcore] -> midiformat -> midiout        (native Max objects, high priority)
                            ^
            128-entry lookup (coll), rewritten by scalesnap.js on every key/scale/mode/power change
```

`[js]` always runs on Max's low-priority thread, so it is **not** in the note path. It builds the lookup
(input note -> output note + 1, 0 = blocked), runs the UI, detection, favorites and the Live API clip edits.
`p snapcore` is a transcription of the C++ `NoteTracker`: per-key memory of the output note (`HELD`),
a reference count per output note (`CNT`), retrigger when a second key lands on a sounding note,
a flush on device-off, and an identity table at load so a missing script means pass-through.

Files:

| Path | |
|---|---|
| `m4l/ScaleSnap/scales.js` | **Generated** from `Source/ScaleLibrary.h` by `m4l/tools/gen_scales.py` (ids, names, categories, masks, info, stable uids). |
| `m4l/ScaleSnap/snap.js` | `buildMap()` (port of `ScaleEngine::snap`) and a reference model of the note tracker. |
| `m4l/ScaleSnap/detect.js` | Scoring, grouping, live listener, clip analysis (also used by the future audio device). |
| `m4l/ScaleSnap/favorites.js`, `clip.js` | Favorites file I/O (Max `Dict`), Live clip read/modify/write. |
| `m4l/ScaleSnap/scalesnap_main.js` | The `[js]` glue (UI state and messages). |
| `m4l/ScaleSnap/Scale Snap.maxpat` | The patcher (JSON). **Generated** by `m4l/tools/gen_patcher.py` (it has ~140 boxes and ~180 cords). Open it in Max to read or edit it; if you change it by hand, port the change to the generator. |
| `m4l/tools/build_amxd.py` | Concatenates the JS into `dist/scalesnap.js` and wraps the patcher into `dist/Scale Snap.amxd`, then re-parses it. |
| `m4l/tests/` | Node tests (no npm packages). |

`.amxd` format (as used by Ableton's `maxdevtools` repository): chunks of `4-byte tag | uint32 little-endian
length | payload` -- `ampf` (device type `mmmm` = MIDI effect), `meta` (uint32), `ptch` (the patcher JSON,
UTF-8, NUL-terminated).

## Tests

```sh
node m4l/tests/run.js            # everything (Node 18+; python3 and a C++ compiler are used by a few checks)
node m4l/tests/run.js snapcore   # only test files whose name contains "snapcore"
python3 m4l/tools/gen_scales.py --check && python3 m4l/tools/gen_patcher.py --check && python3 m4l/tools/gen_golden.py --check
```

* **Snapping parity** with the C++ engine: `tests/golden_snap.json.gz` holds the output of
  `Source/ScaleEngine.h` (compiled by `tools/gen_golden.py` from `tests/golden/gen_golden.cpp`) for every
  scale x snap mode x root x MIDI note (1.2 million values) and 40 randomized note-on/off/scale-change
  scripts run through the C++ `NoteTracker`. The JS port and the **patcher JSON itself** (executed by a small
  Max-object interpreter, `tests/maxsim.js`) must match event for event. A test regenerates the golden file with
  your C++ compiler and fails if it is stale.
* Detection (the design-doc cases), favorites (mock `Dict`), clip rewriting (mock Live API), the `[js]` glue
  (loaded in a sandbox that imitates the legacy `[js]` environment), an ES5 syntax check, structural validation
  of every `.maxpat` (valid cords, no fan-out, layout inside 440 x 169, parameter names), and the built `.amxd`.

## Known limitations

* The note tables are shared by all MIDI channels (single-channel transcription of the tracker); two keys with
  the same pitch on different channels at the same time share state. Output uses the channel of the incoming event.
* Chord mode (VST3 feature) is not in the Max version yet.
* Detection uses the notes **before** correction. Held notes are credited while they sound.
* `Detect` and the UI texts are updated by a low-priority script: they can lag by a few hundred ms. The note path
  does not.
* The favorites file location depends on Max being able to write to `~/Documents/Max 8/`.
* Changing the category does not change the current scale; the Scale menu shows no selection if the current scale
  is not in that category.

## Confirm in Live 11 (could not be verified outside Live)

See the report that came with this branch; the short version: the device loads and the generated `.amxd` header is
accepted; `scalesnap.js` is found next to the unfrozen device and after freezing; `live.comment` accepts `set`;
`kslider` polyphonic `set` shows the scale; `live.menu` accepts `clear`/`append`/`set -1`; `live.thisdevice`'s middle
outlet reports device on/off; midiparse/midiformat outlet order (polyphonic aftertouch, channel); `get_notes_extended`
/ `apply_note_modifications` call and return formats from `[js]`; Snap Clip undo; `~/Documents/Max 8/...` writable;
no added latency or jitter; whether Live records pre-device input.
