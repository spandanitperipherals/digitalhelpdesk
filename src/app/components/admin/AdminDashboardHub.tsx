"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  HardDrive,
  RefreshCw,
  Send,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "src/lib/supabase/client.ts";
import { Tilt3DCard, TiltLayer } from "src/app/components/ui/Tilt3DCard.tsx";

/* -------------------------------------------------------------------------- */
/* Data source                                                                */
/* Adjust these names if your schema differs.                                 */
/* -------------------------------------------------------------------------- */

const TABLES = {
  sants: "sants",
  yuvaks: "profiles",
  dispatchLogs: "dispatch_logs",
} as const;

const COLUMNS = {
  driveFolderId: "shared_folder_link", // sants: linked Google Drive shared folder
  isActive: "is_active", // yuvaks: active/inactive toggle
  createdAt: "created_at", // dispatch_logs: timestamp
} as const;

interface HubData {
  santsTotal: number | null;
  santsWithDrive: number | null;
  yuvaksTotal: number | null;
  yuvaksActive: number | null;
  dispatched24h: number | null;
}

type CountResult = PromiseLike<{ count: number | null; error: unknown }>;

async function toCount(query: CountResult): Promise<number | null> {
  try {
    const { count, error } = await query;
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}

async function fetchHubData(
  supabase: ReturnType<typeof createClient>
): Promise<HubData> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const head = { count: "exact", head: true } as const;

  const [santsTotal, santsWithDrive, yuvaksTotal, yuvaksActive, dispatched24h] =
    await Promise.all([
      toCount(supabase.from(TABLES.sants).select("*", head)),
      toCount(
        supabase.from(TABLES.sants).select("*", head).not(COLUMNS.driveFolderId, "is", null)
      ),
      toCount(supabase.from(TABLES.yuvaks).select("*", head)),
      toCount(supabase.from(TABLES.yuvaks).select("*", head).eq(COLUMNS.isActive, true)),
      toCount(
        supabase.from(TABLES.dispatchLogs).select("*", head).gte(COLUMNS.createdAt, since)
      ),
    ]);

  return { santsTotal, santsWithDrive, yuvaksTotal, yuvaksActive, dispatched24h };
}

/* -------------------------------------------------------------------------- */
/* Presentation                                                               */
/* -------------------------------------------------------------------------- */

const nf = new Intl.NumberFormat("en-IN");
const fmt = (n: number | null) => (n === null ? "—" : nf.format(n));

const ACCENTS = {
  amber: {
    tile: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
    bar: "bg-amber-400",
    cta: "text-amber-300",
    glow: "251,191,36",
  },
  saffron: {
    tile: "bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/40",
    bar: "bg-amber-600",
    cta: "text-amber-400",
    glow: "217,119,6",
  },
  emerald: {
    tile: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
    bar: "bg-emerald-400",
    cta: "text-emerald-300",
    glow: "16,185,129",
  },
} as const;

type Accent = keyof typeof ACCENTS;

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  accent: Accent;
  href: string;
  cta: string;
  loading: boolean;
  unavailable: boolean;
  /** 0–100. Omit to hide the bar. */
  progress?: number | null;
  chip?: { text: string; tone: "ok" | "warn" } | null;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  accent,
  href,
  cta,
  loading,
  unavailable,
  progress,
  chip,
}: MetricCardProps) {
  const a = ACCENTS[accent];

  return (
    <Tilt3DCard
      href={href}
      label={`${label}: ${cta}`}
      glowRgb={a.glow}
      className="h-full"
      surfaceClassName="flex min-h-[236px] flex-col p-5 sm:p-6"
    >
      <TiltLayer depth={38} className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${a.tile}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        {chip && !loading && (
          <span
            className={[
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              chip.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-500/10 text-amber-200",
            ].join(" ")}
          >
            {chip.text}
          </span>
        )}
      </TiltLayer>

      <TiltLayer depth={24} className="mt-6">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="mt-1 flex h-12 items-center">
          {loading ? (
            <span
              aria-hidden
              className="h-9 w-24 animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none"
            />
          ) : (
            <p className="text-4xl font-semibold tabular-nums text-white">{value}</p>
          )}
        </div>
      </TiltLayer>

      <TiltLayer depth={12} className="mt-3 min-h-[2.75rem]">
        <p className="text-sm leading-snug text-slate-400">
          {loading ? "Loading…" : unavailable ? "Couldn't load. Refresh to try again." : caption}
        </p>
        {typeof progress === "number" && !loading && !unavailable && (
          <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="mt-3 h-1.5 w-full rounded-full bg-white/10"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${a.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </TiltLayer>

      <TiltLayer
        depth={28}
        className={`mt-auto flex items-center gap-1 pt-5 text-sm font-medium ${a.cta}`}
      >
        <span>{cta}</span>
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </TiltLayer>
    </Tilt3DCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Hub                                                                        */
/* -------------------------------------------------------------------------- */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, rotateX: -12 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

export default function AdminDashboardHub({ className = "" }: { className?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const reduce = useReducedMotion();

  const [data, setData] = useState<HubData | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setRefreshing(true);
    const next = await fetchHubData(supabase);
    if (!mounted.current) return;
    setData(next);
    setUpdatedAt(new Date());
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    mounted.current = true;
    load();

    // Refresh (debounced) whenever any of the underlying tables change.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 400);
    };

    const channel = supabase
      .channel("admin-hub-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.sants }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.yuvaks }, schedule)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLES.dispatchLogs },
        schedule
      )
      .subscribe();

    return () => {
      mounted.current = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  const initialLoading = data === null;

  const santsTotal = data?.santsTotal ?? null;
  const santsWithDrive = data?.santsWithDrive ?? null;
  const yuvaksTotal = data?.yuvaksTotal ?? null;
  const yuvaksActive = data?.yuvaksActive ?? null;
  const dispatched = data?.dispatched24h ?? null;

  const activePct =
    yuvaksTotal && yuvaksActive !== null ? (yuvaksActive / yuvaksTotal) * 100 : null;

  const drivePct =
    santsTotal && santsWithDrive !== null ? (santsWithDrive / santsTotal) * 100 : null;
  const driveMissing =
    santsTotal !== null && santsWithDrive !== null ? santsTotal - santsWithDrive : null;

  const driveChip =
    driveMissing === null
      ? null
      : driveMissing === 0
        ? ({ text: "All linked", tone: "ok" } as const)
        : ({ text: `${nf.format(driveMissing)} to link`, tone: "warn" } as const);

  return (
    <section aria-labelledby="hub-title" className={className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="hub-title" className="text-2xl font-semibold text-white sm:text-3xl">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Live counts for Vadodara. They update when records change.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500" aria-live="polite">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : ""}
          </p>
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/70 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </div>

      <motion.div
        variants={container}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="perspective-2000 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div variants={reduce ? undefined : item} className="h-full">
          <MetricCard
            icon={UserRound}
            label="Sant directory"
            value={fmt(santsTotal)}
            caption={`${fmt(santsWithDrive)} have a Drive folder linked`}
            accent="amber"
            href="/admin/sants"
            cta="Open directory"
            loading={initialLoading}
            unavailable={!initialLoading && santsTotal === null}
          />
        </motion.div>

        <motion.div variants={reduce ? undefined : item} className="h-full">
          <MetricCard
            icon={Users}
            label="Active yuvaks"
            value={fmt(yuvaksActive)}
            caption={`of ${fmt(yuvaksTotal)} registered volunteers`}
            accent="emerald"
            href="/admin/yuvaks"
            cta="Manage volunteers"
            loading={initialLoading}
            unavailable={!initialLoading && yuvaksActive === null}
            progress={activePct}
          />
        </motion.div>

        <motion.div variants={reduce ? undefined : item} className="h-full">
          <MetricCard
            icon={Send}
            label="Dispatched in 24 hours"
            value={fmt(dispatched)}
            caption="Messages sent across WhatsApp, Telegram and email"
            accent="saffron"
            href="/admin/reports"
            cta="View dispatch history"
            loading={initialLoading}
            unavailable={!initialLoading && dispatched === null}
          />
        </motion.div>

        <motion.div variants={reduce ? undefined : item} className="h-full">
          <MetricCard
            icon={HardDrive}
            label="Drive sync status"
            value={drivePct === null ? "—" : `${Math.round(drivePct)}%`}
            caption={`${fmt(santsWithDrive)} of ${fmt(santsTotal)} sants linked to a Drive folder`}
            accent="emerald"
            href="/admin/reports"
            cta="Check drive sync"
            loading={initialLoading}
            unavailable={!initialLoading && drivePct === null}
            progress={drivePct}
            chip={driveChip}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
