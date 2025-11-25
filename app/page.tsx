"use client";
import dynamic from "next/dynamic";
import { use } from "react";
import "./globals.scss";

export const dynamicParams = false;
const DynamicHomePageC = dynamic(() => import("@/_components/home/HomePage"), {
  ssr: false,
});

export default function HomePage(props: {
  searchParams?: Promise<{ isAdmin?: string }>;
}) {
  const searchParams = use(props.searchParams as Promise<{ isAdmin?: string }>);
  return <DynamicHomePageC searchParams={searchParams} />;
}
