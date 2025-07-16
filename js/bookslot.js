document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch('/check_login');
  const data = await response.json();

  if (!data.logged_in) {
    alert("You must be logged in to book a slot.");
    window.location.href = '/loginPage?next=bookslot'; // Redirect to login if not logged in
    return; // Prevent further execution
  }

  const form = document.getElementById("repairForm");
  const gadgetSelect = document.getElementById("gadgetTypeSelect");
  const customGadgetGroup = document.getElementById("customGadgetGroup");
  const customGadgetInput = document.getElementById("customGadgetType");
  const selectShopButton = document.getElementById("select-shop-button");
  const shopSelectionSection = document.getElementById("shop-selection-section");
  const bookSlotButton = document.getElementById("book-slot-button");
  const bookingPreviewSection = document.getElementById("booking-preview-section");
  const bookingPreviewContent = document.getElementById("booking-preview-content");
  const confirmBookingButton = document.getElementById("confirm-booking-button");
  const cancelBookingButton = document.getElementById("cancel-booking-button");

  let formData = {};
  let selectedShopId = null;
    let selectedShopDetails = {};

  gadgetSelect.addEventListener("change", () => {
    customGadgetGroup.style.display = gadgetSelect.value === "Other" ? "block" : "none";
    customGadgetInput.required = gadgetSelect.value === "Other";
  });

  selectShopButton.addEventListener("click", (e) => {
    e.preventDefault();

    // Validate form before proceeding
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    formData = {
      gadgetType: gadgetSelect.value === "Other" ? customGadgetInput.value : gadgetSelect.value,
      model: form.model.value,
      problemDescription: form.problem_description.value,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      pincode: form.pincode.value,
      address: form.address.value,
    };
    document.getElementById("form-section").style.display = "none";
    shopSelectionSection.style.display = "block";
  });

document.querySelectorAll('.shop-option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedShopId = e.target.value;
      selectedShopDetails = {
        shopName: e.target.dataset.shopname,
        shopkeeper: e.target.dataset.shopkeeper,
        shopPhone: e.target.dataset.shopphone
      };
      bookSlotButton.disabled = false;
    });
  });

  bookSlotButton.addEventListener("click", () => {
    shopSelectionSection.style.display = "none";
    bookingPreviewSection.style.display = "block";
    bookingPreviewContent.innerHTML = `
 <h3>Confirm Your Booking</h3>
      <p><strong>Gadget Type:</strong> ${formData.gadgetType}</p>
      <p><strong>Model:</strong> ${formData.model}</p>
      <p><strong>Problem:</strong> ${formData.problemDescription}</p>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone}</p>
      <p><strong>PIN Code:</strong> ${formData.pincode}</p>
      <p><strong>Address:</strong> ${formData.address}</p>
      <hr>
      <p><strong>Selected Shop ID:</strong> ${selectedShopId}</p>
      <p><strong>Shop Name:</strong> ${selectedShopDetails.shopName}</p>
      <p><strong>Shopkeeper:</strong> ${selectedShopDetails.shopkeeper}</p>
      <p><strong>Shop Phone:</strong> ${selectedShopDetails.shopPhone}</p>
      
    `;
  });

  cancelBookingButton.addEventListener("click", () => {
    bookingPreviewSection.style.display = "none";
    shopSelectionSection.style.display = "block";
  });

  confirmBookingButton.addEventListener("click", async () => {
    const bookingData = {
      ...formData,
      shop_id: selectedShopId,
    };

    try {
      const response = await fetch("/confirmBooking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        alert("Booking confirmed!");
        window.location.href = "/home.html";
      } else {
        alert("Booking failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    }
  });
});

const shopCards = document.querySelectorAll('.shop-option');
  const searchInput = document.getElementById('shopSearchInput');
  const cityFilter = document.getElementById('cityFilter');
  const typeFilter = document.getElementById('typeFilter');
  const noShopsMessage = document.getElementById('no-shops-message'); 

  function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const city = cityFilter.value.toLowerCase();
    const type = typeFilter.value.toLowerCase();

   let anyShopVisible = false;

    shopCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const cardCity = card.querySelector('p:nth-child(6)').textContent.toLowerCase(); // address line
      const cardType = card.querySelector('p:nth-child(3)').textContent.toLowerCase(); // shop type

      const matchesSearch = text.includes(search);
      const matchesCity = !city || cardCity.includes(city);
      const matchesType = !type || cardType.includes(type);

       const isVisible = matchesSearch && matchesCity && matchesType;
    card.style.display = isVisible ? 'block' : 'none';

    if (isVisible) {
      anyShopVisible = true;
    }

    });

    noShopsMessage.style.display = anyShopVisible ? 'none' : 'block';
  }

  searchInput.addEventListener('input', applyFilters);
  cityFilter.addEventListener('change', applyFilters);
  typeFilter.addEventListener('change', applyFilters);

  // 🟡 Apply default PIN filter when the section first opens
document.getElementById('select-shop-button').addEventListener('click', () => {
  const userPin = document.querySelector('input[name="pincode"]').value.trim();
  let anyShopVisible = false;

  shopCards.forEach(card => {
    const shopText = card.textContent.toLowerCase();
    const isVisible = shopText.includes(userPin);
    card.style.display = isVisible ? 'block' : 'none';

    if (isVisible) {
      anyShopVisible = true;
    }
  });

  // If no shops are visible after PIN filter, show the "No shops available" message
  document.getElementById('shop-selection-section').style.display = 'block';
  noShopsMessage.style.display = anyShopVisible ? 'none' : 'block';
});