document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('main-form');
  const successMsg = document.getElementById('success');
  const errorMsg = document.getElementById('error');
  const thankyouMessage = document.getElementById('thankyouMessage');
  const locBtn = document.getElementById('locBtn');
  const locationField = document.getElementById('location');
  const referenceSelect = document.getElementById('reference');
  const referenceDetails = document.getElementById('referenceDetails');
  const referenceDetailsField = document.getElementById('referenceDetailsField');
  const pincodeField = document.getElementById('pincode');

  // Toggle reference details field
  referenceSelect.addEventListener('change', () => {
    if (referenceSelect.value === 'other') {
      referenceDetails.style.display = 'block';
      referenceDetailsField.required = true;
    } else {
      referenceDetails.style.display = 'none';
      referenceDetailsField.required = false;
    }
  });

  // Autofill location
  locBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        locationField.value = `https://www.google.com/maps?q=${lat},${lon}`;
      }, () => {
        alert("लोकेशन मिळू शकले नाही.");
      });
    } else {
      alert("तुमचा ब्राऊजर लोकेशन सपोर्ट करत नाही.");
    }
  });

  // Autofill pincode from location
  locationField.addEventListener('change', async () => {
    const url = locationField.value;
    const regex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);

    if (match) {
      const lat = match[1];
      const lon = match[2];
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const pincode = data.address.postcode;
        if (pincode) {
          pincodeField.value = pincode;
        }
      } catch (error) {
        console.error("पिनकोड मिळवताना त्रुटी:", error);
      }
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    thankyouMessage.innerHTML = '';

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        form.style.display = 'none';
        successMsg.style.display = 'block';
        thankyouMessage.innerHTML = '🙏 धन्यवाद! तुमची माहिती यशस्वीरित्या सबमिट झाली आहे.';

        if (result.whatsappLink) {
          const whatsappBtn = document.createElement('button');
          whatsappBtn.textContent = 'संयोजकाला WhatsApp मेसेज पाठवा';
          whatsappBtn.classList.add('whatsapp-button');
          whatsappBtn.onclick = () => {
            window.open(result.whatsappLink, '_blank');
          };
          thankyouMessage.appendChild(document.createElement('br'));
          thankyouMessage.appendChild(whatsappBtn);
        }
      } else {
        errorMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('त्रुटी:', error);
      errorMsg.style.display = 'block';
    }
  });
});
