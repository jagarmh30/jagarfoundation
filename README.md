# jagarfoundation
We have been collecting old newspapers for the past 12 years, selling them, and using the proceeds to help those in need.

opensheet.elk.sh API URL तयार करा.
opensheet.elk.sh चे फायदे - authentication लागत नाही (Sheet public असेल तर)
कोणत्याही वेबसाइट/JS/Google Apps Script मध्ये वापरता येते. JSON स्वरूपात data मिळतो.
कुठे वापरू शकता? - संयोजकांची यादी, volunteers, इतर dynamic डेटा वेबसाइटसाठी. तुमच्या JS/HTML मध्ये संयोजकांची यादी दाखवण्यासाठी.

Google Apps Script किंवा Google Sheets API वापरणे सुरक्षित आहे, कारण यामुळे तुम्हाला डेटा ॲक्सेसवर अधिक नियंत्रण मिळेल.

सुरक्षा आणि टीप्स

कॅशिंग टाळा: ?t=' + Date.now() हे प्रत्येक वेळी नवीन डेटा मिळवण्यासाठी आहे. जर यादी अजूनही अपडेट होत नसेल, तर OpenSheet ऐवजी Google Apps Script वापरण्याचा विचार करा.

डेटा स्वच्छता: गुगल शीटमधील कॉलम C मध्ये अनावश्यक स्पेसेस किंवा विशेष कॅरेक्टर्स नाहीत याची खात्री करा.

लॉगिंग: डेटा योग्यरित्या लोड होत आहे का ते तपासण्यासाठी, fetch ब्लॉकमध्ये लॉगिंग जोडा:
