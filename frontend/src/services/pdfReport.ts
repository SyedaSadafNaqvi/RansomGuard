// frontend/src/services/pdfReport.ts

import jsPDF from "jspdf";
import { PredictionResponse } from "./api";

interface ReportData {
  fileName: string;
  fileSize: string;
  fileType: "image" | "csv" | "unknown";
  result: PredictionResponse;
  timestamp?: number;
}

export function generatePDFReport(data: ReportData) {
  const doc = new jsPDF();
  const { fileName, fileSize, fileType, result } = data;
  const timestamp = data.timestamp || Date.now();
  const date = new Date(timestamp);

  const isRansomware = result.prediction === "Malware";
  const confidence = (result.final_probability * 100).toFixed(2);

  // Colors
  const cyan = [0, 217, 255];
  const green = [0, 255, 200];
  const red = [255, 51, 102];
  const dark = [10, 10, 15];
  const gray = [150, 150, 160];
  const white = [255, 255, 255];

  // ─── Header Background ───
  doc.setFillColor(dark[0], dark[1], dark[2]);
  doc.rect(0, 0, 210, 50, "F");

  // Logo text
  doc.setTextColor(cyan[0], cyan[1], cyan[2]);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RansomGuard AI", 20, 25);

  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Hybrid Deep Learning Ransomware Detection System", 20, 33);
  doc.text("ResNet-18 + GRU Late Fusion Architecture", 20, 40);

  // ─── Report Title ───
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Scan Report", 20, 65);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} at ${date.toLocaleTimeString()}`,
    20,
    73
  );

  // ─── Divider ───
  doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 78, 190, 78);

  // ─── Verdict Box ───
  let y = 88;

  if (isRansomware) {
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(20, y, 170, 30, 3, 3, "F");
    doc.setTextColor(red[0], red[1], red[2]);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ MALWARE DETECTED", 105, y + 13, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Confidence: ${confidence}% — Immediate quarantine recommended`,
      105,
      y + 23,
      { align: "center" }
    );
  } else {
    doc.setFillColor(240, 255, 250);
    doc.roundedRect(20, y, 170, 30, 3, 3, "F");
    doc.setTextColor(0, 150, 100);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("✓ FILE IS SAFE", 105, y + 13, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Confidence: ${confidence}% — No malicious patterns detected`,
      105,
      y + 23,
      { align: "center" }
    );
  }

  // ─── File Information ───
  y = 130;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("File Information", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const fileInfo = [
    ["File Name", fileName],
    ["File Size", fileSize],
    ["File Type", fileType === "image" ? "Image (BytePlot PNG)" : "CSV/Text (System Calls)"],
    ["Analysis Type", result.analysis_type.charAt(0).toUpperCase() + result.analysis_type.slice(1)],
  ];

  fileInfo.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(value, 80, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  // ─── Analysis Results ───
  y += 5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Analysis Results", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const results: [string, string][] = [];

  if (result.image_probability !== null) {
    results.push([
      "Image Model (ResNet-18)",
      `${(result.image_probability * 100).toFixed(2)}% malware probability`,
    ]);
  }

  if (result.text_probability !== null) {
    results.push([
      "Text Model (GRU)",
      `${(result.text_probability * 100).toFixed(2)}% malware probability`,
    ]);
  }

  results.push(["Final Score", `${confidence}%`]);
  results.push(["Prediction", result.prediction]);

  if (result.analysis_type === "hybrid") {
    results.push(["Fusion Method", "Late Fusion (40% Image + 60% Text)"]);
    results.push(["Decision Threshold", "0.5"]);
  }

  results.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(value, 80, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  // ─── Recommendation ───
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendation", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  if (isRansomware) {
    const recommendations = [
      "1. Quarantine this file immediately and prevent execution.",
      "2. Scan the system for additional indicators of compromise.",
      "3. Review network logs for suspicious outbound connections.",
      "4. Consider restoring from a clean backup if infection is confirmed.",
      "5. Report the incident to your security team.",
    ];
    recommendations.forEach((rec) => {
      doc.text(rec, 20, y);
      y += 7;
    });
  } else {
    const recommendations = [
      "1. No immediate action required — file appears safe.",
      "2. Continue monitoring with regular scheduled scans.",
      "3. Keep detection models updated for new threats.",
    ];
    recommendations.forEach((rec) => {
      doc.text(rec, 20, y);
      y += 7;
    });
  }

  // ─── Footer ───
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(
    "Generated by RansomGuard AI — Final Year Project 2024-2025",
    105,
    pageHeight - 14,
    { align: "center" }
  );
  doc.text(
    "This report is for research and educational purposes only.",
    105,
    pageHeight - 9,
    { align: "center" }
  );

  // ─── Save ───
  const safeName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`RansomGuard_Report_${safeName}.pdf`);
}