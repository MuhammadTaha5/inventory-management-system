document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("addProductForm");
  const productNameInput = document.querySelector("input[name='productName']");
  const productIdInput = document.querySelector("input[name='productId']");
  const categorySelect = document.querySelector("select[name='category']");
  const styleSelect = document.querySelector("select[name='style']");
  const sizeSelect = document.querySelector("select[name='size']");
  const colorInput = document.querySelector("input[name='color']");
  const totalProducts = document.getElementById("totalProducts");
  let allProducts = []; // Store all products fetched from PHP

  // Define fetchAndDisplayProducts function
  function fetchAndDisplayProducts() {
    fetch('Php/fetch_products.php')
      .then(response => response.json())
      .then(json => {
        const size = json.size;
        const data = json.data;
        allProducts = data;
        totalProducts.innerHTML = `${size}`;
        updateProductTable(data);
      })
      .catch(err => {
        console.error("Error fetching product data:", err);
        alert("Failed to load products from server.");
      });
  }

  // Call it initially
  fetchAndDisplayProducts();

  // Search filtering
  document.getElementById('searchProduct').addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
      product.productName.toLowerCase().includes(searchTerm) ||
      product.productId.toLowerCase().includes(searchTerm) ||
      product.size.toLowerCase().includes(searchTerm) ||
      product.color.toLowerCase().includes(searchTerm) ||
      product.status.toLowerCase().includes(searchTerm)
    );
    updateProductTable(filteredProducts);
  });

document.getElementById("categorySelect").addEventListener("change", function () {
  const selectedCategory = this.value.toLowerCase();

  if (selectedCategory === "all") {
    updateProductTable(allProducts);
  } else {
    const filteredProducts = allProducts.filter(p => p.category.toLowerCase() === selectedCategory);
    updateProductTable(filteredProducts);
  }
});


  // Other existing code (styles update, updateProductIdPrefix, updateProductTable, modal handlers, etc.)

const stylesByCategory = {
  Jackets: ["Bomber", "Leather", "Denim"],
  Shirts: ["Polo", "Casual", "Dress"],
  Pants: ["Jeans", "Chinos", "Joggers"]
};

categorySelect.addEventListener("change", function () {
  const selectedCategory = categorySelect.value;
  const styles = stylesByCategory[selectedCategory] || [];

  // Update the main styleSelect (if you have one in the base form)
  styleSelect.innerHTML = "";
  styles.forEach(style => {
    const option = document.createElement("option");
    option.text = style;
    option.value = style;
    styleSelect.appendChild(option);
  });

  // Update all variant style dropdowns
  const allStyleSelects = document.querySelectorAll('select[name="style[]"]');
  allStyleSelects.forEach(select => {
    const currentValue = select.value; // Keep previous selection if possible
    select.innerHTML = "";
    styles.forEach(style => {
      const option = document.createElement("option");
      option.text = style;
      option.value = style;
      if (style === currentValue) option.selected = true;
      select.appendChild(option);
    });
  });

  updateProductIdPrefix();
});


document.getElementById('addVariantBtn').addEventListener('click', () => {
  const selectedCategory = categorySelect.value;
  const styles = stylesByCategory[selectedCategory] || [];
  const styleOptionsHTML = styles.map(style => `<option value="${style}">${style}</option>`).join("");

  const variantHTML = `
    <div class="variantRow" style="margin-bottom: 10px;">
      <select name="size[]" required>
        <option value="S">S</option>
        <option value="M" selected>M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
      </select>
      <input type="text" name="color[]" placeholder="Color" required />
      <select name="style[]" required>
        ${styleOptionsHTML}
      </select>
      <input type="number" name="price[]" placeholder="Price" required />
      <select name="status[]" required>
        <option value="Active">Active</option>
        <option value="Draft">Draft</option>
      </select>
      <button type="button" class="removeVariantBtn">Remove</button>
    </div>
  `;
  const container = document.getElementById('variantContainer');
  container.insertAdjacentHTML('beforeend', variantHTML);
});


  productNameInput.addEventListener("input", updateProductIdPrefix);

  function updateProductIdPrefix() {
    const name = productNameInput.value.trim().toUpperCase().slice(0, 2);
    const category = categorySelect.value.trim().toUpperCase().slice(0, 2);
    productIdInput.value = name + category;
  }

  function updateProductTable(products) {
    const tbody = document.querySelector('.product-table tbody');
    tbody.innerHTML = '';
    products.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="product-name">${product.productName.toUpperCase()}</div>
          <span class="sku">${product.productId}</span>
        </td>
        <td>${product.size}</td>
        <td>${product.color.toUpperCase()}</td>
        <td>$${parseFloat(product.price).toFixed(2)}</td>
        <td>${product.products}</td>
        <td><span class="status-text ${product.status.toLowerCase()}">${product.status}</span></td>
        <td>${product.category}</td>
        <td>
          <button class="edit-btn"><i class="fas fa-pen"></i> Edit</button>
          <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }


  // Modal handlers
  document.querySelector('.btn-add').addEventListener('click', () => {
    editingRow = null;
    form.reset();
    document.getElementById('addProductModal').classList.add('active');
  });

  document.getElementById('addProductClose').addEventListener('click', () => {
    document.getElementById('addProductModal').classList.remove('active');
  });

  window.addEventListener('click', e => {
    if (e.target.id === 'addProductModal') {
      e.target.classList.remove('active');
    }
  });

// Remove variant row
document.getElementById('variantContainer').addEventListener('click', function (e) {
  if (e.target.classList.contains('removeVariantBtn')) {
    e.target.closest('.variantRow').remove();
  }
});
  form.addEventListener('submit', function (e) {
  e.preventDefault();

  const formData = new FormData(form);

  const isEditing = editingRow !== null;
  formData.append('editing', isEditing ? 'true' : 'false');

  const productIdVal = productIdInput.value.trim();
  const productNameVal = productNameInput.value.trim();
  const categoryVal = categorySelect.value;

  // Add basic fields explicitly if needed
  formData.set('productId', productIdVal);
  formData.set('productName', productNameVal);
  formData.set('category', categoryVal);

  const variantRows = document.querySelectorAll('#variantContainer .variantRow');
  variantRows.forEach((row, index) => {
    const size = row.querySelector('[name="size[]"]').value;
    const color = row.querySelector('[name="color[]"]').value;
    const style = row.querySelector('[name="style[]"]').value;

    const colorInitial = color.trim().toUpperCase().slice(0, 1);
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const variantId = productIdVal + size + colorInitial + randomNum;

    // Instead of nesting in variants[x], just add hidden inputs dynamically
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'variantId[]';
    input.value = variantId;
    form.appendChild(input);
  });

  fetch(isEditing ? 'Php/EditProduct.php' : 'Php/product_Detail.php', {
    method: 'POST',
    body: formData
  })
    .then(response => response.text())
    .then(text => {
      console.log("RAW RESPONSE FROM PHP:", text);
      try {
        const data = JSON.parse(text);
        if (data.success) {
          alert('Product ' + (isEditing ? 'updated' : 'added') + ' successfully!');
          form.reset();
          document.getElementById('addProductModal').classList.remove('active');
          editingRow = null;
          fetchAndDisplayProducts();
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Invalid JSON from server:', text);
        alert('Error: Server did not return valid JSON.');
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      alert('Fetch failed:\n' + error.message);
    });
});

document.querySelector('.product-table tbody').addEventListener('click', function (e) {
  if (e.target.closest('.edit-btn')) {
    // Get the row that was clicked
    const row = e.target.closest('tr');
    editingRow = row;  // Store for future update (optional)

    // Extract product details from the row
    const name = row.querySelector('.product-name').textContent.trim();       // Product name
    const sku = row.querySelector('.sku').textContent.trim();                 // Product ID
    const size = row.children[1].textContent.trim();                          // Size
    const color = row.children[2].textContent.trim();                         // Color
    const price = row.children[3].textContent.replace('$', '').trim();        // Price (remove $)
    const status = row.children[5].textContent.trim();                        // Status
    const category = row.children[6].textContent.trim();                      // Category

    // Populate form fields
    productNameInput.value = name;
    productIdInput.value = sku;
    sizeSelect.value = size;
    colorInput.value = color;
    document.querySelector('[name="price"]').value = price;
    document.querySelector('[name="status"]').value = status;
    categorySelect.value = category;

    // Trigger style dropdown update based on category
    const styles = stylesByCategory[category] || [];
    styleSelect.innerHTML = "";
    styles.forEach(style => {
      const option = document.createElement("option");
      option.text = style;
      option.value = style;
      styleSelect.appendChild(option);
    });

    // Show the modal
    document.getElementById('addProductModal').classList.add('active');
  }
});

  // Optional: Delete button
  document.querySelector('.product-table tbody').addEventListener('click', function (e) {
    if (e.target.closest('.delete-btn')) {
  const row = e.target.closest('tr');
  const productId = row.querySelector('.sku').textContent.trim();

  if (confirm(`Are you sure you want to delete product ${productId}?`)) {
    fetch('Php/deleteProduct.php', {
      method: 'POST',
      body: new URLSearchParams({ productId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        fetchAndDisplayProducts(); // refresh the table
      } else {
        throw new Error(data.error || 'Unknown deletion error');
      }
    })
    .catch(err => {
      console.error("Delete failed:", err);
      alert("Failed to delete product:\n" + err.message);
    });
  }
}

  });
});

document.addEventListener('DOMContentLoaded', function () {
  // 1) Toggle Sidebar “Metrics” Submenu
  const dropdownTriggers = document.querySelectorAll('.sidebar__dropdown > .sidebar__link');
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent jump to “#”
      const parentLi = this.parentElement; // <li class="sidebar__dropdown">
      parentLi.classList.toggle('open');
    });
  });

  // 2) Highlight Active Sidebar Link Based on URL
  const sidebarLinks = document.querySelectorAll('.sidebar__menu a');
  const currentPath = window.location.pathname; 
  sidebarLinks.forEach(link => {
    // Compare only the pathname (ignore query strings)
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath) {
      link.classList.add('active');
      // If this link is in a submenu, open its parent dropdown
      const parentLi = link.closest('li');
      const parentDropdown = parentLi.closest('.sidebar__dropdown');
      if (parentDropdown) {
        parentDropdown.classList.add('open');
      }
    }
  });
});
