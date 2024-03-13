import { useContext } from "react";
import { CustomModalComponent, FlexBox } from "@/_components/common/Elements";
import { ProfileContext } from "@/_store/profile/context";

interface IVersionModalProps {
  displayVersionModal: boolean;
  setDisplayVersionModal: (display: boolean) => void;
}
const VersionModal = (props: IVersionModalProps) => {
  const { appVersion: version } = useContext(ProfileContext);
  return (
    <CustomModalComponent
      isOpen={props.displayVersionModal}
      shouldCloseOnOverlayClick={true}
      onRequestClose={() => {
        props.setDisplayVersionModal(false);
      }}
      className="version-modal"
    >
      <FlexBox $justifyContent="center">
        <p>
          App version: <span>v{version}</span>
        </p>
      </FlexBox>
    </CustomModalComponent>
  );
};

export default VersionModal;
