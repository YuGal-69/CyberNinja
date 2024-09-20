<?php
include 'db_connect.php';

$sql = "SELECT * FROM users"; // Example query
$result = $conn->query($sql);

$users = [];

if ($result->num_rows > 0) {
    // Fetch data for each user
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

// Return data as JSON
echo json_encode($users);

// Close connection
$conn->close();
?>
