/** TripStatus enum mirroring Prisma's TripStatus. */
export type TripStatus =
  | "PLANNING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/** A trip row from the database. */
export interface Trip {
  id: string;
  userId: string;
  coupleId: string | null;
  name: string;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  budget: number | null;
  status: TripStatus;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Trip with all related items included. */
export interface TripWithRelations extends Trip {
  itineraryItems: ItineraryItem[];
  expenses: TripExpense[];
  checklistItems: ChecklistItem[];
}

/** A single itinerary item. */
export interface ItineraryItem {
  id: string;
  tripId: string;
  day: number;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  createdAt: Date | string;
}

/** A trip expense. */
export interface TripExpense {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  category: string | null;
  paidBy: string | null;
  date: Date | string;
  createdAt: Date | string;
}

/** A packing checklist item. */
export interface ChecklistItem {
  id: string;
  tripId: string;
  userId: string;
  item: string;
  packed: boolean;
  assignedTo: string | null;
  createdAt: Date | string;
}

/** Color key for status badges. */
export type StatusColor = "blue" | "green" | "amber" | "gray" | "red";
