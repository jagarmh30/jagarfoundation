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
  const wasteInput = document.getElementById('waste');
  const subtitle = document.querySelector('.subtitle');
  const totalsDisplay = document.getElementById('totalsDisplay');
  const totalWaste = document.getElementById('totalWaste');
  const totalFunds = document.getElementById('totalFunds');

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
        const mobile = (row['मोबाईल नंबर'] || '').toString().trim();

        // मोबाईल नंबर 12 अंकी (91 सह) किंवा 10 अंकी स्वीकारा
        const mobileNum = mobile.replace(/[^0-9]/g, '');
        if (village && fullName && (mobileNum.length === 12 || mobileNum.length === 10)) {
          if (!convenersByVillage[village]) {
            convenersByVillage[village] = [];
            villages.push(village);
          }
          convenersByVillage[village].push({ name: fullName, mobile: mobileNum.slice(-10) }); // फक्त शेवटचे 10 अंक
        } else {
          console.warn(`अवैध डेटा: गाव=${village}, नाव=${fullName}, मोबाईल=${mobile}, लांबी=${mobileNum.length}`);
        }
      });

      // गाव सॉर्ट करणे (मराठी क्रमवारी)
      const collator = new Intl.Collator('mr', { sensitivity: 'base', numeric: true });
      villages.sort((a, b) => collator.compare(a, b));

      // प्रत्येक गावातील संयोजक सॉर्ट करणे
      for (let village in convenersByVillage) {
        convenersByVillage[village].sort((a, b) => collator.compare(a.name, b.name));
      }

      console.log('गावांची यादी:', villages);
      console.log('गावानुसार संयोजक:', convenersByVillage);

      // गाव ड्रॉपड
