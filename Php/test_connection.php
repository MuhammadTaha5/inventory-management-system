<?php
header('Content-Type: text/plain'); // Plain text for easy debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database credentials
$db_server = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "ClosetInventory";

// Attempt connection
try {
    $conn = new mysqli($db_server, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    echo "✅ Database connected successfully!\n";
    echo "Server Info: " . $conn->server_info . "\n";
    
    // Optional: Test a simple query
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        echo "Tables in database:\n";
        while ($row = $result->fetch_row()) {
            echo "- " . $row[0] . "\n";
        }
    } else {
        echo "Query failed: " . $conn->error;
    }
    
    $conn->close();
} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage());
}