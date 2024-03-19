"use client";
import { ComponentType } from "react";
import Modal from "react-modal";
import styled from "styled-components";
const ModalComponent = Modal as ComponentType<ReactModal["props"]>;

type CustomModalComponentProps = {
  children: React.ReactNode;
} & ReactModal["props"];
let CustomModalComponent = (props: CustomModalComponentProps) => {
  return (
    <ModalComponent {...props} ariaHideApp={false}>
      {props.children}
    </ModalComponent>
  );
};
CustomModalComponent = styled(CustomModalComponent)`
  .open-source-content-wrap {
    .os-project {
      margin: 20px 10px 10px;
      .os-project-name {
        font-size: 20px;
        margin: 0 0 10px 0;
        text-decoration: underline;
      }

      .os-project-desc {
        padding-bottom: 5px;
        text-indent: 1em;
      }

      .os-project-links {
        margin-top: 15px;
      }

      .os-project-skills {
        font-size: 16px;
        .label {
          font-weight: 700;
        }
        .info {
          font-weight: 600;
        }
      }
    }
  }
  &.version-modal {
    background: #f0f0f0;
    padding: 25px;
    border-radius: 50px;
    width: fit-content;
    margin: 0 auto;
    font-size: 18px;
    font-weight: 600;
    color: #3e3e3e;
    span {
      font-style: italic;
      font-weight: bold;
    }
  }
  &.contact-form-status-modal-content {
    margin: 0 30%;
    display: flex;
    justify-content: center;
  }
  &.contact-modal-content {
    margin: 0 30%;
  }
  @media only screen and (max-width: 992px) {
    &.ReactModal__Content {
      margin: 0 15px;
    }

    ::-webkit-scrollbar {
      width: 7px;
    }

    &.version-modal {
      font-size: 15px;
      margin: 0 auto;
      letter-spacing: 0.5px;
    }
  }
`;
export default CustomModalComponent;
