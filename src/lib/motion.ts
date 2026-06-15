import type { Transition, Variants } from "framer-motion";

export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: easeOut } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: easeOut } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.12, ease: easeOut } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { delayChildren: 0.04, staggerChildren: 0.04 },
  },
};

export const tap = { scale: 0.96 } as const;
export const hoverLift = { y: -2 } as const;
