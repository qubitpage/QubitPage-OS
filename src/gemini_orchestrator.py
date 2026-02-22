"""Gemini AI Orchestrator — Routes and synthesizes results across all HAI-DEF models.

Manages the research pipeline:
  1. Takes a research question (GBM drug screening, TB compound analysis, etc.)
  2. Routes to appropriate HAI-DEF models (MedGemma, TxGemma, HeAR, CXR, Path Foundation)
  3. Optionally runs quantum simulation via VQE pipeline
  4. Synthesizes all results through Gemini 2.0 Flash for unified analysis
"""
from __future__ import annotations
import json, logging, os, time
from typing import Any
import requests

logger = logging.getLogger("gemini_orchestrator")

# Backend URLs (all tunnel through localhost)
BACKENDS = {
    "multimodel": {"url": os.environ.get("MULTIMODEL_URL", "http://localhost:5055"), "token": os.environ.get("MULTIMODEL_TOKEN", "")},
    "medgemma":  {"url": os.environ.get("MEDGEMMA_URL", "http://localhost:5051"),   "token": os.environ.get("MEDGEMMA_TOKEN", "")},
    "txgemma":   {"url": os.environ.get("TXGEMMA_URL", "http://localhost:5052"),    "token": os.environ.get("TXGEMMA_TOKEN", "")},
    "hear":      {"url": os.environ.get("HEAR_URL", "http://localhost:5053"),       "token": os.environ.get("HEAR_TOKEN", "")},
    "cxr":       {"url": os.environ.get("CXR_URL", "http://localhost:5054"),        "token": os.environ.get("CXR_TOKEN", "")},
    "pathfound": {"url": os.environ.get("PATHFOUND_URL", "http://localhost:5055"),  "token": os.environ.get("PATHFOUND_TOKEN", "")},
}

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiOrchestrator:
    """Orchestrates multi-model medical AI research pipelines."""

    def __init__(self, gemini_key: str):
        self.gemini_key = gemini_key

    # ── Backend communication ──────────────────────────────
    def _call_backend(self, backend: str, path: str, method: str = "POST",
                      payload: dict | None = None, timeout: int = 120) -> dict:
        cfg = BACKENDS.get(backend)
        if not cfg:
            return {"error": f"Unknown backend: {backend}", "status": "unavailable"}
        url = f"{cfg['url']}{path}"
        headers = {"Authorization": f"Bearer {cfg['token']}",
                   "Content-Type": "application/json"}
        try:
            if method == "GET":
                r = requests.get(url, headers=headers, timeout=timeout)
            else:
                r = requests.post(url, headers=headers, json=payload, timeout=timeout)
            return r.json()
        except requests.ConnectionError:
            return {"error": f"{backend} server unreachable", "status": "unavailable"}
        except requests.Timeout:
            return {"error": f"{backend} timed out", "status": "timeout"}
        except Exception as e:
            return {"error": str(e), "status": "error"}

    def check_backends(self) -> dict:
        """Check health of all model backends."""
        status = {}
        for name in BACKENDS:
            result = self._call_backend(name, "/health", "GET", timeout=5)
            status[name] = {
                "available": result.get("status") == "ok" or "model_loaded" in result,
                "details": result,
            }
        return status

    # ── Gemini synthesis ───────────────────────────────────
    def _gemini_synthesize(self, prompt: str, max_tokens: int = 4096) -> str:
        """Call Gemini 2.0 Flash to synthesize multi-model results."""
        url = f"{GEMINI_API_URL}?key={self.gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.3,
            },
        }
        try:
            r = requests.post(url, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error("Gemini synthesis failed: %s", e)
            return f"Gemini synthesis error: {str(e)}"

    # ── Research pipelines ─────────────────────────────────

    def run_gbm_drug_screening(self, smiles: str, drug_name: str = "",
                                patient_context: str = "") -> dict:
        """GBM drug screening pipeline:
        1. TxGemma: BBB permeability + toxicity prediction
        2. Quantum VQE: EGFR binding simulation (called externally)
        3. MedGemma: Clinical interpretation
        4. Gemini: Synthesis of all results
        """
        t0 = time.time()
        results = {"pipeline": "gbm_drug_screening", "smiles": smiles,
                   "drug_name": drug_name, "steps": {}}

        # Step 1: TxGemma drug properties
        txg_result = self._call_backend("txgemma", "/api/txgemma/multi-predict", payload={
            "smiles": smiles,
            "properties": ["bbb_permeability", "herg_toxicity", "cyp_metabolism",
                           "ames_mutagenicity", "solubility"]
        })
        results["steps"]["txgemma_properties"] = txg_result

        # Step 2: MedGemma clinical assessment
        bbb_status = "unknown"
        if isinstance(txg_result.get("predictions"), dict):
            bbb_pred = txg_result["predictions"].get("bbb_permeability", {})
            bbb_status = "permeable" if bbb_pred.get("prediction") == "Yes" else "impermeable"

        mg_prompt = (
            f"As a neuro-oncologist, analyze this GBM drug candidate:\n"
            f"Drug: {drug_name or smiles}\n"
            f"BBB Permeability: {bbb_status}\n"
            f"Predicted Properties: {json.dumps(txg_result.get('predictions', {}), indent=2)}\n"
            f"Patient Context: {patient_context or 'Standard adult GBM patient'}\n\n"
            f"Provide: (1) Drug viability assessment for GBM treatment, "
            f"(2) Comparison with temozolomide standard-of-care, "
            f"(3) Potential combination therapy suggestions, "
            f"(4) Safety concerns based on predicted toxicity."
        )
        mg_result = self._call_backend("medgemma", "/api/medgemma/analyze", payload={
            "prompt": mg_prompt,
            "type": "drug_assessment",
            "max_tokens": 1024,
            "temperature": 0.4,
        })
        results["steps"]["medgemma_assessment"] = mg_result

        # Step 3: Gemini synthesis
        synthesis_prompt = (
            f"You are a senior oncology researcher analyzing a GBM drug candidate.\n\n"
            f"## Drug: {drug_name or smiles}\n"
            f"## SMILES: {smiles}\n\n"
            f"## TxGemma Drug Property Predictions:\n{json.dumps(txg_result, indent=2)}\n\n"
            f"## MedGemma Clinical Assessment:\n{json.dumps(mg_result, indent=2)}\n\n"
            f"## Task:\n"
            f"Synthesize all model outputs into a unified research report:\n"
            f"1. **BBB Penetration Assessment** — Can this drug cross the blood-brain barrier?\n"
            f"2. **Safety Profile** — Toxicity, mutagenicity, cardiac (hERG) risk\n"
            f"3. **Clinical Potential** — How does this compare to existing GBM treatments?\n"
            f"4. **Recommendation** — Proceed to quantum binding simulation? Why?\n"
            f"5. **Research Score** — Rate 1-10 the potential of this candidate\n"
        )
        synthesis = self._gemini_synthesize(synthesis_prompt)
        results["steps"]["gemini_synthesis"] = synthesis
        results["elapsed_seconds"] = round(time.time() - t0, 2)
        return results

    def run_tb_compound_analysis(self, smiles: str, drug_name: str = "",
                                  target: str = "DprE1") -> dict:
        """TB compound analysis pipeline:
        1. TxGemma: Binding affinity + toxicity
        2. MedGemma: Clinical interpretation for TB treatment
        3. Gemini: Synthesis
        """
        t0 = time.time()
        results = {"pipeline": "tb_compound_analysis", "smiles": smiles,
                   "drug_name": drug_name, "target": target, "steps": {}}

        # Step 1: TxGemma predictions
        txg_result = self._call_backend("txgemma", "/api/txgemma/multi-predict", payload={
            "smiles": smiles,
            "properties": ["binding_affinity", "herg_toxicity", "cyp_metabolism",
                           "ames_mutagenicity", "solubility", "lipophilicity"]
        })
        results["steps"]["txgemma_properties"] = txg_result

        # Step 2: MedGemma TB assessment
        mg_prompt = (
            f"As an infectious disease specialist focused on TB drug development:\n"
            f"Compound: {drug_name or smiles}\n"
            f"Target: {target} (mycobacterial enzyme)\n"
            f"Predicted Properties: {json.dumps(txg_result.get('predictions', {}), indent=2)}\n\n"
            f"Analyze: (1) Suitability as anti-TB agent, "
            f"(2) Predicted activity against drug-resistant TB strains, "
            f"(3) Comparison with BTZ043/PBTZ169 DprE1 inhibitors in clinical trials, "
            f"(4) Hepatotoxicity risk (critical for TB drugs), "
            f"(5) Combination potential with bedaquiline/pretomanid."
        )
        mg_result = self._call_backend("medgemma", "/api/medgemma/analyze", payload={
            "prompt": mg_prompt,
            "type": "drug_assessment",
            "max_tokens": 1024,
            "temperature": 0.4,
        })
        results["steps"]["medgemma_assessment"] = mg_result

        # Step 3: Gemini synthesis
        synthesis_prompt = (
            f"You are a TB drug discovery researcher.\n\n"
            f"## Compound: {drug_name or smiles}\n"
            f"## Target: {target}\n\n"
            f"## TxGemma Predictions:\n{json.dumps(txg_result, indent=2)}\n\n"
            f"## MedGemma Assessment:\n{json.dumps(mg_result, indent=2)}\n\n"
            f"Synthesize into a report:\n"
            f"1. **Anti-TB Potential** — Mechanism of action assessment\n"
            f"2. **Drug Resistance** — Activity against MDR/XDR-TB?\n"
            f"3. **Safety** — Hepatotoxicity, cardiac, mutagenicity risks\n"
            f"4. **Clinical Path** — Feasibility for clinical development\n"
            f"5. **Research Score** — Rate 1-10\n"
        )
        synthesis = self._gemini_synthesize(synthesis_prompt)
        results["steps"]["gemini_synthesis"] = synthesis
        results["elapsed_seconds"] = round(time.time() - t0, 2)
        return results

    def run_medical_image_analysis(self, image_b64: str, image_mime: str,
                                    analysis_type: str = "radiology",
                                    clinical_context: str = "") -> dict:
        """Medical image analysis pipeline:
        1. MedGemma: Visual analysis (X-ray, MRI, histopathology)
        2. Gemini: Enhanced interpretation with clinical context
        """
        t0 = time.time()
        results = {"pipeline": "medical_image_analysis",
                   "analysis_type": analysis_type, "steps": {}}

        # Step 1: MedGemma image analysis
        mg_result = self._call_backend("medgemma", "/api/medgemma/analyze-image", payload={
            "image_base64": image_b64,
            "image_mime": image_mime,
            "prompt": f"Analyze this {analysis_type} image. {clinical_context}",
            "type": analysis_type,
            "max_tokens": 1024,
        })
        results["steps"]["medgemma_image"] = mg_result

        # Step 2: Gemini enhanced interpretation
        mg_text = mg_result.get("response", mg_result.get("analysis", "No analysis available"))
        synthesis_prompt = (
            f"You are a senior {analysis_type} specialist.\n\n"
            f"## MedGemma Visual Analysis:\n{mg_text}\n\n"
            f"## Clinical Context: {clinical_context or 'Not provided'}\n\n"
            f"Provide enhanced interpretation:\n"
            f"1. Key findings confirmation/correction\n"
            f"2. Differential diagnosis\n"
            f"3. Recommended follow-up imaging or tests\n"
            f"4. Clinical significance assessment\n"
        )
        synthesis = self._gemini_synthesize(synthesis_prompt)
        results["steps"]["gemini_synthesis"] = synthesis
        results["elapsed_seconds"] = round(time.time() - t0, 2)
        return results

    def run_quantum_vqe_pipeline(self, target: str, backend: str = "aer_simulator",
                                  smiles: str = "", shots: int = 4096) -> dict:
        """Run quantum VQE simulation for molecular binding.
        This is called from app.py which invokes quantum_drug_sim.py.
        Returns a dict ready for Gemini synthesis.
        """
        from quantum_drug_sim import QuantumDrugSimulator
        sim = QuantumDrugSimulator()
        if target.lower() in ("egfr", "gbm"):
            result = sim.run_egfr_vqe(backend_name=backend, shots=shots)
        elif target.lower() in ("dpre1", "tb"):
            result = sim.run_dpre1_vqe(backend_name=backend, shots=shots)
        else:
            result = sim.run_custom_vqe(smiles or "O=O", backend_name=backend, shots=shots)
        return result
