// Validation utility functions

export const validators = {
  // Email validation
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },

  // Password validation
  password: (value, minLength = 8) => {
    if (!value) return 'Password is required';
    if (value.length < minLength) return `Password must be at least ${minLength} characters`;

    // Check for at least one uppercase, one lowercase, and one number
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    return null;
  },

  // Confirm password validation
  confirmPassword: (value, originalPassword) => {
    if (!value) return 'Please confirm your password';
    if (value !== originalPassword) return 'Passwords do not match';
    return null;
  },

  // Required field validation
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Name validation
  name: (value, fieldName = 'Name') => {
    if (!value || !value.trim()) return `${fieldName} is required`;
    if (value.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return null;
  },

  // Phone number validation
  phone: (value) => {
    if (!value) return null; // Optional field
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-()]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  // URL validation
  url: (value) => {
    if (!value) return null; // Optional field
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  }
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];

    for (const rule of rules) {
      let error = null;

      if (typeof rule === 'function') {
        error = rule(value);
      } else if (typeof rule === 'object') {
        const { validator, params = [] } = rule;
        error = validator(value, ...params);
      }

      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Specific validation rules for forms
export const signInValidationRules = {
  email: [validators.email],
  password: [validators.required]
};

export const signUpValidationRules = {
  firstName: [(value) => validators.name(value, 'First name')],
  lastName: [(value) => validators.name(value, 'Last name')],
  email: [validators.email],
  password: [validators.password],
  confirmPassword: [
    (value, formData) => validators.confirmPassword(value, formData?.password)
  ],
  role: [(value) => validators.required(value, 'Role')],
  locationRegion: [(value) => validators.required(value, 'Location region')]
};

// Helper function to validate a single field
export const validateField = (fieldName, value, rules, formData = {}) => {
  if (!rules || !rules[fieldName]) return null;

  const fieldRules = rules[fieldName];

  for (const rule of fieldRules) {
    let error = null;

    if (typeof rule === 'function') {
      // Pass formData as second parameter for rules that need it (like confirmPassword)
      error = rule(value, formData);
    }

    if (error) {
      return error;
    }
  }

  return null;
};

// Helper function to validate entire form
export const validateFormData = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], rules, formData);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};