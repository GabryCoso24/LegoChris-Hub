import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "orange" | "amber";
  animate?: boolean;
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-96 h-96",
  xl: "w-[500px] h-[500px]",
};

export function GlowOrb({
  className,
  size = "md",
  color = "orange",
  animate = true,
}: GlowOrbProps) {
  return (
    <div
      className={cn(
        "absolute rounded-full blur-[100px] pointer-events-none",
        sizeClasses[size],
        color === "orange"
          ? "bg-primary/30"
          : "bg-accent/30",
        animate && "animate-glow-pulse",
        className
      )}
    />
  );
}
