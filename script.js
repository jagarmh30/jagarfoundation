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
  const wasteInput = document.getElementById('waste');
  const subtitle = document.querySelector('.subtitle');
  const totalsDisplay = document.getElementById('totalsDisplay');
  const totalWaste = document.getElementById('totalWaste');
  const totalFunds = document.getElementById('totalFunds');

  // संयोजकांची यादी लोड करणे
  const SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Conveners?t=' + Date.now();

  fetch(SHEET_URL)
    .then(res => {
      if (!res.ok) throw new Error('शीट डेटा लोड करताना त्रुटी: ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('संयोजक डेटा:', data);

      const lastOption = 'यापैकी कोणीही नाही अन्य मार्ग';
      const items = data.map(row => {
        const fullName = (row['संयोजकाचे नाव'] || row[2] || '').toString().trim();
        const sortKey = fullName.replace(/^(श्री\.?|श्रीमती\.?|कु\.?|डॉ\.?)\s*/i, '').trim();
        return {
          displayName: fullName,
          sortKey: sortKey,
          isLastOption: fullName === lastOption
        };
      }).filter(it => it.displayName);

      console.log('प्रोसेस्ड संयोजक नावे:', items);

      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      const regularItems = items.filter(item => !item.isLastOption);
      const lastItem = items.find(item => item.isLastOption);
      regularItems.sort((a, b) => collator.compare(a.sortKey, b.sortKey));

      referenceSelect.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- संयोजक निवडा --';
      defaultOption.style.textAlign = 'center';
      referenceSelect.appendChild(defaultOption);

      regularItems.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.displayName;
        opt.textContent = item.displayName;
        opt.style.textAlign = 'left';
        referenceSelect.appendChild(opt);
      });

      if (lastItem) {
        const opt = document.createElement('option');
        opt.value = lastItem.displayName;
        opt.textContent = lastItem.displayName;
        opt.style.textAlign = 'left';
        referenceSelect.appendChild(opt);
      }
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
    timeslotSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- वेळ निवडा --';
    defaultOption.style.textAlign = 'center';
    timeslotSelect.appendChild(defaultOption);

    if (!this.value) {
      timeslotSelect.disabled = true;
      return;
    }
    if (this.value < minDate || this.value > maxDate) {
      timeslotSelect.disabled = true;
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = 'तारीख योग्य नाही';
      errorOption.style.textAlign = 'center';
      timeslotSelect.appendChild(errorOption);
      return;
    }
    timeslotSelect.disabled = false;
    SLOTS.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.start;
      opt.textContent = slot.label;
      opt.style.textAlign = 'left';
      timeslotSelect.appendChild(opt);
    });
  });

  // वेस्ट इनपुट व्हॅलिडेशन
  wasteInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9.]/g, '');
    if (this.value.includes('.')) {
      const parts = this.value.split('.');
      if (parts.length > 2) this.value = parts[0] + '.' + parts[1];
      if (parts[1]?.length > 2) this.value = parts[0] + '.' + parts[1].slice(0, 2);
    }
  });

  // लोकेशन मिळवणे
  locBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      locationField.classList.add('location-loading-placeholder');
      locationField.placeholder = 'लोकेशन घेत आहे...';
      locationField.value = '';
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          locationField.value = `https://maps.google.com/?q=${lat},${lon}`;
          locationField.classList.remove('location-loading-placeholder');
          locationField.placeholder = '← आयकॉनवर टच करा';
        },
        err => {
          alert('लोकेशन मिळवण्यात अडचण आली. कृपया परवानगी द्या.');
          locationField.classList.remove('location-loading-placeholder');
          locationField.placeholder = '← आयकॉनवर टच करा';
        }
      );
    } else {
      alert('तुमचा ब्राउझर लोकेशन सपोर्ट करत नाही.');
      locationField.classList.remove('location-loading-placeholder');
      locationField.placeholder = '← आयकॉनवर टच करा';
    }
  });

  // डेटा लोड करणे आणि मजकूर डिस्प्ले अपडेट करणे
  function loadTotalsData(currentWaste) {
    const SUBMISSION_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Submissions?t=' + Date.now();
    const FUNDS_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/2025?t=' + Date.now();

    // डमी डेटा
    const dummyFundsTotal = 50000;

    // रद्दी डेटा लोड करणे
    fetch(SUBMISSION_SHEET_URL)
      .then(res => {
        if (!res.ok) throw new Error('रद्दी डेटा लोड करताना त्रुटी: ' + res.status);
        return res.json();
      })
      .then(data => {
        console.log('कच्चा रद्दी डेटा:', data);

        // रद्दीची बेरीज
        const totalWasteAmount = data.reduce((sum, row) => {
          const wasteValue = parseFloat(row.waste);
          return sum + (isNaN(wasteValue) ? 0 : wasteValue);
        }, 0) + (parseFloat(currentWaste) || 0);
        console.log('एकूण रद्दी:', totalWasteAmount);
        totalWaste.textContent = `तुमच्यासह एकूण रद्दी संकलित: ${totalWasteAmount.toFixed(1)} किलो`;

        // निधी डेटा लोड करणे
        fetch(FUNDS_SHEET_URL)
          .then(res => {
            if (!res.ok) {
              console.warn('निधी डेटा लोड करताना त्रुटी, डमी डेटा वापरत आहे');
              return [];
            }
            return res.json();
          })
          .then(funds => {
            console.log('कच्चा निधी डेटा:', funds);

            // निधीची बेरीज
            const totalFundsAmount = funds.reduce((sum, row) => {
              const fundValue = parseFloat(row.G);
              return sum + (isNaN(fundValue) ? 0 : fundValue);
            }, 0);
            console.log('एकूण निधी:', totalFundsAmount);

            totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: ${totalFundsAmount.toFixed(0)} रु.`;
            if (totalFundsAmount === 0) {
              console.warn('निधी डेटा रिक्त, डमी डेटा वापरत आहे');
              totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: ${dummyFundsTotal.toFixed(0)} रु.`;
            }

            // डिस्प्ले दाखवा
            totalsDisplay.style.display = 'block';
          })
          .catch(err => {
            console.warn('निधी डेटा लोड करताना त्रुटी, डमी डेटा वापरत आहे:', err);
            totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: ${dummyFundsTotal.toFixed(0)} रु.`;
            totalsDisplay.style.display = 'block';
            errorMsg.textContent = 'निधी डेटा लोड करताना त्रुटी आली. डमी डेटा दाखवत आहे.';
            errorMsg.style.display = 'block';
          });
      })
      .catch(err => {
        console.error('रद्दी डेटा लोड करताना त्रुटी:', err);
        totalWaste.textContent = `तुमच्यासह एकूण रद्दी संकलित: ${parseFloat(currentWaste || 0).toFixed(1)} किलो`;
        totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: ${dummyFundsTotal.toFixed(0)} रु.`;
        totalsDisplay.style.display = 'block';
        errorMsg.textContent = 'रद्दी डेटा लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
        errorMsg.style.display = 'block';
      });
  }

  // फॉर्म सबमिट करणे
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    thankyouMessage.style.display = 'none';
    totalsDisplay.style.display = 'none';

    const dateVal = dateInput.value;
    const wasteVal = parseFloat(wasteInput.value);
    if (!form.checkValidity() || !dateVal || dateVal < minDate || dateVal > maxDate || isNaN(wasteVal) || wasteVal < 0) {
      errorMsg.textContent = 'सर्व फिल्ड्स तपासा. रद्दीचे वजन केवळ पॉझिटिव्ह आकड्यांमध्ये असावे.';
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
          loadTotalsData(wasteVal);
        } else {
          throw new Error('सबमिशन अयशस्वी');
        }
      })
      .catch(err => {
        console.error("Final error:", err);
        errorMsg.textContent = 'सबमिशन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.';
        errorMsg.style.display = 'block';
      });
  });

  thankyouExitBtn && thankyouExitBtn.addEventListener('click', function () {
    thankyouMessage.style.display = 'none';
    totalsDisplay.style.display = 'none';
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
