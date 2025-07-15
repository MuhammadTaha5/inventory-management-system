<?php
header('Content-Type: application/json');

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'ClosetInventory';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$sql = "SELECT * FROM product_with_variants";
$result = $conn->query($sql);

$data = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    $length = sizeof($data);
    $response = [
    "size" => count($data),
    "data" => $data
];
    echo json_encode($response);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Query failed: " . $conn->error]);
}

$conn->close();
