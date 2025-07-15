  // Highlight active sidebar item
  document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar__item a');
    
    menuItems.forEach(item => {
      if (item.getAttribute('href').includes(currentPage)) {
        item.parentElement.classList.add('active');
      } else {
        item.parentElement.classList.remove('active');
      }
    });
    
    // Add animation to stats cards on load
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s forwards`;
      card.style.opacity = '0';
    });
    
    // Add animation to table rows
    const tableRows = document.querySelectorAll('.purchase-table tbody tr');
    tableRows.forEach((row, index) => {
      row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s forwards`;
      row.style.opacity = '0';
    });

    
  });
document.addEventListener("DOMContentLoaded", () => {
  fetchPurchaseSummary();
});

function fetchPurchaseSummary() {
  fetch("Php/get_purchase_summary.php")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        console.error("Server error:", data.error);
        return;
      }

      const tbody = document.querySelector(".purchase-table tbody");
      tbody.innerHTML = ""; // Clear previous rows

      data.summary.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.purchaseId}</td>
          <td>${item.supplierName}</td>
          <td>${item.variantId}</td>
          <td>${item.quantity}</td>
          <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
          <td>$${parseFloat(item.total).toFixed(2)}</td>
          <td>${item.invoiceNumber}</td>
          <td><button class="action-btn">Edit</button></td>
        `;
        tbody.appendChild(row);
      });

      // Update dashboard cards
      const purchaseCountEl = document.getElementById("purchaseCount");
      const monthlyTotalEl = document.getElementById("monthlyPurchaseTotal");

      if (purchaseCountEl) {
        purchaseCountEl.textContent = data.total_purchase_count.toLocaleString();
      }

      if (monthlyTotalEl) {
        monthlyTotalEl.textContent = "$" + parseFloat(data.grand_total).toLocaleString();
      }
    })
    .catch((error) => {
      console.error("Error fetching purchase summary:", error);
    });
}
