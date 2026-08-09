import logo from "@/assets/smartag-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Logo SMAR TAG"
      className={cn("h-10 w-10 rounded-xl object-cover", className)}
    />
  );
}

export function BrandLockup({
  className,
  subtitle = "CONTENT HUB",
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-[0.22em] text-foreground">SMAR TAG</p>
        <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
