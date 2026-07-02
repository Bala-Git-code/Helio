import React, { useState } from 'react';
import { X, Plus, Mic, MicOff, Pill, Clock, AlertTriangle, FileText, Upload, Sparkles, Loader } from 'lucide-react';
import { apiRequest } from '../utils/api';

const MedicineReminder = ({ onClose, onAddMedicine }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    ingredients: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });
  
  const [isListening, setIsListening] = useState(false);
  const [allergyWarning, setAllergyWarning] = useState('');
  
  // OCR states
  const [isScanning, setIsScanning] = useState(false);
  const [ocrError, setOcrError] = useState('');

  // Check allergies
  const checkAllergies = (medicineIngredients, userAllergies) => {
    if (!medicineIngredients || !userAllergies) return '';
    
    const ingredients = medicineIngredients.toLowerCase().split(',').map(i => i.trim());
    const allergies = userAllergies.map(a => a.toLowerCase());
    
    for (const ingredient of ingredients) {
      for (const allergy of allergies) {
        if (ingredient.includes(allergy) || allergy.includes(ingredient)) {
          return `Warning: this medication may contain ${allergy.toUpperCase()}, which you are allergic to.`;
        }
      }
    }
    return '';
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Parse voice input
        const medicineMatch = transcript.match(/(\w+)\s+(?:at|@)\s+(\d{1,2}:?\d{0,2})\s*(am|pm)?/i);
        
        if (medicineMatch) {
          const [, medicine, time, period] = medicineMatch;
          let formattedTime = time;
          
          if (!time.includes(':')) {
            formattedTime = time + ':00';
          }
          if (period) {
            formattedTime += ' ' + period.toUpperCase();
          }
          
          setFormData({
            ...formData,
            name: medicine,
            times: [formattedTime]
          });
        } else {
          const words = transcript.split(' ');
          setFormData({
            ...formData,
            name: words[0] || transcript
          });
        }
        
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Voice recognition not supported in this browser');
    }
  };

  const handleOCRFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setOcrError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          const res = await apiRequest('/health/ocr', {
            method: 'POST',
            body: JSON.stringify({
              base64Image: base64,
              mimeType: file.type
            })
          });

          if (res.medicines && res.medicines.length > 0) {
            const firstMed = res.medicines[0];
            setFormData({
              name: firstMed.name || '',
              dosage: firstMed.dosage || '',
              frequency: firstMed.frequency || 'daily',
              times: firstMed.times && firstMed.times.length > 0 ? firstMed.times : ['08:00'],
              ingredients: firstMed.ingredients || '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              notes: firstMed.notes || ''
            });
            alert(`Prescription scanned successfully! Auto-populated: ${firstMed.name} (${firstMed.dosage}).`);
          } else {
            setOcrError('No medicines could be parsed from the prescription image.');
          }
        } catch (err) {
          setOcrError(err.message || 'Visual OCR parsing failed.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrError('Failed to read file.');
      setIsScanning(false);
    }
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '08:00']
    });
  };

  const updateTime = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({
      ...formData,
      times: newTimes
    });
  };

  const removeTimeSlot = (index) => {
    const newTimes = formData.times.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      times: newTimes
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (allergyWarning) {
      const confirmed = window.confirm(
        `${allergyWarning}\n\nAre you sure you want to add this medication? Please consult your doctor first.`
      );
      if (!confirmed) return;
    }
    
    const medicine = {
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      times: formData.times.filter(time => time.trim() !== ''),
      startDate: formData.startDate,
      endDate: formData.endDate,
      ingredients: formData.ingredients,
      notes: formData.notes
    };
    
    onAddMedicine(medicine);
    onClose();
  };

  // Check allergies
  React.useEffect(() => {
    const userAllergies = ['penicillin', 'sulfa', 'aspirin'];
    const warning = checkAllergies(formData.ingredients, userAllergies);
    setAllergyWarning(warning);
  }, [formData.ingredients]);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg mr-4">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Add Medication Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* OCR Scanner Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5 mb-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-indigo-900 flex items-center gap-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Smart Prescription OCR Scanner
            </h3>
            <p className="text-xs text-indigo-700 mt-1">Upload a prescription image to auto-extract and schedule medicines via Gemini.</p>
          </div>
          <div>
            <input 
              type="file" 
              id="ocr-upload" 
              accept="image/*"
              onChange={handleOCRFileChange} 
              className="hidden" 
              disabled={isScanning}
            />
            <label 
              htmlFor="ocr-upload" 
              className="btn-primary py-2 px-4 text-xs cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-none hover:translate-y-0"
            >
              {isScanning ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scanning...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Scan Image
                </>
              )}
            </label>
          </div>
        </div>

        {ocrError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-xs text-red-700">
            {ocrError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medicine Name with Voice Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field pr-12 text-sm"
                placeholder="e.g. Paracetamol"
                required
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-3 top-3 p-1 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {isListening && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5"></span>
                Listening... Say "Aspirin at 8 PM"
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dosage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                className="input-field text-sm"
                placeholder="e.g. 500mg, 1 tablet"
                required
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Ingredients (Optional)
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                className="input-field text-sm"
                placeholder="e.g. Acetaminophen, Ibuprofen"
              />
            </div>
          </div>

          {/* Allergy Warning */}
          {allergyWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium text-xs">{allergyWarning}</p>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                min={formData.startDate}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Frequency & Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="input-field text-sm"
              >
                <option value="daily">Daily</option>
                <option value="twice-daily">Twice Daily</option>
                <option value="three-times-daily">Three Times Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as-needed">As Needed</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reminder Times
                </label>
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Time
                </button>
              </div>
              <div className="space-y-2">
                {formData.times.map((time, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="input-field pl-9 py-2.5 text-sm"
                        required
                      />
                    </div>
                    {formData.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Dosing Instructions
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input-field text-sm resize-none"
              placeholder="e.g. Take after meals, avoid drinking milk for 2 hours."
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 px-6 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 px-6 py-3"
            >
              Add Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineReminder;
