import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
if (key?.startsWith("sb_secret_"))
  throw new Error("A secret Supabase key must never be used in the browser.");
if (key?.startsWith("eyJ")) {
  try {
    if (JSON.parse(atob(key.split(".")[1])).role === "service_role")
      throw new Error("Unsafe service-role key configured.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("service-role"))
      throw error;
  }
}
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
export function requireBackend() {
  if (!supabase)
    throw new Error(
      "Supabase configuration is missing. Set the public URL and publishable key.",
    );
  return supabase;
}
