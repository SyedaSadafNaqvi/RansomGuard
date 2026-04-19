import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardHome } from "./components/DashboardHome";
import { UploadPage } from "./components/UploadPage";
import { ResultsPage } from "./components/ResultsPage";
import { PerformancePage } from "./components/PerformancePage";
import { DatasetPage } from "./components/DatasetPage";
import { AboutPage } from "./components/AboutPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0f]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="dataset" element={<DatasetPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
