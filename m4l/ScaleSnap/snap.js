/* Scale Snap - snapping core (ES5; Max [js] legacy object and Node).
 *
 * buildMap() is a line-for-line port of ScaleEngine::snap() in Source/ScaleEngine.h.
 * NoteModel is a reference model of the "p snapcore" subpatcher (a single-channel
 * transcription of NoteTracker): the Node tests run the same event streams through
 * this model, the real patcher JSON (via tests/maxsim.js) and the C++ NoteTracker.
 */
var ScaleSnapSnap = (function () {
    var MODE = {
        NEAREST_DOWN: 0, // Nearest, ties go down
        NEAREST_UP: 1,   // Nearest, ties go up
        ALWAYS_UP: 2,
        ALWAYS_DOWN: 3,
        BLOCK: 4         // out-of-scale notes are muted
    };

    var MODE_NAMES = [
        "Nearest (tie: down)",
        "Nearest (tie: up)",
        "Always up",
        "Always down",
        "Block wrong notes"
    ];

    function inScale(note, root, mask) {
        var interval = (((note - root) % 12) + 12) % 12;
        return ((mask >> interval) & 1) === 1;
    }

    /** Corrected note, or -1 if the note is muted. Mirrors ScaleEngine::snap(). */
    function snap(note, root, mask, mode) {
        if (note < 0 || note > 127) { return -1; }
        if (inScale(note, root, mask)) { return note; }
        if (mode === MODE.BLOCK) { return -1; }

        for (var d = 1; d < 12; d++) {
            var down = note - d;
            var up = note + d;
            var downOk = down >= 0 && inScale(down, root, mask);
            var upOk = up <= 127 && inScale(up, root, mask);

            switch (mode) {
                case MODE.ALWAYS_UP:
                    if (upOk) { return up; }
                    break;
                case MODE.ALWAYS_DOWN:
                    if (downOk) { return down; }
                    break;
                case MODE.NEAREST_UP:
                    if (upOk) { return up; }
                    if (downOk) { return down; }
                    break;
                default: // NEAREST_DOWN (and BLOCK, which returned above)
                    if (downOk) { return down; }
                    if (upOk) { return up; }
                    break;
            }
        }

        // Only reachable at the edges of the MIDI range with "always up/down": fall back to nearest.
        return mode === MODE.NEAREST_DOWN ? -1 : snap(note, root, mask, MODE.NEAREST_DOWN);
    }

    /** 128 entries: output note for each input note, or -1 when blocked. */
    function buildMap(root, mask, mode) {
        var map = [];
        for (var n = 0; n < 128; n++) { map.push(snap(n, root, mask, mode)); }
        return map;
    }

    /** The map as stored in the patcher's coll: output note + 1, 0 = blocked. */
    function encodeMap(map) {
        var out = [];
        for (var i = 0; i < map.length; i++) { out.push(map[i] < 0 ? 0 : map[i] + 1); }
        return out;
    }

    function identityMap() {
        var map = [];
        for (var n = 0; n < 128; n++) { map.push(n); }
        return map;
    }

    /** In-scale pitch classes as a 12-entry 0/1 array, relative to C (for the keyboard display). */
    function pitchClassSet(root, mask) {
        var out = [];
        for (var pc = 0; pc < 12; pc++) { out.push(inScale(pc, root, mask) ? 1 : 0); }
        return out;
    }

    /**
     * Reference model of p snapcore (one channel, single notes).
     *   held[P]  = output note + 1 played for input key P (0 = none)
     *   count[o] = how many held keys currently sound output note o
     * Events are {on: bool, note, vel}; note-offs always go to the note actually sent.
     */
    function NoteModel(map) {
        this.map = map || identityMap(); // plain output notes (-1 = blocked)
        this.held = [];
        this.count = [];
        this.clear();
    }

    NoteModel.prototype.clear = function () {
        this.held = [];
        this.count = [];
        for (var i = 0; i < 128; i++) { this.held.push(0); this.count.push(0); }
    };

    NoteModel.prototype.setMap = function (map) { this.map = map; };

    NoteModel.prototype.noteOff = function (p, events) {
        var o1 = this.held[p];
        if (o1 === 0) { return; }
        this.held[p] = 0;
        var o = o1 - 1;
        if (this.count[o] > 0) {
            this.count[o]--;
            if (this.count[o] === 0) { events.push({ on: false, note: o, vel: 0 }); }
        }
    };

    NoteModel.prototype.noteOn = function (p, vel, events) {
        this.noteOff(p, events); // same key pressed again without a release
        var out = this.map[p];
        if (out < 0 || out === undefined) { return; }
        this.held[p] = out + 1;
        if (this.count[out] > 0) { events.push({ on: false, note: out, vel: 0 }); } // retrigger
        events.push({ on: true, note: out, vel: vel });
        this.count[out]++;
    };

    /** MIDI-style entry point: velocity 0 is a note-off. Returns the events produced. */
    NoteModel.prototype.note = function (p, vel) {
        var events = [];
        if (vel > 0) { this.noteOn(p, vel, events); } else { this.noteOff(p, events); }
        return events;
    };

    /** Output note a held key is playing (for polyphonic aftertouch), or -1. */
    NoteModel.prototype.outputFor = function (p) {
        return this.held[p] > 0 ? this.held[p] - 1 : -1;
    };

    /** Release everything that is sounding (device off / freed). Returns the note-offs. */
    NoteModel.prototype.flush = function () {
        var events = [];
        for (var o = 0; o < 128; o++) {
            if (this.count[o] > 0) { events.push({ on: false, note: o, vel: 0 }); }
        }
        this.clear();
        return events;
    };

    return {
        MODE: MODE,
        MODE_NAMES: MODE_NAMES,
        inScale: inScale,
        snap: snap,
        buildMap: buildMap,
        encodeMap: encodeMap,
        identityMap: identityMap,
        pitchClassSet: pitchClassSet,
        NoteModel: NoteModel
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapSnap;
}
