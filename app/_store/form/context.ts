import { createContext, SetStateAction } from "react";
import { ContactFormData } from "../profile/types";

interface IFormContext {
  formData: ContactFormData | null;
  formDisabled: boolean;
  closeModal: () => void;
  setFormDisabled: (disabled: SetStateAction<boolean>) => void;
  setFormData: (data: SetStateAction<ContactFormData>) => void;
  isSending: boolean;
}

const FormContext = createContext<IFormContext>({
  formData: null,
  formDisabled: false,
  setFormDisabled: () => {},
  setFormData: () => {},
  closeModal: () => {},
  isSending: false,
});

const FormContextProvider = FormContext.Provider;

export { FormContext, FormContextProvider };
