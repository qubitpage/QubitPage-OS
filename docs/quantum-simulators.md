# Quantum Simulators & Backends

> **Supported in QubitPage® OS v1.1.0** — All backends accessible from the Circuit Lab and QuBIOS apps

---

## Table of Contents

1. [Overview](#overview)
2. [IBM Quantum (Paid)](#ibm-quantum)
3. [Stim — Clifford Simulator (Built-in, Free)](#stim)
4. [Qiskit Statevector (Built-in, Free)](#qiskit-statevector)
5. [Google Cirq (Free)](#google-cirq)
6. [Google Quantum Computing Service](#google-qcs)
7. [Amazon Braket](#amazon-braket)
8. [Backend Comparison Table](#backend-comparison)

---

## Overview

QubitPage® OS supports multiple quantum backends. The system automatically falls back to local simulators if cloud backends are unavailable.

```python
# Backend selection (src/quantum_backends.py)
backend_mgr = QuantumBackendManager(
    ibm_token=IBM_QUANTUM_TOKEN,       # IBM real hardware
    aws_access_key=AWS_ACCESS_KEY,      # Amazon Braket
    aws_secret_key=AWS_SECRET_KEY,
)
```

---

## IBM Quantum

**Cost:** Paid (Open Plan: 10 min/month free on real hardware)  
**Access:** [quantum.ibm.com](https://quantum.ibm.com)

```bash
export IBM_QUANTUM_TOKEN=your_token_here
```

### Available IBM Backends

| Backend ID | Qubits | Topology | Best For |
|------------|--------|----------|----------|
| `ibm_fez` | 156 | Heavy-Hex | Drug simulation, large circuits |
| `ibm_sherbrooke` | 127 | Heavy-Hex | Bell states, VQE |
| `ibm_brisbane` | 127 | Heavy-Hex | QAOA, Grover |
| `ibm_kyiv` | 127 | Heavy-Hex | Error correction |
| `simulator_mps` | 100 | Matrix Product State | Variational algorithms |
| `statevector_simulator` | 32 | Exact | Testing, debugging |

### Validated Results (IBM Fez — Feb 2026)

```json
{
  "backend": "ibm_fez",
  "bell_state_fidelity": 0.9980,
  "ghz_3q_fidelity": 0.9945,
  "transit_ring_lifespan_multiplier": 5.0,
  "validation_timestamp": "2026-02-22"
}
```

---

## Stim

**Cost:** Free, open-source  
**Creator:** Craig Gidney (Google)  
**GitHub:** [github.com/quantumlib/Stim](https://github.com/quantumlib/Stim)  
**Install:** `pip install stim>=1.13`

Stim is the **default local simulator** in QubitPage® OS — used for all Clifford circuits including the QuBIOS Transit Ring and Steane QEC.

```python
import stim

circuit = stim.Circuit("""
    H 0
    CNOT 0 1
    M 0 1
""")
samples = circuit.compile_sampler().sample(1000)
print(f"Bell state: {samples[:5]}")  # [[0,0], [1,1], ...]
```

**Why Stim?**
- 1 billion Clifford gate operations per second
- Native Pauli frame simulation
- Built for quantum error correction research
- Used by Google's quantum error correction team

---

## Qiskit Statevector

**Cost:** Free  
**Install:** `pip install qiskit>=1.0`

Used for exact simulation of ≤32 qubit circuits including VQE, QAOA, and variational drug discovery algorithms.

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

sim = AerSimulator(method='statevector')
result = sim.run(qc, shots=10000).result()
print(result.get_counts())
```

---

## Google Cirq

**Cost:** Free (local simulator)  
**Install:** `pip install cirq>=1.3`  
**GitHub:** [github.com/quantumlib/Cirq](https://github.com/quantumlib/Cirq)  
**Docs:** [quantumai.google/cirq](https://quantumai.google/cirq)

Google's primary quantum computing framework. Excellent for NISQ device simulation and custom gate sets.

```python
import cirq

# Bell state
q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit([
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key='result')
])
simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1000)
print(result.histogram(key='result'))
```

### Cirq Noise Models (For NISQ simulation)

```python
# Depolarizing noise — nearest to real hardware
noise = cirq.ConstantQubitNoiseModel(cirq.depolarize(p=0.005))
noisy_sim = cirq.DensityMatrixSimulator(noise=noise)
result = noisy_sim.run(circuit, repetitions=1000)
```

### Integration with QubitPage® OS

```python
# In quantum_backends.py — add Cirq backend
import cirq
circuit_cirq = cirq.Circuit(...)
simulator = cirq.Simulator()
result = simulator.simulate(circuit_cirq)
fidelity = abs(result.final_state_vector[0])**2
```

---

## Google Quantum Computing Service

**Cost:** Research access (apply at [quantumai.google](https://quantumai.google))  
**Hardware:** Willow (105 qubits, below threshold error correction)

Google's Willow processor achieved **below-threshold quantum error correction** in December 2024 — a major breakthrough.

**Key capabilities:**
- 105 physical qubits
- Surface code error correction
- Random Circuit Sampling (RCS) benchmark: 10^25× faster than classical

To use Google QCS:
```bash
pip install cirq-google
export GOOGLE_CLOUD_PROJECT=your_project_id
```

```python
import cirq_google
processor = cirq_google.get_engine_processor('willow')
result = processor.run(circuit, repetitions=1000)
```

---

## Amazon Braket

**Cost:** Paid (AWS account required)  
**Docs:** [docs.aws.amazon.com/braket](https://docs.aws.amazon.com/braket/latest/developerguide)

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1
```

| Device | Qubits | Provider |
|--------|--------|----------|
| IonQ Aria | 25 | IonQ |
| Rigetti Ankaa | 84 | Rigetti |
| Oxford Ionics | 32 | OQC |
| SV1 (simulator) | 34 | AWS |

---

## Backend Comparison

| Backend | Qubits | Cost | Noise | Speed | Best Use Case |
|---------|--------|------|-------|-------|---------------|
| **Stim** | ∞ Clifford | Free | None/Custom | 10⁹ gates/s | QEC, Transit Ring |
| **Qiskit Statevector** | ≤32 | Free | None/Custom | Fast | VQE, QAOA |
| **Google Cirq** | ≤30 | Free | Configurable | Fast | Drug sim, NISQ |
| **IBM Fez** | 156 | Paid | Real noise | Queue | Validation |
| **IBM simulators** | 100 | Paid | None | Fast | IBM workflows |
| **Google Willow** | 105 | Research | Real noise | Queue | QEC research |
| **Amazon IonQ** | 25 | Paid | Real noise | Queue | High-fidelity |
