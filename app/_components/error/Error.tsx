import { LABEL_TEXT, MESSAGES } from "@/_constants/profile";
import { AppContext } from "@/_store/app/context";
import { useRouter } from "next/navigation";
import { startTransition, useContext } from "react";
import styled from "styled-components";
import { ActionBtn, FlexBoxSection } from "../common/Elements";

function Error({ reset }: { reset: () => void }) {
  const {
    data: {
      currentDevice: { isMobile },
    },
  } = useContext(AppContext);
  const router = useRouter();

  return (
    <ErrorWrapper
      $direction="column"
      $justifyContent={isMobile ? "center" : "flex-start"}
      $alignItems="center"
    >
      <h2>{MESSAGES.genericError}</h2>
      <ActionBtn
        className="retry"
        onClick={() => {
          const url = new URL(window.location.href);
          router.push(url.origin + url.pathname);
          router.refresh();
          startTransition(() => reset());
        }}
      >
        {LABEL_TEXT.retry}
      </ActionBtn>
    </ErrorWrapper>
  );
}

export default Error;

const ErrorWrapper = styled(FlexBoxSection)`
  background: #b21807;
  color: #f0f0f0;
  height: 100vh;
  text-align: center;
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
