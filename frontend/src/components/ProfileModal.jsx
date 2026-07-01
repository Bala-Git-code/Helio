import React, { useState } from 'react';
import { X, User, Phone, MapPin, Users, Shield, Mail, Pencil, Save, Plus, Trash2 } from 'lucide-react';

const ProfileModal = ({ user, onClose, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile(editedUser);
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const addAllergy = () => {
    setEditedUser(prevUser => ({
      ...prevUser,
      allergies: [...(prevUser.allergies || []), '']
    }));
  };

  const updateAllergy = (index, value) => {
    setEditedUser(prevUser => {
      const newAllergies = [...(prevUser.allergies || [])];
      newAllergies[index] = value;
      return { ...prevUser, allergies: newAllergies };
    });
  };

  const removeAllergy = (index) => {
    setEditedUser(prevUser => {
      const newAllergies = (prevUser.allergies || []).filter((_, i) => i !== index);
      return { ...prevUser, allergies: newAllergies };
    });
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prevUser => ({
      ...prevUser,
      emergencyContact: {
        ...prevUser.emergencyContact,
        [name]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card-strong max-w-2xl w-full max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 relative">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mr-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">Profile Details</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* ✏️ Edit/Save button at top */}
            {isEditing ? (
              <button
                onClick={handleSave}
                className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
                title="Save Changes"
              >
                <Save className="w-6 h-6 text-emerald-600" />
              </button>
            ) : (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Edit Profile"
              >
                <Pencil className="w-6 h-6 text-gray-600" />
              </button>
            )}

            {/* ❌ Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="age"
                      value={editedUser.age}
                      onChange={handlePersonalInfoChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="text-lg font-semibold text-gray-800">{editedUser.age} years</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={editedUser.gender}
                      onChange={handlePersonalInfoChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="text-lg font-semibold text-gray-800 capitalize">{editedUser.gender}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-teal-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedUser.email}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-800">{editedUser.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editedUser.phone}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-800">{editedUser.phone}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={editedUser.address}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-800">{editedUser.address}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
{/* Emergency Contact */}
<div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
    <Shield className="w-5 h-5 mr-2 text-red-600" />
    Emergency Contact
  </h3>
  <div className="bg-white/50 rounded-xl p-4">
    <div className="flex items-center mb-2">
      <Users className="w-5 h-5 text-gray-400 mr-3" />
      {isEditing ? (
        <input
          type="text"
          name="name"
          value={editedUser.emergencyContact?.name || ""}
          onChange={handleEmergencyContactChange}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Emergency contact name"
        />
      ) : (
        <div className="text-lg font-bold text-gray-800">
          {editedUser.emergencyContact?.name || "Not provided"}
        </div>
      )}
    </div>
    <div className="ml-8">
      <div className="text-sm text-gray-600 mb-1">Relationship</div>
      {isEditing ? (
        <select
          name="relationship"
          value={editedUser.emergencyContact?.relationship || ""}
          onChange={handleEmergencyContactChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-2"
        >
          <option value="spouse">Spouse</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="sibling">Sibling</option>
          <option value="friend">Friend</option>
          <option value="other">Other</option>
        </select>
      ) : (
        <div className="text-md font-semibold text-gray-800 capitalize mb-2">
          {editedUser.emergencyContact?.relationship || "Not provided"}
        </div>
      )}
      <div className="text-sm text-gray-600 mb-1">Phone Number</div>
      {isEditing ? (
        <input
          type="tel"
          name="phone"
          value={editedUser.emergencyContact?.phone || ""}
          onChange={handleEmergencyContactChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Emergency contact phone"
        />
      ) : (
        <div className="text-md font-semibold text-gray-800">
          {editedUser.emergencyContact?.phone || "Not provided"}
        </div>
      )}
    </div>
  </div>
</div>

          
            {/* Allergies Section */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Known Allergies
                </h3>
                {isEditing && (
                  <button
                    onClick={addAllergy}
                    className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(editedUser.allergies || []).length > 0 ? (
                  (editedUser.allergies || []).map((allergy, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={allergy}
                            onChange={(e) => updateAllergy(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Enter allergy"
                          />
                          <button
                            onClick={() => removeAllergy(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                          {allergy}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No known allergies</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span>Close Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;