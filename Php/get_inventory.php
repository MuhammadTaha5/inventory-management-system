<?php
header('Content-Type: application/json');

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

$category = $_GET['category'] ?? '';
$size = $_GET['size'] ?? '';

$conditions = [];

if (!empty($category)) {
    $conditions[] = "p.product_type = '" . $conn->real_escape_string($category) . "'";
}
if (!empty($size)) {
    $conditions[] = "pv.size = '" . $conn->real_escape_string($size) . "'";
}

$whereClause = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

$query = "
    SELECT 
        p.productId,
        p.productName,
        p.product_type AS category,
        GROUP_CONCAT(CONCAT(pv.color, ' / ', pv.size, ' - ', pv.quantity_in_Stock) SEPARATOR ', ') AS variants,
        SUM(pv.quantity_in_Stock) AS totalStock,
        MAX(pv.updated_at) AS lastUpdated
    FROM product p
    JOIN productVariant pv ON p.productId = pv.productId
    $whereClause
    GROUP BY p.productId
";

$result = $conn->query($query);
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
