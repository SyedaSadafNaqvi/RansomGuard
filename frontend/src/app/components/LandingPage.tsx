// frontend/src/app/components/LandingPage.tsx

import { motion } from "motion/react";
import {
  Shield,
  Upload,
  BarChart3,
  ArrowRight,
  Cpu,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,217,255,0.08),transparent_50%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,217,255,0.1)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-[#00d9ff]/40 to-transparent"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 200 + 100}px`,
              }}
              animate={{
                opacity: [0, 0.4, 0],
                x: [0, Math.random() * 80 - 40],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#00ffc8] flex items-center justify-center shadow-[0_0_20px_rgba(0,217,255,0.3)]">
              <Shield className="w-6 h-6 text-[#0a0a0f]" />
            </div>
            <span className="text-xl font-bold text-white">
              RansomGuard<span className="text-[#00d9ff]"></span>
            </span>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="border-[#00d9ff]/50 text-[#00d9ff] hover:bg-[#00d9ff]/10 rounded-lg"
          >
            Launch Dashboard
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        {/* Hero Section */}
        <motion.div
          className="text-center max-w-4xl mx-auto pt-20 pb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/20 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00ffc8] animate-pulse" />
            <span className="text-sm text-[#00d9ff] font-medium">
              Hybrid Deep Learning Detection System
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">Stop Ransomware</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] via-[#00ffc8] to-[#00d9ff]">
              Before It Strikes
            </span>
          </motion.h1>

          {/* Tagline — simplified, no jargon */}
          <motion.p
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Upload a file and get instant threat analysis powered by{" "}
            <span className="text-white font-medium">
              two AI models
            </span>{" "}
            working together — visual pattern recognition and behavioral
            analysis.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={() => navigate("/dashboard/upload")}
              className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-8 py-6 text-lg font-semibold rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all hover:shadow-[0_0_50px_rgba(0,217,255,0.5)] group"
            >
              <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Analyze File Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-[#00d9ff]/50 text-[#00d9ff] hover:bg-[#00d9ff]/10 px-8 py-6 text-lg rounded-xl transition-all group"
            >
              <BarChart3 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              View Dashboard
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {[
              "No data stored",
              "Instant results",
              "62 ransomware families",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#00ffc8]" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Stats — clean, minimal */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-28"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {[
            { label: "Image Accuracy", value: "99.98%" },
            { label: "Text Accuracy", value: "95.15%" },
            { label: "Training Samples", value: "224K+" },
            { label: "ROC-AUC", value: "1.0000" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-[#12121c]/60 border border-[#00d9ff]/10 backdrop-blur-sm"
              whileHover={{
                scale: 1.03,
                borderColor: "rgba(0, 217, 255, 0.3)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[#00d9ff]">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works — 3 steps only */}
        <motion.div
          className="max-w-5xl mx-auto mb-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Three simple steps to detect ransomware threats
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload Your File",
                description:
                  "Drop a BytePlot image or behavioral CSV file into the analyzer.",
                color: "#00d9ff",
              },
              {
                step: "02",
                icon: Cpu,
                title: "AI Analysis",
                description:
                  "Two neural networks analyze visual patterns and behavioral sequences simultaneously.",
                color: "#00ffc8",
              },
              {
                step: "03",
                icon: Shield,
                title: "Get Results",
                description:
                  "Receive a clear threat verdict with confidence scores in under 2 seconds.",
                color: "#8b5cf6",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                <div className="relative p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm hover:border-[#00d9ff]/40 transition-all h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                        border: `1px solid ${item.color}40`,
                        boxShadow: `0 0 20px ${item.color}20`,
                      }}
                    >
                      <item.icon
                        className="w-7 h-7"
                        style={{ color: item.color }}
                      />
                    </div>
                    <span className="text-4xl font-bold text-[#1a1a28] group-hover:text-[#00d9ff]/20 transition-colors">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="relative p-12 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d9ff]/20 to-[#00ffc8]/20 blur-3xl" />
            <div className="absolute inset-0 bg-[#12121c]/80 backdrop-blur-sm border border-[#00d9ff]/20 rounded-3xl" />

            <div className="relative text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Detect Threats?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Upload a file and see our hybrid AI in action. Fast, accurate,
                and completely private.
              </p>
              <Button
                onClick={() => navigate("/dashboard/upload")}
                className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-10 py-6 text-lg font-semibold rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all hover:shadow-[0_0_50px_rgba(0,217,255,0.6)] group"
              >
                <Shield className="w-5 h-5 mr-2" />
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-[#00d9ff]/10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#00ffc8] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#0a0a0f]" />
              </div>
              <span className="text-sm text-gray-400">
                RansomGuard AI — Final Year Project 2026
              </span>
            </div>
            <span className="text-sm text-gray-500">
              PyTorch • Flask • React
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}