<?php
header('Content-Type: application/json');

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// DB connection
$host = 'localhost';
$db = 'ClosetInventory';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

header('Content-Type: application/json');

// Fetch sale summary view data
$salesQuery = "SELECT * FROM sale_summary_view ORDER BY sale_date DESC LIMIT 10";
$salesResult = $conn->query($salesQuery);
$sales = [];
while ($row = $salesResult->fetch_assoc()) {
    $sales[] = $row;
}

// Fetch aggregates
$summaryQuery = "SELECT * FROM sales_aggregates_view";
$summaryResult = $conn->query($summaryQuery);
$summaryData = $summaryResult->fetch_assoc();

$response = [
    'recentSales' => $sales,
    'summary' => $summaryData
];

echo json_encode($response);
$conn->close();
