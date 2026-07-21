"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MotionBlockProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  preserveOpacity?: boolean;
};

export function MotionReveal({
  children,
  className,
  delay = 0,
  preserveOpacity = false,
}: MotionBlockProps) {
  const reduceMotion = useReducedMotion();
  const initialState = preserveOpacity ? { y: 12 } : { opacity: 0, y: 18 };
  const visibleState = preserveOpacity ? { y: 0 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : initialState}
      whileInView={reduceMotion ? undefined : visibleState}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.48, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function MotionLine({ children, className, delay = 0 }: MotionBlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
