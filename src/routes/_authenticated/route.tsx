import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/use-current-user";
import { CampusBackground } from "@/components/CampusBackground";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: user } = useCurrentUser();

  return (
    <>
      <CampusBackground />
      <div className="flex min-h-screen flex-col">
        <AppHeader user={user ?? null} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}
