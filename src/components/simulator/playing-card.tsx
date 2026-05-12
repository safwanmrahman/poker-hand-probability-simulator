import { cn } from "@/lib/utils";

export function PlayingCard({
  value,
  caption,
  accent,
  active = false,
  filled = false,
  isDarkMode = false,
}: {
  value: string;
  caption: string;
  accent?: string;
  active?: boolean;
  filled?: boolean;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-24 w-[4.7rem] flex-col justify-between overflow-hidden rounded-[1.35rem] border px-3 py-3 text-left transition-all sm:h-28 sm:w-[5.1rem]",
        filled
          ? isDarkMode
            ? "border-white/12 bg-[linear-gradient(180deg,rgba(17,30,39,0.96),rgba(8,16,23,0.98))] text-slate-100 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.65)]"
            : "border-[#d8cab6] bg-[linear-gradient(180deg,#fffefb,#f7efe3)] text-slate-950 shadow-[0_14px_24px_-22px_rgba(44,28,16,0.28)]"
          : isDarkMode
            ? "border-white/10 bg-slate-950/70 text-slate-300"
            : "border-[#ded1bf] bg-[#fbf6ef] text-slate-700",
        active
          ? "translate-y-[-1px] border-primary ring-2 ring-primary/25"
          : "",
      )}
    >
      <span
        className={cn(
          "text-base font-semibold tracking-[0.18em]",
          !accent && isDarkMode ? "text-slate-100" : "",
          accent ?? "",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.22em]",
          isDarkMode ? "text-slate-400" : "text-stone-500",
        )}
      >
        {caption}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-3 top-2 h-px",
          isDarkMode ? "bg-white/8" : "bg-black/6",
        )}
      />
    </div>
  );
}
