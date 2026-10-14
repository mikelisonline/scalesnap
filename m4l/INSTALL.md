# Installing Scale Snap (Max for Live)

Needs Ableton Live 11 Suite (or Standard with the Max for Live add-on). Mac and Windows.

There are two devices that work together. Use either one alone.

* **Scale Snap** (MIDI effect): keeps what you play in key; can also detect the key from your playing or a clip.
* **Scale Snap Detect** (audio effect): finds the key and scale of an audio track (or the master / a group) and sends
  it to Scale Snap.

## Scale Snap (MIDI effect)

1. Put **both** files in the same folder:
   `Scale Snap.amxd` and `scalesnap.js`.
   A good place is your User Library, `Presets/MIDI Effects/Max MIDI Effect/`
   (in Live: right-click the "Max MIDI Effect" folder in the browser > Show in Finder / Explorer).
2. In Live, drag `Scale Snap` onto a MIDI track, **before** the instrument.
3. Optional but recommended, once: make the device self-contained so it no longer needs `scalesnap.js`.
   Click the Edit button in the device title bar, click the snowflake (Freeze Device) in the Max window,
   then File > Save. You can now move the `.amxd` anywhere.

## Scale Snap Detect (audio effect)

1. Put **all three** files in the same folder:
   `Scale Snap Detect.amxd`, `scalesnap_detect.js` and `ssd.spec.maxpat`.
   A good place is your User Library, `Presets/Audio Effects/Max Audio Effect/`.
2. Drag `Scale Snap Detect` onto **any audio track** (or the master, a group or a return). The audio passes through
   untouched. Play the track: after about 4 seconds the status line shows the key, e.g. `A Minor 74%`, with the top five
   matches listed.
3. Turn on **Send to Scale Snap**. In every Scale Snap MIDI device in the Set a line
   `Audio (<track name>): A Minor Pentatonic 71%` appears. Press **Apply** there to set its Key and Scale.
4. Optional, once: Edit > snowflake (Freeze Device) > File > Save, so the device no longer needs the other two files.

If a device shows a stuck status such as `No spectrum (pfft~ not writing)` or `Waiting for the sample rate`, or the scale
menu stays empty, open the Max window (Edit, then Window > Max Console) and look for errors mentioning
`scalesnap.js`, `scalesnap_detect.js` or `ssd.spec`.

Full instructions, usage, limitations and the list of things still to confirm inside Live: `m4l/README.md` in the repository.
