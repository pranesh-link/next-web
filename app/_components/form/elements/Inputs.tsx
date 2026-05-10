import { FlexBox, FlexBoxSection } from "@/_components/common/Elements";
import styled from "styled-components";

/** Label for a form field, sized to a fraction of the row width. */
export const FieldLabel = styled.label`
  flex-basis: 30%;
  font-weight: 600;
  margin-right: 10px;

  @media only screen and (max-width: 767px) {
    flex-basis: 40%;
  }
`;

/** Wrapper for a form field row that controls spacing and child input styling. */
export const FieldWrap = styled(FlexBoxSection)`
  &:not(.has-child-field) {
    margin-bottom: 20px;
  }
  .required-asterisk {
    color: #ee4b2b;
    padding-left: 5px;
  }
  input,
  textarea {
    padding-left: 7px;
  }
  .phone-input {
    width: 100%;
    font-family: var(--font), arial, helvetica, sans-serif;
    input {
      border-color: transparent;
      font-family: var(--font), arial, helvetica, sans-serif;
      outline: none;
      border-radius: 5px;
      height: 25px;
      width: 100%;
      padding-left: 5px;
    }
  }

  @media only screen and (max-width: 767px) {
    .phone-input {
      &.error {
        input {
          border: 1px solid #ee4b2b;
        }
      }
    }
  }
`;

/** Single-line text input styled for the form module. */
export const TextInput = styled.input`
  width: 100%;
  height: 25px;
  border-radius: 5px;
  border-color: transparent;
  outline: none;
  font-family: var(--font), arial, helvetica, sans-serif;
  font-size: 14px;
  @media only screen and (max-width: 767px) {
    &.error {
      border: 1px solid #ee4b2b;
    }
  }
`;

/** Multi-line text area styled for the form module. */
export const TextArea = styled.textarea`
  width: 100%;
  resize: none;
  border-radius: 5px;
  border-color: transparent;
  outline: none;
  min-height: 100px;
  font-family: var(--font), arial, helvetica, sans-serif;
  font-size: 14px;
  @media only screen and (max-width: 767px) {
    &.error {
      border: 1px solid #ee4b2b;
    }
  }
`;

/** Inline display of remaining characters / max-length for a text field. */
export const RemainingCharacters = styled.span`
  margin-top: 5px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  .remaining-characters {
    padding-right: 1.5px;
  }
  .lesser-to-no-characters {
    color: #ee4b2b;
  }
  .less-characters {
    color: #ffa500;
  }
  .field-maxlength {
    padding-left: 1.5px;
  }
`;

/** Full-width flex wrapper around an input control. */
export const InputWrap = styled(FlexBox)`
  width: 100%;
`;

/** Field-level validation error text. */
export const Error = styled.span`
  margin-top: 5px;
  font-size: 12px;
  color: #ee4b2b;
  margin-right: 10px;
  font-style: italic;
  font-weight: 600;
`;
