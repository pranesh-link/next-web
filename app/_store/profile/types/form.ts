/** Supported form names. */
export type FormType = "contactForm";

/** A simple label/value pair for select-like fields. */
export interface ILabelValue {
  /** Display label. */
  label: string;
  /** Underlying value. */
  value: string;
}

/** Per-field error message bundle. */
export interface IFieldErrorMessages {
  /** Error shown when the value fails the regex validation. */
  regexError: string;
  /** Generic field-level error. */
  fieldError: string;
}

/** Form-level validation messages. */
export interface IFormMessages {
  /** Error shown when a mandatory field is empty. */
  mandatoryError: string;
}

/** Descriptor for a single form field. */
export interface IFormField {
  /** Stable identifier. */
  id: string;
  /** HTML name attribute. */
  name: string;
  /** Display label. */
  label: string;
  /** Placeholder text. */
  placeholder: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Optional sub-type (e.g. for inputs). */
  subType?: string;
  /** Field type (e.g. "text", "checkbox"). */
  type: string;
  /** Maximum character length. */
  maxLength?: number;
  /** Validation regex (string form). */
  regex?: string;
  /** Identifier of a parent field this depends on. */
  parentField?: string;
  /** Identifiers of child fields that depend on this one. */
  childFields?: string[];
  /** Per-field error messages. */
  messages?: IFieldErrorMessages;
  /** Allowed values for select-like fields. */
  values?: ILabelValue[];
}

/** Lifecycle states for the contact form. */
export enum CONTACT_FORM_STATUS {
  FORM_FILL = "form_fill",
  SENDING = "sending",
  SUCCESS = "success",
  ERROR = "error",
  REVIEW = "review",
  OFFLINE = "offline",
}

/** Map of contact-form status to display message. */
export type MailStatusType = Record<CONTACT_FORM_STATUS, string>;

/** Configuration descriptor for a form. */
export interface IFormInfo {
  /** Form name. */
  name: string;
  /** Header text. */
  header: string;
  /** Whether to surface errors on mobile browsers. */
  showErrorOnMobileBrowsers?: boolean;
  /** Whether to hide the remaining-character counter. */
  hideRemainingCharacters?: boolean;
  /** Storage key. */
  key: string;
  /** Submit button label. */
  actionButtonLabel: string;
  /** Default max length for fields without their own. */
  defaultMaxLength: number;
  /** Status messages keyed by lifecycle state. */
  statusMessages: MailStatusType;
  /** Arbitrary label bundle. */
  label: Record<string, string>;
  /** Field transform pipeline. */
  transformFields: {
    /** Field id. */
    id: string;
    /** Transform name. */
    transform: string;
  }[];
  /** Form-level messages. */
  messages: IFormMessages;
  /** Field descriptors. */
  fields: IFormField[];
}

/** Map of form name to form descriptor. */
export type FormsType = {
  [key in FormType]: IFormInfo;
};

/** Field identifiers used by the contact form. */
export type ContactFormFieldsType =
  | "userName"
  | "userMobile"
  | "userEmail"
  | "message"
  | "userSocialMessengers";

/** Contact-form value map keyed by field identifier. */
export type ContactFormData = {
  [key in ContactFormFieldsType]: string | Record<string, boolean>;
};

/** Per-field validity map for the contact form. */
export type ContactFormValid = Record<string, boolean>;

/** Per-field error-message map for the contact form. */
export type ContactFormError = Record<string, string>;

/** Single contact-form field value. */
export type ContactFormFieldData = string | Record<string, boolean>;

/** Union of all supported form field value types. */
export type FormFieldValueType =
  | string
  | number
  | boolean
  | Record<string, boolean>;
