// --- State ---
let allSurahs = [];
let currentSurah = null;
let isPlaying = false;
let currentAudioIndex = -1;
let audioQueue = []; // Array of objects { url, ayahNumber, id }

// --- Settings State ---
let currentReciter = localStorage.getItem('quran_reciter') || 'ar.mahermuaiqly';
let recitersList = [];

// --- Translations ---
const revelationTypeTranslations = {
    'Meccan': 'Mekkanisch',
    'Medinan': 'Medinensisch'
};

const SURAH_NAMES_DE = {
    1: "Die Eröffnung",
    2: "Die Kuh",
    3: "Die Sippe Imrans",
    4: "Die Frauen",
    5: "Der Tisch",
    6: "Das Vieh",
    7: "Die Höhen",
    8: "Die Beute",
    9: "Die Reue",
    10: "Jona",
    11: "Hud",
    12: "Josef",
    13: "Der Donner",
    14: "Abraham",
    15: "Al-Hidschr",
    16: "Die Bienen",
    17: "Die Nachtreise",
    18: "Die Höhle",
    19: "Maria",
    20: "Ta Ha",
    21: "Die Propheten",
    22: "Die Pilgerfahrt",
    23: "Die Gläubigen",
    24: "Das Licht",
    25: "Die Unterscheidung",
    26: "Die Dichter",
    27: "Die Ameisen",
    28: "Die Geschichte",
    29: "Die Spinne",
    30: "Die Römer",
    31: "Luqman",
    32: "Die Anbetung",
    33: "Die Parteien",
    34: "Saba",
    35: "Der Schöpfer",
    36: "Ya Sin",
    37: "Die Riegen",
    38: "Sad",
    39: "Die Scharen",
    40: "Der Vergebende",
    41: "Erklärt",
    42: "Die Beratung",
    43: "Der Prunk",
    44: "Der Rauch",
    45: "Die Kniende",
    46: "Die Dünen",
    47: "Mohammed",
    48: "Der Sieg",
    49: "Die Zimmer",
    50: "Qaf",
    51: "Die Aufwirbelnden",
    52: "Der Berg",
    53: "Der Stern",
    54: "Der Mond",
    55: "Der Allerbarmer",
    56: "Das Ereignis",
    57: "Das Eisen",
    58: "Der Streit",
    59: "Die Versammlung",
    60: "Die Geprüfte",
    61: "Die Reihe",
    62: "Der Freitag",
    63: "Die Heuchler",
    64: "Der gegenseitige Betrug",
    65: "Die Scheidung",
    66: "Das Verbot",
    67: "Die Herrschaft",
    68: "Das Schreibrohr",
    69: "Die Unausweichliche",
    70: "Die Stufen",
    71: "Noah",
    72: "Die Dschinn",
    73: "Der Eingehüllte",
    74: "Der Bedeckte",
    75: "Die Auferstehung",
    76: "Der Mensch",
    77: "Die Gesandten",
    78: "Die Ankündigung",
    79: "Die Ausziehenden",
    80: "Er runzelte die Stirn",
    81: "Das Umnachten",
    82: "Das Spalten",
    83: "Die das Maß verkürzenden",
    84: "Das Zerreißen",
    85: "Die Türme",
    86: "Der Nachtstern",
    87: "Der Höchste",
    88: "Die Überwältigende",
    89: "Die Morgenröte",
    90: "Die Stadt",
    91: "Die Sonne",
    92: "Die Nacht",
    93: "Der Morgen",
    94: "Das Weiten",
    95: "Die Feige",
    96: "Das Anhängsel",
    97: "Die Bestimmung",
    98: "Der klare Beweis",
    99: "Das Beben",
    100: "Die Rennenden",
    101: "Das Pochen",
    102: "Die Vermehrung",
    103: "Das Zeitalter",
    104: "Der Stichler",
    105: "Der Elefant",
    106: "Die Quraisch",
    107: "Die Hilfeleistung",
    108: "Die Fülle",
    109: "Die Ungläubigen",
    110: "Die Hilfe",
    111: "Die Palmfasern",
    112: "Die Aufrichtigkeit",
    113: "Das Morgengrauen",
    114: "Die Menschen"
};

const BISMILLAH_AR = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_DE = "Im Namen Allahs, des Allerbarmers, des Barmherzigen";

function translateType(type) {
    return revelationTypeTranslations[type] || type;
}

// --- DOM Elements ---
const viewsContainer = document.getElementById('views-container');
const loadingState = document.getElementById('loading-state');
const surahListView = document.getElementById('surah-list-view');
const surahDetailView = document.getElementById('surah-detail-view');
const surahListContainer = document.getElementById('surah-list-container');
const ayahsContainer = document.getElementById('ayahs-container');
const globalAudio = document.getElementById('quran-audio');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const themeSettings = window.loadThemeSettings();
    if (themeSettings.isDark) document.documentElement.classList.add('dark');

    // Check for hash to load specific Surah
    const hash = window.location.hash;
    if (hash && hash.startsWith('#surah/')) {
        const surahNum = hash.split('/')[1];
        loadSurah(surahNum);
    } else {
        fetchSurahList();
    }

    // Handle Audio Events
    globalAudio.addEventListener('ended', playNextInQueue);
    globalAudio.addEventListener('pause', () => updateAudioUI(false));
    globalAudio.addEventListener('play', () => updateAudioUI(true));
    globalAudio.addEventListener('error', (e) => {
        console.warn("Audio error detected", e);
        // Try to skip to next if error
        playNextInQueue();
    });

    // Initialize View Options
    initViewOptions();

    // Load reciters list
    fetchReciters().then(() => populateReciterSelect());
});

// --- View Options Logic ---
function initViewOptions() {
    const toggleArabic = document.getElementById('toggle-arabic');
    const toggleGerman = document.getElementById('toggle-german');
    const toggleAudio = document.getElementById('toggle-audio');

    if (toggleArabic) toggleViewOption('arabic', toggleArabic.checked);
    if (toggleGerman) toggleViewOption('german', toggleGerman.checked);
    if (toggleAudio) toggleViewOption('audio', toggleAudio.checked);
}

function toggleViewOption(type, show) {
    // type: 'arabic', 'german', 'audio'
    // adds class: 'hide-arabic', 'hide-german', 'hide-audio' to container
    if (!ayahsContainer) return;

    if (show) {
        ayahsContainer.classList.remove(`hide-${type}`);
    } else {
        ayahsContainer.classList.add(`hide-${type}`);
    }
}

// --- Surah List Logic ---

async function fetchSurahList() {
    showLoading(true);
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();

        if (data.code === 200) {
            allSurahs = data.data;
            // Overwrite with German names
            allSurahs.forEach(s => {
                if (SURAH_NAMES_DE[s.number]) {
                    s.englishNameTranslation = SURAH_NAMES_DE[s.number];
                }
            });
            renderSurahList(allSurahs);
            showView('list');
        } else {
            alert('Fehler beim Laden der Surah-Liste.');
        }
    } catch (e) {
        console.error(e);
        alert('Netzwerkfehler beim Laden.');
    } finally {
        showLoading(false);
    }
}

function renderSurahList(surahs) {
    surahListContainer.innerHTML = '';

    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 rounded-xl hover:scale-[1.02] transition cursor-pointer flex items-center justify-between group';
        card.onclick = () => loadSurah(surah.number);

        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    ${surah.number}
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 dark:text-gray-200">${surah.englishName}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${surah.englishNameTranslation} • ${surah.numberOfAyahs} Ayahs</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-amiri text-xl text-primary-600 dark:text-primary-400">${surah.name}</p>
                <p class="text-xs text-gray-400">${translateType(surah.revelationType)}</p>
            </div>
        `;

        surahListContainer.appendChild(card);
    });
}

function filterSurahs(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = allSurahs.filter(s =>
        s.englishName.toLowerCase().includes(lowerQuery) ||
        s.englishNameTranslation.toLowerCase().includes(lowerQuery) ||
        String(s.number).includes(lowerQuery)
    );
    renderSurahList(filtered);
}

// --- Helpers ---

function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        loadingState.classList.add('flex');
        surahListView.classList.add('hidden');
        surahDetailView.classList.add('hidden');
    } else {
        loadingState.classList.remove('flex');
        loadingState.classList.add('hidden');
    }
}

function showView(viewName) {
    if (viewName === 'list') {
        surahListView.classList.remove('hidden');
        surahDetailView.classList.add('hidden');
        stopAudio(); // Stop audio when going back to list
        window.location.hash = '';
    } else if (viewName === 'detail') {
        surahListView.classList.add('hidden');
        surahDetailView.classList.remove('hidden');
    }
}

function showSurahList() {
    showView('list');
}

async function loadSurah(number) {
    number = parseInt(number);
    showLoading(true);
    stopAudio();

    try {
        // Fetch 3 editions: Arabic Text, German Translation, Audio (based on selection)
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,de.bubenheim,${currentReciter}`);
        const data = await response.json();

        if (data.code === 200) {
            currentSurah = {
                details: data.data[0], // General info from first edition
                arabic: data.data[0].ayahs,
                german: data.data[1].ayahs,
                audio: data.data[2].ayahs
            };

            // Use German name
            if (SURAH_NAMES_DE[number]) {
                currentSurah.details.englishNameTranslation = SURAH_NAMES_DE[number];
            }

            renderSurahView(number);
            window.location.hash = `surah/${number}`;
            showView('detail');
        } else {
            alert('Fehler beim Laden der Surah.');
            showView('list');
        }
    } catch (e) {
        console.error(e);
        alert('Verbindungsfehler.');
        showView('list');
    } finally {
        showLoading(false);
    }
}

function renderSurahView(number) {
    const info = currentSurah.details;

    // Header Info
    document.getElementById('detail-surah-name-ar').innerText = info.name;
    document.getElementById('detail-surah-name-en').innerText = info.englishName;
    document.getElementById('detail-surah-info').innerText = `${info.englishNameTranslation} • ${translateType(info.revelationType)} • ${info.numberOfAyahs} Ayahs`;

    // Ensure Select is populated and value is correct
    populateReciterSelect();

    // Ayahs
    ayahsContainer.innerHTML = '';

    // Apply current view options (re-apply class to container just in case)
    initViewOptions();

    // Navigation Buttons
    const prevBtn = document.getElementById('prev-surah-btn');
    const nextBtn = document.getElementById('next-surah-btn');

    prevBtn.disabled = number <= 1;
    prevBtn.onclick = () => loadSurah(number - 1);

    nextBtn.disabled = number >= 114;
    nextBtn.onclick = () => loadSurah(number + 1);

    // Handle Bismillah for Surahs != 1 and != 9
    let showBismillahHeader = false;
    if (number != 1 && number != 9) {
        if (currentSurah.arabic[0] && currentSurah.arabic[0].text.startsWith(BISMILLAH_AR)) {
            showBismillahHeader = true;
        }
    }

    if (showBismillahHeader) {
        const bismillahDiv = document.createElement('div');
        bismillahDiv.className = 'text-center mb-8';
        bismillahDiv.innerHTML = `
            <p class="font-amiri text-3xl text-gray-800 dark:text-gray-200 mb-2 leading-loose">${BISMILLAH_AR}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">${BISMILLAH_DE}</p>
        `;
        ayahsContainer.appendChild(bismillahDiv);
    }

    const ayahCount = currentSurah.arabic.length;

    for (let i = 0; i < ayahCount; i++) {
        const ar = currentSurah.arabic[i];
        const de = currentSurah.german[i];

        let arText = ar.text;

        // If we showed the header, we strip the Bismillah from the first Ayah
        if (i === 0 && showBismillahHeader) {
            arText = arText.substring(BISMILLAH_AR.length).trim();
        }

        const ayahDiv = document.createElement('div');
        ayahDiv.id = `ayah-${ar.number}`; // Global Ayah ID
        ayahDiv.className = 'glass-card p-6 rounded-xl transition-colors duration-300 border-l-4 border-transparent';

        ayahDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4 gap-4">
                <span class="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-500">${ar.numberInSurah}</span>
                <div class="text-right w-full">
                    <p class="arabic-text text-2xl md:text-3xl text-gray-800 dark:text-gray-100 leading-loose">${arText}</p>
                </div>
            </div>

            <div class="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <p class="german-text text-gray-600 dark:text-gray-300 text-sm md:text-base mb-3">${de.text}</p>

                <div class="flex justify-end">
                    <button onclick="playSingleAyah(${i})" class="audio-btn text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm flex items-center gap-2 px-3 py-1 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition">
                        <i class="fas fa-play"></i> Anhören
                    </button>
                </div>
            </div>
        `;

        ayahsContainer.appendChild(ayahDiv);
    }
}

// --- Audio Logic ---

function playSingleAyah(index) {
    // Setup queue with just this ayah
    setupQueue([index]);
    playNextInQueue();
}

function playFullSurah() {
    // Setup queue with all ayahs
    const indices = Array.from({length: currentSurah.arabic.length}, (_, i) => i);
    setupQueue(indices);
    playNextInQueue();
}

function setupQueue(indices) {
    stopAudio();
    audioQueue = indices.map(i => ({
        url: currentSurah.audio[i].audio,
        ayahNumber: currentSurah.arabic[i].number, // Global number for ID
        indexInSurah: i + 1
    }));
    currentAudioIndex = -1;
}

function playNextInQueue() {
    currentAudioIndex++;

    if (currentAudioIndex < audioQueue.length) {
        const item = audioQueue[currentAudioIndex];
        globalAudio.src = item.url;
        globalAudio.play().catch(e => {
            console.error("Play error", e);
            playNextInQueue(); // Try next on error
        });

        // Highlight
        highlightAyah(item.ayahNumber);
        updatePlayerInfo(item.indexInSurah);
    } else {
        // End of queue
        stopAudio();
    }
}

function stopAudio() {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    currentAudioIndex = -1;
    audioQueue = [];
    updateAudioUI(false);
    removeHighlights();
}

function highlightAyah(globalAyahNumber) {
    removeHighlights();
    const el = document.getElementById(`ayah-${globalAyahNumber}`);
    if (el) {
        el.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-slate-700', 'dark:border-primary-400');
        el.classList.remove('border-transparent');

        // Scroll into view nicely
        // Using block: 'center' to keep it visible under sticky headers
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function removeHighlights() {
    const highlighted = document.querySelectorAll('.border-primary-500');
    highlighted.forEach(el => {
        el.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-slate-700', 'dark:border-primary-400');
        el.classList.add('border-transparent');
    });
}

function updateAudioUI(playing) {
    const statusEl = document.getElementById('audio-player-status');
    const playBtn = document.getElementById('play-surah-btn');

    if (playing) {
        statusEl.classList.remove('hidden');
        statusEl.classList.add('flex');

        // Update main play button to stop
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            playBtn.onclick = stopAudio;
            playBtn.classList.add('bg-red-500', 'hover:bg-red-600');
            playBtn.classList.remove('bg-primary-500', 'hover:bg-primary-600');
        }
    } else {
        statusEl.classList.add('hidden');
        statusEl.classList.remove('flex');

        // Reset main play button
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Surah Abspielen';
            playBtn.onclick = playFullSurah;
            playBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            playBtn.classList.add('bg-primary-500', 'hover:bg-primary-600');
        }
    }
}

function updatePlayerInfo(ayahNum) {
    const info = document.getElementById('playing-info');
    if (info) info.innerText = `Ayah ${ayahNum}`;
}

// --- Reciter Logic ---

function changeReciter(reciterId) {
    if (reciterId === currentReciter) return;

    currentReciter = reciterId;
    localStorage.setItem('quran_reciter', currentReciter);

    // Refresh if surah loaded
    if (currentSurah) {
        loadSurah(currentSurah.details.number);
    }
}

async function fetchReciters() {
    try {
        // If already loaded, don't fetch again
        if (recitersList.length > 0) return true;

        const response = await fetch('https://api.alquran.cloud/v1/edition/format/audio');
        const data = await response.json();
        if (data.code === 200) {
            // Filter: Verse by Verse only
            recitersList = data.data.filter(r => r.type === 'versebyverse');
            // Sort by name
            recitersList.sort((a, b) => a.englishName.localeCompare(b.englishName));
            return true;
        }
        return false;
    } catch (e) {
        console.error("Fehler beim Laden der Rezitatoren:", e);
        return false;
    }
}

function populateReciterSelect() {
    const select = document.getElementById('reciter-select');
    if (!select) return;

    // Save current selection to restore if needed or verify
    const currentSelection = select.value;

    if (recitersList.length === 0) {
        // If not loaded yet, wait or keep as is
        return;
    }

    select.innerHTML = '';

    recitersList.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.identifier;
        option.textContent = `${reciter.englishName} (${reciter.language})`;
        if (reciter.identifier === currentReciter) option.selected = true;
        select.appendChild(option);
    });
}
