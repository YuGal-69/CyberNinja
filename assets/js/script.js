// header scroll
let nav = document.querySelector(".navbar");
window.onscroll = function () {
  if (document.documentElement.scrollTop > 100) {
    nav.classList.add("header-scrolled");
  } else {
    nav.classList.remove("header-scrolled");
  }
};

// nav hide
let navBar = document.querySelectorAll(".nav-link");
let navCollapse = document.querySelector(".navbar-collapse.collapse");

navBar.forEach(function (a) {
  a.addEventListener("click", function () {
    navCollapse.classList.remove("show");
  });
});

var progressBar = document.getElementById("progress-bar");

// Get the width of the progress bar, which indicates the current progress
var progressValue = progressBar.ariaValueNow;

// Display the value
// document.getElementById('progressValue').innerHTML = 'Progress: ' + progressValue;
console.log(progressValue);

// Sidebar toggle for mobile
document.addEventListener("DOMContentLoaded", function () {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("show");
    });
  }

  // Get the progress bar element and its value
  const progressBar = document.querySelector("#progress-bar .progress-bar");
  if (progressBar) {
    const progressValue = progressBar.style.width;
    document.getElementById("progressValue").innerText =
      "Progress: " + progressValue;
  }
});

// Points system
let points = 1000;
let progress = 25; // Assuming initial progress is 25%

// Update points and progress
function updatePoints(newPoints) {
  points += newPoints;
  document.getElementById("points-display").textContent = points;
}

function updateProgress(newProgress) {
  progress += newProgress;
  document.getElementById("progress-bar").style.width = progress + "%";
}

// script.js

document.addEventListener("DOMContentLoaded", function () {
  // Example: Sidebar toggle for mobile
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("d-none");
    });

  // Example: Initialize Bootstrap tooltips if needed
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

// Example analytics chart script
const ctx = document.getElementById("analyticsChart").getContext("2d");
const myChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [
      {
        label: "# of Votes",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

function startQuiz(topic) {
  currentTopic = topic;
  questions = {
    phishing: [
      {
        question: "1. What is phishing?",
        options: ["A virus", "Social engineering", "Malware", "Firewall"],
        correctAnswer: 1,
        explanation:
          "Phishing is a form of social engineering aimed at obtaining sensitive information.",
      },
      {
        question: "2. What is the main goal of phishing attacks?",
        options: [
          "Steal information",
          "Install malware",
          "Track location",
          "None of the above",
        ],
        correctAnswer: 0,
        explanation: "The primary goal is to steal sensitive information.",
      },
      {
        question: "3. Which type targets high-profile individuals?",
        options: ["Spear phishing", "Whaling", "Clone phishing", "Vishing"],
        correctAnswer: 1,
        explanation: "Whaling targets high-profile individuals.",
      },
      {
        question: "4. What is 'vishing'?",
        options: [
          "Voice phishing",
          "Video phishing",
          "Virtual phishing",
          "Visual phishing",
        ],
        correctAnswer: 0,
        explanation: "Vishing refers to phishing over the telephone.",
      },
      {
        question: "5. How can you protect yourself?",
        options: [
          "Ignore emails",
          "Use 2FA",
          "Click all links",
          "Share info openly",
        ],
        correctAnswer: 1,
        explanation: "Using two-factor authentication adds extra security.",
      },
    ],
  };

  const questionContainer = document.getElementById("question-container");
  questionContainer.innerHTML = "";

  questions[topic].forEach((q, index) => {
    const questionHtml = `
      <div class="mb-3">
        <label class="form-label">${q.question}</label>
        ${q.options
          .map(
            (option, i) => `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="question${index}" value="${i}" id="question${index}_${i}">
            <label class="form-check-label" for="question${index}_${i}">${option}</label>
          </div>`
          )
          .join("")}
        <div id="feedback${index}" class="text-warning mt-2"></div> <!-- Feedback div -->
      </div>`;
    questionContainer.insertAdjacentHTML("beforeend", questionHtml);
  });
}
function submitQuiz() {
  const totalQuestions = questions.phishing.length;

  for (let i = 0; i < totalQuestions; i++) {
    const selectedOption = document.querySelector(
      `input[name="question${i}"]:checked`
    );
    const feedbackElement = document.getElementById(`feedback${i}`);

    if (selectedOption) {
      const answerValue = parseInt(selectedOption.value);
      const correctAnswer = questions.phishing[i].correctAnswer;

      if (answerValue === correctAnswer) {
        showFeedback(feedbackElement, "Correct!", "green");
      } else {
        showFeedback(
          feedbackElement,
          `Incorrect: ${questions.phishing[i].explanation}`,
          "red"
        );
      }
    } else {
      showFeedback(feedbackElement, "Please select an answer.", "orange");
    }
  }
}

function showFeedback(feedbackElement, message, color) {
  feedbackElement.style.color = color;
  feedbackElement.textContent = message;
}
