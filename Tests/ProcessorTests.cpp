// Tests for the JUCE side of the plugin (state restore and the audio thread). They need JUCE,
// so they are only built with -DSCALESNAP_BUILD_PROCESSOR_TESTS=ON (see CMakeLists.txt).

#include "PluginProcessor.h"

#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <cstring>

//==============================================================================
// Counts heap operations while `counting` is set, so the audio callback can be checked for them.
// JUCE allocates with malloc/realloc/free, so those are intercepted (glibc only; elsewhere the
// check is skipped).
static std::atomic<bool> counting { false };
static std::atomic<int> heapOps { 0 };

#if defined(__GLIBC__)
 #define SCALESNAP_COUNT_HEAP 1
extern "C"
{
void* __libc_malloc (std::size_t);
void* __libc_calloc (std::size_t, std::size_t);
void* __libc_realloc (void*, std::size_t);
void __libc_free (void*);

void* malloc (std::size_t n)                { if (counting.load()) ++heapOps; return __libc_malloc (n); }
void* calloc (std::size_t n, std::size_t m) { if (counting.load()) ++heapOps; return __libc_calloc (n, m); }
void* realloc (void* p, std::size_t n)      { if (counting.load()) ++heapOps; return __libc_realloc (p, n); }
void free (void* p)                         { if (p != nullptr && counting.load()) ++heapOps; __libc_free (p); }
}
#else
 #define SCALESNAP_COUNT_HEAP 0
#endif

//==============================================================================
static int failures = 0;

#define CHECK(cond)                                                                            \
    do                                                                                         \
    {                                                                                          \
        if (! (cond))                                                                          \
        {                                                                                      \
            std::printf ("FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond);                       \
            ++failures;                                                                        \
        }                                                                                      \
    } while (0)

static int scaleIndexOf (ScaleSnapProcessor& p)
{
    return (int) p.parameters.getRawParameterValue ("scale")->load();
}

static void setScaleIndex (ScaleSnapProcessor& p, int index)
{
    auto* param = p.parameters.getParameter ("scale");
    param->setValueNotifyingHost (param->convertTo0to1 ((float) index));
}

static juce::MemoryBlock toBlock (const juce::XmlElement& xml)
{
    juce::MemoryBlock block;
    juce::AudioProcessor::copyXmlToBinary (xml, block);
    return block;
}

// Builds the state that the first release saved: the APVTS state, with the scale parameter
// holding a position in its 16-entry list, and no scaleId property.
static juce::MemoryBlock legacyState (ScaleSnapProcessor& source, int legacyIndex)
{
    juce::MemoryBlock saved;
    source.getStateInformation (saved);
    auto xml = juce::AudioProcessor::getXmlFromBinary (saved.getData(), (int) saved.getSize());
    xml->removeAttribute ("scaleId");

    bool found = false;
    for (auto* child : xml->getChildIterator())
        if (child->getStringAttribute ("id") == "scale")
        {
            child->setAttribute ("value", (double) legacyIndex);
            found = true;
        }

    CHECK (found);
    return toBlock (*xml);
}

static void testState()
{
    // A state saved by this version restores by id.
    {
        ScaleSnapProcessor a, b;
        const int lydian = scalesnap::findScaleIndexById ("lydian");
        setScaleIndex (a, lydian);

        juce::MemoryBlock blob;
        a.getStateInformation (blob);
        b.setStateInformation (blob.getData(), (int) blob.getSize());
        CHECK (scaleIndexOf (b) == lydian);
    }

    // The id wins over the stored position, which can change when the list grows.
    {
        ScaleSnapProcessor a, b;
        setScaleIndex (a, scalesnap::findScaleIndexById ("lydian"));
        juce::MemoryBlock saved;
        a.getStateInformation (saved);
        auto xml = juce::AudioProcessor::getXmlFromBinary (saved.getData(), (int) saved.getSize());
        for (auto* child : xml->getChildIterator())
            if (child->getStringAttribute ("id") == "scale")
                child->setAttribute ("value", 2.0);

        const auto blob = toBlock (*xml);
        b.setStateInformation (blob.getData(), (int) blob.getSize());
        CHECK (scaleIndexOf (b) == scalesnap::findScaleIndexById ("lydian"));

        // An id this version does not know falls back to the stored position.
        xml->setAttribute ("scaleId", "no_such_scale");
        const auto blob2 = toBlock (*xml);
        setScaleIndex (b, 7);
        b.setStateInformation (blob2.getData(), (int) blob2.getSize());
        CHECK (scaleIndexOf (b) == 2);
    }

    // State saved by the first release has only a position in its 16-entry list. Each position
    // must load as the scale it was, even though the list has been reordered since.
    {
        ScaleSnapProcessor source, target;
        const auto& legacy = scalesnap::getLegacyScaleIds();

        for (size_t i = 0; i < legacy.size(); ++i)
        {
            setScaleIndex (target, scalesnap::findScaleIndexById ("blues_major")); // something else
            const auto blob = legacyState (source, (int) i);
            target.setStateInformation (blob.getData(), (int) blob.getSize());

            const int loaded = scaleIndexOf (target);
            const bool ok = loaded >= 0 && std::strcmp (scalesnap::getScales()[(size_t) loaded].id, legacy[i]) == 0;
            if (! ok)
                std::printf ("legacy position %d loaded as '%s', expected '%s'\n", (int) i,
                             loaded >= 0 ? scalesnap::getScales()[(size_t) loaded].id : "?", legacy[i]);
            CHECK (ok);
        }

        // The reported case: A Natural Minor must not come back as A Dorian.
        const auto blob = legacyState (source, 1);
        target.setStateInformation (blob.getData(), (int) blob.getSize());
        CHECK (scaleIndexOf (target) == scalesnap::findScaleIndexById ("natural_minor"));
    }
}

static void testProcessBlockDoesNotTouchTheHeap()
{
    ScaleSnapProcessor p;
    p.setPlayConfigDetails (0, 2, 44100.0, 512);
    p.prepareToPlay (44100.0, 512);

    juce::AudioBuffer<float> audio (2, 512);
    juce::MidiBuffer midi;
    midi.ensureSize (4096);

    auto fill = [&]
    {
        midi.clear();
        for (int n = 60; n < 68; ++n)
            midi.addEvent (juce::MidiMessage::noteOn (1, n, (juce::uint8) 100), n);
        for (int n = 60; n < 68; ++n)
            midi.addEvent (juce::MidiMessage::noteOff (1, n), 100 + n);
    };

    // The first blocks may settle buffer capacities; after that the audio thread must be quiet.
    for (int i = 0; i < 4; ++i)
    {
        fill();
        p.processBlock (audio, midi);
    }

    int worst = 0;
    for (int i = 0; i < 64; ++i)
    {
        fill();
        heapOps = 0;
        counting = true;
        p.processBlock (audio, midi);
        counting = false;
        worst = juce::jmax (worst, heapOps.load());
    }

#if SCALESNAP_COUNT_HEAP
    if (worst != 0)
        std::printf ("processBlock made up to %d heap operations in a block\n", worst);
    CHECK (worst == 0);
#else
    (void) worst;
    std::printf ("heap check skipped: needs glibc\n");
#endif

    // The output still carries the notes.
    CHECK (midi.getNumEvents() > 0);
}

int main()
{
    juce::ScopedJuceInitialiser_GUI init;

    testState();
    testProcessBlockDoesNotTouchTheHeap();

    if (failures == 0)
        std::printf ("All Scale Snap processor tests passed.\n");

    return failures == 0 ? 0 : 1;
}
