<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=ClosetInventory", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query = "
        SELECT p.productName AS product_name, SUM(sd.quantity) AS total_quantity
        FROM saleDetail sd
        JOIN productVariant pv ON sd.variant_id = pv.variantId
        JOIN product p ON pv.productId = p.productId
        GROUP BY p.productName
        ORDER BY total_quantity DESC
        LIMIT 5
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($results);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
