// frontend/src/app/components/UploadPage.tsx

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Eye,
  Info,
  ShieldAlert,
  Binary,          // ← NEW icon for binary files
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useNavigate } from "react-router-dom";
import {
  apiService,
  PredictionResponse,
  APIError,
} from "../../services/api";
import { historyService } from "../../services/history";
import toast from "react-hot-toast";

// ── ALLOWED EXTENSIONS ──────────────────────────
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".bmp"];
const ALLOWED_CSV_EXTENSIONS   = [".csv"];
// ── NEW ─────────────────────────────────────────
const ALLOWED_BINARY_EXTENSIONS = [
  ".exe", ".dll", ".sys", ".bin", ".dat",
  ".drv", ".ocx", ".scr", ".cpl", ".msi",
];

const ALL_ALLOWED = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_CSV_EXTENSIONS,
  ...ALLOWED_BINARY_EXTENSIONS,   // ← NEW
];

// ── FRONTEND VALIDATION ─────────────────────────
interface FrontendValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
  fileType: "image" | "csv" | "binary" | "unknown";   // ← added "binary"
}

function validateFile(file: File): FrontendValidation {
  const fileName = file.name.toLowerCase();

  const hasValidExt = ALL_ALLOWED.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt) {
    return {
      isValid: false,
      fileType: "unknown",
      error: `Unsupported file type. Please upload a byteplot image (PNG, JPG, BMP), behavioral data (CSV), or a binary executable (.exe, .dll, .sys, .bin).`,
    };
  }

  const isImage  = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const isCsv    = ALLOWED_CSV_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const isBinary = ALLOWED_BINARY_EXTENSIONS.some((ext) => fileName.endsWith(ext));  // ← NEW

  const fileType: "image" | "csv" | "binary" | "unknown" =
    isImage  ? "image"  :
    isCsv    ? "csv"    :
    isBinary ? "binary" :          // ← NEW
    "unknown";

  // File size check (100MB for binaries, 50MB otherwise)
  const maxSize = isBinary ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      fileType,
      error: `File size exceeds ${isBinary ? "100MB" : "50MB"} limit.`,
    };
  }

  if (file.size < 100) {
    return { isValid: false, fileType, error: "File is too small to be valid." };
  }

  if (isImage) {
    return {
      isValid: true,
      fileType,
      warning:
        "Make sure this is a byteplot visualization of an executable file. Regular photos or screenshots will be rejected.",
    };
  }

  // ── NEW: binary warning ──────────────────────
  if (isBinary) {
    return {
      isValid: true,
      fileType,
      warning:
        "Binary file detected. It will be converted to a byteplot image automatically, then analyzed by ResNet-18. The file is never executed.",
    };
  }

  return { isValid: true, fileType };
}

// ── COMPONENT ───────────────────────────────────
export function UploadPage() {
  const [isDragging, setIsDragging]       = useState(false);
  const [file, setFile]                   = useState<File | null>(null);
  // ← "binary" added to union
  const [fileType, setFileType]           = useState<"image" | "csv" | "binary" | "unknown">("unknown");
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [csvPreview, setCsvPreview]       = useState<string[][]>([]);
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [warning, setWarning]             = useState<string | null>(null);
  const [backendError, setBackendError]   = useState<{
    message: string; type: string; suggestion?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate     = useNavigate();

  // ── DRAG & DROP ─────────────────────────────────
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  // ── VALIDATE AND SET FILE ───────────────────────
  const validateAndSetFile = (selectedFile: File) => {
    setError(null); setWarning(null); setBackendError(null);
    setImagePreview(null); setCsvPreview([]);

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file.");
      toast.error(validation.error || "Invalid file.");
      return;
    }
    if (validation.warning) setWarning(validation.warning);

    setFile(selectedFile);
    setFileType(validation.fileType);
    toast.success(`File "${selectedFile.name}" selected`);

    if (validation.fileType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (validation.fileType === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text   = e.target?.result as string;
        const lines  = text.split("\n").slice(0, 6);
        const parsed = lines
          .filter((line) => line.trim())
          .map((line) => line.split(",").map((cell) => cell.trim()));
        setCsvPreview(parsed);
      };
      reader.readAsText(selectedFile);
    }
    // binary files: no client-side preview (byteplot generated server-side)
  };

  // ── REMOVE FILE ─────────────────────────────────
  const handleRemoveFile = () => {
    setFile(null); setFileType("unknown");
    setImagePreview(null); setCsvPreview([]);
    setUploadProgress(0); setIsUploading(false); setIsAnalyzing(false);
    setError(null); setWarning(null); setBackendError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024)         return bytes + " B";
    if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // ── ANALYZE ─────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return;
    setError(null); setWarning(null); setBackendError(null);
    setIsUploading(true); setUploadProgress(0);

    const analyzeToast = toast.loading(
      fileType === "binary"
        ? "Converting to byteplot & analyzing..."
        : "Analyzing file..."
    );

    try {
      let result: PredictionResponse;

      // ── NEW: route binary files to predictBinary ──
      if (fileType === "binary") {
        result = await apiService.predictBinary(
          file,
          (progress) => setUploadProgress(progress)
        );
      } else {
        // ── ORIGINAL path for image + CSV ────────────
        result = await apiService.predict(
          file,
          (progress) => setUploadProgress(progress)
        );
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      const fName = file.name;
      const fSize = formatFileSize(file.size);

      historyService.addScan({ fileName: fName, fileSize: fSize, fileType, result });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (result.prediction === "Malware") {
        toast.error("⚠️ Malware Detected!", { id: analyzeToast });
      } else {
        toast.success("✅ File is Safe!", { id: analyzeToast });
      }

      navigate("/dashboard/results", {
        state: { result, fileName: fName, fileSize: fSize, fileType },
      });
    } catch (err: unknown) {
      setIsUploading(false);
      setIsAnalyzing(false);

      if (err instanceof APIError) {
        if (
          err.error_type === "not_byteplot" ||
          err.error_type === "not_behavioral" ||
          err.error_type === "invalid_file"
        ) {
          setBackendError({ message: err.message, type: err.error_type, suggestion: err.suggestion });
          toast.error(
            err.error_type === "not_byteplot"   ? "Invalid image — not a byteplot" :
            err.error_type === "not_behavioral" ? "Invalid CSV — not a behavioral log" :
                                                  "Invalid file detected",
            { id: analyzeToast }
          );
        } else if (err.error_type === "network_error") {
          setError("Cannot connect to backend server. Please make sure Flask is running.");
          toast.error("Backend offline", { id: analyzeToast });
        } else {
          setError(err.message);
          toast.error("Analysis failed.", { id: analyzeToast });
        }
      } else if (err instanceof Error) {
        setError(err.message);
        toast.error("Analysis failed.", { id: analyzeToast });
      } else {
        setError("Analysis failed. Please try again.");
        toast.error("Analysis failed.", { id: analyzeToast });
      }
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (fileType === "image")  return "🖼️";
    if (fileType === "binary") return "⚙️";   // ← NEW
    return "📄";
  };

  const getFileTypeLabel = () => {
    if (fileType === "image")  return "Byteplot Image";
    if (fileType === "binary") return "Binary Executable";   // ← NEW
    return "Behavioral CSV";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
          Upload File for Analysis
        </h1>
        <p className="text-gray-400">
          Upload a byteplot image, behavioral CSV, or binary executable to detect ransomware threats
        </p>
      </motion.div>

      {/* General Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#ff3366] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[#ff3366] font-medium">Error</p>
              <p className="text-[#ff3366]/80 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-[#ff3366] hover:text-[#ff3366]/80"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      <AnimatePresence>
        {warning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium">Notice</p>
              <p className="text-yellow-400/80 text-sm">{warning}</p>
            </div>
            <button onClick={() => setWarning(null)} className="text-yellow-400 hover:text-yellow-400/80"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backend Error */}
      <AnimatePresence>
        {backendError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-400 font-semibold text-base mb-1">
                  {backendError.type === "not_byteplot"   ? "Invalid Image Type"   :
                   backendError.type === "not_behavioral" ? "Invalid CSV File"     : "File Validation Failed"}
                </p>
                <p className="text-orange-300/80 text-sm mb-3">{backendError.message}</p>
                {backendError.suggestion && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-orange-300 text-sm"><span className="font-medium">💡 How to fix: </span>{backendError.suggestion}</p>
                  </div>
                )}
                {backendError.type === "not_byteplot" && (
                  <div className="mt-3 p-3 rounded-lg bg-[#1a1a24] border border-[#00d9ff]/20">
                    <p className="text-[#00d9ff] text-xs font-medium mb-1">What is a Byteplot Image?</p>
                    <p className="text-gray-400 text-xs">A byteplot is a grayscale visualization of an executable file's binary data. Each pixel represents a byte value (0–255).</p>
                  </div>
                )}
                {backendError.type === "not_behavioral" && (
                  <div className="mt-3 p-3 rounded-lg bg-[#1a1a24] border border-[#00ffc8]/20">
                    <p className="text-[#00ffc8] text-xs font-medium mb-1">What is a Behavioral CSV?</p>
                    <p className="text-gray-400 text-xs">A behavioral CSV contains system call sequences with an Operation column (ReadFile, WriteFile, RegSetValue, etc.).</p>
                  </div>
                )}
              </div>
              <button onClick={() => setBackendError(null)} className="text-orange-400 hover:text-orange-300"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? "border-[#00d9ff] bg-[#00d9ff]/10"
              : file
              ? "border-[#00ffc8]/50 bg-[#12121c]/50"
              : "border-[#00d9ff]/30 bg-[#12121c]/50 hover:border-[#00d9ff]/50 hover:bg-[#12121c]/80"
          }`}
        >
          {/* ← accept updated to include binary extensions */}
          <input
            ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden"
            accept=".png,.jpg,.jpeg,.bmp,.csv,.exe,.dll,.sys,.bin,.dat,.drv,.ocx,.scr,.cpl,.msi"
          />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/30 mb-4"
                >
                  <Upload className="w-10 h-10 text-[#00d9ff]" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">Drop your file here</h3>
                <p className="text-gray-400 mb-4">or click to browse from your computer</p>
                <p className="text-sm text-gray-500">
                  Byteplot images (PNG, JPG, BMP) · Behavioral data (CSV) · Binary files (EXE, DLL, SYS, BIN)
                </p>
              </motion.div>
            ) : (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <div className="flex items-start gap-4 p-6 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/20">
                  <div className="w-12 h-12 rounded-lg bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center flex-shrink-0 text-2xl">
                    {getFileIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {formatFileSize(file.size)} · {getFileTypeLabel()}
                        </p>
                      </div>
                      {!isUploading && !isAnalyzing && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }} className="text-gray-400 hover:text-[#ff3366] transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            {fileType === "binary" ? "Uploading & converting..." : "Uploading..."}
                          </span>
                          <span className="text-[#00d9ff]">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-[#00ffc8]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">
                          {fileType === "binary" ? "Analyzing byteplot..." : "Analyzing file..."}
                        </span>
                      </div>
                    )}

                    {!isUploading && !isAnalyzing && (
                      <div className="flex items-center gap-2 text-[#00ffc8]">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Ready for analysis</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* File Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-[#00d9ff]" />
              <h3 className="text-lg font-semibold text-white">Image Preview</h3>
            </div>
            <div className="flex justify-center">
              <img src={imagePreview} alt="BytePlot Preview"
                className="max-w-[224px] max-h-[224px] rounded-xl border border-[#00d9ff]/20 object-contain bg-black" />
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">BytePlot visualization — analyzed by ResNet-18</p>
          </motion.div>
        )}

        {csvPreview.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00ffc8]/20">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#00ffc8]" />
              <h3 className="text-lg font-semibold text-white">CSV Preview</h3>
              <span className="text-xs text-gray-500">(First 5 rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#00ffc8]/10">
                    {csvPreview[0]?.map((header, i) => (
                      <th key={i} className="text-left py-2 px-3 text-[#00ffc8] font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(1).map((row, i) => (
                    <tr key={i} className="border-b border-[#00ffc8]/5">
                      {row.map((cell, j) => (
                        <td key={j} className="py-2 px-3 text-gray-400 font-mono text-xs">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">Behavioral data — analyzed by GRU Network</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze Button */}
      <AnimatePresence>
        {file && !isUploading && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }} className="flex justify-center">
            <Button onClick={handleAnalyze}
              className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all hover:shadow-[0_0_50px_rgba(0,217,255,0.5)]">
              <Upload className="w-5 h-5 mr-2" />
              {fileType === "binary" ? "Convert & Analyze" : "Analyze File"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported Files — now 3 cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="grid md:grid-cols-3 gap-4">    {/* ← was md:grid-cols-2 */}

        <div className="flex items-start gap-3 p-5 rounded-xl bg-[#12121c]/50 border border-[#00d9ff]/10">
          <div className="w-10 h-10 rounded-lg bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-[#00d9ff]" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Byteplot Images</h4>
            <p className="text-sm text-gray-400">PNG, JPG, JPEG, BMP</p>
            <p className="text-xs text-gray-500 mt-1">Binary visualizations → ResNet-18</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-5 rounded-xl bg-[#12121c]/50 border border-[#00ffc8]/10">
          <div className="w-10 h-10 rounded-lg bg-[#00ffc8]/10 border border-[#00ffc8]/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#00ffc8]" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Behavioral Data</h4>
            <p className="text-sm text-gray-400">CSV with Operation column</p>
            <p className="text-xs text-gray-500 mt-1">System call sequences → GRU Network</p>
          </div>
        </div>

        {/* ── NEW CARD ── */}
        <div className="flex items-start gap-3 p-5 rounded-xl bg-[#12121c]/50 border border-purple-500/10">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Binary className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Binary Executables</h4>
            <p className="text-sm text-gray-400">EXE, DLL, SYS, BIN, DAT</p>
            <p className="text-xs text-gray-500 mt-1">Auto-converted to byteplot → ResNet-18</p>
          </div>
        </div>
      </motion.div>

      {/* Info Box — updated */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
        className="p-5 rounded-xl bg-[#12121c]/50 border border-[#00d9ff]/10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#00d9ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1 text-sm">What files are supported?</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              <span className="text-[#00d9ff]">Byteplot images</span> are grayscale visualizations of executable files.{" "}
              <span className="text-purple-400">Binary executables</span> (.exe, .dll, .sys, .bin) are automatically converted
              to byteplots on the server — they are never executed, only read.{" "}
              <span className="text-[#00ffc8]">CSV files</span> with system call sequences are analyzed by the GRU network.
              Regular photos and screenshots are{" "}
              <span className="text-[#ff3366]">not supported</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
