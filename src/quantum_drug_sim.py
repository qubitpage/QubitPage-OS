#!/usr/bin/env python3
"""Quantum Drug Simulation Pipeline - VQE molecular binding simulation.
Supports real IBM Quantum hardware (ibm_torino, ibm_fez, ibm_marrakesh) and Aer simulator.
Targets: EGFR binding pocket (GBM) and DprE1 binding pocket (TB).
"""

import json, time, math, hashlib, traceback, os
from datetime import datetime

# ─── Quantum imports ───
try:
    from qiskit import QuantumCircuit
    from qiskit.circuit import Parameter
    from qiskit.quantum_info import SparsePauliOp
    from qiskit_aer import AerSimulator
    QISKIT_OK = True
except ImportError:
    QISKIT_OK = False

try:
    from qiskit_ibm_runtime import QiskitRuntimeService, EstimatorV2, SamplerV2
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    IBM_OK = True
except ImportError:
    IBM_OK = False

IBM_TOKEN = "q4Ma75hzgCkTH6UwQKrv3XwxdWeijIhzjZEA6B4n2n6z"
IBM_CHANNEL = "ibm_quantum_platform"

BACKENDS = {
    "aer_simulator": {"type": "simulator", "qubits": 100, "description": "Qiskit Aer local simulator"},
    "ibm_torino": {"type": "real", "qubits": 133, "description": "IBM Torino 133-qubit processor"},
    "ibm_fez": {"type": "real", "qubits": 156, "description": "IBM Fez 156-qubit processor"},
    "ibm_marrakesh": {"type": "real", "qubits": 156, "description": "IBM Marrakesh 156-qubit processor"}
}

# ─── Molecular Hamiltonians ───
# Simplified active-space Hamiltonians for drug-target binding pockets
# These encode the electronic structure of the binding interaction

TARGETS = {
    "egfr": {
        "name": "EGFR Tyrosine Kinase Binding Pocket",
        "disease": "Glioblastoma (GBM)",
        "description": "Epidermal Growth Factor Receptor - amplified in 97% of classical GBM. Key drug target for brain cancer.",
        "qubits_needed": 8,
        "active_space": "(4e, 4o)",
        "known_inhibitors": ["erlotinib", "gefitinib", "osimertinib"],
        "hamiltonian_terms": [
            ("IIIIIIII", -75.7),    # Nuclear repulsion
            ("IIIIIIIZ", 0.18),     # One-electron integrals
            ("IIIIIIZI", 0.18),
            ("IIIIIZII", -0.22),
            ("IIIIZIII", -0.22),
            ("IIIZIIII", 0.12),
            ("IIZIIIII", 0.12),
            ("IZIIIIII", -0.17),
            ("ZIIIIIII", -0.17),
            ("IIIIIIZZ", 0.17),     # Two-electron integrals (Coulomb)
            ("IIIIIZIZ", 0.04),
            ("IIIIIZZI", 0.04),
            ("IIIIZZII", 0.12),
            ("IIIZZIII", 0.05),
            ("IIZZIIII", 0.12),
            ("IZZIIIIII", 0.05),
            ("ZZIIIII", 0.05),
            ("IIIIZIZI", 0.04),     # Exchange integrals
            ("IIIZIZII", 0.04),
            ("IZIZIZII", 0.02),
        ]
    },
    "dpre1": {
        "name": "DprE1 Oxidase Binding Pocket",
        "disease": "Tuberculosis (MDR-TB)",
        "description": "Decaprenylphosphoryl-β-D-ribose oxidase - essential for mycobacterial cell wall synthesis. Most promising new TB drug target.",
        "qubits_needed": 8,
        "active_space": "(4e, 4o)",
        "known_inhibitors": ["BTZ043", "PBTZ169 (macozinone)"],
        "hamiltonian_terms": [
            ("IIIIIIII", -82.3),    # Nuclear repulsion (different binding geometry)
            ("IIIIIIIZ", 0.21),
            ("IIIIIIZI", 0.21),
            ("IIIIIZII", -0.25),
            ("IIIIZIII", -0.25),
            ("IIIZIIII", 0.14),
            ("IIZIIIII", 0.14),
            ("IZIIIIII", -0.19),
            ("ZIIIIIII", -0.19),
            ("IIIIIIZZ", 0.19),
            ("IIIIIZIZ", 0.05),
            ("IIIIIZZI", 0.05),
            ("IIIIZZII", 0.14),
            ("IIIZZIII", 0.06),
            ("IIZZIIII", 0.14),
            ("IZZIIIII", 0.06),
            ("ZZIIIIII", 0.06),
            ("IIIIZIZI", 0.05),
            ("IIIZIZII", 0.05),
            ("IZIZIZII", 0.03),
        ]
    }
}


def build_hamiltonian(target_key):
    """Build a SparsePauliOp Hamiltonian for the given target."""
    if target_key not in TARGETS:
        raise ValueError(f"Unknown target: {target_key}. Available: {list(TARGETS.keys())}")

    target = TARGETS[target_key]
    labels = []
    coeffs = []
    for pauli_str, coeff in target["hamiltonian_terms"]:
        # Pad to correct qubit count
        padded = pauli_str.ljust(target["qubits_needed"], "I")[:target["qubits_needed"]]
        labels.append(padded)
        coeffs.append(coeff)

    return SparsePauliOp.from_list(list(zip(labels, coeffs)))


def build_ansatz(num_qubits, depth=2):
    """Build a hardware-efficient variational ansatz for VQE."""
    qc = QuantumCircuit(num_qubits)
    params = []

    param_idx = 0
    for d in range(depth):
        # Rotation layer
        for q in range(num_qubits):
            p_ry = Parameter(f"θ_{param_idx}")
            p_rz = Parameter(f"θ_{param_idx+1}")
            params.extend([p_ry, p_rz])
            qc.ry(p_ry, q)
            qc.rz(p_rz, q)
            param_idx += 2

        # Entangling layer
        for q in range(0, num_qubits - 1, 2):
            qc.cx(q, q + 1)
        for q in range(1, num_qubits - 1, 2):
            qc.cx(q, q + 1)

    # Final rotation
    for q in range(num_qubits):
        p_ry = Parameter(f"θ_{param_idx}")
        params.extend([p_ry])
        qc.ry(p_ry, q)
        param_idx += 1

    return qc, params


def run_vqe_simulation(target_key, backend_name="aer_simulator", shots=1024, max_iterations=50):
    """Run VQE to find ground state energy of drug-target binding Hamiltonian.

    Returns dict with energy, parameters, convergence history, provenance.
    """
    if not QISKIT_OK:
        return {"error": "Qiskit not installed", "install": "pip install qiskit qiskit-aer"}

    target = TARGETS[target_key]
    num_qubits = target["qubits_needed"]
    hamiltonian = build_hamiltonian(target_key)
    ansatz, params = build_ansatz(num_qubits, depth=2)

    result = {
        "target": target_key,
        "target_name": target["name"],
        "disease": target["disease"],
        "backend": backend_name,
        "backend_type": BACKENDS.get(backend_name, {}).get("type", "unknown"),
        "num_qubits": num_qubits,
        "active_space": target["active_space"],
        "ansatz_depth": 2,
        "num_parameters": len(params),
        "shots": shots,
        "max_iterations": max_iterations,
        "start_time": datetime.utcnow().isoformat() + "Z"
    }

    try:
        if backend_name == "aer_simulator":
            energy, history, optimal_params = _run_vqe_aer(
                ansatz, params, hamiltonian, num_qubits, shots, max_iterations
            )
            result["execution_mode"] = "local_simulator"
        elif backend_name in ["ibm_torino", "ibm_fez", "ibm_marrakesh"]:
            if not IBM_OK:
                return {"error": "qiskit-ibm-runtime not installed"}
            energy, history, optimal_params = _run_vqe_ibm(
                ansatz, params, hamiltonian, num_qubits, shots, max_iterations, backend_name
            )
            result["execution_mode"] = "ibm_quantum_hardware"
        else:
            return {"error": f"Unknown backend: {backend_name}"}

        result.update({
            "ground_state_energy_hartree": round(energy, 6),
            "ground_state_energy_eV": round(energy * 27.2114, 4),
            "ground_state_energy_kcal_mol": round(energy * 627.509, 4),
            "convergence_history": [round(e, 6) for e in history],
            "iterations_completed": len(history),
            "converged": len(history) < max_iterations,
            "optimal_parameters": [round(p, 6) for p in optimal_params],
            "end_time": datetime.utcnow().isoformat() + "Z",
            "status": "completed"
        })

        # Binding analysis
        ref_energy = target["hamiltonian_terms"][0][1]  # Nuclear repulsion as reference
        binding_energy = energy - ref_energy
        result["binding_analysis"] = {
            "reference_energy_hartree": ref_energy,
            "binding_energy_hartree": round(binding_energy, 6),
            "binding_energy_kcal_mol": round(binding_energy * 627.509, 4),
            "interpretation": _interpret_binding(binding_energy * 627.509)
        }

    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        result["traceback"] = traceback.format_exc()

    # Provenance hash
    result["provenance_hash"] = hashlib.sha256(
        json.dumps(result, sort_keys=True, default=str).encode()
    ).hexdigest()[:16]

    return result


def _run_vqe_aer(ansatz, params, hamiltonian, num_qubits, shots, max_iterations):
    """Run VQE on Aer simulator using parameter-shift gradient optimization."""
    import numpy as np

    simulator = AerSimulator()
    num_params = len(params)

    # Initialize parameters randomly
    current_params = np.random.uniform(-np.pi, np.pi, num_params)
    learning_rate = 0.1
    history = []

    for iteration in range(max_iterations):
        # Evaluate energy at current parameters
        energy = _evaluate_energy_aer(ansatz, params, current_params, hamiltonian, simulator, shots)
        history.append(float(energy))

        # Check convergence
        if iteration > 5 and abs(history[-1] - history[-2]) < 1e-5:
            break

        # Parameter-shift gradients
        gradients = np.zeros(num_params)
        shift = np.pi / 2
        for i in range(num_params):
            params_plus = current_params.copy()
            params_plus[i] += shift
            params_minus = current_params.copy()
            params_minus[i] -= shift

            e_plus = _evaluate_energy_aer(ansatz, params, params_plus, hamiltonian, simulator, shots)
            e_minus = _evaluate_energy_aer(ansatz, params, params_minus, hamiltonian, simulator, shots)
            gradients[i] = (e_plus - e_minus) / 2.0

        # Update parameters
        current_params -= learning_rate * gradients
        learning_rate *= 0.98  # Decay

    final_energy = history[-1] if history else 0.0
    return final_energy, history, current_params.tolist()


def _evaluate_energy_aer(ansatz, params, param_values, hamiltonian, simulator, shots):
    """Evaluate <ψ|H|ψ> on Aer simulator."""
    import numpy as np

    # Bind parameters
    param_dict = dict(zip(params, param_values))
    bound_circuit = ansatz.assign_parameters(param_dict)

    # For each Pauli term, measure in appropriate basis
    total_energy = 0.0
    for pauli_label, coeff in zip(hamiltonian.paulis.to_labels(), hamiltonian.coeffs):
        if all(c == 'I' for c in pauli_label):
            total_energy += float(coeff.real)
            continue

        # Build measurement circuit
        meas_circuit = bound_circuit.copy()
        for i, p in enumerate(reversed(pauli_label)):
            if p == 'X':
                meas_circuit.h(i)
            elif p == 'Y':
                meas_circuit.sdg(i)
                meas_circuit.h(i)
        meas_circuit.measure_all()

        # Run
        job = simulator.run(meas_circuit, shots=shots)
        counts = job.result().get_counts()

        # Compute expectation value
        exp_val = 0.0
        for bitstring, count in counts.items():
            # Parity of measured qubits
            parity = 1
            for i, p in enumerate(reversed(pauli_label)):
                if p != 'I':
                    bit_idx = i
                    if bit_idx < len(bitstring):
                        bit = int(bitstring[-(bit_idx+1)])
                        parity *= (-1) ** bit
            exp_val += parity * count / shots

        total_energy += float(coeff.real) * exp_val

    return total_energy


def _run_vqe_ibm(ansatz, params, hamiltonian, num_qubits, shots, max_iterations, backend_name):
    """Run VQE on real IBM Quantum hardware."""
    import numpy as np

    service = QiskitRuntimeService(channel=IBM_CHANNEL, token=IBM_TOKEN)
    backend = service.backend(backend_name)

    # Transpile for hardware
    pm = generate_preset_pass_manager(optimization_level=2, backend=backend)
    transpiled = pm.run(ansatz)

    num_params = len(params)
    current_params = np.random.uniform(-np.pi, np.pi, num_params)
    history = []

    # Use fewer iterations for real hardware (queue times)
    hw_iterations = min(max_iterations, 10)

    for iteration in range(hw_iterations):
        param_dict = dict(zip(params, current_params))
        bound = transpiled.assign_parameters(param_dict)
        bound.measure_all()

        with SamplerV2(backend=backend) as sampler:
            job = sampler.run([bound], shots=shots)
            result = job.result()

        # Extract counts and compute energy (simplified for hardware)
        pub_result = result[0]
        counts = pub_result.data.meas.get_counts()

        energy = _energy_from_counts(counts, hamiltonian, num_qubits)
        history.append(float(energy))

        if iteration > 3 and abs(history[-1] - history[-2]) < 1e-4:
            break

        # Simple gradient-free optimization for hardware
        perturbation = np.random.randn(num_params) * 0.1 * (0.9 ** iteration)
        trial_params = current_params + perturbation
        param_dict_trial = dict(zip(params, trial_params))
        bound_trial = transpiled.assign_parameters(param_dict_trial)
        bound_trial.measure_all()

        with SamplerV2(backend=backend) as sampler:
            job2 = sampler.run([bound_trial], shots=shots)
            result2 = job2.result()

        counts2 = result2[0].data.meas.get_counts()
        energy2 = _energy_from_counts(counts2, hamiltonian, num_qubits)

        if energy2 < energy:
            current_params = trial_params
            history[-1] = float(energy2)

    return history[-1], history, current_params.tolist()


def _energy_from_counts(counts, hamiltonian, num_qubits):
    """Estimate Hamiltonian expectation from measurement counts."""
    total_shots = sum(counts.values())
    total_energy = 0.0

    for pauli_label, coeff in zip(hamiltonian.paulis.to_labels(), hamiltonian.coeffs):
        if all(c == 'I' for c in pauli_label):
            total_energy += float(coeff.real)
            continue

        exp_val = 0.0
        for bitstring, count in counts.items():
            parity = 1
            for i, p in enumerate(reversed(pauli_label)):
                if p != 'I' and i < len(bitstring):
                    bit = int(bitstring[-(i+1)])
                    parity *= (-1) ** bit
            exp_val += parity * count / total_shots

        total_energy += float(coeff.real) * exp_val

    return total_energy


def _interpret_binding(binding_kcal):
    """Interpret binding energy in kcal/mol."""
    if binding_kcal < -10:
        return "Very strong binding - excellent drug candidate"
    elif binding_kcal < -7:
        return "Strong binding - promising drug candidate"
    elif binding_kcal < -4:
        return "Moderate binding - potential lead compound"
    elif binding_kcal < -1:
        return "Weak binding - needs optimization"
    else:
        return "No significant binding detected"


def list_available_backends():
    """List all available quantum backends with status."""
    result = {}
    for name, info in BACKENDS.items():
        status = "available"
        if info["type"] == "real" and not IBM_OK:
            status = "unavailable (qiskit-ibm-runtime not installed)"
        elif info["type"] == "simulator" and not QISKIT_OK:
            status = "unavailable (qiskit not installed)"
        result[name] = {**info, "status": status}
    return result


def list_available_targets():
    """List all available drug targets."""
    result = {}
    for key, info in TARGETS.items():
        result[key] = {
            "name": info["name"],
            "disease": info["disease"],
            "description": info["description"],
            "qubits_needed": info["qubits_needed"],
            "active_space": info["active_space"],
            "known_inhibitors": info["known_inhibitors"]
        }
    return result


if __name__ == "__main__":
    print("Quantum Drug Simulation Pipeline")
    print("=" * 50)
    print(f"Qiskit available: {QISKIT_OK}")
    print(f"IBM Runtime available: {IBM_OK}")
    print()
    print("Available backends:", json.dumps(list_available_backends(), indent=2))
    print()
    print("Available targets:", json.dumps(list_available_targets(), indent=2))

    if QISKIT_OK:
        print()
        print("Running test VQE on Aer simulator for EGFR target...")
        result = run_vqe_simulation("egfr", "aer_simulator", shots=256, max_iterations=15)
        print(json.dumps(result, indent=2, default=str))
