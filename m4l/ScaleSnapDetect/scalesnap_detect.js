/* Scale Snap Detect - [js] glue for the Max for Live AUDIO effect (ES5, legacy [js] object, Max 8).
 *
 * Audio is NOT touched here: plugin~ goes straight to plugout~. Analysis chain (all native MSP):
 *   mono sum -> [pfft~ ssd.spec 16384 4] -> magnitudes of 8192 bins in a buffer~ (ssd.spec.maxpat)
 *   mono sum -> [*~] -> [average~ 16384] -> [snapshot~ 250]  -> "level <mean square>"  (RMS gate)
 * This script runs at low priority and only wakes up on [qmetro 250] ticks (it is never called per sample):
 * it peeks the magnitude buffer, builds a chroma frame, updates the decaying average, and every
 * second tick scores all scales with the shared scorer (ScaleSnapDetect, eps 0.15) and updates the UI.
 *
 * It is concatenated after scales.js, detect.js and chroma.js into one file (dist/scalesnap_detect.js)
 * by m4l/tools/build_amxd.py, so those modules are plain globals here.
 *
 * jsarguments[1] = name of the magnitude buffer~ (the patcher passes ---spec, which Live makes device-local).
 *
 * Messages in (left inlet):
 *   loaded            device initialised (live.thisdevice)
 *   active n          device activated / deactivated in Live
 *   listen n | send n | memory n | gate dB | reset
 *   sr hz             sample rate (dspstate~ and [sig~ 1000] -> [mstosamps~] -> [snapshot~], whichever arrives)
 *   level ms          mean square of the mono sum, from [snapshot~] every 250 ms
 *   tick              [qmetro 250], only running while Listen is on
 * Outlets: 0 = global send "scalesnap.detect" (messages "result <track> <rootPc> <scaleId> <pct> ..."),
 *          1 = chroma multislider, 2..6 = result rows 1..5, 7 = "same notes", 8 = status, 9 = qmetro on/off.
 */
inlets = 1;
outlets = 10;

var OUT = { SEND: 0, CHROMA: 1, ROW1: 2, ROW2: 3, ROW3: 4, ROW4: 5, ROW5: 6, SAME: 7, STATUS: 8, TICK: 9 };

var TICK_MS = 250;
var EVAL_EVERY = 2;               // score + update the list every 2nd tick (500 ms)
var SEND_EVERY_SEC = 1;           // broadcast at most about once per second
var SILENCE_CLEAR_SEC = 8;        // after this long below the gate, tell Scale Snap the audio line is stale
var LEVEL_STALE_SEC = 1.5;        // no level message for this long: audio engine is not running
var NO_SPECTRUM_SEC = 2.5;        // gate open but the spectrum buffer stays empty: pfft~ is not writing
var MAX_DT = 1.0;

var sd = {
    listening: 1,
    send: 0,
    active: 1,
    gateDb: -50,
    sr: 0,                   // Hz; analysis waits until the patcher has reported it (a wrong rate would transpose the key)
    acc: null,
    bufName: "",
    buf: null,
    api: null,
    track: "Audio",
    level: 0,                // last mean square
    levelAt: 0,              // time of the last level message (0 = never)
    lastTick: 0,
    ticks: 0,
    lastSig: -1,             // spectrum checksum of the previous tick (detects frames that were not refreshed)
    emptyFor: 0,             // seconds the gate was open but the spectrum was empty
    pendingDt: 0,            // seconds of open gate not yet credited to a fresh frame
    problem: "",             // why the spectrum cannot be read, if it cannot
    silentFor: 0,
    sentClear: true,         // receivers currently have no audio line from us
    lastSendAt: -1000,
    groups: [],
    ready: false,
    message: ""
};

function nowSec() { return new Date().getTime() / 1000; }

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

function setStatus(text) {
    if (text !== sd.message) {
        sd.message = text;
        sendText(OUT.STATUS, "set", text);
    }
}

function ensureObjects() {
    if (!sd.acc) { sd.acc = new ScaleSnapChroma.Accumulator({ memory: ScaleSnapChroma.PARAMS.memorySeconds[1] }); }
    if (!sd.bufName && typeof jsarguments !== "undefined" && jsarguments.length > 1) { sd.bufName = String(jsarguments[1]); }
}

// ------------------------------------------------------------------------------------ track name

/** Name of the track this device sits on (one atom, never empty). Needs the Live API (after "loaded"). */
function trackName() {
    var name = "";
    try {
        if (!sd.api || String(sd.api.id) === "0") { sd.api = new LiveAPI("this_device canonical_parent"); }
        var v = sd.api.get("name");
        name = (v && v.length !== undefined && typeof v !== "string") ? String(v[0]) : String(v);
    } catch (e) {
        name = "";
    }
    name = name.replace(/[;,]/g, " ").replace(/\s+/g, " ").replace(/^ | $/g, "");
    if (name.length > 40) { name = name.substring(0, 40); }
    if (name.length === 0 || name === "undefined") { name = sd.track || "Audio"; }
    sd.track = name;
    return name;
}

// ------------------------------------------------------------------------------------ broadcast

function broadcast(groups) {
    var atoms = ScaleSnapChroma.resultAtoms(trackName(), groups);
    outlet(OUT.SEND, ["result"].concat(atoms));
    sd.sentClear = groups.length === 0;
    sd.lastSendAt = nowSec();
}

/** Tell the Scale Snap devices to drop our "Audio: ..." line. Only sends when something is showing. */
function clearBroadcast(force) {
    if (sd.sentClear && !force) { return; }
    broadcast([]);
}

// ------------------------------------------------------------------------------------ display

function showChroma() {
    var v = sd.acc.display(), out = ["set"], i;
    for (i = 0; i < 12; i++) { out.push(Math.round(v[i] * 1000) / 1000); }
    outlet(OUT.CHROMA, out);
}

function showGroups(groups) {
    sd.groups = groups;
    for (var i = 0; i < 5; i++) {
        if (i < groups.length) { sendText(OUT.ROW1 + i, "set", ScaleSnapDetect.formatGroup(groups[i])); }
        else { outlet(OUT.ROW1 + i, "set"); }
    }
    var same = groups.length ? ScaleSnapDetect.sameNotes(groups[0], 4) : [], labels = [], j;
    for (j = 0; j < same.length; j++) { labels.push(same[j].label); }
    sendText(OUT.SAME, "set", labels.length ? "same notes: " + labels.join(", ") : "");
}

function levelDb() {
    return sd.level > 1e-12 ? 10 * Math.log(sd.level) / Math.LN10 : -120;
}

// ------------------------------------------------------------------------------------ analysis

/** Magnitudes of the pfft~ frame, or null (sd.problem says why) when the buffer is not usable. */
function readSpectrum() {
    var bins = ScaleSnapChroma.PARAMS.bins;
    try {
        if (!sd.bufName) { sd.problem = "No buffer name (see Max console)"; return null; }
        if (!sd.buf) { sd.buf = new Buffer(sd.bufName); }
        var n = sd.buf.framecount();
        if (n < bins) { sd.problem = "Spectrum buffer too small"; return null; }
        var mag = sd.buf.peek(1, 0, bins);
        sd.problem = "";
        return mag;
    } catch (e) {
        sd.buf = null;
        sd.problem = "No spectrum buffer";
        return null;
    }
}

function spectrumSignature(mag) {
    var k, s = 0, n = mag.length;
    for (k = 0; k < n; k += 7) { s += mag[k]; }
    return s;
}

function listenedSec() { return sd.ticks * TICK_MS / 1000; }

/** The one-line status: the best result, or what is missing. */
function statusFor(r, open, levelAlive) {
    if (!sd.sr) { return "Waiting for the sample rate"; }
    if (sd.problem) { return sd.problem; }
    if (sd.emptyFor > NO_SPECTRUM_SEC) { return "No spectrum (pfft~ not writing)"; }
    if (!levelAlive) { return listenedSec() > 3 ? "No audio level (is audio running?)" : "Listening..."; }
    if (r.ready) { return ScaleSnapDetect.formatGroup(r.groups[0]) + (open ? "" : " (silence)"); }
    if (sd.acc.voiced > 0) { return open ? "Need more audio" : "Need more audio (silence)"; }
    return open ? "Listening..." : "Listening... (silence)";
}

function tick() {
    if (!sd.listening || !sd.active) { return; }
    var t = nowSec();
    var dt = sd.lastTick > 0 ? t - sd.lastTick : TICK_MS / 1000;
    if (dt > MAX_DT) { dt = MAX_DT; }
    if (dt < 0) { dt = 0; }
    sd.lastTick = t;
    sd.ticks++;

    var db = levelDb();
    var levelAlive = sd.levelAt > 0 && (t - sd.levelAt) <= LEVEL_STALE_SEC;
    var open = levelAlive && db >= sd.gateDb && sd.sr > 0;

    if (open) {
        sd.silentFor = 0;
        sd.pendingDt += dt;
        var mag = readSpectrum();
        if (mag) {
            var sig = spectrumSignature(mag);
            if (sig === 0) {
                sd.emptyFor += dt;
            } else {
                sd.emptyFor = 0;
                if (sig !== sd.lastSig) {            // skip frames that pfft~ did not refresh since the last tick
                    sd.lastSig = sig;
                    var frame = ScaleSnapChroma.chromaFromSpectrum(mag, sd.sr, { tuningCents: sd.acc.tuningCents() });
                    if (frame) { sd.acc.add(frame, Math.min(sd.pendingDt, MAX_DT)); }
                    sd.pendingDt = 0;
                }
            }
        }
    } else {
        sd.silentFor += dt;
        sd.pendingDt = 0;
        sd.emptyFor = 0;
        sd.acc.fade(dt);
        if (sd.silentFor >= SILENCE_CLEAR_SEC) { clearBroadcast(false); }
    }

    showChroma();

    if (sd.ticks % EVAL_EVERY === 0) {
        var r = sd.acc.result();
        sd.ready = r.ready;
        showGroups(r.ready ? r.groups : []);
        setStatus(statusFor(r, open, levelAlive));
        if (r.ready && sd.send && open && (t - sd.lastSendAt) >= SEND_EVERY_SEC) { broadcast(r.groups); }
    }
}

// ------------------------------------------------------------------------------------ messages

function setTick(on) { outlet(OUT.TICK, on ? 1 : 0); }

function listen(v) {
    ensureObjects();
    sd.listening = v ? 1 : 0;
    setTick(sd.listening && sd.active);
    if (sd.listening) {
        sd.lastTick = 0;
        sd.silentFor = 0;
        setStatus("Listening...");
    } else {
        setStatus("Listen is off");
        clearBroadcast(false);
    }
}

function send(v) {
    sd.send = v ? 1 : 0;
    if (sd.send) {
        sd.lastSendAt = -1000;                       // next evaluation broadcasts right away
    } else {
        clearBroadcast(false);
    }
}

function memory(i) {
    ensureObjects();
    var secs = ScaleSnapChroma.PARAMS.memorySeconds;
    i = Math.floor(Number(i));
    if (isNaN(i)) { i = 1; }
    sd.acc.setMemory(secs[Math.max(0, Math.min(secs.length - 1, i))]);
}

function gate(db) {
    db = Number(db);
    if (!isNaN(db)) { sd.gateDb = Math.max(-100, Math.min(0, db)); }
}

function sr(hz) {
    hz = Number(hz);
    if (hz >= 8000 && hz <= 384000) { sd.sr = hz; }   // dspstate~ also reports on/off and vector sizes: ignored
}

function level(ms) {
    ms = Number(ms);
    sd.level = isNaN(ms) || ms < 0 ? 0 : ms;
    sd.levelAt = nowSec();
}

function active(v) {
    sd.active = v ? 1 : 0;
    setTick(sd.listening && sd.active);
    if (!sd.active) {
        clearBroadcast(false);
        setStatus("Device is off");
    } else {
        sd.lastTick = 0;
        setStatus(sd.listening ? "Listening..." : "Listen is off");
    }
}

function reset() {
    ensureObjects();
    sd.acc.reset();
    sd.lastSig = -1;
    sd.emptyFor = 0;
    sd.silentFor = 0;
    sd.pendingDt = 0;
    showChroma();
    showGroups([]);
    sd.ready = false;
    clearBroadcast(false);
    setStatus(sd.listening ? "Listening..." : "Reset");
}

function loaded() {
    ensureObjects();
    trackName();
    showChroma();
    showGroups([]);
    sd.message = "";
    setStatus(sd.listening ? "Listening..." : "Listen is off");
    setTick(sd.listening && sd.active);
}

function notifydeleted() {
    // outlets may already be gone: use the global bus directly
    if (!sd.sentClear) {
        messnamed("scalesnap.detect", "result", ScaleSnapChroma.resultAtoms(sd.track, [])[0]);
        sd.sentClear = true;
    }
}

ensureObjects();
