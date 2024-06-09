import { useAppSelector } from "@/_redux/hooks";
import { clearLocalStorage } from "@/_utils/profile/client";
import { useEffect, useState } from "react";
import styled from "styled-components";
import PWALink from "./PWALink";

interface IInstallPWAButtonProps {
  hideAnimation?: boolean;
}

export default function InstallPWAButton(props: IInstallPWAButtonProps) {
  const { hideAnimation = false } = props;
  const isAppInstalledState = useAppSelector(
    (state) => state.app.isAppInstalled
  );
  const [prompt, setPrompt] = useState<any>(null);

  const handleBeforeInstallPrompt = (e: any) => {
    clearLocalStorage();
    e.preventDefault();
    setPrompt(e);
  };

  const onInstall = async () => {
    if (isAppInstalledState) return;

    await prompt.prompt();
  };

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return (
    <StyledPWALink
      $hideAnimation={hideAnimation}
      onInstall={onInstall}
      className="pwa-link"
    />
  );
}

const StyledPWALink = styled(PWALink)<{ $hideAnimation: boolean }>`
  margin-bottom: 25px;
  text-decoration: none;
  color: #3e3e3e;
  background-color: #fff;
  border-radius: 30px;
  padding: 10px 20px;
  max-width: fit-content;
  animation: ${(props) =>
    props.$hideAnimation ? "none" : "blinker 5s linear infinite"};
  ${(props) =>
    props.$hideAnimation
      ? "box-shadow: none"
      : "box-shadow: rgb(0 0 0 / 20%) 0 -1px 0px 1px, inset #304701 0 -1px 0px, #3f9c35 0 2px 12px"};

  &:hover {
    box-shadow: transparent -1px 0px 1px, inset transparent 0 -1px 0px,
      #04af70 0 2px 12px;
    animation: none;
  }

  .mobile-application-icon {
    cursor: pointer;
    height: 25px;
    padding: 0;
  }

  .install-app-text {
    margin-left: 10px;
    font-weight: bold;
  }
  @keyframes blinker {
    50% {
      opacity: 0.8;
      box-shadow: none;
    }
  }

  @media only screen and (max-width: 767px) {
    padding: 7px 20px;
  }
`;
