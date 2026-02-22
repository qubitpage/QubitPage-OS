# MedGemma & AI Models Integration

> How QubitPage® OS uses Google MedGemma, TxGemma, and other medical AI models for quantum drug discovery and disease diagnosis

---

## Table of Contents

1. [Overview](#overview)
2. [MedGemma](#medgemma)
3. [TxGemma](#txgemma)
4. [Gemini 2.0 Flash (ARIA Assistant)](#gemini)
5. [Groq + Llama](#groq)
6. [How Models Connect to Quantum Research](#connection)
7. [Example: Quantum + AI Drug Discovery Pipeline](#pipeline)
8. [ADMET Prediction](#admet)

---

## Overview

QubitPage® OS combines **quantum computing** with **medical AI models** to accelerate drug discovery for diseases without cures. The pipeline works as follows:

```
Quantum Simulation          AI Medical Analysis
──────────────────    ───────────────────────────────
Qubit state prep    →   MedGemma: disease pathway analysis
Molecular VQE       →   TxGemma: ADMET toxicity scoring
Grover search       →   Gemini: target identification
Results JSON        →   MedGemma: clinical interpretation
```

---

## MedGemma

**Model:** `google/medgemma-4b-it` (instruction-tuned, 4B params)  
**Access:** [huggingface.co/google/medgemma-4b-it](https://huggingface.co/google/medgemma-4b-it)  
**License:** Gemma Terms of Use (research use)

### What MedGemma Does in QubitPage® OS

- **Disease diagnosis assistance** — analyzes symptoms with quantum biomarker data
- **Drug candidate evaluation** — assesses quantum-predicted molecular properties
- **Medical imaging analysis** — CXR (chest X-ray), pathology, dermoscopy
- **Clinical trial reasoning** — interprets lab values and treatment outcomes

### Setup

```bash
# Option 1: From PyPI
pip install transformers accelerate torch

# Option 2: Local server (recommended for QubitPage® OS)
python3 examples/medgemma_server.py --port 5051 --model google/medgemma-4b-it
```

```python
# examples/medgemma_server.py
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from flask import Flask, request, jsonify

app = Flask(__name__)
model_name = "google/medgemma-4b-it"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "model": model_name})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    prompt = data.get('prompt', '')
    inputs = tokenizer(prompt, return_tensors='pt').to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=512)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return jsonify({"response": response[len(prompt):].strip()})

if __name__ == '__main__':
    app.run(port=5051)
```

### Connecting MedGemma to QubitPage® OS

The OS calls MedGemma automatically when:

1. A quantum drug candidate is discovered (auto-analysis)
2. A disease case is loaded in MedLab
3. ADMET prediction is requested in Quantum Drug app
4. The user clicks "AI Analysis" in any disease module

```python
# src/med_research.py — MedGemma integration
import requests

MEDGEMMA_URL = "http://localhost:5051"

def analyze_drug_candidate(compound_smiles: str, disease: str) -> dict:
    """Send quantum-predicted compound to MedGemma for clinical analysis."""
    prompt = f"""
    Medical Analysis Request:
    Disease: {disease}
    Compound SMILES: {compound_smiles}
    
    Please analyze:
    1. Predicted mechanism of action
    2. Potential side effects (based on molecular structure)
    3. Blood-brain barrier penetration likelihood
    4. Suggested dosage form
    5. Confidence assessment
    """
    response = requests.post(
        f"{MEDGEMMA_URL}/analyze",
        json={"prompt": prompt},
        timeout=60
    )
    return response.json()
```

---

## TxGemma

**Model:** `google/txgemma-27b-predict`  
**Access:** [huggingface.co/google/txgemma-27b-predict](https://huggingface.co/google/txgemma-27b-predict)  
**Purpose:** Therapeutic molecular property prediction

### ADMET Properties Predicted by TxGemma

| Property | Description | Target Range |
|----------|-------------|--------------|
| Absorption | Intestinal absorption % | >60% |
| Distribution | Volume of distribution | 0.04–20 L/kg |
| Metabolism | CYP450 substrate/inhibitor | Non-inhibitor |
| Excretion | Half-life, clearance | T½ > 4h |
| Toxicity | hERG, AMES, hepatotox | All negative |
| BBB | Blood-brain barrier | + for CNS drugs |
| Solubility | Aqueous solubility | >0.1 mg/mL |

### TxGemma Results in QubitPage® OS (Feb 2026)

From `models/training_results/txgemma_admet_full.json`:

```json
{
  "model": "TxGemma-27B",
  "compounds_screened": 47,
  "top_candidates": [
    {
      "id": "QBP-007",
      "target": "rpoB (TB)",
      "bbb_penetrant": true,
      "admet_score": 0.87,
      "toxicity": "low",
      "predicted_mic": "0.25 μg/mL"
    }
  ]
}
```

---

## Gemini 2.0 Flash

**Purpose:** Powers the ARIA AI Assistant in QubitPage® OS  
**Access:** [aistudio.google.com](https://aistudio.google.com) — free API key  
**Model:** `gemini-2.0-flash-exp`

ARIA is the research assistant present in all apps. It uses Gemini to:
- Explain quantum circuit results in plain language
- Suggest drug target hypotheses
- Summarize scientific literature
- Answer questions about disease pathways

```bash
export GEMINI_API_KEY=your_key_from_aistudio
```

---

## Groq

**Purpose:** Low-latency AI fallback for ARIA when Gemini is slow  
**Models:** `llama-3.3-70b-versatile`, `mixtral-8x7b`  
**Access:** [console.groq.com](https://console.groq.com) — free tier available (14,400 req/day)

```bash
export GROQ_API_KEY=your_groq_key
```

---

## Connection: Quantum + AI Drug Discovery

The key innovation of QubitPage® OS is the **quantum-AI drug discovery loop**:

```
1. INPUT: Disease target (e.g., rpoB for TB)
   ↓
2. QUANTUM SIMULATION (Qiskit/Stim)
   - Molecular orbital calculation via VQE
   - Binding site search via Grover's algorithm
   - Free energy calculation
   ↓
3. CANDIDATE GENERATION
   - Novel scaffold with quantum-predicted binding affinity
   - SMILES string output (e.g., QBP-007)
   ↓
4. AI ANALYSIS (MedGemma + TxGemma)
   - ADMET scoring via TxGemma-27B
   - Clinical interpretation via MedGemma-4B
   - BBB penetration prediction
   ↓
5. OUTPUT: Ranked drug candidates + clinical analysis
   - Stored in models/scientific_discoveries.json
   - Displayed in Discovery Reports app
```

---

## ADMET Prediction

The Drug Discovery pipeline predicts ADMET properties using:

1. **TxGemma** (primary) — full 27B model therapeutic predictor
2. **RDKit** (cheminformatics) — Lipinski + Veber rules
3. **Quantum kernel methods** — novel quantum feature maps for solubility

```python
# src/quantum_drug_sim.py — ADMET scoring
from rdkit import Chem
from rdkit.Chem import Descriptors, QED

def predict_admet(smiles: str) -> dict:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}
    
    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = Descriptors.NumHDonors(mol)
    hba = Descriptors.NumHAcceptors(mol)
    qed_score = QED.qed(mol)
    
    # Lipinski rule of 5
    lipinski_pass = (mw < 500 and logp < 5 and hbd <= 5 and hba <= 10)
    
    return {
        "molecular_weight": mw,
        "logP": logp,
        "hbd": hbd,
        "hba": hba,
        "qed_score": qed_score,
        "lipinski_pass": lipinski_pass,
        "bbb_predicted": logp > 1.5 and mw < 450
    }
```

---

## Supported AI Models Summary

| Model | Provider | Use in OS | Access |
|-------|----------|-----------|--------|
| MedGemma 4B | Google | Medical diagnosis, drug analysis | HuggingFace |
| TxGemma 27B | Google | ADMET prediction | HuggingFace |
| Gemini 2.0 Flash | Google | ARIA assistant | API key (free) |
| Llama 3.3 70B | Meta/Groq | Fast reasoning fallback | Groq API (free tier) |
| Gemini 1.5 Pro | Google | Long-context research | API key |
| IBM Quantum | IBM | Real quantum hardware | IBM token |
| Stim | Google | Clifford simulation | pip (free) |
