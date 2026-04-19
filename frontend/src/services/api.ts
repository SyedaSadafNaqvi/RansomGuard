// // frontend/src/services/api.ts

// export interface PredictionResponse {
//   image_probability: number | null;
//   text_probability: number | null;
//   final_probability: number;
//   prediction: "Malware" | "Benign";
//   analysis_type: "hybrid" | "image" | "text";
// }

// export interface PredictionError {
//   error: string;
// }

// class APIService {
//   private baseURL: string = "http://127.0.0.1:5000";

//   async predict(
//     file: File,
//     onProgress?: (progress: number) => void
//   ): Promise<PredictionResponse> {
//     const formData = new FormData();
//     const fileName = file.name.toLowerCase();

//     if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
//       formData.append("csv", file);
//     } else if (
//       fileName.endsWith(".png") ||
//       fileName.endsWith(".jpg") ||
//       fileName.endsWith(".jpeg") ||
//       fileName.endsWith(".bmp") ||
//       fileName.endsWith(".gif")
//     ) {
//       formData.append("image", file);
//     } else {
//       throw new Error("Unsupported file type. Please upload an image (PNG, JPG) or CSV file.");
//     }

//     return new Promise((resolve, reject) => {
//       const xhr = new XMLHttpRequest();

//       xhr.upload.addEventListener("progress", (e) => {
//         if (e.lengthComputable && onProgress) {
//           const percentComplete = (e.loaded / e.total) * 100;
//           onProgress(Math.round(percentComplete));
//         }
//       });

//       xhr.addEventListener("load", () => {
//         if (xhr.status >= 200 && xhr.status < 300) {
//           try {
//             const response: PredictionResponse = JSON.parse(xhr.responseText);
//             resolve(response);
//           } catch {
//             reject(new Error("Failed to parse response"));
//           }
//         } else {
//           try {
//             const errorResponse: PredictionError = JSON.parse(xhr.responseText);
//             reject(new Error(errorResponse.error || "Prediction failed"));
//           } catch {
//             reject(new Error(`HTTP Error: ${xhr.status}`));
//           }
//         }
//       });

//       xhr.addEventListener("error", () => {
//         reject(new Error("Network error occurred. Make sure backend is running."));
//       });

//       xhr.addEventListener("abort", () => {
//         reject(new Error("Upload aborted"));
//       });

//       xhr.open("POST", `${this.baseURL}/predict`);
//       xhr.send(formData);
//     });
//   }

//   // ✅ FIXED: Properly formatted checkHealth method
//   async checkHealth(): Promise<{
//     status: string;
//     model_loaded: boolean;
//     online: boolean;
//   }> {
//     try {
//       const response = await fetch(`${this.baseURL}/health`, {
//         method: "GET",
//         signal: AbortSignal.timeout(5000),
//       });
//       if (response.ok) {
//         const data = await response.json();
//         return { ...data, online: true };
//       }
//       return { status: "error", model_loaded: false, online: false };
//     } catch {
//       return { status: "offline", model_loaded: false, online: false };
//     }
//   }
// }

// export const apiService = new APIService();

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
  explainability?: Explainability;
}

export interface PredictionError {
  error: string;
}

class APIService {
  private baseURL: string = "http://127.0.0.1:5000";

  async predict(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv") || fileName.endsWith(".txt")) {
      formData.append("csv", file);
    } else if (
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".bmp") ||
      fileName.endsWith(".gif")
    ) {
      formData.append("image", file);
    } else {
      throw new Error("Unsupported file type.");
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: PredictionResponse = JSON.parse(
              xhr.responseText
            );
            resolve(response);
          } catch {
            reject(new Error("Failed to parse response"));
          }
        } else {
          try {
            const errorResponse: PredictionError = JSON.parse(
              xhr.responseText
            );
            reject(
              new Error(errorResponse.error || "Prediction failed")
            );
          } catch {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(
          new Error(
            "Network error. Make sure backend is running."
          )
        );
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
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
      return { status: "error", model_loaded: false, online: false };
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