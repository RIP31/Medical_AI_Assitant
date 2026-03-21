export const validateAge = (age) => {
  const ageNum = parseInt(age);
  if (!age || age === '') {
    return { valid: false, error: 'Age is required' };
  }
  if (isNaN(ageNum)) {
    return { valid: false, error: 'Age must be a number' };
  }
  if (ageNum < 0 || ageNum > 120) {
    return { valid: false, error: 'Age must be between 0 and 120' };
  }
  return { valid: true, error: null };
};

export const validateMedication = (medication) => {
  if (!medication || medication.trim() === '') {
    return { valid: false, error: 'Medication name cannot be empty' };
  }
  if (medication.length < 2) {
    return { valid: false, error: 'Medication name too short' };
  }
  if (medication.length > 100) {
    return { valid: false, error: 'Medication name too long (max 100 characters)' };
  }
  return { valid: true, error: null };
};

export const validateAllergies = (allergies) => {
  if (!Array.isArray(allergies)) {
    return { valid: false, error: 'Allergies must be an array' };
  }
  for (const allergy of allergies) {
    if (allergy.trim().length === 0) {
      return { valid: false, error: 'Allergy cannot be empty' };
    }
  }
  return { valid: true, error: null };
};

export const validateProfile = (profile, options = {}) => {
  const { requireAge = true } = options;
  const errors = {};

  // Age validation (optional for partial updates)
  const hasAge = profile.age !== undefined && profile.age !== null && String(profile.age).trim() !== '';
  if (requireAge || hasAge) {
    const ageValidation = validateAge(profile.age);
    if (!ageValidation.valid) {
      errors.age = ageValidation.error;
    }
  }
  
  // Medications validation
  if (profile.currentMedications && profile.currentMedications.length > 0) {
    for (const med of profile.currentMedications) {
      const medValidation = validateMedication(med);
      if (!medValidation.valid) {
        errors.medications = medValidation.error;
        break;
      }
    }
  }
  
  // Allergies validation
  if (profile.allergies && profile.allergies.length > 0) {
    const allergyValidation = validateAllergies(profile.allergies);
    if (!allergyValidation.valid) {
      errors.allergies = allergyValidation.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
