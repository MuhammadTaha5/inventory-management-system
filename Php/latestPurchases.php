<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=ClosetInventory", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query = "
        SELECT 
            CONCAT(p.fName, ' ', p.lName) AS supplierName, 
            pr.productName AS productName,
            pd.quantity AS quantity,
            pu.purchase_date AS purchaseDate,
            pd.cost_price AS costPrice
        FROM purchaseDetail pd
        JOIN purchase pu ON pu.purchase_id = pd.purchase_id
        JOIN productVariant pv ON pv.variantId = pd.variant_id
        JOIN product pr ON pr.productId = pv.productId
        JOIN supplier s ON s.supplierId = pu.supplier_id
        JOIN person p ON p.personId = s.supplierDetails
        ORDER BY pu.purchase_date DESC
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
