/**
 * storage.js
 * Handles localStorage operations and file Import/Export.
 */

const Storage = {
    KEYS: {
        PROGRESS: 'study_app_progress',
        SETTINGS: 'study_app_settings',
        CUSTOM_DATA: 'study_app_custom_data' // For user-added/generated content
    },

    // --- LocalStorage Wrappers ---

    get: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return null;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error writing to localStorage', e);
        }
    },

    // --- User Progress ---

    getProgress: () => {
        return Storage.get(Storage.KEYS.PROGRESS) || {
            quizzes: [], // { topicId, score, date }
            flashcards: {} // { cardId: { interval, repetitions, easeFactor, nextReviewDate } }
        };
    },

    saveProgress: (progress) => {
        Storage.set(Storage.KEYS.PROGRESS, progress);
    },

    saveQuizResult: (topicId, score, total) => {
        const progress = Storage.getProgress();
        progress.quizzes.push({
            topicId,
            score,
            total,
            date: new Date().toISOString()
        });
        Storage.saveProgress(progress);
    },

    getFlashcardState: (cardId) => {
        const progress = Storage.getProgress();
        return progress.flashcards[cardId] || null;
    },

    saveFlashcardState: (cardId, state) => {
        const progress = Storage.getProgress();
        progress.flashcards[cardId] = state;
        Storage.saveProgress(progress);
    },

    // --- Data Loading ---

    loadJSON: async (path) => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);
            return await response.json();
        } catch (e) {
            console.error('Error loading JSON:', e);
            return null;
        }
    },

    // --- Import / Export ---

    exportData: () => {
        const data = {
            progress: Storage.getProgress(),
            settings: Storage.get(Storage.KEYS.SETTINGS),
            customData: Storage.get(Storage.KEYS.CUSTOM_DATA)
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.progress) Storage.set(Storage.KEYS.PROGRESS, data.progress);
                    if (data.settings) Storage.set(Storage.KEYS.SETTINGS, data.settings);
                    if (data.customData) Storage.set(Storage.KEYS.CUSTOM_DATA, data.customData);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }
};

// Expose globally
window.Storage = Storage;
