"use client";

import { useSession } from "next-auth/react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

import { PageWrapper, SectionCard, IncomeHint } from "./_styled";
import { useBudgetPlanner } from "./_hooks/useBudgetPlanner";

import NotificationBanner from "./_components/NotificationBanner";
import PeriodHeader from "./_components/PeriodHeader";
import SummarySection from "./_components/SummarySection";
import ExpensesSection from "./_components/ExpensesSection";
import PaidExpensesSection from "./_components/PaidExpensesSection";
import ComparisonSection from "./_components/ComparisonSection";
import ActionButtonsBar from "./_components/ActionButtonsBar";
import DeleteModal from "./_components/DeleteModal";
import SuggestionsModal from "./_components/SuggestionsModal";
import ImportPrevModal from "./_components/ImportPrevModal";

export default function BudgetPlannerPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const vm = useBudgetPlanner();

  return (
    <>
      <FinanceHeader title="Budget Planner" />

      {vm.notification && (
        <NotificationBanner notification={vm.notification} leaving={vm.notifLeaving} />
      )}

      <PageWrapper>
        <PeriodHeader
          mode={vm.mode}
          monthAndYear={vm.monthAndYear}
          income={vm.income}
          submitting={vm.submitting}
          savedPlan={vm.savedPlan}
          currentUserId={currentUserId}
          onModeChange={vm.handleModeChange}
          onMonthAndYearChange={vm.setMonthAndYear}
          onIncomeChange={vm.setIncome}
          onSave={vm.handleSave}
          onReset={vm.resetForm}
          onDelete={() => vm.setShowDeleteModal(true)}
        />

        {vm.loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : (
          <>
            {vm.incomeHint && (
              <SectionCard>
                <IncomeHint>{vm.incomeHint}</IncomeHint>
              </SectionCard>
            )}

            {vm.income > 0 && (
              <SummarySection
                mode={vm.mode}
                income={vm.income}
                totalExpenses={vm.totalExpenses}
                totalPaid={vm.totalPaid}
                remaining={vm.remaining}
                savingsRate={vm.savingsRate}
                suggestionsCount={vm.suggestions.length}
                onShowSuggestions={() => vm.setShowSuggestionsModal(true)}
              />
            )}

            <ExpensesSection
              mode={vm.mode}
              lineItems={vm.lineItems}
              totalExpenses={vm.totalExpenses}
              prevPlanHasItems={!!vm.prevPlan && vm.prevLineItems.length > 0}
              onUpdate={vm.updateLineItem}
              onMarkPaid={vm.markAsPaid}
              onRemove={vm.removeLineItem}
              onAdd={vm.addLineItem}
              onImportEMIs={vm.importEMIs}
              onOpenImportPrev={vm.openImportPrevModal}
            />

            {vm.paidItems.length > 0 && (
              <PaidExpensesSection
                lineItems={vm.lineItems}
                totalPaid={vm.totalPaid}
                onUndoPaid={vm.undoPaid}
              />
            )}

            <ComparisonSection
              mode={vm.mode}
              monthAndYear={vm.monthAndYear}
              income={vm.income}
              hasExpenseData={vm.hasExpenseData}
              totalExpenses={vm.totalExpenses}
              remaining={vm.remaining}
              savingsRate={vm.savingsRate}
              prevPlan={vm.prevPlan}
              prevLineItems={vm.prevLineItems}
              prevTotalExpenses={vm.prevTotalExpenses}
              prevRemaining={vm.prevRemaining}
              prevSavingsRate={vm.prevSavingsRate}
              lineItems={vm.lineItems}
            />

            <ActionButtonsBar
              submitting={vm.submitting}
              hasSavedPlan={!!vm.savedPlan}
              onSave={vm.handleSave}
              onReset={vm.resetForm}
              onDelete={() => vm.setShowDeleteModal(true)}
            />
          </>
        )}
      </PageWrapper>

      <DeleteModal
        isOpen={vm.showDeleteModal}
        mode={vm.mode}
        monthAndYear={vm.monthAndYear}
        submitting={vm.submitting}
        onClose={() => vm.setShowDeleteModal(false)}
        onConfirm={vm.handleDelete}
      />

      <ImportPrevModal
        isOpen={vm.showImportPrevModal}
        mode={vm.mode}
        importRows={vm.importRows}
        importSelection={vm.importSelection}
        onClose={() => vm.setShowImportPrevModal(false)}
        onToggleRow={vm.toggleImportRow}
        onSelectAll={vm.selectAllImportRows}
        onSelectNone={vm.selectNoneImportRows}
        onConfirm={vm.confirmImportPrev}
      />

      <SuggestionsModal
        isOpen={vm.showSuggestionsModal}
        suggestions={vm.suggestions}
        onClose={() => vm.setShowSuggestionsModal(false)}
      />
    </>
  );
}
