document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("purchaseForm");
  const supplierNameInput = document.querySelector("input[name='supplierName']");
  const supplierEmailInput = document.querySelector("input[name='supplierEmail']");
  const supplierPhone = document.querySelector("input[name='supplierPhone']");
  const purchaseId = document.querySelector("input[name='purchaseId']");
  const employer = document.querySelector("input[name='employer']");
  const paymentMethod = document.querySelector("select[name='paymentMethod']");
  const invoiceNoInput = document.querySelector("input[name='invoice']");
  const invoiceDisplay = document.getElementById("invoiceDisplay");
  const supplierDisplay = document.getElementById("supplierDisplay");
  const totalBill = document.getElementById("totalBill");

  // Calculate total
  function calculateTotal() {
    let total = 0;
    const qtyFields = document.getElementsByName('productQty[]');
    const priceFields = document.getElementsByName('productPrice[]');

    for (let i = 0; i < qtyFields.length; i++) {
      const qty = parseFloat(qtyFields[i].value) || 0;
      const price = parseFloat(priceFields[i].value) || 0;
      total += qty * price;
    }

    totalBill.textContent = total.toFixed(2);
  }

  // Handle product autocomplete and selection
  function attachListeners() {
    const section = $('#productSection');

    // Product name suggestion
    section.on('keyup', '.productName', function () {
      const input = $(this).val();
      const suggestionBox = $(this).siblings('.suggestion-box');

      if (input !== "") {
        $.ajax({
          url: "php/searchProduct.php",
          method: "POST",
          data: { input: input },
          success: function (data) {
            suggestionBox.html(data).show();
          }
        });
      } else {
        suggestionBox.hide();
      }
    });

    // Product suggestion click
    section.on('click', '.suggest-item', function () {
      const selectedProduct = $(this).text();
      const inputField = $(this).closest('.suggestion-box').siblings('.productName');
      const productBlock = $(inputField).closest('.product');

      inputField.val(selectedProduct);
      $(this).parent().hide();

      // Fetch color and size for this product
      $.ajax({
        url: "php/getSizeColorDetails.php",
        method: "POST",
        dataType: "json",
        data: { productName: selectedProduct },
        success: function (data) {
          console.log(data);
          // Populate color
          const colorSelect = productBlock.find('select[name="productColor[]"]');
          colorSelect.empty().append('<option disabled selected>Select</option>');
          data.colors.forEach(color => {
            colorSelect.append(`<option value="${color}">${color}</option>`);
          });

          // Populate size
          const sizeSelect = productBlock.find('select[name="productSize[]"]');
          sizeSelect.empty().append('<option disabled selected>Select</option>');
          data.sizes.forEach(size => {
            sizeSelect.append(`<option value="${size}">${size}</option>`);
          });
        }
      });
    });

    // Quantity and price change triggers total calculation
    section.on('input', 'input[name="productQty[]"], input[name="productPrice[]"]', calculateTotal);
  }

  // Add new product block
  document.getElementById('addProductBtn').addEventListener('click', () => {
    const productHTML = `
      <div class="product">
        <div class="form-row">
          <div class="form-group" style="position: relative;">
            <label>Product Name</label>
            <input type="text" class="productName" name="productName[]" required autocomplete="off">
            <div class="suggestion-box"></div>
          </div>
          <div class="form-group">
            <label>Color</label>
            <select name="productColor[]" required>
              <option value="" disabled selected>Select</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Size</label>
            <select name="productSize[]" required>
              <option value="" disabled selected>Select</option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" name="productQty[]" min="1" required>
          </div>
          <div class="form-group">
            <label>Price</label>
            <input type="number" name="productPrice[]" step="0.01" required>
          </div>
        </div>
      </div>`;
    document.getElementById('productSection').insertAdjacentHTML('beforeend', productHTML);
  });

  // Generate invoice number on supplier name input
  supplierNameInput.addEventListener("input", () => {
    const now = new Date();
    const digitsOnly = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const invoiceNo = supplierNameInput.value.trim().slice(0, 2).toUpperCase() + digitsOnly;
    invoiceNoInput.value = invoiceNo;

    if (supplierDisplay) supplierDisplay.textContent = supplierNameInput.value;
    if (invoiceDisplay) invoiceDisplay.textContent = invoiceNo;
  });

  // Handle form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData();

    formData.append('supplierName', supplierNameInput.value.trim());
    formData.append('supplierEmail', supplierEmailInput.value.trim());
    formData.append('supplierPhone', supplierPhone.value.trim());
    formData.append('purchaseId', purchaseId.value.trim());
    formData.append('supplierId', employer.value.trim());
    formData.append('invoiceNo', invoiceNoInput.value.trim());
    formData.append('paymentMethod', paymentMethod.value.trim());
    formData.append('totalBill', totalBill.textContent.trim());

    // Add product data
    const names = document.getElementsByName('productName[]');
    const colors = document.getElementsByName('productColor[]');
    const sizes = document.getElementsByName('productSize[]');
    const qtys = document.getElementsByName('productQty[]');
    const prices = document.getElementsByName('productPrice[]');

    for (let i = 0; i < names.length; i++) {
      formData.append('productName[]', names[i].value.trim());
      formData.append('productColor[]', colors[i].value.trim());
      formData.append('productSize[]', sizes[i].value.trim());
      formData.append('productQty[]', qtys[i].value.trim());
      formData.append('productPrice[]', prices[i].value.trim());
    }

    // Submit to PHP
    fetch('php/addPurchase.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(result => {
      alert('Form submitted successfully!\n' + result);
      form.reset();
      totalBill.textContent = "0.00";
      if (supplierDisplay) supplierDisplay.textContent = '';
      if (invoiceDisplay) invoiceDisplay.textContent = '';
    })
    .catch(error => {
      alert('Form submission failed.\n' + error);
    });
  });

  attachListeners();
});