// ==========================
// 0️⃣ DOM elements
// ==========================
const sentenceEl = document.getElementById("sentence");
const feedbackEl = document.getElementById("feedback");
const textInput = document.getElementById("text-input");
const choicesDiv = document.getElementById("choices");
const submitBtn = document.getElementById("submit-btn");
const continueBtn = document.getElementById("continue-btn");
const restartBtn = document.getElementById("restart-btn");
const heartCountEl = document.getElementById("heart-count");
const correctCountEl = document.getElementById("correct-count");
const incorrectCountEl = document.getElementById("incorrect-count");

let cards = [];
let currentCardIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let lives = 5;
let streak = 0; // consecutive correct answers

// ==========================
// Utility: restore progress
// ==========================
function restoreProgress() {
    const saved = localStorage.getItem("germanFlashcardsProgress"); // Retrieve saved progress from browser
    if (!saved) return; // Exit if no saved progress

    try {
        const data = JSON.parse(saved);

        currentCardIndex = data.currentCardIndex ?? 0;
        correctCount = data.correctCount ?? 0;
        incorrectCount = data.incorrectCount ?? 0;
        lives = data.lives ?? 5;
        streak = data.streak ?? 0;

        console.log("Progress restored:", data); // Log restored data for debugging
    } catch (e) {
        console.warn("Failed to restore progress:", e);
    }
}

// ==========================
// 1️⃣ Load cards from TSV
// ==========================
async function loadCardsFromTSV() {
}

// ==========================
// 1️⃣ Load cards from TSV
// ==========================
async function loadCardsFromTSV() {
    try {
        const response = await fetch("card.tsv");
        if (!response.ok) throw new Error(`TSV not found: ${response.status}`);

        const tsvText = await response.text();
        const lines = tsvText.trim().split("\n");

        // Lowercase headers for safe lookup
        const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());

        cards = lines.slice(1).map(line => {
            const values = line.split("\t").map(v => v.trim());
            const row = {};
            headers.forEach((h, i) => row[h] = values[i] || "");

            const answers = row["answer"].split("|").map(a => a.trim());
            const distractors = row["distractors"]
                ? row["distractors"].split("|").map(d => d.trim())
                : [];

            return {
                type: row["type"].toLowerCase(), // "type" or "select"
                sentence: row["german"],
                correct: answers,
                options: row["type"].toLowerCase() === "select"
                    ? shuffleArray([...answers, ...distractors])
                    : [],
                distractors: distractors
            };
        });

        console.log("Cards loaded:", cards);

        // ✅ RESTORE SAVED STATE
        restoreProgress();
        updateUI();
        loadCard();
    
    } catch (err) {
        console.error("Error loading TSV:", err);
        sentenceEl.textContent = "Failed to load card.tsv";
    }
}

// ==========================
// 2️⃣ Utility: shuffle array
// ==========================
function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// ==========================
// 3️⃣ Load a card
// ==========================
function loadCard() {
    if (currentCardIndex >= cards.length) {
        sentenceEl.textContent = "🎉 Lesson Complete!";
        textInput.style.display = "none";
        choicesDiv.innerHTML = "";
        submitBtn.style.display = "none";
        continueBtn.style.display = "none";
        restartBtn.style.display = "block";
        feedbackEl.textContent = "";
        return;
    }

    const card = cards[currentCardIndex];
    sentenceEl.textContent = card.sentence;

    // ===== Show hint for sentence cards (type) =====
    if (card.type === "type" && card.distractors.length > 0) {
        feedbackEl.innerHTML = `💡 Hint: ${card.distractors.join(", ")}`;
        feedbackEl.className = "hint";
    } else {
        feedbackEl.textContent = "";
        feedbackEl.className = "";
    }

    // ===== Show input or multiple-choice =====
    if (card.type === "select") {
        textInput.style.display = "none";
        choicesDiv.innerHTML = "";
        card.options.forEach(option => {
            const btn = document.createElement("button");
            btn.textContent = option;
            btn.className = "choice-btn";
            btn.onclick = () => checkAnswer(option);
            choicesDiv.appendChild(btn);
        });
        submitBtn.style.display = "none";
    } else {
        textInput.style.display = "block";
        textInput.value = "";
        choicesDiv.innerHTML = "";
        submitBtn.style.display = "inline-block";
        textInput.focus();
    }

    continueBtn.style.display = "none"; // hide until answer checked
}

// ==========================
// 4️⃣ Check answer
// ==========================
function checkAnswer(answer) {
    const card = cards[currentCardIndex];
    const isCorrect = card.correct.includes(answer.trim());

    // ===== Show result =====
    if (card.type === "type" && card.distractors.length > 0) {
        feedbackEl.innerHTML = `💡 Hint: ${card.distractors.join(", ")}<br>` +
        (isCorrect
            ? "✅ Correct!"
            : `❌ Incorrect! Correct answer: ${card.correct.join(", ")}`);
        feedbackEl.className = isCorrect ? "correct" : "hint";
    } else if (card.type === "select") {
    feedbackEl.innerHTML = isCorrect
        ? "✅ Correct!"
        : `❌ Incorrect! Correct answer: ${card.correct.join(", ")}`;
    feedbackEl.className = isCorrect ? "correct" : "incorrect";
}

    // ===== Update counters =====
    if (isCorrect) {
        correctCount++;
        streak++; // increase streak
    } else {
        incorrectCount++;
        lives--;
        streak = 0; // reset streak on wrong answer
    }

    // ===== Give bonus hearts every 5 consecutive correct answers =====
    if (streak > 0 && streak % 5 === 0) {
        lives += 2;
        // Optional: show a message
        feedbackEl.innerHTML += `<br>🎉 Streak bonus! +2 ❤️`;
    }

    updateUI();
    currentCardIndex++;

    // ✅ SAVE PROGRESS HERE
    localStorage.setItem("germanFlashcardsProgress", JSON.stringify({
        currentCardIndex,
        correctCount,
        incorrectCount,
        lives,
        streak
    }));

    // ===== Prepare for next card =====
    continueBtn.style.display = "inline-block";
    submitBtn.style.display = "none";
    textInput.style.display = "none";
    choicesDiv.querySelectorAll("button").forEach(btn => btn.disabled = true);

    if (lives <= 0) {
        sentenceEl.textContent = "💀 Game Over!";
        restartBtn.style.display = "block";
        continueBtn.style.display = "none";
    }
}

// ==========================
// 5️⃣ Continue button
// ==========================
continueBtn.onclick = () => {
    continueBtn.style.display = "none";
    loadCard();
};

// ==========================
// 6️⃣ Restart button
// ==========================
restartBtn.onclick = () => {
    currentCardIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    lives = 5;
    streak = 0;
    localStorage.removeItem("germanFlashcardsProgress"); // clear saved progress
    restartBtn.style.display = "none";
    textInput.style.display = "block";
    submitBtn.style.display = "inline-block";
    updateUI();
    loadCard();
};

// ==========================
// 7️⃣ Update UI
// ==========================
function updateUI() {
    heartCountEl.textContent = `${lives} ❤️`;
    correctCountEl.textContent = `Correct: ${correctCount}`;
    incorrectCountEl.textContent = `Incorrect: ${incorrectCount}`;
}

// ==========================
// 8️⃣ Input handlers
// ==========================
submitBtn.onclick = () => checkAnswer(textInput.value);
textInput.addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer(textInput.value);
});

// ==========================
// 9️⃣ Start app
// ==========================
loadCardsFromTSV();
