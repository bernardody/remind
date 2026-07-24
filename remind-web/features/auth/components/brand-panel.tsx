"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Painel de marca do gate de autenticação (desktop). Único elemento
 * decorativo "grande" do fluxo de auth — o resto do login é funcional e
 * discreto (ver features/auth/components/login-form.tsx).
 */
export function AuthBrandPanel() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative hidden overflow-hidden bg-graphite px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-mist/10 blur-3xl"
      />

      <motion.span
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative text-lg font-extrabold tracking-tight"
      >
        ReMind
      </motion.span>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={
              shouldReduceMotion
                ? undefined
                : { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Image
              src="/brand/symbol-light.png"
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="max-w-sm"
        >
          <h1 className="text-3xl font-black leading-tight tracking-tight text-balance">
            Onde a escuta clínica encontra o dado.
          </h1>
          <p className="mt-4 text-base font-light leading-relaxed text-white/70">
            Avaliação de dependência digital com escalas psicométricas
            validadas, para psicólogos que levam evidência a sério.
          </p>
        </motion.div>
      </div>

      <p className="relative text-xs font-light text-white/40">
        © {new Date().getFullYear()} ReMind · Plataforma clínica
      </p>
    </div>
  );
}
