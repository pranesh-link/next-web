/**
 * Layout for the Coupletastic Lifestyle module.
 * Adds the floating "Chat with your Couple data" button to all lifestyle sub-pages.
 */
import CoupleDataChat from "@/couple/_components/chat/CoupleDataChat";

export default function LifestyleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CoupleDataChat
        endpoint="/api/couple/data-chat"
        configEndpoint="/api/couple/data-chat/config"
      />
    </>
  );
}
