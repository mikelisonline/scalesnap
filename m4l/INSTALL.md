# Installing Scale Snap (Max for Live)

Needs Ableton Live 11 Suite (or Standard with the Max for Live add-on). Mac and Windows.

There are two devices that work together. Use either one alone. Each is **one self-contained `.amxd` file**: the
scripts it needs are inside it.

* **Scale Snap** (MIDI effect): keeps what you play in key; can also detect the key from your playing or a clip.
* **Scale Snap Detect** (audio effect): finds the key and scale of an audio track (or the master / a group) and sends
  it to Scale Snap.

## Install (1 minute)

1. **Download** [ScaleSnap-Ableton.zip](https://github.com/mikelisonline/scalesnap/releases/latest/download/ScaleSnap-Ableton.zip)
   and unzip it: a folder `Scale Snap` with `Scale Snap.amxd`, `Scale Snap Detect.amxd` and `INSTALL.txt`.
   (The repository is private: be signed in to GitHub, with access to it, for the link to work.)
2. **Keep it:** drag the `Scale Snap` folder into Live's browser, onto **Places > User Library**
   (or, in Finder / Explorer, put it in `~/Music/Ableton/User Library/` on a Mac, `Documents\Ableton\User Library\` on Windows).
3. **Use it:** open **User Library > Scale Snap**. Drag `Scale Snap.amxd` onto a **MIDI track, before the instrument**,
   and `Scale Snap Detect.amxd` onto **any audio track** (or the master, a group or a return).

To just try it, drag `Scale Snap.amxd` from the unzipped folder straight onto a MIDI track. `INSTALL.txt` in the zip is
the same three steps in plain text (its source is `m4l/INSTALL.txt`). To build the zip yourself:
`python3 m4l/tools/build_amxd.py && python3 scripts/release.py package-ableton out`.

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
