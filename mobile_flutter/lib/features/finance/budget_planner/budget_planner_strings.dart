/// Centralized strings for Budget Planner feature.
/// Organized by category to support future i18n.
class BudgetPlannerStrings {
  // ══════════════════════════════════════════════════════════════════════════
  // Messages (success/error/info messages)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const enterValidIncome = 'Enter valid income';
  static const budgetPlanSaved = 'Budget plan saved';
  static const errorPrefix = 'Error: ';
  static const noPlanFoundForPreviousMonth = 'No plan found for previous month';
  static const noLoansFound = 'No loans found';
  static const allLoanEmisAlreadyInPlan = 'All loan EMIs already in plan';
  static const budgetPlanDeleted = 'Budget plan deleted';
  static const alreadyInPlanTooltip = 'Already in plan - cannot add';
  
  /// Dynamic message templates
  static String addedItemsFromLastMonth(int count) =>
      'Added $count item${count > 1 ? 's' : ''} from last month';
  
  static String addedLoanEmis(int count) =>
      'Added $count loan EMI${count > 1 ? 's' : ''}';
  
  static String expensesExceedIncome(int amount) =>
      'Planned expenses exceed income by ₹$amount';
  
  static String loanEmisNotAdded(int count) =>
      '$count loan EMI${count > 1 ? 's' : ''} not yet added to plan';
  
  static String selectedCount(int selected, int total) =>
      '$selected / $total selected';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Headers (titles, section headers)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const importFromLastMonth = 'Import from last month';
  static const deletePlan = 'Delete Plan';
  static const addItem = 'Add Item';
  static const editItem = 'Edit Item';
  static const noPlansYet = 'No plans yet';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Labels (form labels, field names, descriptions)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const category = 'Category';
  static const titleNote = 'Title / Note';
  static const amount = 'Amount';
  static const markAsPaid = 'Mark as paid';
  static const note = 'Note';
  static const startPlanningYourMonth = 'Start planning your month';
  static const setIncomeToTrack = 'Set your income to track remaining budget';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Actions (button text, menu items)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const delete = 'Delete';
  static const close = 'Close';
  static const done = 'Done';
  static const cancel = 'Cancel';
  static const selectAll = 'Select all';
  static const deselectAll = 'Deselect all';
  static const selectItemsToAdd = 'Select items to add';
  static const addFirstItem = 'Add first item';
  static const quicklyAddFrom = 'or quickly add from:';
  static const lastMonth = 'Last month';
  static const loanEmis = 'Loan EMIs';
  
  /// Dynamic button labels
  static String addItems(int count) =>
      'Add $count item${count > 1 ? 's' : ''}';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Hints (placeholder text, examples)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const selectCategory = 'Select category';
  static const insurancePremiumExample = 'e.g. Insurance Premium';
  static const zeroAmount = '0';
  static const rupeePrefix = '₹ ';
  static const defaultAmountHint = '₹0';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Dialog Content
  // ══════════════════════════════════════════════════════════════════════════
  
  static const deletePlanConfirmation = 'Are you sure? This cannot be undone.';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Icons & Emojis
  // ══════════════════════════════════════════════════════════════════════════
  
  static const clipboardIcon = '📋';
  static const crossMarkIcon = '❌';
  static const creditCardIcon = '💳';
  
  // ══════════════════════════════════════════════════════════════════════════
  // Technical Constants (abbreviations, technical terms)
  // ══════════════════════════════════════════════════════════════════════════
  
  static const emi = 'EMI';
}
