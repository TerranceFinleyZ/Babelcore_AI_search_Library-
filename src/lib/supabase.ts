import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client — safe to import anywhere in client components
export const supabase = createClient(url, key);

export type DbMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  user_color: string;
  user_image_url: string | null;
  text: string;
  created_at: string;
};

export type DbReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};
