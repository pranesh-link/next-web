import { useContext } from "react";
import { ModalBanner, ModalContentWrap } from "../../common/Elements";
import CustomModalComponent from "../../common/ModalComponent";
import ContactForm from "../../form/contact/Form";
import { ProfileContext } from "@/_store/profile/context";

export default function ContactModal({ isOpen }: { isOpen: boolean }) {
  const { setIsContactFormOpen, setIsModalOpen } = useContext(ProfileContext);
  return (
    <CustomModalComponent
      className="contact-modal-content"
      isOpen={isOpen}
      ariaHideApp={false}
    >
      <ModalContentWrap $direction="column" className="contact-modal">
        <ModalBanner className="header" />
        <ContactForm
          closeModal={() => {
            setIsContactFormOpen(false);
            setIsModalOpen(false);
          }}
        />
        <ModalBanner className="footer" />
      </ModalContentWrap>
    </CustomModalComponent>
  );
}
