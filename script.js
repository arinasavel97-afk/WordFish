 let cards = [];
        let currentIndex = 0;
        let score = 0;
        let answerShown = false;
        let hintsUsed = 0;
        let editingSetIndex = null;
        let draggedIndex = null;
        let currentGameMode = "translation";

        const praiseWords = [
            "Great job! 🌟",
            "Excellent! 🐠",
            "Amazing! 🫧",
            "Fantastic! 🐚",
            "Well done! ⭐",
            "Super! 🌊",
            "Brilliant! 🦪"
        ];

        function hideAllScreens() {
            document.getElementById("dashboardScreen").style.display = "none";
            document.getElementById("teacherScreen").style.display = "none";
            document.getElementById("cardsScreen").style.display = "none";
            document.getElementById("gameScreen").style.display = "none";
            document.getElementById("resultsScreen").style.display = "none";
        }

        function getSavedSets() {
            return JSON.parse(localStorage.getItem("wordFishSets")) || [];
        }

        function saveSets(savedSets) {
            localStorage.setItem("wordFishSets", JSON.stringify(savedSets));
        }

        function showDashboard() {
            hideAllScreens();
            document.getElementById("dashboardScreen").style.display = "block";

            let savedSets = getSavedSets();
            let savedSetsList = document.getElementById("savedSetsList");

            savedSetsList.innerHTML = "";

            if (savedSets.length === 0) {
                savedSetsList.innerHTML = `
                    <div class="card">
                        <h2>🐚 No saved sets yet</h2>
                        <p>Create your first vocabulary set.</p>
                    </div>
                `;
                return;
            }

            for (let i = 0; i < savedSets.length; i++) {
                let wordCount = savedSets[i].cards ? savedSets[i].cards.length : 0;

                savedSetsList.innerHTML += `
                    <div class="card set-card">
                        <h2>📚 ${escapeHTML(savedSets[i].name)}</h2>
                        <p><span class="small-label">Words:</span> ${wordCount}</p>

                        <div class="set-actions">
                            <button class="green-button" onclick="playSavedSet(${i})">▶️ Open</button>
                            <button onclick="editSet(${i})">✏️ Edit</button>
                            <button class="soft-button" onclick="duplicateSet(${i})">📄 Duplicate</button>
                            <button class="red-button" onclick="deleteSet(${i})">🗑️ Delete</button>
                        </div>
                    </div>
                `;
            }
        }

        function showTeacherScreen() {
            hideAllScreens();
            editingSetIndex = null;

            document.getElementById("teacherScreen").style.display = "block";
            document.getElementById("setName").value = "";
            document.getElementById("wordList").value = "";
        }

        function createSetAndOpenCards() {
            let setName = document.getElementById("setName").value;
            let words = document.getElementById("wordList").value;

            if (setName.trim() === "") {
                alert("Please enter a set name");
                return;
            }

            if (words.trim() === "") {
                alert("Please enter some words");
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

            let savedSets = getSavedSets();

            savedSets.push({
                name: setName.trim(),
                cards: cards
            });

            saveSets(savedSets);

            editingSetIndex = savedSets.length - 1;

            showCardsScreen();
        }

        function editSet(index) {
            let savedSets = getSavedSets();

            editingSetIndex = index;
            cards = prepareCards(savedSets[index].cards || []);

            showCardsScreen();
        }

        function playSavedSet(index) {
            editSet(index);
        }

        function duplicateSet(index) {
            let savedSets = getSavedSets();
            let selectedSet = savedSets[index];

            savedSets.push({
                name: selectedSet.name + " Copy",
                cards: JSON.parse(JSON.stringify(selectedSet.cards || []))
            });

            saveSets(savedSets);
            showDashboard();
        }

        function deleteSet(index) {
            let savedSets = getSavedSets();

            savedSets.splice(index, 1);
            saveSets(savedSets);

            showDashboard();
        }

        function prepareCards(oldCards) {
            return oldCards.map(card => ({
                english: card.english || "",
                thai: card.thai || "",
                imageUrl: card.imageUrl || ""
            }));
        }

        function showCardsScreen() {
            hideAllScreens();

            document.getElementById("cardsScreen").style.display = "block";

            let savedSets = getSavedSets();

            if (editingSetIndex !== null && savedSets[editingSetIndex]) {
                document.getElementById("builderSetName").value = savedSets[editingSetIndex].name;
            } else {
                document.getElementById("builderSetName").value = "";
            }

            renderCards();
        }

        function renderCards() {
            let cardsList = document.getElementById("cardsList");
            cardsList.innerHTML = "";

            if (cards.length === 0) {
                cardsList.innerHTML = `
                    <div class="card">
                        <h2>🐚 No cards yet</h2>
                        <p>Click + New Word to add your first card.</p>
                    </div>
                `;
                return;
            }

            for (let i = 0; i < cards.length; i++) {
                cardsList.innerHTML += `
                    <div 
                        class="card word-card"
                        ondragover="dragOver(event, ${i})"
                        ondragleave="dragLeave(event)"
                        ondrop="dropCard(${i})"
                    >
                        <div class="word-card-header">
                            <div class="card-number">🐟 Card ${i + 1}</div>

                            <div 
                                class="drag-handle"
                                draggable="true"
                                ondragstart="dragStart(event, ${i})"
                            >
                                ↕ Drag
                            </div>

                            <button class="red-button" onclick="deleteWord(${i})">🗑️ Delete</button>
                        </div>

                        <div class="word-fields">
                            <div class="field-group">
                                <label>🇬🇧 English word</label>
                                <input 
                                    value="${escapeAttribute(cards[i].english)}" 
                                    oninput="cards[${i}].english = this.value"
                                    placeholder="English word"
                                >
                            </div>

                            <div class="field-group">
                                <label>🇹🇭 Thai translation</label>
                                <input 
                                    value="${escapeAttribute(cards[i].thai)}" 
                                    oninput="cards[${i}].thai = this.value"
                                    placeholder="Thai translation"
                                >
                            </div>
                        </div>

                        <div class="image-preview">
                            <strong>🖼️ Image</strong>

                            ${cards[i].imageUrl ? `<img src="${escapeAttribute(cards[i].imageUrl)}">` : `<p>🐚 No image yet</p>`}

                            <input 
                                value="${escapeAttribute(cards[i].imageUrl)}"
                                oninput="cards[${i}].imageUrl = this.value"
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
        }

        function aiComingSoon() {
            alert("AI image generation is coming soon! 🤖✨");
        }

        function addNewWord() {
            cards.push({
                english: "",
                thai: "",
                imageUrl: ""
            });

            renderCards();
        }

        function deleteWord(index) {
            cards.splice(index, 1);
            renderCards();
        }

        function dragStart(event, index) {
            draggedIndex = index;
            event.stopPropagation();
        }

        function dragOver(event, index) {
            event.preventDefault();
            event.currentTarget.classList.add("drag-over");
        }

        function dragLeave(event) {
            event.currentTarget.classList.remove("drag-over");
        }

        function dropCard(dropIndex) {
            if (draggedIndex === null) return;

            let draggedCard = cards.splice(draggedIndex, 1)[0];
            cards.splice(dropIndex, 0, draggedCard);

            draggedIndex = null;
            renderCards();
        }

        function uploadImage(event, index) {
            let file = event.target.files[0];

            if (!file) return;

            let reader = new FileReader();

            reader.onload = function(e) {
                cards[index].imageUrl = e.target.result;
                renderCards();
            };

            reader.readAsDataURL(file);
        }

        async function translateAllToThai() {
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].thai.trim() === "" && cards[i].english.trim() !== "") {
                    cards[i].thai = await translateWordToThai(cards[i].english);
                }
            }

            renderCards();
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

        function saveCards() {
            let setName = document.getElementById("builderSetName").value;

            if (setName.trim() === "") {
                alert("Please enter a set name.");
                return;
            }

            cards = cards
                .filter(card => card.english.trim() !== "")
                .map(card => ({
                    english: card.english.trim(),
                    thai: card.thai.trim(),
                    imageUrl: card.imageUrl || ""
                }));

            if (cards.length === 0) {
                alert("Please add at least one word.");
                return;
            }

            let savedSets = getSavedSets();

            if (editingSetIndex === null || !savedSets[editingSetIndex]) {
                savedSets.push({
                    name: setName.trim(),
                    cards: cards
                });

                editingSetIndex = savedSets.length - 1;

            } else {
                savedSets[editingSetIndex] = {
                    name: setName.trim(),
                    cards: cards
                };
            }

            saveSets(savedSets);

            alert("Changes saved! 🐚");

            showCardsScreen();
        }

        function startGame(mode) {
            currentGameMode = mode;

            saveCardsBeforePlay();

            if (cards.length === 0) {
                alert("Please add at least one word.");
                showCardsScreen();
                return;
            }

            if (mode === "translation") {
                let missingTranslations = cards.filter(card => card.thai.trim() === "").length;

                if (missingTranslations > 0) {
                    alert("Some cards have no Thai translation. English words will be shown instead for those cards.");
                }
            }

            if (mode === "picture") {
                let missingImages = cards.filter(card => !card.imageUrl).length;

                if (missingImages > 0) {
                    alert(missingImages + " card(s) have no image. Please add images before playing with pictures.");
                    showCardsScreen();
                    return;
                }
            }

            currentIndex = 0;
            score = 0;
            hintsUsed = 0;

            hideAllScreens();

            document.getElementById("gameScreen").style.display = "block";

            if (mode === "picture") {
                document.getElementById("gameTitle").textContent = "🖼️ Look and Type the English Word";
            } else {
                document.getElementById("gameTitle").textContent = "🇹🇭 Translate and Type the English Word";
            }

            showCard();
        }

        function saveCardsBeforePlay() {
            if (editingSetIndex === null) return;

            let setName = document.getElementById("builderSetName").value || "Untitled Set";

            cards = cards
                .filter(card => card.english.trim() !== "")
                .map(card => ({
                    english: card.english.trim(),
                    thai: card.thai.trim(),
                    imageUrl: card.imageUrl || ""
                }));

            let savedSets = getSavedSets();

            savedSets[editingSetIndex] = {
                name: setName.trim(),
                cards: cards
            };

            saveSets(savedSets);
        }

        function showCard() {
            answerShown = false;

            if (cards.length === 0) {
                showDashboard();
                return;
            }

            let gameImage = document.getElementById("gameImage");
            let currentPrompt = document.getElementById("currentPrompt");

            if (currentGameMode === "picture") {
                gameImage.src = cards[currentIndex].imageUrl;
                gameImage.style.display = "block";

                currentPrompt.textContent = "What is it?";
                currentPrompt.style.fontSize = "38px";

            } else {
                gameImage.style.display = "none";

                let promptText = cards[currentIndex].thai;

                if (promptText.trim() === "") {
                    promptText = cards[currentIndex].english;
                }

                currentPrompt.textContent = promptText;
                currentPrompt.style.fontSize = "52px";
            }

            document.getElementById("answerInput").value = "";
            document.getElementById("feedback").textContent = "";
            document.getElementById("scoreText").textContent = "Score: " + score + " / " + cards.length;

            updatePearls();
        }

        function checkAnswer() {
            let answer = document.getElementById("answerInput").value;
            let correctAnswer = cards[currentIndex].english;

            if (answer.toLowerCase().trim() == correctAnswer.toLowerCase().trim()) {
                if (!answerShown) {
                    score++;
                }

                let randomPraise = praiseWords[Math.floor(Math.random() * praiseWords.length)];
                document.getElementById("feedback").textContent = randomPraise;

                currentIndex++;

                if (currentIndex < cards.length) {
                    setTimeout(showCard, 900);
                } else {
                    setTimeout(showResults, 900);
                }

            } else {
                document.getElementById("feedback").textContent = "Try again! 🐠";
                document.getElementById("answerInput").value = "";
            }
        }

        function showAnswer() {
            if (!answerShown) {
                hintsUsed++;
            }

            answerShown = true;

            let correctAnswer = cards[currentIndex].english;

            document.getElementById("feedback").textContent = "Answer: " + correctAnswer;
        }

        function updatePearls() {
            let pearls = "";

            for (let i = 0; i < cards.length; i++) {
                if (i < score) {
                    pearls += "🦪 ";
                } else {
                    pearls += "○ ";
                }
            }

            document.getElementById("pearlBar").textContent = pearls;
        }

        function showResults() {
            hideAllScreens();

            document.getElementById("resultsScreen").style.display = "block";

            let accuracy = Math.round(score / cards.length * 100);
            let stars = getStars(accuracy);
            let title = getResultTitle(accuracy);

            document.getElementById("resultTitle").textContent = title;

            document.getElementById("finalScore").innerHTML = `
                <div class="sea-stars">${stars}</div>
                <h2>🏆 Score: ${score} / ${cards.length}</h2>
                <h3>💡 Hints used: ${hintsUsed}</h3>
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