import { ActionBtn } from "@/_components/common/Elements";
import classNames from "classnames";
import { ActionsWrap, FormSubmit } from "../Elements";
import { useContext } from "react";
import { FormContext } from "@/_store/form/context";
import { ProfileContext } from "@/_store/profile/page/context";

export default function FormActions() {
  const { closeModal, formDisabled, isSending } = useContext(FormContext);
  const {
    data: {
      forms: {
        contactForm: { label },
      },
    },
  } = useContext(ProfileContext);
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
