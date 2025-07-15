<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "ClosetInventory");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$startDate = $_GET['startDate'] ?? '';
$endDate = $_GET['endDate'] ?? '';
$supplier = $_GET['supplier'] ?? '';

// Build base SQL
$sql = "SELECT * FROM purchaseReport WHERE 1=1";
$params = [];
$types = "";

// Add filters
if (!empty($startDate) && !empty($endDate)) {
    $sql .= " AND purchase_date BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
    $types .= "ss";
}

if (!empty($supplier)) {
    $sql .= " AND supplier_name = ?";
    $params[] = $supplier;
    $types .= "s";
}

$stmt = $conn->prepare($sql);
if ($types) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(['success' => true, 'data' => $data]);
