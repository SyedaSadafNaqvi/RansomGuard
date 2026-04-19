// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./app/App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#12121c",
          color: "#fff",
          border: "1px solid rgba(0, 217, 255, 0.3)",
          borderRadius: "12px",
          padding: "14px 20px",
          fontSize: "14px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        },
        success: {
          iconTheme: {
            primary: "#00ffc8",
            secondary: "#0a0a0f",
          },
        },
        error: {
          iconTheme: {
            primary: "#ff3366",
            secondary: "#0a0a0f",
          },
        },
      }}
    />
    <App />
  </React.StrictMode>
);