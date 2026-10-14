/* Scale Snap - [js] glue for the Max for Live MIDI effect (ES5, legacy [js] object, Max 8).
 *
 * NOT in the realtime path: the actual note snapping runs in native Max objects (p snapcore) from a
 * 128-entry lookup table that this script rewrites whenever key, scale, mode or power change.
 * This script owns the UI state, the scale menus, favorites, MIDI detection and Live clip edits.
 *
 * It is concatenated after scales.js, snap.js, detect.js, favorites.js and clip.js into one file
 * (dist/scalesnap.js) by m4l/tools/build_amxd.py, so those modules are plain globals here.
 *
 * Messages in (left inlet), all sent by the patcher:
 *   loaded                 device initialised (live.thisdevice)
 *   key n | mode n | power n | category n   UI controls (n = menu index / 0,1)
 *   scalemenu n            Scale menu pick (n = position in the filtered list)
 *   scaleuidbyte k v      one of the three hidden Scale ID parameters (k = 0 high, 1 mid, 2 low byte of the
 *                          scale's 24-bit uid; v = its value 0..255): restore of a saved Set
 *   scaleuid n             the whole uid at once (same effect; not used by the patcher)
 *   prev | next | togglefav
 *   note pitch vel         copy of the incoming note stream (pre-snap) for detection
 *   listen n | reset | memory n | analyze | resultselect n | apply | snapclip
 *   result <track> ...     audio detection broadcast (see m4l-shared-interface)
 *   audioapply | favchanged
 * Outlets: 0 = snap table writes ("index value", value = output note + 1, 0 = blocked) and
 *          1..11 = one per UI object (see OUT). UID sends the list "high mid low", which the patcher
 *          unpacks onto the three Scale ID parameters.
 */
inlets = 1;
outlets = 12;

var OUT = {
    MAP: 0, KEY: 1, CATEGORY: 2, SCALES: 3, UID: 4, STAR: 5, KB: 6,
    INFO: 7, RESULTS: 8, SAME: 9, STATUS: 10, AUDIO: 11
};

var KB_FIRST = 48;  // lowest key of the keyboard display (3 octaves)
var KB_COUNT = 36;
var CATEGORY_ALL = 0;
var CATEGORY_FAVORITES = 1; // library categories follow at index 2

var ss = {
    root: 0,
    mode: 0,
    power: 1,
    category: 0,
    scaleIndex: 0,
    uidBytes: uidToBytes(ScaleSnapScales.SCALES[0].uid), // what the three Scale ID parameters hold
    list: [],            // library indices shown in the Scale menu
    sent: [],            // last table values written to the patcher (to send only differences)
    scaleMap: null,      // plain snap map for the current scale (-1 = blocked); used by Snap Clip
    favs: null,
    favSig: "",
    detector: null,
    listening: false,
    groups: [],
    selected: 0,
    audio: null,         // result shown: { track, tops } or null
    audioByTrack: {},    // "t:<track name>" -> { track, tops, seq } for every Detect device that has a result
    audioSeq: 0,
    tickTask: null,
    initTask: null,
    ticks: 0
};

function dbg(s) { post("Scale Snap: " + s + "\n"); }

function nowSec() { return new Date().getTime() / 1000; }

function clampInt(v, lo, hi) {
    v = Math.floor(Number(v));
    if (isNaN(v)) { return lo; }
    return Math.max(lo, Math.min(hi, v));
}

/** Text safe to send through Max messages: no separators, ASCII-ish, split into atoms. */
function textAtoms(s) {
    s = String(s).replace(/[;,]/g, " -").replace(/\s+/g, " ");
    if (s.charAt(0) === " ") { s = s.substring(1); }
    return s.length ? s.split(" ") : [];
}

function sendText(out, cmd, text) {
    var atoms = textAtoms(text);
    if (atoms.length === 0) { outlet(out, cmd); } // "set" alone clears a comment
    else { outlet(out, [cmd].concat(atoms)); }
}

function categoryName(c) {
    if (c === CATEGORY_ALL) { return "All Scales"; }
    if (c === CATEGORY_FAVORITES) { return "Favorites"; }
    return ScaleSnapScales.CATEGORIES[c - 2];
}

/** The uid is a 24-bit hash. It is stored in three Int parameters of 8 bits each: Max for Live's Int type
 *  is 0-255, so every stored value is exactly representable and no float rounding can change the id. */
function uidToBytes(uid) { return [(uid >> 16) & 255, (uid >> 8) & 255, uid & 255]; }

function validScaleId(id) { return ScaleSnapScales.indexById(id) >= 0; }

// ------------------------------------------------------------------------------------ snap table

function sendMap(force) {
    var mask = ScaleSnapScales.SCALES[ss.scaleIndex].mask;
    ss.scaleMap = ScaleSnapSnap.buildMap(ss.root, mask, ss.mode);
    var active = ss.power ? ss.scaleMap : ScaleSnapSnap.identityMap();
    var enc = ScaleSnapSnap.encodeMap(active);
    for (var i = 0; i < 128; i++) {
        if (force || ss.sent[i] !== enc[i]) {
            outlet(OUT.MAP, [i, enc[i]]);
            ss.sent[i] = enc[i];
        }
    }
}

// ------------------------------------------------------------------------------------ display

function updateKeyboard() {
    var mask = ScaleSnapScales.SCALES[ss.scaleIndex].mask;
    outlet(OUT.KB, "clear");
    for (var p = KB_FIRST; p < KB_FIRST + KB_COUNT; p++) {
        if (ScaleSnapSnap.inScale(p, ss.root, mask)) { outlet(OUT.KB, ["set", p, 1]); }
    }
}

function updateInfo() {
    var s = ScaleSnapScales.SCALES[ss.scaleIndex];
    sendText(OUT.INFO, "set", s.name + ": " + s.info);
}

function updateStar() {
    var id = ScaleSnapScales.SCALES[ss.scaleIndex].id;
    outlet(OUT.STAR, ["set", ss.favs && ss.favs.has(id) ? 1 : 0]);
}

function filteredList() {
    var out = [], i;
    if (ss.category === CATEGORY_ALL) {
        for (i = 0; i < ScaleSnapScales.SCALES.length; i++) { out.push(i); }
    } else if (ss.category === CATEGORY_FAVORITES) {
        var ids = ss.favs ? ss.favs.list() : [];
        for (i = 0; i < ScaleSnapScales.SCALES.length; i++) {
            if (ids.indexOf(ScaleSnapScales.SCALES[i].id) >= 0) { out.push(i); }
        }
    } else {
        out = ScaleSnapScales.indicesInCategory(categoryName(ss.category));
    }
    return out;
}

function rebuildScaleMenu() {
    ss.list = filteredList();
    outlet(OUT.SCALES, "clear");
    if (ss.list.length === 0) {
        outlet(OUT.SCALES, ["append", "(none)"]);
    } else {
        for (var i = 0; i < ss.list.length; i++) {
            outlet(OUT.SCALES, ["append"].concat(textAtoms(ScaleSnapScales.SCALES[ss.list[i]].name)));
        }
    }
    updateScaleSelection();
}

function updateScaleSelection() {
    outlet(OUT.SCALES, ["set", ss.list.indexOf(ss.scaleIndex)]); // -1: current scale is not in this category
}

function favSignature() { return ss.favs ? ss.favs.list().join("|") : ""; }

// ------------------------------------------------------------------------------------ state changes

/** `fromParams`: the change came from the Scale ID parameters, which already hold the value (no write-back). */
function setScale(index, force, fromParams) {
    if (index < 0 || index >= ScaleSnapScales.SCALES.length) { return; }
    if (index === ss.scaleIndex && !force) { return; }
    ss.scaleIndex = index;
    sendMap(false);
    updateKeyboard();
    updateInfo();
    updateStar();
    updateScaleSelection();
    ss.uidBytes = uidToBytes(ScaleSnapScales.SCALES[index].uid);
    if (!fromParams) { outlet(OUT.UID, ss.uidBytes.slice()); }
}

function setKey(root) {
    root = clampInt(root, 0, 11);
    if (root === ss.root) { return; }
    ss.root = root;
    sendMap(false);
    updateKeyboard();
    outlet(OUT.KEY, root);
}

function applyRootScale(root, scaleId) {
    var idx = ScaleSnapScales.indexById(scaleId);
    if (idx < 0) { return false; }
    if (ss.list.indexOf(idx) < 0 && ss.category !== CATEGORY_ALL) {
        ss.category = CATEGORY_ALL;
        outlet(OUT.CATEGORY, CATEGORY_ALL);
        rebuildScaleMenu();
    }
    setScale(idx, false);
    setKey(root);
    return true;
}

// ------------------------------------------------------------------------------------ messages: controls

function key(v) {
    ss.root = clampInt(v, 0, 11);
    sendMap(false);
    updateKeyboard();
}

function mode(v) {
    ss.mode = clampInt(v, 0, 4);
    sendMap(false);
}

function power(v) {
    ss.power = v ? 1 : 0;
    sendMap(false);
}

function category(v) {
    ss.category = clampInt(v, 0, 1 + ScaleSnapScales.CATEGORIES.length);
    rebuildScaleMenu();
}

function scalemenu(pos) {
    pos = Math.floor(Number(pos));
    if (isNaN(pos) || pos < 0 || pos >= ss.list.length) { return; }
    setScale(ss.list[pos], false);
}

function scaleuid(uid) {
    var idx = ScaleSnapScales.indexByUid(Math.round(Number(uid)));
    if (idx >= 0) { setScale(idx, false); }
}

/** One Scale ID parameter reports a value (a restored Set, or the echo of what we wrote). The scale
 *  changes once the three bytes together are the uid of a scale; partial states are ignored. */
function scaleuidbyte(k, v) {
    k = Math.floor(Number(k));
    v = Math.round(Number(v));
    if (!(k >= 0 && k <= 2) || isNaN(v)) { return; }
    ss.uidBytes[k] = clampInt(v, 0, 255);
    var idx = ScaleSnapScales.indexByUid((ss.uidBytes[0] << 16) | (ss.uidBytes[1] << 8) | ss.uidBytes[2]);
    if (idx >= 0) { setScale(idx, false, true); }
}

function step(dir) {
    if (ss.list.length === 0) { return; }
    var pos = ss.list.indexOf(ss.scaleIndex), next;
    if (pos < 0) { next = dir > 0 ? 0 : ss.list.length - 1; }
    else { next = (pos + dir + ss.list.length) % ss.list.length; }
    setScale(ss.list[next], false);
}

function prev() { step(-1); }
function next() { step(1); }

function togglefav() {
    if (!ss.favs) { return; }
    var id = ScaleSnapScales.SCALES[ss.scaleIndex].id;
    ss.favs.toggle(id);
    ss.favSig = favSignature();
    if (ss.favs.lastError) { sendText(OUT.STATUS, "set", "Favorites not saved: " + ss.favs.lastError); ss.favs.lastError = ""; }
    updateStar();
    // Our own broadcast comes back to favchanged() and is ignored (the signature already matches),
    // so a menu that lists the favorites has to be refreshed here.
    if (ss.category === CATEGORY_FAVORITES) { rebuildScaleMenu(); }
    messnamed("scalesnap.favorites", "changed");
}

function favchanged() {
    if (!ss.favs) { return; }
    ss.favs.load();
    if (favSignature() === ss.favSig) { return; }
    ss.favSig = favSignature();
    updateStar();
    if (ss.category === CATEGORY_FAVORITES) { rebuildScaleMenu(); }
}

// ------------------------------------------------------------------------------------ messages: detection

function showGroups(groups) {
    ss.groups = groups;
    outlet(OUT.RESULTS, "clear");
    if (groups.length === 0) {
        outlet(OUT.RESULTS, ["append", "(no result)"]);
        sendText(OUT.SAME, "set", "");
        return;
    }
    for (var i = 0; i < groups.length; i++) {
        outlet(OUT.RESULTS, ["append"].concat(textAtoms(ScaleSnapDetect.formatGroup(groups[i]))));
    }
    if (ss.selected >= groups.length) { ss.selected = 0; }
    outlet(OUT.RESULTS, ["set", ss.selected]);
    showSameNotes();
}

function showSameNotes() {
    var g = ss.groups[ss.selected];
    if (!g) { sendText(OUT.SAME, "set", ""); return; }
    var same = ScaleSnapDetect.sameNotes(g, 4), labels = [];
    for (var i = 0; i < same.length; i++) { labels.push(same[i].label); }
    sendText(OUT.SAME, "set", labels.length ? "same notes: " + labels.join(", ") : "");
}

function refreshDetect() {
    var r = ss.detector.result(nowSec());
    if (!r.ready) {
        showGroups([]);
        sendText(OUT.STATUS, "set", r.message);
        return;
    }
    showGroups(r.groups);
    sendText(OUT.STATUS, "set", "Listening... " + ss.detector.noteCount + " notes");
}

function tick() {
    if (!ss.listening) { return; }
    ss.detector.tick(nowSec());
    ss.ticks++;
    if (ss.ticks % 4 === 0) { refreshDetect(); }
}

function listen(v) {
    ss.listening = !!v;
    if (ss.listening) {
        ss.ticks = 0;
        if (!ss.tickTask) {
            ss.tickTask = new Task(tick, this);
            ss.tickTask.interval = 250;
        }
        ss.tickTask.repeat();
        refreshDetect();
    } else {
        if (ss.tickTask) { ss.tickTask.cancel(); }
        ss.detector.held = {};
        sendText(OUT.STATUS, "set", "Stopped");
    }
}

function note(pitch, vel) {
    if (!ss.listening) { return; }
    if (vel > 0) { ss.detector.noteOn(pitch, vel, nowSec()); }
    else { ss.detector.noteOff(pitch, nowSec()); }
}

function reset() {
    ss.detector.reset();
    ss.selected = 0;
    showGroups([]);
    sendText(OUT.STATUS, "set", ss.listening ? "Listening... 0 notes" : "Reset");
}

function memory(i) {
    var secs = ScaleSnapDetect.MEMORY_SECONDS;
    ss.detector.setMemory(secs[clampInt(i, 0, secs.length - 1)]);
}

function resultselect(n) {
    ss.selected = clampInt(n, 0, 4);
    showSameNotes();
}

function apply() {
    var g = ss.groups[ss.selected];
    if (!g) { sendText(OUT.STATUS, "set", "Nothing to apply"); return; }
    applyRootScale(g.root, g.scaleId);
    sendText(OUT.STATUS, "set", "Applied " + g.label);
}

function analyze() {
    var r = ScaleSnapClip.analyzeClip(LiveAPI, Dict, ScaleSnapDetect);
    if (r.ready) {
        ss.selected = 0;
        showGroups(r.groups);
        sendText(OUT.STATUS, "set", "Clip analysed");
    } else {
        showGroups([]);
        sendText(OUT.STATUS, "set", r.message);
    }
}

function snapclip() {
    var r = ScaleSnapClip.snapClip(LiveAPI, Dict, ss.scaleMap);
    sendText(OUT.STATUS, "set", r.message);
}

/** Broadcast from the audio "Scale Snap Detect" device: result <track> [rootPc scaleId pct]... */
function result() {
    var a = arrayfromargs(arguments), tops = [], end = a.length;
    while (end >= 4 && typeof a[end - 3] === "number" && a[end - 3] >= 0 && a[end - 3] <= 11 &&
           ScaleSnapScales.indexById(String(a[end - 2])) >= 0 && typeof a[end - 1] === "number") {
        tops.unshift({ root: a[end - 3], scaleId: String(a[end - 2]), pct: a[end - 1] });
        end -= 3;
    }
    var track = a.slice(0, end).join(" ") || "Audio";
    var key = "t:" + track;
    // One entry per Detect device (by track name). A clear only removes that device's own entry.
    if (tops.length === 0) { delete ss.audioByTrack[key]; }
    else { ss.audioByTrack[key] = { track: track, tops: tops, seq: ++ss.audioSeq }; }
    var shown = null;                                     // the most recent result still held
    for (var k in ss.audioByTrack) {
        if (ss.audioByTrack.hasOwnProperty(k) && (!shown || ss.audioByTrack[k].seq > shown.seq)) { shown = ss.audioByTrack[k]; }
    }
    if (shown === ss.audio) { return; }                   // a clear from another device: nothing to change
    ss.audio = shown;
    showAudio();
}

function showAudio() {
    if (!ss.audio) { sendText(OUT.AUDIO, "set", ""); return; }
    var t = ss.audio.tops[0], s = ScaleSnapScales.SCALES[ScaleSnapScales.indexById(t.scaleId)];
    sendText(OUT.AUDIO, "set", "Audio (" + ss.audio.track + "): " + ScaleSnapScales.NOTE_NAMES[t.root] + " " +
             s.name + " " + t.pct + "%");
}

function audioapply() {
    if (!ss.audio) { sendText(OUT.STATUS, "set", "No audio result"); return; }
    var t = ss.audio.tops[0];
    applyRootScale(t.root, t.scaleId);
    sendText(OUT.STATUS, "set", "Applied audio result");
}

// ------------------------------------------------------------------------------------ lifecycle

function ensureObjects() {
    if (!ss.detector) { ss.detector = new ScaleSnapDetect.Detector({ memory: 30 }); }
    if (!ss.favs) {
        var io = ScaleSnapFavorites.createDictIo(Dict, typeof File !== "undefined" ? File : null);
        ss.favs = new ScaleSnapFavorites.Favorites(io, validScaleId);
        ss.favs.load();
        ss.favSig = favSignature();
    }
}

function refreshAll() {
    ensureObjects();
    sendMap(true);
    updateKeyboard();
    updateInfo();
    updateStar();
    rebuildScaleMenu();
}

function loaded() {
    refreshAll();
    // Restored parameter values can arrive after this message: settle once more shortly after.
    if (!ss.initTask) { ss.initTask = new Task(refreshAll, this); }
    ss.initTask.cancel();
    ss.initTask.repeat(1, 400); // once, after 400 ms
}

function notifydeleted() {
    if (ss.tickTask) { ss.tickTask.cancel(); }
    if (ss.initTask) { ss.initTask.cancel(); }
}

ensureObjects();
