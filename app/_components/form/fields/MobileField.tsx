import classNames from "classnames";
import PhoneInput from "react-phone-number-input";
import { FormFieldValueType } from "@/_store/profile/types";

interface IMobileFieldProps {
  fieldValid?: boolean;
  autoFocus: boolean;
  isFormSubmit: boolean;
  fieldValue: FormFieldValueType;
  handleMobileInputChange: (value: string) => void;
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
      value={fieldValue as string as import('react-phone-number-input').E164Number | undefined}
      onChange={handleMobileInputChange}
    />
  );
};

export default MobileField;
