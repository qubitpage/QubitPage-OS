<div align="center">

<img src="https://img.shields.io/badge/QubitPage®-Quantum%20OS-00d4ff?style=for-the-badge&logo=atom&logoColor=white" />
<img src="https://img.shields.io/badge/Version-1.1.0-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python" />
<img src="https://img.shields.io/badge/IBM%20Quantum-Connected-purple?style=for-the-badge" />
<img src="https://img.shields.io/badge/MedGemma-Integrated-red?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

# QubitPage® Quantum OS

### *The world's first browser-based Quantum Operating System for AI-powered medical drug discovery*

> **Live Platform:** [qubitpage.com](https://qubitpage.com) &nbsp;|&nbsp; **Developed by:** Qubitpage® Research Team &nbsp;|&nbsp; **Version:** 1.1.0

</div>

---

## 📸 Platform Screenshot

![QubitPage® OS — Main Interface](https://raw.githubusercontent.com/qubitpage/QubitPage-OS/main/docs/screenshot-main.png)

> *QubitPage® OS desktop — A full web-based quantum OS with IBM Quantum integration, AI drug discovery, real medical research tools, and a MedGemma disease diagnosis assistant running in the browser.*

---

## 🌐 Ecosystem

| Repository | Description | Status |
|------------|-------------|--------|
| **[QubitPage-OS](https://github.com/qubitpage/QubitPage-OS)** | ← This repo — Full Quantum OS Platform | ✅ Live |
| **[QuBIOS](https://github.com/qubitpage/QuBIOS)** | Transit Ring quantum middleware engine | ✅ Live |
| **[QLang](https://github.com/qubitpage/QLang)** | Quantum Programming Language + Browser SDK | ✅ Live |

---

## 🔬 What Is QubitPage® OS?

QubitPage® OS is a complete **browser-based quantum operating system** that provides:

- **Desktop environment** — A full windowed OS in the browser with taskbar, app launcher, and multi-window support
- **Quantum Circuit Lab** — Write and run QLang circuits on **real IBM Quantum hardware** or local simulators
- **AI Drug Discovery** — Quantum-enhanced molecular simulation for diseases without cures (GBM, TB, Alzheimer's, ALS, IPF)
- **MedGemma AI** — Google's medical AI for disease diagnosis, ADMET prediction, and treatment analysis
- **QuBIOS Transit Ring** — 5× qubit lifespan extension with 99.80% Bell state fidelity
- **ARIA AI Assistant** — Gemini-powered research assistant integrated into every tool
- **Real Research Results** — 13 novel drug candidates discovered, IBM Fez real hardware validation

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QubitPage® OS  v1.1.0                            │
│                    Browser Desktop (os.html)                        │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Circuit  │ Quantum  │ ARIA AI  │MedGemma  │  QuBIOS  │  QuantumTB  │
│   Lab    │  Drug    │Assistant │  Diag.   │ QubiLgc  │  QuantumNrο │
│ (QLang)  │  Sim     │ (Gemini) │ Port5051 │TransitRg │  Disease Hub│
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────────┤
│                      quantum_kernel.py                              │
│              quantum_backends.py (IBM / AWS / Simulators)           │
├─────────────────────────────────────────────────────────────────────┤
│            qubilogic.py — QuBIOS Transit Ring Engine                │
│    TransitRing | SteaneQEC | TeleportEngine | EntanglementDistiller │
├─────────────────────────────────────────────────────────────────────┤
│                   IBM Quantum / Stim / Cirq / Qiskit                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/qubitpage/QubitPage-OS.git
cd QubitPage-OS

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Set API keys (see INSTALL.md for full guide)
export GEMINI_API_KEY=your_key_here
export IBM_QUANTUM_TOKEN=your_token_here  # optional, simulators work without it
export GROQ_API_KEY=your_key_here

python3 src/app.py
# → Open http://localhost:5050
```

Full setup guide: [INSTALL.md](INSTALL.md)

---

## 🧬 Installed Applications

| App | Icon | Description |
|-----|------|-------------|
| **Terminal** | `>_` | QLang quantum shell interpreter |
| **Circuit Lab** | ⚛ | Visual quantum circuit builder + IBM/Stim runner |
| **Quantum Oracle** | 🎮 | Interactive quantum algorithm playground |
| **Crypto Tools** | 🔐 | Quantum encryption, superdense coding, BB84 |
| **ARIA Assistant** | 🤖 | Gemini-powered AI research assistant |
| **QuBIOS / QubiLogic** | 🧠 | QuBIOS Transit Ring memory + entanglement lab |
| **QuantumNeuro** | 🧠 | GBM (glioblastoma) quantum drug discovery |
| **QuantumTB** | 🫁 | Tuberculosis DprE1 inhibitor research |
| **Disease Hub** | 🏥 | Multi-disease quantum drug screening dashboard |
| **MedGemma AI** | 🏥 | AI-assisted medical diagnosis + treatment search |
| **MedLab** | 🗂 | Real medical case analysis engine |
| **Quantum Search** | 🔍 | Grover's algorithm drug target search |
| **Quantum Drug** | 🧬 | Molecular quantum simulation & ADMET scoring |
| **Training Results** | 🎯 | View all drug screening & research training runs |
| **Discovery Reports** | 📊 | 13 novel drug candidates with QBP-### IDs |
| **Med Files** | 📁 | Patient data + lab report processing |
| **Docs** | 📚 | Full platform documentation |
| **Settings** | ⚙ | User preferences, API keys, backend config |

---

## 🤖 AI Models Integration

### Medical AI
- **[MedGemma 4B](https://huggingface.co/google/medgemma-4b-it)** — Google's medical-domain instruction-tuned model for diagnosis reasoning, disease classification, and ADMET prediction
- **[Gemini 2.0 Flash](https://ai.google.dev)** — Powers ARIA assistant for research synthesis and drug target analysis
- **[TxGemma](https://huggingface.co/google/txgemma-27b-predict)** — Therapeutic property prediction for drug screening

### Quantum Backends
- **IBM Quantum (ibm_fez, ibm_sherbrooke)** — Real 127–156 qubit hardware via Qiskit
- **Stim** — Ultra-fast local Clifford circuit + error correction simulator
- **Qiskit Statevector** — Exact local simulation (≤32 qubits)
- **Google Cirq** *(docs: see below)* — Via Cirq local + Google Quantum Computing Service

See [docs/ai-models.md](docs/ai-models.md) for full model guide.  
See [docs/quantum-simulators.md](docs/quantum-simulators.md) for all backends.

---

## 🔬 Research Results

### Scientific Discoveries (13 Novel Drug Candidates)

| ID | Target | Disease | Predicted Activity |
|----|--------|---------|-------------------|
| QBP-007 | rpoB | Tuberculosis | BBB-penetrant, MIC↓ |
| QBP-001 | KRAS G12D | GBM | Novel covalent scaffold |
| QBP-004 | Aβ42 | Alzheimer's | Aggregation inhibitor |
| QBP-006 | MUC5B | IPF (lung fibrosis) | Anti-fibrotic |
| QBP-005 | TGF-β ALK5 | IPF | Kinase inhibitor |
| + 8 more | Various | ALS, TB, GBM, AD | See `models/` |

Full results: [`models/scientific_discoveries.json`](models/scientific_discoveries.json)

### IBM Quantum Validation (Real Hardware — IBM Fez)
- **99.80% Bell state fidelity** (ibm_fez, Feb 2026)
- **5× qubit lifespan extension** via QuBIOS Transit Ring
- Real calibration data: [`models/ibm_real_results.json`](models/ibm_real_results.json)

---

## 📂 Repository Structure

```
QubitPage-OS/
├── README.md                    ← This file
├── VERSION                      ← 1.1.0
├── INSTALL.md                   ← Full installation guide
├── LICENSE                      ← MIT License
├── requirements.txt             ← Python dependencies
├── .gitignore                   
│
├── src/                         ← Core Python backend
│   ├── app.py                   ← Flask+SocketIO server (main entry point)
│   ├── config.py                ← Configuration (all secrets via env vars)
│   ├── qubilogic.py             ← QuBIOS engine (Transit Ring, QEC, Teleport)
│   ├── quantum_backends.py      ← IBM Quantum + AWS Braket + simulators
│   ├── quantum_kernel.py        ← QLang circuit executor
│   ├── quantum_drug_sim.py      ← Molecular quantum simulation
│   ├── ai_agent.py              ← ARIA AI assistant (Gemini/Groq)
│   ├── gemini_orchestrator.py   ← Multi-model AI orchestration
│   ├── med_research.py          ← Medical research engine
│   ├── quantummed_routes.py     ← API routes for QuantumMed apps
│   ├── report_generator.py      ← Discovery report generation
│   ├── user_auth.py             ← User auth + per-user API key management
│   ├── test_qubilogic.py        ← Core quantum engine tests
│   └── test_qubilogic_extended.py
│
├── templates/                   ← Jinja2 HTML templates
│   ├── os.html                  ← Main OS desktop (all apps, QLang shell)
│   ├── qubilogic.html           ← QuBIOS/QubiLogic Memory app
│   └── docs.html                ← Documentation wiki
│
├── static/js/                   ← Frontend JavaScript
│   ├── quantum-os.js            ← Core OS window manager
│   ├── qbp-runtime.js           ← QLang browser SDK
│   ├── quantumneuro.js          ← QuantumNeuro GBM app
│   ├── quantumtb.js             ← QuantumTB research app
│   ├── disease-dashboard.js     ← Disease Hub dashboard
│   ├── medlab.js                ← MedLab case analysis
│   ├── medfiles.js              ← Medical file processor
│   ├── training-viewer.js       ← Training results viewer
│   ├── reports.js               ← Discovery reports viewer
│   ├── docs-app.js              ← In-app docs browser
│   └── real_case_loader.js      ← Real patient case loader
│
├── models/                      ← Research data & training results
│   ├── README.md                ← Data dictionary
│   ├── scientific_discoveries.json   ← 13 novel drug candidates
│   ├── ibm_real_results.json         ← IBM Fez real hardware results
│   ├── quantum_research.json         ← Quantum simulation studies
│   ├── training_metrics_summary.json ← ML training overview
│   └── training_results/
│       ├── comprehensive_drug_screening.json
│       ├── txgemma_admet_full.json
│       ├── fix_results.json
│       └── fix2_results.json
│
├── docs/                        ← Extended documentation
│   ├── getting-started.md       ← Beginner's guide
│   ├── architecture.md          ← System architecture deep-dive
│   ├── medgemma-integration.md  ← MedGemma + medical AI guide
│   ├── ai-models.md             ← All supported AI models
│   ├── quantum-simulators.md    ← Google Cirq, Stim, IBM + more
│   └── api-reference.md         ← REST API endpoints
│
└── examples/
    ├── keys.env.example         ← Environment variable template
    ├── quickstart.py            ← Python API quickstart
    └── qubitpage-os.service     ← systemd service template
```

---

## 🔗 Related Projects

| Project | Link | Description |
|---------|------|-------------|
| **QLang** | [github.com/qubitpage/QLang](https://github.com/qubitpage/QLang) | Quantum Programming Language with 27 native commands, EBNF grammar, and browser SDK |
| **QuBIOS** | [github.com/qubitpage/QuBIOS](https://github.com/qubitpage/QuBIOS) | Transit Ring quantum middleware — 5× lifespan, 99.80% fidelity |

---

## 📬 Contact & Contributing

- **Platform:** [qubitpage.com](https://qubitpage.com)
- **Research:** [research@qubitpage.com](mailto:research@qubitpage.com)
- **Issues:** [GitHub Issues](https://github.com/qubitpage/QubitPage-OS/issues)
- **Org:** [github.com/qubitpage](https://github.com/qubitpage)

---

<div align="center">

**QubitPage®** — *Quantum computing for medicine, starting now.*

Copyright © 2026 Qubitpage SRL. All rights reserved.  
QubitPage® is a registered trademark of Qubitpage SRL.

</div>
