import {
  getCurrentBMIRange,
  getBMI,
  getBMIRangePercentForGauge,
  validateBMIFields,
  getWeightSuggestConfig,
  validateBMIFieldInputForRanges,
} from '../index';
import { IBMIRange, IMinMax } from '@/_store/common/types';
import { IFormField } from '@/_store/profile/types';

describe('BMI Calculator Utils', () => {
  const mockBMIRanges: IBMIRange[] = [
    {
      id: 'underweight',
      max: 18.5,
      label: 'Underweight',
      prefixedPercentile: 0,
      color: '#3498db',
    },
    {
      id: 'normal',
      min: 18.5,
      max: 24.9,
      label: 'Normal',
      prefixedPercentile: 20,
      color: '#2ecc71',
    },
    {
      id: 'overweight',
      min: 25,
      max: 29.9,
      label: 'Overweight',
      prefixedPercentile: 40,
      color: '#f39c12',
    },
    {
      id: 'obese',
      min: 30,
      label: 'Obese',
      prefixedPercentile: 60,
      color: '#e74c3c',
    },
  ];

  describe('getCurrentBMIRange', () => {
    it('should return underweight range for BMI < 18.5', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 17);
      expect(result.id).toBe('underweight');
      expect(result.label).toBe('Underweight');
    });

    it('should return normal range for BMI 18.5-24.9', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 22);
      expect(result.id).toBe('normal');
      expect(result.label).toBe('Normal');
    });

    it('should return overweight range for BMI 25-29.9', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 27);
      expect(result.id).toBe('overweight');
      expect(result.label).toBe('Overweight');
    });

    it('should return obese range for BMI >= 30', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 35);
      expect(result.id).toBe('obese');
      expect(result.label).toBe('Obese');
    });

    it('should handle edge case at boundary 18.5', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 18.5);
      expect(result.id).toBe('underweight'); // 18.5 is the upper limit of underweight, not start of normal
    });

    it('should return first range for very low BMI', () => {
      const result = getCurrentBMIRange(mockBMIRanges, 10);
      expect(result.id).toBe('underweight');
    });
  });

  describe('getBMI', () => {
    it('should calculate BMI correctly for normal values', () => {
      const formData = { heightInCm: '170', weightInKg: '70' };
      const bmi = getBMI(formData);
      expect(bmi).toBe(24.2);
    });

    it('should calculate BMI for underweight person', () => {
      const formData = { heightInCm: '180', weightInKg: '55' };
      const bmi = getBMI(formData);
      expect(bmi).toBe(17.0);
    });

    it('should calculate BMI for overweight person', () => {
      const formData = { heightInCm: '165', weightInKg: '80' };
      const bmi = getBMI(formData);
      expect(bmi).toBe(29.4);
    });

    it('should handle large values', () => {
      const formData = { heightInCm: '200', weightInKg: '120' };
      const bmi = getBMI(formData);
      expect(bmi).toBe(30.0);
    });

    it('should handle small values', () => {
      const formData = { heightInCm: '150', weightInKg: '45' };
      const bmi = getBMI(formData);
      expect(bmi).toBe(20.0);
    });
  });

  describe('getBMIRangePercentForGauge', () => {
    it('should calculate percentage at start of normal range', () => {
      const normalRange = mockBMIRanges[1];
      const percent = getBMIRangePercentForGauge(normalRange, 18.5);
      expect(percent).toBe(0.2);
    });

    it('should calculate percentage at middle of normal range', () => {
      const normalRange = mockBMIRanges[1];
      const percent = getBMIRangePercentForGauge(normalRange, 21.7);
      expect(percent).toBeCloseTo(0.3, 1);
    });

    it('should calculate percentage at end of normal range', () => {
      const normalRange = mockBMIRanges[1];
      const percent = getBMIRangePercentForGauge(normalRange, 24.9);
      expect(percent).toBe(0.4);
    });

    it('should calculate percentage for underweight range', () => {
      const underweightRange = mockBMIRanges[0];
      const percent = getBMIRangePercentForGauge(underweightRange, 15);
      expect(percent).toBeCloseTo(0.16, 1);
    });

    it('should calculate percentage for obese range', () => {
      const obeseRange = mockBMIRanges[3];
      const percent = getBMIRangePercentForGauge(obeseRange, 35);
      expect(percent).toBeCloseTo(0.61, 1);
    });
  });

  describe('validateBMIFields', () => {
    const mockFieldConfig: IFormField = {
      id: 'heightInCm',
      name: 'heightInCm',
      type: 'text',
      label: 'Height',
      required: true,
      regex: '^[0-9]+$',
      placeholder: '',
    };

    it('should return empty string for valid numeric input', () => {
      const result = validateBMIFields('170', mockFieldConfig);
      expect(result).toBe('');
    });

    it('should return error for non-numeric input', () => {
      const result = validateBMIFields('abc', mockFieldConfig);
      expect(result).toBe('regexError');
    });

    it('should return error for empty input', () => {
      const result = validateBMIFields('', mockFieldConfig);
      expect(result).toBe('regexError');
    });

    it('should return empty string for numeric with leading zeros', () => {
      const result = validateBMIFields('0170', mockFieldConfig);
      expect(result).toBe('');
    });

    it('should return error for special characters', () => {
      const result = validateBMIFields('17.5', mockFieldConfig);
      expect(result).toBe('regexError');
    });

    it('should return empty string when no field config', () => {
      const result = validateBMIFields('170');
      expect(result).toBe('');
    });
  });

  describe('validateBMIFieldInputForRanges', () => {
    const heightRanges: IMinMax = { min: 50, max: 350 };
    const weightRanges: IMinMax = { min: 2, max: 700 };

    it('should validate height within range', () => {
      expect(validateBMIFieldInputForRanges('170', heightRanges)).toBe(true);
      expect(validateBMIFieldInputForRanges('50', heightRanges)).toBe(true);
      expect(validateBMIFieldInputForRanges('350', heightRanges)).toBe(true);
    });

    it('should reject height below minimum', () => {
      expect(validateBMIFieldInputForRanges('40', heightRanges)).toBe(false);
      expect(validateBMIFieldInputForRanges('0', heightRanges)).toBe(false);
    });

    it('should reject height above maximum', () => {
      expect(validateBMIFieldInputForRanges('400', heightRanges)).toBe(false);
      expect(validateBMIFieldInputForRanges('1000', heightRanges)).toBe(false);
    });

    it('should validate weight within range', () => {
      expect(validateBMIFieldInputForRanges('70', weightRanges)).toBe(true);
      expect(validateBMIFieldInputForRanges('2', weightRanges)).toBe(true);
      expect(validateBMIFieldInputForRanges('700', weightRanges)).toBe(true);
    });

    it('should reject weight below minimum', () => {
      expect(validateBMIFieldInputForRanges('1', weightRanges)).toBe(false);
    });

    it('should reject weight above maximum', () => {
      expect(validateBMIFieldInputForRanges('800', weightRanges)).toBe(false);
    });
  });

  describe('getWeightSuggestConfig', () => {
    const labels = {
      ideal: 'Ideal',
      increase: 'Increase',
      reduce: 'Reduce',
    };
    const healthyRange = mockBMIRanges[1]; // Normal range

    it('should suggest weight reduction for overweight', () => {
      const formData = { heightInCm: '170', weightInKg: '85' };
      const bmi = 29.4;
      const result = getWeightSuggestConfig(
        labels,
        formData,
        bmi,
        healthyRange,
        false
      );
      
      expect(result.weightDirection).toBe('Reduce');
      expect(result.diffToIdealWeight).toBeGreaterThan(0);
    });

    it('should suggest weight increase for underweight', () => {
      const formData = { heightInCm: '170', weightInKg: '50' };
      const bmi = 17.3;
      const result = getWeightSuggestConfig(
        labels,
        formData,
        bmi,
        healthyRange,
        false
      );
      
      expect(result.weightDirection).toBe('Increase');
      expect(result.diffToIdealWeight).toBeLessThan(0);
    });

    it('should indicate ideal for healthy BMI', () => {
      const formData = { heightInCm: '170', weightInKg: '65' };
      const bmi = 22.5;
      const result = getWeightSuggestConfig(
        labels,
        formData,
        bmi,
        healthyRange,
        true
      );
      
      expect(result.weightDirection).toBe('Ideal');
    });

    it('should provide ideal weight ranges', () => {
      const formData = { heightInCm: '170', weightInKg: '70' };
      const bmi = 24.2;
      const result = getWeightSuggestConfig(
        labels,
        formData,
        bmi,
        healthyRange,
        false
      );
      
      expect(result.idealWeightRanges.min).toBeGreaterThan(0);
      expect(result.idealWeightRanges.max).toBeGreaterThan(result.idealWeightRanges.min);
    });

    it('should handle zero BMI', () => {
      const formData = { heightInCm: '170', weightInKg: '70' };
      const result = getWeightSuggestConfig(
        labels,
        formData,
        0,
        healthyRange,
        false
      );
      
      expect(result.weightDirection).toBe('Reduce');
      expect(result.idealWeightRanges.min).toBe(0);
      expect(result.idealWeightRanges.max).toBe(100);
      expect(result.diffToIdealWeight).toBe(0);
    });
  });
});
