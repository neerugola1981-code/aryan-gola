import React, { useState, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult: (result: { category: string; search: string; maxPrice: number | null; explanation: string }) => void;
}

export default function VoiceSearch({ isOpen, onClose, onVoiceResult }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for speech recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setError("Could not capture audio. Please select a sample query below or type your request.");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleSubmitVoiceText(text);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      setError("Speech Recognition is not supported on this browser browser version. Please use the options below!");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript("");
      setError(null);
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmitVoiceText = async (text: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products/voice-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceText: text })
      });
      const data = await res.json();
      if (res.ok) {
        onVoiceResult(data);
        onClose();
      } else {
        setError(data.error || "Failed to process voice intent.");
      }
    } catch (e) {
      setError("Server communications failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = (text: string) => {
    setTranscript(text);
    handleSubmitVoiceText(text);
  };

  const samples = [
    "Smartphones under ₹80,000",
    "Find premium active smartwatches",
    "Earbuds with active noise cancellation",
    "Vision laptops for creators",
    "Coupons and flash sale details"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 relative border border-neutral-100"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold mb-3">
            <Sparkles size={12} />
            AI Voice Recognition
          </div>
          <h3 className="text-xl font-bold text-neutral-900">What are you looking for?</h3>
          <p className="text-xs text-neutral-500 mt-1">Speak naturally to find products, categories, or price limits.</p>
        </div>

        {/* Pulse Button Container */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <>
                <motion.div 
                  animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute inset-0 bg-brand-400/30 rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
                  className="absolute inset-0 bg-brand-400/20 rounded-full"
                />
              </>
            )}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                isListening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-brand-500 hover:bg-brand-600 text-white"
              }`}
            >
              {isListening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>
          </div>

          <p className="mt-4 text-sm font-semibold text-neutral-800 h-6">
            {isListening ? "Listening... Speak now" : transcript ? `"${transcript}"` : "Tap to speak"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs text-center mb-4 leading-relaxed">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-600 font-medium my-4">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Analyzing voice query with VisionAI...
          </div>
        )}

        {/* Custom manual transcription fallback */}
        <div className="border-t border-neutral-100 pt-4">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 text-center">Or click a sample voice search</p>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
            {samples.map((sample, i) => (
              <button
                key={i}
                onClick={() => handleSampleClick(sample)}
                className="flex items-center justify-between px-3 py-2 text-left text-xs text-neutral-600 hover:text-brand-700 bg-neutral-50 hover:bg-brand-50/50 border border-neutral-100 hover:border-brand-100 rounded-xl transition-all font-medium"
              >
                <span>{sample}</span>
                <CornerDownLeft size={12} className="text-neutral-400" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
