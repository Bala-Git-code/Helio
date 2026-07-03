/**
 * HELIO Medical Intelligence & Document Comprehension Engine
 * Client-side clinical parser, medical entity extractor, and duplicate auditing utility.
 */

// Clinical Terminology Translation Dictionary
const medicalTermDictionary = {
  hba1c: {
    term: "HbA1c",
    meaning: "Average blood sugar levels over the last 3 months. Essential index for monitoring diabetes.",
    friendly: "Average 3-month Blood Sugar"
  },
  hypertension: {
    term: "Hypertension",
    meaning: "Forces of blood pushing against artery walls are consistently too high, stressing the heart.",
    friendly: "High Blood Pressure"
  },
  hyperlipidemia: {
    term: "Hyperlipidemia",
    meaning: "High concentrations of lipids (cholesterol or fats) present in blood, which can clog vessels.",
    friendly: "High Cholesterol"
  },
  tachycardia: {
    term: "Tachycardia",
    meaning: "Heart rate resting above 100 beats per minute, indicating stress or cardiac work load.",
    friendly: "Rapid Resting Heart Rate"
  },
  lisinopril: {
    term: "Lisinopril",
    meaning: "An ACE inhibitor medicine designed to relax blood vessels, lowering blood pressure.",
    friendly: "Blood Pressure Relaxant"
  },
  metformin: {
    term: "Metformin",
    meaning: "First-line medicine for Type 2 Diabetes. Improves insulin sensitivity and lowers blood sugar.",
    friendly: "Blood Sugar Regulator"
  },
  bmp: {
    term: "Basic Metabolic Panel (BMP)",
    meaning: "Blood chemistry profile checking electrolyte balances, glucose levels, and kidney filtration metrics.",
    friendly: "Key Metabolic Chemistry Panel"
  }
};

/**
 * Maps complex medical terminologies to patient-friendly explanations.
 */
export const translateTerm = (text = '') => {
  const words = text.toLowerCase();
  const matched = [];
  
  for (const key of Object.keys(medicalTermDictionary)) {
    if (words.includes(key)) {
      matched.push(medicalTermDictionary[key]);
    }
  }
  
  return matched;
};

/**
 * Scans filename and content attributes to build a mock structured clinical extraction object.
 * Simulates high-precision OCR and entity extraction.
 */
export const extractDocumentIntelligence = (fileName = '') => {
  const nameLower = fileName.toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  // 1. PRESCRIPTION CLASSIFICATION
  if (nameLower.includes('presc') || nameLower.includes('rx') || nameLower.includes('med')) {
    return {
      title: "Clinician Prescription slip",
      type: "prescription",
      doctor: "Dr. Gregory House",
      hospital: "Helio General Hospital",
      date: today,
      diagnosis: "Hypertension and Mild Glycemia",
      summary: "Lisinopril 10mg once daily for pressure control. Metformin 500mg twice daily for sugar control.",
      medicines: [
        {
          name: "Lisinopril",
          dosage: "10mg",
          frequency: "Once daily",
          times: ["08:00"],
          duration: "30 days",
          intakeTiming: "after food",
          notes: "Take in the morning with water."
        },
        {
          name: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily",
          times: ["08:00", "20:00"],
          duration: "60 days",
          intakeTiming: "after food",
          notes: "Take with breakfast and dinner."
        }
      ],
      labValues: []
    };
  }

  // 2. CHEMICAL BLOOD TEST / LAB REPORT CLASSIFICATION
  if (nameLower.includes('lab') || nameLower.includes('blood') || nameLower.includes('chem') || nameLower.includes('report')) {
    return {
      title: "Basic Metabolic Panel (BMP) Blood Test",
      type: "lab",
      doctor: "Dr. Lisa Cuddy",
      hospital: "Helio Laboratory Department",
      date: today,
      diagnosis: "Routine Metabolic Screen",
      summary: "Glucose level is slightly elevated (104 mg/dL) and HbA1c is 5.9% (pre-diabetic range). Electrolytes are balanced.",
      medicines: [],
      labValues: [
        {
          name: "Glucose (Fasting)",
          value: 104,
          unit: "mg/dL",
          range: "70 - 99",
          status: "attention",
          notes: "Slightly elevated fasting level."
        },
        {
          name: "Sodium",
          value: 140,
          unit: "mEq/L",
          range: "135 - 145",
          status: "stable",
          notes: "Excellent hydration level."
        },
        {
          name: "Potassium",
          value: 4.1,
          unit: "mEq/L",
          range: "3.5 - 5.0",
          status: "stable",
          notes: "Normal muscle and nerve function parameters."
        },
        {
          name: "HbA1c",
          value: 5.9,
          unit: "%",
          range: "< 5.7",
          status: "attention",
          notes: "Pre-diabetes threshold. Diet control recommended."
        }
      ]
    };
  }

  // 3. IMAGING / SCANS CLASSIFICATION (MRI, X-Ray)
  return {
    title: "Diagnostic Chest X-Ray",
    type: "lab",
    doctor: "Dr. James Wilson",
    hospital: "Helio Imaging Clinic",
    date: today,
    diagnosis: "Infection Audit",
    summary: "Clear lung fields bilaterally. Cardiomediastinal contour appears within standard clinical configurations. Zero pleural abnormalities.",
    medicines: [],
    labValues: []
  };
};

/**
 * Checks database documents for possible duplicate file uploads by title comparison.
 */
export const checkDuplicateDocument = (records = [], newTitle = '') => {
  if (!newTitle) return false;
  return records.some(r => r.title.toLowerCase().trim() === newTitle.toLowerCase().trim());
};
