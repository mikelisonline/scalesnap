/* Scale Snap - Live clip operations (ES5; Max [js] legacy object and Node).
 *
 * Snap Clip: read the notes of the selected MIDI clip (Clip.get_notes_extended), remap every
 * pitch through the current snap table and write the result back (Clip.apply_note_modifications,
 * which keeps note ids). Blocked notes are muted, never deleted.
 * Analyze Clip: feed the clip's notes to the scale detector.
 *
 * LiveAPI / Dict constructors are injected so everything is testable with mocks.
 */
var ScaleSnapClip = (function () {
    var CLIP_PATH = "live_set view detail_clip";

    function first(v) { return (v && typeof v.length === "number" && typeof v !== "string") ? v[0] : v; }

    /** Normalise whatever get_notes_extended returned into an array of note objects, or null. */
    function parseNotes(result, DictCtor) {
        var data = result;
        if (data && typeof data === "object" && !(data instanceof Array) && data.notes) { return data.notes; }
        if (data instanceof Array) {
            if (data.length === 1 && typeof data[0] === "string") { data = data[0]; }
            else if (data.length > 0 && typeof data[0] === "object") { return data; }
            else { data = data.join(" "); }
        }
        if (typeof data !== "string") { return null; }
        data = data.replace(/^\s+|\s+$/g, "");
        if (data.charAt(0) === "{" || data.charAt(0) === "[") {
            try {
                var parsed = JSON.parse(data);
                return parsed instanceof Array ? parsed : (parsed.notes || null);
            } catch (e) { return null; }
        }
        var m = /^dictionary\s+(\S+)/.exec(data); // a Max dict name
        if (m && DictCtor) {
            try {
                var d = new DictCtor(m[1]);
                var p2 = JSON.parse(d.stringify());
                return p2.notes || null;
            } catch (e2) { return null; }
        }
        return null;
    }

    var EPS = 1e-6;

    /** True if two notes sound together: they start together or one starts while the other still sounds. */
    function overlaps(a, b) {
        if (Math.abs(a.start_time - b.start_time) < EPS) { return true; }
        return a.start_time < b.start_time + b.duration - EPS && b.start_time < a.start_time + a.duration - EPS;
    }

    /** Which of two notes on the same pitch is kept: longer, then louder, then earlier, then first in the clip. */
    function betterThan(a, b) {
        if (Math.abs(a.note.duration - b.note.duration) > EPS) { return a.note.duration > b.note.duration; }
        if (a.note.velocity !== b.note.velocity) { return a.note.velocity > b.note.velocity; }
        if (Math.abs(a.note.start_time - b.note.start_time) > EPS) { return a.note.start_time < b.note.start_time; }
        return a.index < b.index;
    }

    /**
     * Remap note pitches through `map` (128 entries: output note or -1).
     * Returns { notes: modified note objects (only those that changed), changed, moved, muted, collisions }.
     * Blocked notes (map -1) get mute = 1.
     *
     * A note that was moved onto a pitch where another sounding note already plays at the same time
     * (it starts together with it, or overlaps it) is muted, never the other way round: notes the
     * player wrote in scale are not touched. Between two moved notes the longer one is kept, then
     * the louder, then the earlier. Notes that were already in scale are never muted, even if
     * they overlap each other.
     */
    function remapNotes(notes, map) {
        var work = [];
        var i;
        for (i = 0; i < notes.length; i++) {
            var src = notes[i];
            var copy = {};
            for (var k in src) { if (src.hasOwnProperty(k)) { copy[k] = src[k]; } }
            work.push({ orig: src, note: copy, index: i, changed: false, moved: false });
        }

        var moved = 0, muted = 0, collisions = 0;
        for (i = 0; i < work.length; i++) {
            var w = work[i], n = w.note;
            if (n.mute) { continue; } // already muted: leave alone
            var target = (n.pitch >= 0 && n.pitch < 128) ? map[n.pitch] : n.pitch;
            if (target < 0) {
                n.mute = 1; w.changed = true; muted++;
            } else if (target !== n.pitch) {
                n.pitch = target; w.changed = true; w.moved = true; moved++;
            }
        }

        // Collisions, per pitch among the sounding notes: notes that did not move are kept as they
        // are; the moved ones come next, best first, and each is muted if it overlaps a kept note.
        var byPitch = {};
        for (i = 0; i < work.length; i++) {
            if (work[i].note.mute) { continue; }
            (byPitch[work[i].note.pitch] = byPitch[work[i].note.pitch] || []).push(work[i]);
        }
        for (var pitch in byPitch) {
            if (!byPitch.hasOwnProperty(pitch)) { continue; }
            var group = byPitch[pitch];
            var kept = [], candidates = [], j;
            for (j = 0; j < group.length; j++) { (group[j].moved ? candidates : kept).push(group[j]); }
            candidates.sort(function (a, b) { return betterThan(a, b) ? -1 : (betterThan(b, a) ? 1 : 0); });
            for (j = 0; j < candidates.length; j++) {
                var c = candidates[j], clash = false;
                for (var m = 0; m < kept.length && !clash; m++) { clash = overlaps(c.note, kept[m].note); }
                if (clash) {
                    c.note.mute = 1; c.changed = true; collisions++;
                } else {
                    kept.push(c);
                }
            }
        }

        var out = [];
        for (i = 0; i < work.length; i++) { if (work[i].changed) { out.push(work[i].note); } }
        return { notes: out, changed: out.length, moved: moved, muted: muted, collisions: collisions };
    }

    /** Find the selected MIDI clip. Returns { api } or { error }. */
    function getClip(LiveAPICtor) {
        var api;
        try { api = new LiveAPICtor(CLIP_PATH); } catch (e) { return { error: "Live API unavailable" }; }
        if (!api || String(api.id) === "0" || api.id === 0) { return { error: "Select a MIDI clip" }; }
        var isMidi = first(api.get("is_midi_clip"));
        if (isMidi !== 1 && isMidi !== true && isMidi !== "1") { return { error: "Select a MIDI clip" }; }
        return { api: api };
    }

    function readNotes(api, DictCtor) {
        var len = Number(first(api.get("length"))) || 0;
        var end = Number(first(api.get("end_marker"))) || 0;
        var span = Math.max(len, end, 4) + 1;
        var res = api.call("get_notes_extended", 0, 128, 0, span);
        return parseNotes(res, DictCtor);
    }

    /** Snap Clip button. Returns { ok, message }. */
    function snapClip(LiveAPICtor, DictCtor, map) {
        var c = getClip(LiveAPICtor);
        if (c.error) { return { ok: false, message: c.error }; }
        var notes;
        try { notes = readNotes(c.api, DictCtor); } catch (e) { return { ok: false, message: "Could not read clip notes" }; }
        if (!notes) { return { ok: false, message: "Could not read clip notes" }; }
        if (notes.length === 0) { return { ok: false, message: "Clip has no notes" }; }
        var r = remapNotes(notes, map);
        if (r.changed === 0) { return { ok: true, message: "Clip already in scale (" + notes.length + " notes)" }; }
        try {
            c.api.call("apply_note_modifications", JSON.stringify({ notes: r.notes }));
        } catch (e2) { return { ok: false, message: "Could not write clip notes" }; }
        var msg = "Snapped " + r.moved + " note" + (r.moved === 1 ? "" : "s");
        if (r.muted) { msg += ", muted " + r.muted; }
        if (r.collisions) { msg += ", " + r.collisions + " duplicate" + (r.collisions === 1 ? "" : "s") + " muted"; }
        return { ok: true, message: msg, result: r };
    }

    /** Analyze Clip button. Returns detector result plus { ok, message }. */
    function analyzeClip(LiveAPICtor, DictCtor, Detect) {
        var c = getClip(LiveAPICtor);
        if (c.error) { return { ok: false, ready: false, groups: [], message: c.error }; }
        var notes;
        try { notes = readNotes(c.api, DictCtor); } catch (e) { notes = null; }
        if (!notes) { return { ok: false, ready: false, groups: [], message: "Could not read clip notes" }; }
        var r = Detect.analyzeNotes(notes);
        r.ok = r.ready;
        return r;
    }

    return {
        CLIP_PATH: CLIP_PATH,
        parseNotes: parseNotes,
        remapNotes: remapNotes,
        getClip: getClip,
        snapClip: snapClip,
        analyzeClip: analyzeClip
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapClip;
}
