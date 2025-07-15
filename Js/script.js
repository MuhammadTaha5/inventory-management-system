// ================== Render Overview Cards ==================
function renderOverviewCard(data) {
  const card = document.createElement('div');
  card.className = 'overview-card';
  const changeHtml = data.change
    ? `<div class="change">
         <span class="percentage ${data.changeDirection}">
           ${data.change}${data.changeDirection === 'up' ? ' ▲' : ' ▼'}
         </span>
         <span class="change-period">${data.changePeriod}</span>
       </div>`
    : '';
  card.innerHTML = `
    <div class="card-header">
      <div class="icon-wrapper"><i class="${data.iconClass}"></i></div>
      <div class="title">${data.title}</div>
    </div>
    <div class="card-body">
      <div class="metric">
        <span class="label">${data.periodLabel}</span>
        <span class="value">${data.value}</span>
      </div>
      ${changeHtml}
    </div>
  `;
  return card;
}

// ================== On Page Load ==================
document.addEventListener('DOMContentLoaded', () => {
  // Render Overview Cards
  // Overview cards data structure
  const cardsData = [
    {
      iconClass: 'ri-shopping-cart-2-line',
      title: 'Total Sales',
      periodLabel: 'This Month',
      value: '$56030',
      change: '0%',
      changeDirection: 'up',
      changePeriod: 'Previous Month'
    },
    {
      iconClass: 'ri-archive-2-line',
      title: 'Inventory in Stock',
      periodLabel: 'As of Today',
      value: '18,240 units',
      change: '1.5%',
      changeDirection: 'down',
      changePeriod: 'Last Week'
    },
    {
      iconClass: 'ri-alert-line',
      title: 'Low Stock Items',
      periodLabel: 'Critical Level',
      value: '37 Variants',
      change: '',
      changeDirection: '',
      changePeriod: ''
    },
    {
      iconClass: 'ri-user-line',
      title: 'New Customers',
      periodLabel: 'This Month',
      value: '142',
      change: '8%',
      changeDirection: 'up',
      changePeriod: 'Previous Month'
    }
  ];

  // Render the cards into a container with class 'summary-cards'
  function renderOverviewCards() {
    const container = document.querySelector(".summary-cards");
    container.innerHTML = ""; // Clear existing cards

    cardsData.forEach(card => {
      const changeIcon = card.changeDirection === "up" ? "▲" :
                         card.changeDirection === "down" ? "▼" : "";
      const changeColor = card.changeDirection === "up" ? "green" :
                          card.changeDirection === "down" ? "red" : "gray";

      const cardHTML = `
        <div class="card">
          <div class="card-icon"><i class="${card.iconClass}"></i></div>
          <div class="card-info">
            <div class="card-title">${card.title}</div>
            <div class="card-value">${card.value}</div>
            <div class="card-meta">
              <span>${card.periodLabel}</span>
              ${card.change ? `<span style="color: ${changeColor};">(${changeIcon} ${card.change} from ${card.changePeriod})</span>` : ''}
            </div>
          </div>
        </div>
      `;
      container.innerHTML += cardHTML;
    });
  }

  // Fetch total sales via AJAX
  $(document).ready(function () {
    $.ajax({
      url: "php/getSalesData.php",
      type: "GET",
      dataType: "json",
      success: function (data) {
        const totalSales = parseFloat(data.summary.total_sales);
        cardsData[0].value = "PKR " + totalSales.toLocaleString();

        // Example hardcoded change
        cardsData[0].change = "12%";
        cardsData[0].changeDirection = "up";
        cardsData[0].changePeriod = "Previous Month";

        renderOverviewCards(); // Re-render with updated data
      },
      error: function (xhr, status, error) {
        console.error("Failed to load sales summary:", error);
      }
    });

    // Initial render with loading placeholders
    renderOverviewCards();
  });
  const overviewContainer = document.getElementById('overview-card-container');
  cardsData.forEach(cd => overviewContainer.appendChild(renderOverviewCard(cd)));

  // Inventory Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn =>
    btn.addEventListener('click', () =>
      alert('Filter / period clicked! Attach your logic here.')
    )
  );
// Fetch inventory data with filters
function fetchInventoryData() {
    const category = document.getElementById('inventory-category')?.value || '';
    const size = document.getElementById('inventory-size')?.value || '';

    const url = `php/get_inventory.php?category=${encodeURIComponent(category)}&size=${encodeURIComponent(size)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateInventoryStatusTable(data);
            showToast(`Loaded ${data.length} inventory records`);
        })
        .catch(error => {
            console.error('Error fetching inventory:', error);
            showToast('Failed to load inventory data');
        });
}
function updateInventoryStatusTable(data) {
    const tbody = document.getElementById('inventory-data');
    tbody.innerHTML = ''; // Clear previous rows

    data.forEach(item => {
        const totalStock = parseInt(item.totalStock);
        const statusText = totalStock > 100
            ? 'Sufficient'
            : totalStock > 0
            ? 'Low Stock'
            : 'Out of Stock';

        const statusClass = totalStock > 100
            ? 'normal'
            : totalStock > 0
            ? 'low'
            : 'out';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productId}</td>
            <td>${item.productName}</td>
            <td>${item.category}</td>
            <td>${totalStock}</td>
            <td>-</td> <!-- Reorder level not present in your data -->
            <td><span class="stock-status ${statusClass}">${statusText}</span></td>
            <td><a href="#">View Details</a></td>
        `;
        tbody.appendChild(row);
    });
}
  // ========== Sales Overview Chart ==========
  fetch('php/fetchSales.php')
    .then(response => response.json())
    .then(data => {
      const labels = data.map(item =>
        new Date(item.sale_day).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      );
      const totals = data.map(item => item.total_sales);

      new Chart(document.getElementById('salesOverviewChart'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Total Sales (PKR)',
            data: totals,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Sales Overview (Last 5 Days)'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    });

  // ========== Top Selling Items Chart ==========
fetch('php/fetchTopSelling.php')
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);

    const labels = data.map(item => item.product_name);
    const quantities = data.map(item => item.total_quantity);

    new Chart(document.getElementById('topSellingChart'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Top Selling',
          data: quantities,
          backgroundColor: 'rgba(76,81,191,0.7)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top 5 Selling Products' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  })
  .catch(err => console.error('Failed to load top selling data:', err));
fetch('php/LatestPurchases.php')
  .then(response => response.json())
  .then(data => {
    const tbody = document.getElementById('latestPurchasesBody');
    tbody.innerHTML = '';

    data.forEach(purchase => {
      const quantity = parseFloat(purchase.quantity) || 0;
      const costPrice = parseFloat(purchase.costPrice) || 0;
      const totalCost = quantity * costPrice;

      const row = `
        <tr>
          <td>${purchase.supplierName}</td>
          <td>${purchase.productName}</td>
          <td>${quantity}</td>
          <td>${new Date(purchase.purchaseDate).toLocaleDateString()}</td>
          <td>$${totalCost.toFixed(2)}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  })
  .catch(error => {
    console.error('Error loading latest purchases:', error);
  });
  // ========== Inventory Distribution Chart ==========
  new Chart(document.getElementById('inventoryDistChart'), {
    type: 'bar',
    data: {
      labels: ['2021', '2022', '2023', '2024'],
      datasets: [
        { label: 'Raw Materials', data: [2.5, 3.1, 4.0, 1.8], backgroundColor: 'rgba(76,81,191,0.7)' },
        { label: 'Finished Goods', data: [2.2, 2.3, 3.5, 0.6], backgroundColor: 'rgba(99,179,237,0.7)' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          ticks: {
            callback: val => val + 'M'
          }
        }
      }
    }
  });
});

// ================== UI Interactions ==================

// Dropdown Filter Logging
document.querySelectorAll('.filter-bar select').forEach(sel =>
  sel.addEventListener('change', e => {
    console.log(
      e.target.previousElementSibling.textContent,
      e.target.value
    );
  })
);

// Edit / Delete Buttons
document.querySelectorAll('.edit-btn').forEach(btn =>
  btn.addEventListener('click', () => console.log('Edit clicked'))
);
document.querySelectorAll('.delete-btn').forEach(btn =>
  btn.addEventListener('click', () => console.log('Delete clicked'))
);

// Modal Open
document.querySelector('.btn-add')?.addEventListener('click', () => {
  document.getElementById('addProductModal')?.classList.add('active');
});

// Modal Close
document.getElementById('addProductClose')?.addEventListener('click', () => {
  document.getElementById('addProductModal')?.classList.remove('active');
});

// Click Outside to Close Modal
window.addEventListener('click', e => {
  if (e.target.id === 'addProductModal') {
    e.target.classList.remove('active');
  }
});

// Form Submission
document.getElementById('addProductForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  console.log('New product:', data);
  alert('Product saved!');
  e.target.reset();
  document.getElementById('addProductModal')?.classList.remove('active');
});
