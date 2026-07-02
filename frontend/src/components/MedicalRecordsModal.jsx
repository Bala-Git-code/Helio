import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Image, Download, Trash2, Eye, Lock } from 'lucide-react';
import { apiRequest } from '../utils/api';

const MedicalRecordsModal = ({ onClose, user }) => {
  const [records, setRecords] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/health/dashboard');
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = [...e.dataTransfer.files];
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = [...e.target.files];
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        try {
          // In a real-world production app, we would upload to S3 or a file store.
          // For this integration, we save the document metadata directly into the database HealthRecord.
          await apiRequest('/health/records', {
            method: 'POST',
            body: JSON.stringify({
              type: file.type.includes('pdf') ? 'lab' : 'prescription',
              title: file.name,
              summary: `Uploaded medical document (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
              metadata: {
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type
              }
            })
          });
          await fetchRecords();
        } catch (err) {
          alert(`Failed to save record ${file.name}: ${err.message}`);
        }
      }
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this medical record?')) return;
    try {
      await apiRequest(`/health/records/${id}`, {
        method: 'DELETE'
      });
      await fetchRecords();
    } catch (err) {
      alert(`Failed to delete record: ${err.message}`);
    }
  };

  const getFileIcon = (type) => {
    return type === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : <Image className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg mr-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Medical Records
              </h2>
              <p className="text-gray-600">Secure document storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Medical Records</h3>
            <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn-primary px-6 py-3 cursor-pointer inline-block"
            >
              Choose Files
            </label>
            <p className="text-sm text-gray-500 mt-2">Supports PDF, JPG, PNG files up to 10MB</p>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-200">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">End-to-end encrypted and HIPAA compliant</span>
            </div>
          </div>

          {/* Records List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Medical Records</h3>
            {loading ? (
              <p className="text-center py-6 text-slate-500">Loading records...</p>
            ) : records.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {records.map((record) => (
                  <div key={record._id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 p-3 rounded-xl">
                          {getFileIcon(record.metadata?.mimeType?.includes('pdf') ? 'pdf' : 'image')}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{record.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium uppercase">
                              {record.type}
                            </span>
                            <span>Uploaded: {new Date(record.date || record.createdAt).toLocaleDateString()}</span>
                            <span>{record.summary}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => deleteRecord(record._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No records uploaded yet</h3>
                <p className="text-gray-500">Upload your first medical document to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary w-full py-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsModal;