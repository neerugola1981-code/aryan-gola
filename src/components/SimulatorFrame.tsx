import React, { useState, useEffect } from "react";
import { 
  Smartphone, Wifi, Battery, Signal, ArrowLeft, Download, 
  Smartphone as PhoneIcon, Check, Settings, Bell, X, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SimulatorFrameProps {
  children: React.ReactNode;
  activeMobileTab: string;
  setActiveMobileTab: (tab: string) => void;
  cartCount: number;
}

export default function SimulatorFrame({ children, activeMobileTab, setActiveMobileTab, cartCount }: SimulatorFrameProps) {
  const [time, setTime] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [showInstallOverlay, setShowInstallOverlay] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch occasional simulated push notification
  useEffect(() => {
    const notificationTimer = setTimeout(() => {
      triggerPushNotification("Vision AI Recommendations are ready for you! Try voice search now.");
    }, 15000);

    return () => clearTimeout(notificationTimer);
  }, []);

  const triggerPushNotification = (text: string) => {
    setShowNotification(text);
    // Simulate notification tone
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio context block is common, ignore gracefully
    }
    setTimeout(() => {
      setShowNotification(null);
    }, 6000);
  };

  const handleDownloadAPK = () => {
    setShowInstallOverlay(true);
  };

  const startApkInstall = () => {
    setIsInstalling(true);
    setInstallProgress(0);
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsInstalling(false);
          setIsInstalled(true);
          triggerPushNotification("Vision App (v1.0.apk) successfully installed!");
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const downloadApkFileDirectly = () => {
    // Generate a beautiful, small mock APK text file representing launcher metadata
    const element = document.createElement("a");
    const file = new Blob([
      "Vision Android APK Launcher v1.0\n" +
      "Package: com.vision.ecommerce\n" +
      "VersionCode: 100\n" +
      "MD5: c099021c6cff744568d9e8a9888411cc9\n" +
      "Host URL: " + window.location.origin + "\n\n" +
      "Thank you for trying Vision eCommerce! In production, this download package points to a " +
      "fully-compiled Flutter/React Native Android APK compiled for release architectures (ARM64/x86)."
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Vision_v1.0.apk";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 lg:p-4 w-full">
      {/* Simulator Actions Header */}
      <div className="flex items-center justify-between w-full max-w-[370px] mb-3 bg-neutral-900 text-white rounded-2xl p-3 border border-neutral-800 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-neutral-300">Android APK Emulator</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => triggerPushNotification("⚡ Limited flash discount WELCOME20 is live!")}
            title="Trigger push notification test"
            className="p-1 text-xs hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <Bell size={14} />
          </button>
          <button
            onClick={handleDownloadAPK}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download size={12} />
            <span>Install APK</span>
          </button>
        </div>
      </div>

      {/* Modern Phone Frame */}
      <div className="relative mx-auto w-[365px] h-[720px] bg-neutral-950 rounded-[50px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-[5px] border-neutral-800 select-none">
        {/* Dynamic Island / Punch Hole Camera */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-800" />
          <div className="w-1.5 h-1.5 bg-blue-900/60 rounded-full" />
        </div>

        {/* Physical hardware button simulation accents */}
        <div className="absolute -left-[9px] top-28 w-1 h-12 bg-neutral-800 rounded-l" />
        <div className="absolute -left-[9px] top-44 w-1 h-10 bg-neutral-800 rounded-l" />
        <div className="absolute -right-[9px] top-32 w-1 h-14 bg-neutral-800 rounded-r" />

        {/* Screen Area */}
        <div className="relative w-full h-full bg-neutral-50 rounded-[40px] overflow-hidden flex flex-col border border-neutral-900">
          
          {/* Simulated Mobile Push Notification Overlay */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: -80, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -80, scale: 0.95 }}
                className="absolute top-12 left-2 right-2 z-50 bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl flex gap-2.5 items-start border border-neutral-800"
              >
                <div className="p-1.5 bg-brand-500/20 rounded-xl text-brand-400 shrink-0">
                  <Smartphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">Vision Mobile</span>
                    <span className="text-[10px] text-neutral-500">Just Now</span>
                  </div>
                  <p className="text-xs font-medium text-white leading-relaxed truncate-2-lines mt-0.5">{showNotification}</p>
                </div>
                <button 
                  onClick={() => setShowNotification(null)}
                  className="p-0.5 text-neutral-400 hover:text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Android Status Bar */}
          <div className="h-8 bg-neutral-900 text-white flex items-center justify-between px-6 shrink-0 text-[11px] font-medium z-30 select-none">
            <span className="font-mono text-neutral-300">{time}</span>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="text-[9px] font-semibold text-neutral-400">5G</span>
              <Signal size={12} />
              <Wifi size={12} />
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono">92%</span>
                <Battery size={14} className="text-emerald-400 fill-emerald-400" />
              </div>
            </div>
          </div>

          {/* Main App Content inside Mobile Phone Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-neutral-50 flex flex-col relative">
            {children}
          </div>

          {/* Mobile Bottom Android Navigation Bar (Home, Back, Recents) */}
          <div className="h-6 bg-neutral-950 flex items-center justify-around px-8 shrink-0 select-none border-t border-neutral-900">
            <button className="text-neutral-500 hover:text-white transition-colors">
              <ArrowLeft size={12} />
            </button>
            <button className="w-3.5 h-3.5 rounded-full border border-neutral-500 hover:border-white transition-colors" />
            <button className="w-3 h-3 rounded-[3px] border border-neutral-500 hover:border-white transition-colors" />
          </div>
        </div>

        {/* APK Sideloading Android Dialog Overlay */}
        <AnimatePresence>
          {showInstallOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-[10px] bg-black/70 backdrop-blur-sm rounded-[40px] z-50 flex items-center justify-center p-5 text-neutral-800"
            >
              <motion.div
                initial={{ y: 50, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.9 }}
                className="bg-white rounded-3xl w-full p-5 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowInstallOverlay(false)}
                  className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-700"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-100">
                  <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
                    <PhoneIcon size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Vision_v1.0.apk</h4>
                    <p className="text-[10px] text-neutral-500">Android Package Installer</p>
                  </div>
                </div>

                {!isInstalled && !isInstalling ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-start gap-2.5">
                      <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Do you want to install this application? It will grant standard internet, vibration, and notification permissions.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end text-xs">
                      <button 
                        onClick={() => setShowInstallOverlay(false)}
                        className="px-4 py-2 hover:bg-neutral-100 rounded-xl transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={startApkInstall}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors font-bold shadow-sm"
                      >
                        Install
                      </button>
                    </div>
                  </div>
                ) : isInstalling ? (
                  <div className="py-4 text-center">
                    <p className="text-xs font-bold text-neutral-700 mb-2">Installing application packages...</p>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-brand-500"
                        animate={{ width: `${installProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">{installProgress}% complete</p>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check size={24} />
                    </div>
                    <p className="text-xs font-bold text-neutral-800">App Installed successfully!</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Vision Mobile Launcher is now active on your emulator screen.</p>
                    
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={downloadApkFileDirectly}
                        className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download size={13} />
                        Download Actual APK Mock
                      </button>
                      <button 
                        onClick={() => setShowInstallOverlay(false)}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
