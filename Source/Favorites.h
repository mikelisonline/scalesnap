#pragma once

#include <juce_data_structures/juce_data_structures.h>
#include <juce_events/juce_events.h>

/** The user's favourite scales (by scale id), shared by every plugin instance and every project.

    Stored in a small settings file in the user's application data folder:
      macOS:   ~/Library/Application Support/mikel.studio/Scale Snap.settings
      Windows: %APPDATA%\mikel.studio\Scale Snap.settings

    Message thread only (it's never touched from the audio thread). Use through a
    juce::SharedResourcePointer<Favorites> so all editors in a process see the same list;
    listeners are told (via the ChangeBroadcaster) whenever the list changes. */
class Favorites : public juce::ChangeBroadcaster
{
public:
    Favorites();
    ~Favorites() override;

    bool isFavorite (const juce::String& scaleId) const;
    void setFavorite (const juce::String& scaleId, bool shouldBeFavorite); // saves immediately
    void toggle (const juce::String& scaleId);
    int size() const { return ids.size(); }

    /** Re-reads the file (e.g. when an editor opens), in case another process changed it. */
    void reload();

    juce::File getFile() const;

private:
    void load();
    void save();

    std::unique_ptr<juce::PropertiesFile> file;
    juce::StringArray ids;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (Favorites)
};
