<?php
// Start output buffering to handle header redirection later
ob_start();

// Database connection parameters
$servername = "localhost"; 
$username = "cyberninja"; 
$password = "Yugal@#12"; 
$dbname = "cyberninja";

session_start(); // Start the session

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Sanitize and validate the form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $userPasswordInput = $_POST['password'];

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email format";
    } else {
        // Prepare the SQL statement
        $stmt = $conn->prepare("SELECT username, password FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        
        // Execute the statement
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->bind_result($username, $hashedPassword);
            $stmt->fetch();

            // Verify password
            if (password_verify($userPasswordInput, $hashedPassword)){
                // Password is correct, initiate session
                $_SESSION['username'] = $username;

                // Redirect to PHP dashboard to handle sessions
                header("Location: dashboard.html");
                exit(); 
            } else {
                echo "Incorrect password.";
            }
        } else {
            echo "No account found with that email.";
        }

        // Close the statement
        $stmt->close();
    }
}

// Close the connection
$conn->close();

// End output buffering and flush the output
ob_end_flush();
?>
