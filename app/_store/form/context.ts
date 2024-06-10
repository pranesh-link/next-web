import { createContext } from "react";
import {
  ContactFormData,
  ContactFormError,
  ContactFormValid,
  FormFieldValueType,
} from "../profile/types";

interface IFormContext {
  formData: ContactFormData | null;
  formValid: ContactFormValid | null;
  formError: ContactFormError | null;
  formDisabled: boolean;
  closeModal: () => void;
  updateInput: (
    value: FormFieldValueType,
    field: string,
    valueId?: string
  ) => void;
  handleValidation: (value: FormFieldValueType, field: string) => void;
  isSending: boolean;
}

const FormContext = createContext<IFormContext>({
  formData: null,
  formValid: null,
  formError: null,
  formDisabled: false,
  updateInput: () => {},
  handleValidation: () => {},
  closeModal: () => {},
  isSending: false,
});

const FormContextProvider = FormContext.Provider;

export { FormContext, FormContextProvider };
