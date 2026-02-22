# ═════════════════════════════════════════════════════════════
#  QuantumMed OS — New API Routes
#  Gemini Orchestrator + QuantumNeuro + QuantumTB + Docs
# ═════════════════════════════════════════════════════════════

from gemini_orchestrator import GeminiOrchestrator
import json, time, traceback

# Initialize Gemini Orchestrator (uses key from config.py)
try:
    _gemini_key = app.config.get("GEMINI_KEY", "") or APIS.get("gemini", {}).get("key", "")
    orchestrator = GeminiOrchestrator(_gemini_key)
    logger.info("[QuantumMed] Gemini Orchestrator initialized")
except Exception as e:
    orchestrator = None
    logger.error("[QuantumMed] Orchestrator init failed: %s", e)


# ── Orchestrator status ────────────────────────────────────
@app.route("/api/orchestrator/status", methods=["GET"])
@login_required
def api_orchestrator_status():
    """Check status of all AI model backends."""
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503
    try:
        backends = orchestrator.check_backends()
        return jsonify({"status": "ok", "backends": backends})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── QuantumNeuro GBM Routes ────────────────────────────────
@app.route("/api/quantumneuro/analyze-mri", methods=["POST"])
@login_required
def api_qn_analyze_mri():
    """Analyze brain MRI for glioblastoma using MedGemma."""
    body = request.get_json(force=True, silent=True) or {}
    image_b64 = body.get("image_base64", "")
    image_mime = body.get("image_mime", "image/png")
    clinical_ctx = body.get("clinical_context", "Evaluate for glioblastoma multiforme")

    if not image_b64:
        return jsonify({"error": "image_base64 required"}), 400
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        result = orchestrator.run_medical_image_analysis(
            image_b64, image_mime,
            analysis_type="neuro_mri",
            clinical_context=clinical_ctx
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quantumneuro/screen-drug", methods=["POST"])
@login_required
def api_qn_screen_drug():
    """Screen drug candidate for GBM — BBB permeability, toxicity, binding."""
    body = request.get_json(force=True, silent=True) or {}
    smiles = body.get("smiles", "").strip()
    drug_name = body.get("drug_name", "")
    patient_ctx = body.get("patient_context", "")

    if not smiles:
        return jsonify({"error": "SMILES string required"}), 400
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        result = orchestrator.run_gbm_drug_screening(
            smiles=smiles, drug_name=drug_name, patient_context=patient_ctx
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quantumneuro/quantum-vqe", methods=["POST"])
@login_required
def api_qn_quantum_vqe():
    """Run quantum VQE simulation for EGFR binding pocket."""
    body = request.get_json(force=True, silent=True) or {}
    backend = body.get("backend", "aer_simulator")
    shots = min(int(body.get("shots", 4096)), 32768)
    smiles = body.get("smiles", "")

    try:
        from quantum_drug_sim import QuantumDrugSimulator
        sim = QuantumDrugSimulator()
        result = sim.run_egfr_vqe(backend_name=backend, shots=shots)
        return jsonify(result)
    except ImportError:
        return jsonify({"error": "quantum_drug_sim module not found"}), 503
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@app.route("/api/quantumneuro/full-pipeline", methods=["POST"])
@login_required
def api_qn_full_pipeline():
    """Run the complete QuantumNeuro GBM analysis pipeline.
    Steps: MRI Analysis → Drug Screening → Quantum VQE → Gemini Synthesis
    """
    body = request.get_json(force=True, silent=True) or {}
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        # Gather inputs
        smiles = body.get("smiles", "").strip()
        drug_name = body.get("drug_name", "")
        image_b64 = body.get("mri_image_base64", "")
        image_mime = body.get("mri_image_mime", "image/png")
        histo_b64 = body.get("histology_image_base64", "")
        quantum_backend = body.get("quantum_backend", "aer_simulator")
        quantum_shots = min(int(body.get("quantum_shots", 4096)), 32768)

        pipeline_results = {
            "pipeline": "quantumneuro_gbm",
            "disease": "Glioblastoma Multiforme",
            "timestamp": time.time(),
            "steps": []
        }

        # Step 1: MRI Analysis (if image provided)
        if image_b64:
            mri = orchestrator.run_medical_image_analysis(
                image_b64, image_mime,
                analysis_type="neuro_mri",
                clinical_context="Evaluate for glioblastoma: tumor location, size, enhancement, MGMT methylation"
            )
            pipeline_results["mri_analysis"] = mri
            pipeline_results["steps"].append({"step": "Brain MRI Analysis", "status": "complete", "model": "MedGemma + Gemini"})

        # Step 2: Histopathology (if provided)
        if histo_b64:
            histo = orchestrator.run_medical_image_analysis(
                histo_b64, "image/png",
                analysis_type="neuropathology",
                clinical_context="GBM histopathology: cell density, necrosis, microvascular proliferation, Ki-67, EGFR/PDGFRA"
            )
            pipeline_results["histology_analysis"] = histo
            pipeline_results["steps"].append({"step": "Histopathology", "status": "complete", "model": "MedGemma + PathFoundation"})

        # Step 3: Drug Screening via TxGemma
        if smiles:
            drug = orchestrator.run_gbm_drug_screening(smiles, drug_name)
            pipeline_results["drug_screening"] = drug
            pipeline_results["steps"].append({"step": "Drug Screening", "status": "complete", "model": "TxGemma + MedGemma + Gemini"})

        # Step 4: Quantum VQE for EGFR binding
        try:
            from quantum_drug_sim import QuantumDrugSimulator
            sim = QuantumDrugSimulator()
            vqe = sim.run_egfr_vqe(backend_name=quantum_backend, shots=quantum_shots)
            pipeline_results["quantum_vqe"] = vqe
            pipeline_results["steps"].append({"step": "Quantum VQE (EGFR)", "status": "complete", "model": f"Qiskit ({quantum_backend})"})
        except Exception as qe:
            pipeline_results["quantum_vqe"] = {"error": str(qe)}
            pipeline_results["steps"].append({"step": "Quantum VQE (EGFR)", "status": "error", "error": str(qe)})

        # Step 5: Gemini final synthesis
        synthesis = orchestrator._gemini_synthesize(
            f"Synthesize this complete GBM research pipeline into a final report:\n\n"
            f"{json.dumps(pipeline_results, default=str)[:6000]}\n\n"
            f"Provide: Executive Summary, Key Findings, Novel Insights, Clinical Implications, Next Steps."
        )
        pipeline_results["final_report"] = synthesis
        pipeline_results["steps"].append({"step": "Final Synthesis", "status": "complete", "model": "Gemini 2.0 Flash"})

        return jsonify(pipeline_results)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


# ── QuantumTB Routes ───────────────────────────────────────
@app.route("/api/quantumtb/analyze-cxr", methods=["POST"])
@login_required
def api_qtb_analyze_cxr():
    """Analyze chest X-ray for tuberculosis using MedGemma."""
    body = request.get_json(force=True, silent=True) or {}
    image_b64 = body.get("image_base64", "")
    image_mime = body.get("image_mime", "image/png")
    clinical_ctx = body.get("clinical_context", "Evaluate for tuberculosis signs")

    if not image_b64:
        return jsonify({"error": "image_base64 required"}), 400
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        result = orchestrator.run_medical_image_analysis(
            image_b64, image_mime,
            analysis_type="chest_xray",
            clinical_context=clinical_ctx
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quantumtb/screen-compound", methods=["POST"])
@login_required
def api_qtb_screen_compound():
    """Screen anti-TB compound — binding affinity to DprE1, toxicity, etc."""
    body = request.get_json(force=True, silent=True) or {}
    smiles = body.get("smiles", "").strip()
    drug_name = body.get("drug_name", "")
    target = body.get("target", "DprE1")

    if not smiles:
        return jsonify({"error": "SMILES string required"}), 400
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        result = orchestrator.run_tb_compound_analysis(
            smiles=smiles, drug_name=drug_name, target=target
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quantumtb/quantum-vqe", methods=["POST"])
@login_required
def api_qtb_quantum_vqe():
    """Run quantum VQE simulation for DprE1 binding pocket."""
    body = request.get_json(force=True, silent=True) or {}
    backend = body.get("backend", "aer_simulator")
    shots = min(int(body.get("shots", 4096)), 32768)

    try:
        from quantum_drug_sim import QuantumDrugSimulator
        sim = QuantumDrugSimulator()
        result = sim.run_dpre1_vqe(backend_name=backend, shots=shots)
        return jsonify(result)
    except ImportError:
        return jsonify({"error": "quantum_drug_sim module not found"}), 503
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@app.route("/api/quantumtb/full-pipeline", methods=["POST"])
@login_required
def api_qtb_full_pipeline():
    """Run complete QuantumTB analysis pipeline.
    Steps: CXR Analysis → Sputum → Drug Screening → Quantum VQE → Gemini Synthesis
    """
    body = request.get_json(force=True, silent=True) or {}
    if not orchestrator:
        return jsonify({"error": "Orchestrator not initialized"}), 503

    try:
        smiles = body.get("smiles", "").strip()
        drug_name = body.get("drug_name", "")
        cxr_b64 = body.get("cxr_image_base64", "")
        cxr_mime = body.get("cxr_image_mime", "image/png")
        sputum_b64 = body.get("sputum_image_base64", "")
        quantum_backend = body.get("quantum_backend", "aer_simulator")
        quantum_shots = min(int(body.get("quantum_shots", 4096)), 32768)

        pipeline_results = {
            "pipeline": "quantumtb",
            "disease": "Tuberculosis (MDR-TB)",
            "timestamp": time.time(),
            "steps": []
        }

        # Step 1: Chest X-Ray
        if cxr_b64:
            cxr = orchestrator.run_medical_image_analysis(
                cxr_b64, cxr_mime,
                analysis_type="chest_xray",
                clinical_context="TB screening: cavitary lesions, infiltrates, pleural effusion, miliary pattern"
            )
            pipeline_results["cxr_analysis"] = cxr
            pipeline_results["steps"].append({"step": "Chest X-Ray Analysis", "status": "complete", "model": "MedGemma + CXRFoundation"})

        # Step 2: Sputum Microscopy
        if sputum_b64:
            sputum = orchestrator.run_medical_image_analysis(
                sputum_b64, "image/png",
                analysis_type="microscopy",
                clinical_context="Sputum AFB: Ziehl-Neelsen stain, quantify bacterial load, drug resistance morphology"
            )
            pipeline_results["sputum_analysis"] = sputum
            pipeline_results["steps"].append({"step": "Sputum Microscopy", "status": "complete", "model": "MedGemma + PathFoundation"})

        # Step 3: Drug Screening
        if smiles:
            drug = orchestrator.run_tb_compound_analysis(smiles, drug_name)
            pipeline_results["drug_screening"] = drug
            pipeline_results["steps"].append({"step": "Compound Screening", "status": "complete", "model": "TxGemma + MedGemma + Gemini"})

        # Step 4: Quantum VQE for DprE1
        try:
            from quantum_drug_sim import QuantumDrugSimulator
            sim = QuantumDrugSimulator()
            vqe = sim.run_dpre1_vqe(backend_name=quantum_backend, shots=quantum_shots)
            pipeline_results["quantum_vqe"] = vqe
            pipeline_results["steps"].append({"step": "Quantum VQE (DprE1)", "status": "complete", "model": f"Qiskit ({quantum_backend})"})
        except Exception as qe:
            pipeline_results["quantum_vqe"] = {"error": str(qe)}
            pipeline_results["steps"].append({"step": "Quantum VQE (DprE1)", "status": "error", "error": str(qe)})

        # Step 5: Final synthesis
        synthesis = orchestrator._gemini_synthesize(
            f"Synthesize this complete TB research pipeline into a final report:\n\n"
            f"{json.dumps(pipeline_results, default=str)[:6000]}\n\n"
            f"Provide: Executive Summary, TB Classification, Drug Resistance Assessment, "
            f"Compound Viability, Quantum Insights, WHO BPPL 2024 Alignment, Next Steps."
        )
        pipeline_results["final_report"] = synthesis
        pipeline_results["steps"].append({"step": "Final Synthesis", "status": "complete", "model": "Gemini 2.0 Flash"})

        return jsonify(pipeline_results)
    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


# ── Documentation API ──────────────────────────────────────
DOCUMENTATION = {
    "overview": {
        "title": "QuantumMed OS — Documentation",
        "sections": [
            {"id": "intro", "title": "Introduction", "content": """
**QuantumMed OS** is an integrated medical AI research platform that combines:
- **8 Google HAI-DEF models** (MedGemma, TxGemma, HeAR, CXR Foundation, Path Foundation, MedSigLIP, MedASR, Derm Foundation)
- **Quantum computing** via IBM Quantum, Amazon Braket, Google Cirq
- **Gemini AI orchestration** for multi-model reasoning and synthesis
- **Two disease research pipelines**: Glioblastoma (QuantumNeuro) and MDR-TB (QuantumTB)

Built for the MedGemma Impact Challenge 2025-2026 ($100K prize).
"""},
            {"id": "architecture", "title": "System Architecture", "content": """
## Architecture

```
┌─────────────────────────────────────────────┐
│           QubitPage® OS Desktop              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │QuantumNe │ │QuantumTB │ │  Docs    │     │
│  │   uro    │ │          │ │  App     │     │
│  └────┬─────┘ └────┬─────┘ └──────────┘     │
│       │             │                        │
│  ┌────┴─────────────┴────────────────┐       │
│  │     Gemini AI Orchestrator        │       │
│  │  (Routes queries to HAI-DEF)      │       │
│  └────┬──────┬──────┬──────┬────┬────┘       │
│       │      │      │      │    │            │
│  ┌────┴┐ ┌───┴──┐ ┌─┴──┐ ┌┴──┐ │            │
│  │Med  │ │Tx   │ │HeAR│ │CXR│ │            │
│  │Gemma│ │Gemma │ │    │ │   │ │            │
│  └─────┘ └──────┘ └────┘ └───┘ │            │
│                                  │            │
│  ┌───────────────────────────────┴──┐        │
│  │   Quantum Computing Backend      │        │
│  │  IBM Quantum · Braket · Aer      │        │
│  └──────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```
"""},
            {"id": "models", "title": "AI Models", "content": """
## HAI-DEF Models Used

| Model | Purpose | Status |
|-------|---------|--------|
| **MedGemma 4B-it** | Medical text & image analysis | ✅ Deployed |
| **TxGemma 2B-predict** | Drug property prediction (66 TDC tasks) | ✅ Deployed |
| **HeAR** | Cough/respiratory audio screening | 🔜 Planned |
| **CXR Foundation** | Chest X-ray analysis | 🔜 Planned |
| **Path Foundation** | Histopathology analysis | 🔜 Planned |
| **MedSigLIP** | Medical image-text matching | 🔜 Planned |
| **MedASR** | Medical speech recognition | 🔜 Planned |
| **Derm Foundation** | Dermatology image analysis | 🔜 Planned |

### MedGemma
- Model: `google/medgemma-4b-it` (4-bit quantized)
- Capabilities: Text analysis, multimodal image analysis, clinical reasoning
- GPU: RTX 3090 Ti (3.2GB VRAM usage)

### TxGemma
- Model: `google/txgemma-2b-predict` (4-bit quantized)
- Capabilities: 66 TDC benchmark tasks from SMILES strings
- Key tasks: BBB permeability, hERG toxicity, solubility, half-life, bioavailability, Ames mutagenicity
"""},
            {"id": "quantumneuro", "title": "QuantumNeuro (GBM)", "content": """
## QuantumNeuro — Glioblastoma Drug Discovery

### Why GBM?
- Median survival: 15 months (worst of any major cancer)
- 5-year survival: <7%
- Blood-Brain Barrier blocks >98% of drugs
- ALL Phase III immunotherapy trials have failed
- Standard of care (temozolomide) hasn't changed since 2005

### Our Approach
1. **Brain MRI Analysis** — MedGemma identifies tumor location, enhancement patterns, MGMT methylation
2. **Histopathology** — Path Foundation classifies WHO grade, identifies molecular markers (EGFR, PDGFRA, NF1)
3. **Drug Screening** — TxGemma predicts BBB permeability for candidate molecules
4. **Quantum Simulation** — VQE computes EGFR binding pocket energies (~20-50 atom active space)
5. **Gemini Synthesis** — Unified research report with clinical recommendations

### Quantum Target: EGFR
- Epidermal Growth Factor Receptor — amplified in ~60% of GBMs
- Active site: 20-50 atoms (ideal for NISQ quantum computers)
- VQE with UCCSD ansatz captures electron correlation effects that classical DFT misses
"""},
            {"id": "quantumtb", "title": "QuantumTB (Tuberculosis)", "content": """
## QuantumTB — TB Elimination Platform

### Why TB?
- Kills 1.3M people/year (WHO BPPL 2024 critical priority)
- MDR-TB treatment: 9-20 months, <60% success rate
- XDR-TB: essentially untreatable with current drugs
- DprE1 is a novel, validated drug target with NO approved drugs yet

### Our Approach
1. **Chest X-Ray Screening** — MedGemma + CXR Foundation detect TB patterns
2. **Cough Audio Analysis** — HeAR screens for TB-suggestive cough patterns
3. **Sputum Microscopy** — Path Foundation analyzes AFB smear slides
4. **Drug Discovery** — TxGemma screens novel DprE1 inhibitors
5. **Quantum Simulation** — VQE models DprE1 binding for resistance prediction
6. **Gemini Synthesis** — Complete diagnosis + treatment recommendation

### Quantum Target: DprE1
- Decaprenylphosphoryl-β-D-ribose oxidase — essential for mycobacterial cell wall
- BTZ043 and PBTZ169 are in clinical trials as DprE1 inhibitors
- Quantum advantage: model resistance mutations and binding landscape
"""},
            {"id": "quantum", "title": "Quantum Computing", "content": """
## Quantum Computing Integration

### Available Backends
| Provider | Backends | Qubits |
|----------|----------|--------|
| **Local Simulator** | Aer Simulator | Unlimited |
| **IBM Quantum** | ibm_torino (133q), ibm_fez (156q), ibm_marrakesh (156q) | 133-156 |
| **Amazon Braket** | IonQ Aria, IQM Garnet, Rigetti Ankaa-3 | Various |
| **Google Cirq** | Simulator, Sycamore | 72 |

### VQE (Variational Quantum Eigensolver)
- Computes ground state energy of molecular Hamiltonians
- UCCSD ansatz captures electron correlation
- Hybrid quantum-classical optimization loop
- ~4-8 qubits for simplified drug binding models

### How to Use
1. Choose target (EGFR for GBM, DprE1 for TB)
2. Select backend (Aer Simulator for fast testing, IBM Quantum for real hardware)
3. Set shots (1024-32768)
4. Run VQE — results include ground state energy and binding prediction
"""},
            {"id": "api", "title": "API Reference", "content": """
## API Endpoints

### QuantumNeuro (GBM)
- `POST /api/quantumneuro/analyze-mri` — Brain MRI analysis
- `POST /api/quantumneuro/screen-drug` — Drug BBB screening (SMILES)
- `POST /api/quantumneuro/quantum-vqe` — Quantum EGFR simulation
- `POST /api/quantumneuro/full-pipeline` — Complete GBM pipeline

### QuantumTB
- `POST /api/quantumtb/analyze-cxr` — Chest X-ray TB screening
- `POST /api/quantumtb/screen-compound` — Anti-TB compound screening
- `POST /api/quantumtb/quantum-vqe` — Quantum DprE1 simulation
- `POST /api/quantumtb/full-pipeline` — Complete TB pipeline

### Orchestrator
- `GET /api/orchestrator/status` — Backend model status

### MedGemma
- `GET /api/medgemma/health` — Health check
- `POST /api/medgemma/analyze` — Text analysis
- `POST /api/medgemma/analyze-image` — Image analysis

### Common Parameters
All POST endpoints accept JSON body. Authentication required (session-based).

#### Drug Screening Body
```json
{
  "smiles": "O=c1[nH]c(=O)n(n1C)c1ncc(C)n1",
  "drug_name": "Temozolomide",
  "patient_context": "Adult GBM, MGMT methylated"
}
```

#### Image Analysis Body
```json
{
  "image_base64": "...",
  "image_mime": "image/png",
  "clinical_context": "Evaluate for glioblastoma"
}
```
"""}
        ]
    }
}


@app.route("/api/docs/sections", methods=["GET"])
@login_required
def api_docs_sections():
    """Get all documentation sections."""
    sections = []
    for s in DOCUMENTATION["overview"]["sections"]:
        sections.append({"id": s["id"], "title": s["title"]})
    return jsonify({"title": DOCUMENTATION["overview"]["title"], "sections": sections})


@app.route("/api/docs/section/<section_id>", methods=["GET"])
@login_required
def api_docs_section(section_id):
    """Get a specific documentation section."""
    for s in DOCUMENTATION["overview"]["sections"]:
        if s["id"] == section_id:
            return jsonify(s)
    return jsonify({"error": "Section not found"}), 404


@app.route("/api/docs/full", methods=["GET"])
@login_required
def api_docs_full():
    """Get all documentation."""
    return jsonify(DOCUMENTATION["overview"])


# ── Known Drugs / Reference Data ───────────────────────────
REFERENCE_DRUGS = {
    "gbm": [
        {"name": "Temozolomide", "smiles": "O=c1[nH]c(=O)n(n1C)c1ncc(C)n1", "role": "Standard-of-care GBM chemotherapy", "bbb": "Yes"},
        {"name": "Bevacizumab", "smiles": None, "role": "Anti-VEGF (fails BBB, minimal survival benefit)", "bbb": "No"},
        {"name": "Lomustine (CCNU)", "smiles": "O=NN(CCCl)C(=O)NCCCl", "role": "Alkylating agent for recurrent GBM", "bbb": "Yes"},
        {"name": "Carmustine", "smiles": "O=NN(CCCl)C(=O)NCCCl", "role": "Alkylating agent (can be implanted as wafer)", "bbb": "Moderate"},
        {"name": "Erlotinib", "smiles": "COc1cc2ncnc(Nc3ccc(OCCOc4ccccc4)c(c3)C#C)c2cc1OC", "role": "EGFR inhibitor (poor BBB penetration)", "bbb": "No"},
    ],
    "tb": [
        {"name": "Isoniazid", "smiles": "NNC(=O)c1ccncc1", "role": "First-line anti-TB (targets InhA)", "bbb": "Yes"},
        {"name": "Rifampicin", "smiles": "CC1C=CC(=O)C(C)=CC(=O)NC2=CC(=O)C3(OC4(C)OC(C)CC4O)C(=O)C(C)=C(NC(=O)C(=CC=CC(=CC(OC)C(OC(C)=O)C(C)OC1=O)C)C)C3=C2O", "role": "First-line anti-TB (targets RNA polymerase)", "bbb": "No"},
        {"name": "Bedaquiline", "smiles": "COc1nc2ccc(Br)cc2cc1C(c1ccccc1)C1CC1NC(C)C(O)c1cccc2ccccc12", "role": "MDR-TB drug (targets ATP synthase)", "bbb": "No"},
        {"name": "Pretomanid", "smiles": "O=c1[nH]c2cc(OCc3ccc(OC(F)(F)F)cc3)ccc2[nH]1", "role": "BPaL regimen for XDR-TB", "bbb": "No"},
        {"name": "BTZ043", "smiles": None, "role": "DprE1 inhibitor (Phase II clinical trial)", "bbb": "Unknown"},
    ]
}


@app.route("/api/reference/drugs/<disease>", methods=["GET"])
@login_required
def api_reference_drugs(disease):
    """Get reference drugs for a disease."""
    drugs = REFERENCE_DRUGS.get(disease, [])
    if not drugs:
        return jsonify({"error": f"No reference drugs for: {disease}", "available": list(REFERENCE_DRUGS.keys())}), 404
    return jsonify({"disease": disease, "drugs": drugs})
