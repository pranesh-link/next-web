import { ActionBtn } from "@/_components/common/Elements";
import FormStatusModal from "@/_components/modal/form/FormStatusModal";
import useIsOnline from "@/_hooks/use-is-online";
import { AppContext } from "@/_store/app/context";
import { ProfileContext } from "@/_store/profile/page/context";
import {
  CONTACT_FORM_STATUS,
  ContactFormData,
  ContactFormError,
  ContactFormFields,
  ContactFormValid,
  FormFieldValueType,
} from "@/_store/profile/types";
import {
  getDecryptedConfig,
  getDefaultContactFormData,
  transformMailRequest,
  validateField,
} from "@/_utils/form";
import { getPreloadedAsset } from "@/_utils/profile/server";
import emailjs from "@emailjs/browser";
import classNames from "classnames";
import {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActionsWrap, Form, FormHeader, FormSubmit } from "../Elements";
import FormField from "../FormField";

interface IContactFormProps {
  closeModal: () => void;
}

const ContactForm = (props: IContactFormProps) => {
  const {
    data: {
      forms: { contactForm: form },
    },
    emailJsConfig,
    preloadedAssets,
  } = useContext(ProfileContext);
  const {
    data: {
      messages: {
        common: { offline: offlineMessage, retry: retryMessage },
      },
    },
  } = useContext(AppContext);

  const { statusMessages, label, fields } = form;

  const defaultFormData = useMemo(
    () => getDefaultContactFormData(fields),
    [fields]
  );

  const requiredFields = useMemo(
    () => fields.filter((i) => i.required),
    [fields]
  );

  const { closeModal } = props;

  const [formData, setFormData] = useState<ContactFormData>(defaultFormData);
  const [formValid, setFormValid] = useState<ContactFormValid | null>(null);
  const [formError, setFormError] = useState<ContactFormError | null>(null);
  const [formDisabled, setFormDisabled] = useState<boolean>(true);
  const [contactFormStatus, setContactFormStatus] = useState(
    CONTACT_FORM_STATUS.FORM_FILL
  );
  const online = useIsOnline();
  const [allowRetry, setAllowRetry] = useState(false);
  const [hasReviewedForm, setHasReviewedForm] = useState<boolean>(false);

  const resetFields = () => {
    setFormData(defaultFormData);
    setContactFormStatus(CONTACT_FORM_STATUS.FORM_FILL);
    setHasReviewedForm(false);
    setFormDisabled(true);
  };

  const formStatusIconMap = useMemo(
    () => ({
      [CONTACT_FORM_STATUS.FORM_FILL]: "",
      [CONTACT_FORM_STATUS.SENDING]: getPreloadedAsset(
        preloadedAssets,
        "loadingAnimation"
      ),
      [CONTACT_FORM_STATUS.SUCCESS]: getPreloadedAsset(
        preloadedAssets,
        "successAnimation"
      ),
      [CONTACT_FORM_STATUS.ERROR]: getPreloadedAsset(
        preloadedAssets,
        "errorAnimation"
      ),
      [CONTACT_FORM_STATUS.OFFLINE]: "", // TODO Fix icon display when device is offline OfflineAnimation
      [CONTACT_FORM_STATUS.REVIEW]: "",
    }),
    [preloadedAssets]
  );

  const handleMailRequest = () => {
    setContactFormStatus(CONTACT_FORM_STATUS.SENDING);
    setAllowRetry(false);
    const [serviceId, templateId, publicKey] = getDecryptedConfig(
      [
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        emailJsConfig.publicKey,
      ],
      form.key
    );

    const transformedPayload = transformMailRequest(
      formData,
      form.transformFields
    );

    emailjs.send(serviceId, templateId, transformedPayload, publicKey).then(
      () => {
        setContactFormStatus(CONTACT_FORM_STATUS.SUCCESS);
        setTimeout(() => resetFields(), 3000);
      },
      () => {
        setContactFormStatus(CONTACT_FORM_STATUS.ERROR);
        setAllowRetry(true);
      }
    );
  };

  const sendEmail = (
    e:
      | FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLAnchorElement, MouseEvent>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (online) {
      handleMailRequest();
    } else {
      setContactFormStatus(CONTACT_FORM_STATUS.OFFLINE);
      setAllowRetry(true);
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (online) {
      if (hasReviewedForm) {
        sendEmail(e);
      } else {
        setContactFormStatus(CONTACT_FORM_STATUS.REVIEW);
      }
    } else {
      setContactFormStatus(CONTACT_FORM_STATUS.OFFLINE);
      setAllowRetry(true);
    }
  };

  const displayStatus = useMemo(
    () => [CONTACT_FORM_STATUS.FORM_FILL].indexOf(contactFormStatus) === -1,
    [contactFormStatus]
  );

  const isSending = useMemo(
    () => contactFormStatus === CONTACT_FORM_STATUS.SENDING,
    [contactFormStatus]
  );

  const isError = useMemo(
    () => contactFormStatus === CONTACT_FORM_STATUS.ERROR,
    [contactFormStatus]
  );

  const isOffline = useMemo(
    () => contactFormStatus === CONTACT_FORM_STATUS.OFFLINE,
    [contactFormStatus]
  );

  const updateInput = (
    value: FormFieldValueType,
    field: string,
    valueId?: string
  ) => {
    if (valueId) {
      setFormData({
        ...formData,
        [field as ContactFormFields]: {
          ...(formData[field as ContactFormFields] as Record<string, any>),
          [valueId]: value,
        },
      });
    } else {
      setFormData({ ...formData, [field as ContactFormFields]: value });
    }
  };

  const handleValidation = (value: FormFieldValueType, field: string) => {
    const validation = validateField(
      form,
      formError,
      formValid,
      requiredFields,
      value,
      field
    );
    setFormError(validation.formError);
    setFormValid(validation.formValid);
    setFormDisabled(validation.formDisabled);
  };

  const handleReviewAndEdit = useCallback(() => {
    setHasReviewedForm(true);
    setContactFormStatus(CONTACT_FORM_STATUS.FORM_FILL);
  }, []);

  const displayStatusInfo = useMemo(() => {
    const icon = formStatusIconMap[contactFormStatus];
    const message =
      contactFormStatus === CONTACT_FORM_STATUS.OFFLINE
        ? offlineMessage
        : statusMessages[contactFormStatus];

    return {
      icon,
      message,
      retryMessage: isError || isOffline ? retryMessage : "",
    };
  }, [
    formStatusIconMap,
    contactFormStatus,
    statusMessages,
    isError,
    isOffline,
    offlineMessage,
    retryMessage,
  ]);

  useEffect(() => {
    if (online && contactFormStatus === CONTACT_FORM_STATUS.OFFLINE) {
      setContactFormStatus(CONTACT_FORM_STATUS.FORM_FILL);
    }
  }, [online, contactFormStatus]);

  return (
    <>
      <FormStatusModal
        allowRetry={allowRetry}
        displayStatusInfo={displayStatusInfo}
        formStatus={contactFormStatus}
        handleReviewAndEdit={handleReviewAndEdit}
        isSending={isSending}
        isError={isError}
        isOffline={isOffline}
        isOpen={displayStatus}
        label={label}
        retry={sendEmail}
        setFormStatus={setContactFormStatus}
        submit={sendEmail}
      />
      <Form onSubmit={handleFormSubmit}>
        <FormHeader>{form.header}</FormHeader>
        {fields.map((field, index) => {
          const fieldName = field.name as ContactFormFields;
          return (
            <FormField
              key={index}
              defaultMaxLength={form.defaultMaxLength}
              autoFocus={online && index === 0}
              field={field}
              fieldValue={formData[fieldName]}
              fieldValid={formValid?.[fieldName]}
              fieldError={formError?.[fieldName]}
              updateInput={updateInput}
              validateField={handleValidation}
              isFormSubmit={isSending}
            />
          );
        })}

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
      </Form>
    </>
  );
};

export default ContactForm;
