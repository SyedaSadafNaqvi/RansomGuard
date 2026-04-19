// frontend/src/app/components/DatasetPage.tsx

import { motion } from "motion/react";
import {
  Database,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  Binary,
  CheckCircle,
} from "lucide-react";

export function DatasetPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
          Dataset Overview
        </h1>
        <p className="text-gray-400">
          Data sources used for training and evaluation
        </p>
      </motion.div>

      {/* Dataset Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            title: "MaleX-200K",
            description:
              "200,000 BytePlot image representations of executable binaries.",
            icon: ImageIcon,
            details: [
              "224×224 grayscale PNG",
              "50% malware / 50% benign",
              "Hash-based split (no leakage)",
            ],
          },
          {
            title: "PARSEC Dataset",
            description:
              "23,936 system call sequences from ransomware and benign software.",
            icon: FileText,
            details: [
              "62 ransomware families",
              "65M+ system call operations",
              "80 unique operation vocabulary",
            ],
          },
        ].map((dataset, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <dataset.icon className="w-6 h-6 text-[#00d9ff]" />
              <h2 className="text-xl font-semibold text-white">
                {dataset.title}
              </h2>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              {dataset.description}
            </p>
            <ul className="space-y-2">
              {dataset.details.map((d, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-[#00ffc8]" />
                  {d}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Ransomware Families */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#ff3366]" />
          <h2 className="text-xl font-semibold text-white">
            Ransomware Coverage
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          The PARSEC dataset includes 62 distinct ransomware families,
          ensuring diverse behavioral pattern coverage. This improves
          generalization across different attack variants.
        </p>
      </motion.div>

      {/* Vocabulary Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <Binary className="w-6 h-6 text-[#00ffc8]" />
          <h2 className="text-xl font-semibold text-white">
            Behavioral Vocabulary
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          80 unique system call operations were tokenized and encoded.
          Sequences were segmented using sliding windows of 500 operations
          with stride overlap to preserve temporal behavior patterns.
        </p>
      </motion.div>

      {/* Data Integrity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-[#12121c] to-[#1a1a28] border border-[#00d9ff]/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-[#00d9ff]" />
          <h2 className="text-xl font-semibold text-white">
            Data Integrity & Splitting
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• 70% training, 15% validation, 15–20% testing splits</li>
          <li>• Stratified sampling to maintain class balance</li>
          <li>• Hash-based separation to prevent train-test leakage</li>
          <li>• Balanced benign/malware distribution</li>
        </ul>
      </motion.div>
    </div>
  );
}