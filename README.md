# RansomGuard AI 🛡️
### Hybrid Ransomware Detection System — Web Dashboard

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Flask](https://img.shields.io/badge/Flask-Python-000000?style=for-the-badge&logo=flask)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

> **Final Year Project — Multi-modal Deep Learning Approach (ResNet-18 + GRU) with a real-time interactive web dashboard.**

---

## 📌 Overview

RansomGuard AI is a multimodal ransomware detection system that combines:

- 🖼️ **Visual Analysis** — BytePlot image classification using ResNet-18
- 📄 **Behavioral Analysis** — System call sequence analysis using a GRU Network
- 🔀 **Late Fusion** — Combining both models for a final prediction (40/60 weighting)

The web dashboard bridges the gap between complex deep learning models and end-users by presenting results in a **clear, intuitive, and professional interface** with full AI explainability.

---

## 🎯 Key Results

| Metric | Score |
|--------|-------|
| ResNet-18 Image Accuracy | **99.98%** |
| GRU Text Accuracy | **95.15%** |
| ROC-AUC Score | **1.0000** |
| Training Samples | **224K+** |

---

## ✨ Features

- 📤 **Real-Time File Analysis** — Upload PNG BytePlot images or behavioral CSV files and get predictions in under 2 seconds
- 🧠 **AI Explainability** — Grad-CAM heatmaps for image inputs and behavioral operation analysis for CSV inputs
- 📊 **Interactive Visualizations** — Radar charts, bar charts, ROC curves, confusion matrices, and training history charts
- 🕓 **Scan History** — Persistent scan history stored in localStorage with export to CSV
- 📄 **PDF Report Generation** — Downloadable professional report for every scan using jsPDF
- 🎮 **Demo Mode** — Test the system instantly with pre-loaded sample files
- 💚 **Live System Health Monitoring** — Real-time status indicators for all backend components
- 📱 **Fully Responsive** — Works on desktop and mobile with a collapsible sidebar

---

## 🏗️ System Architecture

    User Browser (React)
          │
          │ HTTP/REST API Calls
          │ POST /predict (FormData)
          │ GET  /health
          ▼
    Flask Backend (Python)
          │
          ├── Image Processing → ResNet-18
          ├── CSV Processing   → GRU Network
          └── Late Fusion      → Final Prediction
                                    │
                                    ▼
                             JSON Response
                        (probabilities + explainability)

---

## 🗂️ Project Structure

    Web Dashboard/
    ├── backend/
    │   ├── app.py                    # Flask API server
    │   ├── hybrid_malware_model.pt   # Trained PyTorch model
    │   └── vocab.json                # GRU operation vocabulary
    │
    ├── frontend/
    │   └── src/
    │       ├── app/components/
    │       │   ├── LandingPage.tsx         # Public landing page
    │       │   ├── DashboardHome.tsx       # Main dashboard hub
    │       │   ├── DashboardLayout.tsx     # Sidebar navigation shell
    │       │   ├── UploadPage.tsx          # File upload interface
    │       │   ├── ResultsPage.tsx         # Scan results display
    │       │   ├── PerformancePage.tsx     # Model metrics & charts
    │       │   ├── DatasetPage.tsx         # Dataset information
    │       │   ├── AboutPage.tsx           # Project & team info
    │       │   └── ExplainabilityPanel.tsx # AI explainability UI
    │       └── services/
    │           ├── api.ts                  # API communication layer
    │           ├── history.ts              # Scan history management
    │           ├── pdfReport.ts            # PDF report generation
    │           └── csvExport.ts            # CSV export utility
    ---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Core UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Router DOM v6 | Routing |
| Recharts | Data visualization |
| jsPDF | PDF report generation |
| React Hot Toast | Notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| Flask (Python) | REST API server |
| PyTorch | Deep learning inference |
| PIL / TorchVision | Image processing |
| Pandas / NumPy | Data processing |
| Matplotlib | Grad-CAM visualization |
| Flask-CORS | Cross-origin requests |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.8+
- pip

### 1️⃣ Clone the Repository

    git clone https://github.com/SyedaSadafNaqvi/RansomGuard.git
    cd RansomGuard

### 2️⃣ Run the Backend

    cd backend
    pip install flask flask-cors torch torchvision pillow pandas numpy matplotlib
    python app.py

Backend will start at http://localhost:5000

### 3️⃣ Run the Frontend

    cd frontend
    npm install
    npm run dev

Frontend will start at http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Root health check |
| GET | /health | Returns model status and timestamp |
| POST | /predict | Accepts image or CSV, returns prediction and explainability |

---

## 📱 Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing Page | / | Public entry point with project stats |
| Dashboard Home | /dashboard | Activity hub with recent scans and system status |
| Upload | /dashboard/upload | File upload and analysis interface |
| Results | /dashboard/results | Full prediction output with explainability |
| Performance | /dashboard/performance | Model metrics, charts, and confusion matrices |
| Dataset | /dashboard/dataset | Training dataset information |
| About | /dashboard/about | Project and team information |

---

## 🎨 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | #00d9ff | Primary accent, borders, icons |
| Mint | #00ffc8 | Secondary accent, safe indicators |
| Red | #ff3366 | Malware or threat indicators |
| Purple | #8b5cf6 | Fusion or hybrid elements |
| Dark Background | #0a0a0f | Page background |
| Card Background | #12121c | Card or panel background |

---

## 🧠 How Grad-CAM Works

1. Registers hooks on ResNet-18 layer4
2. Performs forward pass to get class predictions
3. Backpropagates the predicted class score
4. Computes global average pooling of gradients
5. Produces a weighted activation map with ReLU and normalization
6. Generates a 3-panel visualization — Original | Heatmap | Overlay

> Based on Selvaraju et al. 2017 — Grad-CAM Visual Explanations from Deep Networks via Gradient-based Localization ICCV 2017

---

## ⚠️ Current Limitations

- No user authentication, localStorage only, not cross-device
- Flask dev server is single-threaded, not suitable for production
- No explicit file size limit enforced on the frontend
- Grad-CAM only available for image-based analysis

---

## 🔮 Future Enhancements

- [ ] JWT-based user authentication
- [ ] Real-time WebSocket updates during analysis
- [ ] Batch file analysis with queue system
- [ ] Ransomware family-level classification
- [ ] Model versioning and hot-swap via dashboard
- [ ] Gunicorn and Nginx production deployment

---

## 👩‍💻 Project Info

| Field | Details |
|-------|---------|
| Project | RansomGuard AI |
| Domain | Cybersecurity and Deep Learning |
| Type | Final Year Project FYP |
| GitHub | @SyedaSadafNaqvi |

---

## 📚 References

1. Selvaraju et al. 2017. Grad-CAM Visual Explanations from Deep Networks. ICCV 2017
2. React Documentation https://react.dev
3. Vite Documentation https://vitejs.dev
4. Flask Documentation https://flask.palletsprojects.com
5. Recharts https://recharts.org
6. jsPDF https://github.com/parallax/jsPDF
7. Tailwind CSS https://tailwindcss.com
8. Framer Motion https://motion.dev

---
⭐ Star this repo if you found it helpful!
