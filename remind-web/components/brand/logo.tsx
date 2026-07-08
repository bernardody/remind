import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  symbolSize?: number;
  /** Esconde o wordmark, mostrando só o símbolo. */
  symbolOnly?: boolean;
  /**
   * Variação da marca (id.md §3): "default" para fundo claro (Branco Neve),
   * "dark" para fundo escuro (Grafite Verde / Ciano Escuro) — símbolo e
   * texto em branco.
   */
  variant?: "default" | "dark";
}

export function Logo({
  className,
  textClassName,
  symbolSize = 30,
  symbolOnly = false,
  variant = "default",
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={
          variant === "dark"
            ? "/brand/symbol-light.png"
            : "/brand/symbol-color.png"
        }
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
            "text-xl font-extrabold tracking-tight",
            variant === "dark" ? "text-white" : "text-primary",
            textClassName,
          )}
        >
          ReMind
        </span>
      )}
    </span>
  );
}
