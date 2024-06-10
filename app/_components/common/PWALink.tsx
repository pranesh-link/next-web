import { useAppSelector } from "@/_redux/hooks";
import { AppContext } from "@/_store/app/context";
import classNames from "classnames";
import { useContext } from "react";
import { MobileApplicationIcon } from "../svg";
import { ActionBtn, FlexBox } from "./Elements";

interface IPWALinkProps {
  onInstall: () => void;
  className: string;
}

export default function PWALink(props: IPWALinkProps) {
  const { onInstall, className } = props;
  const isAppInstalledState = useAppSelector(
    (state) => state.app.isAppInstalled
  );

  const {
    data: {
      features: { pwa },
      pwa: { messages },
    },
  } = useContext(AppContext);

  const LinkContent = () => (
    <FlexBox $alignItems="center">
      <ActionBtn className="mobile-application-icon">
        <MobileApplicationIcon />
      </ActionBtn>
      <span className="install-app-text">
        {isAppInstalledState ? messages.open : messages.installApp}
      </span>
    </FlexBox>
  );

  return (
    <>
      {isAppInstalledState ? (
        <a
          href={process.env.NEXT_PUBLIC_SITE_URL}
          className={className}
          target="_blank"
          rel="noreferrer"
        >
          <LinkContent />
        </a>
      ) : (
        <ActionBtn
          onClick={onInstall}
          className={classNames(className, { hide: !pwa || !prompt })}
        >
          <LinkContent />
        </ActionBtn>
      )}
    </>
  );
}
