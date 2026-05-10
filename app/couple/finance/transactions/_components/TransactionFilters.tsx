"use client";

import {
  AddAccountLink,
  ClearButton,
  FilterBar,
  FilterInput,
  FilterSelect,
} from "../_styled";
import { CATEGORIES, type Account, type Filters } from "../_utils";

type Props = {
  filters: Filters;
  accounts: Account[];
  hasActiveFilters: boolean;
  onChange: React.Dispatch<React.SetStateAction<Filters>>;
  onClear: () => void;
  onAddAccount: () => void;
};

export default function TransactionFilters({
  filters,
  accounts,
  hasActiveFilters,
  onChange,
  onClear,
  onAddAccount,
}: Props) {
  return (
    <FilterBar>
      <FilterInput
        type="month"
        value={filters.month}
        onChange={(e) =>
          onChange((f) => ({ ...f, month: e.target.value }))
        }
        aria-label="Filter by month"
      />
      <FilterSelect
        value={filters.category}
        onChange={(e) =>
          onChange((f) => ({ ...f, category: e.target.value }))
        }
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={filters.accountId}
        onChange={(e) =>
          onChange((f) => ({ ...f, accountId: e.target.value }))
        }
        aria-label="Filter by account"
      >
        <option value="">All Accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </FilterSelect>
      <AddAccountLink type="button" onClick={onAddAccount}>
        + New Account
      </AddAccountLink>
      {hasActiveFilters && (
        <ClearButton type="button" onClick={onClear}>
          Clear Filters
        </ClearButton>
      )}
    </FilterBar>
  );
}
