<?php
header('Content-Type: application/json');
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method."
    ]);
    exit;
}

$connection = mysqli_connect("localhost", "root", "", "ClosetInventory");
if (!$connection) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . mysqli_connect_error()
    ]);
    exit;
}

// Sanitize and get POST data
$name = mysqli_real_escape_string($connection, trim($_POST["name"]));
$email = mysqli_real_escape_string($connection, trim($_POST["email"]));
$password = $_POST["password"];

// Split name into first and last
$nameParts = explode(" ", $name, 2);
$firstName = $nameParts[0];
$lastName = isset($nameParts[1]) ? $nameParts[1] : '';

// Password length validation
if (strlen($password) < 8) {
    echo json_encode([
        "status" => "error",
        "message" => "Password must be at least 8 characters long."
    ]);
    exit;
}

// Check for duplicate email
$checkQuery = "SELECT email FROM signupDetails WHERE email = '$email'";
$checkResult = mysqli_query($connection, $checkQuery);
if (mysqli_num_rows($checkResult) > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Email already exists. Please log in."
    ]);
    exit;
}

// Hash password and insert
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$signupId = uniqid("S");

$insertQuery = "INSERT INTO signupDetails (signupId, firstName, lastName, email, passwordHash)
                VALUES ('$signupId', '$firstName', '$lastName', '$email', '$passwordHash')";

if (mysqli_query($connection, $insertQuery)) {
    echo json_encode([
        "status" => "success",
        "message" => "🎉 Account created successfully!"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . mysqli_error($connection)
    ]);
}

mysqli_close($connection);
?>
