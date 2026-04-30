// frontend/src/services/api.ts

export interface OperationInfo {
  operation: string;
  count: number;
  percentage: number;
  risk_level: "high" | "medium" | "low";
}

export interface SuspiciousPattern {
  pattern: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface OperationAnalysis {
  total_operations: number;
  unique_operations: number;
  top_operations: OperationInfo[];
  risk_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  suspicious_patterns: SuspiciousPattern[];
}

export interface Explainability {
  gradcam: string | null;
  operation_analysis: OperationAnalysis | null;
}

export interface PredictionResponse {
  image_probability: number | null;
  text_probability: number | null;
  final_probability: number;
  prediction: "Malware" | "Benign";
  analysis_type: "hybrid" | "image" | "text";
  valid_file?: boolean;
  explainability?: Explainability;
}

export interface PredictionError {
  error: string;
  error_type?: string;
  suggestion?: string;
  valid_file?: boolean;
  details?: Record<string, unknown>;
}

// ✅ Custom error class that carries full backend error info
export class APIError extends Error {
  error_type: string;
  suggestion?: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    error_type: string = "unknown",
    suggestion?: string,
    status: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
    this.error_type = error_type;
    this.suggestion = suggestion;
    this.status = status;
    this.details = details;
  }
}

class APIService {
  private baseURL: string = "http://127.0.0.1:5000";

  async predict(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    const fileName = file.name.toLowerCase();

    // ✅ Only CSV and image — no txt or gif
    if (fileName.endsWith(".csv")) {
      formData.append("csv", file);
    } else if (
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".bmp")
    ) {
      formData.append("image", file);
    } else {
      throw new APIError(
        "Unsupported file type. Please upload a byteplot image (PNG, JPG, BMP) or behavioral CSV file.",
        "invalid_file_type",
        "Upload a byteplot image or behavioral CSV file."
      );
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // ── Upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });

      // ── Response handler
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: PredictionResponse = JSON.parse(
              xhr.responseText
            );
            resolve(response);
          } catch {
            reject(
              new APIError(
                "Failed to parse server response.",
                "parse_error",
                "Please try again.",
                500
              )
            );
          }
        } else {
          // ✅ Pass ALL error info to frontend
          try {
            const errorResponse: PredictionError = JSON.parse(
              xhr.responseText
            );
            reject(
              new APIError(
                errorResponse.error || "Prediction failed.",
                errorResponse.error_type || "unknown",
                errorResponse.suggestion,
                xhr.status,
                errorResponse.details
              )
            );
          } catch {
            reject(
              new APIError(
                `Server error (HTTP ${xhr.status}). Please try again.`,
                "http_error",
                undefined,
                xhr.status
              )
            );
          }
        }
      });

      // ── Network error
      xhr.addEventListener("error", () => {
        reject(
          new APIError(
            "Cannot connect to backend. Make sure the Flask server is running on port 5000.",
            "network_error",
            "Run: python app.py in your backend folder.",
            0
          )
        );
      });

      // ── Aborted
      xhr.addEventListener("abort", () => {
        reject(
          new APIError(
            "Upload was aborted.",
            "aborted",
            "Please try again.",
            0
          )
        );
      });

      xhr.open("POST", `${this.baseURL}/predict`);
      xhr.send(formData);
    });
  }

  async checkHealth(): Promise<{
    status: string;
    model_loaded: boolean;
    online: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        return { ...data, online: true };
      }
      return {
        status: "error",
        model_loaded: false,
        online: false,
      };
    } catch {
      return {
        status: "offline",
        model_loaded: false,
        online: false,
      };
    }
  }
}

export const apiService = new APIService();