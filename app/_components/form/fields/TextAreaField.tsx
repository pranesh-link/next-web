import classNames from "classnames";
import { FormFieldValueType, IFormField } from "@/_store/profile/types";
import { TextArea } from "../Elements";

interface ITextAreaFieldProps {
  fieldValid?: boolean;
  autoFocus: boolean;
  field: IFormField;
  isFormSubmit: boolean;
  fieldValue: FormFieldValueType;
  handleTextChange: (value: string) => void;
}
const TextAreaField = (props: ITextAreaFieldProps) => {
  const {
    autoFocus,
    field,
    fieldValid,
    fieldValue,
    handleTextChange,
    isFormSubmit,
  } = props;

  return (
    <TextArea
      placeholder={field.placeholder}
      autoFocus={autoFocus}
      disabled={isFormSubmit}
      className={classNames({
        error: fieldValid === false,
      })}
      maxLength={field.maxLength}
      name={field.name}
      value={fieldValue as string}
      onChange={(e) => handleTextChange(e.target.value)}
    />
  );
};

export default TextAreaField;
