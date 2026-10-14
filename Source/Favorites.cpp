#include "Favorites.h"

namespace
{
constexpr const char* favoritesKey = "favoriteScales";

juce::PropertiesFile::Options makeOptions()
{
    juce::PropertiesFile::Options options;
    options.applicationName     = "Scale Snap";
    options.folderName          = "mikel.studio";
    options.filenameSuffix      = ".settings";
    options.osxLibrarySubFolder = "Application Support";
    options.millisecondsBeforeSaving = 0; // write on every change
    return options;
}
} // namespace

Favorites::Favorites()
{
    file = std::make_unique<juce::PropertiesFile> (makeOptions());
    load();
}

Favorites::~Favorites()
{
    file->saveIfNeeded();
}

juce::File Favorites::getFile() const
{
    return file->getFile();
}

void Favorites::load()
{
    ids.clear();
    ids.addTokens (file->getValue (favoritesKey), ",", "");
    ids.trim();
    ids.removeEmptyStrings();
    ids.removeDuplicates (false);
}

void Favorites::save()
{
    file->setValue (favoritesKey, ids.joinIntoString (","));
    file->saveIfNeeded();
}

bool Favorites::isFavorite (const juce::String& scaleId) const
{
    return ids.contains (scaleId);
}

void Favorites::setFavorite (const juce::String& scaleId, bool shouldBeFavorite)
{
    if (isFavorite (scaleId) == shouldBeFavorite)
        return;

    if (shouldBeFavorite)
        ids.add (scaleId);
    else
        ids.removeString (scaleId);

    save();
    sendChangeMessage();
}

void Favorites::toggle (const juce::String& scaleId)
{
    setFavorite (scaleId, ! isFavorite (scaleId));
}

void Favorites::reload()
{
    const auto before = ids;
    file->reload();
    load();

    if (before != ids)
        sendChangeMessage();
}
