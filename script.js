let cards = [];
let savedSets = [];
let gameCards = [];
let currentIndex = 0;
let score = 0;
let answerShown = false;
let hintsUsed = 0;
let editingSetId = null;
let currentSetName = "";
let cardsSortable = null;
let setsSortable = null;
let currentGameMode = "translation";
let autoSaveTimer = null;
let autoSaveInProgress = false;
let isGameRunning = false;
let selectedPlaySetIndex = null;
let selectedShareSetIndex = null;
let pendingDeleteSetIndex = null;
let currentCardMistakes = 0;
let totalWrongAttempts = 0;
let lastGameOrderSignature = "";
let currentScreenId = "";
let suppressHistoryPush = false;
let gameLaunchSource = "editor";

/*
 * Student Share Links — detect ?play=<setId> or /play/<setId>
 */
let studentShareSetId = null;
let isStudentMode = false;

function initStudentShareLink() {
    studentShareSetId = null;

    const params = new URLSearchParams(window.location.search);
    const queryPlayId = params.get("play");

    if (queryPlayId && queryPlayId.trim() !== "") {
        studentShareSetId = queryPlayId.trim();
        return;
    }

    const pathname = window.location.pathname;
    if (pathname.includes("/play/")) {
        const pathMatch = pathname.match(/\/play\/([^/]+)/);
        if (pathMatch && pathMatch[1]) {
            studentShareSetId = decodeURIComponent(pathMatch[1]).trim();
        }
    }
}

const praiseWords = [
    "Great catch! 🐠",
    "Pearl found!",
    "Splash-tastic! 🌊",
    "Nice swimming! 🫧",
    "You got it! ⭐",
    "Fin-tastic! 🐟",
    "Brilliant! 🐚"
];

function hideAllScreens() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("dashboardScreen").style.display = "none";
    document.getElementById("studentScreen").style.display = "none";
    document.getElementById("teacherScreen").style.display = "none";
    document.getElementById("cardsScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("resultsScreen").style.display = "none";
}

function displayScreen(screenId, addToHistory = true) {
    hideAllScreens();
    document.getElementById(screenId).style.display = "block";
    currentScreenId = screenId;

    if (addToHistory && !suppressHistoryPush) {
        history.pushState({ screen: screenId }, "", "#" + screenId.replace("Screen", ""));
    }
}

window.addEventListener("popstate", (event) => {
    if (!event.state || !event.state.screen) return;

    suppressHistoryPush = true;

    const screenId = event.state.screen;
    if (screenId === "dashboardScreen") {
        showDashboard(false);
    } else if (screenId === "teacherScreen") {
        hideAllScreens();
        document.getElementById("teacherScreen").style.display = "block";
    } else if (screenId === "cardsScreen") {
        showCardsScreen(false);
    } else if (screenId === "gameScreen") {
        hideAllScreens();
        document.getElementById("gameScreen").style.display = "block";
    } else if (screenId === "authScreen") {
        hideAllScreens();
        document.getElementById("authScreen").style.display = "block";
    } else if (screenId === "studentScreen") {
        hideAllScreens();
        document.getElementById("studentScreen").style.display = "block";
    }

    suppressHistoryPush = false;
});

let toastTimer = null;

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = "toast show " + type;

    toastTimer = setTimeout(() => {
        toast.className = "toast " + type;
    }, 2600);
}

function setSaveStatus(message, type = "saved") {
    const saveStatus = document.getElementById("saveStatus");
    if (!saveStatus) return;

    saveStatus.textContent = message;
    saveStatus.className = "save-status " + type;
}

async function showDashboard(addToHistory = true) {
    isGameRunning = false;
    clearTimeout(autoSaveTimer);
    displayScreen("dashboardScreen", addToHistory);

    let savedSetsList = document.getElementById("savedSetsList");
    savedSetsList.innerHTML = `
        <div class="card loading-card">
            <h2>🫧 Fishing for your sets...</h2>
        </div>
    `;

    try {
        savedSets = await dbLoadSetsWithCards();
        renderDashboard();
    } catch (error) {
        savedSetsList.innerHTML = `
            <div class="card">
                <h2>⚠️ Could not load sets</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}

function renderDashboard() {
    let savedSetsList = document.getElementById("savedSetsList");

    if (setsSortable) {
        setsSortable.destroy();
        setsSortable = null;
    }

    savedSetsList.innerHTML = "";

    if (savedSets.length === 0) {
        savedSetsList.innerHTML = `
            <div class="card empty-library-card">
                <h2>🐚 Your library is empty</h2>
                <p>Make your first vocabulary set and start collecting pearls.</p>
            </div>
        `;
        return;
    }

    for (let i = 0; i < savedSets.length; i++) {
        let setId = savedSets[i].id;
        let wordCount = savedSets[i].cards ? savedSets[i].cards.length : 0;
        let imageCount = (savedSets[i].cards || []).filter(card => card.imageUrl).length;

        savedSetsList.innerHTML += `
            <div class="card set-card" data-set-id="${escapeAttribute(setId)}">
                <div class="set-card-header">
                    <button type="button" class="set-drag-handle" aria-label="Drag to reorder set" title="Drag to reorder">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                    </button>
                    <div class="set-card-icon-actions">
                        <button type="button" class="set-icon-button set-icon-edit" onclick="editSet('${escapeAttribute(setId)}')" aria-label="Edit set" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
                        </button>
                        <span class="set-icon-button set-icon-duplicate" role="button" tabindex="0" aria-label="Duplicate set" title="Duplicate" onclick="duplicateSet('${escapeAttribute(setId)}')" onkeydown="handleDuplicateSetKeydown(event, '${escapeAttribute(setId)}')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
                        </span>
                        <button type="button" class="set-icon-button set-icon-delete" onclick="deleteSet('${escapeAttribute(setId)}')" aria-label="Delete set" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                        </button>
                    </div>
                </div>
                <div class="set-card-topline">🐠 Ready to play</div>
                <h2>📚 ${escapeHTML(savedSets[i].name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>

                <div class="set-actions">
                    <button class="green-button" onclick="openPlayChoice('${escapeAttribute(setId)}')">▶️ Play</button>
                    <button class="share-button" onclick="openShareDialog('${escapeAttribute(setId)}')">Share</button>
                </div>
            </div>
        `;
    }

    initSetsSortable();
}

function resolveSetIndex(indexOrId) {
    if (typeof indexOrId === "number") {
        return indexOrId;
    }

    return savedSets.findIndex((set) => set.id === indexOrId);
}

function initSetsSortable() {
    const savedSetsList = document.getElementById("savedSetsList");

    if (setsSortable) {
        setsSortable.destroy();
        setsSortable = null;
    }

    if (!savedSetsList || savedSets.length === 0 || typeof Sortable === "undefined") {
        return;
    }

    setsSortable = new Sortable(savedSetsList, {
        animation: 150,
        handle: ".set-drag-handle",
        draggable: ".set-card",
        delayOnTouchOnly: true,
        delay: 120,
        touchStartThreshold: 4,
        ghostClass: "set-card-ghost",
        dragClass: "set-card-dragging",
        onEnd(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            handleSetsReordered(evt.oldIndex, evt.newIndex);
        }
    });
}

async function handleSetsReordered(oldIndex, newIndex) {
    const moved = savedSets.splice(oldIndex, 1)[0];
    savedSets.splice(newIndex, 0, moved);

    try {
        await dbUpdateSetPositions(savedSets);
        showToast("Sets reordered.", "success");
    } catch (error) {
        showToast("Could not save order: " + error.message, "error");
        await showDashboard(false);
    }
}


function openPlayChoice(indexOrId) {
    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    selectedPlaySetIndex = index;
    const selectedSet = savedSets[index];
    document.getElementById("playChoiceTitle").textContent = "Play: " + selectedSet.name;
    document.getElementById("playChoiceModal").style.display = "flex";
}

function closePlayChoice() {
    selectedPlaySetIndex = null;
    document.getElementById("playChoiceModal").style.display = "none";
}

function openShareDialog(indexOrId) {
    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    selectedShareSetIndex = index;
    const selectedSet = savedSets[index];
    const shareUrl = "https://word-fish.vercel.app/?play=" + encodeURIComponent(selectedSet.id);
    document.getElementById("shareLinkInput").value = shareUrl;
    document.getElementById("shareModal").style.display = "flex";
}

function closeShareDialog() {
    selectedShareSetIndex = null;
    document.getElementById("shareModal").style.display = "none";
}

async function copyShareLinkPlaceholder() {
    const shareInput = document.getElementById("shareLinkInput");
    if (!shareInput) return;

    const link = shareInput.value.trim();
    if (link === "") {
        showToast("Could not copy link", "error");
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(link);
        } else {
            shareInput.removeAttribute("readonly");
            shareInput.select();
            shareInput.setSelectionRange(0, link.length);
            const copied = document.execCommand("copy");
            shareInput.setAttribute("readonly", "");
            if (!copied) {
                throw new Error("Copy failed");
            }
        }

        showToast("Link copied!", "success");
    } catch (error) {
        showToast("Could not copy link", "error");
    }
}

async function startChosenSetGame(mode) {
    if (selectedPlaySetIndex === null) return;

    const selectedSet = savedSets[selectedPlaySetIndex];
    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);
    closePlayChoice();
    await startGame(mode, "dashboard");
}

function showTeacherScreen() {
    displayScreen("teacherScreen");
    editingSetId = null;
    currentSetName = "";

    document.getElementById("setName").value = "";
    document.getElementById("wordList").value = "";
}

async function createSetAndOpenCards() {
    let setName = document.getElementById("setName").value;
    let words = document.getElementById("wordList").value;

    if (setName.trim() === "") {
        showToast("🐚 Please give this set a name.", "warning");
        return;
    }

    if (words.trim() === "") {
        showToast("🐟 Add at least one English word.", "warning");
        return;
    }

    cards = words
        .split("\n")
        .filter(word => word.trim() !== "")
        .map(word => ({
            english: word.trim(),
            thai: "",
            imageUrl: ""
        }));

    try {
        const newSet = await dbCreateSetWithCards(setName.trim(), cards);
        editingSetId = newSet.id;
        currentSetName = newSet.name;
        showCardsScreen();
        showToast("Set created! 🐠", "success");
    } catch (error) {
        showToast("Could not create set: " + error.message, "error");
    }
}

function editSet(indexOrId) {
    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    let selectedSet = savedSets[index];

    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);

    showCardsScreen();
}

function getDuplicateSetName(originalName) {
    const baseName = originalName.trim();
    const existingNames = savedSets.map((set) => set.name);
    const firstChoice = `${baseName} (Copy)`;

    if (!existingNames.includes(firstChoice)) {
        return firstChoice;
    }

    let counter = 2;
    while (existingNames.includes(`${baseName} (Copy ${counter})`)) {
        counter++;
    }

    return `${baseName} (Copy ${counter})`;
}

function scrollToDuplicatedSet(setId) {
    requestAnimationFrame(() => {
        const card = document.querySelector(`#savedSetsList .set-card[data-set-id="${setId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });
}

function handleDuplicateSetKeydown(event, indexOrId) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        duplicateSet(indexOrId);
    }
}

async function duplicateSet(indexOrId) {
    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    const sourceSet = savedSets[index];
    const duplicateName = getDuplicateSetName(sourceSet.name);

    try {
        const newSet = await dbDuplicateSet(sourceSet, duplicateName);
        await showDashboard(false);
        scrollToDuplicatedSet(newSet.id);
        showToast("Set duplicated successfully.", "success");
    } catch (error) {
        showToast("Could not duplicate set: " + error.message, "error");
    }
}

function deleteSet(indexOrId) {
    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    openDeleteConfirm(index);
}

function openDeleteConfirm(index) {
    pendingDeleteSetIndex = index;
    const setName = savedSets[index].name;
    document.getElementById("deleteConfirmSetName").textContent = `"${setName}"`;
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function closeDeleteConfirm() {
    pendingDeleteSetIndex = null;
    document.getElementById("deleteConfirmModal").style.display = "none";
}

function closeDeleteConfirmOnBackdrop(event) {
    if (event.target === event.currentTarget) {
        closeDeleteConfirm();
    }
}

async function confirmDeleteSet() {
    if (pendingDeleteSetIndex === null) return;

    const index = pendingDeleteSetIndex;
    closeDeleteConfirm();

    try {
        await dbDeleteSet(savedSets[index].id);
        showToast("Set deleted 🗑️", "success");
        await showDashboard();
    } catch (error) {
        showToast("Could not delete set: " + error.message, "error");
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const deleteModal = document.getElementById("deleteConfirmModal");
    if (deleteModal && deleteModal.style.display === "flex") {
        closeDeleteConfirm();
    }
});

function prepareCards(oldCards) {
    return oldCards.map(card => ({
        id: card.id,
        english: card.english || "",
        thai: card.thai || card.translation || "",
        imageUrl: card.imageUrl || card.image_url || ""
    }));
}

function showCardsScreen(addToHistory = true) {
    isGameRunning = false;
    displayScreen("cardsScreen", addToHistory);
    document.getElementById("builderSetName").value = currentSetName || "";
    setSaveStatus("✅ Saved", "saved");

    renderCards();
}

function renderCards() {
    let cardsList = document.getElementById("cardsList");
    cardsList.innerHTML = "";

    if (cards.length === 0) {
        cardsList.innerHTML = `
            <div class="card empty-library-card">
                <h2>🐚 No cards yet</h2>
                <p>Click + New Word to add your first card.</p>
            </div>
        `;
        if (cardsSortable) {
            cardsSortable.destroy();
            cardsSortable = null;
        }
        return;
    }

    for (let i = 0; i < cards.length; i++) {
        cardsList.innerHTML += `
            <div class="card word-card">
                <div class="word-card-header">
                    <div class="card-number">🐟 Card ${i + 1}</div>

                    <div class="drag-handle">
                        ↕ Drag
                    </div>

                    <button class="red-button" onclick="deleteWord(${i})">🗑️ Delete</button>
                </div>

                <div class="word-fields">
                    <div class="field-group">
                        <label>🇬🇧 English word</label>
                        <input 
                            value="${escapeAttribute(cards[i].english)}" 
                            oninput="updateCardField(${i}, 'english', this.value)"
                            placeholder="English word"
                        >
                    </div>

                    <div class="field-group">
                        <label>🇹🇭 Thai translation</label>
                        <input 
                            value="${escapeAttribute(cards[i].thai)}" 
                            oninput="updateCardField(${i}, 'thai', this.value)"
                            placeholder="Thai translation"
                        >
                    </div>
                </div>

                <div class="image-preview">
                    <strong>🖼️ Picture clue</strong>

                    ${cards[i].imageUrl ? `<img src="${escapeAttribute(cards[i].imageUrl)}">` : `<p>🐚 No image yet</p>`}

                    <input 
                        value="${escapeAttribute(cards[i].imageUrl)}"
                        oninput="updateCardField(${i}, 'imageUrl', this.value)"
                        placeholder="Image URL"
                    >

                    <br>

                    <input 
                        type="file" 
                        accept="image/*"
                        onchange="uploadImage(event, ${i})"
                    >

                    <br>

                    <button class="disabled-button" onclick="aiComingSoon()">🤖✨ AI Generation Coming Soon</button>
                </div>
            </div>
        `;
    }

    initCardsSortable();
}

function initCardsSortable() {
    const cardsList = document.getElementById("cardsList");

    if (cardsSortable) {
        cardsSortable.destroy();
        cardsSortable = null;
    }

    if (!cardsList || cards.length === 0 || typeof Sortable === "undefined") {
        return;
    }

    cardsSortable = new Sortable(cardsList, {
        animation: 150,
        handle: ".drag-handle",
        draggable: ".word-card",
        filter: "input, textarea, button, select, a",
        preventOnFilter: false,
        delayOnTouchOnly: true,
        delay: 120,
        touchStartThreshold: 4,
        onEnd(evt) {
            if (evt.oldIndex === evt.newIndex) return;

            const moved = cards.splice(evt.oldIndex, 1)[0];
            cards.splice(evt.newIndex, 0, moved);
            renderCards();
            scheduleAutoSave();
        }
    });
}

function updateSetName(value) {
    currentSetName = value;
    scheduleAutoSave();
}

function updateCardField(index, field, value) {
    cards[index][field] = value;
    scheduleAutoSave();
}

function aiComingSoon() {
    showToast("🤖 AI image generation is coming soon!", "info");
}

function addNewWord() {
    cards.push({
        english: "",
        thai: "",
        imageUrl: ""
    });

    renderCards();
    scheduleAutoSave();
}

function deleteWord(index) {
    cards.splice(index, 1);
    renderCards();
    scheduleAutoSave();
}

async function uploadImage(event, index) {
    let file = event.target.files[0];

    if (!file) return;

    try {
        cards[index].imageUrl = "Uploading...";
        renderCards();
        setSaveStatus("🫧 Uploading image...", "saving");

        const imageUrl = await dbUploadImage(file);

        cards[index].imageUrl = imageUrl;
        renderCards();
        scheduleAutoSave(100);
        showToast("Image uploaded 🖼️", "success");
    } catch (error) {
        showToast("Could not upload image: " + error.message, "error");
        cards[index].imageUrl = "";
        renderCards();
    }
}

async function translateAllToThai() {
    setSaveStatus("🌐 Translating...", "saving");

    for (let i = 0; i < cards.length; i++) {
        if (cards[i].thai.trim() === "" && cards[i].english.trim() !== "") {
            cards[i].thai = await translateWordToThai(cards[i].english);
        }
    }

    renderCards();
    scheduleAutoSave(100);
    showToast("Translations added 🌐", "success");
}

async function translateWordToThai(word) {
    try {
        let response = await fetch(
            "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(word) + "&langpair=en|th"
        );

        let data = await response.json();

        return data.responseData.translatedText || "";

    } catch (error) {
        return "";
    }
}

function cleanCardsForSaving() {
    return cards
        .filter(card => card.english.trim() !== "")
        .map(card => ({
            id: card.id,
            english: card.english.trim(),
            thai: (card.thai || "").trim(),
            imageUrl: card.imageUrl || ""
        }));
}

function scheduleAutoSave(delay = 1200) {
    if (!editingSetId || isGameRunning || isStudentMode) return;

    clearTimeout(autoSaveTimer);
    setSaveStatus("💾 Saving...", "saving");

    autoSaveTimer = setTimeout(() => {
        autoSaveNow();
    }, delay);
}

async function autoSaveNow() {
    if (isStudentMode || !editingSetId || autoSaveInProgress) return;

    let setName = document.getElementById("builderSetName")?.value || currentSetName;

    if (setName.trim() === "") {
        setSaveStatus("⚠️ Add set name", "warning");
        return;
    }

    const cleaned = cleanCardsForSaving();

    if (cleaned.length === 0) {
        setSaveStatus("⚠️ Add a word", "warning");
        return;
    }

    autoSaveInProgress = true;

    try {
        const savedSet = await dbSaveSetWithCards(editingSetId, setName.trim(), cleaned);
        editingSetId = savedSet.id;
        currentSetName = savedSet.name;
        cards = prepareCards(cleaned);
        setSaveStatus("✅ Saved", "saved");
    } catch (error) {
        setSaveStatus("⚠️ Not saved", "error");
        showToast("Could not autosave: " + error.message, "error");
    } finally {
        autoSaveInProgress = false;
    }
}

async function backToDashboard() {
    clearTimeout(autoSaveTimer);
    await autoSaveNow();
    await showDashboard();
}

async function saveCardsBeforePlay() {
    if (isStudentMode || !editingSetId) return;

    clearTimeout(autoSaveTimer);
    await autoSaveNow();
}

async function startGame(mode, fromSource) {
    if (fromSource) {
        gameLaunchSource = fromSource;
    } else if (currentScreenId === "cardsScreen") {
        gameLaunchSource = "editor";
    }

    currentGameMode = mode;

    await saveCardsBeforePlay();

    const playableCards = cleanCardsForSaving();

    if (playableCards.length === 0) {
        showToast("🐟 Add at least one English word before playing.", "warning");
        returnToPreGameScreen();
        return;
    }

    if (mode === "translation") {
        let missingTranslations = playableCards.filter(card => card.thai.trim() === "").length;

        if (missingTranslations > 0) {
            showToast("Some cards have no translation, so English will appear for them.", "warning");
        }
    }

    if (mode === "picture") {
        let missingImages = playableCards.filter(card => !card.imageUrl).length;

        if (missingImages > 0) {
            showToast(`${missingImages} card(s) need images before Picture mode.`, "warning");
            returnToPreGameScreen();
            return;
        }
    }

    gameCards = shuffleCards(playableCards);
    currentIndex = 0;
    score = 0;
    hintsUsed = 0;
    totalWrongAttempts = 0;
    currentCardMistakes = 0;
    isGameRunning = true;

    displayScreen("gameScreen");

    if (mode === "picture") {
        document.getElementById("gameTitle").textContent = "🖼️ Look and Type the English Word";
    } else {
        document.getElementById("gameTitle").textContent = "🇹🇭 Translate and Type the English Word";
    }

    showCard();
}

function shuffleCards(cardList) {
    if (cardList.length <= 1) return [...cardList];

    let shuffled = [...cardList];
    let attempts = 0;

    do {
        shuffled = [...cardList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        attempts++;
    } while (getOrderSignature(shuffled) === lastGameOrderSignature && attempts < 8);

    lastGameOrderSignature = getOrderSignature(shuffled);
    return shuffled;
}

function getOrderSignature(cardList) {
    return cardList.map(card => card.id || card.english).join("|");
}

function exitGame() {
    isGameRunning = false;
    returnToPreGameScreen();
}

function navigateAfterGame() {
    if (gameLaunchSource === "student" || isStudentMode) {
        displayScreen("studentScreen", false);
        if (currentSetName) {
            showStudentChoice(currentSetName);
        }
        return;
    }

    if (gameLaunchSource === "dashboard") {
        showDashboard();
        return;
    }

    showCardsScreen();
}

function returnToPreGameScreen() {
    navigateAfterGame();
}

async function startStudentGame(mode) {
    await startGame(mode, "student");
}

function showStudentLoading() {
    document.getElementById("studentScreen").classList.add("student-loading-active");
    document.getElementById("studentLoadingPanel").style.display = "flex";
    document.getElementById("studentSetTitle").style.display = "none";
    document.getElementById("studentChoicePanel").style.display = "none";
    document.getElementById("studentUnavailable").style.display = "none";
}

function showStudentChoice(setName) {
    document.getElementById("studentScreen").classList.remove("student-loading-active");
    document.getElementById("studentLoadingPanel").style.display = "none";
    document.getElementById("studentSetTitle").style.display = "block";
    document.getElementById("studentSetTitle").textContent = setName;
    document.getElementById("studentChoicePanel").style.display = "block";
    document.getElementById("studentUnavailable").style.display = "none";
    updateStudentPictureModeAvailability();
}

function updateStudentPictureModeAvailability() {
    const pictureButton = document.getElementById("studentPictureButton");
    const pictureUnavailableNote = document.getElementById("studentPictureUnavailable");

    if (!pictureButton || !pictureUnavailableNote) return;

    const playableCards = cleanCardsForSaving();
    const hasAllImages = playableCards.length > 0
        && playableCards.every((card) => card.imageUrl);

    pictureButton.disabled = !hasAllImages;
    pictureUnavailableNote.style.display = hasAllImages ? "none" : "block";
}

function showStudentUnavailable() {
    document.getElementById("studentScreen").classList.remove("student-loading-active");
    document.getElementById("studentLoadingPanel").style.display = "none";
    document.getElementById("studentSetTitle").style.display = "none";
    document.getElementById("studentChoicePanel").style.display = "none";
    document.getElementById("studentUnavailable").style.display = "block";
}

async function enterStudentMode(setId) {
    isStudentMode = true;
    editingSetId = null;
    displayScreen("studentScreen", false);
    history.replaceState({ screen: "studentScreen" }, "", "?play=" + encodeURIComponent(setId));

    showStudentLoading();

    try {
        const set = await dbLoadPublicSetById(setId);

        if (!set || !set.cards || set.cards.length === 0) {
            showStudentUnavailable();
            return;
        }

        editingSetId = set.id;
        currentSetName = set.name;
        cards = prepareCards(set.cards);

        showStudentChoice(set.name);
    } catch (error) {
        console.error("Student set load failed:", error);
        showStudentUnavailable();
    }
}

function backToWordFishHome() {
    isStudentMode = false;
    studentShareSetId = null;
    window.location.href = window.location.pathname;
}

function leaveGameResults() {
    navigateAfterGame();
}

function showCard() {
    answerShown = false;
    currentCardMistakes = 0;

    if (gameCards.length === 0) {
        returnToPreGameScreen();
        return;
    }

    let currentCard = gameCards[currentIndex];
    let gameImage = document.getElementById("gameImage");
    let currentPrompt = document.getElementById("currentPrompt");

    if (currentGameMode === "picture") {
        gameImage.src = currentCard.imageUrl;
        gameImage.style.display = "block";

        currentPrompt.textContent = "What is it?";
        currentPrompt.style.fontSize = "";

    } else {
        gameImage.style.display = "none";

        let promptText = currentCard.thai;

        if (promptText.trim() === "") {
            promptText = currentCard.english;
        }

        currentPrompt.textContent = promptText;
        currentPrompt.style.fontSize = "";
    }

    document.getElementById("answerInput").value = "";
    document.getElementById("feedback").textContent = "";
    document.getElementById("scoreText").textContent = "Score: " + score + " / " + gameCards.length;

    updatePearls();
}

function checkAnswer() {
    let answer = document.getElementById("answerInput").value;
    let correctAnswer = gameCards[currentIndex].english;

    if (answer.toLowerCase().trim() == correctAnswer.toLowerCase().trim()) {
        const perfectAnswer = !answerShown && currentCardMistakes === 0;

        if (perfectAnswer) {
            score++;
        }

        let randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
        document.getElementById("feedback").textContent = perfectAnswer
            ? randomPraise
            : "Correct! Keep practising 🐚";

        currentIndex++;

        if (currentIndex < gameCards.length) {
            setTimeout(showCard, 900);
        } else {
            setTimeout(showResults, 900);
        }

    } else {
        currentCardMistakes++;
        totalWrongAttempts++;
        document.getElementById("feedback").textContent = "Try again! 🐠";
        document.getElementById("answerInput").value = "";
    }
}

function showAnswer() {
    if (!answerShown) {
        hintsUsed++;
    }

    answerShown = true;

    let correctAnswer = gameCards[currentIndex].english;

    document.getElementById("feedback").textContent = "Answer: " + correctAnswer;
}

function updatePearls() {
    const pearlBar = document.getElementById("pearlBar");
    pearlBar.innerHTML = "";

    for (let i = 0; i < gameCards.length; i++) {
        if (i < score) {
            const shell = document.createElement("img");
            shell.src = "assets/shell.png";
            shell.alt = "Shell collected";
            shell.className = "pearl-shell";
            pearlBar.appendChild(shell);
        } else {
            const empty = document.createElement("span");
            empty.className = "pearl-empty";
            empty.textContent = "○";
            empty.setAttribute("aria-hidden", "true");
            pearlBar.appendChild(empty);
        }
    }
}

function showResults() {
    isGameRunning = false;
    displayScreen("resultsScreen");

    let accuracy = Math.round(score / gameCards.length * 100);
    let stars = getStars(accuracy);
    let title = getResultTitle(accuracy);

    document.getElementById("resultTitle").textContent = title;

    document.getElementById("finalScore").innerHTML = `
        <div class="sea-stars">${stars}</div>
        <div class="result-stats">
            <div class="result-stat-row">
                <span class="result-stat-label">Perfect answers</span>
                <span class="result-stat-value">${score} / ${gameCards.length}</span>
            </div>
            <div class="result-stat-row">
                <span class="result-stat-label">Accuracy</span>
                <span class="result-stat-value">${accuracy}%</span>
            </div>
            <div class="result-stat-row">
                <span class="result-stat-label">Hints used</span>
                <span class="result-stat-value">${hintsUsed}</span>
            </div>
            <div class="result-stat-row">
                <span class="result-stat-label">Wrong tries</span>
                <span class="result-stat-value">${totalWrongAttempts}</span>
            </div>
        </div>
    `;

    ensureResultsActions();

    const resultsButtons = document.querySelectorAll("#resultsScreen .results-actions button");
    if (resultsButtons.length >= 2) {
        resultsButtons[0].textContent = "Play Again";
        resultsButtons[1].textContent = "Choose Another Game";
    }
}

function ensureResultsActions() {
    const resultsScreen = document.getElementById("resultsScreen");
    if (resultsScreen.querySelector(".results-actions")) return;

    const actions = document.createElement("div");
    actions.className = "results-actions";
    resultsScreen.querySelectorAll("button").forEach((button) => actions.appendChild(button));
    resultsScreen.appendChild(actions);
}

function getStars(accuracy) {
    if (accuracy >= 90) return "⭐ ⭐ ⭐ ⭐ ⭐";
    if (accuracy >= 80) return "⭐ ⭐ ⭐ ⭐";
    if (accuracy >= 70) return "⭐ ⭐ ⭐";
    if (accuracy >= 60) return "⭐ ⭐";
    return "⭐";
}

function getResultTitle(accuracy) {
    if (accuracy === 100) return "Perfect!";
    if (accuracy >= 70) return "Great job!";
    return "Keep practicing!";
}

function escapeAttribute(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

async function checkAuth() {
    initStudentShareLink();

    if (studentShareSetId) {
        await enterStudentMode(studentShareSetId);
        return;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        showDashboard();
    } else {
        const playParam = new URLSearchParams(window.location.search).get("play");
        if (playParam && playParam.trim() !== "") {
            await enterStudentMode(playParam.trim());
            return;
        }

        displayScreen("authScreen", false);
        history.replaceState({ screen: "authScreen" }, "", "#auth");
    }
}

async function signUp() {
    let email = document.getElementById("authEmail").value.trim();
    let password = document.getElementById("authPassword").value;

    if (email === "" || password === "") {
        document.getElementById("authMessage").textContent = "Please enter email and password.";
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        document.getElementById("authMessage").textContent = error.message;
        return;
    }

    document.getElementById("authMessage").textContent =
        "Account created! Check your email if confirmation is required. 🐚";
}

async function login() {
    let email = document.getElementById("authEmail").value.trim();
    let password = document.getElementById("authPassword").value;

    if (email === "" || password === "") {
        document.getElementById("authMessage").textContent = "Please enter email and password.";
        return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        document.getElementById("authMessage").textContent = error.message;
        return;
    }

    showDashboard();
}

async function logout() {
    await supabaseClient.auth.signOut();

    cards = [];
    savedSets = [];
    gameCards = [];
    editingSetId = null;
    currentSetName = "";
    isGameRunning = false;

    displayScreen("authScreen");
}

initStudentShareLink();
if (studentShareSetId) {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("studentScreen").style.display = "block";
    showStudentLoading();
}
checkAuth();
