/**
 * admin.js
 * Handles admin dashboard interactions.
 */

const Admin = {
    data: null,
    currentTopicIndex: null,

    init: () => {
        // Check if already logged in (simple session check)
        if (sessionStorage.getItem('admin_logged_in')) {
            Admin.showDashboard();
        }

        // Add Enter key listener for login
        const passInput = document.getElementById('admin-pass');
        if (passInput) {
            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') Admin.login();
            });
        }
    },

    login: () => {
        const pass = document.getElementById('admin-pass').value;
        if (pass === 'admin123') { // Insecure, but per requirements
            sessionStorage.setItem('admin_logged_in', 'true');
            Admin.showDashboard();
        } else {
            alert('Invalid password');
        }
    },

    showDashboard: () => {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('admin-app').classList.remove('hidden');
        Admin.loadData();
    },

    loadData: async () => {
        const storedData = Storage.get('asc4_data');
        if (storedData) {
            Admin.data = storedData;
        } else {
            Admin.data = await Storage.loadJSON('assets/data/asc4_generated.json');
        }
        Admin.renderTopicList();
    },

    renderTopicList: () => {
        const container = document.getElementById('topic-sidebar');
        container.innerHTML = '';

        Admin.data.topics.forEach((topic, index) => {
            const item = document.createElement('div');
            item.className = `topic-list-item ${Admin.currentTopicIndex === index ? 'active' : ''}`;
            item.textContent = topic.title;
            item.onclick = () => Admin.selectTopic(index);
            container.appendChild(item);
        });
    },

    selectTopic: (index) => {
        Admin.currentTopicIndex = index;
        Admin.renderTopicList();
        Admin.renderEditor(index);
    },

    renderEditor: (index) => {
        const topic = Admin.data.topics[index];
        const container = document.getElementById('editor-main');

        let html = `<h2>Editing: ${topic.title}</h2>`;

        html += `<h3>MCQs</h3>`;
        topic.mcqs.forEach((mcq, i) => {
            html += `
                <div class="item-editor">
                    <div class="form-group">
                        <label>Question</label>
                        <input type="text" class="form-control" value="${mcq.question}" onchange="Admin.updateMCQ(${index}, ${i}, 'question', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Correct Answer (Index 0)</label>
                        <input type="text" class="form-control" value="${mcq.options[0]}" onchange="Admin.updateMCQOption(${index}, ${i}, 0, this.value)">
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    updateMCQ: (topicIdx, mcqIdx, field, value) => {
        Admin.data.topics[topicIdx].mcqs[mcqIdx][field] = value;
        Admin.saveChanges();
    },

    updateMCQOption: (topicIdx, mcqIdx, optIdx, value) => {
        Admin.data.topics[topicIdx].mcqs[mcqIdx].options[optIdx] = value;
        Admin.saveChanges();
    },

    saveChanges: () => {
        Storage.set('asc4_data', Admin.data);
        // Also update the file if we could (not possible in static site without server)
        // But we persist to localStorage so student view sees it.
    },

    reparse: async (url) => {
        if (confirm('This will overwrite current data with newly parsed data. Continue?')) {
            const parsed = await Parser.parsePDF(url);
            if (parsed) {
                const generated = Generator.generateFromParsedData(parsed);
                Admin.data = generated;
                Admin.saveChanges();
                Admin.renderTopicList();
                alert('Parsing and generation complete!');
            }
        }
    },

    exportData: () => {
        Storage.exportData();
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', Admin.init);
window.Admin = Admin;
