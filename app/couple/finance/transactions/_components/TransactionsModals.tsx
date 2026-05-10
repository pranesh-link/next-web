"use client";

import AccountForm from "@/couple/_components/forms/AccountForm";
import type { ScannedReceipt } from "@/couple/_components/receipt/ReceiptScanner";
import ReceiptScanner from "@/couple/_components/receipt/ReceiptScanner";
import Modal from "@/couple/_components/shared/Modal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import TransactionFormModal from "./TransactionFormModal";
import type { Account, Transaction } from "../_utils";

type Props = {
  /** Whether the add/edit transaction modal is open. */
  showModal: boolean;
  /** Whether the delete confirmation modal is open. */
  showDeleteConfirm: boolean;
  /** Whether the create-account modal is open. */
  showAccountModal: boolean;
  /** Whether the receipt scan modal is open. */
  showScanModal: boolean;
  /** True while the receipt scanner is actively processing an image. */
  isScanningReceipt: boolean;
  /** True while a server action is in flight. */
  submitting: boolean;
  /** Available accounts for the form selectors. */
  accounts: Account[];
  /** Selected transaction for editing, or null for create mode. */
  selectedTransaction: Transaction | null;
  /** Pre-filled fields parsed from a scanned receipt. */
  scannedData: Partial<Transaction> | null;
  /** Close the add/edit transaction modal and clear selection. */
  onCloseTransactionModal: () => void;
  /** Submit handler for the transaction form. */
  onSubmitTransaction: (data: {
    accountId: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    date: string;
  }) => Promise<void>;
  /** Close the delete confirmation modal. */
  onCloseDeleteModal: () => void;
  /** Confirm delete handler. */
  onConfirmDelete: () => void;
  /** Close the create-account modal. */
  onCloseAccountModal: () => void;
  /** Submit handler for the create-account form. */
  onSubmitAccount: (data: { name: string; type: string; balance: number }) => Promise<void>;
  /** Close the receipt scan modal. */
  onCloseScanModal: () => void;
  /** Receive a parsed receipt and populate the transaction form. */
  onScanComplete: (data: ScannedReceipt) => void;
  /** Track whether the scanner is currently processing. */
  onScanningChange: (v: boolean) => void;
};

/**
 * Render all modal dialogs for the transactions page.
 *
 * Groups the add/edit transaction modal, delete confirmation, create-account
 * modal, and receipt scanner modal so the page component stays focused on
 * data and orchestration.
 *
 * @param props - {@link Props} carrying open/close flags, data, and handlers.
 * @returns The combined modals fragment.
 */
export default function TransactionsModals({
  showModal,
  showDeleteConfirm,
  showAccountModal,
  showScanModal,
  isScanningReceipt,
  submitting,
  accounts,
  selectedTransaction,
  scannedData,
  onCloseTransactionModal,
  onSubmitTransaction,
  onCloseDeleteModal,
  onConfirmDelete,
  onCloseAccountModal,
  onSubmitAccount,
  onCloseScanModal,
  onScanComplete,
  onScanningChange,
}: Props) {
  return (
    <>
      <TransactionFormModal
        isOpen={showModal}
        accounts={accounts}
        selectedTransaction={selectedTransaction}
        scannedData={scannedData}
        submitting={submitting}
        onClose={onCloseTransactionModal}
        onSubmit={onSubmitTransaction}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        submitting={submitting}
        onClose={onCloseDeleteModal}
        onConfirm={onConfirmDelete}
      />

      <Modal
        isOpen={showAccountModal}
        onClose={onCloseAccountModal}
        title="Create Account"
        size="sm"
      >
        <AccountForm
          onSubmit={onSubmitAccount}
          onCancel={onCloseAccountModal}
          isLoading={submitting}
        />
      </Modal>

      <Modal
        isOpen={showScanModal}
        onClose={onCloseScanModal}
        title="Scan Receipt"
        size="md"
        preventClose={isScanningReceipt}
      >
        <ReceiptScanner
          onScanComplete={onScanComplete}
          onClose={onCloseScanModal}
          onScanningChange={onScanningChange}
        />
      </Modal>
    </>
  );
}
