<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// DB Connection
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

// Get the productId from POST
$productId = $_POST['productId'] ?? '';

if (empty($productId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing productId']);
    exit;
}

$conn->begin_transaction();

try {
    // Step 1: Delete variant(s) first (if any)
    $deleteVariant = $conn->prepare("DELETE FROM productVariant WHERE productId = ?");
    $deleteVariant->bind_param("s", $productId);
    $deleteVariant->execute();
    $deleteVariant->close();

    // Step 2: Delete the product
    $deleteProduct = $conn->prepare("DELETE FROM product WHERE productId = ?");
    $deleteProduct->bind_param("s", $productId);
    $deleteProduct->execute();
    $deleteProduct->close();

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Product and variant deleted successfully']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Deletion failed', 'details' => $e->getMessage()]);
}

$conn->close();
