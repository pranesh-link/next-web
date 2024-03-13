import classNames from "classnames";
import { isStringBooleanRecord } from "@/_utils/form";
import { FormFieldValueType, IFormField } from "@/_store/profile/types";
import {
  CheckboxInput,
  CheckboxInputLabel,
  CheckboxInputWrap,
  CheckboxTick,
} from "../Elements";
import TickIcon from "@/_components/svg/TickIcon";

interface ICheckboxFieldProps {
  field: IFormField;
  fieldValue: FormFieldValueType;
  handleCheckboxChange: (id: string) => void;
}

const CheckboxField = (props: ICheckboxFieldProps) => {
  const { field, fieldValue, handleCheckboxChange } = props;

  return (
    <>
      {(field?.values || []).map((item) => {
        const isChecked = isStringBooleanRecord(fieldValue)
          ? fieldValue[item.value]
          : false;
        return (
          <CheckboxInputWrap
            $alignItems="center"
            key={item.value}
            id={item.value}
          >
            <CheckboxInput
              id={item.value}
              type="checkbox"
              onChange={() => {
                handleCheckboxChange(item.value);
              }}
              checked={isChecked}
            />
            {isChecked && (
              <CheckboxTick
                id={item.value}
                onClick={() => {
                  handleCheckboxChange(item.value);
                }}
              >
                <TickIcon width={13} height={13} />
              </CheckboxTick>
            )}
            <CheckboxInputLabel className={classNames({ checked: isChecked })}>
              {item.label}
            </CheckboxInputLabel>
          </CheckboxInputWrap>
        );
      })}
    </>
  );
};

export default CheckboxField;
