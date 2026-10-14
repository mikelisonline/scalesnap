"use strict";
/* Test-only audio helpers: a radix-2 FFT, a tiny additive synthesiser and "pfft~ frames" (Hann window,
 * magnitude of the first N/2 bins). This is what the Max patch computes natively. */

function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) { j ^= bit; }
        j ^= bit;
        if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const a = i + k, b = i + k + len / 2;
                const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
                re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
                const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
            }
        }
    }
}

const hannCache = {};
function hann(n) {
    if (!hannCache[n]) {
        const w = new Float64Array(n);
        for (let i = 0; i < n; i++) { w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n); }
        hannCache[n] = w;
    }
    return hannCache[n];
}

/** Magnitudes (length n/2) of the Hann-windowed frame x[start .. start+n). */
function magnitudes(x, start, n) {
    const re = new Float64Array(n), im = new Float64Array(n), w = hann(n);
    for (let i = 0; i < n; i++) { re[i] = x[start + i] * w[i]; }
    fft(re, im);
    const mag = new Array(n / 2);
    for (let k = 0; k < n / 2; k++) { mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]); }
    return mag;
}

function midiHz(m, cents) { return 440 * Math.pow(2, (m - 69 + (cents || 0) / 100) / 12); }

/** notes: [{midi, t0, dur, amp}] (seconds). harmonics: amplitude of partial 1, 2, 3 ... */
function synth(notes, seconds, sr, opts) {
    opts = opts || {};
    const harm = opts.harmonics || [1, 0.5, 0.33, 0.25];
    const x = new Float32Array(Math.floor(seconds * sr));
    notes.forEach((n) => {
        const f = midiHz(n.midi, opts.cents);
        const s0 = Math.floor(n.t0 * sr), s1 = Math.min(x.length, Math.floor((n.t0 + n.dur) * sr));
        for (let i = s0; i < s1; i++) {
            const t = i / sr, env = Math.min(1, (i - s0) / (0.01 * sr)) * Math.min(1, (s1 - i) / (0.02 * sr));
            let v = 0;
            for (let h = 0; h < harm.length; h++) { if (f * (h + 1) < sr / 2) { v += harm[h] * Math.sin(2 * Math.PI * f * (h + 1) * t); } }
            x[i] += n.amp * env * v;
        }
    });
    return x;
}

/** Spectra every `hop` samples. */
function spectra(x, n, hop) {
    const out = [];
    for (let s = 0; s + n <= x.length; s += hop) { out.push(magnitudes(x, s, n)); }
    return out;
}

/** Repeats a pitch list: pitches[i] at t0 + i*step, `rounds` times (each round is pitches.length*step long). */
function melody(pitches, step, rounds, amp, t0) {
    const notes = [];
    for (let r = 0; r < rounds; r++) {
        pitches.forEach((m, i) => notes.push({ midi: m, t0: (t0 || 0) + (r * pitches.length + i) * step, dur: step * 0.95, amp: amp }));
    }
    return notes;
}

/** Ready-made test signals (10 s unless said otherwise). */
const SCENES = {
    // A minor triad (A3 C4 E4 held) + an A minor pentatonic line on top
    aMinorPent: (seconds) => [57, 60, 64].map((m) => ({ midi: m, t0: 0, dur: seconds, amp: 0.25 }))
        .concat(melody([69, 72, 74, 76, 79, 76, 74, 72], 0.125, Math.ceil(seconds), 0.2)),
    cMajorScale: (seconds) => melody([60, 62, 64, 65, 67, 69, 71, 72], 0.2, Math.ceil(seconds / 1.6), 0.3)
        .concat([{ midi: 36, t0: 0, dur: seconds, amp: 0.3 }]),
    eFrygianDom: (seconds) => melody([64, 65, 68, 69, 71, 72, 74, 76], 0.2, Math.ceil(seconds / 1.6), 0.3)
        .concat([{ midi: 40, t0: 0, dur: seconds, amp: 0.3 }]),
    fSharpMajor: (seconds) => melody([66, 68, 70, 71, 73, 75, 77, 78], 0.2, Math.ceil(seconds / 1.6), 0.3)
        .concat([{ midi: 42, t0: 0, dur: seconds, amp: 0.3 }])
};

module.exports = { fft, magnitudes, synth, spectra, melody, midiHz, SCENES };
