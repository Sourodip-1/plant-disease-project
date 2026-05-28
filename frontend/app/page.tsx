"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp, X, ImageIcon, Leaf, Sprout, FlaskConical, CloudSun, Microscope, FileSearch, Zap, ChevronDown, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AgentPlan, { DiagnosisStep } from "./components/ui/agent-plan";
import { ImageGeneration } from "./components/ui/ai-chat-image-generation-1";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiResult {
  status: string;
  plant_type: string;
  location: string;
  diagnosis: string;
  confidence: number;
  symptoms: string[];
  treatment: string[];
  weather?: {
    temperature?: number;
    humidity?: number;
    description?: string;
    rainfall?: number;
  };
  ai_explanation?: string;
  probabilities?: Array<{ label: string; confidence: number }>;
}

type AppState = "idle" | "thinking" | "done" | "error";

// ─── Plant options ─────────────────────────────────────────────────────────────
const PLANT_OPTIONS = [
  "Unknown",
  "Apple",
  "Chili",
  "Citrus",
  "Cucumber",
  "Grape",
  "Melon",
  "Potato",
  "Tomato",
];

// ─── Diagnosis steps that animate during thinking ──────────────────────────────
function buildSteps(): DiagnosisStep[] {
  return [
    { id: "1", title: "Uploading image", description: "Sending leaf image to model server…", status: "pending" },
    { id: "2", title: "Running disease classifier", description: "Deep-learning model scanning for pathogens…", status: "pending" },
    { id: "3", title: "Fetching live weather data", description: "Pulling local climate & moisture readings…", status: "pending" },
    { id: "4", title: "Mapping symptom patterns", description: "Correlating visual cues with disease library…", status: "pending" },
    { id: "5", title: "Generating treatment plan", description: "Composing personalised recovery recommendations…", status: "pending" },
    { id: "6", title: "Finalising diagnosis report", description: "Packaging results for display…", status: "pending" },
  ];
}

// ─── Animated shimmering image placeholder ───────────────────────────────────
function ImageSkeleton() {
  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-60">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Leaf size={36} className="text-teal-500" />
        </motion.div>
        <p className="text-xs text-slate-500 tracking-widest uppercase font-medium">Analysing</p>
      </div>
    </div>
  );
}

// ─── Result image panel ───────────────────────────────────────────────────────
function ResultImagePanel({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] }}
      className="relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Uploaded plant leaf" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 bg-black/40 rounded-xl px-3 py-1.5 backdrop-blur-sm font-medium">
        <ImageIcon size={12} /> Uploaded image
      </div>
    </motion.div>
  );
}

// ─── Diagnosis result card ────────────────────────────────────────────────────
function DiagnosisResult({ result, imageUrl, isTextQuery, query }: { result: ApiResult; imageUrl: string; isTextQuery?: boolean; query?: string }) {
  const probabilities = result.probabilities ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] }}
      className="w-full"
    >
      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* LEFT – image/query + weather stacked */}
        <div className="flex flex-col gap-4">
          {isTextQuery ? (
           <div className="w-full aspect-square flex flex-col justify-center items-center bg-teal-50 rounded-2xl border border-teal-200 shadow-sm p-6 text-center">
             <FileSearch size={32} className="text-teal-500 mb-4" />
             <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Text Query Analysis</p>
             <p className="text-teal-900 italic font-medium text-sm line-clamp-6">"{query}"</p>
           </div>
          ) : (
            <ResultImagePanel src={imageUrl} />
          )}

          {/* Weather card */}
          {result.weather && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><CloudSun size={14} className="text-cyan-500" />Live Weather</h3>
              <div className="grid grid-cols-2 gap-2">
                {result.weather.temperature != null && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-500 font-medium">Temperature</p>
                    <p className="text-lg font-bold text-slate-800">
                      {typeof result.weather.temperature === "number"
                        ? result.weather.temperature.toFixed(1)
                        : result.weather.temperature}°C
                    </p>
                  </div>
                )}
                {result.weather.humidity != null && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-500 font-medium">Humidity</p>
                    <p className="text-lg font-bold text-slate-800">
                      {typeof result.weather.humidity === "number"
                        ? Math.round(result.weather.humidity)
                        : result.weather.humidity}%
                    </p>
                  </div>
                )}
                {result.weather.rainfall != null && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-500 font-medium">Rainfall</p>
                    <p className="text-lg font-bold text-slate-800">
                      {typeof result.weather.rainfall === "number"
                        ? result.weather.rainfall.toFixed(1)
                        : result.weather.rainfall}mm
                    </p>
                  </div>
                )}
                {result.weather.description && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 col-span-2">
                    <p className="text-xs text-slate-500 font-medium">Condition</p>
                    <p className="text-sm font-semibold text-slate-700 capitalize">{result.weather.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Probabilities */}
          {probabilities.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FlaskConical size={14} className="text-teal-500" />Disease Probabilities</h3>
              <div className="space-y-3">
                {probabilities.slice(0, 4).map(({ label, confidence }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-600 font-medium mb-1.5">
                      <span>{label}</span>
                      <span className="text-slate-800 font-semibold">{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(confidence * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT – diagnosis details */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Disease headline */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5 shadow-sm">
            <p className="text-xs text-teal-600/80 font-bold uppercase tracking-widest mb-1.5">Final Diagnosis</p>
            <h2 className="text-3xl font-extrabold text-teal-900 leading-tight">{result.diagnosis}</h2>
            {result.confidence != null && (
              <p className="text-sm text-teal-700 mt-2 font-medium">
                {Math.round(result.confidence * 100)}% confidence · {result.plant_type} · {result.location}
              </p>
            )}
          </div>

          {/* Symptoms */}
          {result.symptoms?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Microscope size={16} className="text-emerald-500" />Symptoms Detected</h3>
              <div className="flex flex-wrap gap-2">
                {result.symptoms.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-sm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Treatment */}
          {result.treatment?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Sprout size={16} className="text-lime-600" />Treatment & Recovery</h3>
              <ul className="space-y-3">
                {result.treatment.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 text-sm text-slate-700 font-medium"
                  >
                    <span className="text-lime-500 mt-0.5 flex-shrink-0"><CheckCircleIcon /></span>
                    <span className="leading-relaxed">{t}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Explanation */}
          {result.ai_explanation && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileSearch size={16} className="text-violet-500" />AI Explanation</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.ai_explanation}</p>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}


// ─── Thinking progress panel ──────────────────────────────────────────────────
function ThinkingPanel({ steps, imageUrl, isComplete, isTextQuery, query }: { steps: DiagnosisStep[]; imageUrl: string; isComplete: boolean; isTextQuery?: boolean; query?: string }) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = steps.length > 0 ? completedCount / steps.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 w-full"
    >
      {/* left — image with controlled blur reveal OR text query placeholder */}
      <div className="w-full">
        {isTextQuery ? (
           <div className="w-full aspect-square flex flex-col justify-center items-center bg-slate-100 rounded-2xl border border-slate-200 shadow-inner p-6 text-center">
             <FileSearch size={32} className="text-teal-400 mb-4" />
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Analyzing Text Query</p>
             <p className="text-slate-700 italic font-medium text-sm line-clamp-4">"{query}"</p>
           </div>
        ) : (
          <ImageGeneration isComplete={isComplete} progress={progress}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
          </ImageGeneration>
        )}
      </div>

      {/* right — steps */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-6">
        <div className="flex items-center gap-2 mb-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Zap size={16} className="text-teal-500" />
          </motion.div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Analysing</p>
        </div>
        <AgentPlan steps={steps} />
      </div>
    </motion.div>
  );
}


// ─── Custom Select Dropdown Component ──────────────────────────────────────────
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  className?: string;
  size?: "sm" | "md";
}

function CustomSelect({ value, onChange, options, className, size = "md" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border border-slate-200 text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition shadow-sm cursor-pointer",
          size === "sm" ? "px-3 py-2 text-xs font-semibold rounded-lg" : "px-4 py-3 text-sm font-medium rounded-xl"
        )}
      >
        <span>{value}</span>
        <ChevronDown size={size === "sm" ? 14 : 16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-full bottom-full mb-1.5 bg-white border border-slate-200/80 shadow-lg max-h-60 overflow-y-auto no-scrollbar py-1",
              size === "sm" ? "rounded-lg" : "rounded-xl"
            )}
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left transition-colors font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 flex items-center justify-between cursor-pointer",
                  size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
                  value === opt && "bg-teal-50/50 text-teal-600 font-bold"
                )}
              >
                <span>{opt}</span>
                {value === opt && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [message, setMessage] = useState("");
  const [plantType, setPlantType] = useState("Unknown");
  const [location, setLocation] = useState("");

  const handleReset = () => {
    setAppState("idle");
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setMessage("");
    setLocation("");
  };
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isTextQuery, setIsTextQuery] = useState(false);
  const [appState, setAppState] = useState<AppState>("idle");
  const [steps, setSteps] = useState<DiagnosisStep[]>([]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const HF_URL = "https://sourodip2007-plant-disease-detection.hf.space";

  // Warm up the Hugging Face Space on mount to reduce cold-start delay
  useEffect(() => {
    fetch(`${HF_URL}/`)
      .catch(err => console.log("Warmup ping failed:", err));
  }, []);

  // Global paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setAppState("idle");
            setResult(null);
            setTimeout(() => textareaRef.current?.focus(), 50);
            e.preventDefault();
            break;
          }
        }
      }
    };
    
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Animate steps sequentially with a given ms-per-step then call callback
  const runStepAnimation = useCallback((onDone: () => void) => {
    const fresh = buildSteps();
    setSteps(fresh);

    let idx = 0;
    // Mark first as in-progress immediately
    setSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: "in-progress" } : s));

    const interval = setInterval(() => {
      idx += 1;
      if (idx >= fresh.length) {
        clearInterval(interval);
        // Mark all done
        setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
        setTimeout(onDone, 300);
        return;
      }
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i < idx) return { ...s, status: "completed" };
          if (i === idx) return { ...s, status: "in-progress" };
          return s;
        })
      );
    }, 900);

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (appState === "thinking") return;

    let currentImageFile = imageFile;
    let currentPlantType = plantType;
    let currentLocation = location;
    let extractedFeatures = "";
    let isTextOnly = false;

    if (!currentImageFile) {
      if (!message.trim()) {
        // Trigger file upload if neither image nor message is present
        fileInputRef.current?.click();
        return;
      }
      
      isTextOnly = true;
      setIsTextQuery(true);
      
      // Create a dummy 1x1 image for the API
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, 0, 1, 1);
      }
      
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg"));
      if (blob) {
        currentImageFile = new File([blob], "dummy.jpg", { type: "image/jpeg" });
      }

      // Extract features using LLM
      try {
        const extRes = await fetch("/api/extract-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: message })
        });
        if (extRes.ok) {
          const extJson = await extRes.json();
          if (extJson.status === "success" && extJson.data) {
            if (extJson.data.plant_type && extJson.data.plant_type !== "Unknown") {
               currentPlantType = extJson.data.plant_type;
            }
            if (extJson.data.location && extJson.data.location !== "Unknown") {
               currentLocation = extJson.data.location;
            }
            extractedFeatures = extJson.data.features || message;
          }
        }
      } catch (err) {
        console.error("Failed to extract features", err);
        extractedFeatures = message;
      }
    }

    const finalLocation = currentLocation.trim() || "Unknown Location";
    setAppState("thinking");
    setResult(null);
    setErrorMsg("");

    // Start step animation; API call runs in parallel
    let apiFinished = false;
    let animFinished = false;
    let apiData: ApiResult | null = null;
    let apiError = "";

    const checkDone = () => {
      if (apiFinished && animFinished) {
        if (apiError) {
          setErrorMsg(apiError);
          setAppState("error");
        } else {
          setResult(apiData);
          setAppState("done");
        }
      }
    };

    // Kick off steps
    runStepAnimation(() => {
      animFinished = true;
      checkDone();
    });

    // Kick off real API call simultaneously
    const formData = new FormData();
    formData.append("file", currentImageFile!);
    formData.append("plant_type", currentPlantType.toLowerCase());
    formData.append("location", finalLocation);
    if (extractedFeatures) {
      formData.append("features", extractedFeatures);
    }

    try {
      const res = await fetch(`${HF_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const rawJson = await res.json();

      const data = rawJson.data || {};
      const weather = data.weather || {};
      const symptomsObj = data.symptoms || {};
      const visionProbs = symptomsObj.vision_probabilities || {};

      // Step 2: Call the local API route to generate structured treatment/explanation using NVIDIA Llama
      let generatedDetails = {
        symptoms: symptomsObj.detected_physical_symptoms || ["Leaf spotting", "Discoloration", "Wilting"],
        treatment: ["Remove affected leaves", "Apply appropriate fungicide", "Monitor moisture levels"],
        ai_explanation: "The model detected visual patterns consistent with this pathogen."
      };

      try {
        const aiRes = await fetch("/api/generate-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plant_type: data.plant_type || plantType,
            location: data.location?.name || finalLocation,
            diagnosis: data.diagnosis || "Unknown Disease",
            weather: weather,
            user_query: isTextOnly ? (extractedFeatures || message) : undefined
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          if (aiJson.status === "success" && aiJson.data) {
            generatedDetails = {
              diagnosis: aiJson.data.diagnosis || generatedDetails.diagnosis,
              symptoms: aiJson.data.symptoms || generatedDetails.symptoms,
              treatment: aiJson.data.treatment || generatedDetails.treatment,
              ai_explanation: aiJson.data.ai_explanation || generatedDetails.ai_explanation
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch AI diagnosis details", err);
      }

      // Map the backend structure to the UI's expected structure
      apiData = {
        status: rawJson.status === "success" ? "success" : "error",
        plant_type: data.plant_type || plantType,
        location: data.location?.name || finalLocation,
        diagnosis: isTextOnly && generatedDetails.diagnosis ? generatedDetails.diagnosis : (data.diagnosis || "Unknown Disease"),
        confidence: 0.95,
        symptoms: generatedDetails.symptoms,
        treatment: generatedDetails.treatment,
        ai_explanation: generatedDetails.ai_explanation,
        probabilities: Object.entries(visionProbs).map(([label, conf]) => ({
          label,
          confidence: (conf as number) > 1 ? (conf as number) / 100 : (conf as number)
        })).sort((a, b) => b.confidence - a.confidence),
        weather: {
          temperature: weather.temperature_c,
          humidity: weather.humidity_pct,
          rainfall: weather.rain_mm,
          description: `Soil Moisture: ${weather.soil_category || 'Unknown'}`
        }
      } as ApiResult;

      // Set the overall confidence based on the highest probability
      if (apiData.probabilities && apiData.probabilities.length > 0) {
        apiData.confidence = apiData.probabilities[0].confidence;
      } else {
        apiData.confidence = 0.95;
      }

    } catch (e: unknown) {
      if (e instanceof Error) {
        apiError = e.message;
      } else {
        apiError = "An unknown error occurred";
      }
    } finally {
      apiFinished = true;
      checkDone();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsTextQuery(false);
      setAppState("idle");
      setResult(null);
      // Auto-focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsTextQuery(false);
    setAppState("idle");
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (!!imageFile || message.trim().length > 0) && appState !== "thinking";

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-slate-50 text-slate-900 flex flex-col w-full selection:bg-teal-200">

      {/* ── BACKGROUND ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.04),transparent_50%)]" />
      {/* plus grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="grid grid-cols-[repeat(24,1fr)] h-full w-full opacity-40">
          {Array.from({ length: 480 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center text-[18px] text-slate-300">+</div>
          ))}
        </div>
      </div>
      {/* noise */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none outline-none p-0 text-slate-900"
        >
          <span className="font-extrabold text-sm tracking-wide flex items-center gap-2"><Leaf size={16} className="text-teal-500" /> PlantMD</span>
        </button>
        <p className="text-xs font-semibold text-slate-500 hidden sm:block">AI-powered crop disease detection</p>
      </header>

      {/* ── SCROLL AREA ──────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full">
        <div
          className="flex-1 overflow-y-auto no-scrollbar px-4 py-8 w-full"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 112px), transparent 100%)",
            maskImage: "linear-gradient(to bottom, black calc(100% - 112px), transparent 100%)"
          }}
        >
          <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Welcome — shown on idle */}
            <AnimatePresence>
              {appState === "idle" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center pt-16 pb-8"
                >
                  <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-slate-900">
                    Plant Disease<br />Diagnosis
                  </h1>
                  <p className="text-teal-600 font-bold tracking-[0.15em] uppercase text-xs mb-4">
                    AI-powered crop health assistant
                  </p>
                  <p className="text-slate-500 font-medium max-w-md text-base leading-relaxed">
                    Attach a leaf photo below, select your plant type and location, then hit send to get an instant AI diagnosis.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── THINKING STATE ──────────────────── */}
            <AnimatePresence>
              {appState === "thinking" && (imagePreview || isTextQuery) && (
                <ThinkingPanel key="thinking" steps={steps} imageUrl={imagePreview || ""} isComplete={false} isTextQuery={isTextQuery} query={message} />
              )}
            </AnimatePresence>

            {/* ── RESULT STATE ────────────────────── */}
            <AnimatePresence>
              {appState === "done" && result && (imagePreview || isTextQuery) && (
                <DiagnosisResult key="result" result={result} imageUrl={imagePreview || ""} isTextQuery={isTextQuery} query={message} />
              )}
            </AnimatePresence>

            {/* ── ERROR STATE ─────────────────────── */}
            <AnimatePresence>
              {appState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center shadow-sm"
                >
                  <p className="text-red-600 font-bold mb-1">Diagnosis failed</p>
                  <p className="text-sm text-red-500 font-medium">{errorMsg}</p>
                  <button
                    onClick={() => setAppState("idle")}
                    className="mt-4 text-xs font-semibold px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-sm"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── CHAT INPUT BAR ───────────────────────────────────────── */}
      <div className="relative z-10 px-4 pb-6 pt-2 w-full">
        <div className="w-full max-w-5xl mx-auto">

          {/* Options row (plant type + location) - Only shown above box if NO image is uploaded */}
          <AnimatePresence>
            {showOptions && !imageFile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex flex-col sm:flex-row gap-3 mb-3"
              >
                <CustomSelect
                  value={plantType}
                  onChange={setPlantType}
                  options={PLANT_OPTIONS}
                  className="flex-1"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Asansol, India)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat box */}
          <div className="rounded-[24px] border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] px-4 py-3.5 flex flex-col gap-2">

            {/* Image preview + options inline (shown inside box if image IS uploaded) */}
            <AnimatePresence>
              {imageFile && appState === "idle" && imagePreview && (
                <motion.div
                  key="previewchip"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200 shadow-sm mb-2"
                >
                  {/* Image preview */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Selected" className="w-full h-full object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-white/90 text-slate-700 rounded-full p-1 hover:bg-white hover:text-red-500 transition shadow-sm backdrop-blur-md"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Inline options beside the image */}
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] text-teal-600 font-bold tracking-wider uppercase px-1">Plant Type</label>
                      <CustomSelect
                        value={plantType}
                        onChange={setPlantType}
                        options={PLANT_OPTIONS}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] text-teal-600 font-bold tracking-wider uppercase px-1">Location</label>
                      <input
                        type="text"
                        placeholder="Location (e.g. Asansol, India)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition shadow-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your plant's condition, or just attach a photo…"
              rows={1}
              className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none resize-none px-1 py-1"
            />

            {/* Bottom action row */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">

                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Hidden camera input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Attach photo */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach leaf image"
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${imageFile ? "bg-teal-50 text-teal-600 border border-teal-200 shadow-sm" : "hover:bg-slate-100 text-slate-500"
                    }`}
                >
                  {imageFile ? <ImageIcon size={18} /> : <Paperclip size={18} />}
                </motion.button>

                {/* Camera button (only if no image) */}
                {!imageFile && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => cameraInputRef.current?.click()}
                    title="Take photo"
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-500"
                  >
                    <Camera size={18} />
                  </motion.button>
                )}

                {/* Options toggle */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowOptions((v) => !v)}
                  title="Set plant type & location"
                  className={`h-10 rounded-xl px-4 flex items-center gap-2 text-sm font-semibold transition-colors ${(showOptions && !imageFile) ? "bg-teal-50 text-teal-600 border border-teal-200 shadow-sm" : "hover:bg-slate-100 text-slate-500"
                    }`}
                >
                  <Sprout size={16} />
                  <span>{plantType}</span>
                </motion.button>

              </div>

              {/* Send */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={canSend ? { scale: 1.05 } : {}}
                onClick={handleSend}
                disabled={!canSend}
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${canSend
                  ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/25"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
              >
                {appState === "thinking" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Zap size={16} />
                  </motion.div>
                ) : (
                  <ArrowUp size={18} />
                )}
              </motion.button>
            </div>
          </div>

          <p className="text-center text-xs font-semibold text-slate-400 mt-3">
            PlantMD · Powered by deep learning + live weather data
          </p>
        </div>
      </div>
    </main>
  );
}