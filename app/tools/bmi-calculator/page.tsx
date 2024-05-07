"use client";

import dynamic from "next/dynamic";

const DynamicBMICalculatorC = dynamic(
  () => import("@/_components/bmi-calculator/BMICalculator"),
  { ssr: false }
);
export default function BMICalculatorPage() {
  return <DynamicBMICalculatorC />;
}
