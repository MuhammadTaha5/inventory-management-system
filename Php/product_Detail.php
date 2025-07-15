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

// Collect basic product info
$productId = $_POST['productId'] ?? '';
$productName = $_POST['productName'] ?? '';
$category = $_POST['category'] ?? '';
$brand = 'Nike';
$description = 'Basic product description';
$gender = 'Unisex';
$season = 'Summer';
$material = 'Cotton';

// Variant arrays from form
$sizes = $_POST['size'] ?? [];
$colors = $_POST['color'] ?? [];
$styles = $_POST['style'] ?? [];
$prices = $_POST['price'] ?? [];
$statuses = $_POST['status'] ?? [];

if (count($sizes) === 0 || count($sizes) !== count($colors) || count($colors) !== count($styles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Incomplete variant data']);
    exit;
}

$conn->begin_transaction();

try {
    // Use the first variant for base price and status
    $base_price = floatval($prices[0] ?? 0);
    $status = $statuses[0] ?? 'Active';

    // Insert product
    $stmt1 = $conn->prepare("
        INSERT INTO product (productId, productName, brand, description, gender, season, product_type, productStatus, base_price, material)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt1->bind_param("ssssssssds", $productId, $productName, $brand, $description, $gender, $season, $category, $status, $base_price, $material);
    $stmt1->execute();

    // Prepare variant insert
    $stmt2 = $conn->prepare("
        INSERT INTO productVariant (variantId, productId, size, color, style, default_selling_price, quantity_in_Stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    for ($i = 0; $i < count($sizes); $i++) {
        $variantId = $productId . '-' . strtoupper(substr($sizes[$i], 0, 1)) . '-' . strtoupper(substr($colors[$i], 0, 2)) . '-' . strtoupper(substr($styles[$i], 0, 2));
        $size = $sizes[$i];
        $color = $colors[$i];
        $style = $styles[$i];
        $price = floatval($prices[$i]);
        $selling_price = $price + 500;
        $quantity = 100;

        $stmt2->bind_param("ssssssd", $variantId, $productId, $size, $color, $style, $selling_price, $quantity);
        $stmt2->execute();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Product and variants inserted']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Insert failed', 'details' => $e->getMessage()]);
}

$stmt1->close();
$stmt2->close();
$conn->close();
