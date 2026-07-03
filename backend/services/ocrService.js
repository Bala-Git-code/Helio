const fs = require('fs');

class OCRService {
  constructor() {
    this.provider = process.env.OCR_PROVIDER || 'mock';
  }

  async extractText(filePath, mimeType) {
    console.log(`[OCRService] Running extraction using provider: ${this.provider} for path: ${filePath}`);
    
    // Simulate slight async latency for OCR scan
    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.provider === 'mock') {
      return this.getMockOCRText(filePath);
    }

    // Default fallback
    return `HELIO SCAN AUTO EXTRACT:\nPatient: Alice Smith\nDoctor: Dr. Gregory House\nHospital: Helio Central Hospital\nDiagnosis: Hypertension & Diabetes\nPrescribed: Lisinopril 10mg once daily in morning. Metformin 500mg twice daily with meals.`;
  }

  getMockOCRText(filePath) {
    const filename = filePath.toLowerCase();
    
    if (filename.includes('presc') || filename.includes('rx') || filename.includes('med')) {
      return `PRESCRIPTION RECORD:\nHELIO INTEGRATED CLINIC\nDoctor: Dr. Gregory House\nPatient Name: Alice Smith\nDiagnosis: Essential Hypertension\nRx List:\n1. Lisinopril 10mg - once daily after food in morning.\n2. Metformin 500mg - twice daily with meals.\nDuration: 30 days. Signature Verified.`;
    }

    if (filename.includes('lab') || filename.includes('blood') || filename.includes('report')) {
      return `HELIO DIAGNOSTIC LABS REPORT:\nPatient ID: P-9812\nDoctor: Dr. Lisa Cuddy\nFasting Blood Glucose: 104 mg/dL [Reference range: 70-99] [ELEVATED]\nHbA1c: 5.9% [Reference range: <5.7%] [PRE-DIABETIC]\nSodium level: 140 mEq/L [Reference: 135-145] [NORMAL]\nPotassium level: 4.1 mEq/L [Reference: 3.5-5.0] [NORMAL]\nEvaluation: Metabolic panels need light diet adjustments.`;
    }

    return `IMAGING LAB WORK:\nHelio Scans Wing\nType: Chest X-Ray\nPhysician: Dr. James Wilson\nResults: Clear lungs. No active tissue infections. Cardiac profile normal.`;
  }
}

module.exports = new OCRService();
