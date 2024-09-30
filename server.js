const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const app = express();
const { getGroqChatCompletion } = require("./groqIntegration.cjs"); // Use .cjs extension


// Middleware
app.use(helmet()); // Secures HTTP headers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files (like CSS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the views directory
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("views", "./views");
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

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
});

const User = mongoose.model("User", userSchema);

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Cybersecurity Quiz - CyberNinja' });
});

// Home Route
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

// Signup Route
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup" });
});

// Dashboard Route
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect to login if not authenticated
  }
  res.render("dashboard", { title: "Dashboard", user: req.session.user });
});

// Signup POST Route
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

// Login Route
app.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null });
});

// Login POST Route
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

// Profile Route
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


app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const chatCompletion = await getGroqChatCompletion(message);
    const responseContent = chatCompletion.choices[0]?.message?.content || "No response from the model.";
    res.send({ response: responseContent });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
});

// Update Profile Route
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

// Submit Feedback Route
app.post("/submit-feedback", (req, res) => {
  const { name, email, comments } = req.body;
  console.log("Feedback Received:", { name, email, comments });
  res.send("Thank you for your feedback!");
});

app.get('/simulate', (req, res) => {
  const title = "Cyber Attack Simulator"; // Set your title here
  const attacks = [ /* your attack data */ ];
  res.render('simulate', { title, attacks });
});


// GET Route: Render the form or initial page
app.get("/learning_path", (req, res) => {
  res.render("learning_path"); // Render the form page for the learning path
});

// POST Route: Handle form submission
app.post("/learning_path", (req, res) => {
  const { topics, learningStyle, timeAvailability } = req.body;

  // Generate recommendations
  const recommendations = generateLearningPath(
    topics,
    learningStyle,
    timeAvailability
  );

  // Render the recommendations page
  res.render("learning_path_results", { recommendations });
});

// Your learning path generation function
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


// Games, Profile, and Simulation Routes
app.get("/games", (req, res) => {
  res.render("games");
});

app.get('/update_profile', (req, res) => {
  // Assume you fetch the profile from the database
  const profile = {
    username: "your_username",
    email: "your_email@example.com"
  };

  res.render('update_profile', { profile });
});

// Dummy achievements data
const achievement = [
  { title: 'Certified Ethical Hacker', description: 'Earned on January 2024' },
  { title: 'Java Developer', description: 'Completed a Java course in 2024' },
  { title: 'Penetration Tester', description: 'Internship in Penetration Testing' }
];

// Define the route for achievement
app.get('/achievement', (req, res) => {
  console.log("Achievement route accessed");
  res.render('achievement');
});



// Password Challenge Route
app.get('/password-challenge', (req, res) => {
  const user = req.session.user; // Get the authenticated user from the session
  const weakPassword = 'password123'; // Example weak password
  
  if (!user) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  res.render('password-challenge', { user, weakPassword }); // Pass the user and weak password to the EJS template
});



app.post('/password-challenge/submit', (req, res) => {
  const { userId, passwordGuess } = req.body;

  if (passwordGuess === 'password123') {
    return res.json({ success: true, message: 'Password cracked successfully!' });
  } else {
    return res.json({ success: false, message: 'Incorrect password. Try again.' });
  }
});







// app.get('/simulat', (req, res) => {
//   res.render('simulat', { title: 'Cyber Attack Simulator', attacks });
// });


app.get("/phish", (req, res) => {
  res.render("phish");
});

app.get("/setting", (req, res) => {
  res.render("setting", {
    title: "Settings",
    stylesheet: "/css/style.css",
    favicon: "/images/favicon.ico",
    logo: "/images/logo.png",
  });
});

// app.get('/simulate', (req, res) => {
//   res.render('simulat', { title: 'Simulation Page' });
// });

// Route for the pricing page
app.get('/pricing', (req, res) => {
  res.render('pricing');  // Render the EJS file located in 'views/pricing.ejs'
});


app.post("/chat", async (req, res) => {
  const { message } = req.body; // Get the message from the request body

  try {
    const chatCompletion = await getGroqChatCompletion(message);
    const botReply = chatCompletion.choices[0]?.message?.content || "Sorry, I could not generate a response.";
    
    res.json({ reply: botReply }); // Send the bot reply as JSON
  } catch (error) {
    console.error("Error processing message", error);
    res.status(500).json({ error: "Sorry, I encountered an error." });
  }
});

// Define your courses data (you can also fetch this from a database)
const courses = {
  fundamental: [
      {
          title: "Introduction to Cybersecurity",
          description: "Basics of cybersecurity principles, terminology, and key concepts."
      },
      {
          title: "Networking Basics",
          description: "Understanding computer networks, protocols, and security practices."
      }
  ],
  intermediate: [
      {
          title: "Ethical Hacking",
          description: "Techniques for identifying vulnerabilities and strengthening defenses."
      },
      {
          title: "Cryptography and Encryption",
          description: "Principles and applications of cryptography in securing communications."
      },
      {
          title: "Web Application Security",
          description: "Overview of common vulnerabilities and best practices for securing web apps."
      }
  ],
  advanced: [
      {
          title: "Incident Response and Forensics",
          description: "Strategies for responding to cybersecurity incidents."
      },
      {
          title: "Advanced Threat Detection",
          description: "Techniques for identifying advanced persistent threats."
      },
      {
          title: "Cloud Security",
          description: "Best practices for securing cloud computing environments."
      }
  ],
  specialized: [
      {
          title: "Mobile Security",
          description: "Security challenges and techniques for mobile devices."
      },
      {
          title: "IoT Security",
          description: "Overview of security risks and best practices for IoT devices."
      },
      {
          title: "Cybersecurity Compliance and Governance",
          description: "Understanding legal and regulatory requirements in cybersecurity."
      }
  ],
  skillDevelopment: [
      {
          title: "Security+ Certification Prep",
          description: "Comprehensive preparation for the CompTIA Security+ certification."
      },
      {
          title: "Certified Ethical Hacker (CEH) Exam Prep",
          description: "In-depth preparation for the CEH certification."
      },
      {
          title: "CISSP Exam Prep",
          description: "Comprehensive coverage of the CISSP domains."
      }
  ],
  emerging: [
      {
          title: "Artificial Intelligence in Cybersecurity",
          description: "Using AI to enhance security defenses."
      },
      {
          title: "Blockchain Security",
          description: "Security implications of blockchain technology and smart contracts."
      },
      {
          title: "Quantum Computing and Cybersecurity",
          description: "Preparing for the impact of quantum computing on cryptography."
      }
  ],
  softSkills: [
      {
          title: "Cybersecurity Leadership and Management",
          description: "Developing leadership skills for managing cybersecurity teams."
      },
      {
          title: "Communication and Collaboration in Cybersecurity",
          description: "Effective techniques for team collaboration and reporting."
      }
  ]
};

// Define the GET route for modules
app.get('/modules', (req, res) => {
  res.render('modules', { courses });
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
