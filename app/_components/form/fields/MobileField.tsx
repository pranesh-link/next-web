import classNames from "classnames";
import PhoneInput from "react-phone-number-input";
import { FormFieldValueType } from "@/_store/profile/types";

type PhoneValue = import("react-phone-number-input").Value;

interface IMobileFieldProps {
  fieldValid?: boolean;
  autoFocus: boolean;
  isFormSubmit: boolean;
  fieldValue: FormFieldValueType;
  handleMobileInputChange: (value?: PhoneValue) => void;
}
const MobileField = (props: IMobileFieldProps) => {
  const {
    autoFocus,
    fieldValid,
    fieldValue,
    isFormSubmit,
    handleMobileInputChange,
  } = props;

  return (
    <PhoneInput
      autoFocus={autoFocus}
      disabled={isFormSubmit}
      defaultCountry="IN"
      international
      limitMaxLength
      countryCallingCodeEditable={false}
      className={classNames("phone-input", {
        error: fieldValid === false,
      })}
      value={fieldValue as PhoneValue | undefined}
      onChange={handleMobileInputChange}
    />
  );
};

export default MobileField;
