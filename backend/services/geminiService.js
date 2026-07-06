const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log(' Gemini Gen AI Service initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini Gen AI:', error);
  }
} else {
  console.warn(' WARNING: GEMINI_API_KEY is not defined in the backend environment. Running in mock/simulation mode.');
}

/**
 * Perform a context-aware chat with Gemini for the patient.
 */
exports.chatWithContext = async (patientContext, messageHistory, userMessage) => {
  if (!genAI) {
    return simulateChatResponse(patientContext, userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format medical context
    const contextPrompt = `
You are Helio, an empathetic, highly skilled, and professional AI Health Assistant for a premium healthcare platform.
Your tone must be calm, compassionate, clear, professional, and reassuring. Always maintain a premium, luxury clinic bedside manner.

PATIENT INFORMATION:
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Gender: ${patientContext.gender}
- Allergies: ${patientContext.allergies?.join(', ') || 'None listed'}
- Conditions: ${patientContext.conditions?.join(', ') || 'None listed'}

ACTIVE MEDICATIONS:
${patientContext.medications?.map(med => `- ${med.name} (${med.dosage}) - Frequency: ${med.frequency}, Times: ${med.times?.join(', ') || 'N/A'}`).join('\n') || 'None listed'}

UPCOMING APPOINTMENTS:
${patientContext.appointments?.map(apt => `- Dr. ${apt.doctorName} (${apt.specialty}) on ${new Date(apt.date).toLocaleDateString()} at ${apt.time}`).join('\n') || 'None scheduled'}

RECENT CLINICAL NOTES FROM DOCTORS:
${patientContext.notes?.map(note => `- [${note.category}] ${note.title}: ${note.content}`).join('\n') || 'None recorded'}

RULES:
1. Provide plain-language, actionable guidance.
2. If the user asks about their medicines, appointments, or allergies, refer to their active records listed above.
3. Check for drug-allergy interactions if they ask about taking a new drug (e.g. they are allergic to Penicillin and ask about taking Amoxicillin, warn them).
4. Always state: "Please consult with your healthcare provider for diagnostic decisions." but still answer their question fully based on general medical guidelines.
5. Keep answers formatting neat with clean bullet points.
`;

    // Construct chat session contents
    const contents = [];
    contents.push({ role: 'user', parts: [{ text: contextPrompt + "\nAcknowledge this context and respond to the patient's message." }] });
    contents.push({ role: 'model', parts: [{ text: "Understood. I will act as Helio, the compassionate healthcare companion. I am aware of the patient's profile, medications, appointments, and allergies, and will provide personalized, empathetic guidance." }] });

    // Add recent history (up to 6 messages to keep context window clean)
    const recentHistory = messageHistory.slice(-6);
    recentHistory.forEach(msg => {
      contents.push({
        role: msg.isBot ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    });

    // Add the current user query
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini chat error:', error);
    return simulateChatResponse(patientContext, userMessage);
  }
};

/**
 * Parse base64 prescription image using Gemini Vision model
 */
exports.parsePrescriptionImage = async (base64Image, mimeType) => {
  if (!genAI) {
    return simulateOCRResponse(base64Image);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analyze this medical prescription image and extract the medications listed.
You MUST respond with a valid JSON array of objects representing the medications. Do not include markdown formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must contain:
1. "name": The exact brand or generic name of the medicine (string).
2. "dosage": The dosage (e.g., "500mg", "1 tablet", "10ml") (string).
3. "frequency": How often to take it (e.g., "daily", "twice-daily", "three-times-daily", "weekly", "as-needed") (string).
4. "times": An array of time strings in 24-hour HH:MM format matching the frequency (e.g., ["08:00"] for daily, ["08:00", "20:00"] for twice-daily, etc.) (array of strings).
5. "ingredients": Active pharmaceutical components (e.g., "Acetaminophen", "Amoxicillin") (string, comma-separated if multiple).
6. "notes": Any specific intake instructions (e.g., "Take after food", "Avoid dairy") (string).

If you cannot read or find any medicines in the image, return an empty array: [].
`;

    const imageParts = [
      {
        inlineData: {
          data: base64Image.split(',')[1] || base64Image,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim();

    // Clean up potential markdown formatting in response
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini OCR error:', error);
    return simulateOCRResponse(base64Image);
  }
};

// --- MOCK FALLBACKS ---

function simulateChatResponse(patientContext, message) {
  const query = message.toLowerCase();
  
  // Specific response templates
  if (query.includes('medicine') || query.includes('medication')) {
    if (patientContext.medications?.length > 0) {
      const list = patientContext.medications.map(m => `- **${m.name}** (${m.dosage}) at ${m.times?.join(', ') || 'unscheduled'}`).join('\n');
      return `Based on your records, here is your active medication rhythm:\n\n${list}\n\nRemember to stay consistent. If you are experiencing side effects or have specific dosing questions, please contact Dr. ${patientContext.appointments?.[0]?.doctorName || 'your doctor'}.`;
    }
    return "You have no active medications scheduled at the moment. Would you like me to help you schedule a new reminder?";
  }

  if (query.includes('allergy') || query.includes('allergic')) {
    if (patientContext.allergies?.length > 0) {
      return `Your care profile lists the following known allergies: **${patientContext.allergies.join(', ')}**. If you are prescribed a new medication, please alert your clinical team. Let me know if you need to check drug compatibility.`;
    }
    return "You do not have any allergies listed in your care profile. If you have known sensitivities (e.g., penicillin, latex, nuts), it is highly recommended to add them to your profile.";
  }

  if (query.includes('appointment') || query.includes('doctor')) {
    if (patientContext.appointments?.length > 0) {
      const list = patientContext.appointments.map(a => `- **Dr. ${a.doctorName}** (${a.specialty}) on ${new Date(a.date).toLocaleDateString()} at ${a.time}`).join('\n');
      return `You have the following upcoming care consultations scheduled:\n\n${list}\n\nI can help you compile clinical preparation notes or questions to ask your doctor. Would you like that?`;
    }
    return "I do not see any upcoming consultations in your workspace. You can schedule appointment reminders directly from the main panel.";
  }

  // General health responses
  return `Thank you for reaching out, ${patientContext.name.split(' ')[0]}. As your Helio Health Assistant, I'm analyzing your queries. 

Regarding your question, standard wellness guidelines suggest maintaining a balanced routine:
- Hydrate consistently (2-3 liters daily).
- Rest well (7-8 hours of sleep).
- Log any symptoms in your Care Timeline.

*Always consult Dr. ${patientContext.appointments?.[0]?.doctorName || 'a physician'} for diagnosis or changes to your therapy plan.*`;
}

function simulateOCRResponse(base64Image) {
  console.log('Simulating prescription OCR parsing...');
  // Simulating a parsed response after a minor delay
  return [
    {
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "three-times-daily",
      times: ["08:00", "14:00", "20:00"],
      ingredients: "Amoxicillin",
      notes: "Finish the full course. Take with meals."
    },
    {
      name: "Ibuprofen",
      dosage: "400mg",
      frequency: "as-needed",
      times: ["12:00"],
      ingredients: "Ibuprofen",
      notes: "Take after food for pain relief."
    }
  ];
}

exports.disableGenAI = () => {
  genAI = null;
};
