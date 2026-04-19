from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import numpy as np
import json
import io
import base64
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.cm as cm

app = Flask(__name__)
CORS(app)

# ── DEVICE ─────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", DEVICE)

# ── IMAGE MODEL ─────────────────────────────────
image_model = models.resnet18(weights=None)
image_model.fc = nn.Linear(image_model.fc.in_features, 2)

# ── TEXT MODEL ──────────────────────────────────
class TextModel(nn.Module):
    def __init__(self):
        super(TextModel, self).__init__()
        self.embedding = nn.Embedding(80, 32)
        self.gru = nn.GRU(
            input_size=32,
            hidden_size=64,
            batch_first=True
        )
        self.fc1 = nn.Linear(64, 32)
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        x = self.embedding(x)
        _, h = self.gru(x)
        h = h[-1]
        x = torch.relu(self.fc1(h))
        x = self.fc2(x)
        return x

text_model = TextModel()

# ── HYBRID MODEL ───────────────────────────────
class HybridMalwareModel(nn.Module):
    def __init__(self, image_model, text_model):
        super(HybridMalwareModel, self).__init__()
        self.image_model = image_model
        self.text_model = text_model

    def forward(self, image=None, text=None):
        img_out = None
        txt_out = None
        if image is not None:
            img_out = self.image_model(image)
        if text is not None:
            txt_out = self.text_model(text)
        return img_out, txt_out

model = HybridMalwareModel(image_model, text_model)

# ── LOAD TRAINED MODEL ─────────────────────────
model.load_state_dict(
    torch.load("hybrid_malware_model.pt", map_location=DEVICE)
)
model.to(DEVICE)
model.eval()
print("Model Loaded Successfully")

# ── IMAGE TRANSFORM ────────────────────────────
image_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ── TEXT SETTINGS ──────────────────────────────
WINDOW_SIZE = 500
STRIDE = 250

with open("vocab.json", "r") as f:
    vocab = json.load(f)

# Reverse vocab for decoding
reverse_vocab = {v: k for k, v in vocab.items()}

# ── HELPER FUNCTIONS ───────────────────────────
def read_csv_with_encoding(file_storage):
    raw_bytes = file_storage.read()
    file_storage.seek(0)
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']
    for encoding in encodings:
        try:
            text_content = raw_bytes.decode(encoding)
            df = pd.read_csv(io.StringIO(text_content))
            print(f"Successfully read CSV with encoding: {encoding}")
            return df
        except (UnicodeDecodeError, UnicodeError):
            continue
        except Exception as e:
            print(f"Error with {encoding}: {str(e)}")
            continue
    try:
        text_content = raw_bytes.decode('utf-8', errors='ignore')
        df = pd.read_csv(io.StringIO(text_content))
        return df
    except Exception as e:
        raise ValueError(f"Could not read CSV file: {str(e)}")


def find_operation_column(df):
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    priority_columns = [
        'Operation', 'operation', 'OPERATION',
        'Op', 'op', 'OP',
        'Activity', 'activity', 'ACTIVITY',
        'Action', 'action', 'ACTION',
        'Event', 'event', 'EVENT',
        'Call', 'call', 'CALL',
        'Syscall', 'syscall', 'SYSCALL',
        'Function', 'function', 'FUNCTION',
        'API', 'api', 'Api',
    ]
    for col in priority_columns:
        if col in df.columns:
            return col
    for col in df.columns:
        col_lower = col.lower()
        for pattern in ['operation', 'activity', 'action', 'event', 'call', 'api', 'func']:
            if pattern in col_lower:
                return col
    for col in df.columns:
        if df[col].dtype == object:
            non_null_count = df[col].notna().sum()
            if non_null_count > 0:
                return col
    if len(df.columns) > 0:
        return df.columns[0]
    return None


# ── GRAD-CAM ───────────────────────────────────
def generate_gradcam(image_tensor, model):
    """Generate Grad-CAM heatmap for the image model"""
    resnet = model.image_model

    # Storage for activations and gradients
    activations = []
    gradients = []

    # Hook into the last conv layer of ResNet-18 (layer4)
    def forward_hook(module, input, output):
        activations.append(output.detach())

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    # Register hooks on layer4 (last residual block)
    target_layer = resnet.layer4[-1]
    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_full_backward_hook(backward_hook)

    # Forward pass
    resnet.eval()
    output = resnet(image_tensor)
    pred_class = output.argmax(dim=1).item()

    # Backward pass for the predicted class
    resnet.zero_grad()
    output[0, pred_class].backward()

    # Remove hooks
    fh.remove()
    bh.remove()

    # Compute Grad-CAM
    act = activations[0].squeeze()  # [C, H, W]
    grad = gradients[0].squeeze()   # [C, H, W]

    # Global average pooling of gradients
    weights = grad.mean(dim=(1, 2))  # [C]

    # Weighted combination of activation maps
    cam = torch.zeros(act.shape[1:], dtype=torch.float32).to(DEVICE)
    for i, w in enumerate(weights):
        cam += w * act[i]

    # ReLU and normalize
    cam = F.relu(cam)
    cam = cam - cam.min()
    if cam.max() > 0:
        cam = cam / cam.max()

    cam = cam.cpu().numpy()

    # Resize to 224x224
    cam_resized = np.uint8(255 * cam)
    cam_pil = Image.fromarray(cam_resized).resize((224, 224), Image.BILINEAR)
    cam_resized = np.array(cam_pil) / 255.0

    return cam_resized, pred_class


def cam_to_base64(cam_array, original_image_tensor):
    """Convert Grad-CAM array to base64 encoded overlay image"""
    # Denormalize original image
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img = original_image_tensor.squeeze().cpu() * std + mean
    img = img.clamp(0, 1).permute(1, 2, 0).numpy()

    # Create heatmap
    heatmap = cm.jet(cam_array)[:, :, :3]

    # Overlay
    overlay = 0.5 * img + 0.5 * heatmap
    overlay = np.clip(overlay, 0, 1)

    # Convert to base64
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    axes[0].imshow(img)
    axes[0].set_title('Original Image', fontsize=12, color='white')
    axes[0].axis('off')

    axes[1].imshow(heatmap)
    axes[1].set_title('Grad-CAM Heatmap', fontsize=12, color='white')
    axes[1].axis('off')

    axes[2].imshow(overlay)
    axes[2].set_title('Overlay', fontsize=12, color='white')
    axes[2].axis('off')

    fig.patch.set_facecolor('#0a0a0f')
    plt.tight_layout()

    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight',
                facecolor='#0a0a0f', dpi=150)
    plt.close(fig)
    buffer.seek(0)

    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return img_base64


# ── OPERATION ANALYSIS ─────────────────────────
def analyze_operations(operations, vocab):
    """Analyze operation frequency and risk patterns"""

    # Count frequencies
    op_counts = {}
    for op in operations:
        op_counts[op] = op_counts.get(op, 0) + 1

    total = len(operations)

    # Define risk categories
    high_risk_ops = [
        'WriteFile', 'TCP Send', 'TCP Receive', 'UDP Send', 'UDP Receive',
        'CreateFile', 'RegSetValue', 'RegDeleteKey', 'RegDeleteValue',
        'Process Create', 'Thread Create', 'Load Image',
    ]

    medium_risk_ops = [
        'RegOpenKey', 'RegQueryValue', 'RegEnumValue', 'RegEnumKey',
        'CreateFileMapping', 'FileSystemControl', 'DeviceIoControl',
        'QueryOpen',
    ]

    low_risk_ops = [
        'ReadFile', 'CloseFile', 'RegCloseKey', 'RegQueryKey',
        'QueryBasicInformationFile', 'QueryStandardInformationFile',
        'IRP_MJ_CLOSE', 'FASTIO_RELEASE_FOR_SECTION_SYNCHRONIZATION',
    ]

    # Calculate risk breakdown
    high_count = sum(op_counts.get(op, 0) for op in high_risk_ops)
    medium_count = sum(op_counts.get(op, 0) for op in medium_risk_ops)
    low_count = sum(op_counts.get(op, 0) for op in low_risk_ops)

    # Top operations
    sorted_ops = sorted(op_counts.items(), key=lambda x: x[1], reverse=True)
    top_operations = []
    for op_name, count in sorted_ops[:10]:
        risk = "high"
        if op_name in high_risk_ops:
            risk = "high"
        elif op_name in medium_risk_ops:
            risk = "medium"
        else:
            risk = "low"

        top_operations.append({
            "operation": op_name,
            "count": count,
            "percentage": round((count / total) * 100, 2),
            "risk_level": risk
        })

    # Suspicious patterns
    suspicious_patterns = []

    write_ratio = op_counts.get('WriteFile', 0) / max(total, 1)
    if write_ratio > 0.3:
        suspicious_patterns.append({
            "pattern": "High Write Activity",
            "description": f"WriteFile operations make up {write_ratio*100:.1f}% of all operations",
            "severity": "high"
        })

    network_ops = sum(op_counts.get(op, 0) for op in ['TCP Send', 'TCP Receive', 'UDP Send', 'UDP Receive'])
    if network_ops > 0:
        suspicious_patterns.append({
            "pattern": "Network Activity Detected",
            "description": f"{network_ops} network operations found",
            "severity": "high"
        })

    reg_write_ops = sum(op_counts.get(op, 0) for op in ['RegSetValue', 'RegDeleteKey', 'RegDeleteValue'])
    if reg_write_ops > 0:
        suspicious_patterns.append({
            "pattern": "Registry Modification",
            "description": f"{reg_write_ops} registry write/delete operations detected",
            "severity": "medium"
        })

    if op_counts.get('Process Create', 0) > 0:
        suspicious_patterns.append({
            "pattern": "Process Creation",
            "description": f"{op_counts['Process Create']} new processes created",
            "severity": "high"
        })

    if len(suspicious_patterns) == 0:
        suspicious_patterns.append({
            "pattern": "Normal Activity",
            "description": "No suspicious behavioral patterns detected",
            "severity": "low"
        })

    return {
        "total_operations": total,
        "unique_operations": len(op_counts),
        "top_operations": top_operations,
        "risk_breakdown": {
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
        },
        "suspicious_patterns": suspicious_patterns
    }


# ── ROUTES ─────────────────────────────────────
@app.route("/")
def home():
    return "Hybrid Malware Detection API Running"


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'model_loaded': True,
        'image_model': 'ResNet-18',
        'text_model': 'GRU',
        'timestamp': datetime.now().isoformat()
    })


# ── PREDICT ROUTE (UPDATED WITH EXPLAINABILITY) ──
@app.route("/predict", methods=["POST"])
def predict():

    has_image = "image" in request.files
    has_csv = "csv" in request.files

    if not has_image and not has_csv:
        return jsonify({"error": "Please upload at least one file (image or csv)"}), 400

    image_tensor = None
    text_tensor = None
    image_prob = None
    text_prob = None
    gradcam_base64 = None
    operation_analysis = None
    operations_list = None

    try:
        # ── IMAGE PROCESSING ───────────────────────
        if has_image:
            image_file = request.files["image"]
            image = Image.open(image_file).convert("RGB")
            image_tensor = image_transform(image).unsqueeze(0).to(DEVICE)

        # ── CSV PROCESSING ─────────────────────────
        if has_csv:
            csv_file = request.files["csv"]
            df = read_csv_with_encoding(csv_file)

            print(f"CSV columns: {list(df.columns)}")
            print(f"CSV shape: {df.shape}")

            if 'Unnamed: 0' in df.columns:
                df = df.drop('Unnamed: 0', axis=1)

            op_column = find_operation_column(df)

            if op_column is None:
                return jsonify({
                    "error": "Could not find suitable data column in CSV",
                    "columns_found": list(df.columns)
                }), 400

            operations_list = df[op_column].fillna('UNKNOWN').astype(str).values

            print(f"Using column '{op_column}' with {len(operations_list)} operations")

            # Analyze operations for explainability
            operation_analysis = analyze_operations(operations_list, vocab)

            sequences = []
            for start in range(0, len(operations_list) - WINDOW_SIZE + 1, STRIDE):
                window = operations_list[start:start + WINDOW_SIZE]
                encoded = [vocab.get(op, 1) for op in window]
                sequences.append(encoded)

            if len(sequences) == 0:
                encoded = [vocab.get(op, 1) for op in operations_list[:WINDOW_SIZE]]
                encoded += [0] * (WINDOW_SIZE - len(encoded))
                sequences = [encoded]

            text_tensor = torch.LongTensor(
                np.array(sequences, dtype=np.int32)
            ).to(DEVICE)

        # ── MODEL PREDICTION ───────────────────────
        with torch.no_grad():
            img_out, txt_out = model(image_tensor, text_tensor)

            if img_out is not None:
                image_prob = F.softmax(img_out, dim=1)[0][1].item()

            if txt_out is not None:
                text_prob = torch.sigmoid(txt_out).mean().item()

            if image_prob is not None and text_prob is not None:
                final_prob = (0.4 * image_prob) + (0.6 * text_prob)
                analysis_type = "hybrid"
            elif image_prob is not None:
                final_prob = image_prob
                analysis_type = "image"
            else:
                final_prob = text_prob
                analysis_type = "text"

            label = "Malware" if final_prob > 0.3 else "Benign"

        # ── GRAD-CAM (only for image analysis) ─────
        if has_image and image_tensor is not None:
            try:
                cam_array, pred_class = generate_gradcam(
                    image_tensor, model
                )
                gradcam_base64 = cam_to_base64(
                    cam_array, image_tensor
                )
            except Exception as e:
                print(f"Grad-CAM error: {str(e)}")
                gradcam_base64 = None

        # ── BUILD RESPONSE ─────────────────────────
        response = {
            "image_probability": image_prob,
            "text_probability": text_prob,
            "final_probability": final_prob,
            "prediction": label,
            "analysis_type": analysis_type,
            "explainability": {
                "gradcam": gradcam_base64,
                "operation_analysis": operation_analysis,
            }
        }

        return jsonify(response)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)