"""QubitPage® Quantum OS — Configuration."""
import os

# ── API Keys (loaded from /etc/qubitpage/keys.env via systemd) ──
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
IBM_QUANTUM_TOKEN = os.environ.get("IBM_QUANTUM_TOKEN", "")

# ── Amazon Braket (AWS) ──────────────────────────────────────
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

# ── Server ───────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 5050
DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
SECRET_KEY = os.environ.get("FLASK_SECRET", "change-me-in-production")

# ── IBM Quantum Backends ─────────────────────────────────────
IBM_BACKENDS = [
    "ibm_brisbane",    # 127 qubits
    "ibm_torino",      # 133 qubits
    "ibm_fez",         # 156 qubits
    "ibm_marrakech",   # 156 qubits
    "ibm_sherbrooke",  # 127 qubits
]
IBM_SIMULATOR = "ibmq_qasm_simulator"

# ── QPlang ───────────────────────────────────────────────────
QPLANG_VERSION = "1.0.0"
OS_VERSION = "1.1.0"
OS_NAME = "QubitPage® Quantum OS"
OS_CODENAME = "Genesis"
