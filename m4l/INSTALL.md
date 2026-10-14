# Installing Scale Snap (Max for Live MIDI effect)

Needs Ableton Live 11 Suite (or Standard with the Max for Live add-on). Mac and Windows.

1. Put **both** files in the same folder:
   `Scale Snap.amxd` and `scalesnap.js`.
   A good place is your User Library, `Presets/MIDI Effects/Max MIDI Effect/`
   (in Live: right-click the "Max MIDI Effect" folder in the browser > Show in Finder / Explorer).
2. In Live, drag `Scale Snap` onto a MIDI track, **before** the instrument.
3. Optional but recommended, once: make the device self-contained so it no longer needs `scalesnap.js`.
   Click the Edit button in the device title bar, click the snowflake (Freeze Device) in the Max window,
   then File > Save. You can now move the `.amxd` anywhere.

If the scale menu stays empty or the status line says nothing, open the Max window (Edit, then
Window > Max Console) and look for errors mentioning `scalesnap.js`.

Full instructions, usage and limitations: `m4l/README.md` in the repository.
