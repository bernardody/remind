import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  symbolSize?: number;
  /** Esconde o wordmark, mostrando só o símbolo. */
  symbolOnly?: boolean;
}

export function Logo({
  className,
  textClassName,
  symbolSize = 30,
  symbolOnly = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/symbol-color.png"
        alt="ReMind"
        width={symbolSize}
        height={symbolSize}
        className="h-auto w-auto object-contain"
        style={{ width: symbolSize, height: symbolSize }}
        priority
      />
      {!symbolOnly && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight text-primary",
            textClassName,
          )}
        >
          ReMind
        </span>
      )}
    </span>
  );
}
