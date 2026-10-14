# Installing Scale Snap (Max for Live)

Needs Ableton Live 11 Suite (or Standard with the Max for Live add-on). Mac and Windows.

There are two devices that work together. Use either one alone. Each is **one self-contained `.amxd` file**: the
scripts it needs are inside it.

* **Scale Snap** (MIDI effect): keeps what you play in key; can also detect the key from your playing or a clip.
* **Scale Snap Detect** (audio effect): finds the key and scale of an audio track (or the master / a group) and sends
  it to Scale Snap.

## Install

Drag the `.amxd` file(s) into Live: `Scale Snap.amxd` onto a **MIDI track, before the instrument**, `Scale Snap Detect.amxd`
onto **any audio track** (or the master, a group or a return). That is all.

To keep them, put the files anywhere in your User Library (for example `Presets/MIDI Effects/Max MIDI Effect/` and
`Presets/Audio Effects/Max Audio Effect/`; in Live: right-click the folder in the browser > Show in Finder / Explorer),
then they show up in Live's browser.

## Using Scale Snap Detect

The audio passes through untouched. Play the track: after about 4 seconds the status line shows the key, e.g.
`A Minor 74%`, with the top five matches listed. Turn on **Send to Scale Snap**: in every Scale Snap MIDI device in the Set
a line `Audio (<track name>): A Minor Pentatonic 71%` appears. Press **Apply** there to set its Key and Scale.

## If Live reports a missing file

A device that was built the normal way never needs a second file. If a device shows a stuck status such as
`No spectrum (pfft~ not writing)` or `Waiting for the sample rate`, or the scale menu stays empty, or Live says it cannot
find a file, open the Max Console (Edit button in the device title bar, then Window > Max Console) and look for
"can't find" errors mentioning `scalesnap.js`, `scalesnap_detect.js` or `ssd.spec`. Then let Max freeze the device
itself:

1. Build the development version: `python3 m4l/tools/build_amxd.py --unfrozen` (in the repository). The `.amxd` files in
   `m4l/dist/` now come with `scalesnap.js` (Scale Snap) and `scalesnap_detect.js` + `ssd.spec.maxpat` (Detect).
   Keep each device and its files **in the same folder**.
2. Drag the device onto a track in Live, click **Edit** in its title bar, and check the Max Console shows no errors.
3. In the bottom toolbar of the Max window click **Freeze Device** (the snowflake; it lights up).
4. File > Save As... and save as the same name into your User Library (`Presets/MIDI Effects/Max MIDI Effect/` or
   `Presets/Audio Effects/Max Audio Effect/`). Saving is what freezes it; close the Max window.
5. Test: move the loose files away and reload the device from Live's browser.

Full instructions, usage, limitations and the list of things still to confirm inside Live: `m4l/README.md` in the repository.
