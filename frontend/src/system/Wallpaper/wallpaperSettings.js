export const INTERVALS = [0, 5, 15, 30, 60];

export function normalizeSettings(value, legacyId = null) {
    const favorites = Array.isArray(value?.favorites) ? [...new Set(value.favorites.filter(id => typeof id === 'string'))] : [];
    const saved = Array.isArray(value?.favoriteWallpapers) ? value.favoriteWallpapers : [];
    const favoriteWallpapers = [...new Map(saved
        .filter(wp => wp && favorites.includes(wp.id) && typeof wp.src === 'string' && wp.src.length > 0)
        .map(wp => [wp.id, { ...wp }])).values()];
    return {
        currentId: typeof value?.currentId === 'string' ? value.currentId : legacyId,
        minutes: INTERVALS.includes(value?.minutes) ? value.minutes : legacyId ? 0 : 5,
        favorites,
        favoriteWallpapers,
    };
}

// Save legacy ID-only favorites while their source information is still available.
export function hydrateFavorites(settings, library) {
    const saved = settings.favoriteWallpapers ?? [];
    const savedIds = new Set(saved.map(wp => wp.id));
    const missing = library.filter(wp => settings.favorites.includes(wp.id) && !savedIds.has(wp.id));
    return missing.length ? { ...settings, favoriteWallpapers: [...saved, ...missing.map(wp => ({ ...wp }))] } : settings;
}

export function availableWallpapers(library, settings) {
    const libraryIds = new Set(library.map(wp => wp.id));
    return [...library, ...(settings.favoriteWallpapers ?? []).filter(wp => settings.favorites.includes(wp.id) && !libraryIds.has(wp.id))];
}

export function toggleSavedFavorite(settings, wallpaper) {
    const removing = settings.favorites.includes(wallpaper.id);
    return {
        ...settings,
        favorites: removing ? settings.favorites.filter(id => id !== wallpaper.id) : [...settings.favorites, wallpaper.id],
        favoriteWallpapers: removing
            ? settings.favoriteWallpapers.filter(wp => wp.id !== wallpaper.id)
            : [...settings.favoriteWallpapers, { ...wallpaper }],
    };
}

export function nextWallpaper(list, currentId) {
    if (!list.length) return currentId;
    return list[(list.findIndex(wp => wp.id === currentId) + 1) % list.length].id;
}
