import { ActionBtn, FlexBox } from "@/_components/common/Elements";
import CustomModalComponent from "@/_components/common/ModalComponent";
import {
  ActionsWrap,
  ProgressMessage,
  Retry,
  StatusMessage,
  StatusWrap,
} from "@/_components/form/Elements";
import { CONTACT_FORM_STATUS } from "@/_store/profile/types";
import classNames from "classnames";
import Image from "next/image";
import { FormEvent, memo, useMemo } from "react";

type SubmitButtonType =
  | FormEvent<HTMLFormElement>
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>
  | React.MouseEvent<HTMLButtonElement, MouseEvent>;

interface IFormStatusModalProps {
  formStatus: CONTACT_FORM_STATUS;
  displayStatusInfo: {
    icon: string;
    message: string;
    retryMessage: string;
  };
  isOpen: boolean;
  isSending: boolean;
  isError: boolean;
  isOffline: boolean;
  allowRetry: boolean;
  label: Record<string, string>;
  setFormStatus: (status: CONTACT_FORM_STATUS) => void;
  handleReviewAndEdit: () => void;
  retry: (e: SubmitButtonType) => void;
  submit: (e: SubmitButtonType) => void;
}

export default function FormStatusModal(props: IFormStatusModalProps) {
  const {
    formStatus,
    isSending,
    isError,
    isOffline,
    isOpen,
    displayStatusInfo,
    allowRetry,
    label,
    setFormStatus,
    handleReviewAndEdit,
    retry,
    submit,
  } = props;

  const isSuccess = useMemo(
    () => formStatus === CONTACT_FORM_STATUS.SUCCESS,
    [formStatus]
  );

  const isReview = useMemo(
    () => formStatus === CONTACT_FORM_STATUS.REVIEW,
    [formStatus]
  );

  const StatusIcon = () => {
    return (
      <>
        {displayStatusInfo.icon && (
          <Image
            className="form-status-image"
            alt="Form status"
            height={35}
            width={35}
            src={displayStatusInfo.icon}
            unoptimized
          />
        )}
      </>
    );
  };

  // eslint-disable-next-line react/display-name
  const IconMessage = memo(() => {
    return (
      <>
        <StatusIcon />
        <ProgressMessage
          dangerouslySetInnerHTML={{ __html: displayStatusInfo.message }}
        />
      </>
    );
  });

  return (
    <CustomModalComponent
      isOpen={isOpen}
      className="contact-form-status-modal-content"
      shouldCloseOnOverlayClick={true}
      onRequestClose={() => {
        if (isError || isOffline) {
          setFormStatus(CONTACT_FORM_STATUS.FORM_FILL);
        }
      }}
    >
      <StatusWrap $direction="column">
        <StatusMessage
          $direction={isError || isOffline ? "column" : "row"}
          $justifyContent="space-evenly"
          $alignItems="center"
          className={classNames(formStatus, {
            "high-border": isSending || isSuccess,
          })}
        >
          {isError || isOffline ? (
            <FlexBox $alignItems="center">
              <IconMessage />
            </FlexBox>
          ) : (
            <IconMessage />
          )}

          <Retry
            href=""
            className={classNames({
              hide: !allowRetry,
            })}
            onClick={retry}
          >
            {displayStatusInfo.retryMessage}
          </Retry>
        </StatusMessage>
        {isReview && (
          <ActionsWrap
            className={classNames({ "review-status": isReview })}
            $justifyContent="center"
            $alignItems="center"
          >
            <ActionBtn className="review-edit" onClick={handleReviewAndEdit}>
              {label.reviewEdit}
            </ActionBtn>
            <ActionBtn className="send" onClick={submit}>
              {label.submit}
            </ActionBtn>
          </ActionsWrap>
        )}
      </StatusWrap>
    </CustomModalComponent>
  );
}
