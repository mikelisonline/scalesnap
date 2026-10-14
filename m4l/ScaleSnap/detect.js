/* Scale Snap - key/scale detection (ES5; Max [js] legacy object and Node).
 *
 * Scores every library scale x 12 roots against a weighted pitch-class histogram.
 * Formula (see docs in m4l/README.md):
 *   p = h / sum(h);  q = b / sum(b) (uniform if no bass data)
 *   C     = sum over d in mask of p[(r+d)%12]                        in-scale coverage
 *   Lset  = C*ln((1-eps)/k) + (1-C)*ln(eps/(12-k))                   eps = 0.05 MIDI, 0.15 audio
 *   R     = pearson(rotate(p, r), profile_s)                          tonic/profile fit
 *   B     = q[r]                                                      bass weight on the root
 *   Score = Lset + 0.30*R + 0.30*B + prior_s
 * Scales with identical masks count once per tonic (the best-known name is kept). Candidates with
 * the same absolute pitch set are grouped; P = softmax(Score/tau) and a
 * group's confidence is the sum of P over its members. Chromatic (k = 12) is excluded.
 *
 * Used by the MIDI device (this file) and by the future audio "Scale Snap Detect" device,
 * which feeds chroma/bass vectors into detectFromHistogram() with eps = 0.15.
 */
var ScaleSnapDetect = (function () {
    var Scales = (typeof ScaleSnapScales !== "undefined") ? ScaleSnapScales : require("./scales.js");

    var W_PROFILE = 0.30;
    var W_BASS = 0.30;
    var TAU = 0.10;
    var TIE_EPS = 1e-9;
    var MAX_NOTE_SECONDS = 4;

    // Small bonus for the scales people actually play (by stable scale id).
    var PRIORS = {
        major: 0.06,
        natural_minor: 0.06,
        dorian: 0.03, phrygian: 0.03, lydian: 0.03, mixolydian: 0.03, locrian: 0.03,
        harmonic_minor: 0.03, melodic_minor: 0.03,
        major_pentatonic: 0.03, minor_pentatonic: 0.03, blues: 0.03
    };

    // The well-known names win label ties between scales that have identical notes (for example
    // Phrygian Dominant vs. the Carnatic melakarta of the same notes). Does not change any score.
    var CANONICAL = {
        major: 1, natural_minor: 1, dorian: 1, phrygian: 1, lydian: 1, mixolydian: 1, locrian: 1,
        harmonic_minor: 1, melodic_minor: 1, phrygian_dominant: 1, major_pentatonic: 1,
        minor_pentatonic: 1, blues: 1, harmonic_major: 1, whole_tone: 1
    };

    function priorFor(scale) { return PRIORS.hasOwnProperty(scale.id) ? PRIORS[scale.id] : 0; }
    function canonicalFor(scale) { return CANONICAL.hasOwnProperty(scale.id) ? 1 : 0; }

    /** Profile weights for tonic fit: root 1.0, fifth 0.8, third 0.7, other scale notes 0.45, outside 0.1. */
    function profileFor(mask) {
        var t = [];
        var d;
        for (d = 0; d < 12; d++) { t.push(((mask >> d) & 1) ? 0.45 : 0.1); }
        for (d = 3; d <= 4; d++) { if ((mask >> d) & 1) { t[d] = 0.7; } }
        if ((mask >> 7) & 1) { t[7] = 0.8; }
        t[0] = 1.0;
        return t;
    }

    function pearson(a, b) {
        var ma = 0, mb = 0, i;
        for (i = 0; i < 12; i++) { ma += a[i]; mb += b[i]; }
        ma /= 12; mb /= 12;
        var num = 0, da = 0, db = 0;
        for (i = 0; i < 12; i++) {
            num += (a[i] - ma) * (b[i] - mb);
            da += (a[i] - ma) * (a[i] - ma);
            db += (b[i] - mb) * (b[i] - mb);
        }
        var den = Math.sqrt(da) * Math.sqrt(db);
        return den > 0 ? num / den : 0;
    }

    function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; } return s; }

    function rotateMask(mask, root) {
        var out = 0;
        for (var d = 0; d < 12; d++) { if ((mask >> d) & 1) { out |= 1 << ((root + d) % 12); } }
        return out;
    }

    /** Library scales that take part in detection (Chromatic excluded). */
    function defaultScales() {
        var out = [];
        for (var i = 0; i < Scales.SCALES.length; i++) {
            if (Scales.popcount(Scales.SCALES[i].mask) < 12) { out.push(Scales.SCALES[i]); }
        }
        return out;
    }

    // Candidate ordering: score, then smaller k, higher prior, canonical name, library index, root.
    function betterThan(a, b) {
        if (Math.abs(a.score - b.score) > TIE_EPS) { return a.score > b.score; }
        if (a.k !== b.k) { return a.k < b.k; }
        if (a.prior !== b.prior) { return a.prior > b.prior; }
        if (a.canonical !== b.canonical) { return a.canonical > b.canonical; }
        if (a.scaleIndex !== b.scaleIndex) { return a.scaleIndex < b.scaleIndex; }
        return a.root < b.root;
    }

    function compare(a, b) { return betterThan(a, b) ? -1 : (betterThan(b, a) ? 1 : 0); }

    /** Score every (scale, root). Returns candidates sorted best first, or [] if h is empty. */
    function scoreCandidates(h, b, opts) {
        opts = opts || {};
        var eps = opts.eps !== undefined ? opts.eps : 0.05;
        var scales = opts.scales || defaultScales();
        var sh = sum(h);
        if (!(sh > 0)) { return []; }
        var p = [], q = [], i;
        for (i = 0; i < 12; i++) { p.push(h[i] / sh); }
        var sb = b ? sum(b) : 0;
        for (i = 0; i < 12; i++) { q.push(sb > 0 ? b[i] / sb : 1 / 12); }

        var cands = [];
        for (var si = 0; si < scales.length; si++) {
            var s = scales[si];
            var k = Scales.popcount(s.mask);
            var prof = profileFor(s.mask);
            var prior = priorFor(s);
            var canonical = canonicalFor(s);
            var idx = s.index !== undefined ? s.index : Scales.indexById(s.id);
            for (var r = 0; r < 12; r++) {
                var C = 0, rot = [], d;
                for (d = 0; d < 12; d++) { if ((s.mask >> d) & 1) { C += p[(r + d) % 12]; } }
                for (i = 0; i < 12; i++) { rot.push(p[(r + i) % 12]); }
                var L = C * Math.log((1 - eps) / k) + (1 - C) * Math.log(eps / (12 - k));
                var R = pearson(rot, prof);
                var score = L + W_PROFILE * R + W_BASS * q[r] + prior;
                cands.push({
                    score: score, scaleIndex: idx, scaleId: s.id, name: s.name, root: r, k: k,
                    prior: prior, canonical: canonical, set: rotateMask(s.mask, r), mask: s.mask
                });
            }
        }
        cands.sort(compare);

        // Scales that share a mask (aliases such as Aeolian / Natural Minor) are one hypothesis for a
        // given tonic: keep the best-named one so aliases do not inflate a pitch set's confidence.
        var unique = [], seen = {};
        for (i = 0; i < cands.length; i++) {
            var key = cands[i].mask + ":" + cands[i].root;
            if (!seen[key]) { seen[key] = true; unique.push(cands[i]); }
        }
        return unique;
    }

    function labelOf(c) { return Scales.NOTE_NAMES[c.root] + " " + c.name; }

    /**
     * Group candidates by pitch set and return the top groups.
     * Each group: {set, conf (0..1), pct (rounded %), label, root, scaleId, scaleIndex, name, score,
     *              members: all candidates of the group, best first}
     */
    function detectFromHistogram(h, b, opts) {
        opts = opts || {};
        var maxGroups = opts.maxGroups || 5;
        var cands = scoreCandidates(h, b, opts);
        if (cands.length === 0) { return { groups: [], groupCount: 0 }; }

        var top = cands[0].score;
        var z = 0, i;
        for (i = 0; i < cands.length; i++) {
            cands[i].p = Math.exp((cands[i].score - top) / TAU);
            z += cands[i].p;
        }

        var groups = [], bySet = {};
        for (i = 0; i < cands.length; i++) {
            var c = cands[i];
            c.p /= z;
            var g = bySet[c.set];
            if (!g) {
                g = { set: c.set, conf: 0, members: [] };
                bySet[c.set] = g;
                groups.push(g); // groups start in order of their best member
            }
            g.conf += c.p;
            g.members.push(c);
        }

        // Stable sort by confidence (ties keep best-member order).
        var order = [];
        for (i = 0; i < groups.length; i++) { order.push({ g: groups[i], i: i }); }
        order.sort(function (x, y) {
            if (Math.abs(x.g.conf - y.g.conf) > 1e-12) { return y.g.conf - x.g.conf; }
            return x.i - y.i;
        });

        var result = [];
        for (i = 0; i < order.length && i < maxGroups; i++) {
            var gg = order[i].g, best = gg.members[0];
            result.push({
                set: gg.set, conf: gg.conf, pct: Math.round(gg.conf * 100),
                label: labelOf(best), root: best.root, scaleId: best.scaleId,
                scaleIndex: best.scaleIndex, name: best.name, score: best.score,
                members: gg.members
            });
        }
        return { groups: result, groupCount: groups.length };
    }

    /** "same notes" entries of a group (everything but the displayed best), de-duplicated by label. */
    function sameNotes(group, limit) {
        var out = [], seen = {};
        seen[labelOf(group.members[0])] = true;
        for (var i = 1; i < group.members.length && out.length < (limit || 5); i++) {
            var l = labelOf(group.members[i]);
            if (!seen[l]) {
                seen[l] = true;
                out.push({ label: l, root: group.members[i].root, scaleId: group.members[i].scaleId,
                           scaleIndex: group.members[i].scaleIndex });
            }
        }
        return out;
    }

    function formatGroup(group) { return group.label + " " + group.pct + "%"; }

    function noteWeight(vel) { return 0.5 + 0.5 * vel / 127; }

    // ------------------------------------------------------------------ live MIDI listening

    var MEMORY_SECONDS = [10, 30, 0]; // Short, Medium (default), Hold (0 = no decay)

    /**
     * Accumulates played notes. Times are seconds (any origin, must not go backwards).
     * opts: memory (seconds, 0 = hold), eps, minNotes, minPitchClasses, minSeconds
     */
    function Detector(opts) {
        opts = opts || {};
        this.memory = opts.memory !== undefined ? opts.memory : 30;
        this.eps = opts.eps !== undefined ? opts.eps : 0.05;
        this.minNotes = opts.minNotes !== undefined ? opts.minNotes : 8;
        this.minPitchClasses = opts.minPitchClasses !== undefined ? opts.minPitchClasses : 4;
        this.minSeconds = opts.minSeconds !== undefined ? opts.minSeconds : 3;
        this.reset();
    }

    Detector.prototype.reset = function () {
        this.h = []; this.b = [];
        for (var i = 0; i < 12; i++) { this.h.push(0); this.b.push(0); }
        this.held = {};      // pitch -> {on, vel, bass, credited}
        this.noteCount = 0;
        this.seconds = 0;    // accumulated (credited) note duration
        this.seen = {};      // pitch classes ever played since reset
        this.last = null;    // time of last advance
    };

    Detector.prototype.setMemory = function (seconds) { this.memory = seconds; };

    Detector.prototype.advance = function (t) {
        if (this.last === null) { this.last = t; }
        var dt = t - this.last;
        if (dt < 0) { dt = 0; }
        if (dt > 0 && this.memory > 0) {
            var f = Math.pow(2, -dt / this.memory), i;
            for (i = 0; i < 12; i++) { this.h[i] *= f; this.b[i] *= f; }
        }
        this.last = t;
        for (var key in this.held) {
            if (this.held.hasOwnProperty(key)) { this.credit(parseInt(key, 10), t); }
        }
    };

    Detector.prototype.credit = function (pitch, t) {
        var n = this.held[pitch];
        var dur = Math.min(t - n.on, MAX_NOTE_SECONDS);
        var inc = dur - n.credited;
        if (inc <= 0) { return; }
        n.credited = dur;
        var w = inc * noteWeight(n.vel), pc = pitch % 12;
        this.h[pc] += w;
        if (n.bass) { this.b[pc] += w; }
        this.seconds += inc;
    };

    Detector.prototype.noteOn = function (pitch, vel, t) {
        if (this.held[pitch]) { this.noteOff(pitch, t); }
        this.advance(t);
        var bass = true;
        for (var key in this.held) {
            if (this.held.hasOwnProperty(key) && parseInt(key, 10) < pitch) { bass = false; }
        }
        this.held[pitch] = { on: t, vel: vel, bass: bass, credited: 0 };
        this.noteCount++;
        this.seen[pitch % 12] = true;
    };

    Detector.prototype.noteOff = function (pitch, t) {
        if (!this.held[pitch]) { return; }
        this.advance(t);
        delete this.held[pitch];
    };

    /** Call periodically (about every 250 ms) while listening so held notes keep counting. */
    Detector.prototype.tick = function (t) { this.advance(t); };

    Detector.prototype.pitchClassCount = function () {
        var n = 0;
        for (var pc in this.seen) { if (this.seen.hasOwnProperty(pc)) { n++; } }
        return n;
    };

    /** {ready, message, groups} - groups only when enough data has been heard. */
    Detector.prototype.result = function (t) {
        if (t !== undefined) { this.advance(t); }
        if (this.noteCount < this.minNotes || this.pitchClassCount() < this.minPitchClasses ||
            this.seconds < this.minSeconds) {
            return { ready: false, groups: [], message: "Listening... " + this.noteCount +
                     (this.noteCount === 1 ? " note" : " notes") };
        }
        var r = detectFromHistogram(this.h, this.b, { eps: this.eps });
        return { ready: r.groups.length > 0, groups: r.groups, message: "" };
    };

    // ------------------------------------------------------------------ clip analysis

    /**
     * notes: [{pitch, start_time, duration (beats), velocity, mute?}] as returned by the Live API.
     * Needs >= 4 notes and >= 3 pitch classes.
     */
    function analyzeNotes(notes, opts) {
        opts = opts || {};
        var h = [], b = [], i, j;
        for (i = 0; i < 12; i++) { h.push(0); b.push(0); }
        var used = [], pcs = {}, count = 0;
        for (i = 0; i < notes.length; i++) { if (!notes[i].mute) { used.push(notes[i]); } }
        for (i = 0; i < used.length; i++) {
            var n = used[i], dur = Math.min(n.duration, MAX_NOTE_SECONDS);
            var w = dur * noteWeight(n.velocity === undefined ? 100 : n.velocity);
            var pc = n.pitch % 12;
            if (!(w > 0)) { continue; }
            h[pc] += w;
            pcs[pc] = true;
            count++;
            var lowest = true; // lowest of the notes sounding at this onset
            for (j = 0; j < used.length && lowest; j++) {
                var m = used[j];
                if (m !== n && m.pitch < n.pitch && m.start_time <= n.start_time + 1e-6 &&
                    m.start_time + m.duration > n.start_time + 1e-6) { lowest = false; }
            }
            if (lowest) { b[pc] += w; }
        }
        var pcCount = 0;
        for (var k in pcs) { if (pcs.hasOwnProperty(k)) { pcCount++; } }
        if (count < 4 || pcCount < 3) {
            return { ready: false, groups: [], message: "Not enough notes" };
        }
        var r = detectFromHistogram(h, b, { eps: opts.eps !== undefined ? opts.eps : 0.05 });
        return { ready: true, groups: r.groups, message: "" };
    }

    return {
        PRIORS: PRIORS,
        TAU: TAU,
        MEMORY_SECONDS: MEMORY_SECONDS,
        defaultScales: defaultScales,
        profileFor: profileFor,
        scoreCandidates: scoreCandidates,
        detectFromHistogram: detectFromHistogram,
        sameNotes: sameNotes,
        formatGroup: formatGroup,
        Detector: Detector,
        analyzeNotes: analyzeNotes
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapDetect;
}
