"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

// Returns a Supabase client authenticated with the current Clerk session JWT
export function useSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: async (url, options = {}) => {
              let token: string | null = null;
              try {
                token = await session?.getToken({ template: "supabase" }) ?? null;
              } catch {
                // "supabase" JWT template not configured — fall back to anon key
              }
              const headers = new Headers((options as RequestInit).headers);
              if (token) headers.set("Authorization", `Bearer ${token}`);
              return fetch(url, { ...(options as RequestInit), headers });
            },
          },
        }
      ),
    [session]
  );
}
