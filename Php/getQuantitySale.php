<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'ClosetInventory';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

// ✅ FIXED condition:
if (isset($_POST['productName'], $_POST['size'], $_POST['color'])) {
    $productName = $conn->real_escape_string($_POST['productName']);
    $productSize = $conn->real_escape_string($_POST['size']);
    $productColor = $conn->real_escape_string($_POST['color']);

    // First, get productId
    $q1 = "SELECT productId FROM product WHERE productName = '$productName'";
    $res1 = $conn->query($q1);

    if ($res1 && $res1->num_rows > 0) {
        $row = $res1->fetch_assoc();
        $productId = $row['productId'];

        // Then, get variantId
        $q2 = "SELECT variantId FROM productVariant WHERE productId = '$productId' AND size = '$productSize' AND color = '$productColor'";
        $res2 = $conn->query($q2);

        if ($res2 && $res2->num_rows > 0) {
            $variantRow = $res2->fetch_assoc();
            $variantId = $variantRow['variantId'];

            // Get cost price from stockBatch
            $q3 = "SELECT default_selling_price FROM productVariant WHERE variantId = '$variantId' LIMIT 1";
            $res3 = $conn->query($q3);

            if ($res3 && $res3->num_rows > 0) {
                $priceRow = $res3->fetch_assoc();
                $costPrice = $priceRow['default_selling_price'];

                echo json_encode(['cost_price' => $costPrice]);
            } else {
                echo json_encode(['message' => 'Cost price not found']);
            }
        } else {
            echo json_encode(['message' => 'Product variant not found']);
        }
    } else {
        echo json_encode(['message' => 'Product not found']);
    }
} else {
    echo json_encode(['error' => 'Missing required POST parameters']);
}

$conn->close();
?>
