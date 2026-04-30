// frontend/src/app/components/AboutPage.tsx

import { motion } from "motion/react";
import {
  Shield,
  Users,
  GraduationCap,
  Monitor,
  FileText,
  Eye,
  CheckCircle,
  Code,
  Award,
} from "lucide-react";

const teamMembers = [
  {
    name: "Syeda Sadaf Zainab",
    role: "Frontend Developer",
    icon: Monitor,
    focus: "Dashboard, UI/UX, API Integration",
    color: "#00d9ff",
  },
  {
    name: "Humaira Batool",
    role: "ML Engineer (Text Model)",
    icon: FileText,
    focus: "GRU Network & Behavioral Analysis",
    color: "#00ffc8",
  },
  {
    name: "Khansa Urooj",
    role: "ML Engineer (Image Model)",
    icon: Eye,
    focus: "ResNet-18 & BytePlot Processing",
    color: "#8b5cf6",
  },
];

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
          About This Project
        </h1>
        <p className="text-gray-400">
          Final Year Project — Hybrid Deep Learning for Ransomware Detection
        </p>
      </motion.div>

      {/* Project Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
      >
        <div className="flex items-start gap-4 mb-4">
          <Shield className="w-8 h-8 text-[#00d9ff]" />
          <h2 className="text-2xl font-semibold text-white">
            Project Overview
          </h2>
        </div>

        <p className="text-gray-300 leading-relaxed mb-4">
          RansomGuard is a hybrid ransomware detection system that combines
          visual pattern recognition and behavioral sequence analysis.
          The system processes executable representations and system call traces
          to determine whether a file exhibits malicious characteristics.
        </p>

        <p className="text-gray-300 leading-relaxed">
          The objective of this project is to demonstrate how multimodal deep
          learning can improve detection robustness by leveraging complementary
          data sources instead of relying on a single detection method.
        </p>
      </motion.div>

      {/* What Makes It Unique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {[
          {
            title: "Hybrid Architecture",
            description:
              "Combines two specialized AI models for improved detection reliability.",
          },
          {
            title: "Multimodal Detection",
            description:
              "Analyzes both visual binary representations and runtime behavioral patterns.",
          },
          {
            title: "Real-Time Analysis",
            description:
              "Integrated web dashboard for instant threat evaluation.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-400">{item.description}</p>
          </div>
        ))}
      </motion.div>

      {/* Team Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-[#00d9ff]" />
          <h2 className="text-xl font-semibold text-white">Project Team</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/10"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: `${member.color}20`,
                  border: `1px solid ${member.color}40`,
                }}
              >
                <member.icon
                  className="w-6 h-6"
                  style={{ color: member.color }}
                />
              </div>
              <h4 className="text-white font-semibold">
                {member.name}
              </h4>
              <p className="text-sm text-gray-400">{member.role}</p>
              <p className="text-xs text-gray-500 mt-2">{member.focus}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Academic Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-[#12121c] to-[#1a1a28] border border-[#00d9ff]/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-6 h-6 text-[#00d9ff]" />
          <h2 className="text-xl font-semibold text-white">
            Academic Information
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Project Type", "Final Year Project"],
            ["Department", "Software Engineering"],
            ["Domain", "Cybersecurity & AI"],
            ["Year", "2026"],
          ].map(([label, value], i) => (
            <div key={i} className="p-4 rounded-lg bg-[#1a1a24]">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-white font-medium">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}