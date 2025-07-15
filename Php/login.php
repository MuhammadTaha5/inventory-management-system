<?php
session_start(); // Start session to store login status

// Enable detailed error reporting during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Connect to the database
$connection = mysqli_connect("localhost", "root", "", "closetinventory");
if (!$connection) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . mysqli_connect_error()
    ]);
    exit;
}

// Only handle POST requests
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and retrieve inputs
    $email = mysqli_real_escape_string($connection, $_POST["email"]);
    $password = $_POST["password"];

    // Look up user by email
    $query = "SELECT signupId, firstName, lastName, passwordHash FROM signupDetails WHERE email = '$email' LIMIT 1";
    $result = mysqli_query($connection, $query);

    // Check if user exists
    if ($result && mysqli_num_rows($result) == 1) {
        $user = mysqli_fetch_assoc($result);

        // Verify hashed password
        if (password_verify($password, $user['passwordHash'])) {
            // Successful login
            $_SESSION['signupId'] = $user['signupId'];
            $_SESSION['name'] = $user['firstName'] . " " . $user['lastName'];

            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "name" => $_SESSION['name']
            ]);
        } else {
            // Incorrect password
            echo json_encode([
                "status" => "error",
                "message" => "Invalid email or password"
            ]);
        }
    } else {
        // Email not found
        echo json_encode([
            "status" => "error",
            "message" => "Invalid email or password"
        ]);
    }
} else {
    // Non-POST request
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method"
    ]);
}

mysqli_close($connection);
?>
