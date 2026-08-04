import { requireInternalOperator } from "@/lib/auth/require-internal";

export const dynamic = "force-dynamic";

export default async function BackOfHouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInternalOperator();
  return children;
}
