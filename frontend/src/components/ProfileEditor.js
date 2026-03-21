import React, { useState, useRef } from 'react';
import { UserCog, Plus, X, Save, AlertCircle, Search, Trash2 } from 'lucide-react';
import { validateAge, validateMedication } from '../utils/validation';

const ProfileEditor = ({ initialProfile, onSave, onCancel }) => {
  const [tempProfile, setTempProfile] = useState(initialProfile || {
    name: '', age: '', gender: '', medicalHistory: [], currentMedications: [], allergies: []
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [conditionSearch, setConditionSearch] = useState('');
  const [medicationInput, setMedicationInput] = useState('');

  const medInputRef = useRef(null);

  const commonConditions = [
    'Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Heart Disease',
    'Migraine', 'Anxiety/Depression', 'Thyroid Disorder', 'Allergies',
    'High Cholesterol', 'GERD', 'Back Pain', 'Eczema', 'Insomnia'
  ];

  const handleAgeChange = (value) => {
    setTempProfile({ ...tempProfile, age: value });
    const validation = validateAge(value);
    if (!validation.valid) {
      setErrors({ ...errors, age: validation.error });
    } else {
      const newErrors = { ...errors };
      delete newErrors.age;
      setErrors(newErrors);
    }
  };

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      const med = medicationInput.trim();
      const validation = validateMedication(med);

      if (!validation.valid) {
        setErrors({ ...errors, medications: validation.error });
        return;
      }

      setTempProfile(prev => ({
        ...prev,
        currentMedications: [...(prev.currentMedications || []), med]
      }));
      setMedicationInput('');
      const newErrors = { ...errors };
      delete newErrors.medications;
      setErrors(newErrors);
      medInputRef.current?.focus();
    }
  };

  const handleRemoveMedication = (index) => {
    setTempProfile(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  const toggleCondition = (condition) => {
    setTempProfile(prev => {
      const current = prev.medicalHistory || [];
      const updated = current.includes(condition)
        ? current.filter(c => c !== condition)
        : [...current, condition];
      return { ...prev, medicalHistory: updated };
    });
  };

  const addCustomCondition = () => {
    if (conditionSearch.trim() && !commonConditions.includes(conditionSearch)) {
      toggleCondition(conditionSearch.trim());
      setConditionSearch('');
    }
  };

  const handleSave = async () => {
    // Validate profile before saving
    const ageValidation = validateAge(tempProfile.age);
    if (!ageValidation.valid) {
      setErrors({ ...errors, age: ageValidation.error });
      return;
    }

    setIsLoading(true);
    // Simulate save delay for better UX
    setTimeout(() => {
      onSave(tempProfile);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="profile-editor-container">
      <div className="profile-card">
        <div className="card-header">
          <h2>Personal Health Profile</h2>
          <p>Complete your profile to get personalized AI medical guidance.</p>
        </div>

        <div className="form-grid">
          {/* Row 1: Name & Age */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-input"
              value={tempProfile.name || ''}
              onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="form-group">
            <label>Age <span className="required">*</span></label>
            <input
              type="number"
              className={`form-input ${errors.age ? 'error' : ''}`}
              value={tempProfile.age || ''}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="e.g. 35"
              min="0" max="120"
            />
            {errors.age && (
              <span className="error-msg"><AlertCircle size={12} /> {errors.age}</span>
            )}
          </div>

          {/* Row 2: Gender */}
          <div className="form-group full-width">
            <label>Gender</label>
            <div className="chip-selector">
              {['Male', 'Female', 'Other', 'Prefer not to say'].map(gender => (
                <button
                  key={gender}
                  className={`chip-btn ${tempProfile.gender === gender ? 'selected' : ''}`}
                  onClick={() => setTempProfile({ ...tempProfile, gender })}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Medical Conditions */}
          <div className="form-section full-width">
            <label>Medical Conditions</label>
            <div className="multi-select-chips">
              {commonConditions.filter(c => c.toLowerCase().includes(conditionSearch.toLowerCase())).map(condition => (
                <button
                  key={condition}
                  className={`chip-choice ${tempProfile.medicalHistory?.includes(condition) ? 'selected' : ''}`}
                  onClick={() => toggleCondition(condition)}
                >
                  {condition}
                </button>
              ))}
              {/* Show selected custom conditions that aren't in common list */}
              {tempProfile.medicalHistory?.filter(c => !commonConditions.includes(c)).map(condition => (
                <button
                  key={condition}
                  className="chip-choice selected"
                  onClick={() => toggleCondition(condition)}
                >
                  {condition}
                </button>
              ))}
            </div>

            <div className="input-with-action">
              <input
                type="text"
                placeholder="Search or add condition..."
                value={conditionSearch}
                onChange={(e) => setConditionSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomCondition()}
              />
              <button className="action-icon-btn" onClick={addCustomCondition} disabled={!conditionSearch.trim()}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Section: Medications */}
          <div className="form-section full-width">
            <label>Current Medications</label>
            <div className="input-group">
              <input
                ref={medInputRef}
                type="text"
                className="form-input"
                placeholder="e.g. Lisinopril 10mg"
                value={medicationInput}
                onChange={(e) => setMedicationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
              />
              <button className="btn-add-primary" onClick={handleAddMedication}>
                Add Medication
              </button>
            </div>
            {errors.medications && (
              <span className="error-msg"><AlertCircle size={12} /> {errors.medications}</span>
            )}

            {tempProfile.currentMedications?.length > 0 && (
              <div className="chips-list">
                {tempProfile.currentMedications.map((med, idx) => (
                  <div key={idx} className="removable-chip">
                    <span>{med}</span>
                    <button onClick={() => handleRemoveMedication(idx)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Allergies */}
          <div className="form-group full-width">
            <label>Allergies</label>
            <input
              type="text"
              className="form-input"
              value={tempProfile.allergies?.join(', ') || ''}
              onChange={(e) => setTempProfile({
                ...tempProfile,
                allergies: e.target.value.split(',').map(a => a.trim()) // Allow typing comma separated
              })}
              placeholder="e.g. Penicillin, Peanuts (separated by commas)"
            />
          </div>

        </div>

      </div>

      {/* --- SECURITY SECTION (Hidden by default, toggleable) --- */}
      <div className="security-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Security</h3>
        <PasswordChange user={initialProfile} />
      </div>

      <div className="card-footer">
        <button className="btn-text-cancel" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button className="btn-primary-save" onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

// Sub-component for Password Change
const PasswordChange = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // We need userId. Assuming initialProfile has it or we can get it from context.
  // Actually ProfileEditor receives 'initialProfile' which is just data.
  // We need the actual User ID. 
  // Let's assume user object in App.js passed down has an ID, but here 'initialProfile' is usually just profile data.
  // We might need to fetch user ID from localStorage or AuthContext context if strictly needed.
  // A quick hack: use localStorage to get the active user ID.

  const getUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('medicalAI_active_user'));
      return u?.id;
    } catch { return null; }
  };

  const handleChange = async () => {
    const userId = getUserId();
    if (!userId) {
      setMsg("Error: User ID not found. Please relogin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Success! " + data.message);
        setOldPass('');
        setNewPass('');
        // Optional: Logout to force re-login? 
        // The requirement says: "After password reset and next login... account should load as fresh"
        // So we don't strictly need to force logout immediately, but it's good practice.
        // For now, just showing success message.
      } else {
        setMsg("Error: " + data.message);
      }
    } catch (e) {
      setMsg("Network Error");
    }
    setLoading(false);
  };

  if (!isExpanded) {
    return (
      <button className="btn-secondary" onClick={() => setIsExpanded(true)} style={{ width: '100%' }}>
        Change Password
      </button>
    );
  }

  return (
    <div className="password-change-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="password"
        placeholder="Current Password"
        className="form-input"
        value={oldPass}
        onChange={e => setOldPass(e.target.value)}
      />
      <input
        type="password"
        placeholder="New Password"
        className="form-input"
        value={newPass}
        onChange={e => setNewPass(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={handleChange} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button className="btn-text-cancel" onClick={() => setIsExpanded(false)}>
          Cancel
        </button>
      </div>
      {msg && <p style={{ fontSize: '0.8rem', color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
      {msg.includes('Success') && <p style={{ fontSize: '0.8rem', color: '#666' }}>Note: Your chat history will be cleared on next login.</p>}
    </div>
  );
};

export default ProfileEditor;
