/** Result returned by the receipt scan server action. */
export type ScannedReceipt = {
  storeName?: string;
  totalAmount?: number;
  date?: string | null;
  category?: string;
  description?: string;
  items?: { name: string; amount: number }[];
  confidence?: number;
};

export { compressImage } from "@/_lib/image-compression";
export { getConfidenceLevel } from "@/couple/_components/shared/confidence-helpers";
