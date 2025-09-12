import { useState } from "react";

export interface ValidationRule {
  field: any;
  name: string;
  required?: boolean;
  validator?: (value: any) => boolean;
  message?: string;
}

export interface FileValidationRule {
  file: File | null;
  name: string;
  required?: boolean;
  message?: string;
}

export interface UseFormValidationReturn {
  validationErrors: Record<string, boolean>;
  validate: (fields: ValidationRule[], files?: FileValidationRule[]) => boolean;
  clearErrors: () => void;
  setError: (fieldName: string, hasError: boolean) => void;
}

export const useFormValidation = (): UseFormValidationReturn => {
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const validate = (fields: ValidationRule[], files: FileValidationRule[] = []): boolean => {
    const errors: Record<string, boolean> = {};
    let hasErrors = false;

    // Validate text/select fields
    fields.forEach(rule => {
      const { field, name, required = true, validator } = rule;
      
      if (required) {
        // Check if field is empty or null
        const isEmpty = !field || 
                       (typeof field === 'string' && field.trim() === '') ||
                       (typeof field === 'number' && isNaN(field));
        
        if (isEmpty) {
          errors[name] = true;
          hasErrors = true;
        }
      }
      
      // Custom validator
      if (field && validator && !validator(field)) {
        errors[name] = true;
        hasErrors = true;
      }
    });

    // Validate file uploads
    files.forEach(rule => {
      const { file, name, required = true } = rule;
      
      if (required && !file) {
        errors[name] = true;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const clearErrors = () => {
    setValidationErrors({});
  };

  const setError = (fieldName: string, hasError: boolean) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: hasError
    }));
  };

  return {
    validationErrors,
    validate,
    clearErrors,
    setError
  };
};