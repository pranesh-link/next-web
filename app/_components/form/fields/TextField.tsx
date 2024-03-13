import classNames from "classnames";
import { TextInput } from "../Elements";
import { FormFieldValueType, IFormField } from "@/_store/profile/types";

interface ITextFieldProps {
  fieldValid?: boolean;
  autoFocus: boolean;
  field: IFormField;
  isFormSubmit: boolean;
  fieldValue: FormFieldValueType;
  handleTextChange: (value: string) => void;
}
const TextField = (props: ITextFieldProps) => {
  const {
    autoFocus,
    field,
    fieldValid,
    fieldValue,
    handleTextChange,
    isFormSubmit,
  } = props;

  return (
    <TextInput
      className={classNames({
        error: fieldValid === false,
      })}
      autoFocus={autoFocus}
      placeholder={field.placeholder}
      disabled={isFormSubmit}
      value={fieldValue as string}
      maxLength={field.maxLength}
      type={field.subType ? field.subType : "text"}
      name={field.name}
      onChange={(e) => handleTextChange(e.target.value)}
    />
  );
};

export default TextField;
