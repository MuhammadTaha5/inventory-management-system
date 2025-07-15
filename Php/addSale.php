<?php
header('Content-Type: application/json');
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

function generateCustomerId($customerName, $customerPhone) {
    $namePart = strtoupper(substr(preg_replace('/\s+/', '', $customerName), 0, 3));
    $phoneDigits = preg_replace('/\D/', '', $customerPhone);
    $phonePart = substr($phoneDigits, -2);
    $timestamp = date('His');
    return $namePart . $phonePart . $timestamp;
}

// Basic fields
$customerName   = $_POST['customerName'] ?? 'N/A';
$customerEmail  = $_POST['customerEmail'] ?? 'N/A';
$customerPhone  = $_POST['customerPhone'] ?? 'N/A';
$saleId     = $_POST['saleId'] ?? 'N/A';
$invoiceNum     = $_POST['invoiceNo'] ?? 'N/A';
$paymentMethod  = $_POST['paymentMethod'] ?? 'N/A';
$totalBill      = $_POST['totalBill'] ?? 0;
$companyName = "Invo";
$customerId = substr(generateCustomerId($customerName, $customerPhone), 0, 10);
$customerFirstName = "Mr.";
$age = 25;

// Product arrays
$productNames   = $_POST['productName'] ?? [];
$productColors  = $_POST['productColor'] ?? [];
$productSizes   = $_POST['productSize'] ?? [];
$productQtys    = $_POST['productQty'] ?? [];
$productPrices  = $_POST['productPrice'] ?? [];

$totalProducts = count($productNames);

if (
    $totalProducts === 0 ||
    count($productColors) !== $totalProducts ||
    count($productSizes) !== $totalProducts
) {
    http_response_code(400);
    echo json_encode(['error' => 'Incomplete product data']);
    exit;
}

$variantIds = [];
$missingProducts = [];

$query = "
    SELECT pv.variantId 
    FROM product p
    JOIN productVariant pv ON p.productId = pv.productId
    WHERE p.productName = ? AND pv.size = ? AND pv.color = ?
";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare statement']);
    exit;
}

for ($i = 0; $i < $totalProducts; $i++) {
    $name = $productNames[$i];
    $size = $productSizes[$i];
    $color = $productColors[$i];

    $stmt->bind_param("sss", $name, $size, $color);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $variantIds[] = [
            'product' => $name,
            'variantId' => $row['variantId'],
            'quantity' => $productQtys[$i],
            'price' => $productPrices[$i]
        ];
    } else {
        $missingProducts[] = [
            'product' => $name,
            'size' => $size,
            'color' => $color
        ];
    }
}

if (!empty($missingProducts)) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Some products do not exist in the system',
        'missingProducts' => $missingProducts
    ]);
    exit;
}

// Insert person
$personData = $conn->prepare("INSERT INTO person(personId, fName, lName, age, email, phNumber)
    VALUES (?, ?, ?, ?, ?, ?)");
$personData->bind_param("sssdss", $customerId, $customerFirstName, $customerName, $age, $customerEmail, $customerPhone);
$personData->execute();

// Insert Employer
$customerData = $conn->prepare("INSERT INTO customer(customerId, customerDetails)
    VALUES (?, ?)");
$customerData->bind_param("ss", $customerId, $customerId);
$customerData->execute();

// Insert sale
$addSale = $conn->prepare("INSERT INTO sale(sale_id, customer_id,
                         invoice_no, total_amount, final_amount, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)");
$addSale->bind_param("sssdds", $saleId, $customerId, $invoiceNum, $totalBill, $totalBill, $paymentMethod);
$addSale->execute();

// Prepare statements for saleDetail, and update
$addSaleDetail = $conn->prepare("INSERT INTO saleDetail(sale_id, variant_id, quantity, unit_price,
                                 total_price)
    VALUES (?, ?, ?, ?, ?)");

$updateVariantQuantity = $conn->prepare("UPDATE productVariant
    SET quantity_in_Stock = quantity_in_Stock - ?
    WHERE variantId = ?");

foreach ($variantIds as $variant) {
    $vId = $variant['variantId'];
    $costPerVariant = $variant['price'];
    $quantityPerVariant = $variant['quantity'];
    $subTotal = $costPerVariant * $quantityPerVariant;

    $addSaleDetail->bind_param("ssddd", $saleId, $vId, $quantityPerVariant, $costPerVariant, $subTotal);
    $addSaleDetail->execute();


    $updateVariantQuantity->bind_param("ds", $quantityPerVariant, $vId);
    $updateVariantQuantity->execute();
}

echo json_encode([
    'message' => 'All products processed successfully.',
    'variants' => $variantIds
]);
exit;
?>
