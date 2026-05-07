// frontend/src/app/components/ResultsPage.tsx

import { useEffect, useState } from "react";
import { ExplainabilityPanel } from "./ExplainabilityPanel";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  Activity,
  TrendingUp,
  BarChart3,
  Image,
  History,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  FileDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { PredictionResponse } from "../../services/api";
import { historyService, ScanHistoryItem } from "../../services/history";
import { generatePDFReport } from "../../services/pdfReport";
import { exportHistoryAsCSV } from "../../services/csvExport";
import toast from "react-hot-toast";

interface LocationState {
  result: PredictionResponse;
  fileName: string;
  fileSize: string;
  fileType: "image" | "csv" | "binary" | "unknown";
}

export function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [fileType, setFileType] = useState<"image" | "csv" | "binary" | "unknown">("unknown");
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state && state.result) {
      setResult(state.result);
      setFileName(state.fileName || "Unknown File");
      setFileSize(state.fileSize || "Unknown Size");
      setFileType(state.fileType || "unknown");
      setHasResult(true);
    }
    setScanHistory(historyService.getHistory());
  }, [location]);

  const loadHistoryItem = (item: ScanHistoryItem) => {
    setResult(item.result);
    setFileName(item.fileName);
    setFileSize(item.fileSize);
    setFileType(item.fileType);
    setHasResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    historyService.deleteScan(id);
    setScanHistory(historyService.getHistory());
    toast.success("Scan deleted");
  };

  const clearAllHistory = () => {
    historyService.clearHistory();
    setScanHistory([]);
    toast.success("History cleared");
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    generatePDFReport({
      fileName,
      fileSize,
      fileType,
      result,
      timestamp: Date.now(),
    });
    toast.success("PDF report downloaded!");
  };

  const handleExportCSV = () => {
    if (scanHistory.length === 0) {
      toast.error("No scan history to export");
      return;
    }
    exportHistoryAsCSV(scanHistory);
    toast.success("CSV exported!");
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7)
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const historyStats = historyService.getStats();

  // No result and no history
  if (!hasResult && scanHistory.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
            Detection Results
          </h1>
          <p className="text-gray-400">No analysis results yet</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-[#00d9ff]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Results Found
          </h3>
          <p className="text-gray-400 mb-6 text-center max-w-md">
            Upload and analyze a file first to see detection results here.
          </p>
          <Button
            onClick={() => navigate("/dashboard/upload")}
            className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-6 py-3 rounded-xl"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload File
          </Button>
        </motion.div>
      </div>
    );
  }

  const isRansomware = result?.prediction === "Malware";
  const confidencePercent = result
    ? (result.final_probability * 100).toFixed(1)
    : "0";

  const getAnalysisTypeLabel = () => {
    if (!result) return "";
    switch (result.analysis_type) {
      case "hybrid":
        return "Hybrid Analysis (Image + Text)";
      case "image":
        return "Image Analysis Only";
      case "text":
        return "Text/CSV Analysis Only";
      case "binary_image":
        return "Binary → Byteplot → ResNet-18";
      default:
        return "Unknown";
    }
  };

  const getFeatureImportanceData = () => {
    if (!result) return [];
    const data = [];
    if (result.image_probability !== null) {
      data.push({
        feature: "Image",
        value: Math.round(result.image_probability * 100),
      });
    }
    if (result.text_probability !== null) {
      data.push({
        feature: "Text",
        value: Math.round(result.text_probability * 100),
      });
    }
    data.push({
      feature: "Final",
      value: Math.round(result.final_probability * 100),
    });
    data.push({
      feature: "Confidence",
      value: Math.round(result.final_probability * 95),
    });
    return data;
  };

  const featureImportanceData = getFeatureImportanceData();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
          Detection Results
        </h1>
        <p className="text-gray-400">
          {hasResult
            ? `Analysis complete • ${getAnalysisTypeLabel()}`
            : "View your scan history"}
        </p>
      </motion.div>

      {/* Current Result */}
      {hasResult && result && (
        <>
          {/* Main Result Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative overflow-hidden"
          >
            <div
              className={`absolute inset-0 ${
                isRansomware
                  ? "bg-gradient-to-br from-[#ff3366]/10 to-transparent"
                  : "bg-gradient-to-br from-[#00ffc8]/10 to-transparent"
              } blur-3xl`}
            />

            <div
              className={`relative p-8 rounded-2xl border-2 ${
                isRansomware
                  ? "border-[#ff3366]/50 bg-[#12121c]/90"
                  : "border-[#00ffc8]/50 bg-[#12121c]/90"
              } backdrop-blur-sm`}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                    isRansomware
                      ? "bg-[#ff3366]/10 border-2 border-[#ff3366]"
                      : "bg-[#00ffc8]/10 border-2 border-[#00ffc8]"
                  }`}
                  style={{
                    boxShadow: isRansomware
                      ? "0 0 40px rgba(255, 51, 102, 0.4)"
                      : "0 0 40px rgba(0, 255, 200, 0.4)",
                  }}
                >
                  {isRansomware ? (
                    <AlertTriangle className="w-12 h-12 text-[#ff3366]" />
                  ) : (
                    <Shield className="w-12 h-12 text-[#00ffc8]" />
                  )}
                </motion.div>

                <h2
                  className={`text-4xl font-bold mb-2 ${
                    isRansomware ? "text-[#ff3366]" : "text-[#00ffc8]"
                  }`}
                >
                  {isRansomware ? "⚠️ Malware Detected" : "✓ File is Safe"}
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-3xl font-bold text-white">
                    {confidencePercent}%
                  </span>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl ${
                  isRansomware
                    ? "bg-[#ff3366]/10 border border-[#ff3366]/30"
                    : "bg-[#00ffc8]/10 border border-[#00ffc8]/30"
                }`}
              >
                <p
                  className={
                    isRansomware ? "text-[#ff3366]" : "text-[#00ffc8]"
                  }
                >
                  {isRansomware
                    ? "⚠️ This file contains malicious patterns and should be quarantined immediately."
                    : "✓ No malicious patterns detected. This file appears to be safe."}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Analysis Breakdown */}
          <div
            className={`grid gap-6 ${
              result.analysis_type === "hybrid"
                ? "md:grid-cols-3"
                : "md:grid-cols-2"
            }`}
          >
            {result.image_probability !== null && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#00d9ff]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Image Analysis
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#00d9ff]">
                      {(result.image_probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-400">
                      malware probability
                    </span>
                  </div>
                  <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${result.image_probability * 100}%`,
                      }}
                      transition={{ delay: 1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-[#00d9ff] to-[#00a8cc]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {result.text_probability !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00ffc8]/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00ffc8]/10 border border-[#00ffc8]/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#00ffc8]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Text Analysis
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#00ffc8]">
                      {(result.text_probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-400">
                      malware probability
                    </span>
                  </div>
                  <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${result.text_probability * 100}%`,
                      }}
                      transition={{ delay: 1.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-[#00ffc8] to-[#00cc9f]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="p-6 rounded-2xl bg-[#12121c]/80 border border-purple-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Final Score
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-400">
                    {confidencePercent}%
                  </span>
                  <span className="text-sm text-gray-400">
                    {result.analysis_type === "hybrid"
                      ? "combined"
                      : "total"}
                  </span>
                </div>
                <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${result.final_probability * 100}%`,
                    }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* File Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00d9ff]" />
              File Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#1a1a24] border border-[#00d9ff]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-[#00d9ff]/10 flex items-center justify-center">
                    {fileType === "image" ? (
                      <Image className="w-4 h-4 text-[#00d9ff]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#00ffc8]" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">File Name</span>
                </div>
                <p className="text-white font-medium truncate">{fileName}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#1a1a24] border border-[#00d9ff]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-[#00d9ff]/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#00d9ff]" />
                  </div>
                  <span className="text-sm text-gray-400">File Size</span>
                </div>
                <p className="text-white font-medium">{fileSize}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#1a1a24] border border-[#00d9ff]/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-[#00d9ff]/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#00d9ff]" />
                  </div>
                  <span className="text-sm text-gray-400">Analysis Type</span>
                </div>
                <p className="text-white font-medium capitalize">
                  {result.analysis_type}
                </p>
              </div>
            </div>
          </motion.div>

          {/* BytePlot Visualization */}
          {result.byteplot_b64 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35 }}
              className="p-6 rounded-2xl bg-[#12121c]/80 border border-purple-500/20"
            >
              <h3 className="text-xl font-semibold mb-1 text-white flex items-center gap-2">
                <span className="text-purple-400">⚙️</span> BytePlot Visualization
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Generated from binary file · width=256px · Nataraj method · ResNet-18
              </p>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <img
                    src={`data:image/png;base64,${result.byteplot_b64}`}
                    alt="BytePlot"
                    className="rounded-xl border border-purple-500/30 bg-black"
                    style={{ imageRendering: "pixelated", width: "200px" }}
                  />
                  <p className="text-xs text-gray-600 text-center mt-1">{result.byteplot_size}</p>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="p-3 rounded-lg bg-[#1a1a24] border border-purple-500/10">
                    <p className="text-purple-400 font-medium mb-1 text-xs uppercase tracking-wider">How it works</p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Each byte becomes one grayscale pixel (0–255), width=256.
                      Resized to 224×224 and fed to ResNet-18 — same as Malex-200k training data.
                    </p>
                  </div>
                  {result.ms_signed && (
                    <div className="p-3 rounded-lg bg-[#00ffc8]/5 border border-[#00ffc8]/20">
                      <p className="text-[#00ffc8] text-xs">
                        ✓ Microsoft-signed — classified Benign without model inference.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-[#1a1a24] border border-purple-500/10">
                      <p className="text-gray-500 text-xs">File size</p>
                      <p className="text-white text-sm font-medium">{result.file_size_kb} KB</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1a1a24] border border-purple-500/10">
                      <p className="text-gray-500 text-xs">Byteplot grid</p>
                      <p className="text-white text-sm font-medium">{result.byteplot_size ?? "256×?"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Radar Chart */}
          {featureImportanceData.length > 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                Analysis Breakdown
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={featureImportanceData}>
                      <PolarGrid stroke="#1e1e2e" />
                      <PolarAngleAxis
                        dataKey="feature"
                        stroke="#8b8b99"
                        tick={{ fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        stroke="#8b8b99"
                      />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#00d9ff"
                        fill="#00d9ff"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-3">
                  {featureImportanceData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{item.feature}</span>
                        <span className="text-[#00d9ff]">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{
                            delay: 1.5 + index * 0.1,
                            duration: 0.8,
                          }}
                          className="h-full bg-gradient-to-r from-[#00d9ff] to-[#00ffc8]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Explainability Section */}
          {result.explainability && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <ExplainabilityPanel
                explainability={result.explainability}
                prediction={result.prediction}
                analysisType={result.analysis_type}
                imageProb={result.image_probability}
                textProb={result.text_probability}
                finalProb={result.final_probability}
              />
            </motion.div>
          )}

          {/* Action Buttons — PDF + Scan Another + Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-6 py-3 rounded-xl font-semibold"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF Report
            </Button>
            <Button
              onClick={() => navigate("/dashboard/upload")}
              variant="outline"
              className="border-[#00d9ff] text-[#00d9ff] hover:bg-[#00d9ff]/10 px-6 py-3 rounded-xl"
            >
              <Upload className="w-5 h-5 mr-2" />
              Scan Another File
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-800 px-6 py-3 rounded-xl"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasResult ? 1.6 : 0.2 }}
          className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm"
        >
          {/* History Header */}
          <div className="flex items-center justify-between mb-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-5 h-5 text-[#00d9ff]" />
              <h3 className="text-xl font-semibold text-white">
                Scan History
              </h3>
              <span className="px-2 py-1 rounded-lg bg-[#00d9ff]/20 text-[#00d9ff] text-xs font-medium">
                {scanHistory.length}
              </span>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-4 mr-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#ff3366]" />
                  <span className="text-xs text-gray-400">
                    {historyStats.malware} threats
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#00ffc8]" />
                  <span className="text-xs text-gray-400">
                    {historyStats.benign} safe
                  </span>
                </div>
              </div>

              {/* Export CSV Button */}
              <Button
                onClick={handleExportCSV}
                variant="ghost"
                className="text-[#00d9ff] hover:bg-[#00d9ff]/10 text-xs px-3 py-1 h-auto"
              >
                <FileDown className="w-3 h-3 mr-1" />
                Export CSV
              </Button>

              {/* Clear All */}
              <Button
                onClick={clearAllHistory}
                variant="ghost"
                className="text-gray-400 hover:text-[#ff3366] hover:bg-[#ff3366]/10 text-xs px-3 py-1 h-auto"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* History List */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {scanHistory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => loadHistoryItem(item)}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/10 hover:border-[#00d9ff]/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            item.result.prediction === "Malware"
                              ? "bg-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.5)]"
                              : "bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.5)]"
                          }`}
                        />
                        <div className="w-8 h-8 rounded-lg bg-[#12121c] border border-[#00d9ff]/10 flex items-center justify-center flex-shrink-0 text-sm">
                          {item.fileType === "image" ? "🖼️" : item.fileType === "binary" ? "⚙️" : "📄"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{item.fileSize}</span>
                            <span>•</span>
                            <span>{formatTimestamp(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium hidden sm:inline-block ${
                            item.result.prediction === "Malware"
                              ? "bg-[#ff3366]/10 text-[#ff3366]"
                              : "bg-[#00ffc8]/10 text-[#00ffc8]"
                          }`}
                        >
                          {item.result.prediction}
                        </span>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          {(item.result.final_probability * 100).toFixed(1)}%
                        </span>
                        <Eye className="w-4 h-4 text-gray-500 group-hover:text-[#00d9ff] transition-colors" />
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="text-gray-600 hover:text-[#ff3366] transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
