/**
 * Passthrough layout for the Coupletastic Lifestyle module.
 *
 * The parent `app/couple/layout.tsx` already wires the sidebar, providers,
 * and styled-components registry. This sublayout exists so route-level
 * metadata or future per-module providers can be added without disturbing
 * the parent layout.
 */
export default function LifestyleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
