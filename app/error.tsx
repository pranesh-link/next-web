"use client";
import Error from "./_components/error/Error";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <Error reset={reset} />;
}
