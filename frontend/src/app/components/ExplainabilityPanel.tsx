// frontend/src/app/components/ExplainabilityPanel.tsx

import { motion } from "motion/react";
import {
  Brain,
  AlertTriangle,
  Shield,
  Eye,
  FileText,
  Activity,
  Flame,
  Info,
} from "lucide-react";
import { Explainability } from "../../services/api";

interface ExplainabilityPanelProps {
  explainability: Explainability;
  prediction: "Malware" | "Benign";
  analysisType: "hybrid" | "image" | "text";
  imageProb: number | null;
  textProb: number | null;
  finalProb: number;
}

export function ExplainabilityPanel({
  explainability,
  prediction,
  analysisType,
  imageProb,
  textProb,
  finalProb,
}: ExplainabilityPanelProps) {
  const isRansomware = prediction === "Malware";
  const { gradcam, operation_analysis } = explainability;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "#ff3366";
      case "medium":
        return "#fbbf24";
      case "low":
        return "#00ffc8";
      default:
        return "#8b8b99";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-[#ff3366]/10",
          border: "border-[#ff3366]/30",
          text: "text-[#ff3366]",
        };
      case "medium":
        return {
          bg: "bg-[#fbbf24]/10",
          border: "border-[#fbbf24]/30",
          text: "text-[#fbbf24]",
        };
      case "low":
        return {
          bg: "bg-[#00ffc8]/10",
          border: "border-[#00ffc8]/30",
          text: "text-[#00ffc8]",
        };
      default:
        return {
          bg: "bg-gray-500/10",
          border: "border-gray-500/30",
          text: "text-gray-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Explainability Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-[#12121c] to-[#0f0f18] border border-purple-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              AI Explainability
            </h3>
            <p className="text-sm text-gray-400">
              Understanding why the model made this decision
            </p>
          </div>
        </div>

        {/* Decision Summary */}
        <div
          className={`p-4 rounded-xl ${
            isRansomware
              ? "bg-[#ff3366]/10 border border-[#ff3366]/20"
              : "bg-[#00ffc8]/10 border border-[#00ffc8]/20"
          }`}
        >
          <h4
            className={`font-semibold mb-2 ${
              isRansomware ? "text-[#ff3366]" : "text-[#00ffc8]"
            }`}
          >
            Decision Summary
          </h4>
          <p className="text-sm text-gray-300">
            {analysisType === "hybrid" ? (
              <>
                <span className="text-[#00d9ff] font-medium">
                image analysis (40% weight)
                </span>{" "}
                and{" "}
                <span className="text-[#00ffc8] font-medium">
                behavioral analysis (60% weight)
                </span>{" "}
                to reach a final score of{" "}
                <span className="text-white font-bold">
                  {(finalProb * 100).toFixed(1)}%
                </span>
                .
                {imageProb !== null && textProb !== null && (
                  <>
                    {" "}
                    The image model scored{" "}
                    {(imageProb * 100).toFixed(1)}% while the behavioral
                    model scored {(textProb * 100).toFixed(1)}%.
                  </>
                )}
              </>
            ) : analysisType === "image" ? (
              <>
                The ResNet-18 image model analyzed the BytePlot
                visualization and determined a malware probability of{" "}
                <span className="text-white font-bold">
                  {(finalProb * 100).toFixed(1)}%
                </span>
                .
              </>
            ) : (
              <>
                The GRU behavioral model analyzed the system call
                sequence and determined a malware probability of{" "}
                <span className="text-white font-bold">
                  {(finalProb * 100).toFixed(1)}%
                </span>
                .
              </>
            )}
            {" "}The threshold for malware classification is{" "}
            <span className="text-white font-medium">30%</span>.
          </p>
        </div>
      </motion.div>

      {/* Grad-CAM Heatmap */}
      {gradcam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#00d9ff]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Grad-CAM Visualization
              </h3>
              <p className="text-xs text-gray-400">
                Highlights regions the image model focused on
              </p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#00d9ff]/10">
            <img
              src={`data:image/png;base64,${gradcam}`}
              alt="Grad-CAM Heatmap"
              className="w-full h-auto"
            />
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#1a1a24] border border-[#00d9ff]/10">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#00d9ff] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                <span className="text-white font-medium">
                  How to read this:
                </span>{" "}
                Red/yellow regions indicate areas the model considered
                most suspicious. Blue/green regions had less influence
                on the decision. The overlay combines the original
                image with the attention heatmap.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Operation Analysis */}
      {operation_analysis && (
        <>
          {/* Suspicious Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#ff3366]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Behavioral Patterns
                </h3>
                <p className="text-xs text-gray-400">
                  Detected suspicious activity patterns
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {operation_analysis.suspicious_patterns.map(
                (pattern, index) => {
                  const colors = getSeverityColor(pattern.severity);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`font-medium text-sm ${colors.text}`}
                        >
                          {pattern.pattern}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {pattern.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {pattern.description}
                      </p>
                    </motion.div>
                  );
                }
              )}
            </div>
          </motion.div>

          {/* Risk Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#fbbf24]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Risk Breakdown
                </h3>
                <p className="text-xs text-gray-400">
                  {operation_analysis.total_operations} total operations
                  • {operation_analysis.unique_operations} unique types
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                {
                  label: "High Risk",
                  value: operation_analysis.risk_breakdown.high,
                  color: "#ff3366",
                },
                {
                  label: "Medium Risk",
                  value: operation_analysis.risk_breakdown.medium,
                  color: "#fbbf24",
                },
                {
                  label: "Low Risk",
                  value: operation_analysis.risk_breakdown.low,
                  color: "#00ffc8",
                },
              ].map((item, index) => {
                const total =
                  operation_analysis.risk_breakdown.high +
                  operation_analysis.risk_breakdown.medium +
                  operation_analysis.risk_breakdown.low;
                const percentage =
                  total > 0
                    ? ((item.value / total) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/10 text-center"
                  >
                    <p
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {percentage}%
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Risk Bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-[#1a1a24]">
              {(() => {
                const total =
                  operation_analysis.risk_breakdown.high +
                  operation_analysis.risk_breakdown.medium +
                  operation_analysis.risk_breakdown.low;
                if (total === 0) return null;
                return (
                  <>
                    <div
                      className="h-full"
                      style={{
                        width: `${(operation_analysis.risk_breakdown.high / total) * 100}%`,
                        backgroundColor: "#ff3366",
                      }}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${(operation_analysis.risk_breakdown.medium / total) * 100}%`,
                        backgroundColor: "#fbbf24",
                      }}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${(operation_analysis.risk_breakdown.low / total) * 100}%`,
                        backgroundColor: "#00ffc8",
                      }}
                    />
                  </>
                );
              })()}
            </div>
          </motion.div>

          {/* Top Operations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#00ffc8]/10 border border-[#00ffc8]/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#00ffc8]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Top Operations
                </h3>
                <p className="text-xs text-gray-400">
                  Most frequent system calls detected
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {operation_analysis.top_operations.map((op, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getRiskColor(
                            op.risk_level
                          ),
                        }}
                      />
                      <span className="text-sm text-white font-mono">
                        {op.operation}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {op.count} calls
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: getRiskColor(op.risk_level),
                        }}
                      >
                        {op.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${op.percentage}%` }}
                      transition={{
                        delay: 0.6 + index * 0.05,
                        duration: 0.8,
                      }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getRiskColor(
                          op.risk_level
                        ),
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}