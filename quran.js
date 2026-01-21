// --- State ---
let allSurahs = [];
let currentSurah = null;
let isPlaying = false;
let currentAudioIndex = -1;
let audioQueue = []; // Array of objects { url, ayahNumber, id }
let tryingSingleFile = false; // Flag to track single file playback attempt

// --- Settings State ---
let currentReciter = localStorage.getItem('quran_reciter') || 'ar.mahermuaiqly';
let continuousPlay = localStorage.getItem('quran_continuous') === 'true';
let recitersList = [];

// --- Translations ---
const revelationTypeTranslations = {
    'Meccan': 'Mekkanisch',
    'Medinan': 'Medinensisch'
};

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

    // Handle Audio Errors (e.g. 404 on single file)
    globalAudio.addEventListener('error', (e) => {
        if (tryingSingleFile) {
            console.warn("Audio error detected during single file playback attempt", e);
            tryingSingleFile = false;
            fallbackToQueue();
        }
    });

    // Initialize UI Controls
    updateContinuousPlayUI();

    // Load reciters list in background to populate button text
    fetchReciters().then(() => updateReciterButtonUI());
});

// --- Surah List Logic ---

async function fetchSurahList() {
    showLoading(true);
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();

        if (data.code === 200) {
            allSurahs = data.data;
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

    // Update Reciter Button
    updateReciterButtonUI();
    updateContinuousPlayUI();

    // Ayahs
    ayahsContainer.innerHTML = '';

    // Navigation Buttons
    const prevBtn = document.getElementById('prev-surah-btn');
    const nextBtn = document.getElementById('next-surah-btn');

    prevBtn.disabled = number <= 1;
    prevBtn.onclick = () => loadSurah(number - 1);

    nextBtn.disabled = number >= 114;
    nextBtn.onclick = () => loadSurah(number + 1);

    const ayahCount = currentSurah.arabic.length;

    for (let i = 0; i < ayahCount; i++) {
        const ar = currentSurah.arabic[i];
        const de = currentSurah.german[i];
        const au = currentSurah.audio[i];

        const ayahDiv = document.createElement('div');
        ayahDiv.id = `ayah-${ar.number}`; // Global Ayah ID
        ayahDiv.className = 'glass-card p-6 rounded-xl transition-colors duration-300 border-l-4 border-transparent';

        ayahDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4 gap-4">
                <span class="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-500">${ar.numberInSurah}</span>
                <div class="text-right w-full">
                    <p class="arabic-text text-2xl md:text-3xl text-gray-800 dark:text-gray-100 leading-loose">${ar.text}</p>
                </div>
            </div>

            <div class="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <p class="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-3">${de.text}</p>

                <div class="flex justify-end">
                    <button onclick="playSingleAyah(${i})" class="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm flex items-center gap-2 px-3 py-1 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition">
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
    if (continuousPlay) {
        stopAudio(); // Reset state
        tryingSingleFile = true;

        const surahNum = currentSurah.details.number;
        // Use currentReciter or fallback if somehow missing
        const reciterId = currentReciter || 'ar.mahermuaiqly';
        const url = `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surahNum}.mp3`;

        globalAudio.src = url;
        const playPromise = globalAudio.play();

        if (playPromise !== undefined) {
             playPromise
                .then(() => {
                    updateAudioUI(true);
                    // Update Info
                    const info = document.getElementById('playing-info');
                    if(info) info.innerText = `Volle Surah`;
                })
                .catch(e => {
                    console.warn("Audio playback failed (Promise Rejected)", e);
                    if (tryingSingleFile) {
                        tryingSingleFile = false;
                        fallbackToQueue();
                    }
                });
        }
    } else {
        fallbackToQueue();
    }
}

function fallbackToQueue() {
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
    // If we were trying single file and it ended, we are done.
    if (tryingSingleFile) {
        stopAudio();
        return;
    }

    currentAudioIndex++;

    if (currentAudioIndex < audioQueue.length) {
        const item = audioQueue[currentAudioIndex];
        globalAudio.src = item.url;
        globalAudio.play();

        // Highlight
        highlightAyah(item.ayahNumber);
        updatePlayerInfo(item.indexInSurah);
    } else {
        // End of queue
        stopAudio();
    }
}

function stopAudio() {
    tryingSingleFile = false;
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
        el.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-slate-800');
        el.classList.remove('border-transparent');

        // Scroll into view nicely
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function removeHighlights() {
    const highlighted = document.querySelectorAll('.border-primary-500');
    highlighted.forEach(el => {
        el.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-slate-800');
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

// --- Reciter & Settings Logic ---

async function openReciterSelection() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');

    if (recitersList.length === 0) {
        await fetchReciters();
    } else {
        populateReciterSelect();
    }
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

async function fetchReciters() {
    const select = document.getElementById('reciter-select');
    if(select && select.children.length <= 1) select.innerHTML = '<option>Lade...</option>';

    try {
        const response = await fetch('https://api.alquran.cloud/v1/edition/format/audio');
        const data = await response.json();
        if (data.code === 200) {
            // Filter: Verse by Verse only
            recitersList = data.data.filter(r => r.type === 'versebyverse');

            // Sort by name
            recitersList.sort((a, b) => a.englishName.localeCompare(b.englishName));

            populateReciterSelect();
            updateReciterButtonUI();
        }
    } catch (e) {
        console.error(e);
        if(select) select.innerHTML = '<option>Fehler beim Laden</option>';
    }
}

function populateReciterSelect() {
    const select = document.getElementById('reciter-select');
    if (!select) return;
    select.innerHTML = '';

    recitersList.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.identifier;
        option.textContent = `${reciter.englishName} (${reciter.language})`;
        if (reciter.identifier === currentReciter) option.selected = true;
        select.appendChild(option);
    });
}

function updateReciterButtonUI() {
    const nameEl = document.getElementById('current-reciter-name');
    if (!nameEl) return;

    if (recitersList.length > 0) {
        const reciter = recitersList.find(r => r.identifier === currentReciter);
        nameEl.innerText = reciter ? reciter.englishName : currentReciter;
    } else {
        nameEl.innerText = 'Rezitator...';
    }
}

function toggleContinuousPlay(isChecked) {
    continuousPlay = isChecked;
    localStorage.setItem('quran_continuous', continuousPlay);
    updateContinuousPlayUI();
}

function updateContinuousPlayUI() {
    const headerToggle = document.getElementById('continuous-play-header');
    const stickyToggle = document.getElementById('continuous-play-sticky');
    if (headerToggle) headerToggle.checked = continuousPlay;
    if (stickyToggle) stickyToggle.checked = continuousPlay;
}

function saveSettings() {
    const newReciter = document.getElementById('reciter-select').value;

    const changed = newReciter !== currentReciter;
    currentReciter = newReciter;
    localStorage.setItem('quran_reciter', currentReciter);

    closeSettings();
    updateReciterButtonUI();

    if (changed && currentSurah) {
        // Reload surah to apply changes
        loadSurah(currentSurah.details.number);
    }
}
