// hadith.js

const API_KEY = "$2y$10$uDflmADuwUm4k5M0KD66NebwumHuhZb5kY4Jzgpvw4gZewQR1aK";

const STATE = {
    currentView: 'books', // books, chapters, hadiths
    bookSlug: null,
    chapterNumber: null,
    currentPage: 1,
    booksCache: null,
    chaptersCache: {}, // Map bookSlug -> chapters list
    hadithsCache: {},  // Map key "slug-chapter-page" -> hadiths response
    currentBookName: null,
    currentChapterInfo: null
};

// German mapping for book names (optional, fallback to API name)
const BOOK_NAMES_DE = {
    'sahih-bukhari': 'Sahih Bukhari',
    'sahih-muslim': 'Sahih Muslim',
    'al-tirmidhi': "Jami' At-Tirmidhi",
    'abu-dawood': 'Sunan Abu Dawood',
    'ibn-e-majah': 'Sunan Ibn Majah',
    'sunan-nasai': "Sunan An-Nasa'i",
    'mishkat': 'Mishkat Al-Masabih',
    'musnad-ahmad': 'Musnad Ahmad',
    'al-silsila-sahiha': 'Al-Silsila Sahiha'
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Setup search listener for chapters
    const chapterSearch = document.getElementById('chapter-search');
    if(chapterSearch) {
        chapterSearch.addEventListener('input', (e) => {
            filterChapters(e.target.value);
        });
    }

    // Pagination listeners
    document.getElementById('prev-page-btn').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page-btn').addEventListener('click', () => changePage(1));
}

function handleHashChange() {
    const hash = window.location.hash;

    if (!hash || hash === '#') {
        showBooksView();
    } else if (hash.includes('/chapter/')) {
        // #book/slug/chapter/id
        const parts = hash.split('/chapter/');
        const bookSlug = parts[0].replace('#book/', '');
        const chapterId = parts[1];
        showHadithsView(bookSlug, chapterId);
    } else if (hash.startsWith('#book/')) {
        // #book/slug
        const bookSlug = hash.replace('#book/', '');
        showChaptersView(bookSlug);
    }
}

// --- View Switchers ---

function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('loading-state').classList.add('flex');
    document.getElementById('books-view').classList.add('hidden');
    document.getElementById('chapters-view').classList.add('hidden');
    document.getElementById('hadiths-view').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('flex');

    // Restore view based on state
    if (STATE.currentView === 'books') {
        document.getElementById('books-view').classList.remove('hidden');
    } else if (STATE.currentView === 'chapters') {
        document.getElementById('chapters-view').classList.remove('hidden');
    } else if (STATE.currentView === 'hadiths') {
        document.getElementById('hadiths-view').classList.remove('hidden');
    }
}

function showError(msg) {
    hideLoading();
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').innerText = msg || 'Ein Fehler ist aufgetreten.';
}

function showBooksView() {
    STATE.currentView = 'books';
    STATE.bookSlug = null;
    STATE.chapterNumber = null;

    document.getElementById('books-view').classList.remove('hidden');
    document.getElementById('chapters-view').classList.add('hidden');
    document.getElementById('hadiths-view').classList.add('hidden');

    if (!STATE.booksCache) {
        fetchBooks();
    } else {
        renderBooks(STATE.booksCache);
    }
}

// --- API & Rendering: Books ---

async function fetchBooks() {
    showLoading();
    try {
        const url = `https://hadithapi.com/api/books?apiKey=${encodeURIComponent(API_KEY)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === 200 && json.books) {
            STATE.booksCache = json.books;
            renderBooks(json.books);
        } else {
            throw new Error(json.message || 'Fehler beim Laden der Bücher');
        }
    } catch (e) {
        console.error(e);
        showError("Konnte Bücherliste nicht laden. Bitte überprüfe deine Verbindung.");
    } finally {
        hideLoading();
    }
}

function renderBooks(books) {
    const container = document.getElementById('books-list-container');
    container.innerHTML = '';

    books.forEach(book => {
        const displayName = BOOK_NAMES_DE[book.bookSlug] || book.bookName;

        const card = document.createElement('a');
        card.href = `#book/${book.bookSlug}`;
        card.className = "glass-card p-6 rounded-xl hover:scale-[1.02] transition-transform duration-300 group cursor-pointer block";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        <i class="fas fa-book"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${displayName}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${book.hadiths_count} Hadithe • ${book.chapters_count} Kapitel</p>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-gray-400 group-hover:text-primary-500 transition-colors"></i>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- API & Rendering: Chapters ---

function showChaptersView(bookSlug) {
    STATE.currentView = 'chapters';
    STATE.bookSlug = bookSlug;
    STATE.chapterNumber = null;
    STATE.currentBookName = BOOK_NAMES_DE[bookSlug] || bookSlug;

    document.getElementById('books-view').classList.add('hidden');
    document.getElementById('chapters-view').classList.remove('hidden');
    document.getElementById('hadiths-view').classList.add('hidden');

    document.getElementById('selected-book-name').innerText = STATE.currentBookName;
    document.getElementById('chapter-search').value = ''; // Reset search

    if (!STATE.chaptersCache[bookSlug]) {
        fetchChapters(bookSlug);
    } else {
        renderChapters(STATE.chaptersCache[bookSlug]);
    }
}

async function fetchChapters(bookSlug) {
    showLoading();
    try {
        const url = `https://hadithapi.com/api/${bookSlug}/chapters?apiKey=${encodeURIComponent(API_KEY)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === 200 && json.chapters) {
            STATE.chaptersCache[bookSlug] = json.chapters;
            renderChapters(json.chapters);
        } else {
            throw new Error(json.message || 'Fehler beim Laden der Kapitel');
        }
    } catch (e) {
        console.error(e);
        showError("Konnte Kapitelliste nicht laden.");
    } finally {
        hideLoading();
    }
}

function renderChapters(chapters) {
    const container = document.getElementById('chapters-list-container');
    container.innerHTML = '';

    if (chapters.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Keine Kapitel gefunden.</p>';
        return;
    }

    chapters.forEach(chapter => {
        const div = document.createElement('div');
        // Use hash navigation
        div.innerHTML = `
            <a href="#book/${chapter.bookSlug}/chapter/${chapter.chapterNumber}" class="glass-card p-4 rounded-xl flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-700/50 transition cursor-pointer group">
                <div class="flex items-center gap-4">
                    <span class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-500 text-sm">
                        ${chapter.chapterNumber}
                    </span>
                    <div>
                        <h3 class="font-medium text-gray-800 dark:text-gray-200">${chapter.chapterEnglish}</h3>
                        ${chapter.chapterArabic ? `<p class="text-xs text-gray-400 font-amiri mt-1 text-right sm:text-left">${chapter.chapterArabic}</p>` : ''}
                    </div>
                </div>
                <i class="fas fa-chevron-right text-gray-400 group-hover:text-primary-500 transition-colors"></i>
            </a>
        `;
        container.appendChild(div);
    });
}

function filterChapters(query) {
    const slug = STATE.bookSlug;
    if (!slug || !STATE.chaptersCache[slug]) return;

    const chapters = STATE.chaptersCache[slug];
    if (!query) {
        renderChapters(chapters);
        return;
    }

    const lowerQ = query.toLowerCase();
    const filtered = chapters.filter(c =>
        c.chapterNumber.toString().includes(lowerQ) ||
        (c.chapterEnglish && c.chapterEnglish.toLowerCase().includes(lowerQ)) ||
        (c.chapterArabic && c.chapterArabic.includes(query))
    );

    renderChapters(filtered);
}


// --- API & Rendering: Hadiths ---

function showHadithsView(bookSlug, chapterId) {
    STATE.currentView = 'hadiths';
    STATE.bookSlug = bookSlug;
    STATE.chapterNumber = chapterId;
    STATE.currentPage = 1; // Reset to page 1 on new chapter load
    // Note: If we want to support deep linking to page X, we'd need to parse it from hash too, but simple for now.

    STATE.currentBookName = BOOK_NAMES_DE[bookSlug] || bookSlug;

    document.getElementById('books-view').classList.add('hidden');
    document.getElementById('chapters-view').classList.add('hidden');
    document.getElementById('hadiths-view').classList.remove('hidden');

    // Update Breadcrumbs
    document.getElementById('breadcrumb-book').innerHTML = `<a href="#book/${bookSlug}" class="hover:text-primary-500 transition">${STATE.currentBookName}</a>`;
    document.getElementById('breadcrumb-chapter').innerText = `Kapitel ${chapterId}`;

    // We might not have chapter title yet if we landed here directly.
    // We can try to find it in cache if exists, otherwise it will be updated after fetch
    const chapterTitleEl = document.getElementById('current-chapter-title');
    chapterTitleEl.innerText = `Kapitel ${chapterId}`; // Placeholder

    if (STATE.chaptersCache[bookSlug]) {
        const ch = STATE.chaptersCache[bookSlug].find(c => c.chapterNumber == chapterId);
        if (ch) chapterTitleEl.innerText = ch.chapterEnglish;
    }

    fetchHadiths(bookSlug, chapterId, STATE.currentPage);
}

async function fetchHadiths(bookSlug, chapterId, page) {
    const cacheKey = `${bookSlug}-${chapterId}-${page}`;

    // Clear list if new load (optional, but good for UX to show spinner)
    document.getElementById('hadiths-list-container').innerHTML = '';
    showLoading();

    try {
        if (STATE.hadithsCache[cacheKey]) {
            renderHadiths(STATE.hadithsCache[cacheKey]);
            hideLoading();
            return;
        }

        const url = `https://hadithapi.com/api/hadiths?apiKey=${encodeURIComponent(API_KEY)}&book=${bookSlug}&chapter=${chapterId}&paginate=20&page=${page}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === 200 && json.hadiths && json.hadiths.data) {
            STATE.hadithsCache[cacheKey] = json;
            renderHadiths(json);

            // Update Chapter Title from response if available
            if (json.hadiths.data.length > 0 && json.hadiths.data[0].chapter) {
                const ch = json.hadiths.data[0].chapter;
                document.getElementById('current-chapter-title').innerText = ch.chapterEnglish;
            }
        } else {
            // Handle empty or error
            if(json.hadiths && json.hadiths.data && json.hadiths.data.length === 0) {
                 document.getElementById('hadiths-list-container').innerHTML = '<p class="text-center text-gray-500">Keine Hadithe in diesem Kapitel gefunden.</p>';
            } else {
                throw new Error(json.message || 'Fehler beim Laden der Hadithe');
            }
        }
    } catch (e) {
        console.error(e);
        showError("Konnte Hadithe nicht laden.");
    } finally {
        hideLoading();
    }
}

function renderHadiths(json) {
    const container = document.getElementById('hadiths-list-container');
    container.innerHTML = '';

    const data = json.hadiths.data;
    const meta = json.hadiths; // pagination meta

    // Update pagination buttons
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    STATE.currentPage = meta.current_page;
    pageInfo.innerText = `Seite ${meta.current_page} von ${meta.last_page}`;

    prevBtn.disabled = meta.current_page <= 1;
    nextBtn.disabled = meta.current_page >= meta.last_page;

    data.forEach(hadith => {
        const div = document.createElement('div');
        div.className = "glass-card p-6 rounded-xl animate-fade-in";

        // Tags/Badges
        const isSahih = hadith.status === 'Sahih';
        const badgeColor = isSahih ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}">
                    ${hadith.status}
                </span>
                <span class="text-sm font-mono text-gray-500 dark:text-gray-400">#${hadith.hadithNumber}</span>
            </div>

            ${hadith.headingEnglish ? `<h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">${hadith.headingEnglish}</h3>` : ''}

            <div class="mb-6 space-y-4">
                <div class="text-right">
                    <p class="arabic-text text-xl md:text-2xl text-gray-800 dark:text-gray-200 leading-loose">${hadith.hadithArabic}</p>
                </div>

                <div class="h-px bg-gray-200 dark:bg-gray-700 w-1/2 mx-auto"></div>

                <div>
                     ${hadith.englishNarrator ? `<p class="font-semibold text-sm text-primary-600 dark:text-primary-400 mb-1">${hadith.englishNarrator}</p>` : ''}
                    <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${hadith.hadithEnglish}</p>
                </div>
            </div>

            <div class="flex justify-end gap-2">
                 <button onclick="copyToClipboard(this, '${hadith.hadithEnglish.replace(/'/g, "\\'")}')" class="text-xs text-gray-400 hover:text-primary-500 transition flex items-center gap-1">
                    <i class="far fa-copy"></i> Kopieren
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(offset) {
    const newPage = STATE.currentPage + offset;
    if (newPage < 1) return;

    fetchHadiths(STATE.bookSlug, STATE.chapterNumber, newPage);
}

function copyToClipboard(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Kopiert!';
        btn.classList.add('text-green-500');
        setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('text-green-500');
        }, 2000);
    });
}
