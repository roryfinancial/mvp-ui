// Shared Framer Motion animation constants

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
} as const;

export const fadeUpFast = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { duration: 0.2 },
} as const;

export const slideInLeft = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 },
} as const;

export const btnHover = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
} as const;

export function staggerFadeUp(index: number, baseDelay = 0, step = 0.07) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: baseDelay + index * step },
  } as const;
}

export function staggerSlideLeft(index: number, baseDelay = 0.3, step = 0.05) {
  return {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, delay: baseDelay + index * step },
  } as const;
}
