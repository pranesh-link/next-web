import useIsOnline from "@/_hooks/use-is-online";
import { FormContext } from "@/_store/form/context";
import { ProfileContext } from "@/_store/profile/page/context";
import {
  ContactFormError,
  ContactFormFieldsType,
  ContactFormValid,
  FormFieldValueType,
} from "@/_store/profile/types";
import { useContext, useMemo, useState } from "react";
import FormField from "../FormField";
import { validateField } from "@/_utils/form";

export default function ContactFormFields() {
  const {
    data: {
      forms: { contactForm: form },
    },
  } = useContext(ProfileContext);
  const { formData, setFormData, setFormDisabled, isSending } =
    useContext(FormContext);
  const online = useIsOnline();

  const [formValid, setFormValid] = useState<ContactFormValid | null>(null);
  const [formError, setFormError] = useState<ContactFormError | null>(null);

  const { fields } = form;

  const updateInput = (
    value: FormFieldValueType,
    field: string,
    valueId?: string
  ) => {
    if (formData) {
      if (valueId) {
        setFormData({
          ...formData,
          [field as ContactFormFieldsType]: {
            ...(formData[field as ContactFormFieldsType] as Record<
              string,
              any
            >),
            [valueId]: value,
          },
        });
      } else {
        setFormData({ ...formData, [field as ContactFormFieldsType]: value });
      }
    }
  };

  const requiredFields = useMemo(
    () => fields.filter((i) => i.required),
    [fields]
  );

  const handleValidation = (value: FormFieldValueType, field: string) => {
    const validation = validateField(
      form,
      formError,
      formValid,
      requiredFields,
      value,
      field
    );
    setFormError(validation.formError);
    setFormValid(validation.formValid);
    setFormDisabled(validation.formDisabled);
  };

  return (
    <>
      {fields.map((field, index) => {
        const fieldName = field.name as ContactFormFieldsType;
        return (
          <FormField
            key={index}
            defaultMaxLength={form.defaultMaxLength}
            autoFocus={online && index === 0}
            field={field}
            fieldValue={formData?.[fieldName] ?? ""}
            fieldValid={formValid?.[fieldName]}
            fieldError={formError?.[fieldName]}
            updateInput={updateInput}
            validateField={handleValidation}
            isFormSubmit={isSending}
          />
        );
      })}
    </>
  );
}
