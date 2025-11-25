import { FlexBoxSection, Grid } from "@/_components/common/Elements";
import {
  CopyIcon,
  LocationIcon,
  MailIcon,
  MobileIcon,
  TickIcon,
} from "@/_components/svg";
import { ProfileContext } from "@/_store/profile/page/context";
import { AboutMeDetailType } from "@/_store/profile/types";
import { getHref, lowercase } from "@/_utils/profile/server";
import classNames from "classnames";
import { JSX, useContext } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { CopyButton, DetailSection } from "../Elements";

interface AboutMeDetailsProps {
  copyState: string;
  setCopyState: (copyInfoId: string) => void;
}
const DetailInfoComponents: Record<AboutMeDetailType, JSX.Element> = {
  location: <LocationIcon />,
  email: <MailIcon />,
  mobile: <MobileIcon />,
};
const AboutMeDetails = (props: AboutMeDetailsProps) => {
  const {
    isMobile,
    isExport,
    data: {
      sections: { details },
    },
  } = useContext(ProfileContext);
  const { copyState, setCopyState } = props;

  return (
    <DetailSection className="details" $isMobile={false}>
      {!isExport && (
        <FlexBoxSection $direction="column" $justifyContent="space-between">
          {details.info.map((detail, index) => {
            const { id, label, info, canCopy } = detail;
            const copied = copyState === label;
            return (
              <Grid
                key={index}
                $alignItems="start"
                $gridTemplateColumns="0.2fr 1fr 1fr"
                className="detail-icon"
              >
                <div className="info-icon">{DetailInfoComponents[id]}</div>
                {(isMobile || isExport) && canCopy ? (
                  <a href={getHref(lowercase(label), info)}>{info}</a>
                ) : (
                  <span className="detail-info-text" id={lowercase(label)}>
                    <b>{info}</b>
                  </span>
                )}
                <CopyToClipboard
                  onCopy={() => {
                    setCopyState(label);
                  }}
                  text={info}
                >
                  <CopyButton
                    data-id={lowercase(label)}
                    className={classNames({
                      hide: !canCopy,
                      mobile: !isExport && isMobile && canCopy,
                      copied,
                    })}
                  >
                    {copied ? (
                      <TickIcon fillColor="#3f9c35" strokeWidth={5} />
                    ) : (
                      <CopyIcon />
                    )}
                  </CopyButton>
                </CopyToClipboard>
              </Grid>
            );
          })}
        </FlexBoxSection>
      )}
    </DetailSection>
  );
};

export default AboutMeDetails;
