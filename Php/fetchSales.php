<?php
// Database connection settings
$host = 'localhost';
$dbname = 'ClosetInventory';
$username = 'root';
$password = '';

header('Content-Type: application/json');

try {
    // Connect using PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Number of days to fetch (last 5 days)
    $days = 5;

    // Call stored procedure with positional parameter (not named)
    $stmt = $pdo->prepare("CALL get_total_sales_by_date(?)");
    $stmt->execute([$days]);

    // Fetch all results
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return JSON
    echo json_encode($sales);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
