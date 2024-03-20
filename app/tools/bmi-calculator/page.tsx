"use client";
import {
  ComponentType,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppContext } from "@/_store/app/context";
import { FormHeader } from "@/_components/form/Elements";
import { FormFieldValueType } from "@/_store/profile/types";
import { BMICalculatorFormData } from "@/_store/common/types";
import {
  DEFAULT_BMI_CALCULATOR_FORM_DATA,
  DEFAULT_BMI_CALCULATOR_FORM_ERROR,
  PAGE_TITLES,
} from "@/_constants/common";
import {
  getWeightSuggestConfig,
  getBMI,
  getCurrentBMIRange,
  validateBMIFields,
  validateBMIFieldInputForRanges,
} from "@/_utils/bmi-calculator";
import { BMICalculatorForm } from "./Elements";
import dynamic from "next/dynamic";

export default function BMICalculatorPage() {
  const {
    data: {
      bmiCalculatorForm: {
        label,
        header,
        fields,
        bmiRanges,
        permissibleHeights,
        permissibleWeights,
      },
      currentDevice: { isMobile },
    },
  } = useContext(AppContext);

  const [formData, setFormData] = useState<BMICalculatorFormData>(
    DEFAULT_BMI_CALCULATOR_FORM_DATA
  );
  const [fieldError, setFieldError] = useState(
    DEFAULT_BMI_CALCULATOR_FORM_ERROR
  );

  useEffect(() => {
    document.title = PAGE_TITLES.bmiCalculator;
  }, []);

  const showForm = useMemo(() => setTimeout(() => header, 1000), [header]);

  const hasValidFieldValues = useMemo(
    () => Object.values(fieldError).every((item) => item === ""),
    [fieldError]
  );

  const bmi = useMemo(
    () => (hasValidFieldValues ? getBMI(formData) : 0),
    [formData, hasValidFieldValues]
  );

  const currentBMIRange = useMemo(
    () => getCurrentBMIRange(bmiRanges, bmi),
    [bmi, bmiRanges]
  );

  const isValidHt = useMemo(
    () =>
      formData.heightInCm
        ? validateBMIFieldInputForRanges(
            formData.heightInCm,
            permissibleHeights
          )
        : true,
    [formData.heightInCm, permissibleHeights]
  );

  const isValidWt = useMemo(
    () =>
      formData.weightInKg
        ? validateBMIFieldInputForRanges(
            formData.weightInKg,
            permissibleWeights
          )
        : true,
    [formData.weightInKg, permissibleWeights]
  );

  const isValidBMI = useMemo(
    () => Boolean(isValidHt && isValidWt && !isNaN(bmi) && bmi),
    [bmi, isValidHt, isValidWt]
  );

  const healthyBMIRange = useMemo(
    () => bmiRanges.find((item) => item.isHealthyRange) || bmiRanges[0],
    [bmiRanges]
  );

  const isCurrentBMIHealthy = useMemo(
    () =>
      bmi <= (healthyBMIRange.max || 100) && bmi >= (healthyBMIRange.min || 0),
    [healthyBMIRange, bmi]
  );

  const weightSuggestConfig = useMemo(
    () =>
      getWeightSuggestConfig(
        label,
        formData,
        bmi,
        healthyBMIRange,
        isCurrentBMIHealthy
      ),
    [bmi, formData, healthyBMIRange, label, isCurrentBMIHealthy]
  );

  const updateInput = useCallback(
    (fieldValue: FormFieldValueType, field: string) => {
      setFormData({ ...formData, [field]: fieldValue });
    },
    [formData]
  );

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_BMI_CALCULATOR_FORM_DATA);
  }, []);

  const handleValidation = useCallback(
    (value: FormFieldValueType, field: string) => {
      const currentFieldConfig = fields.find((item) => item.id === field);
      setFieldError({
        ...fieldError,
        [field]: validateBMIFields(value, currentFieldConfig),
      });
    },
    [fieldError, fields]
  );

  const BMIResult: any =
    hasValidFieldValues && isValidBMI ? (
      dynamic(() => import("@/_components/bmi-calculator/BMIResult"), {
        ssr: false,
      })
    ) : (
      <></>
    );

  const Fields = dynamic(() => import("@/_components/bmi-calculator/Fields"), {
    ssr: false,
  });

  return showForm ? (
    <BMICalculatorForm>
      <FormHeader>{header}</FormHeader>
      <Fields
        fieldError={fieldError}
        formData={formData}
        isValidHt={isValidHt}
        isValidWt={isValidWt}
        handleValidation={handleValidation}
        updateInput={updateInput}
        resetForm={resetForm}
      />
      {hasValidFieldValues && isValidBMI && (
        <BMIResult
          bmi={bmi}
          currentBMIRange={currentBMIRange}
          weightSuggestConfig={weightSuggestConfig}
          isValidBMI={isValidBMI}
        />
      )}
    </BMICalculatorForm>
  ) : null;
}
