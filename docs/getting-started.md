# Getting Started with QubitPage® OS

## 5-Minute Quickstart

### Step 1: Clone and Install

```bash
git clone https://github.com/qubitpage/QubitPage-OS.git
cd QubitPage-OS
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Set Environment Variables

```bash
# Minimum (simulators only — no keys needed):
export FLASK_SECRET=my-secret-key-change-this

# For full AI features (free keys):
export GEMINI_API_KEY=your_key_from_aistudio.google.com
export GROQ_API_KEY=your_key_from_console.groq.com

# For real IBM Quantum hardware (optional):
export IBM_QUANTUM_TOKEN=your_token_from_quantum.ibm.com
```

### Step 3: Start the OS

```bash
python3 src/app.py
```

Open **http://localhost:5050** → The desktop loads in 2–3 seconds.

---

## Desktop Apps Tour

### Circuit Lab ⚛
The main quantum programming environment. Write QLang circuits and run them on IBM, Stim, or Cirq.

```
BELL2 q0 q1        → Creates Bell pair entanglement
GROVER target=rpoB  → Searches for enzyme binding sites
VQE mol=drug_A      → Runs variational quantum eigensolver
```

### Disease Hub 🏥
View the 7 diseases being researched: GBM, TB, AD, ALS, IPF, Parkinson's, Pancreatic Cancer.
Click any disease → see quantum drug candidates, ADMET scores, and AI analysis.

### MedGemma AI 🏥
Requires MedGemma running on port 5051. See [docs/medgemma-integration.md](medgemma-integration.md).
Ask medical questions, analyze compounds, request disease diagnosis assistance.

### ARIA AI Assistant 🤖
Powered by Gemini 2.0 Flash. Available in all apps. Just ask:
- "Explain this quantum circuit result"
- "What is the mechanism of DprE1 inhibition?"
- "Suggest drug targets for glioblastoma"

### QuBIOS / QubiLogic 🧠
Demonstrates the Transit Ring architecture in real-time:
- Creates Bell states with 99.80% fidelity
- Extends qubit lifespan 5×
- Runs Steane QEC error correction
- See [github.com/qubitpage/QuBIOS](https://github.com/qubitpage/QuBIOS)

---

## Related Documentation

- [INSTALL.md](../INSTALL.md) — Full installation guide
- [docs/medgemma-integration.md](medgemma-integration.md) — MedGemma setup
- [docs/quantum-simulators.md](quantum-simulators.md) — All backends
- [docs/ai-models.md](ai-models.md) — All AI models
- [docs/api-reference.md](api-reference.md) — REST API
- [github.com/qubitpage/QLang](https://github.com/qubitpage/QLang) — QLang language guide
- [github.com/qubitpage/QuBIOS](https://github.com/qubitpage/QuBIOS) — QuBIOS engine docs
