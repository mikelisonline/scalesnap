// Dumps reference behaviour of Source/ScaleEngine.h for the Max for Live JS tests.
//
//   g++ -std=c++17 -I Source m4l/tests/golden/gen_golden.cpp -o gen_golden && ./gen_golden > golden.json
//
// Output (JSON):
//   "snap":      base64 of every ScaleEngine::snap() result as (result - note + 128), order scale, mode,
//                root, note; 255 = blocked
//   "scenarios": random note-on/off/scale-change scripts and the exact events NoteTracker produced.
//                "remaining" = output notes still sounding at the end of each script.
//                The JS NoteModel, and the real p snapcore patcher run in tests/maxsim.js, must match.
#include "ScaleEngine.h"

#include <cstdio>
#include <string>
#include <vector>

using namespace scalesnap;

static std::string base64 (const std::vector<unsigned char>& in)
{
    static const char* t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string out;
    size_t i = 0;
    for (; i + 2 < in.size(); i += 3)
    {
        unsigned v = (in[i] << 16) | (in[i + 1] << 8) | in[i + 2];
        out += t[v >> 18]; out += t[(v >> 12) & 63]; out += t[(v >> 6) & 63]; out += t[v & 63];
    }
    if (i + 1 == in.size())
    {
        unsigned v = in[i] << 16;
        out += t[v >> 18]; out += t[(v >> 12) & 63]; out += "==";
    }
    else if (i + 2 == in.size())
    {
        unsigned v = (in[i] << 16) | (in[i + 1] << 8);
        out += t[v >> 18]; out += t[(v >> 12) & 63]; out += t[(v >> 6) & 63]; out += '=';
    }
    return out;
}

struct Lcg
{
    unsigned s;
    unsigned next() { s = s * 1664525u + 1013904223u; return s >> 8; }
    int below (int n) { return (int) (next() % (unsigned) n); }
};

int main()
{
    const auto& scales = getScales();
    std::printf ("{\n  \"scaleCount\": %d,\n", (int) scales.size());

    // ---- full snap table
    std::vector<unsigned char> bytes;
    ScaleEngine e;
    for (size_t s = 0; s < scales.size(); ++s)
        for (int mode = 0; mode < 5; ++mode)
            for (int root = 0; root < 12; ++root)
            {
                e.setScale (root, (int) s);
                for (int n = 0; n < 128; ++n)
                {
                    const int r = e.snap (n, (SnapMode) mode);
                    bytes.push_back (r < 0 ? 255 : (unsigned char) (r - n + 128)); // delta, compresses well
                }
            }
    std::printf ("  \"snap\": \"%s\",\n", base64 (bytes).c_str());

    // ---- NoteTracker scenarios: ops are [0, note, vel] = note-on, [1, note] = note-off,
    //      [2, root, scaleIndex, mode] = change scale/mode. Events: [on, note, vel].
    std::printf ("  \"scenarios\": [\n");
    const int numScenarios = 40;
    for (int sc = 0; sc < numScenarios; ++sc)
    {
        Lcg rng { (unsigned) (1000 + sc * 7919) };
        // Few distinct keys, in a narrow range, so that keys collide on the same output note.
        const int base = 48 + rng.below (60);
        const int span = 4 + rng.below (10);
        const int length = 120;

        ScaleEngine eng;
        NoteTracker tracker;
        int root = rng.below (12), scaleIdx = rng.below ((int) scales.size()), mode = rng.below (5);
        eng.setScale (root, scaleIdx);

        std::printf ("    {\"start\": [%d, %d, %d], \"ops\": [", root, scaleIdx, mode);
        std::string events;
        for (int i = 0; i < length; ++i)
        {
            const int kind = rng.below (10);
            std::string ops;
            std::vector<NoteEvent> evs;
            NoteTracker::Events buf {};
            if (kind < 5)
            {
                const int note = base + rng.below (span);
                const int vel = 1 + rng.below (127);
                std::array<int, maxNotesPerKey> out {};
                const int n = eng.process (note, (SnapMode) mode, ChordType::off, out);
                const int ne = tracker.noteOn (1, note, (uint8_t) vel, out, n, buf);
                evs.assign (buf.begin(), buf.begin() + ne);
                ops = "[0," + std::to_string (note) + "," + std::to_string (vel) + "]";
            }
            else if (kind < 9)
            {
                const int note = base + rng.below (span);
                const int ne = tracker.noteOff (1, note, 0, buf);
                evs.assign (buf.begin(), buf.begin() + ne);
                ops = "[1," + std::to_string (note) + "]";
            }
            else
            {
                root = rng.below (12); scaleIdx = rng.below ((int) scales.size()); mode = rng.below (5);
                eng.setScale (root, scaleIdx);
                ops = "[2," + std::to_string (root) + "," + std::to_string (scaleIdx) + "," + std::to_string (mode) + "]";
            }
            std::printf ("%s%s", i ? "," : "", ops.c_str());
            events += (i ? "," : "");
            events += "[";
            for (size_t k = 0; k < evs.size(); ++k)
                events += std::string (k ? "," : "") + "[" + (evs[k].type == NoteEvent::Type::noteOn ? "1" : "0")
                          + "," + std::to_string (evs[k].note) + "," + std::to_string (evs[k].velocity) + "]";
            events += "]";
        }
        // Notes still sounding at the end of the script (what releaseAll would turn off), ascending.
        std::string remaining;
        tracker.releaseAll (1, [&] (int, int note)
        {
            remaining += std::string (remaining.empty() ? "" : ",") + std::to_string (note);
        });
        std::printf ("], \"events\": [%s], \"remaining\": [%s]}%s\n", events.c_str(), remaining.c_str(),
                     sc + 1 < numScenarios ? "," : "");
    }
    std::printf ("  ]\n}\n");
    return 0;
}
