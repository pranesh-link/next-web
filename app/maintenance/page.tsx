"use client";
import dynamic from "next/dynamic";

const DynamicMaintenanceC = dynamic(
  () => import("@/_components/maintenance/Maintenance"),
  { ssr: false }
);

const MaintenancePage = () => {
  return <DynamicMaintenanceC />;
};

export default MaintenancePage;
