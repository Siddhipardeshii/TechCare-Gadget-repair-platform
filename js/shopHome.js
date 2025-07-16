document.addEventListener('DOMContentLoaded', () => {
  // =================== BOOKINGS DATA ===================
  fetch('/getBookings')
    .then(response => response.json())
    .then(bookings => {
      const table = document.getElementById('requestList');
      table.innerHTML = '';
      if (Array.isArray(bookings)) {
        bookings.forEach(booking => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${booking.customer_name}</td>
            <td>${booking.gadget_type} (${booking.model})</td>
            <td>${booking.issue_description}</td>
            <td>${booking.collect_date || '-'}</td>
            <td>${booking.repair_status}</td>
          `;
          table.appendChild(row);
        });
      } else {
        table.innerHTML = '<tr><td colspan="5">No bookings found or error occurred.</td></tr>';
      }
    })
    .catch(error => {
      console.error('Error fetching repair requests:', error);
      const table = document.getElementById('requestList');
      table.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
    });

  // =================== STATIC OVERVIEW (FAKE DATA) ===================
  // Replace with real dashboard API if implemented later
  const dummyDashboardData = {
    appointmentsCount: 3,
    pendingRequests: 5,
    completedJobs: 12,
    newMessages: 2,
    alerts: 1
  };
  document.getElementById('appointmentsCount').textContent = dummyDashboardData.appointmentsCount;
  document.getElementById('pendingRequests').textContent = dummyDashboardData.pendingRequests;
  document.getElementById('completedJobs').textContent = dummyDashboardData.completedJobs;
  document.getElementById('newMessages').textContent = dummyDashboardData.newMessages;
  document.getElementById('alerts').textContent = dummyDashboardData.alerts;

  // =================== SERVICES SECTION ===================
  fetch('/api/services')  // Only works if you implement it in Flask
    .then(response => response.json())
    .then(services => {
      const serviceList = document.getElementById('serviceList');
      services.forEach(service => {
        const li = document.createElement('li');
        li.textContent = service.name;
        serviceList.appendChild(li);
      });
    })
    .catch(error => console.warn('Service API not implemented:', error));

  const addServiceBtn = document.querySelector("button[onclick='addService()']");
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      const serviceName = prompt("Enter new service name:");
      if (serviceName) {
        fetch('/api/add_service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: serviceName })
        })
          .then(response => response.json())
          .then(data => {
            const serviceList = document.getElementById('serviceList');
            const li = document.createElement('li');
            li.textContent = serviceName;
            serviceList.appendChild(li);
          })
          .catch(error => console.warn('Error adding service or route not implemented:', error));
      }
    });
  }

  // =================== PROFILE EDIT ===================
  const editProfileBtn = document.querySelector("button[onclick='editProfile()']");
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      const newProfileInfo = prompt("Enter new shop info:");
      if (newProfileInfo) {
        fetch('/api/edit_profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newInfo: newProfileInfo })
        })
          .then(response => response.json())
          .then(data => {
            alert(`Profile updated: ${newProfileInfo}`);
          })
          .catch(error => console.warn('Edit profile API not implemented:', error));
      }
    });
  }

  // =================== LOGOUT BUTTON ===================
  const logoutBtn = document.querySelector("button[onclick='logout()']");
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/home.html';
    });
  }
});
