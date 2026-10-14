#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "ScaleEngine.h"

class ScaleSnapProcessor : public juce::AudioProcessor
{
public:
    ScaleSnapProcessor();

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    using AudioProcessor::processBlock;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    juce::AudioProcessorValueTreeState parameters;

    // Written on the audio thread, read by the editor to light up the keyboard.
    std::array<std::atomic<bool>, 128> inputActive {};
    std::array<std::atomic<bool>, 128> outputActive {};

private:
    inline static const juce::Identifier scaleIdProperty { "scaleId" };

    void handleMidi (const juce::MidiMessage& msg, int samplePos, juce::MidiBuffer& out);

    scalesnap::ScaleEngine engine;
    scalesnap::NoteTracker tracker;

    std::atomic<float>* rootParam   = nullptr;
    std::atomic<float>* scaleParam  = nullptr;
    std::atomic<float>* modeParam   = nullptr;
    std::atomic<float>* chordParam  = nullptr;
    std::atomic<float>* bypassParam = nullptr;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ScaleSnapProcessor)
};
