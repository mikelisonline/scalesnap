/* Scale Snap Detect - audio chromagram (ES5; Max [js] legacy object and Node).
 *
 * Turns one magnitude spectrum frame (what the pfft~ sub-patcher ssd.spec.maxpat leaves in the
 * buffer~) into a 12-bin pitch-class vector ("HPCP-lite", after Gomez / Essentia), keeps a decaying
 * average of those frames, and hands the average to the SAME scorer the MIDI device uses
 * (ScaleSnapDetect.detectFromHistogram, eps = 0.15 for audio). Nothing here runs per sample.
 *
 * Per frame:
 *   1. peaks = local maxima of the magnitude between F_MIN and F_MAX that are within 60 dB of the frame's
 *      largest magnitude; frequency refined by parabolic interpolation on log magnitude;
 *      amplitude a = log10(1 + 100 * mag / maxMag)
 *   2. for harmonics h = 1..4 (weights 1, .6, .36, .22): f0 = f / h, m = 12*log2(f0 / ref) + 69 (ref = 440 Hz
 *      corrected by the running tuning estimate), and a*w_h is split between the two nearest pitch
 *      classes with cos^2(pi*d/2), d = distance in semitones (|d| <= 1)
 *   3. peaks below 250 Hz also feed the bass vector (h = 1 only)
 *   4. chroma and bass are divided by the chroma sum, so every frame has the same weight
 * Over time: h <- h * exp(-dt/tau) + chroma * dt ("Memory" menu: tau 8 s / 20 s / 60 s / hold).
 * The result is withheld until 4 s of voiced frames have been added.
 *
 * Tuning: peaks below 1.5 kHz vote with their distance to the nearest equal-tempered semitone (circular
 * mean, weighted by a). The estimate is used as the reference only when it is more than 10 cents off.
 *
 * Needs ScaleSnapDetect (detect.js) loaded first.
 */
var ScaleSnapChroma = (function () {
    var Detect = (typeof ScaleSnapDetect !== "undefined") ? ScaleSnapDetect : require("../ScaleSnap/detect.js");
    var Scales = (typeof ScaleSnapScales !== "undefined") ? ScaleSnapScales : require("../ScaleSnap/scales.js");

    // Everything the patch and the offline check have to agree on lives here (tests compare these
    // numbers with the pfft~ arguments in the .maxpat files).
    var PARAMS = {
        fftSize: 16384,          // pfft~ frame size; 8192 magnitude bins are written to the buffer~
        overlap: 4,              // pfft~ overlap: hop = fftSize / overlap samples
        bins: 8192,              // fftSize / 2
        fMin: 60,                // Hz, lowest peak used (44.1 / 48 kHz)
        fMinHighSr: 100,         // Hz, used when the sample rate is above 60 kHz (bins are wider)
        highSr: 60000,
        fMax: 5000,              // Hz, highest peak used
        bassMax: 250,            // Hz, peaks below this also feed the bass vector
        rangeDb: 60,             // peaks weaker than the frame maximum minus this are ignored
        compress: 100,           // a = log10(1 + compress * mag / maxMag)
        harmonics: [1.0, 0.6, 0.36, 0.22],
        tuneMax: 1500,           // Hz, peaks above this do not vote for the tuning
        tuneThresholdCents: 10,
        eps: 0.15,               // leakage of the scorer for audio (MIDI uses 0.05)
        minVoicedSeconds: 4,
        bassMinFraction: 0.03,   // bass vector is ignored (uniform prior) below this share of the energy
        memorySeconds: [8, 20, 60, 0]   // Short, Medium (default), Long, Hold (0 = no decay)
    };

    var TINY = 1e-30;
    var TWO_PI = 2 * Math.PI;

    function log2(x) { return Math.log(x) / Math.LN2; }

    /** Adds weight w at fractional MIDI pitch `mid` to a 12-bin vector (cos^2 split between the two nearest classes). */
    function spread(vec, mid, w) {
        var fl = Math.floor(mid);
        var d = mid - fl;
        var c0 = ((fl % 12) + 12) % 12;
        var c1 = (c0 + 1) % 12;
        var k = Math.cos(Math.PI * d);
        vec[c0] += w * (1 + k) * 0.5;   // cos^2(pi d / 2)
        vec[c1] += w * (1 - k) * 0.5;   // cos^2(pi (1 - d) / 2)
    }

    /**
     * mag: magnitudes of bins 0..N/2-1 (Array or typed array); sr: sample rate in Hz.
     * opts: tuningCents (reference correction, default 0), fftSize (default PARAMS.fftSize).
     * Returns null when the frame has no usable peak, else
     *   { chroma[12], bass[12] (both divided by the chroma sum), tx, ty (tuning votes, same scale), peaks, maxMag, sumMag }
     */
    function chromaFromSpectrum(mag, sr, opts) {
        opts = opts || {};
        var P = PARAMS;
        var n = opts.fftSize || P.fftSize;
        var binHz = sr / n;
        var fMin = sr > P.highSr ? P.fMinHighSr : P.fMin;
        var kLo = Math.max(2, Math.ceil(fMin / binHz));
        var kHi = Math.min(Math.floor(P.fMax / binHz), mag.length - 2);
        if (!(kHi > kLo)) { return null; }
        var tune = opts.tuningCents || 0;
        var refHz = 440 * Math.pow(2, tune / 1200);

        var k, maxMag = 0, sumMag = 0, m;
        for (k = kLo; k <= kHi; k++) {
            m = mag[k];
            sumMag += m;
            if (m > maxMag) { maxMag = m; }
        }
        if (!(maxMag > 0)) { return null; }
        var thr = maxMag * Math.pow(10, -P.rangeDb / 20);

        var chroma = [], bass = [], i;
        for (i = 0; i < 12; i++) { chroma.push(0); bass.push(0); }
        var tx = 0, ty = 0, peaks = 0;

        for (k = kLo; k <= kHi; k++) {
            m = mag[k];
            if (!(m > thr && m > mag[k - 1] && m >= mag[k + 1])) { continue; }
            var a = Math.log(mag[k - 1] + TINY), b = Math.log(m + TINY), c = Math.log(mag[k + 1] + TINY);
            var den = a - 2 * b + c;
            var p = den < 0 ? 0.5 * (a - c) / den : 0;
            if (p > 0.5) { p = 0.5; }
            if (p < -0.5) { p = -0.5; }
            var f = (k + p) * binHz;
            var amp = Math.log(1 + P.compress * m / maxMag) / Math.LN10;
            peaks++;
            for (i = 0; i < P.harmonics.length; i++) {
                spread(chroma, 12 * log2(f / (i + 1) / refHz) + 69, amp * P.harmonics[i]);
            }
            if (f < P.bassMax) { spread(bass, 12 * log2(f / refHz) + 69, amp); }
            if (f <= P.tuneMax) {
                var m1 = 12 * log2(f / 440) + 69;               // raw pitch, independent of the correction
                var ang = TWO_PI * (m1 - Math.round(m1));
                tx += amp * Math.cos(ang);
                ty += amp * Math.sin(ang);
            }
        }
        var total = 0;
        for (i = 0; i < 12; i++) { total += chroma[i]; }
        if (!(total > 0)) { return null; }
        for (i = 0; i < 12; i++) { chroma[i] /= total; bass[i] /= total; }
        return { chroma: chroma, bass: bass, tx: tx / total, ty: ty / total, peaks: peaks, maxMag: maxMag, sumMag: sumMag };
    }

    function zeros() { var a = []; for (var i = 0; i < 12; i++) { a.push(0); } return a; }
    function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; } return s; }

    /**
     * Decaying average of chroma frames. memory = time constant in seconds (0 = hold, plain mean).
     * opts: memory (default 20), minVoiced (default 4 s), eps (default 0.15)
     */
    function Accumulator(opts) {
        opts = opts || {};
        this.memory = opts.memory !== undefined ? opts.memory : 20;
        this.minVoiced = opts.minVoiced !== undefined ? opts.minVoiced : PARAMS.minVoicedSeconds;
        this.eps = opts.eps !== undefined ? opts.eps : PARAMS.eps;
        this.reset();
    }

    Accumulator.prototype.reset = function () {
        this.h = zeros();
        this.b = zeros();
        this.tx = 0;
        this.ty = 0;
        this.voiced = 0;     // seconds of frames added since reset
        this.frames = 0;
    };

    Accumulator.prototype.setMemory = function (seconds) { this.memory = seconds; };

    /** Adds one frame (from chromaFromSpectrum) that represents dt seconds of audio. */
    Accumulator.prototype.add = function (frame, dt) {
        if (!frame || !(dt > 0)) { return; }
        var d = this.memory > 0 ? Math.exp(-dt / this.memory) : 1, i;
        for (i = 0; i < 12; i++) {
            this.h[i] = this.h[i] * d + frame.chroma[i] * dt;
            this.b[i] = this.b[i] * d + frame.bass[i] * dt;
        }
        this.tx = this.tx * d + frame.tx * dt;
        this.ty = this.ty * d + frame.ty * dt;
        this.voiced += dt;
        this.frames++;
    };

    /** Time passes without usable audio: old frames fade as usual (nothing is added). */
    Accumulator.prototype.fade = function (dt) {
        if (!(dt > 0) || !(this.memory > 0)) { return; }
        var d = Math.exp(-dt / this.memory), i;
        for (i = 0; i < 12; i++) { this.h[i] *= d; this.b[i] *= d; }
        this.tx *= d;
        this.ty *= d;
    };

    /** Tuning offset in cents relative to A = 440 Hz (0 unless more than 10 cents off). */
    Accumulator.prototype.tuningCents = function () {
        var mag = Math.sqrt(this.tx * this.tx + this.ty * this.ty);
        if (!(mag > 0) || !(sum(this.h) > 0) || mag < 0.15 * sum(this.h)) { return 0; }   // votes cancel out: no estimate
        var cents = Math.atan2(this.ty, this.tx) / TWO_PI * 100;
        return Math.abs(cents) > PARAMS.tuneThresholdCents ? cents : 0;
    };

    /** Average chroma, scaled so that the largest bin is 1 (12 zeros when empty). */
    Accumulator.prototype.display = function () {
        var mx = 0, i, out = [];
        for (i = 0; i < 12; i++) { if (this.h[i] > mx) { mx = this.h[i]; } }
        for (i = 0; i < 12; i++) { out.push(mx > 0 ? this.h[i] / mx : 0); }
        return out;
    };

    /** {ready, message, groups (best first, as detectFromHistogram), groupCount} */
    Accumulator.prototype.result = function () {
        var sh = sum(this.h);
        if (this.voiced < this.minVoiced || !(sh > 0)) {
            return { ready: false, message: "Need more audio", groups: [], groupCount: 0 };
        }
        var bass = sum(this.b) >= PARAMS.bassMinFraction * sh ? this.b : null;
        var r = Detect.detectFromHistogram(this.h, bass, { eps: this.eps, maxGroups: 5 });
        return { ready: r.groups.length > 0, message: r.groups.length > 0 ? "" : "Need more audio",
                 groups: r.groups, groupCount: r.groupCount };
    };

    /**
     * Message for the global send "scalesnap.detect" (see m4l-shared-interface):
     *   result <trackName> <rootPc> <scaleId> <pct> [... up to 3 triplets]
     * Returns the atoms after the selector "result": [trackName, root, id, pct, ...]; no groups = clear message.
     */
    function resultAtoms(trackName, groups) {
        var out = [trackName && String(trackName).length ? String(trackName) : "Audio"];
        for (var i = 0; i < groups.length && i < 3; i++) {
            out.push(groups[i].root, groups[i].scaleId, Math.max(0, Math.min(100, Math.round(groups[i].pct))));
        }
        return out;
    }

    return {
        PARAMS: PARAMS,
        chromaFromSpectrum: chromaFromSpectrum,
        Accumulator: Accumulator,
        resultAtoms: resultAtoms,
        spread: spread,
        NOTE_NAMES: Scales.NOTE_NAMES
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapChroma;
}
