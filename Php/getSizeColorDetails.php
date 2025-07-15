<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'ClosetInventory';

$conn = new mysqli($host, $user, $password, $database);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

if (isset($_POST['productName'])) {
    $productName = $conn->real_escape_string($_POST['productName']);

    // First, get productId
    $q1 = "SELECT productId FROM product WHERE productName = '$productName' LIMIT 1";
    $getProductId = $conn->query($q1);

    if ($getProductId && $getProductId->num_rows > 0) {
        $row = $getProductId->fetch_assoc();
        $productId = $row['productId'];

        // Now get color and size variants
        $query = "SELECT DISTINCT color, size FROM productVariant WHERE productId = '$productId'";
        $result = $conn->query($query);

        if ($result && $result->num_rows > 0) {
            $colors = [];
            $sizes = [];

            while ($row = $result->fetch_assoc()) {
                if (!in_array($row['color'], $colors)) {
                    $colors[] = $row['color'];
                }
                if (!in_array($row['size'], $sizes)) {
                    $sizes[] = $row['size'];
                }
            }

            echo json_encode([
                'colors' => $colors,
                'sizes' => $sizes
            ]);
        } else {
            echo json_encode(['colors' => [], 'sizes' => []]);
        }
    } else {
        echo json_encode(['colors' => [], 'sizes' => []]);
    }
} else {
    echo json_encode(['error' => 'No product name provided']);
}

$conn->close();
?>
