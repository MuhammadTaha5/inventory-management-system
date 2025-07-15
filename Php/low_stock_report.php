<?php
header('Content-Type: application/json');

// DB connection
$conn = new mysqli("localhost", "root", "", "ClosetInventory");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);
$category = isset($input['category']) && $input['category'] !== '' ? $conn->real_escape_string($input['category']) : null;
$severity = isset($input['severity']) && $input['severity'] !== '' ? $conn->real_escape_string($input['severity']) : null;

$baseQuery = "
SELECT 
    pv.variantId AS id,
    p.productName AS name,
    p.product_type AS category,
    pv.quantity_in_Stock AS stock,
    100 AS reorderLevel,
    ROUND((pv.quantity_in_Stock / 100) * 100, 0) AS stockPercentage,
    CASE 
        WHEN pv.quantity_in_Stock < 0.2 * 100 THEN 'critical'
        WHEN pv.quantity_in_Stock < 100 THEN 'warning'
        ELSE 'ok'
    END AS status,
    DATE_FORMAT(MAX(sb.received_date), '%Y-%m-%d') AS lastOrdered
FROM productVariant pv
JOIN product p ON pv.productId = p.productId
LEFT JOIN stockBatch sb ON pv.variantId = sb.variant_id
WHERE 1=1
";

// Apply category filter
if ($category) {
    $baseQuery .= " AND p.product_type = '$category'";
}

// Grouping and having clause
$baseQuery .= " GROUP BY pv.variantId";

// Apply severity filter
if ($severity === 'critical') {
    $baseQuery .= " HAVING status = 'critical'";
} elseif ($severity === 'warning') {
    $baseQuery .= " HAVING status = 'warning'";
} else {
    $baseQuery .= " HAVING status IN ('critical', 'warning')";
}

// Order results
$baseQuery .= " ORDER BY stockPercentage ASC";

// Run query
$result = $conn->query($baseQuery);
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
?>
