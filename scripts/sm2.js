/**
 * sm2.js
 * Implementation of the SuperMemo-2 (SM-2) algorithm for spaced repetition.
 */

const SM2 = {
    /**
     * Calculates the next review interval and ease factor.
     * @param {number} quality - 0-5 rating (0=blackout, 5=perfect)
     * @param {object} previousState - { interval, repetitions, easeFactor }
     * @returns {object} - { interval, repetitions, easeFactor, nextReviewDate }
     */
    calculate: (quality, previousState = null) => {
        let interval, repetitions, easeFactor;

        if (!previousState) {
            // Initial state
            previousState = { interval: 0, repetitions: 0, easeFactor: 2.5 };
        }

        if (quality >= 3) {
            // Correct response
            if (previousState.repetitions === 0) {
                interval = 1;
            } else if (previousState.repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(previousState.interval * previousState.easeFactor);
            }
            repetitions = previousState.repetitions + 1;
        } else {
            // Incorrect response
            repetitions = 0;
            interval = 1;
        }

        // Update Ease Factor
        easeFactor = previousState.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        // Calculate next date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        return {
            interval,
            repetitions,
            easeFactor,
            nextReviewDate: nextReviewDate.toISOString()
        };
    }
};

// Expose globally
window.SM2 = SM2;
