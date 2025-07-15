
    
document.addEventListener('DOMContentLoaded', function() {
            // sales-report.js
// sales-report.js

// Set default date range to last month
let today = new Date().toISOString().split('T')[0];
let lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
let oneMonthAgo = lastMonth.toISOString().split('T')[0];

document.getElementById('sales-start-date').value = oneMonthAgo;
document.getElementById('sales-end-date').value = today;

const salesCtx = document.getElementById('salesChart').getContext('2d');
let salesChart;

function initializeSalesChart(labels = [], data = []) {
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales ($)',
                data: data,
                backgroundColor: 'rgba(123, 44, 191, 0.2)',
                borderColor: 'rgba(123, 44, 191, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function fetchSalesReport(startDate, endDate, minAmount = '') {
    $.ajax({
        url: 'php/sales-report.php',
        method: 'GET',
        dataType: 'json',
        data: {
            start: startDate,
            end: endDate,
            amount: minAmount
        },
        success: function (data) {
            const tbody = document.getElementById('sales-data');
            tbody.innerHTML = '';
            const chartDataMap = {}; // { '2025-06-01': amount }

            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.sale_id}</td>
                    <td>${row.customer_name}</td>
                    <td>${row.total_quantity}</td>
                    <td>${row.total_amount}</td>
                    <td>${row.discount}</td>
                    <td>${row.final_amount}</td>
                    <td>${row.payment_method}</td>
                    <td>${row.sale_date}</td>
                `;
                tbody.appendChild(tr);

                const saleDate = row.sale_date.split(' ')[0];
                chartDataMap[saleDate] = (chartDataMap[saleDate] || 0) + parseFloat(row.final_amount);
            });

            // Sort and update chart
            const labels = Object.keys(chartDataMap).sort();
            const values = labels.map(label => chartDataMap[label]);
            initializeSalesChart(labels, values);
        },
        error: function (xhr, status, error) {
    console.error("XHR:", xhr);
    console.error("Status:", status);
    console.error("Error:", error);
    alert('Error loading sales data: ' + error);
}

    });
}

// Button Events
const salesShowTableBtn = document.getElementById('sales-show-table-btn');
const salesShowGraphBtn = document.getElementById('sales-show-graph-btn');
const salesTableContainer = document.getElementById('sales-table-container');
const salesGraphContainer = document.getElementById('sales-graph-container');

salesShowTableBtn.addEventListener('click', function () {
    salesTableContainer.style.display = 'block';
    salesGraphContainer.style.display = 'none';
    salesShowTableBtn.classList.add('active');
    salesShowGraphBtn.classList.remove('active');
});

salesShowGraphBtn.addEventListener('click', function () {
    salesTableContainer.style.display = 'none';
    salesGraphContainer.style.display = 'block';
    salesShowGraphBtn.classList.add('active');
    salesShowTableBtn.classList.remove('active');
});

// Apply Filter Button
const applyFiltersBtn = document.getElementById('sales-apply-filters-btn');
applyFiltersBtn.addEventListener('click', function () {
    const startDate = document.getElementById('sales-start-date').value;
    const endDate = document.getElementById('sales-end-date').value;
    const amountFilter = document.getElementById('sales-amount').value;

    fetchSalesReport(startDate, endDate, amountFilter);
});

// Load initial chart and table on page load
window.addEventListener('DOMContentLoaded', function () {
    const startDate = document.getElementById('sales-start-date').value;
    const endDate = document.getElementById('sales-end-date').value;
    const amountFilter = document.getElementById('sales-amount').value;

    fetchSalesReport(startDate, endDate, amountFilter);
});

// purchaseReport.js

$(document).ready(function () {
  const purchasesTableBody = $('#purchases-data');
  const supplierFilter = $('#purchases-supplier');
  const startDateInput = $('#purchases-start-date');
  const endDateInput = $('#purchases-end-date');
  const applyFiltersBtn = $('#purchases-apply-filters-btn');
  const purchasesTableContainer = $('#purchases-table-container');
  const purchasesGraphContainer = $('#purchases-graph-container');
  const showTableBtn = $('#purchases-show-table-btn');
  const showGraphBtn = $('#purchases-show-graph-btn');

  let purchasesChart = null;

  function fetchPurchases() {
    const startDate = startDateInput.val();
    const endDate = endDateInput.val();
    const supplier = supplierFilter.val();

    $.ajax({
      url: 'php/purchaseReport.php',
      type: 'GET',
      dataType: 'json',
      data: { startDate, endDate, supplier },
      success: function (response) {
        if (response.success) {
          renderTable(response.data);
          renderChart(response.data);
        } else {
          console.error('Error from server:', response.error);
        }
      },
      error: function (xhr, status, error) {
        console.error('Error fetching purchase data:', error);
      }
    });
  }

 function renderTable(data) {
  purchasesTableBody.empty();
  data.forEach(row => {
    const formattedProducts = row.product_summary
      ? row.product_summary.split(', ').map(item => `<div>${item}</div>`).join('')
      : 'N/A';

    const tr = $(`
      <tr>
        <td>PO-${row.purchase_id}</td>
        <td>${row.supplier_name}</td>
        <td>${formattedProducts}</td>
        <td>$${parseFloat(row.total_cost).toFixed(2)}</td>
        <td>${row.payment_method || 'N/A'}</td>
        <td>${row.purchase_date}</td>
        <td><span class="status ${row.status ? row.status.toLowerCase() : 'na'}">
          ${row.status || 'N/A'}
        </span></td>
      </tr>
    `);
    purchasesTableBody.append(tr);
  });
}


  function renderChart(data) {
    const labels = data.map(row => `PO-${row.purchase_id}`);
    const totalCosts = data.map(row => parseFloat(row.total_cost));

    if (purchasesChart) purchasesChart.destroy();

    const ctx = document.getElementById('purchasesChart').getContext('2d');
    purchasesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Cost',
          data: totalCosts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Purchase Summary by Purchase Order' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '$' + value;
              }
            }
          }
        }
      }
    });
  }

  // Event Listeners
  applyFiltersBtn.on('click', fetchPurchases);
  showTableBtn.on('click', function () {
    showTableBtn.addClass('active');
    showGraphBtn.removeClass('active');
    purchasesTableContainer.show();
    purchasesGraphContainer.hide();
  });
  showGraphBtn.on('click', function () {
    showGraphBtn.addClass('active');
    showTableBtn.removeClass('active');
    purchasesTableContainer.hide();
    purchasesGraphContainer.show();
  });

  // Initial load
  fetchPurchases();
  purchasesTableContainer.show();
  purchasesGraphContainer.hide();
});

            // Export sales to PDF functionality
            document.getElementById('sales-pdf-btn').addEventListener('click', function() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Add title
                doc.setFontSize(18);
                doc.text('ClosetStock Sales Report', 14, 15);
                
                // Add date
                doc.setFontSize(12);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
                
                // Get table HTML
                const table = document.getElementById('sales-table');
                
                // Add table to PDF
                doc.autoTable({
                    html: table,
                    startY: 30,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [123, 44, 191],
                        textColor: 255
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 10,
                        valign: 'middle'
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 'auto' },
                        3: { cellWidth: 'auto' },
                        4: { cellWidth: 'auto' },
                        5: { cellWidth: 'auto' },
                        6: { cellWidth: 'auto' },
                        7: { cellWidth: 'auto' }
                    },
                    margin: { top: 30 }
                });
                
                // Save the PDF
                doc.save('ClosetStock_Sales_Report.pdf');
                showToast('Sales PDF exported successfully');
            });

            // Export purchases to PDF functionality
            document.getElementById('purchases-pdf-btn').addEventListener('click', function() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Add title
                doc.setFontSize(18);
                doc.text('ClosetStock Purchase Report', 14, 15);
                
                // Add date
                doc.setFontSize(12);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
                
                // Get table HTML
                const table = document.getElementById('purchases-table');
                
                // Add table to PDF
                doc.autoTable({
                    html: table,
                    startY: 30,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [123, 44, 191],
                        textColor: 255
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 10,
                        valign: 'middle'
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 'auto' },
                        3: { cellWidth: 'auto' },
                        4: { cellWidth: 'auto' },
                        5: { cellWidth: 'auto' },
                        6: { cellWidth: 'auto' },
                        7: { cellWidth: 'auto' },
                        8: { cellWidth: 'auto' }
                    },
                    margin: { top: 30 }
                });
                
                // Save the PDF
                doc.save('ClosetStock_Purchase_Report.pdf');
                showToast('Purchase PDF exported successfully');
            });

            // Export sales to Excel functionality
            document.getElementById('sales-excel-btn').addEventListener('click', function() {
                const table = document.getElementById('sales-table');
                const workbook = XLSX.utils.table_to_book(table);
                XLSX.writeFile(workbook, 'ClosetStock_Sales_Report.xlsx');
                showToast('Sales Excel file exported successfully');
            });

            // Export purchases to Excel functionality
            document.getElementById('purchases-excel-btn').addEventListener('click', function() {
                const table = document.getElementById('purchases-table');
                const workbook = XLSX.utils.table_to_book(table);
                XLSX.writeFile(workbook, 'ClosetStock_Purchase_Report.xlsx');
                showToast('Purchase Excel file exported successfully');
            });

            // Print functionality
            document.getElementById('sales-print-btn').addEventListener('click', function() {
                window.print();
            });

            document.getElementById('purchases-print-btn').addEventListener('click', function() {
                window.print();
            });
// Fetch inventory data with filters
function fetchInventoryData() {
    const category = document.getElementById('inventory-category').value;
    const size = document.getElementById('inventory-size').value;
    
    const url = `php/get_inventory.php?category=${encodeURIComponent(category)}&size=${encodeURIComponent(size)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateInventoryTable(data);
            showToast(`Loaded ${data.length} records`);
        })
        .catch(error => {
            console.error('Error fetching inventory:', error);
            showToast('Failed to load inventory data');
        });
}

// Update the inventory table with data from backend
function updateInventoryTable(data) {
    const tbody = document.getElementById('inventory-data');
    tbody.innerHTML = '';

    data.forEach(item => {
        const statusText = item.totalStock > 100
            ? 'In Stock'
            : item.totalStock > 0
            ? 'Low Stock'
            : 'Out of Stock';

        const statusClass = item.totalStock > 10
            ? 'in-stock'
            : item.totalStock > 0
            ? 'low-stock'
            : 'out-of-stock';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productId}</td>
            <td>${item.productName}</td>
            <td>${item.category}</td>
            <td colspan="3">${item.variants.replace(/,\s*/g, '<br>')}</td>

            <td>${item.totalStock}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${item.lastUpdated}</td>
        `;
        tbody.appendChild(row);
    });
}

// Bind filter button
document.getElementById('inventory-apply-filters-btn').addEventListener('click', fetchInventoryData);

// Export inventory to PDF
document.getElementById('inventory-pdf-btn').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('ClosetStock Inventory Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const table = document.getElementById('inventory-table');
    doc.autoTable({
        html: table,
        startY: 30,
        theme: 'grid',
        headStyles: {
            fillColor: [123, 44, 191],
            textColor: 255
        },
        styles: {
            cellPadding: 3,
            fontSize: 10,
            valign: 'middle'
        },
        margin: { top: 30 }
    });

    doc.save('ClosetStock_Inventory_Report.pdf');
    showToast('Inventory PDF exported successfully');
});

// Export inventory to Excel
document.getElementById('inventory-excel-btn').addEventListener('click', function () {
    const table = document.getElementById('inventory-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'ClosetStock_Inventory_Report.xlsx');
    showToast('Inventory Excel file exported successfully');
});

// Print functionality
document.getElementById('inventory-print-btn').addEventListener('click', function () {
    window.print();
});

// Optionally fetch data on page load
window.addEventListener('DOMContentLoaded', fetchInventoryData);

// Toast Notification Function (you may already have this)
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Elements
const categorySelect = document.getElementById('low-stock-category');
const severitySelect = document.getElementById('low-stock-severity');
const applyFilterBtn = document.getElementById('low-stock-apply-filters-btn');

// Apply Filters
applyFilterBtn.addEventListener('click', () => {
    const category = categorySelect.value;
    const severity = severitySelect.value;

    fetch('php/low_stock_report.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category, severity })
    })
    .then(res => res.json())
    .then(data => {
        updateLowStockTable(data);
        showToast(`Filters applied: ${data.length} result(s) found.`);
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        showToast('Failed to load data.');
    });
});

// Table Update
function updateLowStockTable(data) {
    const tbody = document.getElementById('low-stock-data');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.stock}</td>
            <td>${item.reorderLevel}</td>
            <td>${item.stockPercentage}%</td>
            <td><span class="status ${item.status}">${item.status === 'critical' ? 'Critical' : 'Warning'}</span></td>
            <td>${item.lastOrdered || 'N/A'}</td>
            <td>
                <button class="btn btn-outline btn-sm reorder-btn" data-id="${item.id}">
                    <i class="fas fa-shopping-cart"></i> Reorder
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Reorder button logic
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.getAttribute('data-id');
            showToast(`Reorder request sent for product ${productId}`);
        });
    });
}

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Export PDF
document.getElementById('low-stock-pdf-btn').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ClosetStock Low Stock Alerts', 14, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    doc.autoTable({
        html: '#low-stock-table',
        startY: 30,
        theme: 'grid',
        headStyles: {
            fillColor: [44, 62, 80],
            textColor: 255
        },
        styles: {
            fontSize: 10,
            valign: 'middle'
        },
        margin: { top: 30 }
    });

    doc.save('ClosetStock_Low_Stock_Alerts.pdf');
    showToast('PDF exported');
});
document.getElementById('low-stock-print-btn').addEventListener('click', function () {
    const reportContent = document.getElementById('low-stock-report').innerHTML;

    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
        <html>
            <head>
                <title>Low Stock Report</title>
                <link rel="stylesheet" href="styles.css"> <!-- Link your CSS file -->
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .status.critical { color: red; font-weight: bold; }
                    .status.warning { color: orange; font-weight: bold; }
                </style>
            </head>
            <body>
                ${reportContent}
                <script>
                    window.onload = function () {
                        window.print();
                        window.onafterprint = function () {
                            window.close();
                        };
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
});


// Export Excel
document.getElementById('low-stock-excel-btn').addEventListener('click', () => {
    const table = document.getElementById('low-stock-table');
    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Low Stock' });
    XLSX.writeFile(workbook, 'ClosetStock_Low_Stock_Alerts.xlsx');
    showToast('Excel file exported');
});

// Function to fetch and load records (used on load and on filter)
function loadLowStockData() {
    const category = categorySelect.value;
    const severity = severitySelect.value;

    fetch('php/low_stock_report.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category, severity })
    })
    .then(res => res.json())
    .then(data => {
        updateLowStockTable(data);
        showToast(`Loaded ${data.length} low stock record(s)`);
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        showToast('Error loading data');
    });
}

// Call function on page load
window.addEventListener('DOMContentLoaded', loadLowStockData);

// Also call it when filter is clicked
applyFilterBtn.addEventListener('click', loadLowStockData);

// Sample data for profit & loss report
const sampleProfitLossData = {
    summary: {
        revenue: 12450.00,
        cogs: 7200.00,
        expenses: 2800.00,
        netProfit: 2450.00,
        revenueChange: 12,
        cogsChange: -8,
        expensesChange: 5,
        profitChange: 20
    },
    chartData: {
        labels: ['Revenue', 'COGS', 'Expenses', 'Net Profit'],
        data: [12450, 7200, 2800, 2450],
        colors: ['#4cc9f0', '#f72585', '#9d4edd', '#2ec4b6']
    }
};

// Initialize Profit & Loss Chart
function initProfitLossChart() {
    const ctx = document.getElementById('profitLossChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sampleProfitLossData.chartData.labels,
            datasets: [{
                data: sampleProfitLossData.chartData.data,
                backgroundColor: sampleProfitLossData.chartData.colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Profit & Loss filter functionality
document.getElementById('profit-loss-period').addEventListener('change', function() {
    const customRange = document.getElementById('profit-loss-custom-range');
    if (this.value === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
    }
});

document.getElementById('profit-loss-apply-filters-btn').addEventListener('click', function() {
    const period = document.getElementById('profit-loss-period').value;
    const view = document.getElementById('profit-loss-view').value;
    let message = `Showing ${view} view for ${period}`;
    
    if (period === 'custom') {
        const startDate = document.getElementById('profit-loss-start-date').value;
        const endDate = document.getElementById('profit-loss-end-date').value;
        message += ` (${startDate} to ${endDate})`;
    }
    
    showToast(message);
});

// Export profit & loss to PDF functionality
document.getElementById('profit-loss-pdf-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('ClosetStock Profit & Loss Statement', 14, 15);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Get table HTML
    const table = document.getElementById('profit-loss-summary-table');
    
    // Add table to PDF
    doc.autoTable({
        html: table,
        startY: 30,
        theme: 'grid',
        headStyles: {
            fillColor: [123, 44, 191],
            textColor: 255
        },
        styles: {
            cellPadding: 3,
            fontSize: 10,
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' }
        },
        margin: { top: 30 }
    });
    
    // Save the PDF
    doc.save('ClosetStock_Profit_Loss.pdf');
    showToast('Profit & Loss PDF exported successfully');
});

// Export profit & loss to Excel functionality
document.getElementById('profit-loss-excel-btn').addEventListener('click', function() {
    const table = document.getElementById('profit-loss-summary-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'ClosetStock_Profit_Loss.xlsx');
    showToast('Profit & Loss Excel file exported successfully');
});

// Print functionality
document.getElementById('profit-loss-print-btn').addEventListener('click', function() {
    window.print();
});

// Initialize the chart when DOM is loaded
initProfitLossChart();
            // Show toast notification
            function showToast(message) {
                const toast = document.createElement('div');
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.right = '20px';
                toast.style.backgroundColor = '#5a189a';
                toast.style.color = 'white';
                toast.style.padding = '12px 20px';
                toast.style.borderRadius = '4px';
                toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                toast.style.zIndex = '1000';
                toast.style.transition = 'all 0.3s ease';
                toast.style.transform = 'translateY(20px)';
                toast.style.opacity = '0';
                toast.textContent = message;
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.transform = 'translateY(0)';
                    toast.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    toast.style.transform = 'translateY(20px)';
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(toast);
                    }, 300);
                }, 3000);
            }
            // Top Selling Products Report Functionality
document.getElementById('top-products-period').addEventListener('change', function() {
    const customRange = document.getElementById('top-products-custom-range');
    if (this.value === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
    }
});

// View Toggle
document.getElementById('top-products-show-table-btn').addEventListener('click', function() {
    document.getElementById('top-products-table-container').style.display = 'block';
    document.getElementById('top-products-chart-container').style.display = 'none';
    this.classList.add('active');
    document.getElementById('top-products-show-chart-btn').classList.remove('active');
});

document.getElementById('top-products-show-chart-btn').addEventListener('click', function() {
    document.getElementById('top-products-table-container').style.display = 'none';
    document.getElementById('top-products-chart-container').style.display = 'block';
    this.classList.add('active');
    document.getElementById('top-products-show-table-btn').classList.remove('active');
});

// Chart Type Toggle
document.getElementById('top-products-chart-bar-btn').addEventListener('click', function() {
    updateTopProductsChart('bar');
    this.classList.add('active');
    document.getElementById('top-products-chart-pie-btn').classList.remove('active');
});

document.getElementById('top-products-chart-pie-btn').addEventListener('click', function() {
    updateTopProductsChart('pie');
    this.classList.add('active');
    document.getElementById('top-products-chart-bar-btn').classList.remove('active');
});

// Initialize Chart
function initTopProductsChart() {
    const ctx = document.getElementById('topProductsChart').getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['White T-Shirt', 'Slim Jeans', 'Sneakers', 'Summer Dress', 'Denim Jacket'],
            datasets: [{
                label: 'Revenue ($)',
                data: [4920, 5375, 5985, 3900, 4900],
                backgroundColor: [
                    'rgba(123, 44, 191, 0.7)',
                    'rgba(74, 20, 140, 0.7)',
                    'rgba(157, 78, 221, 0.7)',
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(46, 196, 182, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

let topProductsChart = initTopProductsChart();

function updateTopProductsChart(type) {
    topProductsChart.destroy();
    topProductsChart = new Chart(document.getElementById('topProductsChart').getContext('2d'), {
        type: type,
        data: topProductsChart.data,
        options: topProductsChart.options
    });
}

// Export Buttons
document.getElementById('top-products-pdf-btn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Top Selling Products Report', 14, 15);
    doc.autoTable({
        html: '#top-products-table',
        startY: 25
    });
    doc.save('Top_Selling_Products.pdf');
    showToast('Top Products PDF exported successfully');
});

document.getElementById('top-products-excel-btn').addEventListener('click', function() {
    const table = document.getElementById('top-products-table');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'Top_Selling_Products.xlsx');
    showToast('Top Products Excel exported successfully');
});

document.getElementById('top-products-print-btn').addEventListener('click', function() {
    window.print();
});


            // Report navigation
            const reportLinks = document.querySelectorAll('.report-menu a');
            const reportContents = document.querySelectorAll('.report-content');
            
            reportLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remove active class from all links
                    reportLinks.forEach(l => l.classList.remove('active'));
                    // Add active class to clicked link
                    this.classList.add('active');
                    
                    // Hide all report contents
                    reportContents.forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    // Show the selected report
                    const reportId = this.getAttribute('data-report') + '-report';
                    document.getElementById(reportId).style.display = 'block';
                });
            });
        });
    