export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn'

interface StyleSet {
  casual: string
  professional: string
  formal: string
}

interface LanguageTemplates {
  paymentLink: string
  gentle: StyleSet
  firm: StyleSet
  urgent: StyleSet
}

const translations: Record<Language, LanguageTemplates> = {
  en: {
    paymentLink: '\n\nPay here: {upiLink}',
    gentle: {
      casual: 'Hey {clientName}! Just a quick reminder about invoice {invoiceNumber} for {amount} (due {dateStr}). No rush, just didn\'t want it to slip through the cracks!{paymentLink}',
      professional: 'Hi {clientName}, hope you\'re doing well. Just a friendly reminder about invoice {invoiceNumber} for {amount} (due {dateStr}). Please let me know if there\'s anything you need from my end.{paymentLink}',
      formal: 'Dear {clientName}, I hope this message finds you well. This is a gentle reminder regarding invoice {invoiceNumber} for {amount}, which was due on {dateStr}. Please let me know if you need any clarification.{paymentLink}',
    },
    firm: {
      casual: 'Hey {clientName}, following up on invoice {invoiceNumber} for {amount}. It\'s been {overdueText}. Could you please update me on the payment status?{paymentLink}',
      professional: 'Hi {clientName}, following up on invoice {invoiceNumber} for {amount}. This is now {overdueText}. Could you please provide an update on when I can expect the payment?{paymentLink}',
      formal: 'Dear {clientName}, I am writing to follow up on invoice {invoiceNumber} for {amount}, which is now {overdueText}. I would appreciate an update on the payment timeline.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, invoice {invoiceNumber} for {amount} is now {overdueText}. I need this resolved this week. Please let me know when the payment will be processed.{paymentLink}',
      professional: 'Hi {clientName}, invoice {invoiceNumber} for {amount} is now {overdueText}. I need this resolved urgently. Please confirm when the payment will be processed.{paymentLink}',
      formal: 'Dear {clientName}, this is an urgent follow-up regarding invoice {invoiceNumber} for {amount}, which is now {overdueText}. I request immediate payment or a clear timeline for settlement.{paymentLink}',
    },
  },
  hi: {
    paymentLink: '\n\nयहाँ भुगतान करें: {upiLink}',
    gentle: {
      casual: 'नमस्ते {clientName}! चालान {invoiceNumber} ({amount}) के बारे में एक अनुस्मारक, जो {dateStr} को देय था। बस याद दिला रहा हूँ!{paymentLink}',
      professional: 'नमस्ते {clientName}, आशा है आप ठीक हैं। चालान {invoiceNumber} ({amount}) के संबंध में एक विनम्र अनुस्मारक, जो {dateStr} को देय था।{paymentLink}',
      formal: 'प्रिय {clientName}, मुझे आशा है कि आप कुशल होंगे। यह चालान {invoiceNumber} ({amount}) के संबंध में एक विनम्र अनुस्मारक है, जो {dateStr} को देय था।{paymentLink}',
    },
    firm: {
      casual: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) के बारे में फॉलो-अप। यह अब {overdueText} है। कृपया भुगतान की स्थिति के बारे में मुझे अपडेट करें।{paymentLink}',
      professional: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) के लिए फॉलो-अप। यह अब {overdueText} है। कृपया मुझे बताएं कि मैं भुगतान कब उम्मीद कर सकता हूं।{paymentLink}',
      formal: 'प्रिय {clientName}, मैं चालान {invoiceNumber} ({amount}) के संबंध में फॉलो-अप कर रहा हूं, जो अब {overdueText} है। कृपया भुगतान समयरेखा पर अपडेट प्रदान करें।{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, चालान {invoiceNumber} ({amount}) अब {overdueText} है। मुझे इस सप्ताह इसे हल करना है। कृपया मुझे बताएं कि भुगतान कब होगा।{paymentLink}',
      professional: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) अब {overdueText} है। मुझे इसे तत्काल हल करना है। कृपया पुष्टि करें कि भुगतान कब संसाधित किया जाएगा।{paymentLink}',
      formal: 'प्रिय {clientName}, यह चालान {invoiceNumber} ({amount}) के संबंध में एक तत्काल अनुस्मारक है, जो अब {overdueText} है। मैं तत्काल भुगतान या निपटान के लिए स्पष्ट समयरेखा का अनुरोध करता हूं।{paymentLink}',
    },
  },
  ta: {
    paymentLink: '\n\nஇங்கு செலுத்தவும்: {upiLink}',
    gentle: {
      casual: 'வணக்கம் {clientName}! {amount} தொகைக்கான {invoiceNumber} என்ற விலைப்பட்டியல் பற்றி ஒரு நினைவூட்டல், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
      professional: 'வணக்கம் {clientName}, நீங்கள் நலமாக இருப்பீர்கள் என நம்புகிறேன். {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி ஒரு நினைவூட்டல், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, இது {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றிய ஒரு நினைவூட்டலாகும், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
    },
    firm: {
      casual: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சி. இது இப்போது {overdueText} ஆகிறது. தயவுசெய்து கட்டணம் செலுத்தும் நிலை குறித்து எனக்கு அறிவிக்கவும்.{paymentLink}',
      professional: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சி. இது இப்போது {overdueText} ஆகிறது. எப்போது கட்டணத்தை எதிர்பார்க்கலாம் என்பதை தயவுசெய்து எனக்குத் தெரிவிக்கவும்.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, நான் {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சியாக கேட்கிறேன், இது இப்போது {overdueText} ஆகிறது. தயவுசெய்து கட்டணம் செலுத்தும் காலவரிசை குறித்த புதுப்பிப்பை வழங்கவும்.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் இப்போது {overdueText} ஆகிறது. இந்த வாரம் இதை தீர்க்க வேண்டும். கட்டணம் எப்போது செலுத்தப்படும் என்று தெரிவிக்கவும்.{paymentLink}',
      professional: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் இப்போது {overdueText} ஆகிறது. இதை உடனடியாக தீர்க்க வேண்டும். கட்டணம் எப்போது செயலாக்கப்படும் என்பதை உறுதிப்படுத்தவும்.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, இது {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றிய அவசர நினைவூட்டலாகும், இது இப்போது {overdueText} ஆகிறது. உடனடி கட்டணம் அல்லது தீர்வுக்கான தெளிவான காலவரிசையை நான் கோருகிறேன்.{paymentLink}',
    },
  },
  te: {
    paymentLink: '\n\nఇక్కడ చెల్లించండి: {upiLink}',
    gentle: {
      casual: 'హాయ్ {clientName}! {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
      professional: 'హలో {clientName}, మీరు బాగున్నారని ఆశిస్తున్నాను. {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి స్నేహపూర్వక గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, ఈ సందేశం మీకు చేరుతుందని ఆశిస్తున్నాను. ఇది {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి సున్నితమైన గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
    },
    firm: {
      casual: 'హాయ్ {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి ఫాలో-అప్. ఇది ఇప్పుడు {overdueText} అయింది. దయచేసి చెల్లింపు స్థితి గురించి నాకు తెలియజేయండి.{paymentLink}',
      professional: 'హలో {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ కోసం ఫాలో-అప్. ఇది ఇప్పుడు {overdueText} అయింది. నేను ఎప్పుడు చెల్లింపును ఆశించవచ్చో దయచేసి తెలియజేయండి.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, నేను {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి ఫాలో-అప్ చేస్తున్నాను, ఇది ఇప్పుడు {overdueText} అయింది. దయచేసి చెల్లింపు కాలక్రమంపై అప్‌డేట్ అందించండి.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ ఇప్పుడు {overdueText} అయింది. నేను దీన్ని ఈ వారంలో పరిష్కరించాలి. చెల్లింపు ఎప్పుడు ప్రాసెస్ చేయబడుతుందో దయచేసి తెలియజేయండి.{paymentLink}',
      professional: 'హలో {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ ఇప్పుడు {overdueText} అయింది. నేను దీన్ని అత్యవసరంగా పరిష్కరించాలి. చెల్లింపు ఎప్పుడు ప్రాసెస్ చేయబడుతుందో దయచేసి నిర్ధారించండి.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, ఇది {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి అత్యవసర గుర్తు, ఇది ఇప్పుడు {overdueText} అయింది. నేను తక్షణ చెల్లింపు లేదా పరిష్కారానికి స్పష్టమైన కాలక్రమాన్ని అభ్యర్థిస్తున్నాను.{paymentLink}',
    },
  },
  bn: {
    paymentLink: '\n\nএখানে অর্থ প্রদান করুন: {upiLink}',
    gentle: {
      casual: 'হ্যালো {clientName}! {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
      professional: 'হাই {clientName}, আশা করি আপনি ভাল আছেন। {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি বিনীত অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
      formal: 'প্রিয় {clientName}, আমি আশা করি এই বার্তাটি আপনাকে সুস্থ অবস্থায় পৌঁছাবে। এটি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি বিনীত অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
    },
    firm: {
      casual: 'হ্যালো {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে ফলো-আপ। এটি এখন {overdueText} হয়েছে। দয়া করে পেমেন্ট স্ট্যাটাস সম্পর্কে আমাকে আপডেট দিন।{paymentLink}',
      professional: 'হাই {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটির জন্য ফলো-আপ। এটি এখন {overdueText} হয়েছে। আমি কখন পেমেন্ট আশা করতে পারি দয়া করে জানান।{paymentLink}',
      formal: 'প্রিয় {clientName}, আমি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে ফলো-আপ করছি, যা এখন {overdueText} হয়েছে। দয়া করে পেমেন্ট টাইমলাইনে একটি আপডেট দিন।{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি এখন {overdueText} হয়েছে। আমার এই সপ্তাহে এটি সমাধান করতে হবে। পেমেন্ট কখন প্রক্রিয়া করা হবে দয়া করে জানান।{paymentLink}',
      professional: 'হাই {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি এখন {overdueText} হয়েছে। আমার এটি জরুরিভাবে সমাধান করতে হবে। পেমেন্ট কখন প্রক্রিয়া করা হবে দয়া করে নিশ্চিত করুন।{paymentLink}',
      formal: 'প্রিয় {clientName}, এটি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি জরুরি অনুস্মারক, যা এখন {overdueText} হয়েছে। আমি তাৎক্ষণিক পেমেন্ট বা নিষ্পত্তির জন্য একটি স্পষ্ট সময়সীমা অনুরোধ করছি।{paymentLink}',
    },
  },
}

export function getTranslation(language: Language, escalationLevel: string, userStyle: string): (params: Record<string, string>) => string {
  const lang = translations[language] || translations.en
  const level = escalationLevel as 'gentle' | 'firm' | 'urgent'
  const style = userStyle as 'casual' | 'professional' | 'formal'
  const template = lang[level]?.[style] || lang.gentle.professional

  return (params: Record<string, string>) => {
    let message = template
    if (params.paymentLink) {
      const linkText = (lang.paymentLink || '\n\nPay here: {upiLink}').replace('{upiLink}', params.paymentLink)
      message = message.replace('{paymentLink}', linkText)
    } else {
      message = message.replace('{paymentLink}', '')
    }
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'paymentLink') {
        message = message.replace(`{${key}}`, value)
      }
    })
    return message
  }
}

export function getAvailableLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
  ]
}
