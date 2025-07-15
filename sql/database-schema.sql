 -- Drop the entire database if it exists
DROP DATABASE IF EXISTS inventorySystem;

-- Create the database
CREATE DATABASE inventorySystem;
USE inventorySystem;

-- Create person table
CREATE TABLE person (
    personId VARCHAR(10) PRIMARY KEY,
    fName VARCHAR(20) NOT NULL,
    lName VARCHAR(20) NOT NULL,
    age INT,
    email VARCHAR(25) UNIQUE,
    phNumber VARCHAR(20) UNIQUE
) ENGINE=InnoDB;

-- Create address table
CREATE TABLE address (
    addressId VARCHAR(10) PRIMARY KEY,
    houseNum INT,
    streetNum INT,
    town VARCHAR(20),
    city VARCHAR(20)
) ENGINE=InnoDB;

-- Create customer table
CREATE TABLE customer (
    customerId VARCHAR(10) PRIMARY KEY,
    customerDetails VARCHAR(10),
    addressId VARCHAR(10),
    registeredDate DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (customerDetails) REFERENCES person(personId),
    FOREIGN KEY (addressId) REFERENCES address(addressId)
) ENGINE=InnoDB;

-- Create supplier table
CREATE TABLE supplier (
    supplierId VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(20) NOT NULL,
    supplierDetails VARCHAR(10) NOT NULL,
    addressId VARCHAR(10),
    created_at DATE DEFAULT CURRENT_DATE,
    is_Active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (supplierDetails) REFERENCES person(personId),
    FOREIGN KEY (addressId) REFERENCES address(addressId)
) ENGINE=InnoDB;

-- Create employer table
CREATE TABLE employer (
    employerId VARCHAR(10) PRIMARY KEY,
    employerDetails VARCHAR(10) NOT NULL,
    addressId VARCHAR(10) NOT NULL,
    role VARCHAR(20),
    salaryPerMonth DECIMAL(10,2),
    joiningDate DATE,
    FOREIGN KEY (employerDetails) REFERENCES person(personId),
    FOREIGN KEY (addressId) REFERENCES address(addressId),
    CHECK (role IN ('Admin', 'Manager', 'Sales Person', 'Inventory Staff'))
) ENGINE=InnoDB;

-- Create updated product table with new types
CREATE TABLE product (
    productId VARCHAR(10) PRIMARY KEY,
    productName VARCHAR(20) NOT NULL,
    brand VARCHAR(20) NOT NULL,
    description VARCHAR(50),
    created_at DATE DEFAULT CURRENT_DATE,
    gender VARCHAR(10),
    season VARCHAR(20),
    product_type VARCHAR(20) NOT NULL,
    productStatus VARCHAR(10),
    base_price DECIMAL(10,2) CHECK(base_price > 0),
    material VARCHAR(15),
    origin_country VARCHAR(20) DEFAULT 'Pakistan',
    CHECK (gender IN ('Male', 'Female', 'Unisex')),
    CHECK (season IN ('Summer', 'Winter', 'Fall', 'Spring', 'All-season')),
    CHECK (product_type IN ('Jackets', 'Shirts', 'Pants', 'Jeans')),
    CHECK (productStatus IN ('Active', 'Draft', 'Discontinued')),
    CHECK (material IN ('Cotton', 'Polyester', 'Leather', 'Denim', 'Wool', 'Silk'))
) ENGINE=InnoDB;

-- Create updated productVariant table with new styles
CREATE TABLE productVariant (
    variantId VARCHAR(10) PRIMARY KEY,
    productId VARCHAR(10),
    size VARCHAR(10),
    color VARCHAR(10),
    style VARCHAR(20) NOT NULL,
    default_selling_price DECIMAL(10,2),
    quantity_in_Stock INT CHECK (quantity_in_Stock >= 0),
    updated_at DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (productId) REFERENCES product(productId),
    CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
    CHECK (style IN (
        'Bomber', 'Leather', 'Denim',  -- Jacket styles
        'Polo', 'Casual', 'Dress',     -- Shirt styles
        'Jeans', 'Chinos', 'Joggers'   -- Pants styles
    ))
) ENGINE=InnoDB;

-- Create purchase table
CREATE TABLE purchase (
    purchase_id INT PRIMARY KEY,
    supplier_id VARCHAR(10),
    invoice_no VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(50),
    payment_status VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'Cash',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplierId),
    CHECK (status IN ('Pending', 'Completed', 'Cancelled', 'Returned')),
    CHECK (payment_status IN ('Paid', 'Unpaid', 'Partially Paid'))
) ENGINE=InnoDB;

-- Create purchaseDetail table
CREATE TABLE purchaseDetail (
    purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT,
    variant_id VARCHAR(10),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    quantity INT CHECK (quantity >= 0),
    subtotal DECIMAL(10,2) CHECK (subtotal >= 0),
    FOREIGN KEY (purchase_id) REFERENCES purchase(purchase_id),
    FOREIGN KEY (variant_id) REFERENCES productVariant(variantId)
) ENGINE=InnoDB;

-- Create stockBatch table
CREATE TABLE stockBatch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id VARCHAR(10),
    purchase_id INT,
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    quantity_received INT CHECK (quantity_received >= 0),
    quantity_remaining INT CHECK (quantity_remaining >= 0),
    received_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES productVariant(variantId),
    FOREIGN KEY (purchase_id) REFERENCES purchase(purchase_id)
) ENGINE=InnoDB;

-- Create sale table
CREATE TABLE sale (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(10),
    employerId VARCHAR(10),
    invoice_no VARCHAR(100),
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) CHECK (final_amount >= 0),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customerId),
    FOREIGN KEY (employerId) REFERENCES employer(employerId),
    CHECK (payment_status IN ('Paid', 'Unpaid', 'Partially Paid'))
) ENGINE=InnoDB;

-- Create saleDetail table
CREATE TABLE saleDetail (
    sale_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    variant_id VARCHAR(10),
    batch_id INT,
    quantity INT CHECK (quantity >= 0),
    unit_price DECIMAL(10,2) CHECK(unit_price >= 0),
    discount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2),
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id),
    FOREIGN KEY (variant_id) REFERENCES productVariant(variantId),
    FOREIGN KEY (batch_id) REFERENCES stockBatch(batch_id)
) ENGINE=InnoDB;

-- Create the updated stored procedure
DELIMITER $$

CREATE PROCEDURE add_product_with_variant(
    IN p_productId VARCHAR(10),
    IN p_productName VARCHAR(20),
    IN p_brand VARCHAR(20),
    IN p_description VARCHAR(50),
    IN p_gender VARCHAR(10),
    IN p_season VARCHAR(20),
    IN p_type VARCHAR(20),
    IN p_status VARCHAR(10),
    IN p_base_price DECIMAL(10,2),
    IN p_material VARCHAR(15),
    IN p_variantId VARCHAR(10),
    IN p_size VARCHAR(10),
    IN p_color VARCHAR(10),
    IN p_style VARCHAR(20),
    IN p_selling_price DECIMAL(10,2),
    IN p_quantity INT
)
BEGIN
    DECLARE style_valid BOOLEAN DEFAULT FALSE;
    
    -- Validate style matches product type
    IF (p_type = 'Jackets' AND p_style IN ('Bomber', 'Leather', 'Denim')) THEN
        SET style_valid = TRUE;
    ELSEIF (p_type = 'Shirts' AND p_style IN ('Polo', 'Casual', 'Dress')) THEN
        SET style_valid = TRUE;
    ELSEIF (p_type IN ('Pants', 'Jeans') AND p_style IN ('Jeans', 'Chinos', 'Joggers')) THEN
        SET style_valid = TRUE;
    END IF;
    
    IF NOT style_valid THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Style does not match product type';
    END IF;
    
    -- Insert product
    INSERT INTO product(
        productId, productName, brand, description, 
        gender, season, product_type, productStatus, 
        base_price, material
    ) VALUES(
        p_productId, p_productName, p_brand, p_description, 
        p_gender, p_season, p_type, p_status, 
        p_base_price, p_material
    );
    
    -- Insert variant
    INSERT INTO productVariant(
        variantId, productId, size, color, style, 
        default_selling_price, quantity_in_Stock
    ) VALUES(
        p_variantId, p_productId, p_size, p_color, p_style, 
        p_selling_price, p_quantity
    );
END$$

DELIMITER ;


CREATE VIEW PurchaseSummary AS
SELECT 
    p.purchase_id,
    per.lName AS supplier_name,
    pd.variant_id,
    pd.quantity,
    pd.cost_price AS unit_price,
    pd.subtotal AS total,
    p.invoice_no
FROM 
    purchase p
JOIN 
    supplier s ON p.supplier_id = s.supplierId
JOIN 
    person per ON s.supplierDetails = per.personId
JOIN 
    purchaseDetail pd ON p.purchase_id = pd.purchase_id;



-- Create a view that combines sale, customer (with person), and employer info
CREATE VIEW sale_summary_view AS
SELECT 
    s.sale_id,
    CONCAT(p.fName, ' ', p.lName) AS customer_name,
    e.employerId,
    s.invoice_no,
    DATE(s.sale_date) AS sale_date,
    s.total_amount,
    s.final_amount,
    s.payment_method
FROM sale s
JOIN customer c ON s.customer_id = c.customerId
JOIN person p ON c.customerDetails = p.personId
JOIN employer e ON s.employerId = e.employerId;

-- View for sales summary
CREATE VIEW sales_aggregates_view AS
SELECT
    COUNT(*) AS total_orders,
    SUM(final_amount) AS total_sales,
    ROUND(AVG(final_amount), 2) AS average_order_value
FROM sale;

CREATE VIEW product_with_variants AS
SELECT
    p.productId AS productId,
    p.productName AS productName,
    p.product_type AS category,
    v.variantId AS variantId,
    v.size AS size,
    v.color AS color,
    v.style AS style,
    v.default_selling_price AS price,
    v.quantity_in_Stock AS products,
    p.productStatus AS status
FROM
    product AS p
JOIN
    productvariant AS v ON p.productId = v.productId;

create view v_SaleInvoiceDetails as
select
    s.sale_id,
    s.invoice_no,
    s.sale_date,
    s.total_amount,
    s.discount as sale_discount,
    s.final_amount,
    s.payment_method,
    s.payment_status,
    c.customerId,
    concat(p.fName, ' ', p.lName) as customer_name,
    p.email,
    p.phNumber,
    a.houseNum,
    a.streetNum,
    a.town,
    a.city,
    pv.variantId,
    pr.productName,
    pr.brand,
    pv.size,
    pv.color,
    pv.style,
    sd.quantity,
    sd.unit_price,
    sd.discount as line_discount,
    sd.total_price
from sale s
join customer c on s.customer_id = c.customerId
join person p on c.customerDetails = p.personId
left join address a on c.addressId = a.addressId
join saleDetail sd on s.sale_id = sd.sale_id
join productVariant pv on sd.variant_id = pv.variantId
join product pr on pv.productId = pr.productId;



DELIMITER $$

CREATE PROCEDURE get_total_sales_by_date(IN days_back INT)
BEGIN
    SELECT 
        DATE(sale_date) AS sale_day,
        SUM(final_amount) AS total_sales
    FROM 
        sale
    WHERE 
        sale_date >= CURDATE() - INTERVAL days_back DAY
    GROUP BY 
        DATE(sale_date)
    ORDER BY 
        sale_day;
END$$

DELIMITER ;


CREATE OR REPLACE VIEW salesReport AS
SELECT 
    s.sale_id,
    CONCAT(p.fName, ' ', p.lName) AS customer_name,
    SUM(sd.quantity) AS total_quantity,
    s.total_amount,
    s.discount,
    s.final_amount,
    s.payment_method,
    DATE(s.sale_date) AS sale_date
FROM sale s
JOIN customer c ON s.customer_id = c.customerId
JOIN person p ON c.customerDetails = p.personId
JOIN saleDetail sd ON s.sale_id = sd.sale_id
GROUP BY s.sale_id;



CREATE OR REPLACE VIEW purchaseReport AS
SELECT 
    p.purchase_id,
    CONCAT(per.fName, ' ', per.lName) AS supplier_name,
    GROUP_CONCAT(
      CONCAT(
        prod.productName, ' (', var.color, ' / ', var.size, ') - ',
        pd.quantity, ' x ', FORMAT(pd.cost_price, 2)
      ) SEPARATOR ', '
    ) AS product_summary,
    p.total_amount AS total_cost,
    p.payment_method,
    p.payment_status,
    p.status,
    p.purchase_date
FROM purchase p
JOIN supplier s ON p.supplier_id = s.supplierId
JOIN person per ON s.supplierDetails = per.personId
JOIN purchaseDetail pd ON p.purchase_id = pd.purchase_id
JOIN productVariant var ON pd.variant_id = var.variantId
JOIN product prod ON var.productId = prod.productId
GROUP BY p.purchase_id;


CREATE OR REPLACE VIEW inventoryView AS
SELECT 
    p.productId,
    p.productName,
    p.product_type AS category,
    GROUP_CONCAT(CONCAT(pv.color, ' / ', pv.size, ' - ', pv.quantity_in_stock) SEPARATOR ', ') AS variants,
    SUM(pv.quantity_in_stock) AS totalStock,
    MIN(pv.updated_at) AS lastUpdated
FROM 
    product p
JOIN 
    productVariant pv ON p.productId = pv.productId
GROUP BY 
    p.productId, p.productName, p.product_type;


CREATE VIEW purchaseSummaryView AS
SELECT 
    p.purchase_id AS purchaseId,
    CONCAT(per.fName, ' ', per.lName) AS supplierName,
    pd.variant_id AS variantId,
    pd.quantity AS quantity,
    pd.cost_price AS unitPrice,
    pd.subtotal AS total,
    p.invoice_no AS invoiceNumber
FROM 
    purchase p
    JOIN supplier s ON p.supplier_id = s.supplierId
    JOIN person per ON s.supplierDetails = per.personId
    JOIN purchasedetail pd ON p.purchase_id = pd.purchase_id;

