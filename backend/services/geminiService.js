const AiExecutionEngine = require('./ai/AiExecutionEngine');

/**
 * Perform a context-aware chat with Gemini for the patient.
 */
exports.chatWithContext = async (patientContext, messageHistory, userMessage) => {
  const patientId = String(patientContext.userId || patientContext._id || 'unknown-patient');

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

  // Construct chat session contents using HELIO representation
  const messages = [];
  messages.push({ role: 'system', parts: [{ text: contextPrompt }] });

  // Add recent history (up to 6 messages to keep context window clean)
  const recentHistory = messageHistory.slice(-6);
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.isBot ? 'model' : 'user',
      parts: [{ text: msg.text }]
    });
  });

  // Add current query
  messages.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await AiExecutionEngine.execute({
      tenantId: patientId,
      userId: patientId,
      taskType: 'CHAT_ASSISTANCE',
      messages,
      executionMode: 'NON_STREAMING',
      maxOutputTokens: 2048,
      temperature: 0.7
    });

    return response;
  } catch (error) {
    console.error('[GeminiService] Chat execution error, returning static explanation:', error);
    throw error;
  }
};

/**
 * Parse base64 prescription image using Gemini Vision model via execution platform
 */
exports.parsePrescriptionImage = async (base64Image, mimeType, tenantId = 'system') => {
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const promptText = `
Analyze this medical prescription image and extract the medications listed.
You MUST respond with a valid JSON array of objects representing the medications. Return ONLY the raw JSON string.

Each object in the array must contain:
1. "name": The exact brand or generic name of the medicine (string).
2. "dosage": The dosage (e.g., "500mg", "1 tablet", "10ml") (string).
3. "frequency": How often to take it (e.g., "daily", "twice-daily", "three-times-daily", "weekly", "as-needed") (string).
4. "times": An array of time strings in 24-hour HH:MM format matching the frequency (e.g., ["08:00"] for daily, ["08:00", "20:00"] for twice-daily, etc.) (array of strings).
5. "ingredients": Active pharmaceutical components (e.g., "Acetaminophen", "Amoxicillin") (string, comma-separated if multiple).
6. "notes": Any specific intake instructions (e.g., "Take after food", "Avoid dairy") (string).

If you cannot read or find any medicines in the image, return an empty array: [].
`;

  const messages = [
    {
      role: 'user',
      parts: [
        { text: promptText },
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        }
      ]
    }
  ];

  const targetSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        dosage: { type: 'string' },
        frequency: { type: 'string' },
        times: { type: 'array', items: { type: 'string' } },
        ingredients: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['name', 'dosage', 'frequency']
    }
  };

  try {
    const textResponse = await AiExecutionEngine.execute({
      tenantId,
      userId: tenantId,
      taskType: 'PRESCRIPTION_OCR',
      messages,
      executionMode: 'NON_STREAMING',
      maxOutputTokens: 4096,
      temperature: 0.1,
      structuredOutput: {
        schema: targetSchema
      }
    });

    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[GeminiService] OCR image parsing execution error:', error);
    throw error;
  }
};

exports.disableGenAI = () => {
  // Legacy stub, no-op since engine handles lifecycle and offline fallback automatically
};
