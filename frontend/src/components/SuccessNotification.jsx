// src/components/SuccessNotification.jsx

import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessNotification = ({ message, show }) => {
  return (
    <div
      // This uses Tailwind CSS classes for styling and animation
      className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg bg-white border-l-4 border-emerald-500 transition-all duration-500 transform ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
    >
      <CheckCircle className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0" />
      <div>
        <p className="font-semibold text-gray-800">Login Successful</p>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default SuccessNotification;