import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccountStatus = "pending" | "approved" | "rejected";
export type AppRole = "admin" | "student";

export interface CurrentUser {
  session: Session;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    status: AccountStatus;
  };
  roles: AppRole[];
  isAdmin: boolean;
}

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return session;
}

export function useCurrentUser() {
  const session = useSession();

  const query = useQuery({
    enabled: !!session,
    queryKey: ["current-user", session?.user.id],
    queryFn: async (): Promise<CurrentUser | null> => {
      if (!session) return null;
      const [profileRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,avatar_url,status")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (rolesRes.error) throw rolesRes.error;
      const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
      return {
        session,
        profile: profileRes.data as CurrentUser["profile"],
        roles,
        isAdmin: roles.includes("admin"),
      };
    },
  });

  return { session, ...query };
}
