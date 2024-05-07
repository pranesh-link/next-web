"use client";
import dynamic from "next/dynamic";

export const dynamicParams = false;
const DynamicHomePageC = dynamic(() => import("@/_components/home/HomePage"), {
  ssr: false,
});

export default function HomePage({
  searchParams,
}: {
  searchParams?: { isAdmin?: string };
}) {
  return <DynamicHomePageC searchParams={searchParams} />;
}
