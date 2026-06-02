import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Clock, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/use-current-user";
import { CampusBackground } from "@/components/CampusBackground";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <>
        <CampusBackground />
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error) {
    return <CenterMessage title="Couldn't load your account" body={error.message} />;
  }

  if (user.profile.status === "pending") {
    return (
      <CenterMessage
        icon={<Clock className="h-7 w-7" />}
        title="Waiting for approval"
        body="Your account is waiting for administrator approval. You'll be able to access the dashboard as soon as it's granted."
        signOut
      />
    );
  }

  if (user.profile.status === "rejected") {
    return (
      <CenterMessage
        icon={<ShieldAlert className="h-7 w-7" />}
        title="Access denied"
        body="Your account request was not approved. Please contact your administrator."
        signOut
      />
    );
  }

  return (
    <>
      <CampusBackground />
      <div className="flex min-h-screen flex-col">
        <AppHeader user={user} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function CenterMessage({
  icon,
  title,
  body,
  signOut,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  signOut?: boolean;
}) {
  return (
    <>
      <CampusBackground />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          {icon && (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              {icon}
            </div>
          )}
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          {signOut && (
            <Button
              variant="outline"
              className="mt-6 border-white/15 bg-white/5"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
