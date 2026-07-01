import React, { useState } from 'react';
import { X, Plus, Mic, MicOff, Pill, Clock, AlertTriangle } from 'lucide-react';

const MedicineReminder = ({ onClose, onAddMedicine }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: [''],
    ingredients: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [allergyWarning, setAllergyWarning] = useState('');

  // Mock allergy checking function
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
        
        // Parse voice input (simple pattern matching)
        const medicineMatch = transcript.match(/(\w+)\s+(?:at|@)\s+(\d{1,2}:?\d{0,2})\s*(am|pm)?/i);
        
        if (medicineMatch) {
          const [, medicine, time, period] = medicineMatch;
          let formattedTime = time;
          
          // Format time properly
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
          // If pattern doesn't match, just set the medicine name
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

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '']
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
    
    // Check for allergies before adding medicine
    if (allergyWarning) {
      const confirmed = window.confirm(
        `${allergyWarning}\n\nAre you sure you want to add this medication? Please consult your doctor first.`
      );
      if (!confirmed) return;
    }
    
    const medicine = {
      id: Date.now().toString(),
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      times: formData.times.filter(time => time.trim() !== ''),
      startDate: formData.startDate,
      endDate: formData.endDate,
      ingredients: formData.ingredients
    };
    
    onAddMedicine(medicine);
    onClose();
  };

  // Check allergies when ingredients change
  React.useEffect(() => {
    // Mock user allergies - in real app, this would come from user profile
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
              Add Medicine Reminder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

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
                className="input-field pr-12"
                placeholder="e.g., Paracetamol"
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
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            {isListening && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                Listening... Say something like "Paracetamol at 8 PM"
              </p>
            )}
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosage
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 500mg, 1 tablet"
              required
            />
          </div>

          {/* Ingredients/Active Components */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Ingredients (Optional)
            </label>
            <input
              type="text"
              value={formData.ingredients}
              onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Acetaminophen, Ibuprofen"
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps check for potential allergic reactions
            </p>
          </div>

          {/* Allergy Warning */}
          {allergyWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">{allergyWarning}</p>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for ongoing medication
              </p>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            >
              <option value="daily">Daily</option>
              <option value="twice-daily">Twice Daily</option>
              <option value="three-times-daily">Three Times Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as-needed">As Needed</option>
            </select>
          </div>

          {/* Times */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Reminder Times
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Time
              </button>
            </div>
            <div className="space-y-3">
              {formData.times.map((time, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
