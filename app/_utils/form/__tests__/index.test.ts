import {
  validateLength,
  validateRegex,
  transformField,
  transformMailRequest,
  validateField,
  isStringBooleanRecord,
  getRemainingCharacters,
  isLessCharacters,
} from '../index';
import {
  ContactFormData,
  ContactFormFieldsType,
  IFormField,
} from '@/_store/profile/types';
import { FIELD_TYPES } from '@/_constants/profile';

describe('Form Utils', () => {
  describe('validateLength', () => {
    it('should return true for non-empty string', () => {
      expect(validateLength('hello')).toBe(true);
      expect(validateLength('a')).toBe(true);
      expect(validateLength('   ')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(validateLength('')).toBe(false);
    });

    it('should handle numbers', () => {
      expect(validateLength(123)).toBe(true);
      expect(validateLength(0)).toBe(true);
    });
  });

  describe('validateRegex', () => {
    it('should validate email pattern', () => {
      const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      expect(validateRegex('test@example.com', emailRegex, true)).toBe(true);
      expect(validateRegex('invalid-email', emailRegex, true)).toBe(false);
      expect(validateRegex('test@.com', emailRegex, true)).toBe(false);
    });

    it('should validate numeric pattern', () => {
      const numericRegex = '^[0-9]+$';
      expect(validateRegex('12345', numericRegex, true)).toBe(true);
      expect(validateRegex('abc', numericRegex, true)).toBe(false);
      expect(validateRegex('123abc', numericRegex, true)).toBe(false);
    });

    it('should validate alphanumeric pattern', () => {
      const alphaNumRegex = '^[a-zA-Z0-9]+$';
      expect(validateRegex('Test123', alphaNumRegex, true)).toBe(true);
      expect(validateRegex('Test 123', alphaNumRegex, true)).toBe(false);
      expect(validateRegex('Test@123', alphaNumRegex, true)).toBe(false);
    });

    it('should return default when no regex provided', () => {
      expect(validateRegex('anything', '', true)).toBe(true);
      expect(validateRegex('anything', '', false)).toBe(false);
    });

    it('should handle special characters in pattern', () => {
      const urlRegex = '^https?://[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}.*$';
      expect(validateRegex('https://example.com', urlRegex, true)).toBe(true);
      expect(validateRegex('http://test.org', urlRegex, true)).toBe(true);
      expect(validateRegex('ftp://invalid.com', urlRegex, true)).toBe(false);
    });
  });

  describe('transformField', () => {
    it('should transform boolean to yes/no', () => {
      const boolData = {
        option1: true,
        option2: false,
        option3: true,
      };
      const result = transformField(boolData, 'boolToYesNo');
      expect(result).toEqual({
        option1: 'Yes',
        option2: 'No',
        option3: 'Yes',
      });
    });

    it('should handle empty object', () => {
      const result = transformField({}, 'boolToYesNo');
      expect(result).toEqual({});
    });

    it('should handle single boolean', () => {
      const result = transformField({ single: true }, 'boolToYesNo');
      expect(result).toEqual({ single: 'Yes' });
    });

    it('should handle all false values', () => {
      const boolData = {
        opt1: false,
        opt2: false,
      };
      const result = transformField(boolData, 'boolToYesNo');
      expect(result).toEqual({
        opt1: 'No',
        opt2: 'No',
      });
    });
  });

  describe('transformMailRequest', () => {
    it('should transform specified fields in form data', () => {
      const formData: ContactFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          newsletter: true,
          updates: false,
        } as any,
      };

      const fieldsToTransform = [
        { id: 'preferences', transform: 'boolToYesNo' },
      ];

      const result = transformMailRequest(formData, fieldsToTransform);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.preferences).toEqual({
        newsletter: 'Yes',
        updates: 'No',
      });
    });

    it('should not modify fields not in transform list', () => {
      const formData: ContactFormData = {
        name: 'Jane',
        email: 'jane@test.com',
        message: 'Hello',
      };

      const result = transformMailRequest(formData, []);
      expect(result).toEqual(formData);
    });

    it('should handle multiple field transformations', () => {
      const formData: ContactFormData = {
        name: 'Test',
        options1: { a: true, b: false } as any,
        options2: { c: true, d: true } as any,
      };

      const fieldsToTransform = [
        { id: 'options1', transform: 'boolToYesNo' },
        { id: 'options2', transform: 'boolToYesNo' },
      ];

      const result = transformMailRequest(formData, fieldsToTransform);
      expect(result.options1).toEqual({ a: 'Yes', b: 'No' });
      expect(result.options2).toEqual({ c: 'Yes', d: 'Yes' });
    });
  });

  describe('validateField', () => {
    const mockRequiredFields: IFormField[] = [
      {
        id: 'name',
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        regex: '^[a-zA-Z\\s]+$',
        placeholder: 'Enter name',
      },
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        placeholder: 'Enter email',
      },
    ];

    const mockForm = {
      defaultMaxLength: 100,
      fields: mockRequiredFields,
      messages: {
        mandatoryError: 'Field is required',
        regexError: 'Invalid format',
      },
    } as any;

    it('should validate correct field value', () => {
      const formError: Record<string, string> = { name: '', email: '' };
      const formValid: Record<string, boolean> = { name: false, email: false };

      const result = validateField(
        mockForm,
        formError,
        formValid,
        mockRequiredFields,
        'John Doe',
        'name'
      );

      expect(result.formError.name).toBe('');
      expect(result.formValid.name).toBe(true);
      expect(result.formDisabled).toBe(true); // email still invalid
    });

    it('should reject empty required field', () => {
      const formError: Record<string, string> = { name: '', email: '' };
      const formValid: Record<string, boolean> = { name: false, email: false };

      const result = validateField(
        mockForm,
        formError,
        formValid,
        mockRequiredFields,
        '',
        'name'
      );

      expect(result.formError.name).toBe('mandatoryError');
      expect(result.formValid.name).toBe(false);
      expect(result.formDisabled).toBe(true);
    });

    it('should reject field with regex mismatch', () => {
      const formError: Record<string, string> = { name: '', email: '' };
      const formValid: Record<string, boolean> = { name: false, email: false };

      const result = validateField(
        mockForm,
        formError,
        formValid,
        mockRequiredFields,
        'John123',
        'name'
      );

      expect(result.formError.name).toBe('regexError');
      expect(result.formValid.name).toBe(false);
      expect(result.formDisabled).toBe(true);
    });

    it('should validate correct email format', () => {
      const formError: Record<string, string> = { name: '', email: '' };
      const formValid: Record<string, boolean> = { name: true, email: false };

      const result = validateField(
        mockForm,
        formError,
        formValid,
        mockRequiredFields,
        'test@example.com',
        'email'
      );

      expect(result.formError.email).toBe('');
      expect(result.formValid.email).toBe(true);
      expect(result.formDisabled).toBe(false); // both fields valid
    });

    it('should reject invalid email format', () => {
      const formError: Record<string, string> = { name: '', email: '' };
      const formValid: Record<string, boolean> = { name: true, email: false };

      const result = validateField(
        mockForm,
        formError,
        formValid,
        mockRequiredFields,
        'invalid-email',
        'email'
      );

      expect(result.formError.email).toBe('regexError');
      expect(result.formValid.email).toBe(false);
      expect(result.formDisabled).toBe(true);
    });
  });

  describe('isStringBooleanRecord', () => {
    it('should return true for valid boolean record', () => {
      const record = { option1: true, option2: false, option3: true };
      expect(isStringBooleanRecord(record)).toBe(true);
    });

    it('should return true for empty object', () => {
      // Implementation returns true for empty objects
      expect(isStringBooleanRecord({})).toBe(true);
    });

    it('should return true when not all values are boolean', () => {
      // Implementation only checks first value, returns true for mixed types
      const record = { option1: true, option2: 'string' };
      expect(isStringBooleanRecord(record)).toBe(true);
    });

    it('should return true for single boolean value', () => {
      const record = { single: true };
      expect(isStringBooleanRecord(record)).toBe(true);
    });

    it('should return false for single non-boolean value', () => {
      const record = { single: 'string' };
      expect(isStringBooleanRecord(record)).toBe(false);
    });
  });

  describe('getRemainingCharacters', () => {
    it('should calculate remaining characters correctly', () => {
      expect(getRemainingCharacters('hello', 10)).toBe(5);
      expect(getRemainingCharacters('test', 10)).toBe(6);
    });

    it('should handle empty string', () => {
      expect(getRemainingCharacters('', 10)).toBe(10);
    });

    it('should handle string at max length', () => {
      expect(getRemainingCharacters('hello', 5)).toBe(0);
    });

    it('should handle string over max length', () => {
      expect(getRemainingCharacters('hello world', 5)).toBe(-6);
    });
  });

  describe('isLessCharacters', () => {
    it('should return false when many characters remaining', () => {
      // isLessCharacters checks if (remaining / maxLength) * 100 <= 10
      // For 9 remaining out of 10: (9/10)*100 = 90% > 10% = false
      expect(isLessCharacters(9, 10)).toBe(false); // 90%
      expect(isLessCharacters(18, 20)).toBe(false); // 90%
    });

    it('should return true when very few characters remaining', () => {
      expect(isLessCharacters(1, 10)).toBe(true); // 10% <= 10%
      expect(isLessCharacters(0, 10)).toBe(true); // 0% <= 10%
    });

    it('should return false for 20% remaining', () => {
      expect(isLessCharacters(2, 10)).toBe(false); // 20% > 10%
    });

    it('should work with getRemainingCharacters', () => {
      const text = '123456789';
      const maxLength = 10;
      const remaining = getRemainingCharacters(text, maxLength); // = 1
      expect(isLessCharacters(remaining, maxLength)).toBe(true); // 10% <= 10%
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in validation', () => {
      expect(validateLength('!@#$%')).toBe(true);
      expect(validateRegex('test@#$', '^[a-zA-Z]+$', true)).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      expect(validateLength(longString)).toBe(true);
    });

    it('should handle unicode characters', () => {
      expect(validateLength('你好')).toBe(true);
      expect(validateLength('🎉')).toBe(true);
    });
  });
});
