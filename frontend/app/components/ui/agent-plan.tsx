"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  CircleDotDashed,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DiagnosisStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
}

interface AgentPlanProps {
  steps: DiagnosisStep[];
}

export default function AgentPlan({ steps }: AgentPlanProps) {
  return (
    <div className="w-full">
      <ul className="space-y-1">
        {steps.map((step, index) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="flex items-start gap-3 px-1 py-1.5"
          >
            {/* Status Icon */}
            <div className="mt-0.5 flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.status}
                  initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : step.status === "in-progress" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    >
                      <CircleDotDashed className="h-4 w-4 text-teal-400" />
                    </motion.div>
                  ) : (
                    <Circle className="h-4 w-4 text-white/20" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium leading-snug transition-colors duration-300 ${
                  step.status === "completed"
                    ? "text-white/50 line-through"
                    : step.status === "in-progress"
                    ? "text-white"
                    : "text-white/30"
                }`}
              >
                {step.title}
              </p>
              {step.status !== "pending" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-white/40 mt-0.5"
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
