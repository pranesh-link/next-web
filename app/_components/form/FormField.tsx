import { FlexBox } from "@/_components/common/Elements";
import { FIELD_TYPES } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import { FormFieldValueType, IFormField } from "@/_store/profile/types";
import {
  getErrorMessage,
  getRemainingCharPercentMap,
  getRemainingCharacters,
  isStringBooleanRecord,
} from "@/_utils/form";
import classNames from "classnames";
import { useContext, useMemo } from "react";
import { isMobile } from "react-device-detect";
import {
  Error,
  FieldLabel,
  FieldWrap,
  InputWrap,
  RemainingCharacters,
} from "./Elements";
import CheckboxField from "./fields/CheckboxField";
import MobileField from "./fields/MobileField";
import TextAreaField from "./fields/TextAreaField";
import TextField from "./fields/TextField";

interface IFormFieldProps {
  field: IFormField;
  fieldValid?: boolean;
  fieldError?: string;
  fieldValue: FormFieldValueType;
  isFormSubmit: boolean;
  autoFocus: boolean;
  defaultMaxLength: number;
  showErrorOnMobileBrowsers?: boolean;
  hideRemainingCharacters?: boolean;
  updateInput: (
    value: FormFieldValueType,
    field: string,
    valueId?: string
  ) => void;
  validateField: (value: FormFieldValueType, field: string) => void;
}
const FormField = (props: IFormFieldProps) => {
  const {
    field,
    fieldValid,
    fieldValue,
    fieldError,
    isFormSubmit,
    autoFocus,
    defaultMaxLength,
    showErrorOnMobileBrowsers = false,
    hideRemainingCharacters = false,
    updateInput,
    validateField,
  } = props;
  const {
    data: {
      forms: { contactForm: form },
    },
  } = useContext(ProfileContext);
  const { messages } = form;

  const handleTextChange = (value: string) => {
    updateInput(value, field.name);
    validateField(value, field.name);
  };

  const handleMobileInputChange = (value: any) => {
    if (value) {
      updateInput(value, field.name);
      validateField(value, field.name);
    }
  };

  const handleCheckboxChange = (id: string) => {
    if (isStringBooleanRecord(fieldValue)) {
      updateInput(!fieldValue[id], field.name, id);
    }
  };

  const errorMessage = useMemo(
    () => getErrorMessage(messages, field?.messages, fieldError),
    [field.messages, fieldError, messages]
  );

  const remainingCharacters = useMemo(
    () =>
      getRemainingCharacters(
        fieldValue as string,
        field.maxLength || defaultMaxLength
      ),
    [field.maxLength, fieldValue, defaultMaxLength]
  );

  const showRemainingCharacters = useMemo(
    () =>
      !hideRemainingCharacters &&
      [FIELD_TYPES.TEXT, FIELD_TYPES.TEXTAREA, FIELD_TYPES.MOBILE].some(
        (item) => field.type === item
      ),
    [field.type, hideRemainingCharacters]
  );

  const charPercentMap = useMemo(
    () => getRemainingCharPercentMap(remainingCharacters, field.maxLength),
    [remainingCharacters, field.maxLength]
  );

  return (
    <FieldWrap
      $direction="column"
      className={classNames({ "has-child-field": field?.childFields?.length })}
    >
      <InputWrap $alignItems="center">
        <FieldLabel>
          {field.label}
          {field.required && <strong className="required-asterisk">*</strong>}
        </FieldLabel>
        {field.type === FIELD_TYPES.TEXT && (
          <TextField
            autoFocus={autoFocus}
            field={field}
            fieldValid={fieldValid}
            fieldValue={fieldValue}
            handleTextChange={handleTextChange}
            isFormSubmit={isFormSubmit}
          />
        )}
        {field.type === FIELD_TYPES.MOBILE && (
          <MobileField
            autoFocus={autoFocus}
            fieldValid={fieldValid}
            fieldValue={fieldValue}
            handleMobileInputChange={handleMobileInputChange}
            isFormSubmit={isFormSubmit}
          />
        )}
        {field.type === FIELD_TYPES.CHECKBOX && (
          <CheckboxField
            field={field}
            fieldValue={fieldValue}
            handleCheckboxChange={handleCheckboxChange}
          />
        )}
        {field.type === FIELD_TYPES.TEXTAREA && (
          <TextAreaField
            autoFocus={autoFocus}
            field={field}
            fieldValid={fieldValid}
            fieldValue={fieldValue}
            handleTextChange={handleTextChange}
            isFormSubmit={isFormSubmit}
          />
        )}
      </InputWrap>
      <FlexBox $justifyContent="flex-end" $alignItems="center">
        {fieldError && (
          <Error
            className={classNames({
              hide: isMobile && !showErrorOnMobileBrowsers,
            })}
          >
            {errorMessage}
          </Error>
        )}
        {showRemainingCharacters && (
          <RemainingCharacters>
            <span
              className={classNames("remaining-characters", {
                "lesser-to-no-characters": charPercentMap.lesserToNoChars,
                "less-characters": charPercentMap.lessChars,
              })}
            >
              {remainingCharacters}
            </span>
            /<span className="field-maxlength">{field.maxLength}</span>
          </RemainingCharacters>
        )}
      </FlexBox>
    </FieldWrap>
  );
};

export default FormField;
