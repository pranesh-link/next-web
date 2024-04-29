"use client";
import dynamic from "next/dynamic";

const DynamicNotFound = dynamic(() => import("./_components/NotFound"), {
  ssr: false,
});

const NotFoundPage = () => {
  return <DynamicNotFound />;
};

export default NotFoundPage;
