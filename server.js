const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const { getGroqChatCompletion } = require("./groqIntegration.cjs"); // Use .cjs extension

const app = express();

// Middleware
app.use(helmet()); // Secures HTTP headers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files (like CSS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the views directory
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: "yourSecretKey", // Change this to a secure secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true if using HTTPS
  })
);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/cyberninja", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User schema for user data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  progress: Number,
  completedQuizzes: Array,
  personalizedRecommendations: Array,
});

const User = mongoose.model("User", userSchema);

// Home Route
app.get("/", (req, res) => {
  res.render("index", { title: "Cybersecurity Quiz - CyberNinja" });
});

// Signup Routes
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup" });
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      return res.status(400).send("All fields are required.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect("/login");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup");
  }
});

// Login Routes
app.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(404).send("User Not Found");
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (validPassword) {
      req.session.user = {
        username: foundUser.username,
        email: foundUser.email,
        lastLogin: foundUser.lastLogin,
      };

      foundUser.lastLogin = new Date();
      await foundUser.save();

      res.redirect("/dashboard");
    } else {
      res.render("login", { title: "Login", error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("An error occurred during login");
  }
});

// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("An error occurred during logout");
    }
    res.redirect("/login");
  });
});

// Dashboard Route
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { title: "Dashboard", user: req.session.user });
});

// Profile Routes
app.get("/profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const foundUser = await User.findOne({ email: req.session.user.email });
    if (!foundUser) {
      return res.status(404).send("User not found");
    }

    res.render("profile", { profile: foundUser });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).send("An error occurred while fetching the profile");
  }
});

app.post("/update_profile", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).send("All fields are required.");
    }

    const user = await User.findOneAndUpdate(
      { email: req.session.user.email },
      { username, email },
      { new: true }
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    req.session.user = {
      username: user.username,
      email: user.email,
      lastLogin: user.lastLogin,
    };

    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating your profile");
  }
});

// Chat Route with GroqAI integration
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const chatCompletion = await getGroqChatCompletion(message);
    const responseContent =
      chatCompletion.choices[0]?.message?.content ||
      "No response from the model.";
    res.send({ response: responseContent });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
});

// Cybersecurity-related routes
app.get("/games", (req, res) => {
  res.render("games");
});

app.get("/pricing", (req, res) => {
  res.render("pricing");
});

app.get("/achievement", (req, res) => {
  // Example data (you'll need to replace this with actual data from your database)
  const achievements = [
    { title: "Cyber Champion", description: "Completed all levels." },
    { title: "Speed Master", description: "Completed 5 challenges in under 10 minutes." }
  ];

  const leaderboard = [
    { username: "cyber_warrior", score: 1500 },
    { username: "hack_master", score: 1400 },
    { username: "ninja_coder", score: 1350 }
  ];

  // Pass the data to the template
  res.render("achievement", { achievement: achievements, leaderboard: leaderboard });
});

app.get("/phish", (req, res) => {
  res.render("phish");
});

// Password Challenge Route
app.get("/password-challenge", (req, res) => {
  const user = req.session.user;
  const weakPassword = "password123";

  if (!user) {
    return res.redirect("/login");
  }

  res.render("password-challenge", { user, weakPassword });
});

app.post("/password-challenge/submit", (req, res) => {
  const { passwordGuess } = req.body;

  if (passwordGuess === "password123") {
    return res.json({
      success: true,
      message: "Password cracked successfully!",
    });
  } else {
    return res.json({
      success: false,
      message: "Incorrect password. Try again.",
    });
  }
});

// Learning Path Route
app.get("/learning_path", (req, res) => {
  res.render("learning_path");
});

app.post("/learning_path", (req, res) => {
  const { topics, learningStyle, timeAvailability } = req.body;

  const recommendations = generateLearningPath(
    topics,
    learningStyle,
    timeAvailability
  );

  res.render("learning_path_results", { recommendations });
});

function generateLearningPath(topics, learningStyle, timeAvailability) {
  let path = [];

  if (topics.includes("Networking")) {
    path.push("Networking Fundamentals Quiz");
    if (learningStyle === "videos") {
      path.push("Watch Networking Video Tutorials");
    }
  }

  if (topics.includes("Penetration Testing")) {
    path.push("Penetration Testing Basics Quiz");
    if (timeAvailability > 5) {
      path.push("Read Penetration Testing Articles");
    }
  }

  return path;
}

app.get('/modules', (req, res) => {
  const courses = {
      fundamental: [
          { title: "Course 1", description: "Introduction to cybersecurity basics" },
          { title: "Course 2", description: "Understanding network protocols" },
      ],
      intermediate: [
          { title: "Course 3", description: "Advanced networking" },
          { title: "Course 4", description: "Introduction to penetration testing" },
      ],
      advanced: [
          { title: "Course 5", description: "Exploiting vulnerabilities" },
          { title: "Course 6", description: "Defensive security strategies" },
      ],
      specialized: [
          { title: "Course 7", description: "Digital forensics" },
          { title: "Course 8", description: "Incident response techniques" },
      ],
      skillDevelopment: [
          { title: "Course 9", description: "Linux for cybersecurity" },
          { title: "Course 10", description: "Windows security tools" },
      ],
      emerging: [
          { title: "Course 11", description: "Cybersecurity in AI" },
          { title: "Course 12", description: "Quantum computing impacts" },
      ],
      softSkills: [
          { title: "Course 13", description: "Effective communication in IT" },
          { title: "Course 14", description: "Team collaboration techniques" },
      ],
  };

  res.render('modules', { courses });
});

app.get('/api/recommendations', (req, res) => {
  const userProgress = getUserProgress(req.user.id); // Retrieve user's progress (dummy function)
  const recommendedCourses = aiRecommendCourses(userProgress); // AI-driven course recommendation logic
  res.json(recommendedCourses);
});



// Route for AI-Driven Learning Path
app.get('/ai-learning-path', (req, res) => {
  res.render('ai-learning-path'); // Render the EJS file
});

// Route for the AI Learning Path
app.get('/start-ai-path', (req, res) => {
  res.render('start-ai-path'); // This should match the name of your EJS file
});



// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
