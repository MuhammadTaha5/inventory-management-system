<?php
header('Content-Type: application/json');
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

// Query the view
$query = "SELECT * FROM purchaseSummaryView";
$result = $conn->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch data from view']);
    exit;
}

$summary = [];
$grandTotal = 0;
$purchaseIds = [];

while ($row = $result->fetch_assoc()) {
    $summary[] = [
        'purchaseId'     => $row['purchaseId'],
        'supplierName'   => $row['supplierName'],
        'variantId'      => $row['variantId'],
        'quantity'       => $row['quantity'],
        'unitPrice'      => $row['unitPrice'],
        'total'          => $row['total'],
        'invoiceNumber'  => $row['invoiceNumber']
    ];

    $grandTotal += $row['total'];
    
}
$totalPurchaseCount = count($summary); // Total rows, not unique purchase IDs
echo json_encode([
    'summary' => $summary,
    'total_purchase_count' => $totalPurchaseCount,
    'grand_total' => $grandTotal
]);
