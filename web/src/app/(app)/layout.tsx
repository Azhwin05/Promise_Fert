import { Suspense } from "react";
import { AuthGate } from "@/lib/auth";
import { Shell } from "@/components/shell";
import { Spinner } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Shell>
        <Suspense fallback={<Spinner />}>{children}</Suspense>
      </Shell>
    </AuthGate>
  );
}
