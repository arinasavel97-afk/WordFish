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
const GAME_CONTEXT_STORAGE_KEY = "wordfish_game_context";
const CLASSROOM_PRESENTATION_CONTEXT_STORAGE_KEY = "wordfish_classroom_presentation_context";
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
    const classroomPresentationScreen = document.getElementById("classroomPresentationScreen");
    if (classroomPickerScreen) {
        classroomPickerScreen.style.display = "none";
    }
    if (classroomPresentationScreen) {
        classroomPresentationScreen.style.display = "none";
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

function displayScreen(screenId, addToHistory = true) {
    hideAllScreens();
    const screen = document.getElementById(screenId);
    if (!screen) {
        console.error("Screen not found:", screenId);
        return;
    }

    screen.style.display = screenId === "classroomPresentationScreen" ? "grid" : "block";
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
    } else if (screenId === "classroomPresentationScreen") {
        showClassroomPresentationForSelectedSet(false);
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

        classroomSetsList.innerHTML += `
            <div class="card classroom-set-card">
                <h2 class="classroom-set-name">📚 ${escapeHTML(set.name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>
                <div class="classroom-set-actions">
                    <button type="button" class="green-button" onclick="startClassroomSet('${escapeAttribute(setId)}')">Start</button>
                </div>
            </div>
        `;
    }
}

function startClassroomSet(setId) {
    const selectedSet = savedSets.find((set) => set.id === setId);

    if (!selectedSet) {
        showToast("Could not find that set.", "error");
        return;
    }

    classroomSelectedSetId = setId;
    startClassroomPresentation(selectedSet);
}

function startClassroomPresentation(set, addToHistory = true) {
    const presentationCards = prepareCards(set.cards || [])
        .filter((card) => card.english.trim() !== "");

    if (presentationCards.length === 0) {
        showToast("This set has no words to present.", "warning");
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
}

function showClassroomPresentationForSelectedSet(addToHistory = true) {
    const selectedSet = savedSets.find((set) => set.id === classroomSelectedSetId);

    if (!selectedSet || classroomPresentationCards.length === 0) {
        showClassroomPicker(addToHistory);
        return;
    }

    classroomPresentationSetName = selectedSet.name;
    showClassroomPresentation(addToHistory);
}

function getClassroomCardTranslation(card) {
    return (card.thai || "").trim();
}

function renderClassroomPresentationCard(options = {}) {
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

    if (card.imageUrl) {
        imageEl.src = card.imageUrl;
        imageEl.alt = card.english;
        imageEl.style.display = "block";
        placeholderEl.style.display = "none";
    } else {
        imageEl.removeAttribute("src");
        imageEl.alt = "";
        imageEl.style.display = "none";
        placeholderEl.style.display = "flex";
    }

    updateClassroomPresentationNav();
    saveClassroomPresentationContext();
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
    renderClassroomPresentationCard();
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
    renderClassroomPresentationCard();
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
    showClassroomPicker();
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
        backButton.addEventListener("click", () => {
            exitClassroomFullscreenIfActive();
            showClassroomPicker();
        });
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

        const presentationCards = prepareCards(set.cards || [])
            .filter((card) => card.english.trim() !== "");

        if (presentationCards.length === 0) {
            return false;
        }

        classroomSelectedSetId = set.id;
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
    checkAuth();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
