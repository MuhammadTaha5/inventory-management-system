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

// Custom random purchase_detail_id generator
function generatePurchaseDetailId($purchaseId, $supplierId) {
    $random = strtoupper(bin2hex(random_bytes(3))); // 6-char hex
    return "PUR-{$purchaseId}-{$supplierId}-{$random}";
}

// Generate supplier ID
function generateSupplierId($supplierName, $supplierPhone) {
    $namePart = strtoupper(substr(preg_replace('/\s+/', '', $supplierName), 0, 3));
    $phoneDigits = preg_replace('/\D/', '', $supplierPhone);
    $phonePart = substr($phoneDigits, -2);
    $timestamp = date('His');
    return $namePart . $phonePart . $timestamp;
}

// POST Fields
$supplierName   = $_POST['supplierName'] ?? 'N/A';
$supplierEmail  = $_POST['supplierEmail'] ?? 'N/A';
$supplierPhone  = $_POST['supplierPhone'] ?? 'N/A';
$purchaseId     = $_POST['purchaseId'] ?? 'N/A';
$invoiceNum     = $_POST['invoiceNo'] ?? 'N/A';
$paymentMethod  = $_POST['paymentMethod'] ?? 'N/A';
$totalBill      = $_POST['totalBill'] ?? 0;

$companyName = "Invo";
$supplierId = substr(generateSupplierId($supplierName, $supplierPhone), 0, 10);
$supplierFirstName = "Mr.";
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

// Insert into person
$personData = $conn->prepare("INSERT INTO person(personId, fName, lName, age, email, phNumber)
    VALUES (?, ?, ?, ?, ?, ?)");
$personData->bind_param("sssdss", $supplierId, $supplierFirstName, $supplierName, $age, $supplierEmail, $supplierPhone);
$personData->execute();

// Insert into supplier
$supplierData = $conn->prepare("INSERT INTO supplier(supplierId, company_name, supplierDetails)
    VALUES (?, ?, ?)");
$supplierData->bind_param("sss", $supplierId, $companyName , $supplierId);
$supplierData->execute();

// Insert into purchase
$addPurchase = $conn->prepare("INSERT INTO purchase(purchase_Id, supplier_Id, invoice_no, total_amount, payment_method)
    VALUES (?, ?, ?, ?, ?)");
$addPurchase->bind_param("sssds", $purchaseId, $supplierId, $invoiceNum, $totalBill, $paymentMethod);
$addPurchase->execute();

// Prepare inserts
$addPurchaseDetail = $conn->prepare("INSERT INTO purchaseDetail(
    purchase_detail_id, purchase_id, variant_id, cost_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)");
$addStockBatch = $conn->prepare("INSERT INTO stockBatch(
    variant_id, purchase_id, cost_price, quantity_received)
    VALUES (?, ?, ?, ?)");
$updateVariantQuantity = $conn->prepare("UPDATE productVariant
    SET quantity_in_Stock = quantity_in_Stock + ?
    WHERE variantId = ?");

// Insert per variant
foreach ($variantIds as $variant) {
    $vId = $variant['variantId'];
    $cost = $variant['price'];
    $qty = $variant['quantity'];
    $subtotal = $cost * $qty;

    $purchaseDetailId = generatePurchaseDetailId($purchaseId, $supplierId);

    $addPurchaseDetail->bind_param("sssddd", $purchaseDetailId, $purchaseId, $vId, $cost, $qty, $subtotal);
    $addPurchaseDetail->execute();

    $addStockBatch->bind_param("ssdd", $vId, $purchaseId, $cost, $qty);
    $addStockBatch->execute();

    $updateVariantQuantity->bind_param("ds", $qty, $vId);
    $updateVariantQuantity->execute();
}

echo json_encode([
    'message' => 'All products processed successfully.',
    'variants' => $variantIds
]);
exit;
?>
