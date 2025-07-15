 
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      alert('Filter functionality coming soon!');
    });
  });
  // scripts.js
document.querySelectorAll('.track-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    alert("Tracking or viewing order details not implemented yet.");
  });
});
  document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('addSaleBtn').addEventListener('click', function () {
        window.location.href = 'add-sale.html'; // make sure this file exists
      });
    });
$(document).ready(function () {
  $.ajax({
    url: "php/getSalesData.php",
    type: "GET",
    dataType: "json",
    success: function (data) {
      // Populate summary cards
      $(".summary-cards .card:eq(0) .card-value").text("$" + Number(data.summary.total_sales).toLocaleString());
      $(".summary-cards .card:eq(1) .card-value").text(data.summary.total_orders + " Orders");
      $(".summary-cards .card:eq(2) .card-value").html("$" + data.summary.average_order_value + ' <span class="small">/Per Order</span>');

      // Populate recent orders
      let tbody = $(".orders-table tbody");
      tbody.empty();
      data.recentSales.forEach(sale => {
        tbody.append(`
          <tr>
            <td>${sale.sale_id}</td>
            <td>${sale.customer_name}</td>
            <td>${sale.employerId}</td>
            <td>${sale.invoice_no}</td>
            <td>${sale.sale_date}</td>
            <td>$${parseFloat(sale.total_amount).toLocaleString()}</td>
            <td>$${parseFloat(sale.final_amount).toLocaleString()}</td>
            <td>${sale.payment_method}</td>
          </tr>
        `);
      });
    },
    error: function (xhr, status, error) {
      console.error("Error loading sales data:", error);
    }
  });
});
