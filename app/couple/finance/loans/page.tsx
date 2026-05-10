"use client";

import styled from "styled-components";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoanScheduleScanner from "@/couple/_components/loan/LoanScheduleScanner";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

import {
  ErrorBanner,
  ImportBar,
  ImportButton,
  NotificationBanner,
  PageWrapper,
} from "./_styled";
import SummaryCards from "./_components/SummaryCards";
import LoanCard from "./_components/LoanCard";
import ScheduleModalBody from "./_components/ScheduleModalBody";
import PrepaymentsModalBody from "./_components/PrepaymentsModalBody";
import DeleteConfirm from "./_components/DeleteConfirm";
import LoanFormModal from "./_components/LoanFormModal";
import { useLoansPage } from "./_hooks/use-loans-page";

const LoanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export default function LoansPage() {
  const h = useLoansPage();
  const ppLoan = h.loans.find((l) => l.id === h.prepaymentModalLoanId);

  return (
    <>
      {h.notification && (
        <NotificationBanner $type={h.notification.type} $leaving={h.notifLeaving}>
          {h.notification.message}
        </NotificationBanner>
      )}

      <FinanceHeader
        title="Loans & EMIs"
        action={{ label: "Add Loan", onClick: h.handleOpenAdd }}
        onRefresh={h.fetchLoans}
      />

      <PageWrapper>
        <ImportBar>
          <ImportButton type="button" onClick={() => h.setShowScanModal(true)}>
            📄 Import from PDF
          </ImportButton>
        </ImportBar>
        {h.loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : h.error ? (
          <ErrorBanner>{h.error}</ErrorBanner>
        ) : h.loans.length === 0 ? (
          <EmptyState
            title="No loans yet"
            description="Add your first loan to track EMIs, simulate prepayments, and plan for early payoff."
            action={{ label: "Add Loan", onClick: h.handleOpenAdd }}
          />
        ) : (
          <>
            <SummaryCards
              totalLoans={h.totalLoans}
              totalOutstanding={h.totalOutstanding}
              monthlyEmiLoad={h.monthlyEmiLoad}
            />

            <LoanGrid>
              {h.loans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onEdit={h.handleEdit}
                  onDeletePrompt={h.handleDeletePrompt}
                  scheduleLoadingLoanId={h.scheduleLoadingLoanId}
                  scheduleLoadErrors={h.scheduleLoadErrors}
                  pendingScheduleLoanId={h.pendingSchedule?.loanId ?? null}
                  onRetrySchedule={() => {
                    if (h.pendingSchedule?.loanId === loan.id) {
                      h.loadFullSchedule(loan.id, h.pendingSchedule.rawScheduleText);
                    }
                  }}
                  onToggleSchedule={h.toggleSchedule}
                  onOpenPrepaymentsModal={h.setPrepaymentModalLoanId}
                  simulatorLoanId={h.simulatorLoanId}
                  prepaymentAmount={h.prepaymentAmount}
                  onPrepaymentAmountChange={h.setPrepaymentAmount}
                  simulating={h.simulating}
                  simResult={h.simResult}
                  onToggleSimulator={h.toggleSimulator}
                  onSimulate={h.handleSimulate}
                  insightsLoanId={h.insightsLoanId}
                  insightsLoading={h.insightsLoading}
                  insightsData={h.insightsData}
                  onToggleInsights={h.toggleInsights}
                />
              ))}
            </LoanGrid>
          </>
        )}
      </PageWrapper>

      <LoanFormModal
        isOpen={h.showModal}
        onClose={() => {
          h.setShowModal(false);
          h.setEditTarget(null);
        }}
        editTarget={h.editTarget}
        scannedLoan={h.scannedLoan}
        submitting={h.submitting}
        onSubmit={h.handleFormSubmit}
      />

      <Modal
        isOpen={h.showDeleteConfirm}
        onClose={() => {
          h.setShowDeleteConfirm(false);
          h.setDeleteTargetId(null);
        }}
        title="Delete Loan"
        size="sm"
      >
        <DeleteConfirm
          submitting={h.submitting}
          onCancel={() => {
            h.setShowDeleteConfirm(false);
            h.setDeleteTargetId(null);
          }}
          onConfirm={h.handleDeleteConfirm}
        />
      </Modal>

      <Modal
        isOpen={!!h.scheduleLoanId}
        onClose={() => {
          h.setScheduleLoanId(null);
          h.setScheduleData(null);
        }}
        title={`EMI Schedule — ${h.loans.find((l) => l.id === h.scheduleLoanId)?.name ?? ""}`}
        size="lg"
      >
        <ScheduleModalBody loading={h.scheduleLoading} scheduleData={h.scheduleData} />
      </Modal>

      <Modal
        isOpen={h.showScanModal}
        onClose={() => h.setShowScanModal(false)}
        title="Import from PDF"
        size="md"
        preventClose={h.isScanningSchedule}
      >
        <LoanScheduleScanner
          onScanComplete={h.handleScanComplete}
          onClose={() => h.setShowScanModal(false)}
          onScanningChange={h.setIsScanningSchedule}
        />
      </Modal>

      <Modal
        isOpen={!!h.prepaymentModalLoanId}
        onClose={() => {
          h.setPrepaymentModalLoanId(null);
          h.setPpDate("");
          h.setPpAmount("");
        }}
        title={`Prepayments — ${ppLoan?.name ?? ""}`}
        size="md"
      >
        <PrepaymentsModalBody
          loan={ppLoan}
          ppDate={h.ppDate}
          ppAmount={h.ppAmount}
          ppSubmitting={h.ppSubmitting}
          onPpDateChange={h.setPpDate}
          onPpAmountChange={h.setPpAmount}
          onAdd={h.handleAddPrepayment}
          onRemove={h.handleRemovePrepayment}
        />
      </Modal>
    </>
  );
}
