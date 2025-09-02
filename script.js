document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('main-form');
  const successMsg = document.getElementById('success');
  const errorMsg = document.getElementById('error');
  const thankyouMessage = document.getElementById('thankyouMessage');
  const locBtn = document.getElementById('locBtn');
  const locationField = document.getElementById('location');
  const referenceSelect = document.getElementById('reference');
  const villageSelect = document.getElementById('village');
  const timeslotSelect = document.getElementById('timeslot');
  const dateInput = document.getElementById('date');
  const thankyouExitBtn = document.getElementById('thankyouExitBtn');
  const qrPayBtn = document.getElementById('qrPayBtn');
  const wasteInput = document.getElementById('waste');
  const subtitle = document.querySelector('.subtitle');
  const totalsDisplay = document.getElementById('totalsDisplay');
  const totalWaste = document.getElementById('totalWaste');
  const totalFunds = document.getElementById('totalFunds');

  // Disable right-click and drag on images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('contextmenu', (e) => e.preventDefault());
    img.addEventListener('dragstart', (e) => e.preventDefault());
  });

  // Load convener and village data
  const SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Conveners?t=' + Date.now();

  fetch(SHEET_URL)
    .then(res => {
      if (!res.ok) throw new Error('शीट डेटा लोड करताना त्रुटी: ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('शीट डेटा:', data);

      const villages = [];
      const convenersByVillage = {};

      data.forEach(row => {
        const village = (row['गाव'] || '').toString().trim();
        const fullName = (row['संयोजकाचे नाव'] || '').toString().trim();

        if (village && fullName) {
          if (!convenersByVillage[village]) {
            convenersByVillage[village] = [];
            villages.push(village);
          }
          convenersByVillage[village].push(fullName);
        }
      });

      // Sort villages (Marathi collation)
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      villages.sort((a, b) => collator.compare(a, b));

      // Sort conveners for each village
      for (let village in convenersByVillage) {
        convenersByVillage[village].sort((a, b) => collator.compare(a, b));
      }

      console.log('गावांची यादी:', villages);
      console.log('गावानुसार संयोजक:', convenersByVillage);

      // Populate village dropdown
      villageSelect.innerHTML = '';
      const defaultVillageOption = document.createElement('option');
      defaultVillageOption.value = '';
      defaultVillageOption.textContent = '-- गाव निवडा --';
      defaultVillageOption.style.textAlign = 'center';
      villageSelect.appendChild(defaultVillageOption);

      villages.forEach(village => {
        const opt = document.createElement('option');
        opt.value = village;
        opt.textContent = village;
        opt.style.textAlign = 'left';
        villageSelect.appendChild(opt);
      });

      // Populate convener dropdown (initially all)
      updateConveners(convenersByVillage);

      // Update conveners when village changes
      villageSelect.addEventListener('change', function () {
        const selectedVillage = this.value;
        updateConveners(convenersByVillage, selectedVillage);
      });
    })
    .catch(err => {
      console.error('शीट डेटा लोड करताना त्रुटी:', err);
      errorMsg.textContent = 'डेटा लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
      errorMsg.style.display = 'block';
    });

  // Update convener dropdown function
  function updateConveners(convenersByVillage, selectedVillage = null) {
    referenceSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- संयोजक निवडा --';
    defaultOption.style.textAlign = 'center';
    referenceSelect.appendChild(defaultOption);

    let allConveners = [];
    if (selectedVillage) {
      allConveners = convenersByVillage[selectedVillage] || [];
    } else {
      for (let village in convenersByVillage) {
        allConveners = allConveners.concat(convenersByVillage[village]);
      }
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      allConveners.sort((a, b) => collator.compare(a, b));
    }

    // Add all conveners
    allConveners.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      opt.style.textAlign = 'left';
      referenceSelect.appendChild(opt);
    });

    // Add "None of the above" option
    const lastOption = "यापैकी कोणीही नाही (अन्य मार्ग)";
    const lastOpt = document.createElement('option');
    lastOpt.value = lastOption;
    lastOpt.textContent = lastOption;
    lastOpt.style.textAlign = 'left';
    referenceSelect.appendChild(lastOpt);
  }

  // Date and timeslot selection
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

  // Function to check if a date is a weekend (Saturday or Sunday)
  function isWeekend(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

  // Function to get all weekend dates between minDate and maxDate
  function getWeekendDates(startDate, endDate) {
    const weekends = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
      if (isWeekend(current)) {
        const formattedDate = current.toISOString().split('T')[0];
        weekends.push(formattedDate);
      }
      current.setDate(current.getDate() + 1);
    }
    return weekends;
  }

  // Populate timeslot dropdown based on date selection
  dateInput.addEventListener('change', function () {
    timeslotSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- वेळ निवडा --';
    defaultOption.style.textAlign = 'center';
    timeslotSelect.appendChild(defaultOption);

    const selectedDate = this.value;
    if (!selectedDate) {
      timeslotSelect.disabled = true;
      return;
    }

    if (selectedDate < minDate || selectedDate > maxDate || !isWeekend(selectedDate)) {
      timeslotSelect.disabled = true;
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = 'कृपया शनिवार किंवा रविवार निवडा';
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

  // Waste input validation
  wasteInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9.]/g, '');
    if (this.value.includes('.')) {
      const parts = this.value.split('.');
      if (parts.length > 2) this.value = parts[0] + '.' + parts[1];
      if (parts[1]?.length > 2) this.value = parts[0] + '.' + parts[1].slice(0, 2);
    }
  });

  // Get location
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

  // Clean numeric data
  function cleanNumericData(value) {
    if (!value) return 0;
    const cleanedValue = value.toString().replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(cleanedValue);
    return isNaN(numericValue) ? 0 : numericValue;
  }

  // Load totals data and update display
  function loadTotalsData() {
    const DONORS_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Donors?t=' + Date.now();
    const FUNDS_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/FUNDS?t=' + Date.now();

    // Load waste data
    fetch(DONORS_SHEET_URL)
      .then(res => {
        if (!res.ok) throw new Error(`रद्दी डेटा लोड करताना त्रुटी: HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('कच्चा रद्दी डेटा (Donors शीट):', data);
        const wasteValues = data.map(row => ({
          waste: cleanNumericData(row['Quantity'] || row['quantity'] || 0),
          raw: row['Quantity'] || row['quantity'] || 'N/A'
        }));
        console.log('रद्दी मूल्ये (साफ केलेले):', wasteValues);
        const totalWasteAmount = wasteValues.reduce((sum, item) => sum + item.waste, 0);
        console.log('एकूण रद्दी (राऊंड फिगर):', Math.round(totalWasteAmount));
        totalWaste.textContent = `तुमच्यासह एकूण रद्दी संकलित: ${Math.round(totalWasteAmount)} किलो`;

        // Load funds data
        fetch(FUNDS_SHEET_URL)
          .then(res => {
            if (!res.ok) {
              throw new Error(`निधी डेटा लोड करताना त्रुटी: HTTP ${res.status}. कृपया शीट नाव (FUNDS) आणि ॲक्सेस तपासा.`);
            }
            return res.json();
          })
          .then(funds => {
            console.log('कच्चा निधी डेटा (FUNDS शीट):', funds);
            const fundValues = funds.map(row => ({
              fund: cleanNumericData(row['रक्कम ₹'] || row['Amount'] || row['रक्कम'] || row['amount ₹'] || row['Amount ₹'] || 0),
              raw: row['रक्कम ₹'] || row['Amount'] || row['रक्कम'] || row['amount ₹'] || row['Amount ₹'] || 'N/A'
            }));
            console.log('निधी मूल्ये (साफ केलेले):', fundValues);
            const totalFundsAmount = fundValues.reduce((sum, item) => sum + item.fund, 0);
            console.log('एकूण निधी:', totalFundsAmount);
            totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: ${Math.round(totalFundsAmount)} रु.`;
            if (totalFundsAmount === 0) {
              console.warn('निधी डेटा रिक्त किंवा अवैध आहे. शीट ॲक्सेस किंवा डेटा तपासा.');
            }
            totalsDisplay.style.display = 'block';
          })
          .catch(err => {
            console.error('निधी डेटा लोड करताना त्रुटी:', err);
            totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: 0 रु.`;
            totalsDisplay.style.display = 'block';
          });
      })
      .catch(err => {
        console.error('रद्दी डेटा लोड करताना त्रुटी:', err);
        totalWaste.textContent = `तुमच्यासह एकूण रद्दी संकलित: 0 किलो`;
        totalFunds.textContent = `तुमच्यासह एकूण निधी प्राप्त: 0 रु.`;
        totalsDisplay.style.display = 'block';
      });
  }

  // Form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    thankyouMessage.style.display = 'none';
    totalsDisplay.style.display = 'none';

    const dateVal = dateInput.value;
    const wasteVal = wasteInput.value;
    if (!form.checkValidity() || !dateVal || dateVal < minDate || dateVal > maxDate || !isWeekend(dateVal) || isNaN(parseFloat(wasteVal)) || parseFloat(wasteVal) < 0) {
      errorMsg.textContent = 'सर्व फिल्ड्स तपासा. रद्दीचे वजन केवळ पॉझिटिव्ह आकड्यांमध्ये असावे आणि तारीख शनिवार किंवा रविवार असावी.';
      errorMsg.style.display = 'block';
      return;
    }
    errorMsg.style.display = 'none';

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });
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
          typeWriterEffect(thankyouMessage, thankyouMessage.textContent, () => {
            totalsDisplay.style.display = 'block';
            thankyouExitBtn.style.display = 'block';
            loadTotalsData();
          });
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
    thankyouExitBtn.style.display = 'none';
  });

  qrPayBtn && qrPayBtn.addEventListener('click', function () {
    window.location.href = 'upi://pay?pa=YOURUPIID@okicici&pn=SamajikDiwali&cu=INR';
  });

  // Typing effect function (left-to-right)
  function typeWriterEffect(element, text, callback) {
    element.textContent = '';
    element.style.textAlign = 'justify';
    let index = 0;
    const speed = 50; // Speed in milliseconds
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    }
    type();
  }
});

// CSS styles
const style = document.createElement('style');
style.textContent = `
  .location-loading-placeholder::placeholder {
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  #totalsDisplay {
    max-width: 400px;
    margin: 20px auto;
    padding: 0 16px;
    display: none;
  }
  #totalWaste, #totalFunds {
    background: #e3fafc;
    border: 1px solid #19aab8;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 500;
    color: #15626a;
    box-shadow: 0 2px 8px rgba(0,0,60,0.1);
  }
  #thankyouExitBtn {
    display: none;
    margin-top: 10px;
    padding: 5px 10px;
    border: 1px solid #000;
    background-color: #fff;
    cursor: pointer;
    border-radius: 3px;
  }
  #thankyouMessage {
    text-align: justify;
  }
`;
document.head.appendChild(style);
