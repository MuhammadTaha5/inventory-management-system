<?php
// Start clean
ob_start();
header('Content-Type: application/json');

// Show errors during development
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

// Get POST data safely
$productId = $_POST['productId'] ?? '';
$productName = $_POST['productName'] ?? '';
$category = $_POST['category'] ?? '';
$size = $_POST['size'] ?? '';
$color = $_POST['color'] ?? '';
$style = $_POST['style'] ?? '';
$price = floatval($_POST['price'] ?? 0);
$status = $_POST['status'] ?? 'Active';
$description = "$color $category";
$selling_price = $price + 500;

if (!$productId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing productId']);
    exit;
}

$conn->begin_transaction();

try {
    // Get the related variantId from productId
    $stmtGet = $conn->prepare("SELECT variantId FROM productVariant WHERE productId = ?");
    if (!$stmtGet) {
        throw new Exception("Prepare failed for SELECT: " . $conn->error);
    }
    $stmtGet->bind_param("s", $productId);
    $stmtGet->execute();
    $stmtGet->bind_result($variantId);
    if (!$stmtGet->fetch()) {
        throw new Exception("No variant found for productId $productId");
    }
    $stmtGet->close();

    // Update product table
    $stmtProduct = $conn->prepare("UPDATE product SET product_type = ?, base_price = ?, productStatus = ? WHERE productId = ?");
    if (!$stmtProduct) {
        throw new Exception("Prepare failed for product UPDATE: " . $conn->error);
    }
    $stmtProduct->bind_param("sdss", $category, $price, $status, $productId);
    $stmtProduct->execute();
    $stmtProduct->close();

    // Update productVariant table
    $stmtVariant = $conn->prepare("UPDATE productVariant SET size = ?, color = ?, style = ? WHERE variantId = ?");
    if (!$stmtVariant) {
        throw new Exception("Prepare failed for variant UPDATE: " . $conn->error);
    }
    $stmtVariant->bind_param("ssss", $size, $color, $style, $variantId);
    $stmtVariant->execute();
    $stmtVariant->close();

    // Commit the transaction
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Update failed', 'details' => $e->getMessage()]);
}

$conn->close();
ob_end_flush();
