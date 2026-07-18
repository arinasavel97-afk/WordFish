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
let currentSetAccentColor = "orange";
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
let activeWordCardImagePopoverIndex = null;
let activeWordCardImageDeleteConfirmIndex = null;
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
let unscrambleClueIndex = -1;
let unscrambleClueUsed = false;
let lastGameOrderSignature = "";
let currentScreenId = "";
let suppressHistoryPush = false;
let gameLaunchSource = "editor";
let classroomSelectedSetId = null;
let classroomPresentationCards = [];
let classroomPresentationIndex = 0;
let classroomPresentationSetName = "";
let classroomPresentationLoopEnabled = false;
let classroomPresentationShuffleEnabled = false;
let classroomPresentationShuffledOrder = [];
let classroomTranslationVisible = false;
let classroomFlashcardsCards = [];
let classroomFlashcardsIndex = 0;
let classroomFlashcardsSetName = "";
let classroomFlashcardSide = "front";
let classroomFlashcardsShuffleEnabled = false;
let classroomFlashcardsShuffledOrder = [];
let classroomFlashcardsLoopEnabled = false;
let classroomFlashcardsAutoPronounceEnabled = false;
let classroomFlashcardsJumpIndex = [];
let classroomTextFlashcardsCards = [];
let classroomTextFlashcardsIndex = 0;
let classroomTextFlashcardsSetName = "";
let classroomTextFlashcardSide = "front";
let classroomTextFlashcardDirection = "translationToEnglish";
let classroomTextFlashcardsShuffleEnabled = false;
let classroomTextFlashcardsShuffledOrder = [];
let classroomTextFlashcardsLoopEnabled = false;
let classroomTextFlashcardsJumpIndex = [];
let classroomVocabularyBoardSetName = "";
let classroomVocabularyBoardMode = "pictureEnglish";
let classroomVocabularyBoardCards = [];
let classroomVocabularyBoardCardSize = "medium";
const GAME_CONTEXT_STORAGE_KEY = "wordfish_game_context";
const BUILDER_CONTEXT_STORAGE_KEY = "wordfish_builder_context";
const CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY = "wordfish_classroom_presentation_context";
const CLASSROOM_ACTIVITY_CONTEXT_STORAGE_KEY = "wordfish_classroom_activity_context";
const CLASSROOM_FLASHCARDS_CONTEXT_STORAGE_KEY = "wordfish_classroom_flashcards_context";
const CLASSROOM_TEXT_FLASHCARDS_CONTEXT_STORAGE_KEY = "wordfish_classroom_text_flashcards_context";
const CLASSROOM_VOCABULARY_BOARD_CONTEXT_STORAGE_KEY = "wordfish_classroom_vocabulary_board_context";
const CLASSROOM_VOCABULARY_BOARD_CARD_SIZE_STORAGE_KEY = "wordfishVocabularyBoardCardSize";
const CLASSROOM_VOCABULARY_BOARD_MODE_STORAGE_KEY = "wordfishVocabularyBoardMode";
const CLASSROOM_VOCABULARY_BOARD_CARD_SIZES = ["small", "medium", "large"];
const CLASSROOM_VOCABULARY_BOARD_MODES = ["pictureEnglish", "englishThai"];
const SCREEN_CONTEXT_STORAGE_KEY = "wordfish_screen_context";
const CLASSROOM_SHORTCUTS_HINT_STORAGE_KEY = "wordfish_hide_classroom_shortcuts_hint";
const SETTINGS_KEYS = {
    trashAutoDelete: "wordfish_settings_trash_auto_delete",
    enableAnimations: "wordfish_settings_enable_animations",
    celebrationPerfect: "wordfish_settings_celebration_perfect",
    pronunciationLocale: "wordfish_settings_pronunciation_locale",
    pronunciationRate: "wordfish_settings_pronunciation_rate",
    autoPronounce: "wordfish_settings_auto_pronounce"
};
const SETTINGS_DEFAULTS = {
    trashAutoDelete: "never",
    enableAnimations: true,
    celebrationPerfect: true,
    pronunciationLocale: "en-US",
    pronunciationRate: "normal",
    autoPronounce: false
};

/*
 * Student Share Links — detect ?play=<setId> or /play/<setId>
 */
let studentShareSetId = null;
let isStudentMode = false;
let isPasswordRecovery = false;

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
    "Great catch!",
    "Pearl found!",
    "Splash-tastic!",
    "Nice swimming!",
    "You got it!",
    "Fin-tastic!",
    "Brilliant!"
];

function hideAllScreens() {
    document.getElementById("appLoadingScreen").style.display = "none";
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("resetPasswordScreen").style.display = "none";
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
    document.getElementById("gameLibraryScreen").style.display = "none";
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

function saveScreenContext(screenId) {
    if (screenId === "appLoadingScreen" || screenId === "authScreen" || screenId === "resetPasswordScreen" || screenId === "resultsScreen") {
        return;
    }
    try {
        sessionStorage.setItem(SCREEN_CONTEXT_STORAGE_KEY, JSON.stringify({
            screenId,
            editingSetId: editingSetId || null,
            classroomSelectedSetId: classroomSelectedSetId || null,
            studentShareSetId: studentShareSetId || null,
            selectedPlaySetIndex: selectedPlaySetIndex || null
        }));
    } catch (error) {
        // Ignore storage errors.
    }
}

function loadScreenContext() {
    try {
        const raw = sessionStorage.getItem(SCREEN_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearScreenContext() {
    sessionStorage.removeItem(SCREEN_CONTEXT_STORAGE_KEY);
}

function saveBuilderContext() {
    if (!editingSetId) {
        return;
    }

    sessionStorage.setItem(BUILDER_CONTEXT_STORAGE_KEY, JSON.stringify({
        setId: editingSetId
    }));
}

function loadBuilderContext() {
    try {
        const raw = sessionStorage.getItem(BUILDER_CONTEXT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function clearBuilderContext() {
    sessionStorage.removeItem(BUILDER_CONTEXT_STORAGE_KEY);
}

function isGameRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "game";
}

function isBuilderRefreshRequested() {
    return window.location.hash.replace(/^#/, "") === "cards";
}

function saveClassroomPresentationContext() {
    if (currentScreenId !== "classroomPresentationScreen" || !classroomSelectedSetId) {
        return;
    }

    localStorage.setItem(CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY, JSON.stringify({
        mode: "classroomPresentation",
        setId: classroomSelectedSetId,
        currentCardIndex: classroomPresentationIndex,
        translationVisible: classroomTranslationVisible,
        loopEnabled: classroomPresentationLoopEnabled,
        shuffleEnabled: classroomPresentationShuffleEnabled,
        shuffledOrder: classroomPresentationShuffledOrder
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
        shuffledOrder: classroomFlashcardsShuffledOrder,
        loopEnabled: classroomFlashcardsLoopEnabled
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
        shuffledOrder: classroomTextFlashcardsShuffledOrder,
        loopEnabled: classroomTextFlashcardsLoopEnabled
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

const OCEAN_PANEL_SCREEN_IDS = new Set([
    "dashboardScreen",
    "authScreen",
    "resetPasswordScreen",
    "teacherScreen",
    "cardsScreen",
    "classroomPickerScreen",
    "classroomActivityMenuScreen",
    "classroomNoCardsScreen",
    "studentScreen",
    "gameLibraryScreen"
]);

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
    saveScreenContext(screenId);

    if (screenId === "gameLibraryScreen") {
        const backButton = screen.querySelector(".classroom-back-nav");
        if (backButton) {
            backButton.style.display = isStudentMode ? "none" : "";
        }
    }

    document.body.classList.toggle(
        "wf-page-shell--ocean-panel-active",
        OCEAN_PANEL_SCREEN_IDS.has(screenId)
    );

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
    } else if (screenId === "gameLibraryScreen") {
        displayScreen("gameLibraryScreen", false);
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
            <h2>Fishing for your sets...</h2>
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
                <h2>Could not load sets</h2>
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
    const sidebarNavItems = document.querySelectorAll(".wf-sidebar-item[data-dashboard-filter]");
    const sortHint = document.getElementById("dashboardSortHint");
    const hintMessages = [];

    if (sortSelect) {
        sortSelect.value = dashboardSortMode;
    }

    sidebarNavItems.forEach((item) => {
        const isActive = item.dataset.dashboardFilter === dashboardFilterMode;
        item.classList.toggle("wf-sidebar-item--active", isActive);
        if (isActive) {
            item.setAttribute("aria-current", "page");
        } else {
            item.removeAttribute("aria-current");
        }
    });

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

const SET_ACCENT_COLOR_IDS = ["orange", "yellow", "green", "teal", "blue", "purple", "pink", "red"];
const DEFAULT_SET_ACCENT_COLOR = "orange";
const BUILDER_ACCENT_HEX_BY_ID = {
    orange: "#FFB703",
    yellow: "#FFD166",
    green: "#06D6A0",
    teal: "#00A6C8",
    blue: "#3FA9F5",
    purple: "#B36DE7",
    pink: "#F472B6",
    red: "#EF476F"
};

function normalizeSetAccentColor(color) {
    const normalized = String(color || "").trim().toLowerCase();

    if (SET_ACCENT_COLOR_IDS.includes(normalized)) {
        return normalized;
    }

    return DEFAULT_SET_ACCENT_COLOR;
}

function getSetAccentHex(color) {
    return BUILDER_ACCENT_HEX_BY_ID[normalizeSetAccentColor(color)];
}

function getSetCardAccentClass(accentColor) {
    return `set-card-accent--${normalizeSetAccentColor(accentColor)}`;
}

function buildSetCardMetadataLine(wordCount, imageCount) {
    const wordsLabel = wordCount === 1 ? "word" : "words";
    const imagesLabel = imageCount === 1 ? "image" : "images";
    return `${wordCount} ${wordsLabel} • ${imageCount} ${imagesLabel}`;
}

function formatSetLastEditedLine(updatedAt, createdAt) {
    const timestamp = updatedAt || createdAt;
    if (!timestamp) {
        return "";
    }

    const editedDate = new Date(timestamp);
    if (Number.isNaN(editedDate.getTime())) {
        return "";
    }

    const englishMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const timeLabel = `${String(editedDate.getHours()).padStart(2, "0")}:${String(editedDate.getMinutes()).padStart(2, "0")}`;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    let dayLabel;
    if (editedDate.toDateString() === now.toDateString()) {
        dayLabel = "Today";
    } else if (editedDate.toDateString() === yesterday.toDateString()) {
        dayLabel = "Yesterday";
    } else {
        dayLabel = `${englishMonthsShort[editedDate.getMonth()]} ${editedDate.getDate()}`;
    }

    return `Last edited: ${dayLabel}, ${timeLabel}`;
}

function buildSetCardOverflowMenuIcons() {
    const iconSvg = (paths) =>
        `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${paths}"/></svg>`;

    return {
        edit: iconSvg("m16.862 4.487 1.687-1.687a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"),
        duplicate: iconSvg("M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75v9A2.25 2.25 0 0 0 9 18.75h6.75ZM6 7.5h9A2.25 2.25 0 0 1 17.25 9.75v9A2.25 2.25 0 0 1 15 21H6A2.25 2.25 0 0 1 3.75 18.75V9.75A2.25 2.25 0 0 1 6 7.5Z"),
        export: iconSvg("M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"),
        delete: iconSvg("m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"),
    };
}

function buildSetCardOverflowTriggerHtml(disabledAttr) {
    return `
                <div class="set-card-overflow">
                    <button type="button" class="set-overflow-trigger wf-icon-button" onclick="toggleSetCardOverflowMenu(event)" aria-label="Set actions" aria-haspopup="menu" aria-expanded="false"${disabledAttr}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>
                    </button>
                </div>`;
}

function buildSetCardOverflowMenuPanelHtml(setId, disabledAttr) {
    const menuIcons = buildSetCardOverflowMenuIcons();
    const menuRow = (icon, label, extraAttrs = "") =>
        `<button type="button" class="set-overflow-menu-item" role="menuitem"${extraAttrs}${disabledAttr}>
            <span class="set-overflow-menu-item__icon" aria-hidden="true">${menuIcons[icon]}</span>
            <span class="set-overflow-menu-item__label">${label}</span>
        </button>`;

    const duplicateDisabled = disabledAttr.includes("disabled");
    const duplicateItem = duplicateDisabled
        ? menuRow("duplicate", "Duplicate")
        : menuRow("duplicate", "Duplicate", ` onclick="closeAllSetCardOverflowMenus(); duplicateSet('${escapeAttribute(setId)}')" onkeydown="handleDuplicateSetKeydown(event, '${escapeAttribute(setId)}')"`);

    return `
            <div class="set-overflow-menu" role="menu" hidden>
                ${menuRow("edit", "Edit", ` onclick="closeAllSetCardOverflowMenus(); editSet('${escapeAttribute(setId)}')"`)}
                ${duplicateItem}
                ${menuRow("export", "Export", ` onclick="closeAllSetCardOverflowMenus(); exportSet('${escapeAttribute(setId)}')"`)}
                <div class="set-overflow-menu-divider" role="separator"></div>
                <button type="button" class="set-overflow-menu-item set-overflow-menu-item--danger" role="menuitem" onclick="closeAllSetCardOverflowMenus(); deleteSet('${escapeAttribute(setId)}')"${disabledAttr}>
                    <span class="set-overflow-menu-item__icon" aria-hidden="true">${menuIcons.delete}</span>
                    <span class="set-overflow-menu-item__label">Delete</span>
                </button>
            </div>`;
}

function closeAllSetCardOverflowMenus() {
    document.querySelectorAll("#savedSetsList .set-overflow-menu").forEach((menu) => {
        menu.hidden = true;
    });
    document.querySelectorAll("#savedSetsList .set-overflow-trigger").forEach((trigger) => {
        trigger.setAttribute("aria-expanded", "false");
    });
}

function toggleSetCardOverflowMenu(event) {
    event.stopPropagation();

    if (dashboardSelectionMode) {
        return;
    }

    const shell = event.currentTarget.closest(".set-card-shell");
    const menu = shell.querySelector(":scope > .set-overflow-menu");
    const trigger = event.currentTarget;
    const willOpen = menu.hidden;

    closeAllSetCardOverflowMenus();

    if (willOpen) {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
    }
}

function initSetCardOverflowMenus() {
    if (window.setCardOverflowMenusInitialized) {
        return;
    }

    window.setCardOverflowMenusInitialized = true;

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".set-card-overflow") && !event.target.closest(".set-overflow-menu")) {
            closeAllSetCardOverflowMenus();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAllSetCardOverflowMenus();
        }
    });
}

function renderDashboard() {
    let savedSetsList = document.getElementById("savedSetsList");

    if (setsSortable) {
        setsSortable.destroy();
        setsSortable = null;
    }

    savedSetsList.innerHTML = "";
    closeAllSetCardOverflowMenus();
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
                <h2>Your library is empty</h2>
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
            let metadataLine = buildSetCardMetadataLine(wordCount, imageCount);
            let lastEditedLine = formatSetLastEditedLine(set.updated_at, set.created_at);

            savedSetsList.innerHTML += `
            <div class="card set-card set-card-v2 set-card-trash ${getSetCardAccentClass(set.accentColor)}${isSelected ? " set-card-selected" : ""}" data-set-id="${escapeAttribute(setId)}">
                <div class="set-card-color-strip" aria-hidden="true"></div>
                <div class="set-card-body">
                    <label class="set-card-select">
                        <input type="checkbox" class="set-card-select-input" aria-label="Select ${escapeAttribute(set.name)}" ${isSelected ? "checked" : ""} onchange="onSetSelectionChange('${escapeAttribute(setId)}', this.checked)">
                    </label>
                    <h2 class="set-card-title">${escapeHTML(set.name)}</h2>
                    <div class="set-card-metadata-group">
                        <p class="set-card-metadata">${metadataLine}</p>
                        <p class="set-card-metadata set-card-metadata--edited">${escapeHTML(lastEditedLine)}</p>
                    </div>
                    <div class="set-actions set-card-footer set-actions-trash">
                        <button class="green-button wf-cta-primary" onclick="restoreSet('${escapeAttribute(setId)}')"${disabledAttr}>Restore</button>
                        <button class="red-button wf-cta-danger" onclick="deleteForeverSet('${escapeAttribute(setId)}')"${disabledAttr}>Delete Forever</button>
                    </div>
                </div>
            </div>
        `;
            continue;
        }

        let cardDisabled = dashboardSelectionMode;
        let disabledAttr = cardDisabled ? " disabled" : "";
        let isFavorite = !!set.is_favorite;
        let favoriteLabel = isFavorite ? "Remove from favorites" : "Add to favorites";
        let favoriteStarSvg = isFavorite
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>';
        let metadataLine = buildSetCardMetadataLine(wordCount, imageCount);
        let lastEditedLine = formatSetLastEditedLine(set.updated_at, set.created_at);

        savedSetsList.innerHTML += `
            <div class="set-card-shell">
                <div class="card set-card set-card-v2 ${getSetCardAccentClass(set.accentColor)}${isSelected ? " set-card-selected" : ""}" data-set-id="${escapeAttribute(setId)}">
                    <div class="set-card-color-strip" aria-hidden="true"></div>
                    <div class="set-card-body">
                        <label class="set-card-select">
                            <input type="checkbox" class="set-card-select-input" aria-label="Select ${escapeAttribute(set.name)}" ${isSelected ? "checked" : ""} onchange="onSetSelectionChange('${escapeAttribute(setId)}', this.checked)">
                        </label>
                        <div class="set-card-controls">
                            <button type="button" class="set-favorite-button wf-icon-button${isFavorite ? " is-favorite" : ""}" onclick="toggleSetFavorite('${escapeAttribute(setId)}')" aria-label="${escapeAttribute(favoriteLabel)}" aria-pressed="${isFavorite ? "true" : "false"}" title="${escapeAttribute(favoriteLabel)}">
                                ${favoriteStarSvg}
                            </button>
                            <button type="button" class="set-drag-handle wf-icon-button" aria-label="Drag to reorder set" title="Drag to reorder"${disabledAttr}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75h.008v.008H9V6.75Zm0 5.25h.008v.008H9V12Zm0 5.25h.008v.008H9v-.008ZM15 6.75h.008v.008H15V6.75Zm0 5.25h.008v.008H15V12Zm0 5.25h.008v.008H15v-.008Z"/></svg>
                            </button>
                            ${buildSetCardOverflowTriggerHtml(disabledAttr)}
                        </div>
                        <h2 class="set-card-title">${escapeHTML(set.name)}</h2>
                        <div class="set-card-metadata-group">
                            <p class="set-card-metadata">${metadataLine}</p>
                            <p class="set-card-metadata set-card-metadata--edited">${escapeHTML(lastEditedLine)}</p>
                        </div>
                        <div class="set-actions set-card-footer">
                            <button class="green-button wf-cta-primary" onclick="openGameLibrary('${escapeAttribute(setId)}')"${disabledAttr}>Play</button>
                            <button class="share-button wf-cta-secondary" onclick="openShareDialog('${escapeAttribute(setId)}')"${disabledAttr}>Share</button>
                        </div>
                    </div>
                </div>
                ${buildSetCardOverflowMenuPanelHtml(setId, disabledAttr)}
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
                <div class="classroom-set-title-row">
                    <img src="assets/decorations/classroom/classroom-books.png" alt="" aria-hidden="true" class="classroom-set-books">
                    <h2 class="classroom-set-name">${escapeHTML(set.name)}</h2>
                </div>
                <div class="classroom-set-stats">
                    <p class="classroom-set-stat">
                        <img class="classroom-set-stat-icon" src="assets/decorations/classroom/shell-blue.png" alt="" aria-hidden="true">
                        <span class="small-label">Words:</span>
                        <span>${wordCount}</span>
                    </p>
                    <p class="classroom-set-stat">
                        <img class="classroom-set-stat-icon" src="assets/decorations/classroom/starfish-pink.png" alt="" aria-hidden="true">
                        <span class="small-label">Images:</span>
                        <span>${imageCount}</span>
                    </p>
                </div>
                ${emptyNote}
                <div class="classroom-set-actions">
                    <button type="button" class="green-button wf-cta-primary classroom-activity-button" onclick="openClassroomActivityMenu('${escapeAttribute(setId)}')">Choose Activity</button>
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
    classroomPresentationLoopEnabled = false;
    classroomPresentationShuffleEnabled = false;
    classroomPresentationShuffledOrder = [];
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

    if (classroomPresentationShuffleEnabled) {
        classroomPresentationShuffledOrder = createClassroomShuffledOrder(presentationCards.length);
    } else {
        classroomPresentationShuffledOrder = [];
    }

    showClassroomPresentation(addToHistory);
}

function showClassroomPresentation(addToHistory = true) {
    displayScreen("classroomPresentationScreen", addToHistory);
    updateClassroomPresentationLoopButton();
    updateClassroomPresentationShuffleButton();
    updateClassroomPresentationAutoPronounceButton();
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

function getClassroomPresentationActiveOrder() {
    if (
        classroomPresentationShuffleEnabled
        && classroomPresentationShuffledOrder.length === classroomPresentationCards.length
    ) {
        return classroomPresentationShuffledOrder;
    }

    return classroomPresentationCards.map((_, index) => index);
}

function getClassroomPresentationCurrentCard() {
    const activeOrder = getClassroomPresentationActiveOrder();
    const originalIndex = activeOrder[classroomPresentationIndex] ?? 0;

    return classroomPresentationCards[originalIndex];
}

function restoreClassroomPresentationShuffleState(context, cardCount) {
    classroomPresentationLoopEnabled = !!context.loopEnabled;
    classroomPresentationShuffleEnabled = !!context.shuffleEnabled;

    if (classroomPresentationShuffleEnabled) {
        classroomPresentationShuffledOrder = normalizeClassroomShuffledOrder(context.shuffledOrder, cardCount);

        if (classroomPresentationShuffledOrder.length !== cardCount) {
            classroomPresentationShuffleEnabled = false;
            classroomPresentationShuffledOrder = [];
        }
    } else {
        classroomPresentationShuffledOrder = [];
    }
}

function applyClassroomPresentationCardContent(options = {}) {
    const preserveTranslation = options.preserveTranslation === true;
    const card = getClassroomPresentationCurrentCard();
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
    updateClassroomPresentationPronounceButton();
    saveClassroomPresentationContext();
    maybeAutoPronounceClassroomPresentationWord();
}

function isGlobalAutoPronounceEnabled() {
    return readBoolSetting(SETTINGS_KEYS.autoPronounce, SETTINGS_DEFAULTS.autoPronounce);
}

function maybeAutoPronounceClassroomPresentationWord() {
    if (currentScreenId !== "classroomPresentationScreen" || !isGlobalAutoPronounceEnabled()) {
        return;
    }

    const englishWord = getClassroomPresentationEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    if (typeof isEnglishPronunciationAvailable === "function" && !isEnglishPronunciationAvailable()) {
        return;
    }

    speakEnglishWord(englishWord, { source: "presentation", auto: true });
}

function getClassroomPresentationEnglishWord() {
    const card = getClassroomPresentationCurrentCard();

    return (card?.english || "").trim();
}

function updateClassroomPresentationPronounceButton() {
    const pronounceButton = document.getElementById("classroomPresentationPronounceButton");

    if (!pronounceButton) {
        return;
    }

    const isAvailable = typeof isEnglishPronunciationAvailable === "function"
        && isEnglishPronunciationAvailable();
    const englishWord = getClassroomPresentationEnglishWord();

    pronounceButton.hidden = !isAvailable;
    pronounceButton.disabled = !isAvailable || englishWord === "";
}

function stopClassroomPresentationPronunciation() {
    if (typeof stopEnglishPronunciation === "function") {
        stopEnglishPronunciation();
    }
}

function pronounceClassroomPresentationWord() {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    const englishWord = getClassroomPresentationEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    speakEnglishWord(englishWord, { source: "presentation" });
}

function renderClassroomPresentationCard(options = {}) {
    stopClassroomPresentationPronunciation();

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
    toggleButton.classList.toggle("classroom-toggle-translation-button-active", classroomTranslationVisible);
    toggleButton.classList.toggle("wf-toggle-button--active", classroomTranslationVisible);
    toggleButton.setAttribute("aria-pressed", classroomTranslationVisible ? "true" : "false");
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
    const isLast = classroomPresentationIndex >= classroomPresentationCards.length - 1;
    const loopEnabled = classroomPresentationLoopEnabled && classroomPresentationCards.length > 0;

    prevButton.disabled = loopEnabled ? false : isFirst;
    prevButton.classList.toggle("disabled-button", loopEnabled ? false : isFirst);
    nextButton.textContent = isLast && !loopEnabled ? "Finish" : "Next →";
}

function classroomPresentationPrevious() {
    if (classroomPresentationCards.length === 0) {
        return;
    }

    if (classroomPresentationIndex <= 0) {
        if (classroomPresentationLoopEnabled) {
            classroomPresentationIndex = classroomPresentationCards.length - 1;
            classroomTranslationVisible = false;
            renderClassroomPresentationCard({ animate: true });
        }

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
    if (classroomPresentationCards.length === 0) {
        return;
    }

    if (isClassroomPresentationOnLastCard()) {
        if (classroomPresentationLoopEnabled) {
            classroomPresentationIndex = 0;
            classroomTranslationVisible = false;
            renderClassroomPresentationCard({ animate: true });
        }

        return;
    }

    classroomPresentationIndex += 1;
    classroomTranslationVisible = false;
    renderClassroomPresentationCard({ animate: true });
}

function classroomPresentationNextButtonClick() {
    if (isClassroomPresentationOnLastCard()) {
        if (classroomPresentationLoopEnabled) {
            classroomPresentationAdvance();
            return;
        }

        finishClassroomPresentation();
        return;
    }

    classroomPresentationAdvance();
}

function updateClassroomPresentationLoopButton() {
    const loopButton = document.getElementById("classroomPresentationLoopButton");

    if (!loopButton) {
        return;
    }

    loopButton.setAttribute("aria-pressed", classroomPresentationLoopEnabled ? "true" : "false");
    loopButton.classList.toggle("classroom-loop-button-active", classroomPresentationLoopEnabled);
    loopButton.classList.toggle("wf-toggle-button--active", classroomPresentationLoopEnabled);
}

function updateClassroomPresentationShuffleButton() {
    const shuffleButton = document.getElementById("classroomPresentationShuffleButton");

    if (!shuffleButton) {
        return;
    }

    shuffleButton.setAttribute("aria-pressed", classroomPresentationShuffleEnabled ? "true" : "false");
    shuffleButton.classList.toggle("classroom-shuffle-button-active", classroomPresentationShuffleEnabled);
    shuffleButton.classList.toggle("wf-toggle-button--active", classroomPresentationShuffleEnabled);
}

function updateClassroomPresentationAutoPronounceButton() {
    const autoPronounceButton = document.getElementById("classroomPresentationAutoPronounceButton");

    if (!autoPronounceButton) {
        return;
    }

    const isEnabled = isGlobalAutoPronounceEnabled();

    autoPronounceButton.setAttribute("aria-pressed", isEnabled ? "true" : "false");
    autoPronounceButton.classList.toggle("classroom-auto-pronounce-button-active", isEnabled);
    autoPronounceButton.classList.toggle("wf-toggle-button--active", isEnabled);
}

function toggleClassroomPresentationLoop() {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    classroomPresentationLoopEnabled = !classroomPresentationLoopEnabled;
    updateClassroomPresentationLoopButton();
    updateClassroomPresentationNav();
    saveClassroomPresentationContext();
}

function toggleClassroomPresentationShuffle() {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    classroomPresentationShuffleEnabled = !classroomPresentationShuffleEnabled;
    updateClassroomPresentationShuffleButton();
    saveClassroomPresentationContext();
}

function toggleClassroomPresentationAutoPronounce() {
    if (currentScreenId !== "classroomPresentationScreen") {
        return;
    }

    const enabled = !isGlobalAutoPronounceEnabled();

    onSettingsAutoPronounceChange(enabled);
    updateClassroomPresentationAutoPronounceButton();

    if (enabled) {
        maybeAutoPronounceClassroomPresentationWord();
        return;
    }

    stopClassroomPresentationPronunciation();
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
    stopClassroomPresentationPronunciation();
    exitClassroomFullscreenIfActive();
    clearClassroomPresentationContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenu() {
    stopClassroomPresentationPronunciation();
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

function buildClassroomFlashcardJumpIndex(cards) {
    return cards.map((card, originalIndex) => {
        const english = card.english || "";
        const translation = getClassroomCardTranslation(card) || "";

        return {
            originalIndex,
            english,
            translation,
            imageUrl: card.imageUrl || "",
            searchText: `${english} ${translation}`.toLowerCase()
        };
    });
}

function rebuildClassroomFlashcardsJumpIndex() {
    classroomFlashcardsJumpIndex = buildClassroomFlashcardJumpIndex(classroomFlashcardsCards);
}

function rebuildClassroomTextFlashcardsJumpIndex() {
    classroomTextFlashcardsJumpIndex = buildClassroomFlashcardJumpIndex(classroomTextFlashcardsCards);
}

function getClassroomFlashcardJumpMatches(jumpIndex, query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return jumpIndex;
    }

    const matches = [];

    for (let index = 0; index < jumpIndex.length; index += 1) {
        if (jumpIndex[index].searchText.includes(normalized)) {
            matches.push(jumpIndex[index]);
        }
    }

    return matches;
}

const classroomFlashcardJumpPickerState = {
    classroomFlashcardsJump: { activeOptionIndex: -1 },
    classroomTextFlashcardsJump: { activeOptionIndex: -1 }
};

function renderClassroomFlashcardJumpListHtml(matches, isImageMode, activeOptionIndex) {
    if (matches.length === 0) {
        return `<p class="classroom-flashcard-jump-empty">No matching words</p>`;
    }

    return matches.map((entry, optionIndex) => {
        const isActive = optionIndex === activeOptionIndex;
        const activeClass = isActive ? " classroom-flashcard-jump-option-active" : "";

        if (isImageMode) {
            const thumbMarkup = entry.imageUrl
                ? `<img class="classroom-flashcard-jump-thumb" src="${escapeAttribute(entry.imageUrl)}" alt="">`
                : `<span class="classroom-flashcard-jump-thumb-placeholder" aria-hidden="true"><svg class="classroom-flashcard-jump-thumb-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg></span>`;

            return `<button type="button" class="classroom-flashcard-jump-option${activeClass}" role="option" aria-selected="${isActive ? "true" : "false"}" data-original-index="${entry.originalIndex}">${thumbMarkup}<span class="classroom-flashcard-jump-option-text">${escapeHTML(entry.english)}</span></button>`;
        }

        return `<button type="button" class="classroom-flashcard-jump-option classroom-flashcard-jump-option-text-only${activeClass}" role="option" aria-selected="${isActive ? "true" : "false"}" data-original-index="${entry.originalIndex}"><span class="classroom-flashcard-jump-option-english">${escapeHTML(entry.english)}</span><span class="classroom-flashcard-jump-option-translation">${escapeHTML(entry.translation || "—")}</span></button>`;
    }).join("");
}

function updateClassroomFlashcardJumpDropdown(config) {
    const input = document.getElementById(config.inputId);
    const list = document.getElementById(config.listId);
    const state = classroomFlashcardJumpPickerState[config.stateKey];
    const jumpIndex = config.getJumpIndex();
    const matches = getClassroomFlashcardJumpMatches(jumpIndex, input ? input.value : "");

    if (state.activeOptionIndex >= matches.length) {
        state.activeOptionIndex = matches.length > 0 ? 0 : -1;
    }

    list.innerHTML = renderClassroomFlashcardJumpListHtml(matches, config.isImageMode, state.activeOptionIndex);

    const activeOption = list.querySelector(".classroom-flashcard-jump-option-active");

    if (activeOption) {
        activeOption.scrollIntoView({ block: "nearest" });
    }
}

function openClassroomFlashcardJumpDropdown(config) {
    const input = document.getElementById(config.inputId);
    const list = document.getElementById(config.listId);

    if (!input || !list) {
        return;
    }

    input.setAttribute("aria-expanded", "true");
    list.hidden = false;
    updateClassroomFlashcardJumpDropdown(config);
}

function closeClassroomFlashcardJumpDropdown(config) {
    const input = document.getElementById(config.inputId);
    const list = document.getElementById(config.listId);
    const state = classroomFlashcardJumpPickerState[config.stateKey];

    if (!input || !list) {
        return;
    }

    input.setAttribute("aria-expanded", "false");
    list.hidden = true;
    input.value = "";
    state.activeOptionIndex = -1;
    list.innerHTML = "";
}

function closeClassroomFlashcardsJumpDropdown() {
    closeClassroomFlashcardJumpDropdown({
        inputId: "classroomFlashcardsJumpInput",
        listId: "classroomFlashcardsJumpList",
        stateKey: "classroomFlashcardsJump"
    });
}

function closeClassroomTextFlashcardsJumpDropdown() {
    closeClassroomFlashcardJumpDropdown({
        inputId: "classroomTextFlashcardsJumpInput",
        listId: "classroomTextFlashcardsJumpList",
        stateKey: "classroomTextFlashcardsJump"
    });
}

function jumpClassroomFlashcardsToOriginalIndex(originalIndex) {
    if (currentScreenId !== "classroomFlashcardsScreen" || classroomFlashcardsCards.length === 0) {
        return;
    }

    const parsedIndex = Number(originalIndex);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= classroomFlashcardsCards.length) {
        return;
    }

    const activeOrder = getClassroomFlashcardsActiveOrder();
    const position = activeOrder.indexOf(parsedIndex);

    if (position < 0) {
        return;
    }

    classroomFlashcardsIndex = position;
    classroomFlashcardSide = "front";
    closeClassroomFlashcardsJumpDropdown();
    renderClassroomFlashcard({ animate: true });
}

function jumpClassroomTextFlashcardsToOriginalIndex(originalIndex) {
    if (currentScreenId !== "classroomTextFlashcardsScreen" || classroomTextFlashcardsCards.length === 0) {
        return;
    }

    const parsedIndex = Number(originalIndex);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex >= classroomTextFlashcardsCards.length) {
        return;
    }

    const activeOrder = getClassroomTextFlashcardsActiveOrder();
    const position = activeOrder.indexOf(parsedIndex);

    if (position < 0) {
        return;
    }

    classroomTextFlashcardsIndex = position;
    classroomTextFlashcardSide = "front";
    closeClassroomTextFlashcardsJumpDropdown();
    renderClassroomTextFlashcard({ animate: true });
}

function handleClassroomFlashcardJumpInputKeydown(event, config) {
    event.stopPropagation();

    const list = document.getElementById(config.listId);
    const state = classroomFlashcardJumpPickerState[config.stateKey];
    const jumpIndex = config.getJumpIndex();
    const input = document.getElementById(config.inputId);
    const matches = getClassroomFlashcardJumpMatches(jumpIndex, input ? input.value : "");

    if (event.key === "Escape") {
        event.preventDefault();
        closeClassroomFlashcardJumpDropdown(config);
        input.blur();
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();

        if (list.hidden) {
            openClassroomFlashcardJumpDropdown(config);
            return;
        }

        if (matches.length === 0) {
            return;
        }

        state.activeOptionIndex = state.activeOptionIndex >= matches.length - 1
            ? 0
            : state.activeOptionIndex + 1;
        updateClassroomFlashcardJumpDropdown(config);
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        if (list.hidden) {
            openClassroomFlashcardJumpDropdown(config);
            return;
        }

        if (matches.length === 0) {
            return;
        }

        state.activeOptionIndex = state.activeOptionIndex <= 0
            ? matches.length - 1
            : state.activeOptionIndex - 1;
        updateClassroomFlashcardJumpDropdown(config);
        return;
    }

    if (event.key === "Enter") {
        if (list.hidden) {
            openClassroomFlashcardJumpDropdown(config);
            return;
        }

        if (state.activeOptionIndex < 0 || state.activeOptionIndex >= matches.length) {
            return;
        }

        event.preventDefault();
        config.onJump(matches[state.activeOptionIndex].originalIndex);
    }
}

function initClassroomFlashcardJumpPicker(config) {
    const input = document.getElementById(config.inputId);
    const list = document.getElementById(config.listId);

    if (!input || !list || input.dataset.handlerAttached === "true") {
        return;
    }

    input.dataset.handlerAttached = "true";

    input.addEventListener("focus", () => {
        openClassroomFlashcardJumpDropdown(config);
    });

    input.addEventListener("click", () => {
        openClassroomFlashcardJumpDropdown(config);
    });

    input.addEventListener("input", () => {
        classroomFlashcardJumpPickerState[config.stateKey].activeOptionIndex = -1;
        openClassroomFlashcardJumpDropdown(config);
    });

    input.addEventListener("keydown", (event) => {
        handleClassroomFlashcardJumpInputKeydown(event, config);
    });

    list.addEventListener("click", (event) => {
        const option = event.target.closest("[data-original-index]");

        if (!option) {
            return;
        }

        config.onJump(option.dataset.originalIndex);
    });
}

function setupClassroomFlashcardJumpOutsideClose() {
    if (document.documentElement.dataset.classroomFlashcardJumpOutsideCloseAttached === "true") {
        return;
    }

    document.documentElement.dataset.classroomFlashcardJumpOutsideCloseAttached = "true";
    document.addEventListener("click", (event) => {
        if (!event.target.closest("#classroomFlashcardsJump")) {
            closeClassroomFlashcardsJumpDropdown();
        }

        if (!event.target.closest("#classroomTextFlashcardsJump")) {
            closeClassroomTextFlashcardsJumpDropdown();
        }
    });
}

function initClassroomFlashcardsJumpControls() {
    initClassroomFlashcardJumpPicker({
        inputId: "classroomFlashcardsJumpInput",
        listId: "classroomFlashcardsJumpList",
        stateKey: "classroomFlashcardsJump",
        isImageMode: true,
        getJumpIndex: () => classroomFlashcardsJumpIndex,
        onJump: jumpClassroomFlashcardsToOriginalIndex
    });
}

function initClassroomTextFlashcardsJumpControls() {
    initClassroomFlashcardJumpPicker({
        inputId: "classroomTextFlashcardsJumpInput",
        listId: "classroomTextFlashcardsJumpList",
        stateKey: "classroomTextFlashcardsJump",
        isImageMode: false,
        getJumpIndex: () => classroomTextFlashcardsJumpIndex,
        onJump: jumpClassroomTextFlashcardsToOriginalIndex
    });
}

function updateClassroomFlashcardsShuffleButton() {
    const shuffleButton = document.getElementById("classroomFlashcardsShuffleButton");

    if (!shuffleButton) {
        return;
    }

    shuffleButton.setAttribute("aria-pressed", classroomFlashcardsShuffleEnabled ? "true" : "false");
    shuffleButton.classList.toggle("classroom-shuffle-button-active", classroomFlashcardsShuffleEnabled);
    shuffleButton.classList.toggle("wf-toggle-button--active", classroomFlashcardsShuffleEnabled);
}

function updateClassroomTextFlashcardsShuffleButton() {
    const shuffleButton = document.getElementById("classroomTextFlashcardsShuffleButton");

    if (!shuffleButton) {
        return;
    }

    shuffleButton.setAttribute("aria-pressed", classroomTextFlashcardsShuffleEnabled ? "true" : "false");
    shuffleButton.classList.toggle("classroom-shuffle-button-active", classroomTextFlashcardsShuffleEnabled);
    shuffleButton.classList.toggle("wf-toggle-button--active", classroomTextFlashcardsShuffleEnabled);
}

function updateClassroomFlashcardsLoopButton() {
    const loopButton = document.getElementById("classroomFlashcardsLoopButton");

    if (!loopButton) {
        return;
    }

    loopButton.setAttribute("aria-pressed", classroomFlashcardsLoopEnabled ? "true" : "false");
    loopButton.classList.toggle("classroom-loop-button-active", classroomFlashcardsLoopEnabled);
    loopButton.classList.toggle("wf-toggle-button--active", classroomFlashcardsLoopEnabled);
}

function updateClassroomTextFlashcardsLoopButton() {
    const loopButton = document.getElementById("classroomTextFlashcardsLoopButton");

    if (!loopButton) {
        return;
    }

    loopButton.setAttribute("aria-pressed", classroomTextFlashcardsLoopEnabled ? "true" : "false");
    loopButton.classList.toggle("classroom-loop-button-active", classroomTextFlashcardsLoopEnabled);
    loopButton.classList.toggle("wf-toggle-button--active", classroomTextFlashcardsLoopEnabled);
}

function toggleClassroomFlashcardsLoop() {
    if (currentScreenId !== "classroomFlashcardsScreen" || classroomFlashcardsCards.length === 0) {
        return;
    }

    classroomFlashcardsLoopEnabled = !classroomFlashcardsLoopEnabled;
    updateClassroomFlashcardsLoopButton();
    updateClassroomFlashcardsNav();
    saveClassroomFlashcardsContext();
}

function toggleClassroomTextFlashcardsLoop() {
    if (currentScreenId !== "classroomTextFlashcardsScreen" || classroomTextFlashcardsCards.length === 0) {
        return;
    }

    classroomTextFlashcardsLoopEnabled = !classroomTextFlashcardsLoopEnabled;
    updateClassroomTextFlashcardsLoopButton();
    updateClassroomTextFlashcardsNav();
    saveClassroomTextFlashcardsContext();
}

function toggleClassroomFlashcardsShuffle() {
    if (currentScreenId !== "classroomFlashcardsScreen" || classroomFlashcardsCards.length === 0) {
        return;
    }

    if (classroomFlashcardsShuffleEnabled) {
        classroomFlashcardsShuffleEnabled = false;
        classroomFlashcardsShuffledOrder = [];
    } else {
        classroomFlashcardsShuffleEnabled = true;
        classroomFlashcardsShuffledOrder = createClassroomShuffledOrder(classroomFlashcardsCards.length);
    }

    classroomFlashcardsIndex = 0;
    classroomFlashcardSide = "front";
    updateClassroomFlashcardsShuffleButton();
    renderClassroomFlashcard();
}

function toggleClassroomTextFlashcardsShuffle() {
    if (currentScreenId !== "classroomTextFlashcardsScreen" || classroomTextFlashcardsCards.length === 0) {
        return;
    }

    if (classroomTextFlashcardsShuffleEnabled) {
        classroomTextFlashcardsShuffleEnabled = false;
        classroomTextFlashcardsShuffledOrder = [];
    } else {
        classroomTextFlashcardsShuffleEnabled = true;
        classroomTextFlashcardsShuffledOrder = createClassroomShuffledOrder(classroomTextFlashcardsCards.length);
    }

    classroomTextFlashcardsIndex = 0;
    classroomTextFlashcardSide = "front";
    updateClassroomTextFlashcardsShuffleButton();
    renderClassroomTextFlashcard();
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
    classroomFlashcardsLoopEnabled = false;
    classroomFlashcardsAutoPronounceEnabled = false;
    rebuildClassroomFlashcardsJumpIndex();
    showClassroomFlashcards(addToHistory);
}

function showClassroomFlashcards(addToHistory = true) {
    displayScreen("classroomFlashcardsScreen", addToHistory);
    updateClassroomFlashcardsShuffleButton();
    updateClassroomFlashcardsLoopButton();
    updateClassroomFlashcardsAutoPronounceButton();
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
    updateClassroomFlashcardsLoopButton();
    updateClassroomFlashcardsPronounceButton();
    updateClassroomFlashcardsAutoPronounceButton();
    saveClassroomFlashcardsContext();
    maybeAutoPronounceClassroomFlashcardsWord();
}

function isClassroomFlashcardEnglishVisible() {
    return classroomFlashcardSide === "back";
}

function updateClassroomFlashcardsAutoPronounceButton() {
    const autoPronounceButton = document.getElementById("classroomFlashcardsAutoPronounceButton");

    if (!autoPronounceButton) {
        return;
    }

    autoPronounceButton.setAttribute(
        "aria-pressed",
        classroomFlashcardsAutoPronounceEnabled ? "true" : "false"
    );
    autoPronounceButton.classList.toggle(
        "classroom-auto-pronounce-button-active",
        classroomFlashcardsAutoPronounceEnabled
    );
    autoPronounceButton.classList.toggle(
        "wf-toggle-button--active",
        classroomFlashcardsAutoPronounceEnabled
    );
}

function toggleClassroomFlashcardsAutoPronounce() {
    if (currentScreenId !== "classroomFlashcardsScreen") {
        return;
    }

    classroomFlashcardsAutoPronounceEnabled = !classroomFlashcardsAutoPronounceEnabled;
    updateClassroomFlashcardsAutoPronounceButton();

    if (classroomFlashcardsAutoPronounceEnabled) {
        maybeAutoPronounceClassroomFlashcardsWord();
        return;
    }

    stopClassroomFlashcardsPronunciation();
}

function maybeAutoPronounceClassroomFlashcardsWord() {
    if (
        currentScreenId !== "classroomFlashcardsScreen"
        || !classroomFlashcardsAutoPronounceEnabled
        || !isClassroomFlashcardEnglishVisible()
    ) {
        return;
    }

    const englishWord = getClassroomFlashcardsEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    if (typeof isEnglishPronunciationAvailable === "function" && !isEnglishPronunciationAvailable()) {
        return;
    }

    speakEnglishWord(englishWord, { source: "flashcards", auto: true });
}

function getClassroomFlashcardsEnglishWord() {
    const card = getClassroomFlashcardsCurrentCard();

    return (card?.english || "").trim();
}

function updateClassroomFlashcardsPronounceButton() {
    const pronounceButton = document.getElementById("classroomFlashcardsPronounceButton");

    if (!pronounceButton) {
        return;
    }

    const isAvailable = typeof isEnglishPronunciationAvailable === "function"
        && isEnglishPronunciationAvailable();
    const englishWord = getClassroomFlashcardsEnglishWord();

    pronounceButton.hidden = !isAvailable;
    pronounceButton.disabled = !isAvailable || englishWord === "";
}

function stopClassroomFlashcardsPronunciation() {
    if (typeof stopEnglishPronunciation === "function") {
        stopEnglishPronunciation();
    }
}

function pronounceClassroomFlashcardsWord(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (currentScreenId !== "classroomFlashcardsScreen") {
        return;
    }

    const englishWord = getClassroomFlashcardsEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    speakEnglishWord(englishWord, { source: "flashcards" });
}

function renderClassroomFlashcard(options = {}) {
    stopClassroomFlashcardsPronunciation();

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

    if (classroomFlashcardSide === "back") {
        maybeAutoPronounceClassroomFlashcardsWord();
    } else {
        stopClassroomFlashcardsPronunciation();
    }
}

function updateClassroomFlashcardsNav() {
    const prevButton = document.getElementById("classroomFlashcardsPrevButton");
    const nextButton = document.getElementById("classroomFlashcardsNextButton");
    const isFirst = classroomFlashcardsIndex === 0;
    const isLast = classroomFlashcardsIndex >= classroomFlashcardsCards.length - 1;
    const loopEnabled = classroomFlashcardsLoopEnabled && classroomFlashcardsCards.length > 0;

    prevButton.disabled = loopEnabled ? false : isFirst;
    prevButton.classList.toggle("disabled-button", loopEnabled ? false : isFirst);
    nextButton.textContent = isLast && !classroomFlashcardsLoopEnabled ? "Finish" : "Next →";
}

function classroomFlashcardsPrevious() {
    if (classroomFlashcardsCards.length === 0) {
        return;
    }

    if (classroomFlashcardsIndex <= 0) {
        if (classroomFlashcardsLoopEnabled) {
            classroomFlashcardsIndex = classroomFlashcardsCards.length - 1;
            renderClassroomFlashcard({ animate: true });
        }
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
    if (classroomFlashcardsCards.length === 0) {
        return;
    }

    if (isClassroomFlashcardsOnLastCard()) {
        if (classroomFlashcardsLoopEnabled) {
            classroomFlashcardsIndex = 0;
            renderClassroomFlashcard({ animate: true });
        }
        return;
    }

    classroomFlashcardsIndex += 1;
    renderClassroomFlashcard({ animate: true });
}

function classroomFlashcardsNextButtonClick() {
    if (isClassroomFlashcardsOnLastCard()) {
        if (classroomFlashcardsLoopEnabled) {
            classroomFlashcardsAdvance();
            return;
        }

        finishClassroomFlashcards();
        return;
    }

    classroomFlashcardsAdvance();
}

function finishClassroomFlashcards() {
    stopClassroomFlashcardsPronunciation();
    classroomFlashcardsAutoPronounceEnabled = false;
    exitClassroomFullscreenIfActive();
    closeClassroomFlashcardsJumpDropdown();
    clearClassroomFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenuFromFlashcards() {
    stopClassroomFlashcardsPronunciation();
    classroomFlashcardsAutoPronounceEnabled = false;
    exitClassroomFullscreenIfActive();
    closeClassroomFlashcardsJumpDropdown();
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

    const tag = event.target.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        classroomFlashcardsPrevious();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();

        if (isClassroomFlashcardsOnLastCard() && !classroomFlashcardsLoopEnabled) {
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
    const loopButton = document.getElementById("classroomFlashcardsLoopButton");
    const flashcardButton = document.getElementById("classroomFlashcard");
    const fullscreenButton = document.getElementById("classroomFlashcardsFullscreenButton");
    const backButton = document.getElementById("classroomFlashcardsBackButton");
    const pronounceButton = document.getElementById("classroomFlashcardsPronounceButton");
    const autoPronounceButton = document.getElementById("classroomFlashcardsAutoPronounceButton");

    if (autoPronounceButton && autoPronounceButton.dataset.handlerAttached !== "true") {
        autoPronounceButton.dataset.handlerAttached = "true";
        autoPronounceButton.addEventListener("click", toggleClassroomFlashcardsAutoPronounce);
    }

    if (pronounceButton && pronounceButton.dataset.handlerAttached !== "true") {
        pronounceButton.dataset.handlerAttached = "true";
        pronounceButton.addEventListener("click", pronounceClassroomFlashcardsWord);
    }

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

    if (loopButton && loopButton.dataset.handlerAttached !== "true") {
        loopButton.dataset.handlerAttached = "true";
        loopButton.addEventListener("click", toggleClassroomFlashcardsLoop);
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
    classroomTextFlashcardsLoopEnabled = false;
    rebuildClassroomTextFlashcardsJumpIndex();
    showClassroomTextFlashcards(addToHistory);
}

function showClassroomTextFlashcards(addToHistory = true) {
    displayScreen("classroomTextFlashcardsScreen", addToHistory);
    updateClassroomTextFlashcardDirectionButtonLabel();
    updateClassroomTextFlashcardsShuffleButton();
    updateClassroomTextFlashcardsLoopButton();
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
    updateClassroomTextFlashcardsLoopButton();
    updateClassroomTextFlashcardsPronounceButton();
    saveClassroomTextFlashcardsContext();
}

function getClassroomTextFlashcardsEnglishWord() {
    const card = getClassroomTextFlashcardsCurrentCard();

    return (card?.english || "").trim();
}

function isClassroomTextFlashcardEnglishOnFront() {
    return classroomTextFlashcardDirection === "englishToTranslation";
}

function updateClassroomTextFlashcardsPronounceButton() {
    const frontButton = document.getElementById("classroomTextFlashcardsPronounceButtonFront");
    const backButton = document.getElementById("classroomTextFlashcardsPronounceButtonBack");
    const isAvailable = typeof isEnglishPronunciationAvailable === "function"
        && isEnglishPronunciationAvailable();
    const englishWord = getClassroomTextFlashcardsEnglishWord();
    const englishOnFront = isClassroomTextFlashcardEnglishOnFront();
    const isDisabled = !isAvailable || englishWord === "";

    if (frontButton) {
        frontButton.hidden = !isAvailable || !englishOnFront;
        frontButton.disabled = isDisabled;
    }

    if (backButton) {
        backButton.hidden = !isAvailable || englishOnFront;
        backButton.disabled = isDisabled;
    }
}

function stopClassroomTextFlashcardsPronunciation() {
    if (typeof stopEnglishPronunciation === "function") {
        stopEnglishPronunciation();
    }
}

function pronounceClassroomTextFlashcardsWord(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (currentScreenId !== "classroomTextFlashcardsScreen") {
        return;
    }

    const englishWord = getClassroomTextFlashcardsEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    speakEnglishWord(englishWord, { source: "text-flashcards" });
}

function renderClassroomTextFlashcard(options = {}) {
    stopClassroomTextFlashcardsPronunciation();

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
    const isLast = classroomTextFlashcardsIndex >= classroomTextFlashcardsCards.length - 1;
    const loopEnabled = classroomTextFlashcardsLoopEnabled && classroomTextFlashcardsCards.length > 0;

    prevButton.disabled = loopEnabled ? false : isFirst;
    prevButton.classList.toggle("disabled-button", loopEnabled ? false : isFirst);
    nextButton.textContent = isLast && !classroomTextFlashcardsLoopEnabled ? "Finish" : "Next →";
}

function classroomTextFlashcardsPrevious() {
    if (classroomTextFlashcardsCards.length === 0) {
        return;
    }

    if (classroomTextFlashcardsIndex <= 0) {
        if (classroomTextFlashcardsLoopEnabled) {
            classroomTextFlashcardsIndex = classroomTextFlashcardsCards.length - 1;
            renderClassroomTextFlashcard({ animate: true });
        }
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
    if (classroomTextFlashcardsCards.length === 0) {
        return;
    }

    if (isClassroomTextFlashcardsOnLastCard()) {
        if (classroomTextFlashcardsLoopEnabled) {
            classroomTextFlashcardsIndex = 0;
            renderClassroomTextFlashcard({ animate: true });
        }
        return;
    }

    classroomTextFlashcardsIndex += 1;
    renderClassroomTextFlashcard({ animate: true });
}

function classroomTextFlashcardsNextButtonClick() {
    if (isClassroomTextFlashcardsOnLastCard()) {
        if (classroomTextFlashcardsLoopEnabled) {
            classroomTextFlashcardsAdvance();
            return;
        }

        finishClassroomTextFlashcards();
        return;
    }

    classroomTextFlashcardsAdvance();
}

function finishClassroomTextFlashcards() {
    stopClassroomTextFlashcardsPronunciation();
    exitClassroomFullscreenIfActive();
    closeClassroomTextFlashcardsJumpDropdown();
    clearClassroomTextFlashcardsContext();
    showClassroomActivityMenuForSelectedSet();
}

function returnToClassroomActivityMenuFromTextFlashcards() {
    stopClassroomTextFlashcardsPronunciation();
    exitClassroomFullscreenIfActive();
    closeClassroomTextFlashcardsJumpDropdown();
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

    const tag = event.target.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        classroomTextFlashcardsPrevious();
        return;
    }

    if (event.key === "ArrowRight") {
        event.preventDefault();

        if (isClassroomTextFlashcardsOnLastCard() && !classroomTextFlashcardsLoopEnabled) {
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
    const loopButton = document.getElementById("classroomTextFlashcardsLoopButton");
    const flashcardButton = document.getElementById("classroomTextFlashcard");
    const directionButton = document.getElementById("classroomTextFlashcardDirectionButton");
    const fullscreenButton = document.getElementById("classroomTextFlashcardsFullscreenButton");
    const backButton = document.getElementById("classroomTextFlashcardsBackButton");
    const pronounceButtons = document.querySelectorAll(".classroom-text-flashcards-pronounce-button");

    pronounceButtons.forEach((pronounceButton) => {
        if (pronounceButton.dataset.handlerAttached !== "true") {
            pronounceButton.dataset.handlerAttached = "true";
            pronounceButton.addEventListener("click", pronounceClassroomTextFlashcardsWord);
        }
    });

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

    if (loopButton && loopButton.dataset.handlerAttached !== "true") {
        loopButton.dataset.handlerAttached = "true";
        loopButton.addEventListener("click", toggleClassroomTextFlashcardsLoop);
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
const CLASSROOM_VOCABULARY_BOARD_PRONOUNCE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/></svg>`;

function buildClassroomVocabularyBoardPronounceButtonHtml(cardIndex) {
    return `
        <button
            type="button"
            class="classroom-vocabulary-board-pronounce-button wf-icon-button"
            data-vocabulary-board-card-index="${cardIndex}"
            aria-label="Pronounce word"
            title="Pronounce"
            hidden
        >
            ${CLASSROOM_VOCABULARY_BOARD_PRONOUNCE_SVG}
        </button>
    `;
}

function getClassroomVocabularyBoardEnglishWord(cardIndex) {
    const card = classroomVocabularyBoardCards[cardIndex];

    return (card?.english || "").trim();
}

function updateClassroomVocabularyBoardPronounceButtons() {
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (!grid) {
        return;
    }

    const isAvailable = typeof isEnglishPronunciationAvailable === "function"
        && isEnglishPronunciationAvailable();

    grid.querySelectorAll(".classroom-vocabulary-board-pronounce-button").forEach((button) => {
        const cardIndex = Number.parseInt(button.dataset.vocabularyBoardCardIndex, 10);
        const englishWord = Number.isInteger(cardIndex)
            ? getClassroomVocabularyBoardEnglishWord(cardIndex)
            : "";

        button.hidden = !isAvailable;
        button.disabled = !isAvailable || englishWord === "";
    });
}

function stopClassroomVocabularyBoardPronunciation() {
    if (typeof stopEnglishPronunciation === "function") {
        stopEnglishPronunciation();
    }
}

function pronounceClassroomVocabularyBoardWord(button) {
    if (currentScreenId !== "classroomVocabularyBoardScreen" || !button) {
        return;
    }

    const cardIndex = Number.parseInt(button.dataset.vocabularyBoardCardIndex, 10);

    if (!Number.isInteger(cardIndex)) {
        return;
    }

    const englishWord = getClassroomVocabularyBoardEnglishWord(cardIndex);

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    speakEnglishWord(englishWord, { source: "vocabulary-board" });
}

function handleClassroomVocabularyBoardGridClick(event) {
    const button = event.target.closest(".classroom-vocabulary-board-pronounce-button");

    if (!button) {
        return;
    }

    event.stopPropagation();
    event.preventDefault();
    pronounceClassroomVocabularyBoardWord(button);
}

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

function buildClassroomVocabularyBoardPictureEnglishCardHtml(card, cardIndex) {
    return `
        <article class="classroom-vocabulary-board-card">
            <div class="classroom-vocabulary-board-card-media">
                <img class="classroom-vocabulary-board-card-image" loading="lazy" decoding="async" alt="">
                <div class="classroom-image-placeholder classroom-vocabulary-board-card-placeholder" aria-hidden="true">
                    ${CLASSROOM_VOCABULARY_BOARD_PLACEHOLDER_SVG}
                    <p class="classroom-image-placeholder-label">No image</p>
                </div>
                <p class="classroom-vocabulary-board-card-label">${escapeHTML(card.english)}</p>
                ${buildClassroomVocabularyBoardPronounceButtonHtml(cardIndex)}
            </div>
        </article>
    `;
}

function buildClassroomVocabularyBoardEnglishThaiCardHtml(card, cardIndex) {
    const translation = getClassroomCardTranslation(card) || "—";

    return `
        <article class="classroom-vocabulary-board-card">
            <div class="classroom-vocabulary-board-card-media classroom-vocabulary-board-card-text">
                ${buildClassroomVocabularyBoardPronounceButtonHtml(cardIndex)}
                <p class="classroom-vocabulary-board-card-english">${escapeHTML(card.english)}</p>
                <p class="classroom-vocabulary-board-card-translation">${escapeHTML(translation)}</p>
            </div>
        </article>
    `;
}

function buildClassroomVocabularyBoardPictureEnglishGridHtml(cards) {
    return cards.map((card, index) => buildClassroomVocabularyBoardPictureEnglishCardHtml(card, index)).join("");
}

function buildClassroomVocabularyBoardEnglishThaiGridHtml(cards) {
    return cards.map((card, index) => buildClassroomVocabularyBoardEnglishThaiCardHtml(card, index)).join("");
}

function getClassroomVocabularyBoardGridSignature() {
    return `${classroomSelectedSetId}:${classroomVocabularyBoardCards.length}:${classroomVocabularyBoardMode}`;
}

function applyClassroomVocabularyBoardGridContent() {
    stopClassroomVocabularyBoardPronunciation();

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

    updateClassroomVocabularyBoardPronounceButtons();
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

    stopClassroomVocabularyBoardPronunciation();
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
    stopClassroomVocabularyBoardPronunciation();
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
    const grid = document.getElementById("classroomVocabularyBoardGrid");

    if (grid && grid.dataset.pronounceHandlerAttached !== "true") {
        grid.dataset.pronounceHandlerAttached = "true";
        grid.addEventListener("click", handleClassroomVocabularyBoardGridClick);
    }

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
            if (classroomPresentationLoopEnabled) {
                classroomPresentationAdvance();
                return;
            }

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
    const loopButton = document.getElementById("classroomPresentationLoopButton");
    const shuffleButton = document.getElementById("classroomPresentationShuffleButton");
    const pronounceButton = document.getElementById("classroomPresentationPronounceButton");
    const autoPronounceButton = document.getElementById("classroomPresentationAutoPronounceButton");

    if (autoPronounceButton && autoPronounceButton.dataset.handlerAttached !== "true") {
        autoPronounceButton.dataset.handlerAttached = "true";
        autoPronounceButton.addEventListener("click", toggleClassroomPresentationAutoPronounce);
    }

    if (pronounceButton && pronounceButton.dataset.handlerAttached !== "true") {
        pronounceButton.dataset.handlerAttached = "true";
        pronounceButton.addEventListener("click", pronounceClassroomPresentationWord);
    }

    if (loopButton && loopButton.dataset.handlerAttached !== "true") {
        loopButton.dataset.handlerAttached = "true";
        loopButton.addEventListener("click", toggleClassroomPresentationLoop);
    }

    if (shuffleButton && shuffleButton.dataset.handlerAttached !== "true") {
        shuffleButton.dataset.handlerAttached = "true";
        shuffleButton.addEventListener("click", toggleClassroomPresentationShuffle);
    }

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
        draggable: ".set-card-shell",
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

function getPronunciationLocaleSetting() {
    const raw = localStorage.getItem(SETTINGS_KEYS.pronunciationLocale);

    return raw === "en-GB" ? "en-GB" : SETTINGS_DEFAULTS.pronunciationLocale;
}

function getPronunciationRateSetting() {
    const raw = localStorage.getItem(SETTINGS_KEYS.pronunciationRate);

    if (raw === "slow" || raw === "fast") {
        return raw;
    }

    return SETTINGS_DEFAULTS.pronunciationRate;
}

function syncSettingsModalControls() {
    const trashValue = getTrashAutoDeleteSetting();
    const trashRadio = document.querySelector(`input[name="settingsTrashAutoDelete"][value="${trashValue}"]`);

    if (trashRadio) {
        trashRadio.checked = true;
    }

    document.getElementById("settingsEnableAnimations").checked = isTeacherAnimationsEnabled();
    document.getElementById("settingsCelebrationPerfect").checked = isTeacherCelebrationPerfectEnabled();
    document.getElementById("settingsPronunciationLocale").value = getPronunciationLocaleSetting();
    document.getElementById("settingsPronunciationRate").value = getPronunciationRateSetting();
    document.getElementById("settingsAutoPronounce").checked = isGlobalAutoPronounceEnabled();
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

function onSettingsPronunciationLocaleChange(value) {
    const locale = value === "en-GB" ? "en-GB" : SETTINGS_DEFAULTS.pronunciationLocale;
    localStorage.setItem(SETTINGS_KEYS.pronunciationLocale, locale);
}

function onSettingsPronunciationRateChange(value) {
    const rate = value === "slow" || value === "fast" ? value : SETTINGS_DEFAULTS.pronunciationRate;
    localStorage.setItem(SETTINGS_KEYS.pronunciationRate, rate);
}

function onSettingsAutoPronounceChange(enabled) {
    localStorage.setItem(SETTINGS_KEYS.autoPronounce, enabled ? "true" : "false");
}


function openGameLibrary(indexOrId) {
    if (dashboardSelectionMode) return;

    const index = resolveSetIndex(indexOrId);
    if (index < 0) return;

    isStudentMode = false;
    studentShareSetId = null;
    selectedPlaySetIndex = index;
    const selectedSet = savedSets[index];
    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);
    displayScreen("gameLibraryScreen");
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
    if (!isStudentMode && selectedPlaySetIndex === null) return;
    if (isStudentMode && !cards.length) return;

    if (selectedPlaySetIndex !== null) {
        const selectedSet = savedSets[selectedPlaySetIndex];
        editingSetId = selectedSet.id;
        currentSetName = selectedSet.name;
        cards = prepareCards(selectedSet.cards || []);
    }

    await startGame(mode);
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
        currentSetAccentColor = DEFAULT_SET_ACCENT_COLOR;
        const newSet = await dbCreateSetWithCards(setName.trim(), cards, currentSetAccentColor);
        editingSetId = newSet.id;
        currentSetName = newSet.name;
        currentSetAccentColor = normalizeSetAccentColor(newSet.accentColor || currentSetAccentColor);
        syncSavedSetAccentColor(newSet.id, currentSetAccentColor);
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
    currentSetAccentColor = normalizeSetAccentColor(selectedSet.accentColor);
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

    if (activeWordCardImageDeleteConfirmIndex !== null) {
        closeWordCardImageDeleteConfirm();
        return;
    }

    if (activeWordCardImagePopoverIndex !== null) {
        closeWordCardImagePopover();
        return;
    }

    const builderColorPopover = document.getElementById("builderHeaderColorPopover");
    if (builderColorPopover && !builderColorPopover.hidden) {
        closeBuilderHeaderColorPopover();
        return;
    }

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

function getBuilderHeaderElement() {
    return document.querySelector("#cardsScreen .editor-toolbar");
}

function openBuilderHeaderColorPopover() {
    closeWordCardImagePopover();

    const popover = document.getElementById("builderHeaderColorPopover");
    const button = document.getElementById("builderHeaderColorButton");

    if (!popover || !button) {
        return;
    }

    popover.hidden = false;
    button.setAttribute("aria-expanded", "true");
}

function closeBuilderHeaderColorPopover() {
    const popover = document.getElementById("builderHeaderColorPopover");
    const button = document.getElementById("builderHeaderColorButton");

    if (!popover || !button) {
        return;
    }

    popover.hidden = true;
    button.setAttribute("aria-expanded", "false");
}

function toggleBuilderHeaderColorPopover(event) {
    if (event) {
        event.stopPropagation();
    }

    const popover = document.getElementById("builderHeaderColorPopover");

    if (!popover) {
        return;
    }

    if (popover.hidden) {
        openBuilderHeaderColorPopover();
    } else {
        closeBuilderHeaderColorPopover();
    }
}

function syncSavedSetAccentColor(setId, accentColor) {
    const setIndex = savedSets.findIndex(set => set.id === setId);

    if (setIndex >= 0) {
        savedSets[setIndex].accentColor = accentColor;
    }
}

function applyBuilderHeaderAccentColor(color) {
    currentSetAccentColor = normalizeSetAccentColor(color);
    const header = getBuilderHeaderElement();

    if (header) {
        header.style.setProperty("--builder-header-accent", getSetAccentHex(currentSetAccentColor));
    }

    document.querySelectorAll("#cardsScreen .builder-header-color-swatch").forEach((swatch) => {
        const isSelected = swatch.dataset.color === currentSetAccentColor;
        swatch.classList.toggle("is-selected", isSelected);
        swatch.setAttribute("aria-checked", isSelected ? "true" : "false");
    });
}

function loadBuilderHeaderAccentFromSet() {
    if (!editingSetId) {
        applyBuilderHeaderAccentColor(DEFAULT_SET_ACCENT_COLOR);
        return;
    }

    const activeSet = savedSets.find(set => set.id === editingSetId);
    applyBuilderHeaderAccentColor(activeSet?.accentColor ?? currentSetAccentColor);
}

function selectBuilderHeaderPreviewColor(colorId, accentValue) {
    applyBuilderHeaderAccentColor(colorId);
    scheduleAutoSave(100);
}

function initBuilderHeaderColorPicker() {
    document.addEventListener("click", (event) => {
        const popover = document.getElementById("builderHeaderColorPopover");

        if (!popover || popover.hidden) {
            return;
        }

        if (!event.target.closest("#cardsScreen .builder-header-color-control")) {
            closeBuilderHeaderColorPopover();
        }
    });
}

const WORD_CARD_IMAGE_PLUS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`;
const WORD_CARD_IMAGE_TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>`;
const WORD_CARD_IMAGE_POPOVER_GAP = 8;
const WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING = 12;

let wordCardImagePopoverRepositionHandler = null;
let wordCardImageDeleteConfirmRepositionHandler = null;

function unbindWordCardImagePopoverReposition() {
    if (!wordCardImagePopoverRepositionHandler) {
        return;
    }

    window.removeEventListener("resize", wordCardImagePopoverRepositionHandler);
    window.removeEventListener("scroll", wordCardImagePopoverRepositionHandler, true);
    wordCardImagePopoverRepositionHandler = null;
}

function resetWordCardImagePopoverPosition(popover) {
    if (!popover) {
        return;
    }

    popover.style.top = "";
    popover.style.left = "";
    popover.classList.remove(
        "word-card-image-popover--below",
        "word-card-image-popover--above"
    );
}

function positionWordCardImagePopover(index) {
    const tile = document.getElementById(`wordCardImageTile-${index}`);
    const popover = document.getElementById(`wordCardImagePopover-${index}`);

    if (!tile || !popover) {
        return;
    }

    resetWordCardImagePopoverPosition(popover);

    popover.hidden = false;
    popover.style.visibility = "hidden";

    const tileRect = tile.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const spaceBelow = window.innerHeight - tileRect.bottom - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING;
    const spaceAbove = tileRect.top - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING;
    const openAbove = spaceBelow < popoverRect.height + WORD_CARD_IMAGE_POPOVER_GAP
        && spaceAbove >= popoverRect.height + WORD_CARD_IMAGE_POPOVER_GAP;

    popover.classList.add(openAbove ? "word-card-image-popover--above" : "word-card-image-popover--below");

    let top = openAbove
        ? tileRect.top - popoverRect.height - WORD_CARD_IMAGE_POPOVER_GAP
        : tileRect.bottom + WORD_CARD_IMAGE_POPOVER_GAP;

    let left = tileRect.right - popoverRect.width;
    const maxLeft = window.innerWidth - popoverRect.width - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING;
    left = Math.max(WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING, Math.min(left, maxLeft));
    top = Math.max(
        WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING,
        Math.min(top, window.innerHeight - popoverRect.height - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING)
    );

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.visibility = "";
}

function bindWordCardImagePopoverReposition(index) {
    unbindWordCardImagePopoverReposition();
    wordCardImagePopoverRepositionHandler = () => positionWordCardImagePopover(index);
    window.addEventListener("resize", wordCardImagePopoverRepositionHandler);
    window.addEventListener("scroll", wordCardImagePopoverRepositionHandler, true);
}

function closeWordCardImagePopover() {
    if (activeWordCardImagePopoverIndex === null) {
        return;
    }

    const popover = document.getElementById(`wordCardImagePopover-${activeWordCardImagePopoverIndex}`);
    const tile = document.getElementById(`wordCardImageTile-${activeWordCardImagePopoverIndex}`);

    unbindWordCardImagePopoverReposition();

    if (popover) {
        resetWordCardImagePopoverPosition(popover);
        popover.hidden = true;
    }

    if (tile) {
        tile.setAttribute("aria-expanded", "false");
    }

    activeWordCardImagePopoverIndex = null;
}

function openWordCardImagePopover(index) {
    closeWordCardImagePopover();
    closeBuilderHeaderColorPopover();

    const popover = document.getElementById(`wordCardImagePopover-${index}`);
    const tile = document.getElementById(`wordCardImageTile-${index}`);

    if (!popover || !tile) {
        return;
    }

    tile.setAttribute("aria-expanded", "true");
    activeWordCardImagePopoverIndex = index;
    positionWordCardImagePopover(index);
    bindWordCardImagePopoverReposition(index);
}

function toggleWordCardImagePopover(event, index) {
    if (event) {
        event.stopPropagation();
    }

    if (activeWordCardImagePopoverIndex === index) {
        closeWordCardImagePopover();
        return;
    }

    openWordCardImagePopover(index);
}

function unbindWordCardImageDeleteConfirmReposition() {
    if (!wordCardImageDeleteConfirmRepositionHandler) {
        return;
    }

    window.removeEventListener("resize", wordCardImageDeleteConfirmRepositionHandler);
    window.removeEventListener("scroll", wordCardImageDeleteConfirmRepositionHandler, true);
    wordCardImageDeleteConfirmRepositionHandler = null;
}

function resetWordCardImageDeleteConfirmPosition(confirm) {
    if (!confirm) {
        return;
    }

    confirm.style.top = "";
    confirm.style.left = "";
}

function positionWordCardImageDeleteConfirm(index) {
    const tile = document.getElementById(`wordCardImageTile-${index}`);
    const confirm = document.getElementById(`wordCardImageDeleteConfirm-${index}`);

    if (!tile || !confirm) {
        return;
    }

    resetWordCardImageDeleteConfirmPosition(confirm);

    confirm.hidden = false;
    confirm.style.visibility = "hidden";

    const tileRect = tile.getBoundingClientRect();
    const confirmRect = confirm.getBoundingClientRect();

    let top = tileRect.bottom + WORD_CARD_IMAGE_POPOVER_GAP;
    let left = tileRect.right - confirmRect.width;

    const maxLeft = window.innerWidth - confirmRect.width - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING;
    left = Math.max(WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING, Math.min(left, maxLeft));
    top = Math.max(
        WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING,
        Math.min(top, window.innerHeight - confirmRect.height - WORD_CARD_IMAGE_POPOVER_VIEWPORT_PADDING)
    );

    confirm.style.top = `${top}px`;
    confirm.style.left = `${left}px`;
    confirm.style.visibility = "";
}

function bindWordCardImageDeleteConfirmReposition(index) {
    unbindWordCardImageDeleteConfirmReposition();
    wordCardImageDeleteConfirmRepositionHandler = () => positionWordCardImageDeleteConfirm(index);
    window.addEventListener("resize", wordCardImageDeleteConfirmRepositionHandler);
    window.addEventListener("scroll", wordCardImageDeleteConfirmRepositionHandler, true);
}

function closeWordCardImageDeleteConfirm() {
    if (activeWordCardImageDeleteConfirmIndex === null) {
        return;
    }

    const confirm = document.getElementById(`wordCardImageDeleteConfirm-${activeWordCardImageDeleteConfirmIndex}`);

    unbindWordCardImageDeleteConfirmReposition();

    if (confirm) {
        resetWordCardImageDeleteConfirmPosition(confirm);
        confirm.hidden = true;
    }

    activeWordCardImageDeleteConfirmIndex = null;
}

function openWordCardImageDeleteConfirm(index) {
    closeWordCardImageDeleteConfirm();
    closeWordCardImagePopover();

    const cardIndex = normalizeCardIndex(index);

    if (cardIndex === null) {
        return;
    }

    const confirm = document.getElementById(`wordCardImageDeleteConfirm-${cardIndex}`);

    if (!confirm) {
        return;
    }

    activeWordCardImageDeleteConfirmIndex = cardIndex;
    positionWordCardImageDeleteConfirm(cardIndex);
    bindWordCardImageDeleteConfirmReposition(cardIndex);
}

function handleWordCardImageDeleteClick(event, index) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    openWordCardImageDeleteConfirm(index);
}

function confirmWordCardImageDelete(index) {
    const cardIndex = normalizeCardIndex(index);

    if (cardIndex === null) {
        return;
    }

    closeWordCardImageDeleteConfirm();
    updateCardField(cardIndex, "imageUrl", "");
    renderCards();
}

function triggerWordCardImageUpload(index) {
    const uploadIndex = normalizeCardIndex(activeWordCardImagePopoverIndex)
        ?? normalizeCardIndex(index);

    if (uploadIndex === null) {
        showToast("Could not upload image: card was not found", "error");
        closeWordCardImagePopover();
        return;
    }

    closeWordCardImagePopover();

    const fileInput = document.getElementById(`wordCardImageFile-${uploadIndex}`);

    if (!fileInput) {
        showToast("Could not upload image: card was not found", "error");
        return;
    }

    fileInput.value = "";
    fileInput.click();
}

function buildWordCardImageSectionMarkup(index, imageUrl) {
    const normalizedImageUrl = imageUrl || "";
    const hasDisplayImage = normalizedImageUrl && normalizedImageUrl !== "Uploading...";
    const isUploading = normalizedImageUrl === "Uploading...";

    const tileContent = hasDisplayImage
        ? `<img class="word-card-image-tile__img" src="${escapeAttribute(normalizedImageUrl)}" alt="">`
        : `<span class="word-card-image-tile__empty">
                                <span class="word-card-image-tile__placeholder">${WORD_CARD_IMAGE_PLUS_ICON}</span>
                                <span class="word-card-image-tile__helper">Drop, Paste or Upload</span>
                            </span>`;

    const uploadingMarkup = isUploading
        ? `<span class="word-card-image-tile__uploading">Uploading...</span>`
        : "";

    const deleteButtonMarkup = hasDisplayImage
        ? `<button
                                type="button"
                                class="word-card-image-tile-delete"
                                aria-label="Delete image"
                                onclick="handleWordCardImageDeleteClick(event, ${index})"
                            >${WORD_CARD_IMAGE_TRASH_ICON}</button>`
        : "";

    const deleteConfirmMarkup = hasDisplayImage
        ? `<div
                                id="wordCardImageDeleteConfirm-${index}"
                                class="word-card-image-delete-confirm"
                                role="dialog"
                                aria-label="Delete image confirmation"
                                hidden
                            >
                                <p class="word-card-image-delete-confirm__message">Delete image?</p>
                                <div class="word-card-image-delete-confirm__actions">
                                    <button type="button" class="word-card-image-delete-confirm__cancel" onclick="closeWordCardImageDeleteConfirm()">Cancel</button>
                                    <button type="button" class="word-card-image-delete-confirm__confirm wf-cta-danger" onclick="confirmWordCardImageDelete(${index})">Delete</button>
                                </div>
                            </div>`
        : "";

    return `
                    <div class="word-card-image-section">
                        <strong class="word-card-image-label">Picture clue</strong>
                        <div class="word-card-image-control${hasDisplayImage ? " word-card-image-control--has-image" : ""}">
                            <button
                                type="button"
                                id="wordCardImageTile-${index}"
                                class="word-card-image-tile"
                                aria-label="Picture clue image options"
                                aria-haspopup="dialog"
                                aria-expanded="false"
                                aria-controls="wordCardImagePopover-${index}"
                                onclick="toggleWordCardImagePopover(event, ${index})"
                            >
                                ${tileContent}
                                ${uploadingMarkup}
                                <span class="word-card-image-tile__drop-hint" aria-hidden="true">Drop image here</span>
                            </button>
                            ${deleteButtonMarkup}
                            ${deleteConfirmMarkup}
                            <div
                                id="wordCardImagePopover-${index}"
                                class="word-card-image-popover"
                                role="dialog"
                                aria-label="Picture clue options"
                                hidden
                            >
                                <button
                                    type="button"
                                    class="word-card-image-popover-action"
                                    onclick="triggerWordCardImageUpload(${index})"
                                >
                                    Upload image
                                </button>
                                <button
                                    type="button"
                                    class="word-card-image-popover-action"
                                    disabled
                                >
                                    Generate image — Coming soon
                                </button>
                            </div>
                            <input
                                type="hidden"
                                class="word-card-image-url"
                                value="${escapeAttribute(normalizedImageUrl)}"
                                oninput="updateCardField(${index}, 'imageUrl', this.value)"
                            >
                            <input
                                type="file"
                                id="wordCardImageFile-${index}"
                                class="word-card-image-file"
                                accept="image/*"
                                hidden
                                tabindex="-1"
                                onchange="uploadImage(event, ${index})"
                            >
                        </div>
                    </div>`;
}

function initWordCardImagePopover() {
    document.addEventListener("click", (event) => {
        if (activeWordCardImageDeleteConfirmIndex !== null) {
            if (!event.target.closest(".word-card-image-delete-confirm")
                && !event.target.closest(".word-card-image-tile-delete")) {
                closeWordCardImageDeleteConfirm();
            }

            return;
        }

        if (activeWordCardImagePopoverIndex === null) {
            return;
        }

        if (!event.target.closest("#cardsList .word-card-image-control")) {
            closeWordCardImagePopover();
        }
    });

    document.addEventListener("paste", handleWordCardImagePaste);
}

const WORD_CARD_IMAGE_DROP_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]);

let activeWordCardImageDropTile = null;

function isExternalFileDrag(dataTransfer) {
    if (!dataTransfer?.types) {
        return false;
    }

    return Array.from(dataTransfer.types).includes("Files");
}

function dataTransferHasAllowedWordCardImage(dataTransfer) {
    if (!dataTransfer?.items?.length) {
        return false;
    }

    for (const item of dataTransfer.items) {
        if (item.kind === "file" && WORD_CARD_IMAGE_DROP_MIME_TYPES.has(item.type)) {
            return true;
        }
    }

    return false;
}

function getWordCardImageDropFile(dataTransfer) {
    if (!dataTransfer?.items?.length) {
        return null;
    }

    for (const item of dataTransfer.items) {
        if (item.kind !== "file" || !WORD_CARD_IMAGE_DROP_MIME_TYPES.has(item.type)) {
            continue;
        }

        const file = item.getAsFile();

        if (file) {
            return file;
        }
    }

    return null;
}

function parseWordCardImageTileIndex(tile) {
    if (!tile?.id?.startsWith("wordCardImageTile-")) {
        return null;
    }

    return normalizeCardIndex(tile.id.slice("wordCardImageTile-".length));
}

function clearWordCardImageTileDropHighlight() {
    if (!activeWordCardImageDropTile) {
        return;
    }

    activeWordCardImageDropTile.classList.remove("word-card-image-tile--drop-target");
    activeWordCardImageDropTile = null;
}

function setWordCardImageTileDropHighlight(tile) {
    if (activeWordCardImageDropTile === tile) {
        return;
    }

    clearWordCardImageTileDropHighlight();
    tile.classList.add("word-card-image-tile--drop-target");
    activeWordCardImageDropTile = tile;
}

function handleWordCardImageTileDragEnter(event) {
    if (!isExternalFileDrag(event.dataTransfer) || !dataTransferHasAllowedWordCardImage(event.dataTransfer)) {
        return;
    }

    const tile = event.target.closest("#cardsList .word-card-image-tile");

    if (!tile) {
        return;
    }

    event.preventDefault();
    setWordCardImageTileDropHighlight(tile);
}

function handleWordCardImageTileDragOver(event) {
    if (!isExternalFileDrag(event.dataTransfer) || !dataTransferHasAllowedWordCardImage(event.dataTransfer)) {
        return;
    }

    const tile = event.target.closest("#cardsList .word-card-image-tile");

    if (!tile) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setWordCardImageTileDropHighlight(tile);
}

function handleWordCardImageTileDragLeave(event) {
    const tile = event.target.closest("#cardsList .word-card-image-tile");

    if (!tile || tile !== activeWordCardImageDropTile) {
        return;
    }

    const relatedTarget = event.relatedTarget;

    if (relatedTarget && tile.contains(relatedTarget)) {
        return;
    }

    clearWordCardImageTileDropHighlight();
}

function handleWordCardImageTileDrop(event) {
    clearWordCardImageTileDropHighlight();

    if (!isExternalFileDrag(event.dataTransfer)) {
        return;
    }

    const tile = event.target.closest("#cardsList .word-card-image-tile");

    if (!tile) {
        return;
    }

    const file = getWordCardImageDropFile(event.dataTransfer);

    if (!file) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const index = parseWordCardImageTileIndex(tile);

    if (index === null) {
        return;
    }

    closeWordCardImagePopover();
    closeWordCardImageDeleteConfirm();
    uploadCardImageFile(index, file);
}

function initWordCardImageTileDrop() {
    const cardsList = document.getElementById("cardsList");

    if (!cardsList || cardsList.dataset.wordCardImageDropBound === "true") {
        return;
    }

    cardsList.dataset.wordCardImageDropBound = "true";
    cardsList.addEventListener("dragenter", handleWordCardImageTileDragEnter);
    cardsList.addEventListener("dragover", handleWordCardImageTileDragOver);
    cardsList.addEventListener("dragleave", handleWordCardImageTileDragLeave);
    cardsList.addEventListener("drop", handleWordCardImageTileDrop);
    document.addEventListener("dragend", clearWordCardImageTileDropHighlight);
}

function isWordCardImagePasteBlockedByFocus() {
    const activeElement = document.activeElement;

    if (!activeElement) {
        return false;
    }

    if (activeElement.closest("#cardsList .word-fields")) {
        return true;
    }

    if (activeElement.id === "builderSetName") {
        return true;
    }

    if (activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable) {
        return true;
    }

    return false;
}

function getClipboardImageFile(dataTransfer) {
    if (!dataTransfer?.items) {
        return null;
    }

    for (const item of dataTransfer.items) {
        if (item.kind !== "file" || !WORD_CARD_IMAGE_DROP_MIME_TYPES.has(item.type)) {
            continue;
        }

        const file = item.getAsFile();

        if (!file) {
            continue;
        }

        const extensionByType = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp",
            "image/gif": "gif"
        };
        const extension = extensionByType[item.type] || "png";
        const fileName = file.name && file.name.includes(".") ? file.name : `pasted-image.${extension}`;

        return new File([file], fileName, { type: item.type });
    }

    return null;
}

function handleWordCardImagePaste(event) {
    if (currentScreenId !== "cardsScreen") {
        return;
    }

    if (activeWordCardImagePopoverIndex === null) {
        return;
    }

    const index = activeWordCardImagePopoverIndex;

    if (!isValidCardIndex(index)) {
        return;
    }

    if (isWordCardImagePasteBlockedByFocus()) {
        return;
    }

    const clipboardFile = getClipboardImageFile(event.clipboardData);

    if (!clipboardFile) {
        return;
    }

    event.preventDefault();
    closeWordCardImagePopover();
    uploadCardImageFile(index, clipboardFile);
}

function normalizeCardIndex(index) {
    if (index === null || index === undefined || index === "") {
        return null;
    }

    const numericIndex = typeof index === "number"
        ? index
        : Number.parseInt(String(index), 10);

    if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= cards.length) {
        return null;
    }

    if (cards[numericIndex] == null) {
        return null;
    }

    return numericIndex;
}

function isValidCardIndex(index) {
    return normalizeCardIndex(index) !== null;
}

function parseWordCardImageFileInputIndex(fileInput) {
    if (!fileInput?.id?.startsWith("wordCardImageFile-")) {
        return null;
    }

    return normalizeCardIndex(fileInput.id.slice("wordCardImageFile-".length));
}

function resolveWordCardImageUploadIndex(index, fileInput) {
    const fromFileInput = parseWordCardImageFileInputIndex(fileInput);

    if (fromFileInput !== null) {
        return fromFileInput;
    }

    const fromPopover = normalizeCardIndex(activeWordCardImagePopoverIndex);

    if (fromPopover !== null) {
        return fromPopover;
    }

    return normalizeCardIndex(index);
}

function resolveWordCardImageUploadIndexAfterAsync(originalIndex, cardId) {
    const normalizedOriginal = normalizeCardIndex(originalIndex);

    if (normalizedOriginal !== null) {
        return normalizedOriginal;
    }

    if (cardId) {
        const indexById = cards.findIndex((card) => card.id === cardId);

        return normalizeCardIndex(indexById);
    }

    return null;
}

function showCardsScreen(addToHistory = true) {
    isGameRunning = false;
    displayScreen("cardsScreen", addToHistory);
    closeBuilderHeaderColorPopover();
    closeWordCardImagePopover();
    closeWordCardImageDeleteConfirm();
    document.getElementById("builderSetName").value = currentSetName || "";
    loadBuilderHeaderAccentFromSet();
    setSaveStatus("Saved", "saved");
    saveBuilderContext();

    renderCards();
}

function renderCards() {
    let cardsList = document.getElementById("cardsList");
    unbindWordCardImagePopoverReposition();
    unbindWordCardImageDeleteConfirmReposition();
    clearWordCardImageTileDropHighlight();
    cardsList.innerHTML = "";
    activeWordCardImagePopoverIndex = null;
    activeWordCardImageDeleteConfirmIndex = null;

    if (cards.length === 0) {
        cardsList.innerHTML = `
            <div class="card empty-library-card">
                <h2>No cards yet</h2>
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
                    <div class="card-number">Card ${i + 1}</div>

                    <div class="drag-handle">
                        ↕ Drag
                    </div>

                    <button class="red-button wf-cta-danger" onclick="deleteWord(${i})">Delete</button>
                </div>

                <div class="word-card-body">
                    <div class="word-fields">
                        <div class="field-group">
                            <label>English word</label>
                            <input 
                                value="${escapeAttribute(cards[i].english)}" 
                                oninput="updateCardField(${i}, 'english', this.value)"
                                placeholder="English word"
                            >
                        </div>

                        <div class="field-group">
                            <label>Thai translation</label>
                            <input 
                                value="${escapeAttribute(cards[i].thai)}" 
                                oninput="updateCardField(${i}, 'thai', this.value)"
                                placeholder="Thai translation"
                            >
                        </div>
                    </div>

                    ${buildWordCardImageSectionMarkup(i, cards[i].imageUrl)}
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
    showToast("AI image generation is coming soon!", "info");
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

async function uploadCardImageFile(index, file) {
    const uploadIndex = normalizeCardIndex(index);

    if (uploadIndex === null) {
        showToast("Could not upload image: card was not found", "error");
        return;
    }

    if (!file) {
        return;
    }

    const cardId = cards[uploadIndex].id;

    try {
        cards[uploadIndex].imageUrl = "Uploading...";
        renderCards();
        setSaveStatus("Uploading image...", "saving");

        const imageUrl = await dbUploadImage(file);

        const targetIndex = resolveWordCardImageUploadIndexAfterAsync(uploadIndex, cardId);

        if (targetIndex === null) {
            showToast("Could not upload image: card was not found", "error");
            return;
        }

        cards[targetIndex].imageUrl = imageUrl;
        renderCards();
        scheduleAutoSave(100);
        showToast("Image uploaded", "success");
    } catch (error) {
        showToast("Could not upload image: " + error.message, "error");

        const targetIndex = resolveWordCardImageUploadIndexAfterAsync(uploadIndex, cardId);

        if (targetIndex !== null) {
            cards[targetIndex].imageUrl = "";
            renderCards();
        }
    }
}

async function uploadImage(event, index) {
    const fileInput = event.target;
    const file = fileInput?.files?.[0];
    const uploadIndex = resolveWordCardImageUploadIndex(index, fileInput);

    await uploadCardImageFile(uploadIndex, file);
}

async function translateAllToThai() {
    setSaveStatus("Translating...", "saving");

    for (let i = 0; i < cards.length; i++) {
        if (cards[i].thai.trim() === "" && cards[i].english.trim() !== "") {
            cards[i].thai = await translateWordToThai(cards[i].english);
        }
    }

    renderCards();
    scheduleAutoSave(100);
    showToast("Translations added", "success");
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
    setSaveStatus("Saving...", "saving");

    autoSaveTimer = setTimeout(() => {
        autoSaveNow();
    }, delay);
}

async function autoSaveNow() {
    if (isStudentMode || !editingSetId || autoSaveInProgress) return;

    let setName = document.getElementById("builderSetName")?.value || currentSetName;

    if (setName.trim() === "") {
        setSaveStatus("Add set name", "warning");
        return;
    }

    const cleaned = cleanCardsForSaving();

    if (cleaned.length === 0) {
        setSaveStatus("Add a word", "warning");
        return;
    }

    autoSaveInProgress = true;

    try {
        const savedSet = await dbSaveSetWithCards(
            editingSetId,
            setName.trim(),
            cleaned,
            currentSetAccentColor
        );
        editingSetId = savedSet.id;
        currentSetName = savedSet.name;
        currentSetAccentColor = normalizeSetAccentColor(savedSet.accentColor || currentSetAccentColor);
        syncSavedSetAccentColor(editingSetId, currentSetAccentColor);
        applyBuilderHeaderAccentColor(currentSetAccentColor);
        setSaveStatus("Saved", "saved");
    } catch (error) {
        setSaveStatus("Not saved", "error");
        showToast("Could not autosave: " + error.message, "error");
    } finally {
        autoSaveInProgress = false;
    }
}

async function backToDashboard() {
    clearTimeout(autoSaveTimer);
    await autoSaveNow();
    clearBuilderContext();
    await showDashboard();
}

async function saveCardsBeforePlay() {
    if (isStudentMode || !editingSetId) return;

    clearTimeout(autoSaveTimer);
    await autoSaveNow();
}

async function startGame(mode, fromSource) {
    if (currentScreenId === "gameLibraryScreen") {
        gameLaunchSource = isStudentMode ? "student" : "library";
    } else if (fromSource) {
        gameLaunchSource = fromSource;
    } else if (currentScreenId === "cardsScreen") {
        gameLaunchSource = "editor";
    }

    currentGameMode = mode;
    document.getElementById("gameScreen").dataset.mode = mode;

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
        document.getElementById("gameTitle").style.display = "";
        document.getElementById("gameTitle").textContent = "Look and Type the English Word";
    } else if (mode === "unscramble") {
        document.getElementById("gameTitle").style.display = "none";
        document.getElementById("gameTitle").textContent = "";
    } else {
        document.getElementById("gameTitle").style.display = "";
        document.getElementById("gameTitle").textContent = "Translate and Type the English Word";
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
    stopGamePronunciation();
    isGameRunning = false;
    clearGameContext();
    returnToPreGameScreen();
}

function navigateAfterGame() {
    if (gameLaunchSource === "student" || isStudentMode) {
        displayScreen("gameLibraryScreen", false);
        return;
    }

    if (gameLaunchSource === "library" || gameLaunchSource === "gameLibrary") {
        displayScreen("gameLibraryScreen", false);
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

function showStudentLoading() {
    document.getElementById("studentScreen").classList.add("student-loading-active");
    document.getElementById("studentLoadingPanel").style.display = "flex";
    document.getElementById("studentUnavailable").style.display = "none";
}

function showStudentUnavailable() {
    document.getElementById("studentScreen").classList.remove("student-loading-active");
    document.getElementById("studentLoadingPanel").style.display = "none";
    document.getElementById("studentUnavailable").style.display = "block";
}

async function enterStudentMode(setId) {
    isStudentMode = true;
    studentShareSetId = setId;
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

        displayScreen("gameLibraryScreen", false);
        history.replaceState({ screen: "gameLibraryScreen" }, "", "?play=" + encodeURIComponent(setId));
    } catch (error) {
        console.error("Student set load failed:", error);
        showStudentUnavailable();
    }
}

function backToWordFishHome() {
    isStudentMode = false;
    studentShareSetId = null;
    clearScreenContext();
    window.location.href = window.location.pathname;
}

function leaveGameResults() {
    stopGamePronunciation();
    clearGameContext();
    navigateAfterGame();
}

function getGameEnglishWord() {
    const card = gameCards[currentIndex];

    return (card?.english || "").trim();
}

function updateGamePronounceButton() {
    const pronounceButton = document.getElementById("gamePronounceButton");

    if (!pronounceButton) {
        return;
    }

    const isAvailable = typeof isEnglishPronunciationAvailable === "function"
        && isEnglishPronunciationAvailable();
    const englishWord = getGameEnglishWord();

    pronounceButton.hidden = !isAvailable;
    pronounceButton.disabled = !isAvailable || englishWord === "";
}

function stopGamePronunciation() {
    if (typeof stopEnglishPronunciation === "function") {
        stopEnglishPronunciation();
    }
}

function pronounceGameWord() {
    if (currentScreenId !== "gameScreen") {
        return;
    }

    const englishWord = getGameEnglishWord();

    if (!englishWord || typeof speakEnglishWord !== "function") {
        return;
    }

    speakEnglishWord(englishWord, { source: "game" });
}

function initGameControls() {
    const pronounceButton = document.getElementById("gamePronounceButton");

    if (pronounceButton && pronounceButton.dataset.handlerAttached !== "true") {
        pronounceButton.dataset.handlerAttached = "true";
        pronounceButton.addEventListener("click", pronounceGameWord);
    }
}

function showCard() {
    stopGamePronunciation();
    answerShown = false;
    currentCardMistakes = 0;
    unscrambleClueIndex = -1;
    unscrambleClueUsed = false;
    clearUnscrambleClue();

    if (gameCards.length === 0) {
        returnToPreGameScreen();
        return;
    }

    let currentCard = gameCards[currentIndex];
    let gameImage = document.getElementById("gameImage");
    let currentPrompt = document.getElementById("currentPrompt");
    let checkButton = document.querySelector(".game-button--check");
    let clueButton = document.querySelector(".game-button--clue");
    let shuffleButton = document.querySelector(".game-button--shuffle");

    checkButton.onclick = checkAnswer;

    if (currentGameMode === "picture") {
        gameImage.src = currentCard.imageUrl;
        gameImage.style.display = "block";

        currentPrompt.textContent = "";
        currentPrompt.style.display = "none";

    } else if (currentGameMode === "unscramble") {
        gameImage.style.display = "none";
        currentPrompt.style.display = "none";

        renderUnscrambleCard(currentCard);
        checkButton.onclick = function () { checkUnscrambleAnswer(); updateUnscrambleShuffleButton(); };

        if (clueButton) {
            clueButton.disabled = false;
            clueButton.onclick = showUnscrambleClue;
        }

        if (shuffleButton) {
            shuffleButton.onclick = startUnscrambleShuffle;
            updateUnscrambleShuffleButton();
        }

    } else {
        gameImage.style.display = "none";

        let promptText = currentCard.thai;

        if (promptText.trim() === "") {
            promptText = currentCard.english;
        }

        currentPrompt.textContent = promptText;
        currentPrompt.style.fontSize = "";
        currentPrompt.style.display = "";
    }

    document.getElementById("answerInput").value = "";
    document.getElementById("feedback").textContent = "";
    document.getElementById("scoreText").innerHTML = '<span class="score-label">Score</span>: <span class="score-value">' + score + " / " + gameCards.length + "</span>";

    updatePearls();
    updateGamePronounceButton();
}

function shuffleWordLetters(letters) {
    if (letters.length <= 1) return [...letters];

    let shuffled = [...letters];
    const original = letters.join("");
    let attempts = 0;

    do {
        shuffled = [...letters];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        attempts++;
    } while (shuffled.join("") === original && attempts < 8);

    return shuffled;
}

function renderUnscrambleCard(card) {
    const tilesContainer = document.getElementById("unscrambleTiles");
    const slotsContainer = document.getElementById("unscrambleSlots");

    tilesContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const letters = card.english.trim().split("").filter(char => char.trim() !== "");
    const shuffledLetters = shuffleWordLetters(letters);

    shuffledLetters.forEach((letter) => {
        const tile = document.createElement("div");
        tile.className = "unscramble-tile";
        tile.textContent = letter.toUpperCase();
        tilesContainer.appendChild(tile);
    });

    letters.forEach((letter) => {
        const slot = document.createElement("div");
        slot.className = "unscramble-slot";
        slot.textContent = "";
        slot.dataset.expected = letter.toUpperCase();
        slotsContainer.appendChild(slot);
    });
}

function checkUnscrambleAnswer() {
    const slots = document.querySelectorAll("#unscrambleSlots .unscramble-slot");
    let allCorrect = true;

    slots.forEach((slot) => {
        const tile = slot.querySelector(".unscramble-tile");
        const expected = slot.dataset.expected || "";

        if (tile && tile.textContent.trim().toUpperCase() === expected.toUpperCase()) {
            tile.classList.add("unscramble-tile--correct");
            slot.classList.add("unscramble-slot--correct");
        } else {
            allCorrect = false;
            if (tile) {
                tile.classList.remove("unscramble-tile--correct");
            }
            slot.classList.remove("unscramble-slot--correct");
        }
    });

    if (!allCorrect) {
        currentCardMistakes++;
        totalWrongAttempts++;
        document.getElementById("feedback").textContent = "Try again!";
        return;
    }

    const perfectAnswer = !answerShown && currentCardMistakes === 0 && !unscrambleClueUsed;

    if (perfectAnswer) {
        score++;
        updateGameScoreCounter();
    }

    let randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
    document.getElementById("feedback").textContent = perfectAnswer
        ? randomPraise
        : "Correct! Keep practising";

    currentIndex++;

    if (currentIndex < gameCards.length) {
        setTimeout(showCard, 900);
    } else {
        setTimeout(showResults, 900);
    }
}

function clearUnscrambleClue() {
    const tiles = document.querySelectorAll(".unscramble-tile--clue");
    const slots = document.querySelectorAll(".unscramble-slot--clue");
    tiles.forEach((tile) => tile.classList.remove("unscramble-tile--clue"));
    slots.forEach((slot) => slot.classList.remove("unscramble-slot--clue"));
}

function showUnscrambleClue() {
    const slots = document.querySelectorAll("#unscrambleSlots .unscramble-slot");
    const clueButton = document.querySelector(".game-button--clue");

    clearUnscrambleClue();

    function isSlotSolved(slot) {
        if (slot.classList.contains("unscramble-slot--correct")) return true;
        const tile = slot.querySelector(".unscramble-tile");
        const expected = slot.dataset.expected || "";
        return tile && tile.textContent.trim().toUpperCase() === expected.toUpperCase();
    }

    const start = unscrambleClueIndex + 1;
    let targetIndex = -1;
    for (let i = 0; i < slots.length; i++) {
        const index = (start + i) % slots.length;
        if (!isSlotSolved(slots[index])) {
            targetIndex = index;
            break;
        }
    }

    if (targetIndex === -1) {
        if (clueButton) clueButton.disabled = true;
        return;
    }

    hintsUsed++;
    unscrambleClueUsed = true;
    unscrambleClueIndex = targetIndex;

    const targetSlot = slots[targetIndex];
    const expected = targetSlot.dataset.expected || "";
    const allTiles = document.querySelectorAll(".unscramble-tile");

    let matchingTile = null;
    for (let i = 0; i < allTiles.length; i++) {
        const tile = allTiles[i];
        if (tile.classList.contains("unscramble-tile--correct")) continue;
        if (tile.textContent.trim().toUpperCase() !== expected.toUpperCase()) continue;

        const slot = tile.closest(".unscramble-slot");
        if (slot && slot.dataset.expected && tile.textContent.trim().toUpperCase() === slot.dataset.expected.toUpperCase()) continue;

        matchingTile = tile;
        break;
    }

    if (matchingTile) {
        matchingTile.classList.add("unscramble-tile--clue");
        targetSlot.classList.add("unscramble-slot--clue");
    }
}

function updateUnscrambleShuffleButton() {
    const shuffleButton = document.querySelector(".game-button--shuffle");
    if (!shuffleButton) return;

    const unlockedTiles = document.querySelectorAll(".unscramble-tile:not(.unscramble-tile--correct)");
    shuffleButton.disabled = unlockedTiles.length < 2;
}

function shuffleUnscrambleTiles() {
    const tilesContainer = document.getElementById("unscrambleTiles");
    const slots = document.querySelectorAll("#unscrambleSlots .unscramble-slot");
    if (!tilesContainer) return;

    // Return unlocked tiles from answer slots to the available tile row.
    slots.forEach((slot) => {
        const tile = slot.querySelector(".unscramble-tile");
        if (tile && !tile.classList.contains("unscramble-tile--correct")) {
            tilesContainer.appendChild(tile);
        }
    });

    const unlockedTiles = Array.from(tilesContainer.querySelectorAll(".unscramble-tile:not(.unscramble-tile--correct)"));
    if (unlockedTiles.length < 2) {
        updateUnscrambleShuffleButton();
        return;
    }

    // Current visible order is determined by the gridColumn style.
    const currentOrder = [...unlockedTiles].sort((a, b) => {
        const colA = parseInt(a.style.gridColumn, 10) || 0;
        const colB = parseInt(b.style.gridColumn, 10) || 0;
        return colA - colB;
    });

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function shuffleArray(array) {
        const a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let shuffled = shuffleArray(unlockedTiles);
    let attempts = 0;
    while (unlockedTiles.length > 1 && arraysEqual(shuffled, currentOrder) && attempts < 8) {
        shuffled = shuffleArray(unlockedTiles);
        attempts++;
    }

    shuffled.forEach((tile, index) => {
        tile.style.gridColumn = (index + 1).toString();
        tilesContainer.appendChild(tile);
    });

    updateUnscrambleShuffleButton();
}

function startUnscrambleShuffle() {
    const unlockedTiles = Array.from(document.querySelectorAll(".unscramble-tile:not(.unscramble-tile--correct)"));
    if (unlockedTiles.length < 2) {
        updateUnscrambleShuffleButton();
        return;
    }

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) {
        unlockedTiles.forEach(tile => {
            tile.style.opacity = "0";
        });
        document.getElementById("unscrambleTiles").offsetHeight;
    }

    shuffleUnscrambleTiles();

    if (!reducedMotion) {
        requestAnimationFrame(() => {
            unlockedTiles.forEach(tile => {
                tile.style.opacity = "";
            });
        });
    }
}

function initUnscrambleDragAndDrop() {
    const area = document.querySelector(".unscramble-area");
    if (!area) return;
    area.addEventListener("pointerdown", onUnscrambleTilePointerDown);
}

function onUnscrambleTilePointerDown(event) {
    if (!event.isPrimary || event.button !== 0) return;

    const tile = event.target.closest(".unscramble-tile");
    if (!tile) return;
    if (tile.classList.contains("unscramble-tile--correct")) return;

    const area = tile.closest(".unscramble-area");
    if (!area) return;

    event.preventDefault();

    const rect = tile.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const originalParent = tile.parentElement;
    const originalNextSibling = tile.nextElementSibling;

    const startX = event.clientX;
    const startY = event.clientY;
    let isDragging = false;
    let ghost = null;
    let dragTargetSlot = null;

    tile.setPointerCapture(event.pointerId);

    function updateDragTarget(clientX, clientY) {
        const target = document.elementFromPoint(clientX, clientY);
        const slot = target && target.closest(".unscramble-slot");

        if (dragTargetSlot) {
            dragTargetSlot.classList.remove("unscramble-slot--drag-target");
            dragTargetSlot = null;
        }

        if (slot && !slot.classList.contains("unscramble-slot--correct") && !slot.querySelector(".unscramble-tile--correct")) {
            slot.classList.add("unscramble-slot--drag-target");
            dragTargetSlot = slot;
        }
    }

    function clearDragTarget() {
        if (dragTargetSlot) {
            dragTargetSlot.classList.remove("unscramble-slot--drag-target");
            dragTargetSlot = null;
        }
    }

    function startDrag(e) {
        isDragging = true;

        ghost = tile.cloneNode(true);
        ghost.classList.remove("unscramble-tile--drop-bounce", "unscramble-tile--clue");
        ghost.classList.add("unscramble-tile-ghost");
        ghost.style.position = "fixed";
        ghost.style.left = rect.left + "px";
        ghost.style.top = rect.top + "px";
        ghost.style.width = rect.width + "px";
        ghost.style.height = rect.height + "px";
        ghost.style.margin = "0";
        ghost.style.zIndex = "1000";
        ghost.style.pointerEvents = "none";
        ghost.style.boxShadow = "0 8px 24px rgba(7, 59, 76, 0.25)";
        ghost.style.transform = "scale(1.05)";
        ghost.style.transition = "box-shadow 0.15s ease";

        document.body.appendChild(ghost);

        tile.classList.add("unscramble-tile--dragging-source");
        tile.style.display = "none";

        updateGhostPosition(e.clientX, e.clientY);
    }

    function updateGhostPosition(clientX, clientY) {
        if (!ghost) return;
        const x = clientX - offsetX - rect.left;
        const y = clientY - offsetY - rect.top;
        ghost.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    }

    function onPointerMove(e) {
        e.preventDefault();
        if (!isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
            startDrag(e);
        }
        updateGhostPosition(e.clientX, e.clientY);
        updateDragTarget(e.clientX, e.clientY);
    }

    function endInteraction() {
        tile.removeEventListener("pointermove", onPointerMove);
        tile.removeEventListener("pointerup", onPointerUp);
        tile.removeEventListener("pointercancel", onPointerCancel);
        if (tile.releasePointerCapture) {
            tile.releasePointerCapture(event.pointerId);
        }
    }

    function onPointerUp(e) {
        endInteraction();
        if (!isDragging) {
            cleanup();
            return;
        }
        finish(e.clientX, e.clientY);
    }

    function onPointerCancel() {
        endInteraction();
        if (!isDragging) {
            cleanup();
            return;
        }
        finish(rect.left + offsetX, rect.top + offsetY);
    }

    function computeSourceInsertBefore(tileArea, clientX) {
        const tiles = Array.from(tileArea.children).filter(child => child !== tile && child.classList.contains("unscramble-tile"));
        for (const child of tiles) {
            const childRect = child.getBoundingClientRect();
            const childCenter = childRect.left + childRect.width / 2;
            if (clientX < childCenter) {
                return child;
            }
        }
        return null;
    }

    function finish(clientX, clientY) {
        clearDragTarget();

        const target = document.elementFromPoint(clientX, clientY);
        const slot = target && target.closest(".unscramble-slot");
        const tileArea = target && target.closest(".unscramble-tiles");

        let destinationParent = originalParent;
        let insertBeforeNode = originalNextSibling;
        let dropIntoSlot = false;

        if (slot) {
            const existingTile = slot.querySelector(".unscramble-tile");
            if (existingTile && existingTile !== tile) {
                if (!existingTile.classList.contains("unscramble-tile--correct")) {
                    if (originalParent && originalParent.classList.contains("unscramble-slot")) {
                        originalParent.appendChild(existingTile);
                    } else {
                        document.getElementById("unscrambleTiles").appendChild(existingTile);
                    }
                    destinationParent = slot;
                    insertBeforeNode = null;
                    dropIntoSlot = true;
                }
            } else {
                destinationParent = slot;
                insertBeforeNode = null;
                dropIntoSlot = true;
            }
        } else if (tileArea) {
            destinationParent = tileArea;
            insertBeforeNode = computeSourceInsertBefore(tileArea, clientX);
        }

        if (destinationParent) {
            if (insertBeforeNode) {
                destinationParent.insertBefore(tile, insertBeforeNode);
            } else {
                destinationParent.appendChild(tile);
            }
        }

        tile.classList.add("unscramble-tile--dragging-source");
        tile.style.display = "";

        clearUnscrambleClue();

        if (dropIntoSlot) {
            if (tile.__dropBounceTimer) clearTimeout(tile.__dropBounceTimer);
            tile.classList.remove("unscramble-tile--drop-bounce");
            tile.offsetWidth;
            tile.classList.add("unscramble-tile--drop-bounce");
            tile.__dropBounceTimer = setTimeout(() => {
                tile.classList.remove("unscramble-tile--drop-bounce");
                tile.__dropBounceTimer = null;
            }, 300);
        }

        if (!ghost) {
            cleanup();
            return;
        }

        const targetRect = tile.getBoundingClientRect();
        ghost.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        ghost.style.boxShadow = "0 2px 6px rgba(7, 59, 76, 0.12)";
        ghost.style.transform = `translate(${targetRect.left - rect.left}px, ${targetRect.top - rect.top}px) scale(1)`;

        const fallbackTimer = setTimeout(() => {
            if (ghost && ghost.parentNode) cleanup();
        }, 300);

        ghost.addEventListener("transitionend", function onEnd() {
            clearTimeout(fallbackTimer);
            ghost.removeEventListener("transitionend", onEnd);
            cleanup();
        }, { once: true });
    }

    function cleanup() {
        if (ghost && ghost.parentNode) ghost.remove();
        tile.style.display = "";
        tile.classList.remove("unscramble-tile--dragging-source");
        clearDragTarget();
    }

    tile.addEventListener("pointermove", onPointerMove);
    tile.addEventListener("pointerup", onPointerUp);
    tile.addEventListener("pointercancel", onPointerCancel);
}

function checkAnswer() {
    let answer = document.getElementById("answerInput").value;
    let correctAnswer = gameCards[currentIndex].english;

    if (answer.toLowerCase().trim() == correctAnswer.toLowerCase().trim()) {
        const perfectAnswer = !answerShown && currentCardMistakes === 0;

        if (perfectAnswer) {
            score++;
            updateGameScoreCounter();
        }

        let randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
        document.getElementById("feedback").textContent = perfectAnswer
            ? randomPraise
            : "Correct! Keep practising";

        currentIndex++;

        if (currentIndex < gameCards.length) {
            setTimeout(showCard, 900);
        } else {
            setTimeout(showResults, 900);
        }

    } else {
        currentCardMistakes++;
        totalWrongAttempts++;
        document.getElementById("feedback").textContent = "Try again!";
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

function updateGameScoreCounter() {
    const counter = document.getElementById("gameScoreCounterValue");
    if (!counter) {
        return;
    }

    const text = `${score}/${gameCards.length}`;
    counter.textContent = text;

    const len = text.length;
    if (len >= 7) {
        counter.style.fontSize = "11px";
    } else if (len >= 6) {
        counter.style.fontSize = "12px";
    } else if (len === 5) {
        counter.style.fontSize = "17px";
    } else if (len === 4) {
        counter.style.fontSize = "19px";
    } else {
        counter.style.fontSize = "";
    }
}

function updatePearls() {
    const pearlBar = document.getElementById("pearlBar");
    pearlBar.innerHTML = "";

    updateGameScoreCounter();

    if (currentGameMode === "unscramble") {
        for (let i = 0; i < gameCards.length; i++) {
            const spacer = document.createElement("span");
            spacer.className = "pearl-empty";
            spacer.setAttribute("aria-hidden", "true");
            pearlBar.appendChild(spacer);
        }
        return;
    }

    for (let i = 0; i < gameCards.length; i++) {
        if (i < score) {
            const shell = document.createElement("img");
            shell.src = "assets/decorations/games/game-shell-reward.png";
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
    stopGamePronunciation();
    isGameRunning = false;
    displayScreen("resultsScreen");

    let accuracy = Math.round(score / gameCards.length * 100);
    let stars = getStars(accuracy);
    let title = getResultTitle(accuracy);

    const resultsFinn = document.getElementById("resultsFinn");
    if (accuracy >= 90) {
        resultsFinn.src = "assets/decorations/results/results-finn-wow.png";
    } else if (accuracy >= 50) {
        resultsFinn.src = "assets/decorations/results/results-finn-proud.png";
    } else {
        resultsFinn.src = "assets/decorations/results/results-finn-upset.png";
    }

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
    let count = 1;
    if (accuracy >= 90) count = 5;
    else if (accuracy >= 80) count = 4;
    else if (accuracy >= 70) count = 3;
    else if (accuracy >= 60) count = 2;

    const star = '<img class="result-star" src="assets/decorations/results/results-star.png" alt="" aria-hidden="true">';
    return star.repeat(count);
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

            studentShareSetId = set.id;
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
        rebuildClassroomTextFlashcardsJumpIndex();

        let restoredIndex = Number(context.currentCardIndex);
        if (!Number.isFinite(restoredIndex)) {
            restoredIndex = 0;
        }

        classroomTextFlashcardsIndex = Math.max(0, Math.min(restoredIndex, textFlashcardsCards.length - 1));
        classroomTextFlashcardSide = context.cardSide === "back" ? "back" : "front";
        classroomTextFlashcardDirection = context.direction === "englishToTranslation"
            ? "englishToTranslation"
            : "translationToEnglish";
        classroomTextFlashcardsLoopEnabled = !!context.loopEnabled;

        displayScreen("classroomTextFlashcardsScreen", false);
        updateClassroomTextFlashcardDirectionButtonLabel();
        updateClassroomTextFlashcardsShuffleButton();
        updateClassroomTextFlashcardsLoopButton();
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
        rebuildClassroomFlashcardsJumpIndex();

        let restoredIndex = Number(context.currentCardIndex);
        if (!Number.isFinite(restoredIndex)) {
            restoredIndex = 0;
        }

        classroomFlashcardsIndex = Math.max(0, Math.min(restoredIndex, flashcardsCards.length - 1));
        classroomFlashcardSide = context.cardSide === "back" ? "back" : "front";
        classroomFlashcardsLoopEnabled = !!context.loopEnabled;

        displayScreen("classroomFlashcardsScreen", false);
        updateClassroomFlashcardsShuffleButton();
        updateClassroomFlashcardsLoopButton();
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
        restoreClassroomPresentationShuffleState(context, presentationCards.length);

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

async function restoreBuilderFromContext(context) {
    const setId = context?.setId;

    if (!setId) {
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

        editingSetId = set.id;
        currentSetName = set.name;
        currentSetAccentColor = normalizeSetAccentColor(set.accentColor);
        cards = prepareCards(set.cards || []);
        showCardsScreen(false);
        return true;
    } catch (error) {
        console.error("Vocabulary Builder restore failed:", error);
        return false;
    }
}

async function tryRestoreBuilderOnRefresh() {
    if (!isBuilderRefreshRequested()) {
        return false;
    }

    const context = loadBuilderContext();

    if (!context) {
        return false;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        return false;
    }

    return restoreBuilderFromContext(context);
}

function getScreenIdFromHistory() {
    const hash = window.location.hash.replace(/^#/, "");
    const map = {
        "game": "gameScreen",
        "cards": "cardsScreen",
        "dashboard": "dashboardScreen",
        "teacher": "teacherScreen",
        "student": "studentScreen",
        "results": "resultsScreen",
        "classroomPicker": "classroomPickerScreen",
        "classroomActivityMenu": "classroomActivityMenuScreen",
        "classroomPresentation": "classroomPresentationScreen",
        "classroomFlashcards": "classroomFlashcardsScreen",
        "classroomTextFlashcards": "classroomTextFlashcardsScreen",
        "classroomVocabularyBoard": "classroomVocabularyBoardScreen",
        "classroomNoCards": "classroomNoCardsScreen",
        "gameLibrary": "gameLibraryScreen"
    };
    return map[hash] || null;
}

function replaceHistoryForCurrentScreen() {
    if (!currentScreenId) return;
    if (currentScreenId === "studentScreen") {
        if (studentShareSetId) {
            history.replaceState({ screen: "studentScreen" }, "", "?play=" + encodeURIComponent(studentShareSetId));
        }
        return;
    }
    const hashMap = {
        "authScreen": "auth",
        "gameScreen": "game",
        "dashboardScreen": "dashboard",
        "cardsScreen": "cards",
        "teacherScreen": "teacher",
        "classroomPickerScreen": "classroomPicker",
        "classroomActivityMenuScreen": "classroomActivityMenu",
        "classroomPresentationScreen": "classroomPresentation",
        "classroomFlashcardsScreen": "classroomFlashcards",
        "classroomTextFlashcardsScreen": "classroomTextFlashcards",
        "classroomVocabularyBoardScreen": "classroomVocabularyBoard",
        "classroomNoCardsScreen": "classroomNoCards",
        "gameLibraryScreen": "gameLibrary"
    };
    const hash = hashMap[currentScreenId];
    if (hash !== undefined) {
        history.replaceState({ screen: currentScreenId }, "", "#" + hash);
    }
}

function restoreGameLibraryScreenById(setId) {
    const index = resolveSetIndex(setId);
    if (index < 0) return false;
    selectedPlaySetIndex = index;
    editingSetId = setId;
    currentSetName = savedSets[index].name;
    currentSetAccentColor = normalizeSetAccentColor(savedSets[index].accentColor);
    cards = prepareCards(savedSets[index].cards || []);
    displayScreen("gameLibraryScreen", false);
    return true;
}

function restoreCardsScreenById(setId) {
    const index = resolveSetIndex(setId);
    if (index < 0) return false;
    editingSetId = setId;
    currentSetName = savedSets[index].name;
    currentSetAccentColor = normalizeSetAccentColor(savedSets[index].accentColor);
    cards = prepareCards(savedSets[index].cards || []);
    showCardsScreen(false);
    return true;
}

async function tryRestoreScreen() {
    const context = loadScreenContext();
    let screenId = context?.screenId;
    if (!screenId) {
        screenId = getScreenIdFromHistory();
    }
    if (!screenId) {
        return false;
    }

    if (screenId === "appLoadingScreen" || screenId === "authScreen") {
        return false;
    }

    try {
        if (screenId === "studentScreen" || screenId === "gameLibraryScreen") {
            const setId = context?.studentShareSetId || studentShareSetId;
            if (setId) {
                studentShareSetId = setId;
                await enterStudentMode(setId);
                return true;
            }
        }

        const { data } = await supabaseClient.auth.getSession();
        const isAuthenticated = !!data.session;

        if (!isAuthenticated && screenId !== "gameScreen" && screenId !== "resultsScreen") {
            clearScreenContext();
            displayScreen("authScreen", false);
            replaceHistoryForCurrentScreen();
            return true;
        }

        if (isAuthenticated) {
            try {
                savedSets = await dbLoadSetsWithCards();
            } catch (error) {
                console.error("Failed to load saved sets for restore:", error);
                savedSets = [];
            }
        }

        if (screenId === "gameScreen") {
            const gameContext = loadGameContext();
            if (!gameContext) {
                if (studentShareSetId) {
                    await enterStudentMode(studentShareSetId);
                    return true;
                }
                clearGameContext();
                clearScreenContext();
                if (isAuthenticated) {
                    showDashboard(false);
                } else {
                    displayScreen("authScreen", false);
                }
                replaceHistoryForCurrentScreen();
                return true;
            }

            suppressHistoryPush = true;
            let restored = false;
            try {
                restored = await restoreGameFromRefresh(gameContext);
            } finally {
                suppressHistoryPush = false;
            }

            if (!restored) {
                clearGameContext();
                clearScreenContext();
                if (studentShareSetId || (gameContext.launchedFrom === "student" && gameContext.setId)) {
                    await enterStudentMode(studentShareSetId || gameContext.setId);
                    return true;
                }
                if (isAuthenticated && gameContext.setId) {
                    if ((gameContext.launchedFrom === "library" || gameContext.launchedFrom === "gameLibrary") && restoreGameLibraryScreenById(gameContext.setId)) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                    if (gameContext.launchedFrom === "editor" && restoreCardsScreenById(gameContext.setId)) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                }
                if (isAuthenticated) {
                    showDashboard(false);
                } else {
                    displayScreen("authScreen", false);
                }
                replaceHistoryForCurrentScreen();
                return true;
            }

            replaceHistoryForCurrentScreen();
            return true;
        }

        if (screenId === "resultsScreen") {
            const gameContext = loadGameContext();
            if (gameContext) {
                if (studentShareSetId || (gameContext.launchedFrom === "student" && gameContext.setId)) {
                    await enterStudentMode(studentShareSetId || gameContext.setId);
                    return true;
                }
                if (isAuthenticated && gameContext.setId) {
                    if ((gameContext.launchedFrom === "library" || gameContext.launchedFrom === "gameLibrary") && restoreGameLibraryScreenById(gameContext.setId)) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                    if (gameContext.launchedFrom === "editor" && restoreCardsScreenById(gameContext.setId)) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                    suppressHistoryPush = true;
                    let restored = false;
                    try {
                        restored = await restoreGameFromRefresh(gameContext);
                    } finally {
                        suppressHistoryPush = false;
                    }
                    if (restored) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                }
            }
            if (studentShareSetId) {
                await enterStudentMode(studentShareSetId);
                return true;
            }
            clearGameContext();
            clearScreenContext();
            if (isAuthenticated) {
                showDashboard(false);
            } else {
                displayScreen("authScreen", false);
            }
            replaceHistoryForCurrentScreen();
            return true;
        }

        if (!isAuthenticated) {
            clearScreenContext();
            displayScreen("authScreen", false);
            replaceHistoryForCurrentScreen();
            return true;
        }

        switch (screenId) {
            case "dashboardScreen": {
                showDashboard(false);
                replaceHistoryForCurrentScreen();
                return true;
            }
            case "teacherScreen": {
                editingSetId = null;
                currentSetName = "";
                displayScreen("teacherScreen", false);
                const setNameInput = document.getElementById("setName");
                const wordListInput = document.getElementById("wordList");
                if (setNameInput) setNameInput.value = "";
                if (wordListInput) wordListInput.value = "";
                replaceHistoryForCurrentScreen();
                return true;
            }
            case "classroomPickerScreen": {
                showClassroomPicker(false);
                replaceHistoryForCurrentScreen();
                return true;
            }
            case "classroomActivityMenuScreen": {
                const restored = await restoreClassroomActivityMenuFromContext(loadClassroomActivityContext() || {});
                if (!restored) {
                    clearClassroomActivityContext();
                    clearScreenContext();
                    showClassroomPicker(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            case "classroomPresentationScreen": {
                const restored = await restoreClassroomPresentationFromContext(loadClassroomPresentationContext() || {});
                if (!restored) {
                    clearClassroomPresentationContext();
                    clearScreenContext();
                    showClassroomPicker(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            case "classroomFlashcardsScreen": {
                const restored = await restoreClassroomFlashcardsFromContext(loadClassroomFlashcardsContext() || {});
                if (!restored) {
                    clearClassroomFlashcardsContext();
                    clearScreenContext();
                    showClassroomPicker(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            case "classroomTextFlashcardsScreen": {
                const restored = await restoreClassroomTextFlashcardsFromContext(loadClassroomTextFlashcardsContext() || {});
                if (!restored) {
                    clearClassroomTextFlashcardsContext();
                    clearScreenContext();
                    showClassroomPicker(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            case "classroomVocabularyBoardScreen": {
                const restored = await restoreClassroomVocabularyBoardFromContext(loadClassroomVocabularyBoardContext() || {});
                if (!restored) {
                    clearClassroomVocabularyBoardContext();
                    clearScreenContext();
                    showClassroomPicker(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            case "classroomNoCardsScreen": {
                if (classroomSelectedSetId) {
                    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);
                    if (selectedSet) {
                        showClassroomNoCardsState(false);
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                }
                clearScreenContext();
                showClassroomPicker(false);
                replaceHistoryForCurrentScreen();
                return true;
            }
            case "gameLibraryScreen": {
                const setId = context?.editingSetId;
                if (setId && restoreGameLibraryScreenById(setId)) {
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                clearScreenContext();
                showDashboard(false);
                replaceHistoryForCurrentScreen();
                return true;
            }
            case "cardsScreen": {
                const restored = await restoreBuilderFromContext(loadBuilderContext());
                if (!restored) {
                    clearBuilderContext();
                    clearScreenContext();
                    const setId = context?.editingSetId;
                    if (setId && restoreCardsScreenById(setId)) {
                        replaceHistoryForCurrentScreen();
                        return true;
                    }
                    showDashboard(false);
                    replaceHistoryForCurrentScreen();
                    return true;
                }
                return true;
            }
            default:
                return false;
        }
    } catch (error) {
        console.error("Screen restore failed:", error);
        clearScreenContext();
        try {
            const { data } = await supabaseClient.auth.getSession();
            if (data.session) {
                showDashboard(false);
                replaceHistoryForCurrentScreen();
            } else {
                displayScreen("authScreen", false);
                replaceHistoryForCurrentScreen();
            }
        } catch (authError) {
            displayScreen("authScreen", false);
            replaceHistoryForCurrentScreen();
        }
        return true;
    }
}

async function checkAuth() {
    if (isPasswordRecovery) {
        displayScreen("resetPasswordScreen", false);
        return;
    }

    showAppLoading();
    initStudentShareLink();

    if (await tryRestoreScreen()) {
        hideAppLoading();
        return;
    }

    if (studentShareSetId) {
        hideAppLoading();
        await enterStudentMode(studentShareSetId);
        return;
    }

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        if (isPasswordRecovery) {
            displayScreen("resetPasswordScreen", false);
            return;
        }

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
        "Account created! Check your email if confirmation is required.";
}

async function requestPasswordReset() {
    const email = document.getElementById("authEmail").value.trim();
    const resetControl = document.querySelector("#authScreen .auth-forgot-password");

    if (email === "") {
        document.getElementById("authMessage").textContent = "Enter your email first.";
        return;
    }

    if (resetControl) {
        resetControl.disabled = true;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    });

    if (resetControl) {
        resetControl.disabled = false;
    }

    if (error) {
        document.getElementById("authMessage").textContent = error.message;
        return;
    }

    document.getElementById("authMessage").textContent =
        "Check your email for a password reset link.";
}

async function updatePassword() {
    const newPassword = document.getElementById("resetPasswordNew").value;
    const confirmPassword = document.getElementById("resetPasswordConfirm").value;
    const messageEl = document.getElementById("resetPasswordMessage");

    if (newPassword === "" || confirmPassword === "") {
        messageEl.textContent = "Please enter both password fields.";
        return;
    }

    if (newPassword !== confirmPassword) {
        messageEl.textContent = "Passwords do not match.";
        return;
    }

    if (newPassword.length < 6) {
        messageEl.textContent = "Password must be at least 6 characters.";
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });

    if (error) {
        messageEl.textContent = error.message;
        return;
    }

    document.getElementById("resetPasswordNew").value = "";
    document.getElementById("resetPasswordConfirm").value = "";

    document.getElementById("authMessage").textContent = "Password updated successfully.";

    history.replaceState(null, "", window.location.origin + window.location.pathname);

    isPasswordRecovery = false;
    clearScreenContext();
    await supabaseClient.auth.signOut();
    displayScreen("authScreen", false);
    replaceHistoryForCurrentScreen();
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
    isStudentMode = false;
    studentShareSetId = null;
    isGameRunning = false;
    clearGameContext();
    clearScreenContext();

    displayScreen("authScreen");
}

function initApp() {
    initClassroomModeButton();
    initClassroomPresentationControls();
    setupClassroomFlashcardJumpOutsideClose();
    initClassroomFlashcardsJumpControls();
    initClassroomTextFlashcardsJumpControls();
    initClassroomFlashcardsControls();
    initClassroomTextFlashcardsControls();
    initClassroomVocabularyBoardControls();
    initClassroomShortcutsHint();
    initSetCardOverflowMenus();
    initBuilderHeaderColorPicker();
    initWordCardImagePopover();
    initWordCardImageTileDrop();
    initGameControls();
    initUnscrambleDragAndDrop();

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            isPasswordRecovery = true;
            displayScreen("resetPasswordScreen", false);
        }
    });

    checkAuth();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
