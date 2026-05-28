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
      <ul className="space-y-2">
        {steps.map((step, index) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
            className="flex items-start gap-3 px-2 py-2"
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
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : step.status === "in-progress" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    >
                      <CircleDotDashed className="h-5 w-5 text-teal-500" />
                    </motion.div>
                  ) : (
                    <Circle className="h-5 w-5 text-slate-200" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-[15px] font-bold leading-snug transition-colors duration-300 ${step.status === "completed"
                    ? "text-slate-400 line-through"
                    : step.status === "in-progress"
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
              >
                {step.title}
              </p>
              {step.status !== "pending" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs font-semibold text-slate-500 mt-1"
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
