"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp, X, ImageIcon, Leaf, Sprout, FlaskConical, CloudSun, Microscope, FileSearch, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  "Apple",
  "Chili",
  "Citrus",
  "Cucumber",
  "Grape",
  "Melon",
  "Potato",
  "Tomato"
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
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-30">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Leaf size={36} className="text-teal-400" />
        </motion.div>
        <p className="text-xs text-white/50 tracking-widest uppercase">Analysing</p>
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
      className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Uploaded plant leaf" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/70 bg-black/40 rounded-xl px-3 py-1.5 backdrop-blur-sm">
        <ImageIcon size={12} /> Uploaded image
      </div>
    </motion.div>
  );
}

// ─── Diagnosis result card ────────────────────────────────────────────────────
function DiagnosisResult({ result, imageUrl }: { result: ApiResult; imageUrl: string }) {
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

        {/* LEFT – image + weather stacked */}
        <div className="flex flex-col gap-4">
          <ResultImagePanel src={imageUrl} />

          {/* Weather card */}
          {result.weather && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><CloudSun size={14} className="text-cyan-400" />Live Weather</h3>
              <div className="grid grid-cols-2 gap-2">
                {result.weather.temperature != null && (
                  <div className="rounded-xl bg-white/4 px-3 py-2">
                    <p className="text-xs text-white/40">Temperature</p>
                    <p className="text-lg font-bold">
                      {typeof result.weather.temperature === "number"
                        ? result.weather.temperature.toFixed(1)
                        : result.weather.temperature}°C
                    </p>
                  </div>
                )}
                {result.weather.humidity != null && (
                  <div className="rounded-xl bg-white/4 px-3 py-2">
                    <p className="text-xs text-white/40">Humidity</p>
                    <p className="text-lg font-bold">
                      {typeof result.weather.humidity === "number"
                        ? Math.round(result.weather.humidity)
                        : result.weather.humidity}%
                    </p>
                  </div>
                )}
                {result.weather.rainfall != null && (
                  <div className="rounded-xl bg-white/4 px-3 py-2">
                    <p className="text-xs text-white/40">Rainfall</p>
                    <p className="text-lg font-bold">
                      {typeof result.weather.rainfall === "number"
                        ? result.weather.rainfall.toFixed(1)
                        : result.weather.rainfall}mm
                    </p>
                  </div>
                )}
                {result.weather.description && (
                  <div className="rounded-xl bg-white/4 px-3 py-2 col-span-2">
                    <p className="text-xs text-white/40">Condition</p>
                    <p className="text-sm font-medium capitalize">{result.weather.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Probabilities */}
          {probabilities.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><FlaskConical size={14} className="text-teal-400" />Disease Probabilities</h3>
              <div className="space-y-3">
                {probabilities.slice(0, 4).map(({ label, confidence }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>{label}</span>
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
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
          <div className="rounded-2xl border border-teal-500/25 bg-teal-500/8 px-5 py-4">
            <p className="text-xs text-teal-400/60 uppercase tracking-widest mb-1">Final Diagnosis</p>
            <h2 className="text-3xl font-bold text-teal-300 leading-tight">{result.diagnosis}</h2>
            {result.confidence != null && (
              <p className="text-sm text-white/50 mt-1">{Math.round(result.confidence * 100)}% confidence · {result.plant_type} · {result.location}</p>
            )}
          </div>

          {/* Symptoms */}
          {result.symptoms?.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><Microscope size={14} className="text-emerald-400" />Symptoms Detected</h3>
              <div className="flex flex-wrap gap-2">
                {result.symptoms.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Treatment */}
          {result.treatment?.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><Sprout size={14} className="text-lime-400" />Treatment & Recovery</h3>
              <ul className="space-y-2">
                {result.treatment.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-2 text-sm text-white/70"
                  >
                    <span className="text-lime-400 mt-0.5 flex-shrink-0">•</span>
                    {t}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Explanation */}
          {result.ai_explanation && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2"><FileSearch size={14} className="text-violet-400" />AI Explanation</h3>
              <p className="text-sm text-white/60 leading-relaxed">{result.ai_explanation}</p>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}


// ─── Thinking progress panel ──────────────────────────────────────────────────
function ThinkingPanel({ steps, imageUrl, isComplete }: { steps: DiagnosisStep[]; imageUrl: string; isComplete: boolean }) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = steps.length > 0 ? completedCount / steps.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 w-full"
    >
      {/* left — image with controlled blur reveal */}
      <div className="w-full">
        <ImageGeneration isComplete={isComplete} progress={progress}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
        </ImageGeneration>
      </div>

      {/* right — steps */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm px-5 py-5">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Zap size={14} className="text-teal-400" />
          </motion.div>
          <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">Analysing</p>
        </div>
        <AgentPlan steps={steps} />
      </div>
    </motion.div>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [message, setMessage] = useState("");
  const [plantType, setPlantType] = useState("Tomato");
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
    if (!imageFile) return;

    const finalLocation = location.trim() || "Unknown Location";
    setAppState("thinking");
    setResult(null);
    setErrorMsg("");

    // Start step animation; API call runs in parallel
    let apiFinished = false;
    let apiData: ApiResult | null = null;
    let apiError = "";

    // Kick off steps
    runStepAnimation(() => {
      if (apiFinished) {
        if (apiError) {
          setErrorMsg(apiError);
          setAppState("error");
        } else {
          setResult(apiData);
          setAppState("done");
        }
      }
    });

    // Kick off real API call simultaneously
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("plant_type", plantType.toLowerCase());
    formData.append("location", finalLocation);

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
            weather: weather
          }),
        });
        
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          if (aiJson.status === "success" && aiJson.data) {
             generatedDetails = {
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
        diagnosis: data.diagnosis || "Unknown Disease",
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
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAppState("idle");
      setResult(null);
    }
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAppState("idle");
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !!imageFile && appState !== "thinking";

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-black text-white flex flex-col w-full">

      {/* ── BACKGROUND ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
      {/* plus grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="grid grid-cols-[repeat(24,1fr)] h-full w-full opacity-40">
          {Array.from({ length: 480 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center text-[18px] text-teal-950/40">+</div>
          ))}
        </div>
      </div>
      {/* noise */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/8 backdrop-blur-sm">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none outline-none p-0 text-white"
        >
          <span className="font-semibold text-sm tracking-wide">PlantMD</span>
        </button>
        <p className="text-xs text-white/30 hidden sm:block">AI-powered crop disease detection</p>
      </header>

      {/* ── SCROLL AREA ──────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col w-full">
        <div
          className="flex-1 overflow-y-auto px-4 py-8 w-full"
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
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-3">
                    Plant Disease<br />Diagnosis
                  </h1>
                  <p className="text-blue-400/70 tracking-[0.15em] uppercase text-xs mb-4">
                    AI-powered crop health assistant
                  </p>
                  <p className="text-white/40 max-w-md text-base leading-relaxed">
                    Attach a leaf photo below, select your plant type and location, then hit send to get an instant AI diagnosis.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── THINKING STATE ──────────────────── */}
            <AnimatePresence>
              {appState === "thinking" && imagePreview && (
                <ThinkingPanel key="thinking" steps={steps} imageUrl={imagePreview} isComplete={false} />
              )}
            </AnimatePresence>

            {/* ── RESULT STATE ────────────────────── */}
            <AnimatePresence>
              {appState === "done" && result && imagePreview && (
                <DiagnosisResult key="result" result={result} imageUrl={imagePreview} />
              )}
            </AnimatePresence>

            {/* ── ERROR STATE ─────────────────────── */}
            <AnimatePresence>
              {appState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-5 text-center"
                >
                  <p className="text-blue-400 font-semibold mb-1">Diagnosis failed</p>
                  <p className="text-sm text-white/50">{errorMsg}</p>
                  <button
                    onClick={() => setAppState("idle")}
                    className="mt-4 text-xs px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
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
                className="flex flex-col sm:flex-row gap-2 mb-2"
              >
                <select
                  value={plantType}
                  onChange={(e) => setPlantType(e.target.value)}
                  className="flex-1 rounded-xl bg-white/6 border border-white/12 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500/50 transition"
                >
                  {PLANT_OPTIONS.map((p) => <option key={p} className="bg-black">{p}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Location (e.g. Asansol, India)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 rounded-xl bg-white/6 border border-white/12 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-teal-500/50 transition"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat box */}
          <div className="rounded-[20px] border border-white/12 bg-white/6 backdrop-blur-xl shadow-2xl px-4 py-3 flex flex-col gap-2">

            {/* Image preview + options inline (shown inside box if image IS uploaded) */}
            <AnimatePresence>
              {imageFile && appState === "idle" && imagePreview && (
                <motion.div
                  key="previewchip"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 w-full bg-white/2 rounded-xl p-2 border border-white/5"
                >
                  {/* Image preview */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/15 shadow-md flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Selected" className="w-full h-full object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1 hover:bg-neutral-800 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  {/* Inline options beside the image */}
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase px-1">Plant Type</label>
                      <select
                        value={plantType}
                        onChange={(e) => setPlantType(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-teal-500/50 transition"
                      >
                        {PLANT_OPTIONS.map((p) => <option key={p} className="bg-black">{p}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase px-1">Location</label>
                      <input
                        type="text"
                        placeholder="Location (e.g. Asansol, India)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-teal-500/50 transition"
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
              rows={2}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none leading-relaxed"
            />

            {/* Bottom action row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">

                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Attach photo */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach leaf image"
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${imageFile ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "hover:bg-white/10 text-white/50"
                    }`}
                >
                  {imageFile ? <ImageIcon size={17} /> : <Paperclip size={17} />}
                </motion.button>

                {/* Options toggle */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.08 }}
                  onClick={() => setShowOptions((v) => !v)}
                  title="Set plant type & location"
                  className={`h-9 rounded-xl px-3 flex items-center gap-1.5 text-xs transition-colors ${(showOptions && !imageFile) ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "hover:bg-white/10 text-white/40"
                    }`}
                >
                  <Sprout size={14} />
                  <span>{plantType}</span>
                </motion.button>

              </div>

              {/* Send */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={canSend ? { scale: 1.06 } : {}}
                onClick={handleSend}
                disabled={!canSend}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 ${canSend
                  ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/25"
                  : "bg-white/8 text-white/20 cursor-not-allowed"
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
                  <ArrowUp size={16} />
                )}
              </motion.button>
            </div>
          </div>

          <p className="text-center text-xs text-white/20 mt-2">
            PlantMD · Powered by deep learning + live weather data
          </p>
        </div>
      </div>
    </main>
  );
}