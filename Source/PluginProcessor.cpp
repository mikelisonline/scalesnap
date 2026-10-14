#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace
{
template <size_t N>
juce::StringArray toStringArray (const std::array<const char*, N>& names)
{
    juce::StringArray result;
    for (auto* n : names)
        result.add (n);
    return result;
}

juce::StringArray scaleNames()
{
    juce::StringArray result;
    for (auto& s : scalesnap::getScales())
        result.add (s.name);
    return result;
}
} // namespace

ScaleSnapProcessor::ScaleSnapProcessor()
    : AudioProcessor (BusesProperties().withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      parameters (*this, nullptr, "ScaleSnap", createParameterLayout())
{
    rootParam   = parameters.getRawParameterValue ("root");
    scaleParam  = parameters.getRawParameterValue ("scale");
    modeParam   = parameters.getRawParameterValue ("mode");
    chordParam  = parameters.getRawParameterValue ("chord");
    bypassParam = parameters.getRawParameterValue ("bypass");
}

juce::AudioProcessorValueTreeState::ParameterLayout ScaleSnapProcessor::createParameterLayout()
{
    using namespace juce;
    AudioProcessorValueTreeState::ParameterLayout layout;

    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { "root", 1 }, "Key",
                                                        toStringArray (scalesnap::getNoteNames()), 0));
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { "scale", 1 }, "Scale", scaleNames(), 0));
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { "mode", 1 }, "Correction",
                                                        toStringArray (scalesnap::getSnapModeNames()), 0));
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { "chord", 1 }, "Chords",
                                                        toStringArray (scalesnap::getChordTypeNames()), 0));
    layout.add (std::make_unique<AudioParameterBool> (ParameterID { "bypass", 1 }, "Bypass correction", false));

    return layout;
}

void ScaleSnapProcessor::prepareToPlay (double, int)
{
    tracker.clear();
    for (auto& a : inputActive)  a = false;
    for (auto& a : outputActive) a = false;
}

bool ScaleSnapProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& out = layouts.getMainOutputChannelSet();
    return out == juce::AudioChannelSet::stereo() || out == juce::AudioChannelSet::mono();
}

void ScaleSnapProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    juce::ScopedNoDenormals noDenormals;

    // Scale Snap makes no sound itself: it is loaded as an instrument only so that
    // Ableton lets other tracks take its MIDI output.
    buffer.clear();

    engine.setScale ((int) rootParam->load(), (int) scaleParam->load());

    juce::MidiBuffer out;
    for (const auto metadata : midi)
        handleMidi (metadata.getMessage(), metadata.samplePosition, out);

    midi.swapWith (out);

    for (int n = 0; n < 128; ++n)
    {
        bool in = false, sounding = false;
        for (int ch = 1; ch <= 16 && ! (in && sounding); ++ch)
        {
            in       = in || tracker.isKeyHeld (ch, n);
            sounding = sounding || tracker.isSounding (ch, n);
        }
        inputActive[(size_t) n].store (in, std::memory_order_relaxed);
        outputActive[(size_t) n].store (sounding, std::memory_order_relaxed);
    }
}

void ScaleSnapProcessor::handleMidi (const juce::MidiMessage& msg, int samplePos, juce::MidiBuffer& out)
{
    const int channel = msg.getChannel();
    scalesnap::NoteTracker::Events events;
    int numEvents = 0;

    if (msg.isNoteOn())
    {
        std::array<int, scalesnap::maxNotesPerKey> notes {};
        int numNotes = 1;
        notes[0] = msg.getNoteNumber();

        if (bypassParam->load() < 0.5f)
            numNotes = engine.process (msg.getNoteNumber(),
                                       (scalesnap::SnapMode) (int) modeParam->load(),
                                       (scalesnap::ChordType) (int) chordParam->load(),
                                       notes);

        numEvents = tracker.noteOn (channel, msg.getNoteNumber(), msg.getVelocity(), notes, numNotes, events);
    }
    else if (msg.isNoteOff())
    {
        numEvents = tracker.noteOff (channel, msg.getNoteNumber(), msg.getVelocity(), events);
    }
    else if (msg.isAftertouch())
    {
        const int target = tracker.firstOutputFor (channel, msg.getNoteNumber());
        if (target >= 0)
            out.addEvent (juce::MidiMessage::aftertouchChange (channel, target, msg.getAfterTouchValue()), samplePos);
        return;
    }
    else if (msg.isAllNotesOff() || msg.isAllSoundOff())
    {
        tracker.releaseAll (channel, [&] (int ch, int note)
        {
            out.addEvent (juce::MidiMessage::noteOff (ch, note), samplePos);
        });
        out.addEvent (msg, samplePos);
        return;
    }
    else
    {
        // Pitch bend, mod wheel, sustain, etc. pass straight through.
        out.addEvent (msg, samplePos);
        return;
    }

    for (int i = 0; i < numEvents; ++i)
    {
        const auto& e = events[(size_t) i];
        if (e.type == scalesnap::NoteEvent::Type::noteOn)
            out.addEvent (juce::MidiMessage::noteOn (e.channel, e.note, e.velocity), samplePos);
        else
            out.addEvent (juce::MidiMessage::noteOff (e.channel, e.note, e.velocity), samplePos);
    }
}

juce::AudioProcessorEditor* ScaleSnapProcessor::createEditor()
{
    return new ScaleSnapEditor (*this);
}

void ScaleSnapProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();

    // The scale parameter only stores a position in the scale list, which can change between
    // versions, so the scale's stable id is saved as well and wins when the state is loaded.
    const auto& scales = scalesnap::getScales();
    const int index = juce::jlimit (0, (int) scales.size() - 1, (int) scaleParam->load());
    state.setProperty (scaleIdProperty, juce::String (scales[(size_t) index].id), nullptr);

    if (auto xml = state.createXml())
        copyXmlToBinary (*xml, destData);
}

void ScaleSnapProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    auto xml = getXmlFromBinary (data, sizeInBytes);
    if (xml == nullptr || ! xml->hasTagName (parameters.state.getType()))
        return;

    const auto newState = juce::ValueTree::fromXml (*xml);
    parameters.replaceState (newState);

    if (newState.hasProperty (scaleIdProperty))
    {
        const int index = scalesnap::findScaleIndexById (newState[scaleIdProperty].toString().toRawUTF8());

        if (index >= 0)
            if (auto* param = parameters.getParameter ("scale"))
                param->setValueNotifyingHost (param->convertTo0to1 ((float) index));
    }
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ScaleSnapProcessor();
}
