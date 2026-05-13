import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  tone,
  isDarkMode,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-3.5",
        isDarkMode
          ? "border-white/10 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-[#dccab3] bg-[#fffdf9] shadow-[0_16px_34px_-28px_rgba(36,23,12,0.3)]",
      )}
    >
      <div className="mb-2.5 flex items-center gap-3">
        <div className={cn("h-2 w-10 rounded-full", tone)} />
        <p className={cn("text-sm", isDarkMode ? "text-slate-300" : "text-stone-700")}>
          {label}
        </p>
      </div>
      <p
        className={cn(
          "text-[1.85rem] font-semibold tracking-tight",
          isDarkMode ? "text-slate-50" : "text-slate-950",
        )}
      >
        {value}
      </p>
      <p className={cn("mt-2 text-sm", isDarkMode ? "text-slate-400" : "text-stone-600")}>
        {detail}
      </p>
    </div>
  );
}
