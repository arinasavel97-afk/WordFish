let cards = [];
let savedSets = [];
let trashedSets = [];
let gameCards = [];
let currentIndex = 0;
let score = 0;
let answerShown = false;
let hintsUsed = 0;
let editingSetId = null;
let currentSetName = "";
let cardsSortable = null;
let setsSortable = null;
let dashboardSearchQuery = "";
let dashboardSortMode = "custom";
let dashboardFilterMode = "all";
let dashboardSelectionMode = false;
let dashboardSelectedSetIds = new Set();
let currentGameMode = "translation";
let autoSaveTimer = null;
let autoSaveInProgress = false;
let isGameRunning = false;
let selectedPlaySetIndex = null;
let selectedShareSetIndex = null;
let pendingDeleteSetIndex = null;
let deleteConfirmMode = "single";
let pendingBulkDeleteSetIds = [];
let pendingPermanentDeleteSetIds = [];
let pendingBulkDuplicateSetIds = [];
let currentCardMistakes = 0;
let totalWrongAttempts = 0;
let lastGameOrderSignature = "";
let currentScreenId = "";
let suppressHistoryPush = false;
let gameLaunchSource = "editor";
let classroomSelectedSetId = null;
let classroomPresentationCards = [];
let classroomPresentationIndex = 0;
let classroomPresentationSetName = "";
let classroomTranslationVisible = false;
let classroomFlashcardsCards = [];
let classroomFlashcardsIndex = 0;
let classroomFlashcardsSetName = "";
let classroomFlashcardSide = "front";
let classroomFlashcardsShuffleEnabled = false;
let classroomFlashcardsShuffledOrder = [];
let classroomTextFlashcardsCards = [];
let classroomTextFlashcardsIndex = 0;
let classroomTextFlashcardsSetName = "";
let classroomTextFlashcardSide = "front";
let classroomTextFlashcardDirection = "translationToEnglish";
let classroomTextFlashcardsShuffleEnabled = false;
let classroomTextFlashcardsShuffledOrder = [];
let classroomVocabularyBoardSetName = "";
let classroomVocabularyBoardMode = "pictureEnglish";
let classroomVocabularyBoardCards = [];
let classroomVocabularyBoardCardSize = "medium";
const GAME_CONTEXT_STORAGE_KEY = "wordfish_game_context";
const CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY = "wordfish_classroom_presentation_context";
const CLASSROOM_ACTIVITY_CONTEXT_STORAGE_KEY = "wordfish_classroom_activity_context";
const CLASSROOM_FLASHCARDS_CONTEXT_STORAGE_KEY = "wordfish_classroom_flashcards_context";
const CLASSROOM_TEXT_FLASHCARDS_CONTEXT_STORAGE_KEY = "wordfish_classroom_text_flashcards_context";
const CLASSROOM_VOCABULARY_BOARD_CONTEXT_STORAGE_KEY = "wordfish_classroom_vocabulary_board_context";
const CLASSROOM_VOCABULARY_BOARD_CARD_SIZE_STORAGE_KEY = "wordfishVocabularyBoardCardSize";
const CLASSROOM_VOCABULARY_BOARD_MODE_STORAGE_KEY = "wordfishVocabularyBoardMode";
const CLASSROOM_VOCABULARY_BOARD_CARD_SIZES = ["small", "medium", "large"];
const CLASSROOM_VOCABULARY_BOARD_MODES = ["pictureEnglish", "englishThai"];
const CLASSROOM_SHORTCUTS_HINT_STORAGE_KEY = "wordfish_hide_classroom_shortcuts_hint";
const SETTINGS_KEYS = {
    trashAutoDelete: "wordfish_settings_trash_auto_delete",
    enableAnimations: "wordfish_settings_enable_animations",
    celebrationPerfect: "wordfish_settings_celebration_perfect"
};
const SETTINGS_DEFAULTS = {
    trashAutoDelete: "never",
    enableAnimations: true,
    celebrationPerfect: true
};

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
    document.getElementById("appLoadingScreen").style.display = "none";
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("dashboardScreen").style.display = "none";
    const classroomPickerScreen = document.getElementById("classroomPickerScreen");
    const classroomActivityMenuScreen = document.getElementById("classroomActivityMenuScreen");
    const classroomPresentationScreen = document.getElementById("classroomPresentationScreen");
    const classroomFlashcardsScreen = document.getElementById("classroomFlashcardsScreen");
    const classroomTextFlashcardsScreen = document.getElementById("classroomTextFlashcardsScreen");
    const classroomNoCardsScreen = document.getElementById("classroomNoCardsScreen");
    const classroomVocabularyBoardScreen = document.getElementById("classroomVocabularyBoardScreen");
    if (classroomPickerScreen) {
        classroomPickerScreen.style.display = "none";
    }
    if (classroomActivityMenuScreen) {
        classroomActivityMenuScreen.style.display = "none";
    }
    if (classroomPresentationScreen) {
        classroomPresentationScreen.style.display = "none";
    }
    if (classroomFlashcardsScreen) {
        classroomFlashcardsScreen.style.display = "none";
    }
    if (classroomTextFlashcardsScreen) {
        classroomTextFlashcardsScreen.style.display = "none";
    }
    if (classroomNoCardsScreen) {
        classroomNoCardsScreen.style.display = "none";
    }
    if (classroomVocabularyBoardScreen) {
        classroomVocabularyBoardScreen.style.display = "none";
    }
    document.getElementById("studentScreen").style.display = "none";
    document.getElementById("teacherScreen").style.display = "none";
    document.getElementById("cardsScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("resultsScreen").style.display = "none";
}

function showAppLoading() {
    hideAllScreens();
    document.getElementById("appLoadingScreen").style.display = "block";
}

function hideAppLoading() {
    document.getElementById("appLoadingScreen").style.display = "none";
}

function saveGameContext(mode, fromSource) {
    if (!editingSetId) return;

    sessionStorage.setItem(GAME_CONTEXT_STORAGE_KEY, JSON.stringify({
        setId: editingSetId,
        gameMode: mode,
        launchedFrom: fromSource || gameLaunchSource
    }));
}

function loadGameContext() {
    try {
        const raw = sessionStorage.getItem(GAME_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearGameContext() {
    sessionStorage.removeItem(GAME_CONTEXT_STORAGE_KEY);
}

function isGameRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "game";
}

function saveClassroomPresentationContext() {
    if (currentScreenId !== "classroomPresentationScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomPresentation",
        setId: classroomSelectedSetId,
        currentCardIndex: classroomPresentationIndex,
        translationVisible: classroomTranslationVisible
    }));
}

function loadClassroomPresentationContext() {
    try {
        const raw = localStorage.getItem(CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearClassroomPresentationContext() {
    localStorage.removeItem(CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY);
}

function isClassroomPresentationRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "classroomPresentation";
}

function saveClassroomActivityContext() {
    if (currentScreenId !== "classroomActivityMenuScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_ACTIVITY_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomActivityMenu",
        setId: classroomSelectedSetId
    }));
}

function loadClassroomActivityContext() {
    try {
        const raw = localStorage.getItem(CLASSROOM_ACTIVITY_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearClassroomActivityContext() {
    localStorage.removeItem(CLASSROOM_ACTIVITY_CONTEXT_STORAGE_KEY);
}

function isClassroomActivityMenuRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "classroomActivityMenu";
}

function saveClassroomFlashcardsContext() {
    if (currentScreenId !== "classroomFlashcardsScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_FLASHCARDS_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomFlashcards",
        setId: classroomSelectedSetId,
        currentCardIndex: classroomFlashcardsIndex,
        cardSide: classroomFlashcardSide,
        shuffleEnabled: classroomFlashcardsShuffleEnabled,
        shuffledOrder: classroomFlashcardsShuffledOrder
    }));
}

function loadClassroomFlashcardsContext() {
    try {
        const raw = localStorage.getItem(CLASSROOM_FLASHCARDS_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearClassroomFlashcardsContext() {
    localStorage.removeItem(CLASSROOM_FLASHCARDS_CONTEXT_STORAGE_KEY);
}

function isClassroomFlashcardsRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "classroomFlashcards";
}

function saveClassroomTextFlashcardsContext() {
    if (currentScreenId !== "classroomTextFlashcardsScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_TEXT_FLASHCARDS_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomTextFlashcards",
        setId: classroomSelectedSetId,
        currentCardIndex: classroomTextFlashcardsIndex,
        cardSide: classroomTextFlashcardSide,
        direction: classroomTextFlashcardDirection,
        shuffleEnabled: classroomTextFlashcardsShuffleEnabled,
        shuffledOrder: classroomTextFlashcardsShuffledOrder
    }));
}

function loadClassroomTextFlashcardsContext() {
    try {
        const raw = localStorage.getItem(CLASSROOM_TEXT_FLASHCARDS_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearClassroomTextFlashcardsContext() {
    localStorage.removeItem(CLASSROOM_TEXT_FLASHCARDS_CONTEXT_STORAGE_KEY);
}

function isClassroomTextFlashcardsRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "classroomTextFlashcards";
}

function saveClassroomVocabularyBoardContext() {
    if (currentScreenId !== "classroomVocabularyBoardScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_VOCABULARY_BOARD_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomVocabularyBoard",
        setId: classroomSelectedSetId,
        boardMode: classroomVocabularyBoardMode
    }));
    saveClassroomVocabularyBoardMode(classroomVocabularyBoardMode);
}

function loadClassroomVocabularyBoardContext() {
    try {
        const raw = localStorage.getItem(CLASSROOM_VOCABULARY_BOARD_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearClassroomVocabularyBoardContext() {
    localStorage.removeItem(CLASSROOM_VOCABULARY_BOARD_CONTEXT_STORAGE_KEY);
}

function isClassroomVocabularyBoardRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "classroomVocabularyBoard";
}

function displayScreen(screenId, addToHistory = true) {
    const classroomShortcutsHintScreens = [
        "classroomPresentationScreen",
        "classroomFlashcardsScreen",
        "classroomTextFlashcardsScreen"
    ];

    if (!classroomShortcutsHintScreens.includes(screenId)) {
        hideClassroomShortcutsHint(false);
    }

    hideAllScreens();
    const screen = document.getElementById(screenId);
    if (!screen) {
        console.error("Screen not found:", screenId);
        return;
    }

    screen.style.display = (
        screenId === "classroomPresentationScreen"
        || screenId === "classroomFlashcardsScreen"
        || screenId === "classroomTextFlashcardsScreen"
        || screenId === "classroomVocabularyBoardScreen"
    ) ? "grid" : "block";
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
    } else if (screenId === "classroomPickerScreen") {
        showClassroomPicker(false);
    } else if (screenId === "classroomActivityMenuScreen") {
        showClassroomActivityMenuForSelectedSet(false);
    } else if (screenId === "classroomPresentationScreen") {
        showClassroomPresentationForSelectedSet(false);
    } else if (screenId === "classroomFlashcardsScreen") {
        showClassroomFlashcardsForSelectedSet(false);
    } else if (screenId === "classroomTextFlashcardsScreen") {
        showClassroomTextFlashcardsForSelectedSet(false);
    } else if (screenId === "classroomNoCardsScreen") {
        showClassroomNoCardsState(false);
    } else if (screenId === "classroomVocabularyBoardScreen") {
        showClassroomVocabularyBoardForSelectedSet(false);
    }

    suppressHistoryPush = false;
});

let toastTimer = null;
let classroomShortcutsHintTimer = null;
let classroomShortcutsHintInteractionPaused = false;

function isClassroomShortcutsHintHiddenPermanently() {
    return localStorage.getItem(CLASSROOM_SHORTCUTS_HINT_STORAGE_KEY) === "true";
}

function clearClassroomShortcutsHintTimer() {
    if (classroomShortcutsHintTimer) {
        clearTimeout(classroomShortcutsHintTimer);
        classroomShortcutsHintTimer = null;
    }
}

function hideClassroomShortcutsHint(savePermanent = false) {
    if (savePermanent) {
        localStorage.setItem(CLASSROOM_SHORTCUTS_HINT_STORAGE_KEY, "true");
    }

    clearClassroomShortcutsHintTimer();
    classroomShortcutsHintInteractionPaused = false;

    const hint = document.getElementById("classroomShortcutsHint");
    if (hint) {
        hint.style.display = "none";
        hint.classList.remove("show");
    }
}

function scheduleClassroomShortcutsHintAutoDismiss() {
    if (classroomShortcutsHintInteractionPaused) {
        return;
    }

    clearClassroomShortcutsHintTimer();
    classroomShortcutsHintTimer = setTimeout(() => {
        if (classroomShortcutsHintInteractionPaused) {
            return;
        }

        hideClassroomShortcutsHint(false);
    }, 8000);
}

function pauseClassroomShortcutsHintAutoDismiss() {
    classroomShortcutsHintInteractionPaused = true;
    clearClassroomShortcutsHintTimer();
}

function resumeClassroomShortcutsHintAutoDismiss() {
    const hint = document.getElementById("classroomShortcutsHint");

    if (!hint || hint.style.display === "none") {
        classroomShortcutsHintInteractionPaused = false;
        return;
    }

    classroomShortcutsHintInteractionPaused = false;
    scheduleClassroomShortcutsHintAutoDismiss();
}

function maybeShowClassroomShortcutsHint(spaceLineText) {
    if (isClassroomShortcutsHintHiddenPermanently()) {
        return;
    }

    const hint = document.getElementById("classroomShortcutsHint");
    const spaceLine = document.getElementById("classroomShortcutsHintSpaceLine");
    const checkbox = document.getElementById("classroomShortcutsHintDontShowAgain");

    if (!hint || !spaceLine) {
        return;
    }

    spaceLine.textContent = spaceLineText;

    if (checkbox) {
        checkbox.checked = false;
    }

    hint.style.display = "block";
    requestAnimationFrame(() => {
        hint.classList.add("show");
    });

    classroomShortcutsHintInteractionPaused = false;
    scheduleClassroomShortcutsHintAutoDismiss();
}

function initClassroomShortcutsHint() {
    const hint = document.getElementById("classroomShortcutsHint");
    const closeButton = hint ? hint.querySelector(".classroom-shortcuts-hint-close") : null;
    const checkbox = document.getElementById("classroomShortcutsHintDontShowAgain");

    if (!hint) {
        return;
    }

    if (closeButton && closeButton.dataset.handlerAttached !== "true") {
        closeButton.dataset.handlerAttached = "true";
        closeButton.addEventListener("click", () => {
            hideClassroomShortcutsHint(checkbox && checkbox.checked);
        });
    }

    if (checkbox && checkbox.dataset.handlerAttached !== "true") {
        checkbox.dataset.handlerAttached = "true";
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                hideClassroomShortcutsHint(true);
            }
        });
        checkbox.addEventListener("focus", pauseClassroomShortcutsHintAutoDismiss);
        checkbox.addEventListener("blur", resumeClassroomShortcutsHintAutoDismiss);
    }

    if (hint.dataset.handlerAttached !== "true") {
        hint.dataset.handlerAttached = "true";
        hint.addEventListener("mouseenter", pauseClassroomShortcutsHintAutoDismiss);
        hint.addEventListener("mouseleave", resumeClassroomShortcutsHintAutoDismiss);
        hint.addEventListener("focusin", pauseClassroomShortcutsHintAutoDismiss);
        hint.addEventListener("focusout", (event) => {
            if (hint.contains(event.relatedTarget)) {
                return;
            }

            resumeClassroomShortcutsHintAutoDismiss();
        });
    }
}

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
    resetDashboardSearch();
    resetDashboardSelection();

    let savedSetsList = document.getElementById("savedSetsList");
    savedSetsList.innerHTML = `
        <div class="card loading-card">
            <h2>🫧 Fishing for your sets...</h2>
        </div>
    `;

    try {
        savedSets = await dbLoadSetsWithCards();
        if (isDashboardTrashFilterActive()) {
            trashedSets = await dbLoadTrashedSetsWithCards();
        }
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

function resetDashboardSearch() {
    dashboardSearchQuery = "";
    const searchInput = document.getElementById("dashboardSearchInput");
    if (searchInput) {
        searchInput.value = "";
    }
}

function resetDashboardSelection() {
    dashboardSelectionMode = false;
    dashboardSelectedSetIds.clear();
    updateDashboardSelectionUI();
}

function isDashboardSearchActive() {
    return dashboardSearchQuery.trim() !== "";
}

function isDashboardFavoritesFilterActive() {
    return dashboardFilterMode === "favorites";
}

function isDashboardTrashFilterActive() {
    return dashboardFilterMode === "trash";
}

function getDashboardSourceSets() {
    return isDashboardTrashFilterActive() ? trashedSets : savedSets;
}

function isDashboardDragEnabled() {
    return dashboardSortMode === "custom"
        && !isDashboardSearchActive()
        && !dashboardSelectionMode
        && !isDashboardFavoritesFilterActive()
        && !isDashboardTrashFilterActive();
}

function sortSavedSets(sets) {
    const sorted = [...sets];

    if (dashboardSortMode === "newest") {
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (dashboardSortMode === "oldest") {
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    if (dashboardSortMode === "az") {
        return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }

    if (dashboardSortMode === "za") {
        return sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
    }

    return sets;
}

function getVisibleSavedSets() {
    let visibleSets = sortSavedSets(getDashboardSourceSets());

    if (isDashboardFavoritesFilterActive()) {
        visibleSets = visibleSets.filter((set) => set.is_favorite);
    }

    const query = dashboardSearchQuery.trim().toLowerCase();

    if (!query) {
        return visibleSets;
    }

    return visibleSets.filter((set) => set.name.toLowerCase().includes(query));
}

function onDashboardSearchInput(value) {
    dashboardSearchQuery = value;
    renderDashboard();
}

function onDashboardSortChange(value) {
    const previousMode = dashboardSortMode;
    dashboardSortMode = value;
    updateDashboardToolbarUI();

    if (previousMode !== value && value !== "custom") {
        showToast("Switch to Custom order to rearrange sets.", "info");
    }

    renderDashboard();
}

async function onDashboardFilterChange(value) {
    const previousMode = dashboardFilterMode;

    if (value === "trash") {
        try {
            trashedSets = await dbLoadTrashedSetsWithCards();
        } catch (error) {
            showToast("Could not load trash: " + error.message, "error");
            return;
        }
    }

    dashboardFilterMode = value;
    updateDashboardToolbarUI();
    updateDashboardSelectionUI();

    if (previousMode !== value && value === "favorites") {
        showToast("Switch to All Sets and Custom order to rearrange sets.", "info");
    }

    if (previousMode !== value && value === "trash") {
        showToast("Switch to All Sets and Custom order to rearrange sets.", "info");
    }

    renderDashboard();
}

function updateDashboardToolbarUI() {
    const sortSelect = document.getElementById("dashboardSortSelect");
    const filterSelect = document.getElementById("dashboardFilterSelect");
    const sortHint = document.getElementById("dashboardSortHint");
    const hintMessages = [];

    if (sortSelect) {
        sortSelect.value = dashboardSortMode;
    }

    if (filterSelect) {
        filterSelect.value = dashboardFilterMode;
    }

    if (isDashboardFavoritesFilterActive() || isDashboardTrashFilterActive()) {
        hintMessages.push("Switch to All Sets and Custom order to rearrange sets.");
    } else if (dashboardSortMode !== "custom") {
        hintMessages.push("Switch to Custom order to rearrange sets.");
    }

    if (sortHint) {
        sortHint.textContent = hintMessages.join(" ");
        sortHint.style.display = hintMessages.length > 0 ? "block" : "none";
    }
}

function onDashboardSelectButtonClick() {
    dashboardSelectionMode = true;
    updateDashboardSelectionUI();
    renderDashboard();
}

function cancelDashboardSelection() {
    dashboardSelectionMode = false;
    dashboardSelectedSetIds.clear();
    updateDashboardSelectionUI();
    renderDashboard();
}

function onSetSelectionChange(setId, checked) {
    if (checked) {
        dashboardSelectedSetIds.add(setId);
    } else {
        dashboardSelectedSetIds.delete(setId);
    }

    updateDashboardSelectionUI();

    const card = document.querySelector(`.set-card[data-set-id="${CSS.escape(setId)}"]`);
    if (card) {
        card.classList.toggle("set-card-selected", checked);
    }
}

function updateDashboardSelectionUI() {
    const selectionBar = document.getElementById("dashboardSelectionBar");
    const selectionCount = document.getElementById("dashboardSelectionCount");
    const selectField = document.querySelector(".dashboard-select-field");
    const selectedCount = dashboardSelectedSetIds.size;

    if (selectionCount) {
        selectionCount.textContent = `✓ ${selectedCount} selected`;
    }

    if (selectionBar) {
        selectionBar.hidden = !dashboardSelectionMode;
    }

    if (selectField) {
        selectField.hidden = dashboardSelectionMode;
    }

    const bulkDeleteButton = document.getElementById("dashboardBulkDeleteButton");
    const bulkDuplicateButton = document.getElementById("dashboardBulkDuplicateButton");
    const bulkRestoreButton = document.getElementById("dashboardBulkRestoreButton");
    const bulkDeleteForeverButton = document.getElementById("dashboardBulkDeleteForeverButton");
    const isTrashView = isDashboardTrashFilterActive();

    if (bulkDuplicateButton) {
        bulkDuplicateButton.hidden = isTrashView;
        const canDuplicate = dashboardSelectionMode && selectedCount > 0 && !isTrashView;
        bulkDuplicateButton.disabled = !canDuplicate;
        bulkDuplicateButton.classList.toggle("disabled-button", !canDuplicate);
    }

    if (bulkDeleteButton) {
        bulkDeleteButton.hidden = isTrashView;
        const canDelete = dashboardSelectionMode && selectedCount > 0 && !isTrashView;
        bulkDeleteButton.disabled = !canDelete;
        bulkDeleteButton.classList.toggle("disabled-button", !canDelete);
    }

    if (bulkRestoreButton) {
        bulkRestoreButton.hidden = !isTrashView;
        const canRestore = dashboardSelectionMode && selectedCount > 0 && isTrashView;
        bulkRestoreButton.disabled = !canRestore;
        bulkRestoreButton.classList.toggle("disabled-button", !canRestore);
    }

    if (bulkDeleteForeverButton) {
        bulkDeleteForeverButton.hidden = !isTrashView;
        const canDeleteForever = dashboardSelectionMode && selectedCount > 0 && isTrashView;
        bulkDeleteForeverButton.disabled = !canDeleteForever;
        bulkDeleteForeverButton.classList.toggle("disabled-button", !canDeleteForever);
    }
}

function renderDashboard() {
    let savedSetsList = document.getElementById("savedSetsList");

    if (setsSortable) {
        setsSortable.destroy();
        setsSortable = null;
    }

    savedSetsList.innerHTML = "";
    savedSetsList.classList.toggle("dashboard-drag-disabled", !isDashboardDragEnabled());
    savedSetsList.classList.toggle("dashboard-selection-active", dashboardSelectionMode);
    updateDashboardToolbarUI();
    updateDashboardSelectionUI();

    if (isDashboardTrashFilterActive() && trashedSets.length === 0) {
        savedSetsList.innerHTML = `
            <div class="card empty-library-card dashboard-search-empty">
                <h2>Trash is empty.</h2>
                <p>Deleted sets will appear here.</p>
            </div>
        `;
        return;
    }

    if (!isDashboardTrashFilterActive() && savedSets.length === 0) {
        savedSetsList.innerHTML = `
            <div class="card empty-library-card">
                <h2>🐚 Your library is empty</h2>
                <p>Make your first vocabulary set and start collecting pearls.</p>
            </div>
        `;
        return;
    }

    const visibleSets = getVisibleSavedSets();

    if (visibleSets.length === 0) {
        let emptyTitle = "No sets found.";
        let emptyMessage = "Try another search.";

        if (isDashboardFavoritesFilterActive() && !isDashboardSearchActive()) {
            emptyTitle = "No favorite sets yet.";
            emptyMessage = "Star a set to add it to Favorites.";
        } else if (isDashboardFavoritesFilterActive()) {
            emptyMessage = "Try another search within Favorites.";
        } else if (isDashboardTrashFilterActive() && !isDashboardSearchActive()) {
            emptyTitle = "Trash is empty.";
            emptyMessage = "Deleted sets will appear here.";
        } else if (isDashboardTrashFilterActive()) {
            emptyMessage = "Try another search within Trash.";
        }

        savedSetsList.innerHTML = `
            <div class="card empty-library-card dashboard-search-empty">
                <h2>${escapeHTML(emptyTitle)}</h2>
                <p>${escapeHTML(emptyMessage)}</p>
            </div>
        `;
        return;
    }

    for (let i = 0; i < visibleSets.length; i++) {
        let set = visibleSets[i];
        let setId = set.id;
        let wordCount = set.cards ? set.cards.length : 0;
        let imageCount = (set.cards || []).filter(card => card.imageUrl).length;
        let isSelected = dashboardSelectedSetIds.has(setId);
        let isTrashView = isDashboardTrashFilterActive();

        if (isTrashView) {
            let cardDisabled = dashboardSelectionMode;
            let disabledAttr = cardDisabled ? " disabled" : "";

            savedSetsList.innerHTML += `
            <div class="card set-card set-card-trash${isSelected ? " set-card-selected" : ""}" data-set-id="${escapeAttribute(setId)}">
                <label class="set-card-select">
                    <input type="checkbox" class="set-card-select-input" aria-label="Select ${escapeAttribute(set.name)}" ${isSelected ? "checked" : ""} onchange="onSetSelectionChange('${escapeAttribute(setId)}', this.checked)">
                </label>
                <div class="set-card-header">
                    <div class="set-card-header-left"></div>
                    <div class="set-card-icon-actions">
                        <button type="button" class="set-icon-button set-icon-restore" onclick="restoreSet('${escapeAttribute(setId)}')" aria-label="Restore set" title="Restore"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"/></svg>
                        </button>
                        <button type="button" class="set-icon-button set-icon-delete" onclick="deleteForeverSet('${escapeAttribute(setId)}')" aria-label="Delete forever" title="Delete Forever"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                        </button>
                    </div>
                </div>
                <div class="set-card-topline set-card-trash-topline">🗑️ In Trash</div>
                <h2>📚 ${escapeHTML(set.name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>

                <div class="set-actions set-actions-trash">
                    <button class="green-button" onclick="restoreSet('${escapeAttribute(setId)}')"${disabledAttr}>Restore</button>
                    <button class="red-button" onclick="deleteForeverSet('${escapeAttribute(setId)}')"${disabledAttr}>Delete Forever</button>
                </div>
            </div>
        `;
            continue;
        }

        let cardDisabled = dashboardSelectionMode;
        let disabledAttr = cardDisabled ? " disabled" : "";
        let duplicateAttrs = cardDisabled
            ? ' tabindex="-1" aria-label="Duplicate set" aria-disabled="true"'
            : ' tabindex="0" aria-label="Duplicate set" title="Duplicate" onclick="duplicateSet(\'' + escapeAttribute(setId) + '\')" onkeydown="handleDuplicateSetKeydown(event, \'' + escapeAttribute(setId) + '\')"';
        let isFavorite = !!set.is_favorite;
        let favoriteLabel = isFavorite ? "Remove from favorites" : "Add to favorites";
        let favoriteStarSvg = isFavorite
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.662-2.51a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 0 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>';

        savedSetsList.innerHTML += `
            <div class="card set-card${isSelected ? " set-card-selected" : ""}" data-set-id="${escapeAttribute(setId)}">
                <label class="set-card-select">
                    <input type="checkbox" class="set-card-select-input" aria-label="Select ${escapeAttribute(set.name)}" ${isSelected ? "checked" : ""} onchange="onSetSelectionChange('${escapeAttribute(setId)}', this.checked)">
                </label>
                <div class="set-card-header">
                    <div class="set-card-header-left">
                        <button type="button" class="set-favorite-button${isFavorite ? " is-favorite" : ""}" onclick="toggleSetFavorite('${escapeAttribute(setId)}')" aria-label="${escapeAttribute(favoriteLabel)}" aria-pressed="${isFavorite ? "true" : "false"}" title="${escapeAttribute(favoriteLabel)}">
                            ${favoriteStarSvg}
                        </button>
                        <button type="button" class="set-drag-handle" aria-label="Drag to reorder set" title="Drag to reorder"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                        </button>
                    </div>
                    <div class="set-card-icon-actions">
                        <button type="button" class="set-icon-button set-icon-edit" onclick="editSet('${escapeAttribute(setId)}')" aria-label="Edit set" title="Edit"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
                        </button>
                        <span class="set-icon-button set-icon-duplicate" role="button"${duplicateAttrs}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
                        </span>
                        <button type="button" class="set-icon-button set-icon-export" onclick="exportSet('${escapeAttribute(setId)}')" aria-label="Export set to Excel" title="Export"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                        </button>
                        <button type="button" class="set-icon-button set-icon-delete" onclick="deleteSet('${escapeAttribute(setId)}')" aria-label="Delete set" title="Delete"${disabledAttr}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                        </button>
                    </div>
                </div>
                <div class="set-card-topline">🐠 Ready to play</div>
                <h2>📚 ${escapeHTML(set.name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>

                <div class="set-actions">
                    <button class="green-button" onclick="openPlayChoice('${escapeAttribute(setId)}')"${disabledAttr}>▶️ Play</button>
                    <button class="share-button" onclick="openShareDialog('${escapeAttribute(setId)}')"${disabledAttr}>Share</button>
                </div>
            </div>
        `;
    }

    initSetsSortable();
}

function showClassroomPicker(addToHistory = true) {
    exitClassroomFullscreenIfActive();
    clearClassroomPresentationContext();
    clearClassroomActivityContext();
    clearClassroomFlashcardsContext();
    clearClassroomTextFlashcardsContext();
    clearClassroomVocabularyBoardContext();
    displayScreen("classroomPickerScreen", addToHistory);
    renderClassroomPicker();
}

function returnToDashboardFromClassroom(addToHistory = true) {
    displayScreen("dashboardScreen", addToHistory);

    const searchInput = document.getElementById("dashboardSearchInput");
    if (searchInput) {
        searchInput.value = dashboardSearchQuery;
    }

    updateDashboardToolbarUI();
    renderDashboard();
}

function renderClassroomPicker() {
    const classroomSetsList = document.getElementById("classroomSetsList");
    classroomSetsList.innerHTML = "";

    const classroomSets = sortSavedSets(savedSets);

    if (classroomSets.length === 0) {
        classroomSetsList.innerHTML = `
            <div class="card empty-library-card classroom-empty-card">
                <h2>No sets yet.</h2>
                <p>Create a set first to use Classroom Mode.</p>
            </div>
        `;
        return;
    }

    for (let i = 0; i < classroomSets.length; i++) {
        const set = classroomSets[i];
        const setId = set.id;
        const wordCount = set.cards ? set.cards.length : 0;
        const imageCount = (set.cards || []).filter((card) => card.imageUrl).length;
        const hasActivityCards = getClassroomActivityCards(set).length > 0;
        const emptyNote = hasActivityCards
            ? ""
            : `<p class="classroom-set-empty-note">Add vocabulary cards before using this activity.</p>`;

        classroomSetsList.innerHTML += `
            <div class="card classroom-set-card${hasActivityCards ? "" : " classroom-set-card-empty"}">
                <h2 class="classroom-set-name">📚 ${escapeHTML(set.name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>
                ${emptyNote}
                <div class="classroom-set-actions">
                    <button type="button" class="green-button" onclick="openClassroomActivityMenu('${escapeAttribute(setId)}')">Choose Activity</button>
                </div>
            </div>
        `;
    }
}

function openClassroomActivityMenu(setId) {
    const selectedSet = savedSets.find((set) => set.id === setId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    classroomSelectedSetId = setId;
    showClassroomActivityMenu(selectedSet);
}

function showClassroomActivityMenu(set, addToHistory = true) {
    document.getElementById("classroomActivityMenuTitle").textContent = set.name;
    updateClassroomActivityMenuEmptyState(set);
    clearClassroomPresentationContext();
    clearClassroomFlashcardsContext();
    clearClassroomTextFlashcardsContext();
    clearClassroomVocabularyBoardContext();
    displayScreen("classroomActivityMenuScreen", addToHistory);
    saveClassroomActivityContext();
}

function getClassroomActivityCards(set) {
    return prepareCards(set.cards || [])
        .filter((card) => card.english.trim() !== "");
}

function updateClassroomActivityMenuEmptyState(set) {
    const activityList = document.querySelector("#classroomActivityMenuScreen .classroom-activity-list");
    const emptyPanel = document.getElementById("classroomActivityMenuEmpty");
    const hasCards = getClassroomActivityCards(set).length > 0;

    if (activityList) {
        activityList.style.display = hasCards ? "flex" : "none";
    }

    if (emptyPanel) {
        emptyPanel.style.display = hasCards ? "none" : "block";
    }
}

function showClassroomNoCardsState(addToHistory = true) {
    displayScreen("classroomNoCardsScreen", addToHistory);
}

function showClassroomCardImagePlaceholder(imageEl, placeholderEl) {
    imageEl.removeAttribute("src");
    imageEl.alt = "";
    imageEl.style.display = "none";
    placeholderEl.style.display = "flex";
    placeholderEl.removeAttribute("aria-hidden");
    placeholderEl.setAttribute("role", "img");
    placeholderEl.setAttribute("aria-label", "No image");
}

function setClassroomCardImage(imageEl, placeholderEl, card, options = {}) {
    if (!imageEl || !placeholderEl) {
        return;
    }

    const imageAlt = options.imageAlt !== undefined ? options.imageAlt : card.english;
    const imageUrl = (card.imageUrl || "").trim();

    imageEl.onerror = () => {
        imageEl.onerror = null;
        showClassroomCardImagePlaceholder(imageEl, placeholderEl);
    };

    if (imageUrl) {
        imageEl.src = imageUrl;
        imageEl.alt = imageAlt;
        imageEl.style.display = "block";
        placeholderEl.style.display = "none";
        placeholderEl.setAttribute("aria-hidden", "true");
        placeholderEl.removeAttribute("role");
        placeholderEl.removeAttribute("aria-label");
        return;
    }

    showClassroomCardImagePlaceholder(imageEl, placeholderEl);
}

function showClassroomActivityMenuForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet) {
        showClassroomPicker(addToHistory);
        return;
    }

    showClassroomActivityMenu(selectedSet, addToHistory);
}

function startClassroomPresentationFromActivityMenu() {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    clearClassroomFlashcardsContext();
    clearClassroomVocabularyBoardContext();
    startClassroomPresentation(selectedSet);
}

function startClassroomFlashcardsFromActivityMenu() {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    clearClassroomPresentationContext();
    clearClassroomVocabularyBoardContext();
    startClassroomFlashcards(selectedSet);
}

function startClassroomTextFlashcardsFromActivityMenu() {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    clearClassroomPresentationContext();
    clearClassroomFlashcardsContext();
    clearClassroomVocabularyBoardContext();
    startClassroomTextFlashcards(selectedSet);
}

function startClassroomVocabularyBoardFromActivityMenu() {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    clearClassroomPresentationContext();
    clearClassroomFlashcardsContext();
    clearClassroomTextFlashcardsContext();
    startClassroomVocabularyBoard(selectedSet);
}

function startClassroomPresentation(set, addToHistory = true) {
    const presentationCards = getClassroomActivityCards(set);

    if (presentationCards.length === 0) {
        showClassroomNoCardsState(addToHistory);
        return;
    }

    classroomPresentationSetName = set.name;
    classroomPresentationCards = presentationCards;
    classroomPresentationIndex = 0;
    classroomTranslationVisible = false;
    showClassroomPresentation(addToHistory);
}

function showClassroomPresentation(addToHistory = true) {
    displayScreen("classroomPresentationScreen", addToHistory);
    renderClassroomPresentationCard();
    maybeShowClassroomShortcutsHint("Space Show / Hide Translation");
}

function showClassroomPresentationForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet || classroomPresentationCards.length === 0) {
        showClassroomActivityMenuForSelectedSet(addToHistory);
        return;
    }

    classroomPresentationSetName = selectedSet.name;
    showClassroomPresentation(addToHistory);
}

function getClassroomCardTranslation(card) {
    return (card.thai || "").trim();
}

const CLASSROOM_CONTENT_TRANSITION_MS = 135;
let classroomContentTransitionToken = 0;
let classroomContentTransitionOutTimer = null;
let classroomContentTransitionInTimer = null;

function prefersReducedClassroomMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resetClassroomContentTransitionTargets(targets) {
    targets.forEach((element) => {
        element.classList.remove("classroom-content-transition", "classroom-content-is-visible");
    });
}

function withClassroomContentTransition(targetElements, updateContent, options = {}) {
    const animate = options.animate === true;
    const targets = (Array.isArray(targetElements) ? targetElements : [targetElements]).filter(Boolean);

    if (classroomContentTransitionOutTimer) {
        clearTimeout(classroomContentTransitionOutTimer);
        classroomContentTransitionOutTimer = null;
    }

    if (classroomContentTransitionInTimer) {
        clearTimeout(classroomContentTransitionInTimer);
        classroomContentTransitionInTimer = null;
    }

    classroomContentTransitionToken += 1;
    const token = classroomContentTransitionToken;

    resetClassroomContentTransitionTargets(targets);

    if (!animate || prefersReducedClassroomMotion() || targets.length === 0) {
        updateContent();
        return;
    }

    targets.forEach((element) => {
        element.classList.add("classroom-content-transition", "classroom-content-is-visible");
    });

    requestAnimationFrame(() => {
        if (token !== classroomContentTransitionToken) {
            return;
        }

        targets.forEach((element) => {
            element.classList.remove("classroom-content-is-visible");
        });

        classroomContentTransitionOutTimer = setTimeout(() => {
            classroomContentTransitionOutTimer = null;

            if (token !== classroomContentTransitionToken) {
                return;
            }

            updateContent();

            targets.forEach((element) => {
                element.classList.add("classroom-content-is-visible");
            });

            classroomContentTransitionInTimer = setTimeout(() => {
                classroomContentTransitionInTimer = null;

                if (token !== classroomContentTransitionToken) {
                    return;
                }

                resetClassroomContentTransitionTargets(targets);
            }, CLASSROOM_CONTENT_TRANSITION_MS);
        }, CLASSROOM_CONTENT_TRANSITION_MS);
    });
}

function getClassroomPresentationTransitionTargets() {
    return [
        document.querySelector("#classroomPresentationScreen .classroom-presentation-image-card"),
        document.querySelector("#classroomPresentationScreen .classroom-presentation-word-group")
    ].filter(Boolean);
}

function setClassroomFlashcardSideToFrontWithoutFlip(flashcardInnerId, updateFlipUi) {
    const inner = document.getElementById(flashcardInnerId);

    if (inner) {
        inner.classList.add("classroom-flashcard-no-flip-transition");
    }

    if (flashcardInnerId === "classroomFlashcardInner") {
        classroomFlashcardSide = "front";
    } else {
        classroomTextFlashcardSide = "front";
    }

    updateFlipUi();

    if (inner) {
        requestAnimationFrame(() => {
            inner.classList.remove("classroom-flashcard-no-flip-transition");
        });
    }
}

function applyClassroomPresentationCardContent(options = {}) {
    const preserveTranslation = options.preserveTranslation === true;
    const card = classroomPresentationCards[classroomPresentationIndex];
    const total = classroomPresentationCards.length;
    const current = classroomPresentationIndex + 1;

    document.getElementById("classroomPresentationHeaderMeta").textContent =
        `${classroomPresentationSetName} • Card ${current} of ${total}`;
    document.getElementById("classroomPresentationEnglish").textContent = card.english;

    const translationEl = document.getElementById("classroomPresentationTranslation");
    translationEl.textContent = getClassroomCardTranslation(card) || "—";

    if (!preserveTranslation) {
        classroomTranslationVisible = false;
    }

    updateClassroomTranslationUI();

    const imageEl = document.getElementById("classroomPresentationImage");
    const placeholderEl = document.getElementById("classroomPresentationImagePlaceholder");

    setClassroomCardImage(imageEl, placeholderEl, card);

    updateClassroomPresentationNav();
    saveClassroomPresentationContext();
}

function renderClassroomPresentationCard(options = {}) {
    withClassroomContentTransition(
        getClassroomPresentationTransitionTargets(),
        () => applyClassroomPresentationCardContent(options),
        { animate: options.animate === true }
    );
}

function updateClassroomTranslationUI() {
    const translationEl = document.getElementById("classroomPresentationTranslation");
    const toggleButton = document.getElementById("classroomToggleTranslationButton");

    translationEl.hidden = !classroomTranslationVisible;
    toggleButton.textContent = classroomTranslationVisible ? "Hide Translation" : "Show Translation";
}

function toggleClassroomTranslation() {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    classroomTranslationVisible = !classroomTranslationVisible;
    updateClassroomTranslationUI();
    saveClassroomPresentationContext();
}

function updateClassroomPresentationNav() {
    const prevButton = document.getElementById("classroomPrevButton");
    const nextButton = document.getElementById("classroomNextButton");
    const isFirst = classroomPresentationIndex === 0;
    const isLast = classroomPresentationIndex === classroomPresentationCards.length - 1;

    prevButton.disabled = isFirst;
    prevButton.classList.toggle("disabled-button", isFirst);
    nextButton.textContent = isLast ? "Finish" : "Next →";
}

function classroomPresentationPrevious() {
    if (classroomPresentationIndex <= 0) {
        return;
    }

    classroomPresentationIndex -= 1;
    classroomTranslationVisible = false;
    renderClassroomPresentationCard({ animate: true });
}

function classroomPresentationJumpToFirst() {
    if (classroomPresentationCards.length === 0 || classroomPresentationIndex === 0) {
        return;
    }

    classroomPresentationIndex = 0;
    classroomTranslationVisible = false;
    renderClassroomPresentationCard({ animate: true });
}

function classroomPresentationJumpToLast() {
    const lastIndex = classroomPresentationCards.length - 1;

    if (classroomPresentationCards.length === 0 || classroomPresentationIndex === lastIndex) {
        return;
    }

    classroomPresentationIndex = lastIndex;
    classroomTranslationVisible = false;
    renderClassroomPresentationCard({ animate: true });
}

function isClassroomPresentationOnLastCard() {
    return classroomPresentationIndex >= classroomPresentationCards.length - 1;
}

function classroomPresentationAdvance() {
    if (isClassroomPresentationOnLastCard()) {
        return;
    }

    classroomPresentationIndex += 1;
    classroomTranslationVisible = false;
    renderClassroomPresentationCard({ animate: true });
}

function classroomPresentationNextButtonClick() {
    if (isClassroomPresentationOnLastCard()) {
        finishClassroomPresentation();
        return;
    }

    classroomPresentationAdvance();
}

function pulseClassroomFinishButton() {
    const nextButton = document.getElementById("classroomNextButton");

    if (!nextButton) {
        return;
    }

    nextButton.classList.remove("classroom-finish-pulse");
    void nextButton.offsetWidth;
    nextButton.classList.add("classroom-finish-pulse");
    nextButton.addEventListener("animationend", () => {
        nextButton.classList.remove("classroom-finish-pulse");
    }, { once: true });
}

function finishClassroomPresentation() {
    exitClassroomFullscreenIfActive();
    clearClassroomPresentationContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenu() {
    exitClassroomFullscreenIfActive();
    clearClassroomPresentationContext();
    showClassroomActivityMenuForSelectedSet();
}

function createClassroomShuffledOrder(cardCount) {
    const order = Array.from({ length: cardCount }, (_, index) => index);

    for (let index = order.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    return order;
}

function normalizeClassroomShuffledOrder(shuffledOrder, cardCount) {
    if (!Array.isArray(shuffledOrder) || cardCount === 0) {
        return [];
    }

    const seen = new Set();
    const normalized = [];

    for (const value of shuffledOrder) {
        const index = Number(value);

        if (!Number.isInteger(index) || index < 0 || index >= cardCount || seen.has(index)) {
            continue;
        }

        seen.add(index);
        normalized.push(index);
    }

    for (let index = 0; index < cardCount; index += 1) {
        if (!seen.has(index)) {
            normalized.push(index);
        }
    }

    return normalized;
}

function restoreClassroomFlashcardsShuffleState(context, cardCount) {
    classroomFlashcardsShuffleEnabled = !!context.shuffleEnabled;

    if (classroomFlashcardsShuffleEnabled) {
        classroomFlashcardsShuffledOrder = normalizeClassroomShuffledOrder(context.shuffledOrder, cardCount);

        if (classroomFlashcardsShuffledOrder.length !== cardCount) {
            classroomFlashcardsShuffleEnabled = false;
            classroomFlashcardsShuffledOrder = [];
        }
    } else {
        classroomFlashcardsShuffledOrder = [];
    }
}

function restoreClassroomTextFlashcardsShuffleState(context, cardCount) {
    classroomTextFlashcardsShuffleEnabled = !!context.shuffleEnabled;

    if (classroomTextFlashcardsShuffleEnabled) {
        classroomTextFlashcardsShuffledOrder = normalizeClassroomShuffledOrder(context.shuffledOrder, cardCount);

        if (classroomTextFlashcardsShuffledOrder.length !== cardCount) {
            classroomTextFlashcardsShuffleEnabled = false;
            classroomTextFlashcardsShuffledOrder = [];
        }
    } else {
        classroomTextFlashcardsShuffledOrder = [];
    }
}

function getClassroomFlashcardsActiveOrder() {
    if (
        classroomFlashcardsShuffleEnabled
        && classroomFlashcardsShuffledOrder.length === classroomFlashcardsCards.length
    ) {
        return classroomFlashcardsShuffledOrder;
    }

    return classroomFlashcardsCards.map((_, index) => index);
}

function getClassroomFlashcardsCurrentOriginalIndex() {
    const activeOrder = getClassroomFlashcardsActiveOrder();
    return activeOrder[classroomFlashcardsIndex] ?? 0;
}

function getClassroomFlashcardsCurrentCard() {
    return classroomFlashcardsCards[getClassroomFlashcardsCurrentOriginalIndex()];
}

function getClassroomTextFlashcardsActiveOrder() {
    if (
        classroomTextFlashcardsShuffleEnabled
        && classroomTextFlashcardsShuffledOrder.length === classroomTextFlashcardsCards.length
    ) {
        return classroomTextFlashcardsShuffledOrder;
    }

    return classroomTextFlashcardsCards.map((_, index) => index);
}

function getClassroomTextFlashcardsCurrentOriginalIndex() {
    const activeOrder = getClassroomTextFlashcardsActiveOrder();
    return activeOrder[classroomTextFlashcardsIndex] ?? 0;
}

function getClassroomTextFlashcardsCurrentCard() {
    return classroomTextFlashcardsCards[getClassroomTextFlashcardsCurrentOriginalIndex()];
}

function updateClassroomFlashcardsShuffleButton() {
    const shuffleButton = document.getElementById("classroomFlashcardsShuffleButton");

    if (!shuffleButton) {
        return;
    }

    shuffleButton.setAttribute("aria-pressed", classroomFlashcardsShuffleEnabled ? "true" : "false");
    shuffleButton.classList.toggle("classroom-shuffle-button-active", classroomFlashcardsShuffleEnabled);
}

function updateClassroomTextFlashcardsShuffleButton() {
    const shuffleButton = document.getElementById("classroomTextFlashcardsShuffleButton");

    if (!shuffleButton) {
        return;
    }

    shuffleButton.setAttribute("aria-pressed", classroomTextFlashcardsShuffleEnabled ? "true" : "false");
    shuffleButton.classList.toggle("classroom-shuffle-button-active", classroomTextFlashcardsShuffleEnabled);
}

function toggleClassroomFlashcardsShuffle() {
    if (currentScreenId !== "classroomFlashcardsScreen" || classroomFlashcardsCards.length === 0) {
        return;
    }

    const currentOriginalIndex = getClassroomFlashcardsCurrentOriginalIndex();

    if (classroomFlashcardsShuffleEnabled) {
        classroomFlashcardsShuffleEnabled = false;
        classroomFlashcardsShuffledOrder = [];
        classroomFlashcardsIndex = currentOriginalIndex;
    } else {
        classroomFlashcardsShuffleEnabled = true;
        classroomFlashcardsShuffledOrder = createClassroomShuffledOrder(classroomFlashcardsCards.length);
        const newPosition = classroomFlashcardsShuffledOrder.indexOf(currentOriginalIndex);
        classroomFlashcardsIndex = newPosition >= 0 ? newPosition : 0;
    }

    updateClassroomFlashcardsShuffleButton();
    renderClassroomFlashcard({ preserveSide: true });
}

function toggleClassroomTextFlashcardsShuffle() {
    if (currentScreenId !== "classroomTextFlashcardsScreen" || classroomTextFlashcardsCards.length === 0) {
        return;
    }

    const currentOriginalIndex = getClassroomTextFlashcardsCurrentOriginalIndex();

    if (classroomTextFlashcardsShuffleEnabled) {
        classroomTextFlashcardsShuffleEnabled = false;
        classroomTextFlashcardsShuffledOrder = [];
        classroomTextFlashcardsIndex = currentOriginalIndex;
    } else {
        classroomTextFlashcardsShuffleEnabled = true;
        classroomTextFlashcardsShuffledOrder = createClassroomShuffledOrder(classroomTextFlashcardsCards.length);
        const newPosition = classroomTextFlashcardsShuffledOrder.indexOf(currentOriginalIndex);
        classroomTextFlashcardsIndex = newPosition >= 0 ? newPosition : 0;
    }

    updateClassroomTextFlashcardsShuffleButton();
    renderClassroomTextFlashcard({ preserveSide: true });
}

function startClassroomFlashcards(set, addToHistory = true) {
    const flashcardsCards = getClassroomActivityCards(set);

    if (flashcardsCards.length === 0) {
        showClassroomNoCardsState(addToHistory);
        return;
    }

    classroomFlashcardsSetName = set.name;
    classroomFlashcardsCards = flashcardsCards;
    classroomFlashcardsIndex = 0;
    classroomFlashcardSide = "front";
    classroomFlashcardsShuffleEnabled = false;
    classroomFlashcardsShuffledOrder = [];
    showClassroomFlashcards(addToHistory);
}

function showClassroomFlashcards(addToHistory = true) {
    displayScreen("classroomFlashcardsScreen", addToHistory);
    updateClassroomFlashcardsShuffleButton();
    renderClassroomFlashcard();
    maybeShowClassroomShortcutsHint("Space Flip Card");
}

function showClassroomFlashcardsForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet || classroomFlashcardsCards.length === 0) {
        showClassroomActivityMenuForSelectedSet(addToHistory);
        return;
    }

    classroomFlashcardsSetName = selectedSet.name;
    showClassroomFlashcards(addToHistory);
}

function setClassroomFlashcardImage(imageEl, placeholderEl, card, options = {}) {
    setClassroomCardImage(imageEl, placeholderEl, card, options);
}

function updateClassroomFlashcardFlipUI() {
    const flashcard = document.getElementById("classroomFlashcard");
    const isBack = classroomFlashcardSide === "back";

    if (flashcard) {
        flashcard.classList.toggle("classroom-flashcard-flipped", isBack);
        flashcard.setAttribute("aria-pressed", isBack ? "true" : "false");
    }
}

function applyClassroomFlashcardContent(options = {}) {
    const preserveSide = options.preserveSide === true;
    const card = getClassroomFlashcardsCurrentCard();
    const total = classroomFlashcardsCards.length;
    const current = classroomFlashcardsIndex + 1;

    document.getElementById("classroomFlashcardsHeaderMeta").textContent =
        `${classroomFlashcardsSetName} • Card ${current} of ${total}`;

    const english = card.english;
    const translation = getClassroomCardTranslation(card) || "—";

    document.getElementById("classroomFlashcardBackEnglish").textContent = english;
    document.getElementById("classroomFlashcardBackTranslation").textContent = translation;

    setClassroomFlashcardImage(
        document.getElementById("classroomFlashcardFrontImage"),
        document.getElementById("classroomFlashcardFrontPlaceholder"),
        card,
        { imageAlt: "" }
    );
    setClassroomFlashcardImage(
        document.getElementById("classroomFlashcardBackImage"),
        document.getElementById("classroomFlashcardBackPlaceholder"),
        card
    );

    if (!preserveSide) {
        if (options.animate === true && classroomFlashcardSide === "back") {
            setClassroomFlashcardSideToFrontWithoutFlip("classroomFlashcardInner", updateClassroomFlashcardFlipUI);
        } else {
            classroomFlashcardSide = "front";
            updateClassroomFlashcardFlipUI();
        }
    } else {
        updateClassroomFlashcardFlipUI();
    }

    updateClassroomFlashcardsNav();
    updateClassroomFlashcardsShuffleButton();
    saveClassroomFlashcardsContext();
}

function renderClassroomFlashcard(options = {}) {
    withClassroomContentTransition(
        document.getElementById("classroomFlashcardInner"),
        () => applyClassroomFlashcardContent(options),
        { animate: options.animate === true }
    );
}

function toggleClassroomFlashcard() {
    if (currentScreenId !== "classroomFlashcardsScreen") {
        return;
    }

    classroomFlashcardSide = classroomFlashcardSide === "front" ? "back" : "front";
    updateClassroomFlashcardFlipUI();
    saveClassroomFlashcardsContext();
}

function updateClassroomFlashcardsNav() {
    const prevButton = document.getElementById("classroomFlashcardsPrevButton");
    const nextButton = document.getElementById("classroomFlashcardsNextButton");
    const isFirst = classroomFlashcardsIndex === 0;
    const isLast = classroomFlashcardsIndex === classroomFlashcardsCards.length - 1;

    prevButton.disabled = isFirst;
    prevButton.classList.toggle("disabled-button", isFirst);
    nextButton.textContent = isLast ? "Finish" : "Next →";
}

function classroomFlashcardsPrevious() {
    if (classroomFlashcardsIndex <= 0) {
        return;
    }

    classroomFlashcardsIndex -= 1;
    renderClassroomFlashcard({ animate: true });
}

function classroomFlashcardsJumpToFirst() {
    if (classroomFlashcardsCards.length === 0 || classroomFlashcardsIndex === 0) {
        return;
    }

    classroomFlashcardsIndex = 0;
    renderClassroomFlashcard({ animate: true });
}

function classroomFlashcardsJumpToLast() {
    const lastIndex = classroomFlashcardsCards.length - 1;

    if (classroomFlashcardsCards.length === 0 || classroomFlashcardsIndex === lastIndex) {
        return;
    }

    classroomFlashcardsIndex = lastIndex;
    renderClassroomFlashcard({ animate: true });
}

function isClassroomFlashcardsOnLastCard() {
    return classroomFlashcardsIndex >= classroomFlashcardsCards.length - 1;
}

function classroomFlashcardsAdvance() {
    if (isClassroomFlashcardsOnLastCard()) {
        return;
    }

    classroomFlashcardsIndex += 1;
    renderClassroomFlashcard({ animate: true });
}

function classroomFlashcardsNextButtonClick() {
    if (isClassroomFlashcardsOnLastCard()) {
        finishClassroomFlashcards();
        return;
    }

    classroomFlashcardsAdvance();
}

function finishClassroomFlashcards() {
    exitClassroomFullscreenIfActive();
    clearClassroomFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenuFromFlashcards() {
    exitClassroomFullscreenIfActive();
    clearClassroomFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function toggleClassroomFlashcardsFullscreen() {
    const flashcardsScreen = document.getElementById("classroomFlashcardsScreen");

    if (!flashcardsScreen) {
        return;
    }

    if (!document.fullscreenElement) {
        flashcardsScreen.requestFullscreen().catch(() => {
            showToast("Fullscreen is not available.", "warning");
        });
        return;
    }

    document.exitFullscreen();
}

function updateClassroomFlashcardsFullscreenButtonLabel() {
    const label = document.getElementById("classroomFlashcardsFullscreenButtonLabel");
    const button = document.getElementById("classroomFlashcardsFullscreenButton");

    if (!label || !button) {
        return;
    }

    const isFullscreen = document.fullscreenElement === document.getElementById("classroomFlashcardsScreen");
    label.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.title = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

function handleClassroomFlashcardsKeydown(event) {
    if (currentScreenId !== "classroomFlashcardsScreen") {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        classroomFlashcardsPrevious();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();

        if (isClassroomFlashcardsOnLastCard()) {
            return;
        }

        classroomFlashcardsAdvance();
        return;
    }

    if (event.key === "Home") {
        event.preventDefault();
        classroomFlashcardsJumpToFirst();
        return;
    }

    if (event.key === "End") {
        event.preventDefault();
        classroomFlashcardsJumpToLast();
        return;
    }

    if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        toggleClassroomFlashcard();
    }
}

function initClassroomFlashcardsControls() {
    const prevButton = document.getElementById("classroomFlashcardsPrevButton");
    const nextButton = document.getElementById("classroomFlashcardsNextButton");
    const shuffleButton = document.getElementById("classroomFlashcardsShuffleButton");
    const flashcardButton = document.getElementById("classroomFlashcard");
    const fullscreenButton = document.getElementById("classroomFlashcardsFullscreenButton");
    const backButton = document.getElementById("classroomFlashcardsBackButton");

    if (prevButton && prevButton.dataset.handlerAttached !== "true") {
        prevButton.dataset.handlerAttached = "true";
        prevButton.addEventListener("click", classroomFlashcardsPrevious);
    }

    if (nextButton && nextButton.dataset.handlerAttached !== "true") {
        nextButton.dataset.handlerAttached = "true";
        nextButton.addEventListener("click", classroomFlashcardsNextButtonClick);
    }

    if (flashcardButton && flashcardButton.dataset.handlerAttached !== "true") {
        flashcardButton.dataset.handlerAttached = "true";
        flashcardButton.addEventListener("click", toggleClassroomFlashcard);
        flashcardButton.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                toggleClassroomFlashcard();
            }
        });
    }

    if (fullscreenButton && fullscreenButton.dataset.handlerAttached !== "true") {
        fullscreenButton.dataset.handlerAttached = "true";
        fullscreenButton.addEventListener("click", toggleClassroomFlashcardsFullscreen);
    }

    if (backButton && backButton.dataset.handlerAttached !== "true") {
        backButton.dataset.handlerAttached = "true";
        backButton.addEventListener("click", returnToClassroomActivityMenuFromFlashcards);
    }

    if (shuffleButton && shuffleButton.dataset.handlerAttached !== "true") {
        shuffleButton.dataset.handlerAttached = "true";
        shuffleButton.addEventListener("click", toggleClassroomFlashcardsShuffle);
    }

    if (document.documentElement.dataset.classroomFlashcardsFullscreenListenerAttached !== "true") {
        document.documentElement.dataset.classroomFlashcardsFullscreenListenerAttached = "true";
        document.addEventListener("fullscreenchange", updateClassroomFlashcardsFullscreenButtonLabel);
    }
}

function startClassroomTextFlashcards(set, addToHistory = true) {
    const textFlashcardsCards = getClassroomActivityCards(set);

    if (textFlashcardsCards.length === 0) {
        showClassroomNoCardsState(addToHistory);
        return;
    }

    classroomTextFlashcardsSetName = set.name;
    classroomTextFlashcardsCards = textFlashcardsCards;
    classroomTextFlashcardsIndex = 0;
    classroomTextFlashcardSide = "front";
    classroomTextFlashcardDirection = "translationToEnglish";
    classroomTextFlashcardsShuffleEnabled = false;
    classroomTextFlashcardsShuffledOrder = [];
    showClassroomTextFlashcards(addToHistory);
}

function showClassroomTextFlashcards(addToHistory = true) {
    displayScreen("classroomTextFlashcardsScreen", addToHistory);
    updateClassroomTextFlashcardDirectionButtonLabel();
    updateClassroomTextFlashcardsShuffleButton();
    renderClassroomTextFlashcard();
    maybeShowClassroomShortcutsHint("Space Flip Card");
}

function showClassroomTextFlashcardsForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet || classroomTextFlashcardsCards.length === 0) {
        showClassroomActivityMenuForSelectedSet(addToHistory);
        return;
    }

    classroomTextFlashcardsSetName = selectedSet.name;
    showClassroomTextFlashcards(addToHistory);
}

function getClassroomTextFlashcardDirectionLabel() {
    return classroomTextFlashcardDirection === "translationToEnglish"
        ? "Translation → English"
        : "English → Translation";
}

function updateClassroomTextFlashcardDirectionButtonLabel() {
    const directionButton = document.getElementById("classroomTextFlashcardDirectionButton");

    if (directionButton) {
        directionButton.textContent = getClassroomTextFlashcardDirectionLabel();
    }
}

function getClassroomTextFlashcardFrontText(card) {
    const english = card.english;
    const translation = getClassroomCardTranslation(card) || "—";

    return classroomTextFlashcardDirection === "translationToEnglish" ? translation : english;
}

function getClassroomTextFlashcardBackText(card) {
    const english = card.english;
    const translation = getClassroomCardTranslation(card) || "—";

    return classroomTextFlashcardDirection === "translationToEnglish" ? english : translation;
}

function updateClassroomTextFlashcardFlipUI() {
    const flashcard = document.getElementById("classroomTextFlashcard");
    const isBack = classroomTextFlashcardSide === "back";

    if (flashcard) {
        flashcard.classList.toggle("classroom-text-flashcard-flipped", isBack);
        flashcard.setAttribute("aria-pressed", isBack ? "true" : "false");
    }
}

function applyClassroomTextFlashcardContent(options = {}) {
    const preserveSide = options.preserveSide === true;
    const card = getClassroomTextFlashcardsCurrentCard();
    const total = classroomTextFlashcardsCards.length;
    const current = classroomTextFlashcardsIndex + 1;

    document.getElementById("classroomTextFlashcardsHeaderMeta").textContent =
        `${classroomTextFlashcardsSetName} • Card ${current} of ${total}`;

    document.getElementById("classroomTextFlashcardFrontText").textContent =
        getClassroomTextFlashcardFrontText(card);
    document.getElementById("classroomTextFlashcardBackText").textContent =
        getClassroomTextFlashcardBackText(card);

    if (!preserveSide) {
        if (options.animate === true && classroomTextFlashcardSide === "back") {
            setClassroomFlashcardSideToFrontWithoutFlip("classroomTextFlashcardInner", updateClassroomTextFlashcardFlipUI);
        } else {
            classroomTextFlashcardSide = "front";
            updateClassroomTextFlashcardFlipUI();
        }
    } else {
        updateClassroomTextFlashcardFlipUI();
    }

    updateClassroomTextFlashcardsNav();
    updateClassroomTextFlashcardsShuffleButton();
    saveClassroomTextFlashcardsContext();
}

function renderClassroomTextFlashcard(options = {}) {
    withClassroomContentTransition(
        document.getElementById("classroomTextFlashcardInner"),
        () => applyClassroomTextFlashcardContent(options),
        { animate: options.animate === true }
    );
}

function toggleClassroomTextFlashcard() {
    if (currentScreenId !== "classroomTextFlashcardsScreen") {
        return;
    }

    classroomTextFlashcardSide = classroomTextFlashcardSide === "front" ? "back" : "front";
    updateClassroomTextFlashcardFlipUI();
    saveClassroomTextFlashcardsContext();
}

function toggleClassroomTextFlashcardDirection() {
    if (currentScreenId !== "classroomTextFlashcardsScreen") {
        return;
    }

    classroomTextFlashcardDirection = classroomTextFlashcardDirection === "translationToEnglish"
        ? "englishToTranslation"
        : "translationToEnglish";
    classroomTextFlashcardSide = "front";
    updateClassroomTextFlashcardDirectionButtonLabel();
    renderClassroomTextFlashcard();
}

function updateClassroomTextFlashcardsNav() {
    const prevButton = document.getElementById("classroomTextFlashcardsPrevButton");
    const nextButton = document.getElementById("classroomTextFlashcardsNextButton");
    const isFirst = classroomTextFlashcardsIndex === 0;
    const isLast = classroomTextFlashcardsIndex === classroomTextFlashcardsCards.length - 1;

    prevButton.disabled = isFirst;
    prevButton.classList.toggle("disabled-button", isFirst);
    nextButton.textContent = isLast ? "Finish" : "Next →";
}

function classroomTextFlashcardsPrevious() {
    if (classroomTextFlashcardsIndex <= 0) {
        return;
    }

    classroomTextFlashcardsIndex -= 1;
    renderClassroomTextFlashcard({ animate: true });
}

function classroomTextFlashcardsJumpToFirst() {
    if (classroomTextFlashcardsCards.length === 0 || classroomTextFlashcardsIndex === 0) {
        return;
    }

    classroomTextFlashcardsIndex = 0;
    renderClassroomTextFlashcard({ animate: true });
}

function classroomTextFlashcardsJumpToLast() {
    const lastIndex = classroomTextFlashcardsCards.length - 1;

    if (classroomTextFlashcardsCards.length === 0 || classroomTextFlashcardsIndex === lastIndex) {
        return;
    }

    classroomTextFlashcardsIndex = lastIndex;
    renderClassroomTextFlashcard({ animate: true });
}

function isClassroomTextFlashcardsOnLastCard() {
    return classroomTextFlashcardsIndex >= classroomTextFlashcardsCards.length - 1;
}

function classroomTextFlashcardsAdvance() {
    if (isClassroomTextFlashcardsOnLastCard()) {
        return;
    }

    classroomTextFlashcardsIndex += 1;
    renderClassroomTextFlashcard({ animate: true });
}

function classroomTextFlashcardsNextButtonClick() {
    if (isClassroomTextFlashcardsOnLastCard()) {
        finishClassroomTextFlashcards();
        return;
    }

    classroomTextFlashcardsAdvance();
}

function finishClassroomTextFlashcards() {
    exitClassroomFullscreenIfActive();
    clearClassroomTextFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenuFromTextFlashcards() {
    exitClassroomFullscreenIfActive();
    clearClassroomTextFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function toggleClassroomTextFlashcardsFullscreen() {
    const textFlashcardsScreen = document.getElementById("classroomTextFlashcardsScreen");

    if (!textFlashcardsScreen) {
        return;
    }

    if (!document.fullscreenElement) {
        textFlashcardsScreen.requestFullscreen().catch(() => {
            showToast("Fullscreen is not available.", "warning");
        });
        return;
    }

    document.exitFullscreen();
}

function updateClassroomTextFlashcardsFullscreenButtonLabel() {
    const label = document.getElementById("classroomTextFlashcardsFullscreenButtonLabel");
    const button = document.getElementById("classroomTextFlashcardsFullscreenButton");

    if (!label || !button) {
        return;
    }

    const isFullscreen = document.fullscreenElement === document.getElementById("classroomTextFlashcardsScreen");
    label.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.title = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

function handleClassroomTextFlashcardsKeydown(event) {
    if (currentScreenId !== "classroomTextFlashcardsScreen") {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        classroomTextFlashcardsPrevious();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();

        if (isClassroomTextFlashcardsOnLastCard()) {
            return;
        }

        classroomTextFlashcardsAdvance();
        return;
    }

    if (event.key === "Home") {
        event.preventDefault();
        classroomTextFlashcardsJumpToFirst();
        return;
    }

    if (event.key === "End") {
        event.preventDefault();
        classroomTextFlashcardsJumpToLast();
        return;
    }

    if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        toggleClassroomTextFlashcard();
    }
}

function initClassroomTextFlashcardsControls() {
    const prevButton = document.getElementById("classroomTextFlashcardsPrevButton");
    const nextButton = document.getElementById("classroomTextFlashcardsNextButton");
    const shuffleButton = document.getElementById("classroomTextFlashcardsShuffleButton");
    const flashcardButton = document.getElementById("classroomTextFlashcard");
    const directionButton = document.getElementById("classroomTextFlashcardDirectionButton");
    const fullscreenButton = document.getElementById("classroomTextFlashcardsFullscreenButton");
    const backButton = document.getElementById("classroomTextFlashcardsBackButton");

    if (prevButton && prevButton.dataset.handlerAttached !== "true") {
        prevButton.dataset.handlerAttached = "true";
        prevButton.addEventListener("click", classroomTextFlashcardsPrevious);
    }

    if (nextButton && nextButton.dataset.handlerAttached !== "true") {
        nextButton.dataset.handlerAttached = "true";
        nextButton.addEventListener("click", classroomTextFlashcardsNextButtonClick);
    }

    if (flashcardButton && flashcardButton.dataset.handlerAttached !== "true") {
        flashcardButton.dataset.handlerAttached = "true";
        flashcardButton.addEventListener("click", toggleClassroomTextFlashcard);
        flashcardButton.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                toggleClassroomTextFlashcard();
            }
        });
    }

    if (directionButton && directionButton.dataset.handlerAttached !== "true") {
        directionButton.dataset.handlerAttached = "true";
        directionButton.addEventListener("click", toggleClassroomTextFlashcardDirection);
    }

    if (fullscreenButton && fullscreenButton.dataset.handlerAttached !== "true") {
        fullscreenButton.dataset.handlerAttached = "true";
        fullscreenButton.addEventListener("click", toggleClassroomTextFlashcardsFullscreen);
    }

    if (backButton && backButton.dataset.handlerAttached !== "true") {
        backButton.dataset.handlerAttached = "true";
        backButton.addEventListener("click", returnToClassroomActivityMenuFromTextFlashcards);
    }

    if (shuffleButton && shuffleButton.dataset.handlerAttached !== "true") {
        shuffleButton.dataset.handlerAttached = "true";
        shuffleButton.addEventListener("click", toggleClassroomTextFlashcardsShuffle);
    }

    if (document.documentElement.dataset.classroomTextFlashcardsFullscreenListenerAttached !== "true") {
        document.documentElement.dataset.classroomTextFlashcardsFullscreenListenerAttached = "true";
        document.addEventListener("fullscreenchange", updateClassroomTextFlashcardsFullscreenButtonLabel);
    }
}

function getClassroomVocabularyBoardModeLabel(boardMode) {
    return boardMode === "englishThai" ? "English → Thai mode" : "Picture → English mode";
}

const CLASSROOM_VOCABULARY_BOARD_PLACEHOLDER_SVG = `<svg class="classroom-image-placeholder-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>`;

function loadClassroomVocabularyBoardCardSize() {
    const stored = localStorage.getItem(CLASSROOM_VOCABULARY_BOARD_CARD_SIZE_STORAGE_KEY);

    if (CLASSROOM_VOCABULARY_BOARD_CARD_SIZES.includes(stored)) {
        return stored;
    }

    return "medium";
}

function saveClassroomVocabularyBoardCardSize(size) {
    localStorage.setItem(CLASSROOM_VOCABULARY_BOARD_CARD_SIZE_STORAGE_KEY, size);
}

function loadClassroomVocabularyBoardMode() {
    const stored = localStorage.getItem(CLASSROOM_VOCABULARY_BOARD_MODE_STORAGE_KEY);

    if (CLASSROOM_VOCABULARY_BOARD_MODES.includes(stored)) {
        return stored;
    }

    return "pictureEnglish";
}

function saveClassroomVocabularyBoardMode(mode) {
    localStorage.setItem(CLASSROOM_VOCABULARY_BOARD_MODE_STORAGE_KEY, mode);
}

function buildClassroomVocabularyBoardPictureEnglishCardHtml(card) {
    return `
        <article class="classroom-vocabulary-board-card">
            <div class="classroom-vocabulary-board-card-media">
                <img class="classroom-vocabulary-board-card-image" loading="lazy" decoding="async" alt="">
                <div class="classroom-image-placeholder classroom-vocabulary-board-card-placeholder" aria-hidden="true">
                    ${CLASSROOM_VOCABULARY_BOARD_PLACEHOLDER_SVG}
                    <p class="classroom-image-placeholder-label">No image</p>
                </div>
                <p class="classroom-vocabulary-board-card-label">${escapeHTML(card.english)}</p>
            </div>
        </article>
    `;
}

function buildClassroomVocabularyBoardEnglishThaiCardHtml(card) {
    const translation = getClassroomCardTranslation(card) || "—";

    return `
        <article class="classroom-vocabulary-board-card">
            <div class="classroom-vocabulary-board-card-media classroom-vocabulary-board-card-text">
                <p class="classroom-vocabulary-board-card-english">${escapeHTML(card.english)}</p>
                <p class="classroom-vocabulary-board-card-translation">${escapeHTML(translation)}</p>
            </div>
        </article>
    `;
}

function buildClassroomVocabularyBoardPictureEnglishGridHtml(cards) {
    return cards.map((card) => buildClassroomVocabularyBoardPictureEnglishCardHtml(card)).join("");
}

function buildClassroomVocabularyBoardEnglishThaiGridHtml(cards) {
    return cards.map((card) => buildClassroomVocabularyBoardEnglishThaiCardHtml(card)).join("");
}

function getClassroomVocabularyBoardGridSignature() {
    return `${classroomSelectedSetId}:${classroomVocabularyBoardCards.length}:${classroomVocabularyBoardMode}`;
}

function applyClassroomVocabularyBoardGridContent() {
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (!grid) {
        return;
    }

    updateClassroomVocabularyBoardGridSizeClass();

    grid.innerHTML = classroomVocabularyBoardMode === "englishThai"
        ? buildClassroomVocabularyBoardEnglishThaiGridHtml(classroomVocabularyBoardCards)
        : buildClassroomVocabularyBoardPictureEnglishGridHtml(classroomVocabularyBoardCards);

    grid.dataset.gridSignature = getClassroomVocabularyBoardGridSignature();

    if (classroomVocabularyBoardMode === "pictureEnglish") {
        applyClassroomVocabularyBoardCardImages();
    }
}

function applyClassroomVocabularyBoardCardImages() {
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (!grid) {
        return;
    }

    const cardElements = grid.querySelectorAll(".classroom-vocabulary-board-card");

    cardElements.forEach((cardElement, index) => {
        const card = classroomVocabularyBoardCards[index];

        if (!card) {
            return;
        }

        const imageEl = cardElement.querySelector(".classroom-vocabulary-board-card-image");
        const placeholderEl = cardElement.querySelector(".classroom-vocabulary-board-card-placeholder");
        setClassroomCardImage(imageEl, placeholderEl, card, { imageAlt: card.english });
    });
}

function updateClassroomVocabularyBoardCardSizeSelector() {
    const buttons = document.querySelectorAll("[data-vocabulary-board-size]");

    buttons.forEach((button) => {
        const isActive = button.dataset.vocabularyBoardSize === classroomVocabularyBoardCardSize;
        button.classList.toggle("classroom-vocabulary-board-size-button-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function updateClassroomVocabularyBoardGridSizeClass() {
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (!grid) {
        return;
    }

    grid.classList.remove(
        "classroom-vocabulary-board-grid-size-small",
        "classroom-vocabulary-board-grid-size-medium",
        "classroom-vocabulary-board-grid-size-large"
    );
    grid.classList.add(`classroom-vocabulary-board-grid-size-${classroomVocabularyBoardCardSize}`);
}

function setClassroomVocabularyBoardCardSize(size) {
    if (!CLASSROOM_VOCABULARY_BOARD_CARD_SIZES.includes(size)) {
        return;
    }

    if (classroomVocabularyBoardCardSize === size) {
        return;
    }

    classroomVocabularyBoardCardSize = size;
    saveClassroomVocabularyBoardCardSize(size);
    updateClassroomVocabularyBoardCardSizeSelector();
    updateClassroomVocabularyBoardGridSizeClass();
    saveClassroomVocabularyBoardContext();
}

function setClassroomVocabularyBoardMode(mode) {
    if (!CLASSROOM_VOCABULARY_BOARD_MODES.includes(mode)) {
        return;
    }

    if (classroomVocabularyBoardMode === mode) {
        return;
    }

    classroomVocabularyBoardMode = mode;
    saveClassroomVocabularyBoardMode(mode);
    updateClassroomVocabularyBoardModeTabs();
    renderClassroomVocabularyBoardGrid({ animate: true });
    saveClassroomVocabularyBoardContext();
}

function renderClassroomVocabularyBoardGrid(options = {}) {
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (!grid) {
        return;
    }

    const signature = getClassroomVocabularyBoardGridSignature();
    const needsRebuild = grid.dataset.gridSignature !== signature;

    if (!needsRebuild) {
        updateClassroomVocabularyBoardGridSizeClass();
        return;
    }

    const updateGrid = () => applyClassroomVocabularyBoardGridContent();

    if (options.animate === true) {
        withClassroomContentTransition(grid, updateGrid, { animate: true });
        return;
    }

    updateGrid();
}

function startClassroomVocabularyBoard(set, addToHistory = true) {
    const vocabularyBoardCards = getClassroomActivityCards(set);

    if (vocabularyBoardCards.length === 0) {
        showClassroomNoCardsState(addToHistory);
        return;
    }

    classroomVocabularyBoardSetName = set.name;
    classroomVocabularyBoardCards = vocabularyBoardCards;
    classroomVocabularyBoardMode = loadClassroomVocabularyBoardMode();
    classroomVocabularyBoardCardSize = loadClassroomVocabularyBoardCardSize();
    showClassroomVocabularyBoard(addToHistory);
}

function showClassroomVocabularyBoard(addToHistory = true) {
    displayScreen("classroomVocabularyBoardScreen", addToHistory);
    renderClassroomVocabularyBoard();
}

function showClassroomVocabularyBoardForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet || getClassroomActivityCards(selectedSet).length === 0) {
        showClassroomActivityMenuForSelectedSet(addToHistory);
        return;
    }

    classroomVocabularyBoardSetName = selectedSet.name;
    classroomVocabularyBoardCards = getClassroomActivityCards(selectedSet);
    classroomVocabularyBoardCardSize = loadClassroomVocabularyBoardCardSize();

    if (!CLASSROOM_VOCABULARY_BOARD_MODES.includes(classroomVocabularyBoardMode)) {
        classroomVocabularyBoardMode = loadClassroomVocabularyBoardMode();
    }

    showClassroomVocabularyBoard(addToHistory);
}

function updateClassroomVocabularyBoardModeTabs() {
    const pictureEnglishTab = document.getElementById("classroomVocabularyBoardModePictureEnglish");
    const englishThaiTab = document.getElementById("classroomVocabularyBoardModeEnglishThai");

    if (pictureEnglishTab) {
        const isActive = classroomVocabularyBoardMode === "pictureEnglish";
        pictureEnglishTab.classList.toggle("classroom-vocabulary-board-mode-tab-active", isActive);
        pictureEnglishTab.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    if (englishThaiTab) {
        const isActive = classroomVocabularyBoardMode === "englishThai";
        englishThaiTab.classList.toggle("classroom-vocabulary-board-mode-tab-active", isActive);
        englishThaiTab.setAttribute("aria-selected", isActive ? "true" : "false");
    }
}

function renderClassroomVocabularyBoard() {
    document.getElementById("classroomVocabularyBoardSetName").textContent = classroomVocabularyBoardSetName;
    updateClassroomVocabularyBoardModeTabs();
    updateClassroomVocabularyBoardCardSizeSelector();
    renderClassroomVocabularyBoardGrid();
    saveClassroomVocabularyBoardContext();
}

function returnToClassroomActivityMenuFromVocabularyBoard() {
    exitClassroomFullscreenIfActive();
    clearClassroomVocabularyBoardContext();
    showClassroomActivityMenuForSelectedSet();
}

function toggleClassroomVocabularyBoardFullscreen() {
    const vocabularyBoardScreen = document.getElementById("classroomVocabularyBoardScreen");

    if (!vocabularyBoardScreen) {
        return;
    }

    if (!document.fullscreenElement) {
        vocabularyBoardScreen.requestFullscreen().catch(() => {
            showToast("Fullscreen is not available.", "warning");
        });
        return;
    }

    document.exitFullscreen();
}

function updateClassroomVocabularyBoardFullscreenButtonLabel() {
    const label = document.getElementById("classroomVocabularyBoardFullscreenButtonLabel");
    const button = document.getElementById("classroomVocabularyBoardFullscreenButton");

    if (!label || !button) {
        return;
    }

    const isFullscreen = document.fullscreenElement === document.getElementById("classroomVocabularyBoardScreen");
    label.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.title = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

function handleClassroomVocabularyBoardKeydown(event) {
    if (currentScreenId !== "classroomVocabularyBoardScreen") {
        return;
    }

    if (event.key === "Escape") {
        const vocabularyBoardScreen = document.getElementById("classroomVocabularyBoardScreen");

        if (document.fullscreenElement === vocabularyBoardScreen) {
            event.preventDefault();
            document.exitFullscreen();
        }
    }
}

function initClassroomVocabularyBoardControls() {
    const fullscreenButton = document.getElementById("classroomVocabularyBoardFullscreenButton");
    const backButton = document.getElementById("classroomVocabularyBoardBackButton");

    if (fullscreenButton && fullscreenButton.dataset.handlerAttached !== "true") {
        fullscreenButton.dataset.handlerAttached = "true";
        fullscreenButton.addEventListener("click", toggleClassroomVocabularyBoardFullscreen);
    }

    if (backButton && backButton.dataset.handlerAttached !== "true") {
        backButton.dataset.handlerAttached = "true";
        backButton.addEventListener("click", returnToClassroomActivityMenuFromVocabularyBoard);
    }

    if (document.documentElement.dataset.classroomVocabularyBoardFullscreenListenerAttached !== "true") {
        document.documentElement.dataset.classroomVocabularyBoardFullscreenListenerAttached = "true";
        document.addEventListener("fullscreenchange", updateClassroomVocabularyBoardFullscreenButtonLabel);
    }

    const sizeControl = document.querySelector(".classroom-vocabulary-board-size-control");

    if (sizeControl && sizeControl.dataset.handlerAttached !== "true") {
        sizeControl.dataset.handlerAttached = "true";
        sizeControl.addEventListener("click", (event) => {
            const button = event.target.closest("[data-vocabulary-board-size]");

            if (!button) {
                return;
            }

            setClassroomVocabularyBoardCardSize(button.dataset.vocabularyBoardSize);
        });
    }

    const modeControl = document.querySelector(".classroom-vocabulary-board-mode-control");

    if (modeControl && modeControl.dataset.modeHandlerAttached !== "true") {
        modeControl.dataset.modeHandlerAttached = "true";
        modeControl.addEventListener("click", (event) => {
            const tab = event.target.closest("[data-vocabulary-board-mode]");

            if (!tab) {
                return;
            }

            setClassroomVocabularyBoardMode(tab.dataset.vocabularyBoardMode);
        });
    }
}

function exitClassroomFullscreenIfActive() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

function toggleClassroomFullscreen() {
    const presentationScreen = document.getElementById("classroomPresentationScreen");

    if (!presentationScreen) {
        return;
    }

    if (!document.fullscreenElement) {
        presentationScreen.requestFullscreen().catch(() => {
            showToast("Fullscreen is not available.", "warning");
        });
        return;
    }

    document.exitFullscreen();
}

function updateClassroomFullscreenButtonLabel() {
    const label = document.getElementById("classroomFullscreenButtonLabel");
    const button = document.getElementById("classroomFullscreenButton");

    if (!label || !button) {
        return;
    }

    const isFullscreen = document.fullscreenElement === document.getElementById("classroomPresentationScreen");
    label.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.title = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

function handleClassroomPresentationKeydown(event) {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        classroomPresentationPrevious();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();

        if (isClassroomPresentationOnLastCard()) {
            pulseClassroomFinishButton();
            return;
        }

        classroomPresentationAdvance();
        return;
    }

    if (event.key === "Home") {
        event.preventDefault();
        classroomPresentationJumpToFirst();
        return;
    }

    if (event.key === "End") {
        event.preventDefault();
        classroomPresentationJumpToLast();
        return;
    }

    if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        toggleClassroomTranslation();
    }
}

function initClassroomPresentationControls() {
    const prevButton = document.getElementById("classroomPrevButton");
    const nextButton = document.getElementById("classroomNextButton");
    const toggleButton = document.getElementById("classroomToggleTranslationButton");
    const fullscreenButton = document.getElementById("classroomFullscreenButton");
    const backButton = document.getElementById("classroomBackToPickerButton");

    if (prevButton && prevButton.dataset.handlerAttached !== "true") {
        prevButton.dataset.handlerAttached = "true";
        prevButton.addEventListener("click", classroomPresentationPrevious);
    }

    if (nextButton && nextButton.dataset.handlerAttached !== "true") {
        nextButton.dataset.handlerAttached = "true";
        nextButton.addEventListener("click", classroomPresentationNextButtonClick);
    }

    if (toggleButton && toggleButton.dataset.handlerAttached !== "true") {
        toggleButton.dataset.handlerAttached = "true";
        toggleButton.addEventListener("click", toggleClassroomTranslation);
    }

    if (fullscreenButton && fullscreenButton.dataset.handlerAttached !== "true") {
        fullscreenButton.dataset.handlerAttached = "true";
        fullscreenButton.addEventListener("click", toggleClassroomFullscreen);
    }

    if (backButton && backButton.dataset.handlerAttached !== "true") {
        backButton.dataset.handlerAttached = "true";
        backButton.addEventListener("click", returnToClassroomActivityMenu);
    }

    if (document.documentElement.dataset.classroomFullscreenListenerAttached !== "true") {
        document.documentElement.dataset.classroomFullscreenListenerAttached = "true";
        document.addEventListener("fullscreenchange", updateClassroomFullscreenButtonLabel);
    }
}

function initClassroomModeButton() {
    const classroomButton = document.getElementById("dashboardClassroomButton");

    if (!classroomButton || classroomButton.dataset.handlerAttached === "true") {
        return;
    }

    classroomButton.dataset.handlerAttached = "true";
    classroomButton.addEventListener("click", () => {
        showClassroomPicker();
    });
}

function resolveSetIndex(indexOrId) {
    if (typeof indexOrId === "number") {
        return indexOrId;
    }

    return savedSets.findIndex((set) => set.id === indexOrId);
}

async function toggleSetFavorite(indexOrId) {
    if (isDashboardTrashFilterActive()) {
        return;
    }

    const index = resolveSetIndex(indexOrId);
    if (index < 0) {
        return;
    }

    const newValue = !savedSets[index].is_favorite;

    try {
        await dbUpdateSetFavorite(savedSets[index].id, newValue);
        savedSets[index].is_favorite = newValue;
        renderDashboard();
    } catch (error) {
        showToast("Could not update favorite: " + error.message, "error");
    }
}

async function syncSavedSetsAfterRestore() {
    savedSets = await dbLoadSetsWithCards();
}

async function restoreSet(setId) {
    if (dashboardSelectionMode) {
        return;
    }

    try {
        await dbRestoreSet(setId);
        trashedSets = trashedSets.filter((set) => set.id !== setId);
        await syncSavedSetsAfterRestore();
        dashboardSelectedSetIds.delete(setId);
        renderDashboard();
        showToast("Set restored.", "success");
    } catch (error) {
        showToast("Could not restore set: " + error.message, "error");
    }
}

async function restoreSelectedSets() {
    if (!isDashboardTrashFilterActive() || dashboardSelectedSetIds.size === 0) {
        return;
    }

    const setIds = Array.from(dashboardSelectedSetIds);

    try {
        if (setIds.length === 1) {
            await dbRestoreSet(setIds[0]);
        } else {
            await dbRestoreSets(setIds);
        }

        const restoredIds = new Set(setIds);
        trashedSets = trashedSets.filter((set) => !restoredIds.has(set.id));
        await syncSavedSetsAfterRestore();
        cancelDashboardSelection();
        showToast(setIds.length === 1 ? "Set restored." : "Sets restored.", "success");
    } catch (error) {
        showToast("Could not restore sets: " + error.message, "error");
    }
}

function initSetsSortable() {
    const savedSetsList = document.getElementById("savedSetsList");

    if (setsSortable) {
        setsSortable.destroy();
        setsSortable = null;
    }

    if (!savedSetsList || getDashboardSourceSets().length === 0 || typeof Sortable === "undefined") {
        return;
    }

    if (!isDashboardDragEnabled()) {
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

function readBoolSetting(key, defaultValue) {
    const raw = localStorage.getItem(key);

    if (raw === null) {
        return defaultValue;
    }

    return raw === "true";
}

function getTrashAutoDeleteSetting() {
    return localStorage.getItem(SETTINGS_KEYS.trashAutoDelete) || SETTINGS_DEFAULTS.trashAutoDelete;
}

function isTeacherAnimationsEnabled() {
    return readBoolSetting(SETTINGS_KEYS.enableAnimations, SETTINGS_DEFAULTS.enableAnimations);
}

function isTeacherCelebrationPerfectEnabled() {
    return readBoolSetting(SETTINGS_KEYS.celebrationPerfect, SETTINGS_DEFAULTS.celebrationPerfect);
}

function syncSettingsModalControls() {
    const trashValue = getTrashAutoDeleteSetting();
    const trashRadio = document.querySelector(`input[name="settingsTrashAutoDelete"][value="${trashValue}"]`);

    if (trashRadio) {
        trashRadio.checked = true;
    }

    document.getElementById("settingsEnableAnimations").checked = isTeacherAnimationsEnabled();
    document.getElementById("settingsCelebrationPerfect").checked = isTeacherCelebrationPerfectEnabled();
}

async function openSettingsModal() {
    const modal = document.getElementById("settingsModal");
    const emailEl = document.getElementById("settingsAccountEmail");

    try {
        const { data } = await supabaseClient.auth.getSession();
        emailEl.textContent = data.session?.user?.email || "—";
    } catch (error) {
        emailEl.textContent = "—";
    }

    syncSettingsModalControls();
    modal.style.display = "flex";
}

function closeSettingsModal() {
    document.getElementById("settingsModal").style.display = "none";
}

function closeSettingsModalOnBackdrop(event) {
    if (event.target === event.currentTarget) {
        closeSettingsModal();
    }
}

function onSettingsTrashAutoDeleteChange(value) {
    localStorage.setItem(SETTINGS_KEYS.trashAutoDelete, value);
}

function onSettingsEnableAnimationsChange(enabled) {
    localStorage.setItem(SETTINGS_KEYS.enableAnimations, enabled ? "true" : "false");
}

function onSettingsCelebrationPerfectChange(enabled) {
    localStorage.setItem(SETTINGS_KEYS.celebrationPerfect, enabled ? "true" : "false");
}


function openPlayChoice(indexOrId) {
    if (dashboardSelectionMode) return;

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
    if (dashboardSelectionMode) return;

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
    if (dashboardSelectionMode) return;

    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    let selectedSet = savedSets[index];

    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);

    showCardsScreen();
}

function getDuplicateSetName(originalName, existingNames = null) {
    const baseName = originalName.trim();
    const names = existingNames || savedSets.map((set) => set.name);
    const firstChoice = `${baseName} (Copy)`;

    if (!names.includes(firstChoice)) {
        return firstChoice;
    }

    let counter = 2;
    while (names.includes(`${baseName} (Copy ${counter})`)) {
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
    if (dashboardSelectionMode) return;

    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        duplicateSet(indexOrId);
    }
}

async function duplicateSet(indexOrId) {
    if (dashboardSelectionMode) return;

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

function sanitizeWorksheetName(name) {
    const sanitized = String(name || "")
        .trim()
        .replace(/[\\/*?:[\]]/g, "")
        .slice(0, 31);

    return sanitized || "Vocabulary Set";
}

function sanitizeExcelFilename(setName) {
    const sanitized = setName
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return `${sanitized || "vocabulary-set"}.xlsx`;
}

function autosizeExcelColumns(worksheet, columnCount) {
    for (let col = 1; col <= columnCount; col++) {
        let maxLength = 10;

        worksheet.eachRow((row) => {
            const value = row.getCell(col).value;
            const text = value == null ? "" : String(value);
            maxLength = Math.max(maxLength, text.length);
        });

        worksheet.getColumn(col).width = Math.min(maxLength + 2, 60);
    }
}

function downloadExcelFile(filename, buffer) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function buildAndDownloadExcelWorkbook(set) {
    if (typeof ExcelJS === "undefined") {
        throw new Error("Excel export library is not available.");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Word Fish";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sanitizeWorksheetName(set.name));
    worksheet.addRow(["English", "Translation"]);

    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDFF4FF" }
        };
    });

    worksheet.views = [{
        state: "frozen",
        ySplit: 1,
        topLeftCell: "A2",
        activeCell: "A2"
    }];

    for (const card of set.cards || []) {
        worksheet.addRow([
            card.english || "",
            card.thai || card.translation || ""
        ]);
    }

    autosizeExcelColumns(worksheet, 2);

    const buffer = await workbook.xlsx.writeBuffer();
    downloadExcelFile(sanitizeExcelFilename(set.name), buffer);
}

async function exportSet(indexOrId) {
    if (dashboardSelectionMode) return;

    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    const set = savedSets[index];

    try {
        await buildAndDownloadExcelWorkbook(set);
        showToast("Excel exported successfully.", "success");
    } catch (error) {
        showToast("Could not export Excel: " + error.message, "error");
    }
}

function createImportValidationError() {
    const error = new Error("Invalid Excel file.");
    error.isImportValidationError = true;
    return error;
}

function excelCellToString(cell) {
    if (!cell || cell.value == null) {
        return "";
    }

    const value = cell.value;

    if (typeof value === "object") {
        if (Array.isArray(value.richText)) {
            return value.richText.map((part) => part.text || "").join("");
        }

        if (value.text != null) {
            return String(value.text);
        }

        if (value.result != null) {
            return String(value.result);
        }
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return String(value);
}

function getImportedSetNameFromFilename(filename) {
    const baseName = String(filename || "")
        .replace(/\.xlsx$/i, "")
        .trim();

    return baseName || "Imported Set";
}

function getImportedSetName(baseName) {
    const names = savedSets.map((set) => set.name);
    const base = baseName.trim() || "Imported Set";

    if (!names.includes(base)) {
        return base;
    }

    const firstChoice = `${base} (Imported)`;
    if (!names.includes(firstChoice)) {
        return firstChoice;
    }

    let counter = 2;
    while (names.includes(`${base} (Imported ${counter})`)) {
        counter++;
    }

    return `${base} (Imported ${counter})`;
}

async function parseExcelImportFile(file) {
    if (typeof ExcelJS === "undefined") {
        throw new Error("Excel import library is not available.");
    }

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw createImportValidationError();
    }

    const headerRow = worksheet.getRow(1);
    if (!headerRow || headerRow.cellCount === 0) {
        throw createImportValidationError();
    }

    let englishCol = null;
    let translationCol = null;

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = excelCellToString(cell).trim().toLowerCase();

        if (header === "english") {
            englishCol = colNumber;
        }

        if (header === "translation") {
            translationCol = colNumber;
        }
    });

    if (englishCol === null || translationCol === null) {
        throw createImportValidationError();
    }

    const cards = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            return;
        }

        const english = excelCellToString(row.getCell(englishCol)).trim();
        const translation = excelCellToString(row.getCell(translationCol)).trim();

        if (english === "" && translation === "") {
            return;
        }

        if (english === "") {
            return;
        }

        cards.push({
            english: english,
            thai: translation,
            imageUrl: ""
        });
    });

    if (cards.length === 0) {
        throw createImportValidationError();
    }

    return cards;
}

function openExcelImportPicker() {
    const input = document.getElementById("excelImportInput");
    if (!input) {
        return;
    }

    input.value = "";
    input.click();
}

function showExcelImportValidationError() {
    showToast("Invalid Excel file. Please use columns: English and Translation.", "error");
}

async function handleExcelImportSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
        showExcelImportValidationError();
        return;
    }

    try {
        const cards = await parseExcelImportFile(file);
        const baseName = getImportedSetNameFromFilename(file.name);
        const setName = getImportedSetName(baseName);
        const newSet = await dbCreateSetWithCards(setName, cards);

        savedSets = await dbLoadSetsWithCards();
        renderDashboard();
        scrollToDuplicatedSet(newSet.id);
        showToast("Excel imported successfully.", "success");
    } catch (error) {
        if (error.isImportValidationError) {
            showExcelImportValidationError();
            return;
        }

        showToast("Could not import Excel: " + error.message, "error");
    }
}

function openBulkDuplicateConfirm() {
    if (!dashboardSelectionMode || dashboardSelectedSetIds.size === 0) {
        return;
    }

    pendingBulkDuplicateSetIds = Array.from(dashboardSelectedSetIds);
    document.getElementById("duplicateConfirmModal").style.display = "flex";
}

function closeBulkDuplicateConfirm() {
    pendingBulkDuplicateSetIds = [];
    document.getElementById("duplicateConfirmModal").style.display = "none";
}

function closeBulkDuplicateConfirmOnBackdrop(event) {
    if (event.target === event.currentTarget) {
        closeBulkDuplicateConfirm();
    }
}

async function confirmBulkDuplicate() {
    const selectedIds = pendingBulkDuplicateSetIds.slice();
    closeBulkDuplicateConfirm();

    if (selectedIds.length === 0) {
        return;
    }

    const selectedIdSet = new Set(selectedIds);
    const sourceSets = savedSets.filter((set) => selectedIdSet.has(set.id));
    const workingNames = savedSets.map((set) => set.name);

    try {
        for (const sourceSet of sourceSets) {
            const duplicateName = getDuplicateSetName(sourceSet.name, workingNames);
            await dbDuplicateSet(sourceSet, duplicateName);
            workingNames.push(duplicateName);
        }

        savedSets = await dbLoadSetsWithCards();
        cancelDashboardSelection();
        showToast("Sets duplicated successfully.", "success");
    } catch (error) {
        showToast("Could not duplicate sets: " + error.message, "error");
        savedSets = await dbLoadSetsWithCards();
        renderDashboard();
    }
}

function deleteSet(indexOrId) {
    if (dashboardSelectionMode) return;

    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    openDeleteConfirm(index);
}

function openDeleteConfirm(index) {
    deleteConfirmMode = "single";
    pendingDeleteSetIndex = index;
    pendingBulkDeleteSetIds = [];
    pendingPermanentDeleteSetIds = [];

    const setNameEl = document.getElementById("deleteConfirmSetName");
    document.getElementById("deleteConfirmTitle").textContent = "Delete vocabulary set?";
    document.getElementById("deleteConfirmBody").textContent = "Are you sure you want to delete";
    setNameEl.textContent = `"${savedSets[index].name}"`;
    setNameEl.style.display = "block";
    document.getElementById("deleteConfirmWarning").textContent = "This action cannot be undone.";
    document.getElementById("deleteConfirmActionButton").textContent = "Delete";
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function openBulkDeleteConfirm() {
    if (!dashboardSelectionMode || dashboardSelectedSetIds.size === 0) {
        return;
    }

    deleteConfirmMode = "bulk";
    pendingDeleteSetIndex = null;
    pendingBulkDeleteSetIds = Array.from(dashboardSelectedSetIds);
    pendingPermanentDeleteSetIds = [];

    document.getElementById("deleteConfirmTitle").textContent = "Delete selected sets?";
    document.getElementById("deleteConfirmBody").textContent = "The selected sets will be moved to Trash.";
    document.getElementById("deleteConfirmSetName").style.display = "none";
    document.getElementById("deleteConfirmWarning").textContent = "You can restore them later.";
    document.getElementById("deleteConfirmActionButton").textContent = "Move to Trash";
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function configureDeleteForeverModal() {
    document.getElementById("deleteConfirmTitle").textContent = "Delete permanently?";
    document.getElementById("deleteConfirmBody").textContent = "This action cannot be undone.";
    document.getElementById("deleteConfirmSetName").style.display = "none";
    document.getElementById("deleteConfirmWarning").textContent = "The selected sets and all their vocabulary cards will be permanently deleted.";
    document.getElementById("deleteConfirmActionButton").textContent = "Delete Forever";
}

function deleteForeverSet(setId) {
    if (dashboardSelectionMode || !isDashboardTrashFilterActive()) {
        return;
    }

    deleteConfirmMode = "forever";
    pendingDeleteSetIndex = null;
    pendingBulkDeleteSetIds = [];
    pendingPermanentDeleteSetIds = [setId];
    configureDeleteForeverModal();
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function openBulkDeleteForeverConfirm() {
    if (!isDashboardTrashFilterActive() || dashboardSelectedSetIds.size === 0) {
        return;
    }

    deleteConfirmMode = "foreverBulk";
    pendingDeleteSetIndex = null;
    pendingBulkDeleteSetIds = [];
    pendingPermanentDeleteSetIds = Array.from(dashboardSelectedSetIds);
    configureDeleteForeverModal();
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function closeDeleteConfirm() {
    pendingDeleteSetIndex = null;
    pendingBulkDeleteSetIds = [];
    pendingPermanentDeleteSetIds = [];
    deleteConfirmMode = "single";
    document.getElementById("deleteConfirmModal").style.display = "none";
}

function closeDeleteConfirmOnBackdrop(event) {
    if (event.target === event.currentTarget) {
        closeDeleteConfirm();
    }
}

async function confirmDeleteAction() {
    const mode = deleteConfirmMode;

    if (mode === "forever" || mode === "foreverBulk") {
        const setIds = pendingPermanentDeleteSetIds.slice();
        closeDeleteConfirm();

        if (setIds.length === 0) {
            return;
        }

        try {
            await dbPermanentlyDeleteSets(setIds);

            const removedIds = new Set(setIds);
            trashedSets = trashedSets.filter((set) => !removedIds.has(set.id));

            if (mode === "foreverBulk") {
                cancelDashboardSelection();
            } else {
                renderDashboard();
            }

            showToast("Deleted permanently.", "success");
        } catch (error) {
            showToast("Could not delete permanently: " + error.message, "error");
        }

        return;
    }

    let setIds = [];

    if (mode === "bulk") {
        setIds = pendingBulkDeleteSetIds.slice();
    } else if (pendingDeleteSetIndex !== null) {
        setIds = [savedSets[pendingDeleteSetIndex].id];
    }

    if (setIds.length === 0) {
        return;
    }

    closeDeleteConfirm();

    try {
        if (setIds.length === 1) {
            await dbDeleteSet(setIds[0]);
        } else {
            await dbSoftDeleteSets(setIds);
        }

        const removedIds = new Set(setIds);
        savedSets = savedSets.filter((set) => !removedIds.has(set.id));

        if (mode === "bulk") {
            cancelDashboardSelection();
            showToast("Moved to Trash.", "success");
        } else {
            renderDashboard();
            showToast("Set deleted 🗑️", "success");
        }
    } catch (error) {
        const errorMessage = mode === "bulk"
            ? "Could not move to trash: " + error.message
            : "Could not delete set: " + error.message;
        showToast(errorMessage, "error");
    }
}

document.addEventListener("keydown", (event) => {
    handleClassroomPresentationKeydown(event);
    handleClassroomFlashcardsKeydown(event);
    handleClassroomTextFlashcardsKeydown(event);
    handleClassroomVocabularyBoardKeydown(event);

    if (event.key !== "Escape") return;

    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && settingsModal.style.display === "flex") {
        closeSettingsModal();
        return;
    }

    const duplicateModal = document.getElementById("duplicateConfirmModal");
    if (duplicateModal && duplicateModal.style.display === "flex") {
        closeBulkDuplicateConfirm();
        return;
    }

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
    saveGameContext(mode, gameLaunchSource);

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
    clearGameContext();
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
    clearGameContext();
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

async function restoreGameFromRefresh(context) {
    const { setId, gameMode, launchedFrom } = context;

    if (!setId || !gameMode) {
        return false;
    }

    try {
        if (launchedFrom === "student") {
            isStudentMode = true;
            const set = await dbLoadPublicSetById(setId);

            if (!set || !set.cards || set.cards.length === 0) {
                return false;
            }

            editingSetId = set.id;
            currentSetName = set.name;
            cards = prepareCards(set.cards);
        } else {
            const { data } = await supabaseClient.auth.getSession();

            if (!data.session) {
                return false;
            }

            savedSets = await dbLoadSetsWithCards();
            const set = savedSets.find((item) => item.id === setId);

            if (!set) {
                return false;
            }

            editingSetId = set.id;
            currentSetName = set.name;
            cards = prepareCards(set.cards || []);
        }

        gameLaunchSource = launchedFrom || "editor";
        await startGame(gameMode, launchedFrom);
        return true;
    } catch (error) {
        console.error("Game restore failed:", error);
        return false;
    }
}

async function restoreClassroomActivityMenuFromContext(context) {
    const setId = context.setId;

    if (!setId || context.mode !== "classroomActivityMenu") {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }

        savedSets = await dbLoadSetsWithCards();
        const set = savedSets.find((item) => item.id === setId);

        if (!set) {
            return false;
        }

        classroomSelectedSetId = set.id;
        displayScreen("classroomActivityMenuScreen", false);
        document.getElementById("classroomActivityMenuTitle").textContent = set.name;
        updateClassroomActivityMenuEmptyState(set);
        saveClassroomActivityContext();
        return true;
    } catch (error) {
        console.error("Classroom activity menu restore failed:", error);
        return false;
    }
}

async function tryRestoreClassroomActivityMenuOnRefresh() {
    if (!isClassroomActivityMenuRefreshRequested()) {
        return false;
    }

    const context = loadClassroomActivityContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreClassroomActivityMenuFromContext(context);
}

async function handleFailedClassroomActivityMenuRefresh() {
    clearClassroomActivityContext();
    history.replaceState(null, "", window.location.pathname + window.location.search);

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        savedSets = await dbLoadSetsWithCards();
        showClassroomPicker(false);
        return;
    }

    hideAppLoading();
    displayScreen("authScreen", false);
    history.replaceState({ screen: "authScreen" }, "", "#auth");
}

async function restoreClassroomVocabularyBoardFromContext(context) {
    const setId = context.setId;

    if (!setId || context.mode !== "classroomVocabularyBoard") {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }

        savedSets = await dbLoadSetsWithCards();
        const set = savedSets.find((item) => item.id === setId);

        if (!set) {
            return false;
        }

        const vocabularyBoardCards = getClassroomActivityCards(set);

        classroomSelectedSetId = set.id;

        if (vocabularyBoardCards.length === 0) {
            displayScreen("classroomNoCardsScreen", false);
            return true;
        }

        classroomVocabularyBoardSetName = set.name;
        classroomVocabularyBoardMode = context.boardMode === "englishThai" ? "englishThai" : "pictureEnglish";
        saveClassroomVocabularyBoardMode(classroomVocabularyBoardMode);
        classroomVocabularyBoardCards = vocabularyBoardCards;
        classroomVocabularyBoardCardSize = loadClassroomVocabularyBoardCardSize();

        displayScreen("classroomVocabularyBoardScreen", false);
        renderClassroomVocabularyBoard();
        return true;
    } catch (error) {
        console.error("Classroom vocabulary board restore failed:", error);
        return false;
    }
}

async function tryRestoreClassroomVocabularyBoardOnRefresh() {
    if (!isClassroomVocabularyBoardRefreshRequested()) {
        return false;
    }

    const context = loadClassroomVocabularyBoardContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreClassroomVocabularyBoardFromContext(context);
}

async function handleFailedClassroomVocabularyBoardRefresh() {
    clearClassroomVocabularyBoardContext();
    history.replaceState(null, "", window.location.pathname + window.location.search);

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        savedSets = await dbLoadSetsWithCards();
        showClassroomPicker(false);
        return;
    }

    hideAppLoading();
    displayScreen("authScreen", false);
    history.replaceState({ screen: "authScreen" }, "", "#auth");
}

async function restoreClassroomTextFlashcardsFromContext(context) {
    const setId = context.setId;

    if (!setId || context.mode !== "classroomTextFlashcards") {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }

        savedSets = await dbLoadSetsWithCards();
        const set = savedSets.find((item) => item.id === setId);

        if (!set) {
            return false;
        }

        const textFlashcardsCards = getClassroomActivityCards(set);

        classroomSelectedSetId = set.id;

        if (textFlashcardsCards.length === 0) {
            displayScreen("classroomNoCardsScreen", false);
            return true;
        }

        classroomTextFlashcardsSetName = set.name;
        classroomTextFlashcardsCards = textFlashcardsCards;
        restoreClassroomTextFlashcardsShuffleState(context, textFlashcardsCards.length);

        let restoredIndex = Number(context.currentCardIndex);
        if (!Number.isFinite(restoredIndex)) {
            restoredIndex = 0;
        }

        classroomTextFlashcardsIndex = Math.max(0, Math.min(restoredIndex, textFlashcardsCards.length - 1));
        classroomTextFlashcardSide = context.cardSide === "back" ? "back" : "front";
        classroomTextFlashcardDirection = context.direction === "englishToTranslation"
            ? "englishToTranslation"
            : "translationToEnglish";

        displayScreen("classroomTextFlashcardsScreen", false);
        updateClassroomTextFlashcardDirectionButtonLabel();
        updateClassroomTextFlashcardsShuffleButton();
        renderClassroomTextFlashcard({ preserveSide: true });
        saveClassroomTextFlashcardsContext();
        return true;
    } catch (error) {
        console.error("Classroom text flashcards restore failed:", error);
        return false;
    }
}

async function tryRestoreClassroomTextFlashcardsOnRefresh() {
    if (!isClassroomTextFlashcardsRefreshRequested()) {
        return false;
    }

    const context = loadClassroomTextFlashcardsContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreClassroomTextFlashcardsFromContext(context);
}

async function handleFailedClassroomTextFlashcardsRefresh() {
    clearClassroomTextFlashcardsContext();
    history.replaceState(null, "", window.location.pathname + window.location.search);

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        savedSets = await dbLoadSetsWithCards();
        showClassroomPicker(false);
        return;
    }

    hideAppLoading();
    displayScreen("authScreen", false);
    history.replaceState({ screen: "authScreen" }, "", "#auth");
}

async function restoreClassroomFlashcardsFromContext(context) {
    const setId = context.setId;

    if (!setId || context.mode !== "classroomFlashcards") {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }

        savedSets = await dbLoadSetsWithCards();
        const set = savedSets.find((item) => item.id === setId);

        if (!set) {
            return false;
        }

        const flashcardsCards = getClassroomActivityCards(set);

        classroomSelectedSetId = set.id;

        if (flashcardsCards.length === 0) {
            displayScreen("classroomNoCardsScreen", false);
            return true;
        }

        classroomFlashcardsSetName = set.name;
        classroomFlashcardsCards = flashcardsCards;
        restoreClassroomFlashcardsShuffleState(context, flashcardsCards.length);

        let restoredIndex = Number(context.currentCardIndex);
        if (!Number.isFinite(restoredIndex)) {
            restoredIndex = 0;
        }

        classroomFlashcardsIndex = Math.max(0, Math.min(restoredIndex, flashcardsCards.length - 1));
        classroomFlashcardSide = context.cardSide === "back" ? "back" : "front";

        displayScreen("classroomFlashcardsScreen", false);
        updateClassroomFlashcardsShuffleButton();
        renderClassroomFlashcard({ preserveSide: true });
        saveClassroomFlashcardsContext();
        return true;
    } catch (error) {
        console.error("Classroom flashcards restore failed:", error);
        return false;
    }
}

async function tryRestoreClassroomFlashcardsOnRefresh() {
    if (!isClassroomFlashcardsRefreshRequested()) {
        return false;
    }

    const context = loadClassroomFlashcardsContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreClassroomFlashcardsFromContext(context);
}

async function handleFailedClassroomFlashcardsRefresh() {
    clearClassroomFlashcardsContext();
    history.replaceState(null, "", window.location.pathname + window.location.search);

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        savedSets = await dbLoadSetsWithCards();
        showClassroomPicker(false);
        return;
    }

    hideAppLoading();
    displayScreen("authScreen", false);
    history.replaceState({ screen: "authScreen" }, "", "#auth");
}

async function restoreClassroomPresentationFromContext(context) {
    const setId = context.setId;

    if (!setId || context.mode !== "classroomPresentation") {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }

        savedSets = await dbLoadSetsWithCards();
        const set = savedSets.find((item) => item.id === setId);

        if (!set) {
            return false;
        }

        const presentationCards = getClassroomActivityCards(set);

        classroomSelectedSetId = set.id;

        if (presentationCards.length === 0) {
            displayScreen("classroomNoCardsScreen", false);
            return true;
        }

        classroomPresentationSetName = set.name;
        classroomPresentationCards = presentationCards;

        let restoredIndex = Number(context.currentCardIndex);
        if (!Number.isFinite(restoredIndex)) {
            restoredIndex = 0;
        }

        classroomPresentationIndex = Math.max(0, Math.min(restoredIndex, presentationCards.length - 1));
        classroomTranslationVisible = !!context.translationVisible;

        displayScreen("classroomPresentationScreen", false);
        renderClassroomPresentationCard({ preserveTranslation: true });
        saveClassroomPresentationContext();
        return true;
    } catch (error) {
        console.error("Classroom presentation restore failed:", error);
        return false;
    }
}

async function tryRestoreClassroomPresentationOnRefresh() {
    if (!isClassroomPresentationRefreshRequested()) {
        return false;
    }

    const context = loadClassroomPresentationContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreClassroomPresentationFromContext(context);
}

async function handleFailedClassroomPresentationRefresh() {
    clearClassroomPresentationContext();
    history.replaceState(null, "", window.location.pathname + window.location.search);

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        savedSets = await dbLoadSetsWithCards();
        showClassroomPicker(false);
        return;
    }

    hideAppLoading();
    displayScreen("authScreen", false);
    history.replaceState({ screen: "authScreen" }, "", "#auth");
}

async function tryRestoreGameOnRefresh() {
    if (!isGameRefreshRequested()) {
        return false;
    }

    const context = loadGameContext();

    if (!context) {
        return false;
    }

    if (context.launchedFrom !== "student") {
        const { data } = await supabaseClient.auth.getSession();

        if (!data.session) {
            return false;
        }
    }

    return restoreGameFromRefresh(context);
}

async function checkAuth() {
    showAppLoading();
    initStudentShareLink();

    if (studentShareSetId) {
        hideAppLoading();
        await enterStudentMode(studentShareSetId);
        return;
    }

    if (await tryRestoreGameOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isGameRefreshRequested()) {
        clearGameContext();
        history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    if (await tryRestoreClassroomPresentationOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isClassroomPresentationRefreshRequested()) {
        hideAppLoading();
        await handleFailedClassroomPresentationRefresh();
        return;
    }

    if (await tryRestoreClassroomFlashcardsOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isClassroomFlashcardsRefreshRequested()) {
        hideAppLoading();
        await handleFailedClassroomFlashcardsRefresh();
        return;
    }

    if (await tryRestoreClassroomTextFlashcardsOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isClassroomTextFlashcardsRefreshRequested()) {
        hideAppLoading();
        await handleFailedClassroomTextFlashcardsRefresh();
        return;
    }

    if (await tryRestoreClassroomVocabularyBoardOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isClassroomVocabularyBoardRefreshRequested()) {
        hideAppLoading();
        await handleFailedClassroomVocabularyBoardRefresh();
        return;
    }

    if (await tryRestoreClassroomActivityMenuOnRefresh()) {
        hideAppLoading();
        return;
    }

    if (isClassroomActivityMenuRefreshRequested()) {
        hideAppLoading();
        await handleFailedClassroomActivityMenuRefresh();
        return;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        hideAppLoading();
        showDashboard();
    } else {
        const playParam = new URLSearchParams(window.location.search).get("play");
        if (playParam && playParam.trim() !== "") {
            hideAppLoading();
            await enterStudentMode(playParam.trim());
            return;
        }

        hideAppLoading();
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
    clearGameContext();

    displayScreen("authScreen");
}

function initApp() {
    initClassroomModeButton();
    initClassroomPresentationControls();
    initClassroomFlashcardsControls();
    initClassroomTextFlashcardsControls();
    initClassroomVocabularyBoardControls();
    initClassroomShortcutsHint();
    checkAuth();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
