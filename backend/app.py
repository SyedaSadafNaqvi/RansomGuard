from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image, ImageFilter
import pandas as pd
import numpy as np
import json
import io
import base64
import os
import math
import subprocess
import tempfile
import matplotlib
matplotlib.use('Agg')
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

reverse_vocab = {v: k for k, v in vocab.items()}

# ════════════════════════════════════════════════
# ── ALLOWED EXTENSIONS ──────────────────────────
# ════════════════════════════════════════════════

ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp'}
ALLOWED_CSV_EXTENSIONS = {'.csv'}

# ── BEHAVIORAL KEYWORDS ─────────────────────────
BEHAVIORAL_KEYWORDS = {
    'readfile', 'writefile', 'createfile', 'closefile',
    'deletefile', 'renamefile', 'openfile',
    'queryopen', 'setinformation',
    'regsetvalue', 'regqueryvalue', 'regopenkey',
    'regcreatekey', 'regdeletekey', 'regclosekey',
    'regenumkey', 'regenumvalue', 'regquerykey',
    'tcp send', 'tcp receive', 'udp send', 'udp receive',
    'tcpsend', 'tcpreceive', 'udpsend', 'udpreceive',
    'process create', 'thread create', 'load image',
    'processcreate', 'threadcreate', 'loadimage',
    'irp_mj', 'fastio', 'ntcreate', 'zwcreate',
    'deviceiocontrol', 'filesystemcontrol',
    'createfilemapping',
    'read', 'write', 'create', 'delete', 'open',
    'close', 'rename', 'query', 'set', 'enum',
    'send', 'receive', 'connect', 'listen',
}

OPERATION_COLUMN_NAMES = {
    'operation', 'op', 'activity', 'action',
    'event', 'call', 'syscall', 'function',
    'api', 'func', 'type', 'category',
}

# ════════════════════════════════════════════════
# ── IMAGE VALIDATION ────────────────────────────
# ════════════════════════════════════════════════

def get_file_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext.lower()


def compute_image_entropy(gray_array: np.ndarray) -> float:
    histogram, _ = np.histogram(
        gray_array.flatten(), bins=256, range=(0, 256)
    )
    histogram = histogram[histogram > 0]
    probabilities = histogram / histogram.sum()
    entropy = -np.sum(probabilities * np.log2(probabilities))
    return float(entropy)


def is_byteplot(pil_image: Image.Image) -> dict:
    img_rgb = np.array(pil_image.convert("RGB")).astype(float)
    img_gray = np.array(pil_image.convert("L"))

    r = img_rgb[:, :, 0]
    g = img_rgb[:, :, 1]
    b = img_rgb[:, :, 2]
    rg_diff = np.mean(np.abs(r - g))
    rb_diff = np.mean(np.abs(r - b))
    gb_diff = np.mean(np.abs(g - b))
    avg_color_diff = float((rg_diff + rb_diff + gb_diff) / 3)

    entropy = compute_image_entropy(img_gray)
    std_dev = float(np.std(img_gray))

    edges = np.array(
        pil_image.convert("L").filter(ImageFilter.FIND_EDGES)
    )
    edge_ratio = float(np.mean(edges) / 255.0)

    stats = {
        "avg_color_diff": round(avg_color_diff, 2),
        "entropy": round(entropy, 3),
        "std_dev": round(std_dev, 2),
        "edge_ratio": round(edge_ratio, 4),
    }
    print(f"Byteplot stats: {stats}")

    if avg_color_diff > 8.0:
        return {
            "is_byteplot": False,
            "reason": (
                f"Image has color variation "
                f"(channel difference: {avg_color_diff:.1f}). "
                f"Byteplot images are pure grayscale "
                f"visualizations of binary data."
            ),
            "stats": stats
        }

    if 3.0 < entropy < 7.5 and edge_ratio < 0.04:
        return {
            "is_byteplot": False,
            "reason": (
                f"Image has photo-like characteristics. "
                f"Smooth gradients detected "
                f"(edge complexity: {edge_ratio:.3f}) "
                f"with medium entropy ({entropy:.2f}). "
                f"This appears to be a regular photo "
                f"or screenshot, not a byteplot."
            ),
            "stats": stats
        }

    if edge_ratio > 0.05 and avg_color_diff < 8.0:
        return {
            "is_byteplot": True,
            "reason": (
                "Active byteplot detected "
                "with binary code patterns."
            ),
            "stats": stats
        }

    if entropy < 3.0 and std_dev < 30.0 and avg_color_diff < 3.0:
        return {
            "is_byteplot": True,
            "reason": (
                "Sparse byteplot detected "
                "(benign file with padding)."
            ),
            "stats": stats
        }

    if entropy > 7.0 and avg_color_diff < 8.0:
        return {
            "is_byteplot": True,
            "reason": "High entropy grayscale byteplot detected.",
            "stats": stats
        }

    return {
        "is_byteplot": False,
        "reason": (
            f"Image does not match byteplot characteristics. "
            f"Entropy: {entropy:.2f}, "
            f"Edge complexity: {edge_ratio:.3f}, "
            f"Std dev: {std_dev:.1f}. "
            f"Please upload a valid byteplot "
            f"of an executable file."
        ),
        "stats": stats
    }


def validate_image_file(file_storage) -> dict:
    filename = file_storage.filename

    if not filename:
        return {"valid": False, "error": "No filename provided."}

    ext = get_file_extension(filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return {
            "valid": False,
            "error": (
                f"Invalid extension '{ext}'. "
                f"Allowed: PNG, JPG, JPEG, BMP."
            )
        }

    file_bytes = file_storage.read()
    file_storage.seek(0)

    if len(file_bytes) < 100:
        return {"valid": False, "error": "File is too small."}

    try:
        pil_image = Image.open(
            io.BytesIO(file_bytes)
        ).convert("RGB")
    except Exception as e:
        return {
            "valid": False,
            "error": f"Cannot open image: {str(e)}"
        }

    width, height = pil_image.size
    if width < 8 or height < 8:
        return {
            "valid": False,
            "error": "Image dimensions too small."
        }

    byteplot_result = is_byteplot(pil_image)
    print(f"Is byteplot: {byteplot_result['is_byteplot']}")

    if not byteplot_result["is_byteplot"]:
        return {
            "valid": False,
            "error": byteplot_result["reason"],
            "error_type": "not_byteplot",
            "suggestion": (
                "Please upload a byteplot image generated "
                "from an executable file (.exe, .dll). "
                "A byteplot is a grayscale binary visualization "
                "of file bytes — not a regular photo or screenshot."
            ),
            "stats": byteplot_result.get("stats", {})
        }

    return {"valid": True, "pil_image": pil_image}


# ════════════════════════════════════════════════
# ── CSV VALIDATION ──────────────────────────────
# ════════════════════════════════════════════════

def detect_behavioral_csv(df: pd.DataFrame) -> dict:
    col_names_lower = [col.lower().strip() for col in df.columns]

    has_operation_column = any(
        any(op_name in col for op_name in OPERATION_COLUMN_NAMES)
        for col in col_names_lower
    )

    if has_operation_column:
        for col in df.columns:
            if any(
                op_name in col.lower()
                for op_name in OPERATION_COLUMN_NAMES
            ):
                sample = (
                    df[col]
                    .dropna()
                    .astype(str)
                    .str.lower()
                    .head(50)
                    .tolist()
                )
                matched = sum(
                    1 for val in sample
                    if any(kw in val for kw in BEHAVIORAL_KEYWORDS)
                )
                if matched > 0:
                    return {
                        "is_behavioral": True,
                        "reason": (
                            f"Found operation column '{col}' "
                            f"with {matched} behavioral keywords."
                        ),
                        "operation_column": col
                    }

    for col in df.columns:
        if df[col].dtype == object:
            sample = (
                df[col]
                .dropna()
                .astype(str)
                .str.lower()
                .head(100)
                .tolist()
            )
            matched = sum(
                1 for val in sample
                if any(kw in val for kw in BEHAVIORAL_KEYWORDS)
            )
            if matched > max(5, len(sample) * 0.1):
                return {
                    "is_behavioral": True,
                    "reason": (
                        f"Column '{col}' contains "
                        f"{matched} behavioral keywords."
                    ),
                    "operation_column": col
                }

    numeric_col_count = df.select_dtypes(
        include=[np.number]
    ).shape[1]
    total_cols = df.shape[1]

    if total_cols > 0 and (numeric_col_count / total_cols) > 0.7:
        return {
            "is_behavioral": False,
            "reason": (
                f"CSV appears to be a generic data file "
                f"({numeric_col_count}/{total_cols} numeric columns). "
                f"Behavioral CSVs contain system operation sequences, "
                f"not numeric data tables."
            )
        }

    return {
        "is_behavioral": False,
        "reason": (
            "CSV does not contain behavioral/syscall data. "
            "No recognized operation keywords found. "
            "Please upload a behavioral log from Procmon, "
            "Cuckoo Sandbox, or similar tools."
        )
    }


def validate_csv_file(file_storage) -> dict:
    filename = file_storage.filename

    if not filename:
        return {"valid": False, "error": "No filename provided."}

    ext = get_file_extension(filename)
    if ext not in ALLOWED_CSV_EXTENSIONS:
        return {
            "valid": False,
            "error": (
                f"Invalid extension '{ext}'. "
                f"Only CSV files are supported."
            )
        }

    file_bytes = file_storage.read()
    file_storage.seek(0)

    if len(file_bytes) > 50 * 1024 * 1024:
        return {
            "valid": False,
            "error": "CSV file exceeds 50MB limit."
        }

    if len(file_bytes) < 10:
        return {
            "valid": False,
            "error": "CSV file is empty or too small."
        }

    df = None
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    for encoding in encodings:
        try:
            text = file_bytes.decode(encoding)
            df = pd.read_csv(io.StringIO(text))
            break
        except Exception:
            continue

    if df is None:
        return {
            "valid": False,
            "error": (
                "Cannot parse CSV file. "
                "File may be corrupted or invalid."
            )
        }

    if len(df) < 5:
        return {
            "valid": False,
            "error": (
                f"CSV has only {len(df)} rows. "
                f"Behavioral logs should have "
                f"many operation entries."
            )
        }

    print(f"CSV columns: {list(df.columns)}")
    print(f"CSV shape: {df.shape}")

    behavioral_check = detect_behavioral_csv(df)
    print(f"Behavioral check: {behavioral_check}")

    if not behavioral_check["is_behavioral"]:
        return {
            "valid": False,
            "error": behavioral_check["reason"],
            "error_type": "not_behavioral",
            "suggestion": (
                "Please upload a behavioral CSV file "
                "containing system call sequences. "
                "Supported formats: Procmon logs, "
                "Cuckoo Sandbox reports, or any CSV "
                "with an Operation column containing "
                "syscall names like ReadFile, WriteFile, "
                "RegSetValue, TCP Send, etc."
            )
        }

    return {"valid": True}


# ════════════════════════════════════════════════
# ── HELPER FUNCTIONS ────────────────────────────
# ════════════════════════════════════════════════

def read_csv_with_encoding(file_storage):
    raw_bytes = file_storage.read()
    file_storage.seek(0)
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']
    for encoding in encodings:
        try:
            text_content = raw_bytes.decode(encoding)
            df = pd.read_csv(io.StringIO(text_content))
            print(f"CSV encoding: {encoding}")
            return df
        except (UnicodeDecodeError, UnicodeError):
            continue
        except Exception as e:
            print(f"Error with {encoding}: {e}")
            continue
    try:
        text_content = raw_bytes.decode('utf-8', errors='ignore')
        return pd.read_csv(io.StringIO(text_content))
    except Exception as e:
        raise ValueError(f"Could not read CSV: {str(e)}")


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
        for pattern in [
            'operation', 'activity', 'action',
            'event', 'call', 'api', 'func'
        ]:
            if pattern in col.lower():
                return col
    for col in df.columns:
        if df[col].dtype == object:
            if df[col].notna().sum() > 0:
                return col
    return df.columns[0] if len(df.columns) > 0 else None


# ── GRAD-CAM ───────────────────────────────────
def generate_gradcam(image_tensor, model):
    resnet = model.image_model
    activations = []
    gradients = []

    def forward_hook(module, input, output):
        activations.append(output.detach())

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    target_layer = resnet.layer4[-1]
    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_full_backward_hook(backward_hook)

    resnet.eval()
    output = resnet(image_tensor)
    pred_class = output.argmax(dim=1).item()
    resnet.zero_grad()
    output[0, pred_class].backward()
    fh.remove()
    bh.remove()

    act = activations[0].squeeze()
    grad = gradients[0].squeeze()
    weights = grad.mean(dim=(1, 2))

    cam = torch.zeros(
        act.shape[1:], dtype=torch.float32
    ).to(DEVICE)
    for i, w in enumerate(weights):
        cam += w * act[i]

    cam = F.relu(cam)
    cam = cam - cam.min()
    if cam.max() > 0:
        cam = cam / cam.max()

    cam = cam.cpu().numpy()
    cam_resized = np.uint8(255 * cam)
    cam_pil = Image.fromarray(cam_resized).resize(
        (224, 224), Image.BILINEAR
    )
    return np.array(cam_pil) / 255.0, pred_class


def cam_to_base64(cam_array, original_image_tensor):
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img = original_image_tensor.squeeze().cpu() * std + mean
    img = img.clamp(0, 1).permute(1, 2, 0).numpy()

    heatmap = cm.jet(cam_array)[:, :, :3]
    overlay = np.clip(0.5 * img + 0.5 * heatmap, 0, 1)

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
    plt.savefig(
        buffer, format='png',
        bbox_inches='tight',
        facecolor='#0a0a0f',
        dpi=150
    )
    plt.close(fig)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')


# ── OPERATION ANALYSIS ─────────────────────────
def analyze_operations(operations, vocab):
    op_counts = {}
    for op in operations:
        op_counts[op] = op_counts.get(op, 0) + 1
    total = len(operations)

    high_risk_ops = [
        'WriteFile', 'TCP Send', 'TCP Receive',
        'UDP Send', 'UDP Receive', 'CreateFile',
        'RegSetValue', 'RegDeleteKey', 'RegDeleteValue',
        'Process Create', 'Thread Create', 'Load Image',
    ]
    medium_risk_ops = [
        'RegOpenKey', 'RegQueryValue', 'RegEnumValue',
        'RegEnumKey', 'CreateFileMapping',
        'FileSystemControl', 'DeviceIoControl', 'QueryOpen',
    ]

    high_count = sum(
        op_counts.get(op, 0) for op in high_risk_ops
    )
    medium_count = sum(
        op_counts.get(op, 0) for op in medium_risk_ops
    )
    low_count = max(total - high_count - medium_count, 0)

    sorted_ops = sorted(
        op_counts.items(), key=lambda x: x[1], reverse=True
    )
    top_operations = []
    for op_name, count in sorted_ops[:10]:
        risk = (
            "high" if op_name in high_risk_ops else
            "medium" if op_name in medium_risk_ops else
            "low"
        )
        top_operations.append({
            "operation": op_name,
            "count": count,
            "percentage": round((count / total) * 100, 2),
            "risk_level": risk
        })

    suspicious_patterns = []

    write_ratio = op_counts.get('WriteFile', 0) / max(total, 1)
    if write_ratio > 0.3:
        suspicious_patterns.append({
            "pattern": "High Write Activity",
            "description": (
                f"WriteFile is "
                f"{write_ratio * 100:.1f}% of operations"
            ),
            "severity": "high"
        })

    network_ops = sum(
        op_counts.get(op, 0) for op in
        ['TCP Send', 'TCP Receive', 'UDP Send', 'UDP Receive']
    )
    if network_ops > 0:
        suspicious_patterns.append({
            "pattern": "Network Activity Detected",
            "description": (
                f"{network_ops} network operations found"
            ),
            "severity": "high"
        })

    reg_write = sum(
        op_counts.get(op, 0) for op in
        ['RegSetValue', 'RegDeleteKey', 'RegDeleteValue']
    )
    if reg_write > 0:
        suspicious_patterns.append({
            "pattern": "Registry Modification",
            "description": (
                f"{reg_write} registry modifications"
            ),
            "severity": "medium"
        })

    if op_counts.get('Process Create', 0) > 0:
        suspicious_patterns.append({
            "pattern": "Process Creation",
            "description": (
                f"{op_counts['Process Create']} "
                f"new processes created"
            ),
            "severity": "high"
        })

    if not suspicious_patterns:
        suspicious_patterns.append({
            "pattern": "Normal Activity",
            "description": (
                "No suspicious behavioral patterns detected"
            ),
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


# ════════════════════════════════════════════════
# ── NEW: BINARY FILE SUPPORT ────────────────────
# Added on top of original — does NOT touch /predict
# ════════════════════════════════════════════════

def binary_to_byteplot(file_bytes: bytes) -> Image.Image:
    """
    Convert any binary file to a grayscale byteplot image.
    Same method used to generate the Malex-200k training dataset.
    Width=256 matches dataset naming (_img_256).
    """
    raw    = np.frombuffer(file_bytes, dtype=np.uint8)
    width  = 256
    height = math.ceil(len(raw) / width)
    padded = np.zeros(width * height, dtype=np.uint8)
    padded[:len(raw)] = raw
    return Image.fromarray(padded.reshape(height, width), mode="L")


def check_ms_signature(file_bytes: bytes, filename: str) -> bool:
    """
    Check if file has a valid Microsoft Authenticode signature.
    Windows only. Returns True = signed by Microsoft = safe to mark Benign.
    """
    if os.name != "nt":
        return False
    suffix   = os.path.splitext(filename)[1] or ".bin"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             f'$s=(Get-AuthenticodeSignature "{tmp_path}");'
             f'"STATUS:"+$s.Status+"||SUBJECT:"+$s.SignerCertificate.Subject'],
            capture_output=True, text=True, timeout=10
        )
        out = result.stdout.strip()
        return "STATUS:Valid" in out and "Microsoft" in out.split("SUBJECT:")[-1]
    except Exception:
        return False
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


def img_to_b64_binary(img: Image.Image, max_h: int = 400) -> str:
    """Resize tall byteplots for display, return base64 PNG."""
    buf  = io.BytesIO()
    disp = img.copy()
    w, h = disp.size
    if h > max_h:
        disp = disp.resize((int(w * max_h / h), max_h), Image.NEAREST)
    disp.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ════════════════════════════════════════════════
# ── ROUTES (ORIGINAL — UNTOUCHED) ───────────────
# ════════════════════════════════════════════════

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
        'binary_support': True,          # new field — signals feature is active
        'timestamp': datetime.now().isoformat()
    })


@app.route("/predict", methods=["POST"])
def predict():
    # ── THIS FUNCTION IS IDENTICAL TO YOUR ORIGINAL ──
    print(f"\n── New Request ──────────────────────")
    print(f"Files: {list(request.files.keys())}")

    has_image = "image" in request.files
    has_csv = "csv" in request.files

    if not has_image and not has_csv:
        return jsonify({
            "error": (
                "Please upload at least one file "
                "(image or csv)"
            )
        }), 400

    image_tensor = None
    text_tensor = None
    image_prob = None
    text_prob = None
    gradcam_base64 = None
    operation_analysis = None

    try:
        if has_image:
            image_file = request.files["image"]
            print(f"Image: {image_file.filename}")

            validation = validate_image_file(image_file)

            if not validation["valid"]:
                print(f"Rejected: {validation.get('error')}")
                return jsonify({
                    "error": validation["error"],
                    "error_type": validation.get(
                        "error_type", "invalid_file"
                    ),
                    "suggestion": validation.get(
                        "suggestion", ""
                    ),
                    "valid_file": False
                }), 400

            image = validation["pil_image"]
            image_tensor = (
                image_transform(image).unsqueeze(0).to(DEVICE)
            )

        if has_csv:
            csv_file = request.files["csv"]
            print(f"CSV: {csv_file.filename}")

            csv_val = validate_csv_file(csv_file)

            if not csv_val["valid"]:
                print(f"CSV Rejected: {csv_val.get('error')}")
                return jsonify({
                    "error": csv_val["error"],
                    "error_type": csv_val.get(
                        "error_type", "invalid_csv"
                    ),
                    "suggestion": csv_val.get(
                        "suggestion", ""
                    ),
                    "valid_file": False
                }), 400

            df = read_csv_with_encoding(csv_file)

            if 'Unnamed: 0' in df.columns:
                df = df.drop('Unnamed: 0', axis=1)

            op_column = find_operation_column(df)

            if op_column is None:
                return jsonify({
                    "error": (
                        "Could not find operation column in CSV."
                    ),
                    "columns_found": list(df.columns)
                }), 400

            operations_list = (
                df[op_column]
                .fillna('UNKNOWN')
                .astype(str)
                .values
            )
            print(
                f"Column: '{op_column}', "
                f"Rows: {len(operations_list)}"
            )

            operation_analysis = analyze_operations(
                operations_list, vocab
            )

            sequences = []
            for start in range(
                0,
                len(operations_list) - WINDOW_SIZE + 1,
                STRIDE
            ):
                window = operations_list[
                    start:start + WINDOW_SIZE
                ]
                encoded = [vocab.get(op, 1) for op in window]
                sequences.append(encoded)

            if not sequences:
                encoded = [
                    vocab.get(op, 1)
                    for op in operations_list[:WINDOW_SIZE]
                ]
                encoded += [0] * (WINDOW_SIZE - len(encoded))
                sequences = [encoded]

            text_tensor = torch.LongTensor(
                np.array(sequences, dtype=np.int32)
            ).to(DEVICE)

        with torch.no_grad():
            img_out, txt_out = model(image_tensor, text_tensor)

            if img_out is not None:
                image_prob = (
                    F.softmax(img_out, dim=1)[0][1].item()
                )
                print(f"Image prob: {image_prob:.4f}")

            if txt_out is not None:
                text_prob = (
                    torch.sigmoid(txt_out).mean().item()
                )
                print(f"Text prob: {text_prob:.4f}")

            if image_prob is not None and text_prob is not None:
                final_prob = (
                    (0.4 * image_prob) + (0.6 * text_prob)
                )
                analysis_type = "hybrid"
            elif image_prob is not None:
                final_prob = image_prob
                analysis_type = "image"
            else:
                final_prob = text_prob
                analysis_type = "text"

            print(f"Final prob: {final_prob:.4f}")
            label = "Malware" if final_prob > 0.5 else "Benign"
            print(f"Prediction: {label}")

        if has_image and image_tensor is not None:
            try:
                cam_array, _ = generate_gradcam(
                    image_tensor, model
                )
                gradcam_base64 = cam_to_base64(
                    cam_array, image_tensor
                )
            except Exception as e:
                print(f"Grad-CAM error: {e}")
                gradcam_base64 = None

        return jsonify({
            "image_probability": image_prob,
            "text_probability": text_prob,
            "final_probability": final_prob,
            "prediction": label,
            "analysis_type": analysis_type,
            "valid_file": True,
            "explainability": {
                "gradcam": gradcam_base64,
                "operation_analysis": operation_analysis,
            }
        })

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Analysis failed: {str(e)}"
        }), 500


# ════════════════════════════════════════════════
# ── NEW ROUTE: /predict_binary ──────────────────
# Accepts raw binary files (.exe .dll .sys .bin etc.)
# Converts to byteplot → runs through image_model (ResNet-18)
# Does NOT affect /predict at all
# ════════════════════════════════════════════════

@app.route("/predict_binary", methods=["POST"])
def predict_binary():
    """
    New endpoint for raw binary file analysis.

    POST a binary file in field "binary"
    Returns same probability format as /predict for easy frontend use.

    Flow:
      binary file → byteplot (width=256, Nataraj method)
                  → Resize(224,224) → ResNet-18 → prediction
    """
    print(f"\n── Binary File Request ──────────────")

    if "binary" not in request.files:
        return jsonify({
            "error": "No file uploaded. Send binary file in field 'binary'."
        }), 400

    f        = request.files["binary"]
    filename = f.filename or "upload.bin"
    raw      = f.read()

    if not raw:
        return jsonify({"error": "File is empty."}), 400

    print(f"Binary: {filename}  ({len(raw)//1024} KB)")

    # ── Reject plain text files ───────────────────────────────────
    try:
        raw[:256].decode("utf-8")
        # If we get here it decoded as text — likely a text file
        non_printable = sum(
            1 for b in raw[:256]
            if b == 0 or b > 0x7E
        )
        if non_printable < 5:
            return jsonify({
                "error": (
                    f"'{filename}' appears to be a plain text file. "
                    "Please upload a binary executable "
                    "(.exe, .dll, .sys, .bin, etc.)."
                ),
                "valid_file": False
            }), 400
    except UnicodeDecodeError:
        pass  # Expected — real binaries can't decode as UTF-8

    # ── Microsoft signature check (Windows only) ──────────────────
    if check_ms_signature(raw, filename):
        print(f"Microsoft-signed file — returning Benign")
        byteplot_img = binary_to_byteplot(raw)
        b64 = img_to_b64_binary(byteplot_img)
        return jsonify({
            "prediction":        "Benign",
            "image_probability": 0.0,
            "text_probability":  None,
            "final_probability": 0.0,
            "analysis_type":     "binary_image",
            "valid_file":        True,
            "ms_signed":         True,
            "filename":          filename,
            "file_size_kb":      round(len(raw) / 1024, 1),
            "byteplot_b64":      b64,
            "note": "Microsoft-signed binary — classified Benign without model inference.",
            "explainability": {
                "gradcam": None,
                "operation_analysis": None
            }
        })

    # ── Convert to byteplot ───────────────────────────────────────
    try:
        byteplot_img = binary_to_byteplot(raw)
        b64 = img_to_b64_binary(byteplot_img)
        print(f"Byteplot: 256×{byteplot_img.height} px")
    except Exception as e:
        return jsonify({"error": f"Byteplot conversion failed: {e}"}), 500

    # ── Run through ResNet-18 (image_model path) ──────────────────
    try:
        img_rgb    = byteplot_img.convert("RGB")
        img_tensor = image_transform(img_rgb).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            img_out, _ = model(img_tensor, None)
            image_prob  = F.softmax(img_out, dim=1)[0][1].item()

        final_prob = image_prob
        label      = "Malware" if final_prob > 0.5 else "Benign"
        print(f"Prediction: {label}  ({final_prob:.4f})")

        # ── Grad-CAM for the byteplot ─────────────────────────────
        gradcam_b64 = None
        try:
            cam_array, _ = generate_gradcam(img_tensor, model)
            gradcam_b64  = cam_to_base64(cam_array, img_tensor)
        except Exception as e:
            print(f"Grad-CAM error: {e}")

        return jsonify({
            "prediction":        label,
            "image_probability": round(image_prob, 4),
            "text_probability":  None,
            "final_probability": round(final_prob, 4),
            "analysis_type":     "binary_image",
            "valid_file":        True,
            "ms_signed":         False,
            "filename":          filename,
            "file_size_kb":      round(len(raw) / 1024, 1),
            "byteplot_size":     f"256×{byteplot_img.height}",
            "byteplot_b64":      b64,
            "explainability": {
                "gradcam":            gradcam_b64,
                "operation_analysis": None
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Model inference failed: {e}"}), 500


if __name__ == "__main__":
    print("=" * 55)
    print("  RansomGuard — Hybrid Malware Detection API")
    print(f"  Device : {DEVICE}")
    print("  Routes :")
    print("    POST /predict        — image + CSV (original)")
    print("    POST /predict_binary — raw binary files (new)")
    print("    GET  /health         — status check")
    print("=" * 55)
    app.run(debug=True)