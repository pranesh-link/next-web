import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import CoupleDataChat from "@/couple/_components/chat/CoupleDataChat";

export const metadata = { title: "Chat with Couple data | Coupletastic" };

export default function ChatPage() {
  return (
    <>
      <FinanceHeader title="Chat with Couple data" />
      <CoupleDataChat
        endpoint="/api/couple/data-chat"
        configEndpoint="/api/couple/data-chat/config"
        pageMode
      />
    </>
  );
}
