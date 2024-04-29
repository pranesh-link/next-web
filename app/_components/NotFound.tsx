import { ROUTES } from "@/_constants/common";
import { AppContext } from "@/_store/app/context";
import { redirect } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FlexBox } from "./common/Elements";

function NotFound() {
  const {
    data: {
      appConfig: {
        notFoundPage: { title },
        labels,
      },
    },
  } = useContext(AppContext);

  const [counter, setCounter] = useState(5);
  const [timer, updateTimer] = useState<any>("");

  const redirectMessage = useMemo(() => {
    return labels.goToHomePage.replace("{0}", `${counter}`);
  }, [counter, labels.goToHomePage]);

  useEffect(() => {
    if (counter === 0) {
      redirect(ROUTES.ROUTE_HOME);
    }
  }, [counter]);

  useEffect(() => {
    (() => {
      clearInterval(timer);
      const timerId = setInterval(() => {
        setCounter((prevCounter) => prevCounter - 1);
      }, 1000);
      updateTimer(timerId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showContent = useMemo(() => title, [title]);
  return showContent ? (
    <NotFoundPageWrapper $direction="column" $alignItems="center">
      <NotFoundTitle dangerouslySetInnerHTML={{ __html: title }} />
      <p className="redirecting-you">{redirectMessage}</p>
    </NotFoundPageWrapper>
  ) : null;
}

export default NotFound;

const NotFoundPageWrapper = styled(FlexBox)`
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  background: #faf6f9;
  .redirecting-you {
    font-size: 16px;
    font-weight: 500;
  }
`;

const NotFoundTitle = styled.div`
  margin: 0 auto;
  margin-top: 50px;
  text-align: center;
  h1 {
    color: #ee4b2b;
  }
`;
