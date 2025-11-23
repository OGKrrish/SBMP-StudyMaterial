/**
/**
 * generator.js
 * Rule-based content generator for MCQs and Flashcards.
 */

const Generator = {

    // Simple seeded random number generator
    _seed: 12345,
    random: () => {
        const x = Math.sin(Generator._seed++) * 10000;
        return x - Math.floor(x);
    },

    generateFromParsedData: (parsedData) => {
        Generator._seed = 12345; // Reset seed for determinism
        const topics = [];
        // Map headings to topics
        parsedData.headings.forEach((heading, index) => {
            const nextHeading = parsedData.headings[index + 1];
            const endPage = nextHeading ? nextHeading.page - 1 : parsedData.page_count;

            const topicText = Generator.extractTextForRange(parsedData.text_by_page, heading.page, endPage);

            const topic = {
                id: `topic_${index + 1}`,
                title: heading.text,
                page_range: `${heading.page}-${endPage}`,
                summary: Generator.generateSummary(topicText),
                mcqs: Generator.generateMCQs(topicText, heading.page),
                flashcards: Generator.generateFlashcards(topicText, heading.page)
            };
            topics.push(topic);
        });
        return {
            subject: "Generated Subject",
            topic: "Generated Topic",
            source_file: parsedData.filename,
            topics: topics
        };
    },

    extractTextForRange: (textByPage, start, end) => {
        let text = "";
        for (let i = start; i <= end; i++) {
            if (textByPage[i]) {
                text += textByPage[i] + " ";
            }
        }
        return text;
    },

    generateSummary: (text) => {
        // Simple heuristic: Take the first sentence or two.
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        return sentences.slice(0, 2).join(" ");
    },

    generateMCQs: (text, startPage) => {
        const mcqs = [];
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];

        // Keyword-based generation
        const keywords = ["is", "are", "called", "defined as", "equals", "="];

        sentences.forEach(sentence => {
            if (mcqs.length >= 6) return; // Limit per topic

            // Heuristic: Find definitions or equations
            if (sentence.length > 20 && sentence.length < 150) {
                // Check for keywords
                for (const keyword of keywords) {
                    if (sentence.includes(keyword)) {
                        const parts = sentence.split(keyword);
                        if (parts.length === 2) {
                            const question = `What ${keyword} ${parts[0].trim()}?`;
                            const correctAnswer = parts[1].trim();

                            // Generate distractors
                            const distractors = Generator.generateDistractors(correctAnswer, text);

                            if (distractors.length === 3) {
                                const options = [correctAnswer, ...distractors].sort(() => Generator.random() - 0.5);
                                mcqs.push({
                                    question: question,
                                    options: options,
                                    answer_index: options.indexOf(correctAnswer),
                                    difficulty: sentence.length > 80 ? "hard" : "medium",
                                    source_quote: sentence.substring(0, 20) + "...",
                                    source_page: startPage, // Approximation
                                    confidence: 0.8
                                });
                                break; // Move to next sentence
                            }
                        }
                    }
                }
            }
        });
        return mcqs;
    },

    generateFlashcards: (text, startPage) => {
        const flashcards = [];
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];

        sentences.forEach(sentence => {
            if (flashcards.length >= 4) return;

            if (sentence.toLowerCase().includes("define") || sentence.toLowerCase().includes("what is")) {
                // Already a question format?
                const parts = sentence.split("?");
                if (parts.length > 1) {
                    flashcards.push({
                        front: parts[0] + "?",
                        back: parts[1].trim(),
                        source_page: startPage,
                        confidence: 0.9
                    });
                }
            } else {
                // Create a cloze deletion or simple Q/A
                const keyTerms = ["Reflection", "Refraction", "Diffraction", "Polarization", "Interference"];
                for (const term of keyTerms) {
                    if (sentence.includes(term)) {
                        flashcards.push({
                            front: `Define/Explain: ${term}`,
                            back: sentence,
                            source_page: startPage,
                            confidence: 0.85
                        });
                        break;
                    }
                }
            }
        });
        return flashcards;
    },

    generateDistractors: (correct, text) => {
        // Simple distractor generation: pick other random segments from text
        // In a real app, this would use NLP or similar word vectors.
        // Here we just pick random phrases from other sentences.
        const distractors = [];
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];

        let attempts = 0;
        while (distractors.length < 3 && attempts < 20) {
            const randomSentence = sentences[Math.floor(Generator.random() * sentences.length)];
            if (randomSentence && !randomSentence.includes(correct)) {
                // Take a substring to make it look like an answer
                const words = randomSentence.split(" ");
                if (words.length > 3) {
                    const phrase = words.slice(0, Math.min(words.length, 5)).join(" ");
                    if (!distractors.includes(phrase)) {
                        distractors.push(phrase);
                    }
                }
            }
            attempts++;
        }

        // Fallback if we can't find enough text-based distractors
        while (distractors.length < 3) {
            distractors.push("None of the above");
            distractors.push("All of the above");
            distractors.push("Information insufficient");
        }

        return distractors.slice(0, 3);
    }
};

window.Generator = Generator;
