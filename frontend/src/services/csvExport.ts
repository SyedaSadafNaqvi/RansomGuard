// frontend/src/services/csvExport.ts

import { ScanHistoryItem } from "./history";

export function exportHistoryAsCSV(history: ScanHistoryItem[]) {
  if (history.length === 0) return;

  const headers = [
    "File Name",
    "File Size",
    "File Type",
    "Prediction",
    "Confidence (%)",
    "Image Probability",
    "Text Probability",
    "Analysis Type",
    "Date",
    "Time",
  ];

  const rows = history.map((item) => {
    const date = new Date(item.timestamp);
    return [
      item.fileName,
      item.fileSize,
      item.fileType,
      item.result.prediction,
      (item.result.final_probability * 100).toFixed(2),
      item.result.image_probability !== null
        ? (item.result.image_probability * 100).toFixed(2)
        : "N/A",
      item.result.text_probability !== null
        ? (item.result.text_probability * 100).toFixed(2)
        : "N/A",
      item.result.analysis_type,
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `RansomGuard_ScanHistory_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}