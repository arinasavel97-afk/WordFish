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
let currentGameMode = "translation";
let autoSaveTimer = null;
let autoSaveInProgress = false;
let isGameRunning = false;
let selectedPlaySetIndex = null;
let currentCardMistakes = 0;
let totalWrongAttempts = 0;
let lastGameOrderSignature = "";
let currentScreenId = "";
let suppressHistoryPush = false;

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
        let wordCount = savedSets[i].cards ? savedSets[i].cards.length : 0;
        let imageCount = (savedSets[i].cards || []).filter(card => card.imageUrl).length;

        savedSetsList.innerHTML += `
            <div class="card set-card">
                <div class="set-card-topline">🐠 Ready to play</div>
                <h2>📚 ${escapeHTML(savedSets[i].name)}</h2>
                <p><span class="small-label">Words:</span> ${wordCount}</p>
                <p><span class="small-label">Images:</span> ${imageCount}</p>

                <div class="set-actions">
                    <button class="green-button" onclick="openPlayChoice(${i})">▶️ Play</button>
                    <button onclick="editSet(${i})">✏️ Edit</button>
                    <button class="red-button" onclick="deleteSet(${i})">🗑️ Delete</button>
                </div>
            </div>
        `;
    }
}


function openPlayChoice(index) {
    selectedPlaySetIndex = index;
    const selectedSet = savedSets[index];
    document.getElementById("playChoiceTitle").textContent = "Play: " + selectedSet.name;
    document.getElementById("playChoiceModal").style.display = "flex";
}

function closePlayChoice() {
    selectedPlaySetIndex = null;
    document.getElementById("playChoiceModal").style.display = "none";
}

async function startChosenSetGame(mode) {
    if (selectedPlaySetIndex === null) return;

    const selectedSet = savedSets[selectedPlaySetIndex];
    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);
    closePlayChoice();
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
        const newSet = await dbCreateSetWithCards(setName.trim(), cards);
        editingSetId = newSet.id;
        currentSetName = newSet.name;
        showCardsScreen();
        showToast("Set created! 🐠", "success");
    } catch (error) {
        showToast("Could not create set: " + error.message, "error");
    }
}

function editSet(index) {
    let selectedSet = savedSets[index];

    editingSetId = selectedSet.id;
    currentSetName = selectedSet.name;
    cards = prepareCards(selectedSet.cards || []);

    showCardsScreen();
}

async function deleteSet(index) {
    const setName = savedSets[index].name;
    const confirmed = window.confirm(`Delete "${setName}"?`);

    if (!confirmed) {
        return;
    }

    try {
        await dbDeleteSet(savedSets[index].id);
        showToast("Set deleted 🗑️", "success");
        await showDashboard();
    } catch (error) {
        showToast("Could not delete set: " + error.message, "error");
    }
}

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
    if (!editingSetId || isGameRunning) return;

    clearTimeout(autoSaveTimer);
    setSaveStatus("💾 Saving...", "saving");

    autoSaveTimer = setTimeout(() => {
        autoSaveNow();
    }, delay);
}

async function autoSaveNow() {
    if (!editingSetId || autoSaveInProgress) return;

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
    if (!editingSetId) return;

    clearTimeout(autoSaveTimer);
    await autoSaveNow();
}

async function startGame(mode) {
    currentGameMode = mode;

    await saveCardsBeforePlay();

    const playableCards = cleanCardsForSaving();

    if (playableCards.length === 0) {
        showToast("🐟 Add at least one English word before playing.", "warning");
        showCardsScreen();
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
            showCardsScreen();
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
    showCardsScreen();
}

function showCard() {
    answerShown = false;
    currentCardMistakes = 0;

    if (gameCards.length === 0) {
        showDashboard();
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
        <h2>🏆 Perfect answers: ${score} / ${gameCards.length}</h2>
        <h3>💡 Hints used: ${hintsUsed}</h3>
        <h3>🐠 Wrong tries: ${totalWrongAttempts}</h3>
        <h3>📚 Accuracy: ${accuracy}%</h3>
    `;
}

function getStars(accuracy) {
    if (accuracy >= 90) return "⭐ ⭐ ⭐ ⭐ ⭐";
    if (accuracy >= 80) return "⭐ ⭐ ⭐ ⭐";
    if (accuracy >= 70) return "⭐ ⭐ ⭐";
    if (accuracy >= 60) return "⭐ ⭐";
    return "⭐";
}

function getResultTitle(accuracy) {
    if (accuracy >= 90) return "Excellent! 🌟";
    if (accuracy >= 70) return "Great Job! 🐠";
    if (accuracy >= 50) return "Good Try! 🐚";
    return "Let's Practice Again! 💪";
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
    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        showDashboard();
    } else {
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
