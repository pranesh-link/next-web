import {
  ActionBtn,
  FlexBox,
  FlexBoxSection,
} from "@/_components/common/Elements";
import styled from "styled-components";

/** Form container styled with padding, rounded corners and a light background. */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  outline: none;
  padding: 20px 30px;
  border-radius: 15px;

  @media only screen and (max-width: 767px) {
    padding: 15px;
  }
`;

/** Wrapper used to render a form submission status block. */
export const StatusWrap = styled(FlexBox)`
  border-radius: 5px;
  background: #f0f0f0;
  padding: 15px;
  @media only screen and (max-width: 767px) {
    width: 100%;
  }
`;

/** Status message body, with error / high-border style variants. */
export const StatusMessage = styled(FlexBox)`
  background: #f0f0f0;
  border-radius: 15px;
  &.error {
    padding: 5px 15px;
  }
  &.high-border {
    border-radius: 30px;
    padding: 5px 0;
  }
`;

/** Container for the form's action buttons (close / edit / send). */
export const ActionsWrap = styled(FlexBoxSection)`
  margin: 20px 0 0px;
  &.review-status {
    margin: 10px 0 5px;
  }

  .close,
  .review-edit,
  .send {
    font-size: 15px;
    padding: 10px 25px;
    background: #ee4b2b;
    opacity: 0.85;
    border-radius: 20px;
    color: #f0f0f0;
    &:hover {
      opacity: 1;
    }
    @media only screen and (max-width: 767px) {
      opacity: 1;
    }
  }
  .review-edit,
  .send {
    padding: 5px 15px;
  }

  .review-edit {
    margin-right: 10px;
    background: #b21807;
  }

  .send {
    background: #3f9c35;
  }
`;

/** Primary submit button for forms; supports a `disabled` className. */
export const FormSubmit = styled(ActionBtn)`
  background: #3498db;
  color: #f0f0f0;
  font-size: 15px;
  letter-spacing: 0.5px;
  border-color: transparent;
  border-radius: 20px;
  padding: 10px 25px;
  font-family: var(--font), arial, helvetica, sans-serif;
  opacity: 0.85;
  &:not(.disabled):hover {
    opacity: 1;
  }
  &.disabled {
    background: #8a8982;
    cursor: default;
  }

  @media only screen and (max-width: 767px) {
    opacity: 1;
  }
`;

/** Anchor used to retry a failed form submission. */
export const Retry = styled.a`
  margin-left: 10px;
  margin-top: 10px;
  font-weight: bold;
  color: #3f9c35;
  letter-spacing: 0.3px;
  flex-basis: 15%;
`;

/** Inline progress message shown during long-running form actions. */
export const ProgressMessage = styled.p`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 10px;
  font-weight: 600;
  &.offline {
    margin: 0 auto;
    text-align: center;
  }
`;

/** Heading rendered at the top of a form. */
export const FormHeader = styled.h2`
  text-align: center;
  margin: 0px;
  padding-bottom: 25px;
`;
