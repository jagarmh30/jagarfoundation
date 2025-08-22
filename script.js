document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('main-form');
  const successMsg = document.getElementById('success');
  const errorMsg = document.getElementById('error');
  const thankyouMessage = document.getElementById('thankyouMessage');
  const locBtn = document.getElementById('locBtn');
  const locationField = document.getElementById('location');
  const referenceSelect = document.getElementById('reference');
  const timeslotSelect = document.getElementById('timeslot');
  const dateInput = document.getElementById('date');
  const thankyouExitBtn = document.getElementById('thankyouExitBtn');
  const qrPayBtn = document.getElementById('qrPayBtn');
  const subtitle = document.querySelector('.subtitle');

  // संयोजकांची यादी लोड करणे
  const SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Conveners?t=' + Date.now();

  fetch(SHEET_URL)
    .then(res => {
      if (!res.ok) throw new Error('शीट डेटा लोड करताना त्रुटी: ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('शीटमधून मिळालेला डेटा:', data); // डिबगिंगसाठी: संपूर्ण डेटा लॉग करा

      // कॉलम C मधील नावे घ्या
      const items = data.map(row => {
        const fullName = (row['संयोजकाचे नाव'] || row[2] || '').toString().trim();
        // क्रमवारीसाठी उपाधी काढून टाकणे
        const sortKey = fullName.replace(/^(श्री\.?|श्रीमती\.?|कु\.?|डॉ\.?)\s*/i, '').trim();
        return {
          displayName: fullName, // ड्रॉपडाउनमध्ये पूर्ण नाव (उपाधीसह)
          sortKey: sortKey // क्रमवारीसाठी उपाधीशिवाय नाव
        };
      }).filter(it => it.displayName); // रिक्त नावे वगळा

      console.log('प्रोसेस्ड नावे:', items); // डिबगिंगसाठी: प्रोसेस्ड नावे लॉग करा

      // मराठी क्रमवारीनुसार यादी क्रमवारी लावा
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      items.sort((a, b) => {
        const comparison = collator.compare(a.sortKey, b.sortKey);
        console.log(`क्रमवारी तुलना: ${a.sortKey} vs ${b.sortKey} = ${comparison}`); // डिबगिंगसाठी
        return comparison;
      });

      // ड्रॉपडाउन यादी तयार करा
      referenceSelect.innerHTML = '<option value="" style="text-align:center">-- संयोजक निवडा --</option>';
      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.displayName;
        opt.textContent = item.displayName;
        opt.style.textAlign = 'center';
        referenceSelect.appendChild(opt);
      });

      console.log('ड्रॉपडाउनमध्ये जोडलेली यादी:', referenceSelect.innerHTML); // डिबगिंगसाठी
    })
    .catch(err => {
      console.error('संयोजक लोड करताना त्रुटी:', err);
      errorMsg.textContent = 'संयोजकांची यादी लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
      errorMsg.style.display = 'block';
    });

  // तारीख व वेळेचा स्लॉट निवडणे
  const SLOTS = [
    { label: "08:00 AM - 10:00 AM", start: "08:00" },
    { label: "10:00 AM - 12:00 PM", start: "10:00" },
    { label: "12:00 PM - 02:00 PM", start: "12:00" },
    { label: "02:00 PM - 04:00 PM", start: "14:00" },
    { label: "04:00 PM - 06:00 PM", start: "16:00" },
    { label: "05:00 PM - 07:00 PM", start: "17:00" }
  ];
  const minDate = '2025-09-15';
  const maxDate = '2025-10-15';
  dateInput.setAttribute('min', minDate);
  dateInput.setAttribute('max', maxDate);

  dateInput.addEventListener('change', function () {
    timeslotSelect.innerHTML = '<option value="" style="text-align:center">-- वेळ निवडा --</option>';
    if (!this.value) {
      timeslotSelect.disabled = true;
      return;
    }
    if (this.value < minDate || this.value > maxDate) {
      timeslotSelect.disabled = true;
      timeslotSelect.innerHTML = '<option value="" style="text-align:center">तारीख योग्य नाही</option>';
      return;
    }
    timeslotSelect.disabled = false;
    SLOTS.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.start;
      opt.textContent = slot.label;
      opt.style.textAlign = 'center';
      timeslotSelect.appendChild(opt);
    });
  });

  // लोकेशन मिळवणे
  locBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          locationField.value = `https://maps.google.com/?q=${lat},${lon}`;
        },
        () => alert('लोकेशन मिळवण्यात अडचण आली. कृपया परवानगी द्या.')
      );
    } else {
      alert('तुमचा ब्राउझर लोकेशन सपोर्ट करत नाही.');
    }
  });

  // फॉर्म सबमिट करणे
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    thankyouMessage.style.display = 'none';

    const dateVal = dateInput.value;
    if (!form.checkValidity() || !dateVal || dateVal < minDate || dateVal > maxDate) {
      errorMsg.style.display = 'block';
      return;
    }
    errorMsg.style.display = 'none';

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    data.date = dateInput.value || "";
    data.timeslotLabel = timeslotSelect.options[timeslotSelect.selectedIndex]?.textContent || "";

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzU5fRchikXcIZ00AisRjz-1PPA2yLcfmvVwd7hKZKmxARQm3laCcTSOOvBli6lbouMjQ/exec';
    const bodyData = new URLSearchParams(data).toString();

    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyData
    })
      .then(async res => {
        const text = await res.text();
        console.log("Raw response:", text);
        try {
          return JSON.parse(text);
        } catch (e) {
          return { success: false, error: "Invalid JSON: " + text };
        }
      })
      .then(response => {
        console.log("Parsed response:", response);
        if (response.success) {
          form.style.display = 'none';
          thankyouMessage.style.display = 'block';
          if (subtitle) subtitle.style.display = 'none';
        } else {
          throw new Error('सबमिशन अयशस्वी');
        }
      })
      .catch(err => {
        console.error("Final error:", err);
        errorMsg.style.display = 'block';
      });
  });

  thankyouExitBtn && thankyouExitBtn.addEventListener('click', function () {
    thankyouMessage.style.display = 'none';
    form.style.display = 'block';
    form.reset();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    if (subtitle) subtitle.style.display = '';
  });

  qrPayBtn && qrPayBtn.addEventListener('click', function () {
    window.location.href = 'upi://pay?pa=YOURUPIID@okicici&pn=SamajikDiwali&cu=INR';
  });
});
