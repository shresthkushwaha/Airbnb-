import localforage from 'localforage';

// Configure the localforage instance
localforage.config({
    driver: localforage.INDEXEDDB, // Force IndexedDB for performance with blobs
    name: 'ListingMediaManager',
    version: 1.0,
    storeName: 'media_assets',
    description: 'Secure local storage for Airbnb media assets and forensic metadata'
});

/**
 * Save a new asset to IndexedDB
 */
export const saveAsset = async (asset) => {
    try {
        // Fetch existing assets
        const existingAssets = (await localforage.getItem('assets')) || [];

        // Add new asset to the beginning of the array
        const updatedAssets = [asset, ...existingAssets];

        // Save back to DB
        await localforage.setItem('assets', updatedAssets);
        return updatedAssets;
    } catch (err) {
        console.error('Error saving asset to local storage:', err);
        throw err;
    }
};

/**
 * Load all assets from IndexedDB
 */
export const loadAssets = async () => {
    try {
        const assets = (await localforage.getItem('assets')) || [];
        // Re-create object URLs for blobs loaded from DB
        return assets.map(a => {
            if (a.file) {
                // Ignore the dead blob: url from the previous session and make a new one
                return { ...a, preview: URL.createObjectURL(a.file) };
            }
            return a;
        });
    } catch (err) {
        console.error('Error loading assets from local storage:', err);
        return [];
    }
};

/**
 * Delete a specific asset by ID
 */
export const deleteAsset = async (id) => {
    try {
        const existingAssets = (await localforage.getItem('assets')) || [];
        const filteredAssets = existingAssets.filter(a => a.id !== id);

        // Clean up object URLs if they exist in memory to prevent leaks
        const assetToDelete = existingAssets.find(a => a.id === id);
        if (assetToDelete?.preview && assetToDelete.preview.startsWith('blob:')) {
            URL.revokeObjectURL(assetToDelete.preview);
        }

        await localforage.setItem('assets', filteredAssets);
        return filteredAssets;
    } catch (err) {
        console.error('Error deleting asset from local storage:', err);
        throw err;
    }
};

/**
 * Clear all assets (Audit Reset)
 */
export const clearAllAssets = async () => {
    try {
        const existingAssets = (await localforage.getItem('assets')) || [];
        existingAssets.forEach(a => {
            if (a.preview && a.preview.startsWith('blob:')) {
                URL.revokeObjectURL(a.preview);
            }
        });
        await localforage.clear();
    } catch (err) {
        console.error('Error clearing local storage:', err);
        throw err;
    }
};
