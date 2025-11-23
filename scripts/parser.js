/**
 * parser.js
 * Handles PDF parsing using PDF.js.
 */

const Parser = {
    // This assumes pdfjsLib is loaded via <script> tag in index.html/admin.html

    parsePDF: async (url) => {
        if (typeof pdfjsLib === 'undefined') {
            console.error("PDF.js library not loaded.");
            alert("PDF.js library is missing. Please ensure it is included.");
            return null;
        }

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'scripts/pdfjs/pdf.worker.js';

        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;

            const result = {
                filename: url.split('/').pop(),
                page_count: pdf.numPages,
                text_by_page: {},
                headings: []
            };

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                result.text_by_page[i] = pageText;

                // Simple heuristic for headings: Short lines with larger font? 
                // PDF.js text items have 'transform' which includes scale (font size).
                // For now, we'll just look for specific keywords in the text as requested in the prompt.
                Parser.detectHeadings(pageText, i, result.headings);
            }

            return result;
        } catch (e) {
            console.error("Error parsing PDF:", e);
            alert("Failed to parse PDF. See console for details.");
            return null;
        }
    },

    detectHeadings: (text, pageNum, headingsArray) => {
        // Keywords from prompt
        const keywords = [
            "Reflection", "Refraction", "Snell’s Law", "Total Internal Reflection",
            "Nature of light", "Interference", "Diffraction", "Polarization",
            "Photoelectric effect"
        ];

        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                // Check if we already have this heading recently to avoid duplicates
                const lastHeading = headingsArray[headingsArray.length - 1];
                if (!lastHeading || lastHeading.text !== keyword) {
                    headingsArray.push({ text: keyword, page: pageNum });
                }
            }
        });
    }
};

window.Parser = Parser;
