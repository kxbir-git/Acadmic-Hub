import type { ReactNode } from "react";
import { CampusBackground } from "@/components/CampusBackground";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/lib/use-current-user";

export function PublicShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  return (
    <>
      <CampusBackground />
      <div className="flex min-h-screen flex-col">
        <AppHeader user={user ?? null} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </>
  );
}
