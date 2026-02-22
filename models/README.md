# QubitPage® OS — Research Data & Models

> This directory contains all research outputs, quantum validation results, and scientific discoveries from QubitPage® OS v1.1.0.

---

## Scientific Discoveries: 13 Novel Drug Candidates

**File:** `scientific_discoveries.json`

Contains 13 quantum-predicted drug candidates (QBP-001 through QBP-013) with:
- Target protein / disease
- SMILES molecular structure
- Predicted binding affinity
- ADMET scores (TxGemma-27B)
- BBB penetration prediction

## IBM Quantum Validation

**File:** `ibm_real_results.json`

Real hardware results from **IBM Fez** (156 qubits, Heavy-Hex), validated Feb 2026:
- Bell state fidelity: **99.80%**
- GHZ-3 fidelity: **99.45%**
- Transit Ring lifespan multiplier: **5×**
- Steane QEC logical error rate: **0.0012**

## Training Results

| File | Description | Date |
|------|-------------|------|
| `training_results/comprehensive_drug_screening.json` | 47 compounds screened, 7 diseases | Feb 2026 |
| `training_results/txgemma_admet_full.json` | Full ADMET prediction results | Feb 2026 |
| `training_results/fix_results.json` | Pipeline iteration 1 corrections | Feb 2026 |
| `training_results/fix2_results.json` | Pipeline iteration 2 corrections | Feb 2026 |
| `training_metrics_summary.json` | Overall metrics summary | Feb 2026 |
| `quantum_research.json` | Quantum simulation studies | Feb 2026 |

## Note on Model Weights

The ML foundation models used (MedGemma, TxGemma) are **not stored here** — they are loaded from HuggingFace at runtime. Only research **result data** (JSON) is stored in this directory.

To reproduce the training runs, see:
1. [docs/medgemma-integration.md](../docs/medgemma-integration.md)
2. [docs/quantum-simulators.md](../docs/quantum-simulators.md)
3. Load the environment and run `python3 src/med_research.py --reproduce`

## Diseases Targeted

1. **Glioblastoma (GBM)** — KRAS G12D, EGFR, IDH1 targets
2. **Tuberculosis (TB)** — DprE1, rpoB, InhA targets — **QBP-007: most promising**
3. **Alzheimer's Disease (AD)** — Aβ42, tau, BACE1 targets
4. **ALS** — SOD1, TDP-43, FUS targets
5. **IPF (Lung Fibrosis)** — TGF-β, MUC5B targets
6. **Parkinson's Disease** — α-synuclein, LRRK2 targets
7. **Pancreatic Cancer** — KRAS G12D, p53 targets
