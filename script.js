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

  // संयोजकांची यादी लोड करणे (Google Sheet कॉलम क्रम: Sr. No., गाव, संयोजकाचे नाव, मोबाईल नंबर, इतर माहिती)
  const SHEET_URL = 'https://opensheet.elk.sh/1W059r6QUWecU8WY5OdLLybCMkPOPr_K5IXXEETUbrn4/Conveners';
  fetch(SHEET_URL)
    .then(res => res.json())
    .then(data => {
      // Sr. No. = row['Sr. No.'] किंवा row[0], गाव=row['गाव'] किंवा row[1], संयोजकाचे नाव=row['संयोजकाचे नाव'] किंवा row[2], मोबाईल=row['मोबाईल नंबर'] किंवा row[3]
      const items = data.map(row => {
        const village = (row['गाव'] || row[1] || '').toString().trim();
        const name = (row['संयोजकाचे नाव'] || row[2] || '').toString().trim();
        const mobile = (row['मोबाईल नंबर'] || row[3] || '').toString().trim();
        // Option: गाव + नाव (मोबाईल)
        return {
          displayName: village ? `${village} : ${name}` : name,
          sortKey: name,
          mobile
        };
      }).filter(it => it.displayName);
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      items.sort((a, b) => collator.compare(a.sortKey, b.sortKey));
      referenceSelect.innerHTML = '<option value="" style="text-align:center">-- संयोजक निवडा --</option>';
      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.displayName;
        opt.textContent = item.displayName + (item.mobile ? ` (${item.mobile})` : '');
        opt.setAttribute('data-mobile', item.mobile);
        opt.style.textAlign = 'center';
        referenceSelect.appendChild(opt);
      });
      // शेवटी 'यापैकी कोणीही नाही अन्य मार्ग'
      const otherOpt = document.createElement('option');
      otherOpt.value = 'यापैकी कोणीही नाही अन्य मार्ग';
      otherOpt.textContent = 'यापैकी कोणीही नाही अन्य मार्ग';
      otherOpt.style.textAlign = 'center';
      referenceSelect.appendChild(otherOpt);
    })
    .catch(err => console.error('संयोजक लोड करताना त्रुटी:', err));

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

    // तारीख योग्य आहे का?
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
    // तारीख व वेळेचा स्लॉट पाठवा
    data.date = dateInput.value || "";
    data.timeslotLabel = timeslotSelect.options[timeslotSelect.selectedIndex]?.textContent || "";

    // Google Apps Script वेब अ‍ॅप URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9qFvcGDH90rz91bgHZoR8JjDPISM2_IsCHqC4_m1UqY4AF2O58uN1gRgT6lcsjO7jLw/exec';
    const bodyData = new URLSearchParams(data).toString();
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyData
    })
      .then(res => res.json().catch(() => ({ success: true })))
      .then(response => {
        if (response.success) {
          form.style.display = 'none';
          thankyouMessage.style.display = 'block';
          if (subtitle) subtitle.style.display = 'none';
        } else {
          throw new Error('सबमिशन अयशस्वी');
        }
      })
      .catch(err => {
        console.error(err);
        errorMsg.style.display = 'block';
      });
  });

  // Thankyou मध्ये Exit बटण
  thankyouExitBtn && thankyouExitBtn.addEventListener('click', function () {
    thankyouMessage.style.display = 'none';
    form.style.display = 'block';
    form.reset();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    if (subtitle) subtitle.style.display = '';
  });

  // QR/R-logo बटणवर क्लिक केल्यावर पेमेंट ॲप उघडा
  qrPayBtn && qrPayBtn.addEventListener('click', function () {
    window.location.href = 'upi://pay?pa=YOURUPIID@okicici&pn=SamajikDiwali&cu=INR';
  });
});
