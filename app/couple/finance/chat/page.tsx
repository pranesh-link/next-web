import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import FinanceChat from "@/couple/_components/chat/FinanceChat";

export const metadata = { title: "AI Chat | Coupletastic" };

/**
 * Full-page AI finance chat experience at `/couple/finance/chat`.
 *
 * @returns Page with the FinanceHeader and inline FinanceChat component.
 */
export default function ChatPage() {
  return (
    <>
      <FinanceHeader title="AI Chat" />
      <FinanceChat pageMode />
    </>
  );
}
