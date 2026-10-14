"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  collapsed?: boolean;
  redirectTo?: string;
  className?: string;
}

export default function LogoutButton({
  collapsed = false,
  redirectTo = "/login",
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const busy = signingOut || isPending;

  async function handleLogout() {
    if (busy) return;
    setSigningOut(true);
    setFailed(false);

    try {
      // 4) scope: "local" થી માત્ર આ ડિવાઇસનું સેશન ડિલીટ થશે (બધા ડિવાઇસમાંથી લૉગઆઉટ કરવા માટે { scope: "local" } કાઢી નાખો)
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;

      startTransition(() => {
        router.replace(redirectTo);
        router.refresh();
      });
    } catch {
      setFailed(true);
      setSigningOut(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        aria-busy={busy}
        aria-label={collapsed ? "Sign out" : undefined}
        title={collapsed ? "Sign out" : undefined}
        className={[
          "group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-slate-300",
          "transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
          "disabled:cursor-wait disabled:opacity-70",
          collapsed ? "justify-center" : "",
          className,
        ].join(" ")}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
        )}
        {!collapsed && <span>{busy ? "સાઇન આઉટ થઈ રહ્યું છે…" : "સાઇન આઉટ"}</span>}
      </button>

      {failed && (
        <p role="alert" className="mt-2 px-1 text-xs text-red-300">
          સાઇન આઉટ થઈ શક્યું નથી. ફરી પ્રયાસ કરો.
        </p>
      )}
    </div>
  );
}