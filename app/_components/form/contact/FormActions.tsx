import { ActionBtn } from "@/_components/common/Elements";
import classNames from "classnames";
import { ActionsWrap, FormSubmit } from "../Elements";

export default function FormActions() {
  return (
    <ActionsWrap $justifyContent="space-between" $alignItems="center">
      <ActionBtn className="close" onClick={closeModal}>
        {label.close}
      </ActionBtn>
      <FormSubmit
        disabled={formDisabled || isSending}
        className={classNames({
          disabled: formDisabled || isSending,
        })}
        type="submit"
      >
        {isSending ? label.submitting : label.submit}
      </FormSubmit>
    </ActionsWrap>
  );
}
