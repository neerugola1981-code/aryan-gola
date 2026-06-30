import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "chat-1", sender: "bot", text: "Hello! I am VisionAI, your premium shopping co-pilot. Ask me anything about our Titanium flagship phones, creator laptops, or dynamic coupon codes!", timestamp: "Just now" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const chatPayload = {
        messages: [...messages, userMsg].map(m => ({ sender: m.sender, text: m.text }))
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload)
      });
      const data = await res.json();
      
      setIsTyping(false);
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error();
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: "bot-err",
        sender: "bot",
        text: "I experienced a minor network signal dropout. Let me remind you that we support BHIM/UPI payments and offer a hassle-free 7-day return policy!",
        timestamp: "Now"
      }]);
    }
  };

  const handleSuggestionClick = (query: string) => {
    handleSendMessage(query);
  };

  const suggestions = [
    "What coupons are active?",
    "Tell me about Vision Pro Max",
    "Return policy details"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="bg-white rounded-3xl shadow-2xl border border-neutral-150 w-80 md:w-96 h-[480px] overflow-hidden flex flex-col mb-4 text-neutral-850"
          >
            {/* Chat Header */}
            <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-500/20 text-brand-400 rounded-xl">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight">VisionAI Customer Support</h4>
                  <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Always online (Gemini Active)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Logs viewport */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 scroll-smooth">
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-neutral-900 text-white rounded-tr-none' 
                      : 'bg-white text-neutral-800 border border-neutral-150 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="font-medium whitespace-pre-line">{m.text}</p>
                    <span className="text-[8px] text-neutral-400 block mt-1 text-right font-semibold">{m.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-150 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion tags */}
            {messages.length < 3 && !isTyping && (
              <div className="px-4 py-2 border-t border-neutral-100 flex gap-1.5 overflow-x-auto shrink-0 bg-neutral-50/50">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-2.5 py-1 bg-white hover:bg-brand-50 border border-neutral-150 hover:border-brand-100 rounded-xl text-[10px] text-neutral-600 hover:text-brand-700 transition-all font-semibold shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Inputs Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="p-3 border-t border-neutral-100 flex gap-2 items-center bg-white shrink-0"
            >
              <input
                type="text"
                placeholder="Ask VisionAI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-all shadow"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-[0_8px_30px_rgb(139,92,246,0.3)] hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <MessageSquare size={24} className="animate-pulse" />
      </button>
    </div>
  );
}
