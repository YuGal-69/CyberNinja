<?php
$servername = "localhost"; // or the IP address of your server
$username = "root"; // replace with your database username
$password = ""; // replace with your database password
$dbname = "cyberninja_dashboard"; // the name of your database

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
