// frontend/src/app/components/DashboardHome.tsx

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";
import {
  Shield,
  Upload,
  ArrowRight,
  TrendingUp,
  Database,
  Activity,
  FileText,
  Eye,
  AlertTriangle,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { historyService, ScanHistoryItem } from "../../services/history";

// ❌ REMOVED: useState outside component

export function DashboardHome() {
  const navigate = useNavigate();
  
  // ✅ MOVED HERE: apiStatus state inside component
  const [apiStatus, setApiStatus] = useState<{
    online: boolean;
    checked: boolean;
  }>({ online: false, checked: false });
  
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, malware: 0, benign: 0 });

  // ✅ ADDED: Health check effect
  useEffect(() => {
    const checkAPI = async () => {
      const health = await apiService.checkHealth();
      setApiStatus({ online: health.online, checked: true });
    };
    checkAPI();
    const interval = setInterval(checkAPI, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const history = historyService.getHistory();
    setRecentScans(history.slice(0, 5));
    setStats(historyService.getStats());
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] mb-2">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Welcome back — your ransomware detection hub
        </p>
      </motion.div>

      {/* Quick Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#00d9ff]/10 to-[#00ffc8]/10 blur-3xl" />
        <div className="relative p-8 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d9ff] to-[#00ffc8] flex items-center justify-center shadow-[0_0_30px_rgba(0,217,255,0.3)]">
                <Shield className="w-8 h-8 text-[#0a0a0f]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Ready to Analyze
                </h2>
                <p className="text-gray-400">
                  Upload an image or CSV file for instant threat detection
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/upload")}
              className="bg-gradient-to-r from-[#00d9ff] to-[#00ffc8] text-[#0a0a0f] hover:opacity-90 px-6 py-6 text-lg font-semibold rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] group"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload File
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Demo Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-6 rounded-2xl bg-[#12121c]/80 border border-purple-500/20 backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Try Demo
              </h3>
              <p className="text-sm text-gray-400">
                Test with a pre-loaded sample file — no upload needed
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  toast.loading("Loading malware sample...", {
                    id: "demo",
                  });
                  const response = await fetch(
                    "/samples/demo_malware.png"
                  );
                  const blob = await response.blob();
                  const file = new File([blob], "demo_malware.png", {
                    type: "image/png",
                  });
                  const result = await apiService.predict(file);
                  const fSize =
                    (blob.size / 1024).toFixed(2) + " KB";

                  historyService.addScan({
                    fileName: "demo_malware.png",
                    fileSize: fSize,
                    fileType: "image",
                    result,
                  });

                  if (result.prediction === "Malware") {
                    toast.error("⚠️ Malware Detected!", {
                      id: "demo",
                    });
                  } else {
                    toast.success("✅ File is Safe!", {
                      id: "demo",
                    });
                  }

                  navigate("/dashboard/results", {
                    state: {
                      result,
                      fileName: "demo_malware.png",
                      fileSize: fSize,
                      fileType: "image",
                    },
                  });
                } catch {
                  toast.error("Demo failed — is the API running?", {
                    id: "demo",
                  });
                }
              }}
              variant="outline"
              className="border-[#ff3366]/50 text-[#ff3366] hover:bg-[#ff3366]/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Malware Sample
            </Button>
            <Button
              onClick={async () => {
                try {
                  toast.loading("Loading benign sample...", {
                    id: "demo",
                  });
                  const response = await fetch(
                    "/samples/demo_benign.csv"
                  );
                  const blob = await response.blob();
                  const file = new File([blob], "demo_benign.csv", {
                    type: "text/csv",
                  });
                  const result = await apiService.predict(file);
                  const fSize =
                    (blob.size / 1024).toFixed(2) + " KB";

                  historyService.addScan({
                    fileName: "demo_benign.csv",
                    fileSize: fSize,
                    fileType: "csv",
                    result,
                  });

                  if (result.prediction === "Malware") {
                    toast.error("⚠️ Malware Detected!", {
                      id: "demo",
                    });
                  } else {
                    toast.success("✅ File is Safe!", {
                      id: "demo",
                    });
                  }

                  navigate("/dashboard/results", {
                    state: {
                      result,
                      fileName: "demo_benign.csv",
                      fileSize: fSize,
                      fileType: "csv",
                    },
                  });
                } catch {
                  toast.error("Demo failed — is the API running?", {
                    id: "demo",
                  });
                }
              }}
              variant="outline"
              className="border-[#00ffc8]/50 text-[#00ffc8] hover:bg-[#00ffc8]/10"
            >
              <Shield className="w-4 h-4 mr-2" />
              Benign Sample
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Scans",
            value: stats.total,
            icon: Activity,
            color: "#00d9ff",
            subtitle: "Files analyzed",
          },
          {
            label: "Threats Detected",
            value: stats.malware,
            icon: AlertTriangle,
            color: "#ff3366",
            subtitle: "Malware found",
          },
          {
            label: "Clean Files",
            value: stats.benign,
            icon: Shield,
            color: "#00ffc8",
            subtitle: "Safe files",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                  border: `1px solid ${stat.color}40`,
                }}
              >
                <stat.icon
                  className="w-6 h-6"
                  style={{ color: stat.color }}
                />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Scans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#00d9ff]" />
            <h3 className="text-xl font-semibold text-white">Recent Scans</h3>
          </div>
          {recentScans.length > 0 && (
            <Button
              onClick={() => navigate("/dashboard/results")}
              variant="ghost"
              className="text-[#00d9ff] hover:bg-[#00d9ff]/10 text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#00d9ff]" />
            </div>
            <h4 className="text-white font-medium mb-2">No scans yet</h4>
            <p className="text-gray-500 text-sm mb-4">
              Upload your first file to start detecting threats
            </p>
            <Button
              onClick={() => navigate("/dashboard/upload")}
              variant="outline"
              className="border-[#00d9ff]/50 text-[#00d9ff] hover:bg-[#00d9ff]/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onClick={() =>
                  navigate("/dashboard/results", {
                    state: {
                      result: scan.result,
                      fileName: scan.fileName,
                      fileSize: scan.fileSize,
                      fileType: scan.fileType,
                    },
                  })
                }
                className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/10 hover:border-[#00d9ff]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      scan.result.prediction === "Malware"
                        ? "bg-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.5)]"
                        : "bg-[#00ffc8] shadow-[0_0_8px_rgba(0,255,200,0.5)]"
                    }`}
                  />
                  <div className="w-8 h-8 rounded-lg bg-[#12121c] border border-[#00d9ff]/10 flex items-center justify-center flex-shrink-0 text-sm">
                    {scan.fileType === "image" ? "🖼️" : "📄"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">
                      {scan.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {scan.fileSize} • {formatTimestamp(scan.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      scan.result.prediction === "Malware"
                        ? "bg-[#ff3366]/10 text-[#ff3366]"
                        : "bg-[#00ffc8]/10 text-[#00ffc8]"
                    }`}
                  >
                    {scan.result.prediction}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(scan.result.final_probability * 100).toFixed(1)}%
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#00d9ff] transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-[#00ffc8]" />
          <h3 className="text-xl font-semibold text-white">System Status</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "API Server",
              value: apiStatus.checked
                ? apiStatus.online
                  ? "Connected"
                  : "Offline"
                : "Checking...",
              online: apiStatus.online,
            },
            {
              label: "Image Model",
              value: "ResNet-18",
              online: apiStatus.online,
            },
            {
              label: "Text Model",
              value: "GRU Network",
              online: apiStatus.online,
            },
            {
              label: "Fusion Engine",
              value: "Late Fusion",
              online: apiStatus.online,
            },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-[#1a1a24] border border-[#00d9ff]/10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.online
                        ? "bg-[#00ffc8] animate-pulse shadow-[0_0_8px_rgba(0,255,200,0.5)]"
                        : "bg-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.5)]"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      item.online ? "text-[#00ffc8]" : "text-[#ff3366]"
                    }`}
                  >
                    {item.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <p className="text-white font-medium text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Upload & Scan",
            description: "Analyze a new file",
            icon: Upload,
            path: "/dashboard/upload",
            color: "#00d9ff",
          },
          {
            title: "Scan History",
            description: "View past results",
            icon: FileText,
            path: "/dashboard/results",
            color: "#00ffc8",
          },
          {
            title: "Model Metrics",
            description: "Performance details",
            icon: TrendingUp,
            path: "/dashboard/performance",
            color: "#8b5cf6",
          },
          {
            title: "Dataset Info",
            description: "Training data details",
            icon: Database,
            path: "/dashboard/dataset",
            color: "#fbbf24",
          },
        ].map((link, index) => (
          <motion.div
            key={index}
            onClick={() => navigate(link.path)}
            className="p-5 rounded-2xl bg-[#12121c]/80 border border-[#00d9ff]/20 backdrop-blur-sm hover:border-[#00d9ff]/40 transition-all cursor-pointer group"
            whileHover={{ y: -3 }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${link.color}20, ${link.color}10)`,
                border: `1px solid ${link.color}40`,
              }}
            >
              <link.icon
                className="w-5 h-5"
                style={{ color: link.color }}
              />
            </div>
            <h4 className="text-white font-semibold mb-1 group-hover:text-[#00d9ff] transition-colors">
              {link.title}
            </h4>
            <p className="text-sm text-gray-400">{link.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}