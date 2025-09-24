const loginPage = document.getElementById('login-page');
const homePage = document.getElementById('home-page');
const selectionPage = document.getElementById('selection-page');
const quizPage = document.getElementById('quiz-page');
const explanationPage = document.getElementById('explanation-page');
const resultPage = document.getElementById('result-page');
const userHistoryPage = document.getElementById('user-history-page');
const leaderboardPage = document.getElementById('leaderboard-page');
const loadingPage = document.getElementById('loading-page');

const loginForm = document.getElementById('login-form');
const guestLoginBtn = document.getElementById('guest-login-btn');
const startQuizBtn = document.getElementById('start-quiz-btn');
const userHistoryBtn = document.getElementById('user-history-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const backFromHistoryBtn = document.getElementById('back-from-history-btn');
const backFromLeaderboardBtn = document.getElementById('back-from-leaderboard-btn');
const cancelQuizBtn = document.getElementById('cancel-quiz-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const goHomeBtn = document.getElementById('go-home-btn');
const startQuizNowBtn = document.getElementById('start-quiz-now-btn');

const welcomeMessage = document.getElementById('welcome-message');
const categoryButtonsContainer = document.getElementById('category-buttons');
const difficultySelect = document.getElementById('difficulty-select');
const difficultyContainer = document.querySelector('.difficulty-container');
const questionText = document.getElementById('question-text');
const answerButtons = document.getElementById('answer-buttons');
const timeLeftSpan = document.getElementById('time-left');
const questionNumberSpan = document.getElementById('question-number');
const totalQuestionsSpan = document.getElementById('total-questions');

const userAnswerDisplay = document.getElementById('user-answer-display');
const correctAnswerDisplay = document.getElementById('correct-answer-display');
const explanationText = document.getElementById('explanation-text');

const finalScoreSpan = document.getElementById('final-score');
const finalTotalSpan = document.getElementById('final-total');
const scoreMessage = document.getElementById('score-message');
const historyList = document.getElementById('history-list');
const leaderboardList = document.getElementById('leaderboard-list');
const loadingText = document.getElementById('loading-text');

let currentUser = null;
let currentQuestionIndex = 0;
let score = 0;
let timer;
const TIME_PER_ROUND = 10;
let timeLeft;
let selectedQuestions = [];
let selectedCategoryName = '';
let selectedDifficulty = '';

const API_CATEGORIES = {
    'General Knowledge': 9, 'Science & Nature': 17, 'Science: Computers': 18,
    'Sports': 21, 'Mythology': 20, 'History': 23, 'Geography': 22,
    'Politics': 24, 'Art': 25, 'Animals': 27, 'Vehicles': 28
};

function showPage(page) {
    const screens = [loginPage, homePage, selectionPage, quizPage, explanationPage, resultPage, userHistoryPage, leaderboardPage, loadingPage];
    screens.forEach(s => s.classList.remove('active'));
    page.classList.add('active');
}

function loginUser(username) {
    currentUser = { username: username, history: JSON.parse(localStorage.getItem(username)) || [] };
    welcomeMessage.textContent = `Welcome, ${username}!`;
    showPage(homePage);
}

function populateCategories() {
    categoryButtonsContainer.innerHTML = '';
    difficultyContainer.style.display = 'none';
    startQuizNowBtn.style.display = 'none';

    Object.keys(API_CATEGORIES).forEach(categoryName => {
        const button = document.createElement('button');
        button.textContent = categoryName;
        button.classList.add('answer-btn');
        button.addEventListener('click', () => {
            selectedCategoryName = categoryName;
            categoryButtonsContainer.innerHTML = '';
            difficultyContainer.style.display = 'flex';
            startQuizNowBtn.style.display = 'block';
            startQuizNowBtn.textContent = `Start Quiz in ${selectedCategoryName}`;
        });
        categoryButtonsContainer.appendChild(button);
    });
}

function displayUserHistory() {
    historyList.innerHTML = '';
    if (currentUser && currentUser.history.length > 0) {
        currentUser.history.forEach((quiz, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Quiz #${index + 1}: ${quiz.category} (${quiz.difficulty})</span><span>Score: ${quiz.score}/${quiz.total}</span>`;
            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<p>No quiz history found.</p>';
    }
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    const allUsers = Object.keys(localStorage);
    let allScores = [];

    allUsers.forEach(username => {
        if (username !== 'highScores' && username !== 'loglevel:webpack-dev-server') {
            const userHistory = JSON.parse(localStorage.getItem(username)) || [];
            userHistory.forEach(quiz => {
                allScores.push({ name: username, score: quiz.score, total: quiz.total, difficulty: quiz.difficulty });
            });
        }
    });

    allScores.sort((a, b) => b.score - a.score);

    allScores.slice(0, 10).forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${index + 1} ${entry.name}</span><span>${entry.score}/${entry.total} (${entry.difficulty})</span>`;
        leaderboardList.appendChild(li);
    });
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    loginUser(username);
});
guestLoginBtn.addEventListener('click', () => loginUser('Guest'));
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    showPage(loginPage);
});
startQuizBtn.addEventListener('click', () => {
    showPage(selectionPage);
    populateCategories();
});
userHistoryBtn.addEventListener('click', () => {
    showPage(userHistoryPage);
    displayUserHistory();
});
leaderboardBtn.addEventListener('click', () => {
    showPage(leaderboardPage);
    displayLeaderboard();
});
backToHomeBtn.addEventListener('click', () => showPage(homePage));
backFromHistoryBtn.addEventListener('click', () => showPage(homePage));
backFromLeaderboardBtn.addEventListener('click', () => showPage(homePage));
cancelQuizBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to cancel the quiz?")) {
        clearInterval(timer);
        showPage(homePage);
    }
});
nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < selectedQuestions.length) {
        showPage(quizPage);
        setNextQuestion();
    } else {
        endQuiz();
    }
});
playAgainBtn.addEventListener('click', () => {
    showPage(selectionPage);
    populateCategories();
});
goHomeBtn.addEventListener('click', () => showPage(homePage));
startQuizNowBtn.addEventListener('click', () => {
    selectedDifficulty = difficultySelect.value;
    startQuiz(API_CATEGORIES[selectedCategoryName], selectedDifficulty);
});

async function startQuiz(categoryId, difficulty) {
    showPage(loadingPage);
    loadingText.textContent = "Loading questions...";

    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficulty}&type=multiple`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();

        selectedQuestions = data.results.map(q => {
            const answers = [...q.incorrect_answers, q.correct_answer];
            answers.sort(() => Math.random() - 0.5);
            return {
                question: q.question,
                answers: answers.map(ans => ({ text: ans, correct: ans === q.correct_answer })),
                correct_answer: q.correct_answer,
                explanation: `The correct answer is **${q.correct_answer}**.`
            };
        });

        currentQuestionIndex = 0;
        score = 0;
        totalQuestionsSpan.textContent = selectedQuestions.length;

        showPage(quizPage);
        setNextQuestion();
    } catch (error) {
        console.error("Error fetching quiz questions:", error);
        loadingText.textContent = "Failed to load questions. Please try again later.";
    }
}

function setNextQuestion() {
    resetState();
    timeLeft = TIME_PER_ROUND;
    timeLeftSpan.textContent = timeLeft;
    startTimer();

    const currentQuestion = selectedQuestions[currentQuestionIndex];
    questionText.innerHTML = currentQuestion.question;
    questionNumberSpan.textContent = currentQuestionIndex + 1;

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerHTML = answer.text;
        button.classList.add('answer-btn');
        button.addEventListener('click', () => selectAnswer(button, answer.correct));
        answerButtons.appendChild(button);
    });
}

function resetState() {
    clearInterval(timer);
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function startTimer() {
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        timeLeft--;
        timeLeftSpan.textContent = timeLeft;
        timeLeftSpan.classList.toggle('warning', timeLeft <= 5);
        if (timeLeft <= 0) {
            clearInterval(timer);
            Array.from(answerButtons.children).forEach(btn => btn.disabled = true);
            const currentQuestion = selectedQuestions[currentQuestionIndex];
            showExplanation('Time\'s up!', false);
        }
    }, 1000);
}

function selectAnswer(button, isCorrect) {
    clearInterval(timer);
    Array.from(answerButtons.children).forEach(btn => btn.disabled = true);
    if (isCorrect) {
        score++;
        button.classList.add('correct');
    } else {
        button.classList.add('incorrect');
    }
    const currentQuestion = selectedQuestions[currentQuestionIndex];
    showExplanation(button.innerHTML, isCorrect);
}

function showExplanation(userAnswer, isCorrect) {
    showPage(explanationPage);
    const currentQuestion = selectedQuestions[currentQuestionIndex];

    userAnswerDisplay.textContent = userAnswer;
    userAnswerDisplay.style.color = isCorrect ? '#2ecc71' : '#e74c3c';

    correctAnswerDisplay.textContent = currentQuestion.correct_answer;

    if (isCorrect) {
        explanationText.innerHTML = `Explanation: Great job! You got it right.`;
    } else {
        explanationText.innerHTML = `Explanation: The correct answer is ${currentQuestion.correct_answer}.`;
    }
}

function endQuiz() {
    clearInterval(timer);
    if (currentUser && currentUser.username !== 'Guest') {
        const quizResult = {
            category: selectedCategoryName,
            difficulty: selectedDifficulty,
            score: score,
            total: selectedQuestions.length,
            date: new Date().toLocaleString()
        };
        currentUser.history.push(quizResult);
        localStorage.setItem(currentUser.username, JSON.stringify(currentUser.history));
    }
    showPage(resultPage);
    finalScoreSpan.textContent = score;
    finalTotalSpan.textContent = selectedQuestions.length;
    scoreMessage.textContent = getScoreMessage(score, selectedQuestions.length);
}

function getScoreMessage(userScore, totalQuestions) {
    const percentage = (userScore / totalQuestions) * 100;
    if (percentage === 100) return "🥳 Perfect Score! You're a true Jedi Master!";
    if (percentage >= 75) return "👏 Excellent! You're a rising star!";
    if (percentage >= 50) return "👍 Good effort! Keep aiming for the stars.";
    return "🤔 You'll get there! Don't give up on your cosmic quest.";
}

document.addEventListener('DOMContentLoaded', () => {
    showPage(loginPage);
});
