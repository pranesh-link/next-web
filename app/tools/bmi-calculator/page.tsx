import { redirect } from "next/navigation";

/**
 * Legacy BMI calculator route. Permanently moved to the LuvVerse
 * Lifestyle module. Redirects to the new wellness tracker.
 *
 * @returns Never — issues a server-side redirect.
 */
export default function LegacyBmiCalculatorPage(): never {
  redirect("/couple/lifestyle/wellness");
}
