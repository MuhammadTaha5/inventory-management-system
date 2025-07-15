<?php
$conn = new mysqli("localhost", "root", "", "ClosetInventory");
if ($conn->connect_error) die("Connection failed");

$query = "SELECT DISTINCT company_name FROM supplier WHERE is_active = 1";
$result = $conn->query($query);
$suppliers = [];

while ($row = $result->fetch_assoc()) {
    $suppliers[] = $row;
}

echo json_encode($suppliers);
