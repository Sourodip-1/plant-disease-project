"use client"

import * as React from "react"
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface ImageGenerationProps {
  /** The image (or any content) to reveal */
  children: React.ReactNode;
  /**
   * Set to true when the external process has finished.
   * While false the blur stays fully on — the image stays hidden.
   * When switched to true the blur animates away to reveal the image.
   */
  isComplete?: boolean;
  /**
   * Progress of the generation/analysis process from 0 to 1.
   */
  progress?: number;
}

export const ImageGeneration = ({ children, isComplete = false, progress = 0 }: ImageGenerationProps) => {
  const shimmerTexts = [
    "Analyzing leaf structure…",
    "Scanning for pathogens…",
    "Mapping disease patterns…",
    "Processing visual data…",
  ];
  const [shimmerIdx, setShimmerIdx] = React.useState(0);

  // Cycle through shimmer label text while loading
  React.useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setShimmerIdx((i) => (i + 1) % shimmerTexts.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("flex flex-col gap-3 w-full")}>

      {/* Shimmer status label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={isComplete ? "done" : shimmerIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="text-sm font-bold"
          style={{
            background: isComplete
              ? "linear-gradient(110deg, #0f172a 0%, #334155 50%, #0f172a 100%)"
              : "linear-gradient(110deg, #14b8a6 0%, #14b8a6 30%, #334155 50%, #14b8a6 70%, #14b8a6 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {isComplete ? "Analysis complete." : shimmerTexts[shimmerIdx]}
        </motion.span>
      </AnimatePresence>

      {/* Image box — square, with blur overlay */}
      <div
        className="relative w-full rounded-2xl border border-slate-200 shadow-md overflow-hidden bg-slate-100"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Actual image — always behind */}
        <div className="absolute inset-0">
          {children}
        </div>

        {/* Blur overlay — slides down and refines slowly as progress increases */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.4)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, white 48px)",
            maskImage: "linear-gradient(to bottom, transparent 0%, white 48px)",
          }}
          animate={(isComplete ? {
            y: "100%",
            opacity: 0,
            backdropFilter: "blur(0px)",
            WebkitBackdropFilter: "blur(0px)",
          } : {
            y: `${progress * 85}%`, // slide down up to 85% during loading, then 100% on complete
            opacity: 1,
            backdropFilter: `blur(${Math.max(6, 24 - progress * 18)}px)`,
            WebkitBackdropFilter: `blur(${Math.max(6, 24 - progress * 18)}px)`,
          }) as any}
          transition={({
            y: { type: "spring", stiffness: 35, damping: 12 },
            opacity: { duration: 0.6 },
            backdropFilter: { duration: 0.6 },
            WebkitBackdropFilter: { duration: 0.6 },
          }) as any}
        />
      </div>
    </div>
  );
};
