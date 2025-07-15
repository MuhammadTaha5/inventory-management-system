<?php
header('Content-Type: application/json');

// DB connection
$conn = new mysqli("localhost", "root", "", "ClosetInventory");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

// Get filters
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;
$amount = $_GET['amount'] ?? null;

// Base SQL using the view
$sql = "SELECT * FROM salesReport WHERE 1";
$params = [];
$types = "";

// Apply date range filter
if ($start && $end) {
    $sql .= " AND sale_date BETWEEN ? AND ?";
    $params[] = $start;
    $params[] = $end;
    $types .= "ss";
}

// Apply minimum amount filter
if ($amount) {
    $sql .= " AND final_amount >= ?";
    $params[] = $amount;
    $types .= "d";
}

// Prepare & bind
$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Query preparation failed"]);
    exit();
}

if ($types) {
    $stmt->bind_param($types, ...$params);
}

if ($stmt->execute()) {
    $result = $stmt->get_result();
    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode($rows);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Execution failed"]);
}

$conn->close();
?>
