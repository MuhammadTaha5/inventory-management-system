<?php
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'ClosetInventory';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if(isset($_POST['input'])) {
    $input = $conn->real_escape_string($_POST['input']);
    $query = "SELECT productName FROM product WHERE productName LIKE '{$input}%' LIMIT 5";
    $result = $conn->query($query);

    if($result->num_rows > 0) {
        echo "<ul>";
        while($row = $result->fetch_assoc()) {
            echo "<li class='suggest-item'>" . htmlspecialchars($row['productName']) . "</li>";
        }
        echo "</ul>";
    } else {
        echo "<div class='no-result'>No Product Found</div>";
    }
}
?>
