import useIsOnline from "@/_hooks/use-is-online";
import { FormContext } from "@/_store/form/context";
import { ProfileContext } from "@/_store/profile/page/context";
import { ContactFormFieldsType } from "@/_store/profile/types";
import { useContext } from "react";
import FormField from "../FormField";

export default function ContactFormFields() {
  const {
    data: {
      forms: { contactForm: form },
    },
  } = useContext(ProfileContext);
  const {
    formData,
    formValid,
    formError,
    handleValidation,
    updateInput,
    isSending,
  } = useContext(FormContext);
  const online = useIsOnline();

  const { fields } = form;

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
