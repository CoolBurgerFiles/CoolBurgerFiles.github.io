// ...existing code...
// Email Library Application (fetches .eml files from repo)
class EmailLibrary {
    constructor() {
        this.emails = [];
        this.selectedEmail = null;
        this.emlFiles = [
            "thread_0000.eml", "thread_0001.eml", "thread_0002.eml", "thread_0003.eml", "thread_0004.eml", "thread_0005.eml", "thread_0006.eml", "thread_0007.eml", "thread_0008.eml", "thread_0009.eml", "thread_0010.eml", "thread_0011.eml", "thread_0012.eml", "thread_0013.eml", "thread_0014.eml", "thread_0015.eml", "thread_0016.eml", "thread_0017.eml", "thread_0018.eml", "thread_0019.eml", "thread_0020.eml", "thread_0021.eml", "thread_0022.eml", "thread_0023.eml", "thread_0024.eml", "thread_0025.eml", "thread_0026.eml", "thread_0027.eml", "thread_0028.eml", "thread_0029.eml", "thread_0030.eml", "thread_0031.eml", "thread_0032.eml", "thread_0033.eml", "thread_0034.eml", "thread_0035.eml", "thread_0036.eml", "thread_0037.eml", "thread_0038.eml", "thread_0039.eml", "thread_0040.eml", "thread_0041.eml", "thread_0042.eml", "thread_0043.eml", "thread_0044.eml", "thread_0045.eml", "thread_0046.eml", "thread_0047.eml", "thread_0048.eml", "thread_0049.eml"
            // ...add more if needed
        ];
        this.init();
    }

    async init() {
        this.setupSearch();
        await this.loadEmailListFromRepo();
        // Check for ?file=... argument in URL
        const params = new URLSearchParams(window.location.search);
        const fileArg = params.get('file');
        if (fileArg) {
            // Try to fetch and display the specified file
            this.loadAndDisplayFile(fileArg);
        }
    }

    async loadAndDisplayFile(filePath) {
        try {
            const res = await fetch(filePath);
            if (res.ok) {
                const content = await res.text();
                const filename = filePath.split('/').pop();
                const email = this.parseEmailFile(filename, content);
                this.displayEmailWithNumber(email);
            } else {
                this.displayError(`Could not load file: ${filePath}`);
            }
        } catch (e) {
            this.displayError(`Error loading file: ${filePath}`);
        }
    }

    displayEmailWithNumber(email) {
        const viewer = document.getElementById('emailViewer');
        if (!email) {
            viewer.innerHTML = '<div class="empty-state"><p>No email selected</p></div>';
            return;
        }
        // Extract number from filename (e.g., thread_0649.eml => 0649)
        let number = '';
        const match = email.filename.match(/thread_(\d{4,}).eml/);
        if (match) {
            number = match[1];
        }
        viewer.innerHTML = `
                <div class="email-display">
                    <div class="email-header">
                        <h1>${this.escapeHtml(email.subject)}</h1>
                        <div class="email-meta-info">
                            <span><strong>From:</strong> ${this.escapeHtml(email.from)}</span>
                            ${email.to ? `<span><strong>To:</strong> ${this.escapeHtml(email.to)}</span>` : ''}
                            <span><strong>Date:</strong> ${email.date}</span>
                            <span class="email-number"><strong>Email #:</strong> ${number}</span>
                        </div>
                    </div>
                    <div class="email-body-container">
                        <div class="email-body">${this.escapeHtml(email.body)}</div>
                    </div>
                </div>
            `;
    }

    displayError(msg) {
        const viewer = document.getElementById('emailViewer');
        viewer.innerHTML = `<div class='empty-state'><p>${this.escapeHtml(msg)}</p></div>`;
    }

    async loadEmailListFromRepo() {
        this.emails = [];
        for (const filename of this.emlFiles) {
            try {
                const res = await fetch(`data/threads/${filename}`);
                if (res.ok) {
                    const content = await res.text();
                    const email = this.parseEmailFile(filename, content);
                    this.emails.push(email);
                }
            } catch (e) {
                // Ignore fetch errors
            }
        }
        this.renderEmailList();
        if (this.emails.length > 0) {
            this.selectEmail(this.emails[0].id);
        }
    }

    parseEmailFile(filename, content) {
        const email = {
            id: filename,
            filename: filename,
            subject: 'No Subject',
            from: 'Unknown Sender',
            to: '',
            date: '',
            body: content
        };
        // Try to parse EML format headers
        const lines = content.split('\n');
        let headerEnd = 0;
        let inHeaders = true;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' && inHeaders) {
                headerEnd = i;
                inHeaders = false;
                break;
            }
            if (inHeaders) {
                if (line.toLowerCase().startsWith('subject:')) {
                    email.subject = line.substring(8).trim() || 'No Subject';
                } else if (line.toLowerCase().startsWith('from:')) {
                    email.from = this.cleanEmailAddress(line.substring(5).trim());
                } else if (line.toLowerCase().startsWith('to:')) {
                    email.to = this.cleanEmailAddress(line.substring(3).trim());
                } else if (line.toLowerCase().startsWith('date:')) {
                    const dateStr = line.substring(5).trim();
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed)) {
                        email.date = parsed.toLocaleDateString();
                    }
                }
            }
        }
        // Extract body (everything after headers)
        if (headerEnd > 0) {
            email.body = lines.slice(headerEnd + 1).join('\n').trim();
        }
        email.body = this.decodeEmailBody(email.body);
        return email;
    }

    cleanEmailAddress(address) {
        const match = address.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/);
        if (match) {
            return match[1].trim() || match[2].trim();
        }
        return address;
    }

    decodeEmailBody(body) {
        let cleaned = body;
        cleaned = cleaned.replace(/--[a-zA-Z0-9_-]+/g, '');
        cleaned = cleaned.replace(/Content-Type:.*(\r?\n)*/gi, '');
        cleaned = cleaned.replace(/Content-Transfer-Encoding:.*(\r?\n)*/gi, '');
        cleaned = cleaned.replace(/=\r?\n/g, '');
        cleaned = cleaned.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
        return cleaned.trim();
    }

    renderEmailList(filter = '') {
        const emailList = document.getElementById('emailList');
        const filteredEmails = this.emails.filter(email => {
            const searchTerm = filter.toLowerCase();
            return email.subject.toLowerCase().includes(searchTerm) ||
                email.from.toLowerCase().includes(searchTerm) ||
                email.body.toLowerCase().includes(searchTerm);
        });
        if (filteredEmails.length === 0) {
            emailList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>${filter ? 'No results found' : 'No emails yet'}</p>
                </div>
            `;
            return;
        }
        emailList.innerHTML = filteredEmails.map(email => `
            <div class="email-card ${this.selectedEmail?.id === email.id ? 'active' : ''}"
                 onclick="emailLibrary.selectEmail('${email.id}')">
                <h4>${this.escapeHtml(email.subject)}</h4>
                <div class="email-from">${this.escapeHtml(email.from)}</div>
                <div class="email-date">${email.date}</div>
            </div>
        `).join('');
    }

    selectEmail(id) {
        this.selectedEmail = this.emails.find(e => e.id == id);
        this.renderEmailList();
        this.displayEmail(this.selectedEmail);
    }

    displayEmail(email) {
        const viewer = document.getElementById('emailViewer');
        if (!email) {
            viewer.innerHTML = '<div class="empty-state"><p>No email selected</p></div>';
            return;
        }
        viewer.innerHTML = `
            <div class="email-display">
                <div class="email-header">
                    <h1>${this.escapeHtml(email.subject)}</h1>
                    <div class="email-meta-info">
                        <span><strong>From:</strong> ${this.escapeHtml(email.from)}</span>
                        ${email.to ? `<span><strong>To:</strong> ${this.escapeHtml(email.to)}</span>` : ''}
                        <span><strong>Date:</strong> ${email.date}</span>
                    </div>
                </div>
                <div class="email-body-container">
                    <div class="email-body">${this.escapeHtml(email.body)}</div>
                </div>
            </div>
        `;
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.renderEmailList(e.target.value);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const emailLibrary = new EmailLibrary();
