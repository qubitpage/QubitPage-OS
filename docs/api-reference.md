# QubitPage® OS — REST API Reference

> Base URL: `http://localhost:5050`  
> All JSON endpoints. Authentication via session cookie (login at `/`).

---

## Authentication

```bash
# Login
POST /api/auth/login
{"username": "user", "password": "pass"}
→ {"success": true, "token": "..."}

# Register
POST /api/auth/register
{"username": "...", "password": "...", "email": "..."}
```

---

## Quantum Circuits

```bash
# Execute a QLang circuit
POST /api/circuit/run
{"circuit": "BELL2 q0 q1\nM q0 q1", "backend": "stim", "shots": 1000}
→ {"result": {"counts": {"00": 501, "11": 499}, "fidelity": 0.998}}

# List available backends
GET /api/backends
→ {"backends": ["stim", "qasm_simulator", "ibm_fez", ...]}

# Backend status
GET /api/backends/status
→ {"ibm": {"online": true}, "stim": {"online": true}, "google": {"online": false}}
```

---

## Drug Discovery

```bash
# Run quantum drug simulation
POST /api/drug/simulate
{"compound_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O", "target": "rpoB", "disease": "tuberculosis"}
→ {"binding_affinity": -9.2, "admet": {...}, "candidate_id": "QBP-007"}

# ADMET prediction
POST /api/drug/admet
{"smiles": "C1CCCCC1"}
→ {"mw": 84.16, "logP": 2.0, "qed": 0.45, "bbb": true, "lipinski": true}

# Get all discoveries
GET /api/discoveries
→ {"total": 13, "discoveries": [...]}
```

---

## AI (ARIA + MedGemma)

```bash
# Ask ARIA (Gemini/Groq powered)
POST /api/aria/ask
{"message": "What is DprE1 and why is it a TB drug target?", "context": "tuberculosis"}
→ {"response": "DprE1 (decaprenylphosphoryl-β-D-ribose 2′-epimerase) is..."}

# MedGemma analysis
POST /api/medgemma/analyze
{"prompt": "Analyze compound QBP-007 for TB treatment", "smiles": "..."}
→ {"analysis": "...", "confidence": 0.87, "recommendation": "high_priority"}
```

---

## QuBIOS (Transit Ring)

```bash
# Bell state
GET /api/qubilogic/bell
→ {"fidelity": 0.998, "correlations": "XX, ZZ"}

# Transit Ring cycle
POST /api/qubilogic/transit
{"n_qubits": 8, "cycles": 3}
→ {"lifespan_multiplier": 5.0, "fidelity": 0.998}

# Steane QEC
POST /api/qubilogic/qec
{"error_rate": 0.01, "rounds": 5}
→ {"logical_error_rate": 0.0001, "syndromes_detected": 12}
```

---

## System

```bash
# Health check
GET /api/health
→ {"status": "ok", "version": "1.1.0", "uptime_seconds": 3600}

# System info
GET /api/system/info
→ {"os": "QubitPage® Quantum OS", "version": "1.1.0", "backends": {...}}
```
