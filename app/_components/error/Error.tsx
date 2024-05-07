import { LABEL_TEXT, MESSAGES } from "@/_constants/profile";
import { AppContext } from "@/_store/app/context";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { startTransition, useContext, useState } from "react";
import styled from "styled-components";
import { ActionBtn, FlexBoxSection } from "../common/Elements";

function Error({ reset }: { reset: () => void }) {
  const {
    data: {
      currentDevice: { isMobile },
    },
  } = useContext(AppContext);
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  return (
    <ErrorWrapper
      className={classNames({ retrying: retrying })}
      $direction="column"
      $justifyContent={isMobile ? "center" : "flex-start"}
      $alignItems="center"
    >
      <div className={classNames("error-content", { retrying: retrying })}>
        <h2>{MESSAGES.genericError}</h2>
        <ActionBtn
          className="retry"
          onClick={() => {
            setRetrying(true);
            const url = new URL(window.location.href);
            router.push(url.origin + url.pathname);
            router.refresh();
            startTransition(() => {
              reset();
            });
          }}
        >
          {retrying ? LABEL_TEXT.retrying : LABEL_TEXT.retry}
        </ActionBtn>
      </div>
    </ErrorWrapper>
  );
}

export default Error;

const ErrorWrapper = styled(FlexBoxSection)`
  background: #b21807;
  color: #f0f0f0;
  height: 100vh;
  text-align: center;
  padding: 15px;
  &.retrying {
    background: #f0f0f0;
  }

  .error-content {
    padding: 15px;
    height: 100%;
    &.retrying {
      background: #f0f0f0;
      border-radius: 15px;
      background: linear-gradient(
        -45deg,
        #ffa500 40%,
        #ffa500 50%,
        #f7ba48 60%
      );
      box-shadow: transparent 0px -1px 0px 0px,
        rgba(240, 240, 240, 0.3) 0px -1px 0px inset, #ccc 0px 2px 12px;
      background-size: 300%;
      background-position-x: 100%;
      animation: shimmer 2.5s infinite linear;
      @keyframes shimmer {
        to {
          background-position-x: 0%;
        }
      }
      .retry {
        &:hover {
          background: #3498db;
        }
      }
    }
  }
  h2 {
    font-size: 32px;
    padding-top: 10%;
    margin-block: 0;
    transition: opacity 1000ms ease-in-out 1000ms;
  }
  .retry {
    margin-top: 20px;
    text-transform: uppercase;
    padding: 7px 15px;
    background: #3498db;
    border-radius: 20px;
    color: #f0f0f0;
    &:hover {
      background: #3f9c35;
    }
  }
`;
