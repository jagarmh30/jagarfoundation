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
     const dateSelect = document.getElementById('date');
     const thankyouExitBtn = document.getElementById('thankyouExitBtn');
     const qrPayBtn = document.getElementById('qrPayBtn');
     const quantityInput = document.getElementById('quantity');
     const subtitle = document.querySelector('.subtitle');
     const totalsDisplay = document.getElementById('totalsDisplay');
     const totalWaste = document.getElementById('totalWaste');
     const totalFunds = document.getElementById('totalFunds');

     // डीबग: एलिमेंट्स उपलब्ध आहेत का तपासा
     console.log('Form element:', form);
     console.log('Quantity input:', quantityInput);
     if (!form) {
       console.error('Error: Form with id "main-form" not found in HTML');
       return;
     }
     if (!quantityInput) {
       console.error('Error: Input with id "quantity" not found in HTML');
       return;
     }

     // इमेजेसवर उजव्या क्लिक आणि ड्रॅग अक्षम करणे
     const images = document.querySelectorAll('img');
     images.forEach(img => {
       img.addEventListener('contextmenu', (e) => e.preventDefault());
       img.addEventListener('dragstart', (e) => e.preventDefault());
     });

     // संयोजक आणि गाव डेटा लोड करणे
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

         // गाव सॉर्ट करणे (मराठी क्रमवारी)
         const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
         villages.sort((a, b) => collator.compare(a, b));

         // प्रत्येक गावातील संयोजक सॉर्ट करणे
         for (let village in convenersByVillage) {
           convenersByVillage[village].sort((a, b) => collator.compare(a, b));
         }

         console.log('गावांची यादी:', villages);
         console.log('गावानुसार संयोजक:', convenersByVillage);

         // गाव ड्रॉपडाउन भरा
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

         // संयोजक ड्रॉपडाउन भरा (सुरुवातीला सर्व)
         updateConveners(convenersByVillage);

         // गाव बदलल्यावर संयोजक अपडेट
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

     // संयोजक ड्रॉपडाउन अपडेट फंक्शन
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

       // सर्व संयोजक जोडा
       allConveners.forEach(name => {
         const opt = document.createElement('option');
         opt.value = name;
         opt.textContent = name;
         opt.style.textAlign = 'left';
         referenceSelect.appendChild(opt);
       });

       // शेवटचे नाव "यापैकी कोणीही नाही (अन्य मार्ग)" म्हणून स्वतंत्रपणे जोडा
       const lastOption = "यापैकी कोणीही नाही (अन्य मार्ग)";
       const lastOpt = document.createElement('option');
       lastOpt.value = lastOption;
       lastOpt.textContent = lastOption;
       lastOpt.style.textAlign = 'left';
       referenceSelect.appendChild(lastOpt);
     }

     // तारीख व वेळेचा स्लॉट निवडणे
     const SLOTS = [
       { label: "08:00 AM - 10:00 AM", start: "08:00" },
       { label: "10:00 AM - 12:00 PM", start: "10:00" },
       { label: "12:00 PM - 02:00 PM", start: "12:00" },
       { label: "02:00 PM - 04:00 PM", start: "14:00" },
       { label: "04:00 PM - 06:00 PM", start: "16:00" },
       { label: "05:00 PM - 07:00 PM", start: "17:00" }
     ];

     // तारीख निवडल्यावर टाइमस्लॉट ड्रॉपडाउन अपडेट करणे
     dateSelect.addEventListener('change', function () {
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

       timeslotSelect.disabled = false;
       SLOTS.forEach(slot => {
         const opt = document.createElement('option');
         opt.value = slot.start;
         opt.textContent = slot.label;
         opt.style.textAlign = 'left';
         timeslotSelect.appendChild(opt);
       });
       errorMsg.style.display = 'none';
     });

     // क्वांटिटी इनपुट व्हॅलिडेशन
     quantityInput.addEventListener('input', function () {
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

     // डेटा साफ करणे
     function cleanNumericData(value) {
       if (!value) return 0;
       const cleanedValue = value.toString().replace(/[^0-9.]/g, '');
       const numericValue = parseFloat(cleanedValue);
       return isNaN(numericValue) ? 0 : numericValue;
     }

     // डेटा लोड करणे आणि मजकूर डिस्प्ले अपडेट करणे
     function loadTotalsData() {
       const DONORS_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/Donors?t=' + Date.now();
       const FUNDS_SHEET_URL = 'https://opensheet.elk.sh/1_f1BgjFMTIexP0GzVhapZGOrL1uxQJ3_6EWsAwqkLYQ/FUNDS?t=' + Date.now();

       // रद्दी डेटा लोड करणे
       fetch(DONORS_SHEET_URL)
         .then(res => {
           if (!res.ok) throw new Error(`रद्दी डेटा लोड करताना त्रुटी: HTTP ${res.status}`);
           return res.json();
         })
         .then(data => {
           console.log('कच्चा रद्दी डेटा (Donors शीट):', data);
           const quantityValues = data.map(row => ({
             waste: cleanNumericData(row['Quantity'] || row['quantity'] || 0),
             raw: row['Quantity'] || row['quantity'] || 'N/A'
           }));
           console.log('रद्दी मूल्ये (साफ केलेले):', quantityValues);
           const totalQuantityAmount = quantityValues.reduce((sum, item) => sum + item.waste, 0);
           console.log('एकूण रद्दी (राऊंड फिगर):', Math.round(totalQuantityAmount));
           totalWaste.textContent = `तुमच्यासह एकूण रद्दी संकलित: ${Math.round(totalQuantityAmount)} किलो`;
           // निधी डेटा लोड करणे
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
                 fund: cleanNumericData(row['रक्कम ₹'] || row['Amount'] || row['रक्कम'] || row
