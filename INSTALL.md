# QubitPage® OS — Installation Guide

> **Version:** 1.1.0 | **Platform:** Ubuntu 22.04 LTS (GCP/AWS/bare-metal) | **Python:** 3.10+

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Quick Install (5 minutes)](#2-quick-install)
3. [Configuration](#3-configuration)
4. [Running as a systemd Service](#4-running-as-a-systemd-service)
5. [IBM Quantum Setup](#5-ibm-quantum-setup)
6. [MedGemma Setup](#6-medgemma-setup)
7. [Verifying Installation](#7-verifying-installation)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 vCPUs | 8+ vCPUs |
| RAM | 8 GB | 16–32 GB |
| Storage | 20 GB SSD | 100 GB SSD |
| Python | 3.10 | 3.11 |
| OS | Ubuntu 22.04 | Ubuntu 22.04 LTS |
| GPU | — | NVIDIA (for MedGemma LoRA) |

**Ports required:**
- `5050` — QubitPage® OS web interface
- `5051` — MedGemma AI service (optional)
- `80/443` — HTTPS (if using nginx reverse proxy)

---

## 2. Quick Install

```bash
# 1. Clone the repository
git clone https://github.com/qubitpage/QubitPage-OS.git
cd QubitPage-OS

# 2. Create Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install all Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Install Stim (quantum error correction engine)
pip install stim>=1.13

# 5. Create the environment file (copy and fill in your keys)
sudo mkdir -p /etc/qubitpage
sudo cp examples/keys.env.example /etc/qubitpage/keys.env
sudo nano /etc/qubitpage/keys.env    # fill in your API keys

# 6. Start the server
python3 src/app.py
```

Then open: **http://localhost:5050**

---

## 3. Configuration

All API keys are read from environment variables. **Never hardcode secrets.**

### `/etc/qubitpage/keys.env` (example)

```bash
# === QubitPage® OS — Environment Variables ===

# IBM Quantum (obtain at https://quantum.ibm.com)
IBM_QUANTUM_TOKEN=your_ibm_token_here

# Google AI / Gemini (obtain at https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_key_here

# Groq AI (obtain at https://console.groq.com)
GROQ_API_KEY=your_groq_key_here

# Amazon Braket (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

# Flask
FLASK_SECRET=change-me-to-a-random-32-char-string
FLASK_DEBUG=0
```

Load environment from file:
```bash
export $(grep -v '^#' /etc/qubitpage/keys.env | xargs)
```

---

## 4. Running as a systemd Service

```bash
# Copy the systemd unit file
sudo cp examples/qubitpage-os.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable qubitpage-os
sudo systemctl start qubitpage-os

# Check status
sudo systemctl status qubitpage-os
```

### `/etc/systemd/system/qubitpage-os.service` (example):

```ini
[Unit]
Description=QubitPage® Quantum OS v1.1.0
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/QubitPage-OS
EnvironmentFile=/etc/qubitpage/keys.env
ExecStart=/home/ubuntu/QubitPage-OS/.venv/bin/python3 src/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 5. IBM Quantum Setup

1. Create an account at [quantum.ibm.com](https://quantum.ibm.com)
2. Get your API token from **Account → Copy token**
3. Add to `/etc/qubitpage/keys.env`:
   ```
   IBM_QUANTUM_TOKEN=your_token_here
   ```
4. Restart QubitPage® OS
5. Open the Circuit Lab app → select **IBM Fez**, **IBM Sherbrooke** or other real backends

**Available IBM backends (default):**

| Backend | Qubits | Type |
|---------|--------|------|
| `ibm_fez` | 156 | Heavy-Hex, paid |
| `ibm_sherbrooke` | 127 | Heavy-Hex, paid |
| `ibm_brisbane` | 127 | Heavy-Hex, paid |
| `ibm_kyiv` | 127 | Heavy-Hex, paid |
| `simulator_mps` | 100 | Simulator, free |
| `statevector_simulator` | 32 | Simulator, free |

---

## 6. MedGemma Setup

MedGemma is Google's medical AI model for disease diagnosis assistance.

```bash
# Install MedGemma service (runs on port 5051)
pip install torch transformers accelerate peft

# Start MedGemma service
python3 examples/medgemma_server.py --port 5051

# Verify health
curl http://localhost:5051/health
# Expected: {"status": "ok", "model": "medgemma-4b"}
```

See [docs/medgemma-integration.md](docs/medgemma-integration.md) for full setup.

---

## 7. Verifying Installation

```bash
# Check web server responds
curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/
# Expected: 200

# Check quantum engine
python3 -c "
from src.qubilogic import QubiLogicEngine
q = QubiLogicEngine()
result = q.bell_state()
print('Bell fidelity:', result['fidelity'])
"
# Expected: Bell fidelity: 0.9980

# Run test suite
python3 -m pytest src/test_qubilogic.py -v
```

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: stim` | `pip install stim>=1.13` |
| IBM backend offline | Use `simulator_mps` fallback |
| MedGemma timeout | Ensure port 5051 is running, check logs |
| CORS errors in browser | Check `CORS_ORIGINS` in config.py |
| `500 Internal Server Error` | Check `journalctl -u qubitpage-os -n 50` |
| Port 5050 already in use | `sudo lsof -i:5050` then kill the process |

For further help: [research@qubitpage.com](mailto:research@qubitpage.com) or open an issue at [GitHub](https://github.com/qubitpage/QubitPage-OS/issues)
