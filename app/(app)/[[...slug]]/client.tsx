"use client";

import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "@/src/contexts/AuthContext";
import App from "@/src/app/App";

export default function ClientApp() {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="rory-theme"
        disableTransitionOnChange={false}
      >
        {/* reducedMotion="user" makes framer-motion honor the OS setting — the
            CSS media query alone can't, since these animations are JS-driven. */}
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </MotionConfig>
      </ThemeProvider>
    </HelmetProvider>
  );
}
