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
      const lastOption = 'यापैकी कोणीही नाही अन्य मार्ग'; // शेवटचा पर्याय ओळखा
      const items = data.map(row => {
        const fullName = (row['संयोजकाचे नाव'] || row[2] || '').toString().trim();
        // क्रमवारीसाठी उपाधी काढून टाकणे
        const sortKey = fullName.replace(/^(श्री\.?|श्रीमती\.?|कु\.?|डॉ\.?)\s*/i, '').trim();
        return {
          displayName: fullName, // ड्रॉपडाउनमध्ये पूर्ण नाव (उपाधीसह)
          sortKey: sortKey, // क्रमवारीसाठी उपाधीशिवाय नाव
          isLastOption: fullName === lastOption // शेवटचा पर्याय आहे का?
        };
      }).filter(it => it.displayName); // रिक्त नावे वगळा

      console.log('प्रोसेस्ड नावे:', items); // डिबगिंगसाठी: प्रोसेस्ड नावे लॉग करा

      // मराठी क्रमवारीनुसार यादी क्रमवारी लावा (शेवटचा पर्याय वगळून)
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      const regularItems = items.filter(item => !item.isLastOption);
      const lastItem = items.find(item => item.isLastOption);
      regularItems.sort((a, b) => {
        const comparison = collator.compare(a.sortKey, b.sortKey);
        console.log(`क्रमवारी तुलना: ${a.sortKey} vs ${b.sortKey} = ${comparison}`); // डिबगिंगसाठी
        return comparison;
      });

      // ड्रॉपडाउन यादी तयार करा
      referenceSelect.innerHTML = ''; // यादी रिकामी करा
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- संयोजक निवडा --';
      defaultOption.style.textAlign = 'center'; // डीफॉल्ट पर्याय सेंटर अलाइन्ड
      referenceSelect.appendChild(defaultOption);

      // नियमित पर्याय जोडा (लेफ्ट अलाइन्ड)
      regularItems.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.displayName;
        opt.textContent = item.displayName;
        opt.style.textAlign = 'left'; // पर्याय लेफ्ट अलाइन्ड
        referenceSelect.appendChild(opt);
      });

      // शेवटचा पर्याय जोडा (लेफ्ट अलाइन्ड)
      if (lastItem) {
        const opt = document.createElement('option');
        opt.value = lastItem.displayName;
        opt.textContent = lastItem.displayName;
        opt.style.textAlign = 'left'; // शेवटचा पर्याय लेफ्ट अलाइन्ड
        referenceSelect.appendChild(opt);
      }

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
    timeslotSelect.innerHTML = ''; // यादी रिकामी करा
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- वेळ निवडा --';
    defaultOption.style.textAlign = 'center'; // डीफॉल्ट पर्याय सेंटर अलाइन्ड
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
      errorOption.style.textAlign = 'center'; // एरर पर्याय सेंटर अलाइन्ड
      timeslotSelect.appendChild(errorOption);
      return;
    }
    timeslotSelect.disabled = false;
    SLOTS.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot.start;
      opt.textContent = slot.label;
      opt.style.textAlign = 'left'; // वेळ स्लॉट लेफ्ट अलाइन्ड
      timeslotSelect.appendChild(opt);
    });
  });

  // वेस्ट इनपुट व्हॅलिडेशन (केवळ आकडे)
  wasteInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9.]/g, ''); // फक्त आकडे आणि दशांश बिंदू स्वीकारा
    if (this.value.includes('.')) {
      const parts = this.value.split('.');
      if (parts.length > 2) this.value = parts[0] + '.' + parts[1]; // एकच दशांश बिंदू
      if (parts[1]?.length > 2) this.value = parts[0] + '.' + parts[1].slice(0, 2); // दशांशानंतर फक्त 2 अंक
    }
  });

  // लोकेशन मिळवणे
  locBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      locationField.classList.add('location-loading-placeholder'); // ब्लिंकिंग प्लेसहोल्डर क्लास जोडा
      locationField.placeholder = 'लोकेशन घेत आहे...'; // ब्लिंकिंग मजकूर
      locationField.value = ''; // इनपुट रिकामी करा
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          locationField.value = `https://maps.google.com/?q=${lat},${lon}`;
          locationField.classList.remove('location-loading-placeholder'); // ब्लिंकिंग क्लास काढा
          locationField.placeholder = '← आयकॉनवर टच करा'; // मूळ प्लेसहोल्डर पुनर्स्थापित करा
        },
        err => {
          alert('लोकेशन मिळवण्यात अडचण आली. कृपया परवानगी द्या.');
          locationField.classList.remove('location-loading-placeholder'); // ब्लिंकिंग क्लास काढा
          locationField.placeholder = '← आयकॉनवर टच करा'; // मूळ प्लेसहोल्डर पुनर्स्थापित करा
        }
      );
    } else {
      alert('तुमचा ब्राउझर लोकेशन सपोर्ट करत नाही.');
      locationField.classList.remove('location-loading-placeholder'); // ब्लिंकिंग क्लास काढा
      locationField.placeholder = '← आयकॉनवर टच करा'; // मूळ प्लेसहोल्डर पुनर्स्थापित करा
    }
  });

  // फॉर्म सबमिट करणे
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    thankyouMessage.style.display = 'none';

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
