// frontend/src/services/history.ts

import { PredictionResponse } from "./api";

export interface ScanHistoryItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "image" | "csv" | "unknown";
  result: PredictionResponse;
  timestamp: number;
}

const STORAGE_KEY = "ransomguard_scan_history";
const MAX_HISTORY = 50;

class HistoryService {
  /**
   * Get all scan history
   */
  getHistory(): ScanHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as ScanHistoryItem[];
    } catch {
      return [];
    }
  }

  /**
   * Add a new scan result to history
   */
  addScan(item: Omit<ScanHistoryItem, "id" | "timestamp">): ScanHistoryItem {
    const history = this.getHistory();

    const newItem: ScanHistoryItem = {
      ...item,
      id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };

    // Add to beginning (newest first)
    history.unshift(newItem);

    // Keep only last MAX_HISTORY items
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return newItem;
  }

  /**
   * Get a single scan by ID
   */
  getScanById(id: string): ScanHistoryItem | null {
    const history = this.getHistory();
    return history.find((item) => item.id === id) || null;
  }

  /**
   * Delete a scan from history
   */
  deleteScan(id: string): void {
    const history = this.getHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get history stats
   */
  getStats() {
    const history = this.getHistory();
    const total = history.length;
    const malware = history.filter((h) => h.result.prediction === "Malware").length;
    const benign = history.filter((h) => h.result.prediction === "Benign").length;
    return { total, malware, benign };
  }
}

export const historyService = new HistoryService();