/**
 * ui.js
 * Handles student UI interactions.
 */

const UI = {
    data: null,
    currentSubject: 'ASC',
    currentTopic: null,
    quizState: {
        questions: [],
        currentIndex: 0,
        score: 0
    },
    flashcardState: {
        cards: [],
        currentIndex: 0,
        isFlipped: false
    },

    init: async () => {
        // Load initial data
        if (typeof ASC4_DATA !== 'undefined') {
            UI.data = ASC4_DATA;
            Storage.set('asc4_data_v4', UI.data);
        } else {
            console.error('ASC4_DATA not found.');
        }

        UI.renderTopics();

        // Event listeners
        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                UI.currentSubject = e.target.dataset.subject;
                UI.renderTopics();
            });
        });

        // Search listener
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => UI.handleSearch(e.target.value));
        }
    },

    renderTopics: (filter = '') => {
        const container = document.getElementById('topic-list');
        if (!container) return; // Guard clause
        container.innerHTML = '';

        if (UI.currentSubject !== 'ASC') {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Content coming soon for ' + UI.currentSubject + '</div>';
            return;
        }

        if (!UI.data || !UI.data.chapters) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--error);">Error loading data. Please refresh.</div>';
            return;
        }

        let hasContent = false;

        UI.data.chapters.forEach(chapter => {
            // Filter topics if search query exists
            const matchingTopics = chapter.topics.filter(t =>
                t.title.toLowerCase().includes(filter.toLowerCase()) ||
                t.summary.toLowerCase().includes(filter.toLowerCase())
            );

            if (matchingTopics.length > 0) {
                hasContent = true;
                // Render Chapter Header
                const chapterHeader = document.createElement('div');
                chapterHeader.className = 'chapter-header';
                chapterHeader.innerHTML = `<h2>${chapter.title}</h2>`;
                container.appendChild(chapterHeader);

                // Render Topics
                matchingTopics.forEach(topic => {
                    const card = document.createElement('div');
                    card.className = 'topic-card';
                    card.innerHTML = `
                        <div class="topic-title">${topic.title}</div>
                        <div class="topic-summary">${topic.summary}</div>
                        <div class="card-actions">
                            <button onclick="UI.startQuiz('${topic.id}')" class="btn btn-primary">Quiz</button>
                            <button onclick="UI.startFlashcards('${topic.id}')" class="btn btn-secondary">Flashcards</button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }
        });

        if (!hasContent) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No matching topics found.</div>';
        }
    },

    handleSearch: (query) => {
        UI.renderTopics(query);
    },

    showHome: () => {
        document.getElementById('subject-view').classList.remove('hidden');
        document.getElementById('quiz-view').classList.add('hidden');
        document.getElementById('flashcard-view').classList.add('hidden');

        // Remove flashcard listeners
        document.removeEventListener('keydown', UI.handleFlashcardKeys);
        document.removeEventListener('touchstart', UI.handleTouchStart);
        document.removeEventListener('touchend', UI.handleTouchEnd);
    },

    // --- Quiz Logic ---

    startQuiz: (topicId) => {
        let topic = null;
        for (const ch of UI.data.chapters) {
            topic = ch.topics.find(t => t.id === topicId);
            if (topic) break;
        }

        if (!topic || !topic.mcqs.length) {
            alert('No questions available for this topic.');
            return;
        }

        UI.currentTopic = topic;
        UI.quizState.questions = [...topic.mcqs].sort(() => Math.random() - 0.5);
        UI.quizState.currentIndex = 0;
        UI.quizState.score = 0;

        document.getElementById('subject-view').classList.add('hidden');
        document.getElementById('quiz-view').classList.remove('hidden');
        UI.renderQuestion();
    },

    renderQuestion: () => {
        const q = UI.quizState.questions[UI.quizState.currentIndex];
        const container = document.getElementById('question-container');

        document.getElementById('quiz-progress').textContent = `Question ${UI.quizState.currentIndex + 1}/${UI.quizState.questions.length}`;
        document.getElementById('quiz-score').textContent = `Score: ${UI.quizState.score}`;

        // Shuffle options and track correct answer
        const shuffledOptions = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

        // Fisher-Yates shuffle
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        // Find where the correct answer ended up after shuffling
        const correctShuffledIndex = shuffledOptions.findIndex(opt => opt.originalIndex === q.answer_index);

        container.innerHTML = `
            <div class="question-text">${q.question}</div>
            <div class="options-grid">
                ${shuffledOptions.map((opt, idx) => `
                    <button class="option-btn" onclick="UI.checkAnswer(${idx}, ${correctShuffledIndex})">${opt.text}</button>
                `).join('')}
            </div>
            <div id="feedback" style="margin-top: 1rem; min-height: 2rem;"></div>
        `;
    },

    checkAnswer: (selectedIndex, correctIndex) => {
        const q = UI.quizState.questions[UI.quizState.currentIndex];
        const buttons = document.querySelectorAll('.option-btn');

        buttons.forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            buttons[selectedIndex].classList.add('correct');
            UI.quizState.score++;
            document.getElementById('feedback').innerHTML = `<span style="color: var(--success)">Correct!</span>`;
        } else {
            buttons[selectedIndex].classList.add('incorrect');
            buttons[correctIndex].classList.add('correct');
            document.getElementById('feedback').innerHTML = `<span style="color: var(--error)">Incorrect.</span> <span class="source-tag">Source: Page ${q.source_page}</span>`;
        }

        setTimeout(() => {
            UI.quizState.currentIndex++;
            if (UI.quizState.currentIndex < UI.quizState.questions.length) {
                UI.renderQuestion();
            } else {
                UI.showQuizResults();
            }
        }, 2000);
    },

    showQuizResults: () => {
        const container = document.getElementById('question-container');
        const percentage = Math.round((UI.quizState.score / UI.quizState.questions.length) * 100);

        container.innerHTML = `
            <div style="text-align: center;">
                <h2>Quiz Complete!</h2>
                <div style="font-size: 3rem; font-weight: 800; margin: 2rem 0; color: ${percentage >= 70 ? 'var(--success)' : 'var(--secondary)'}">
                    ${percentage}%
                </div>
                <p>You got ${UI.quizState.score} out of ${UI.quizState.questions.length} correct.</p>
                <button onclick="UI.showHome()" class="btn btn-primary" style="margin-top: 2rem;">Back to Topics</button>
            </div>
        `;

        Storage.saveQuizResult(UI.currentTopic.id, UI.quizState.score, UI.quizState.questions.length);
    },

    // --- Flashcard Logic ---

    startFlashcards: (topicId) => {
        // Ensure data is loaded
        if (!UI.data || !UI.data.chapters) {
            alert('Error: Data not loaded. Please refresh the page.');
            return;
        }

        let topic = null;
        for (const ch of UI.data.chapters) {
            topic = ch.topics.find(t => t.id === topicId);
            if (topic) break;
        }

        if (!topic) {
            alert('Error: Topic not found.');
            return;
        }

        if (!topic.flashcards || !Array.isArray(topic.flashcards) || topic.flashcards.length === 0) {
            alert('No flashcards available for this topic.');
            return;
        }

        // Reset state completely
        UI.currentTopic = topic;
        UI.flashcardState = {
            cards: topic.flashcards,
            currentIndex: 0,
            isFlipped: false
        };

        const subjectView = document.getElementById('subject-view');
        const flashcardView = document.getElementById('flashcard-view');

        if (subjectView) subjectView.classList.add('hidden');
        if (flashcardView) flashcardView.classList.remove('hidden');

        // Remove existing listeners to avoid duplicates
        document.removeEventListener('keydown', UI.handleFlashcardKeys);
        document.removeEventListener('touchstart', UI.handleTouchStart);
        document.removeEventListener('touchend', UI.handleTouchEnd);

        // Add listeners
        document.addEventListener('keydown', UI.handleFlashcardKeys);
        document.addEventListener('touchstart', UI.handleTouchStart, { passive: true });
        document.addEventListener('touchend', UI.handleTouchEnd, { passive: true });

        // Render the first flashcard
        requestAnimationFrame(() => {
            UI.renderFlashcard();
        });
    },

    renderFlashcard: () => {
        if (!UI.flashcardState.cards || UI.flashcardState.cards.length === 0) {
            console.error('No cards to render');
            return;
        }

        // Safety check for index
        if (UI.flashcardState.currentIndex < 0 || UI.flashcardState.currentIndex >= UI.flashcardState.cards.length) {
            console.error('Invalid currentIndex:', UI.flashcardState.currentIndex);
            UI.flashcardState.currentIndex = 0;
        }

        const card = UI.flashcardState.cards[UI.flashcardState.currentIndex];
        const cardEl = document.getElementById('active-flashcard');
        const progressEl = document.getElementById('fc-progress');
        const frontEl = document.getElementById('fc-front');
        const backEl = document.getElementById('fc-back');
        const sourceEl = document.getElementById('fc-source');

        if (!cardEl || !frontEl || !backEl) {
            console.error('Critical flashcard DOM elements missing');
            return;
        }

        // Update progress
        if (progressEl) {
            progressEl.textContent = `${UI.flashcardState.currentIndex + 1} / ${UI.flashcardState.cards.length}`;
        }

        // Reset flip state visually first
        cardEl.classList.remove('flipped');
        UI.flashcardState.isFlipped = false;

        // Update content
        frontEl.textContent = card.front || 'Error: No front content';
        backEl.textContent = card.back || 'Error: No back content';
        if (sourceEl) {
            sourceEl.textContent = card.source_page ? `Source: Page ${card.source_page}` : '';
        }
    },

    flipCard: () => {
        const cardEl = document.getElementById('active-flashcard');
        cardEl.classList.toggle('flipped');
        UI.flashcardState.isFlipped = !UI.flashcardState.isFlipped;
    },

    nextCard: () => {
        // Loop back to start if at end
        if (UI.flashcardState.currentIndex < UI.flashcardState.cards.length - 1) {
            UI.flashcardState.currentIndex++;
        } else {
            UI.flashcardState.currentIndex = 0;
        }
        UI.renderFlashcard();
    },

    prevCard: () => {
        // Loop to end if at start
        if (UI.flashcardState.currentIndex > 0) {
            UI.flashcardState.currentIndex--;
        } else {
            UI.flashcardState.currentIndex = UI.flashcardState.cards.length - 1;
        }
        UI.renderFlashcard();
    },

    // Keyboard & Touch Handlers
    handleFlashcardKeys: (e) => {
        if (document.getElementById('flashcard-view').classList.contains('hidden')) return;

        if (e.key === 'ArrowRight') UI.nextCard();
        if (e.key === 'ArrowLeft') UI.prevCard();
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); // Prevent scrolling
            UI.flipCard();
        }
    },

    touchStartX: 0,
    touchEndX: 0,

    handleTouchStart: (e) => {
        UI.touchStartX = e.changedTouches[0].screenX;
    },

    handleTouchEnd: (e) => {
        UI.touchEndX = e.changedTouches[0].screenX;
        UI.handleSwipe();
    },

    handleSwipe: () => {
        const threshold = 50;
        if (UI.touchEndX < UI.touchStartX - threshold) {
            UI.nextCard(); // Swipe Left -> Next
        }
        if (UI.touchEndX > UI.touchStartX + threshold) {
            UI.prevCard(); // Swipe Right -> Prev
        }
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UI.init);
} else {
    UI.init();
}
window.UI = UI;
