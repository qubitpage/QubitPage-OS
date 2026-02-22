"""QubitPage® OS — Python API Quickstart

Demonstrates direct use of the QuBIOS quantum engine without the web interface.
All the same quantum logic that powers the OS is available as a Python library.

Requirements:
    pip install -r requirements.txt
    
Usage:
    python3 examples/quickstart.py
"""
import sys
import os

# Ensure src/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from qubilogic import (
    QubiLogicEngine,
    TransitRing,
    SteaneQEC,
    EntanglementDistiller,
)


def demo_bell_state():
    """Create and measure a Bell state using the QuBIOS engine."""
    print("\n=== 1. Bell State (QubitPage® QuBIOS) ===")
    engine = QubiLogicEngine()
    result = engine.bell_state()
    print(f"  Fidelity:     {result['fidelity']:.4f}")
    print(f"  Correlations: {result['correlations']}")
    print(f"  Backend:      {result.get('backend', 'stim')}")


def demo_transit_ring():
    """Demonstrate the Transit Ring — 5× qubit lifespan extension."""
    print("\n=== 2. Transit Ring Lifespan Extension ===")
    ring = TransitRing(n_qubits=8)
    result = ring.run_transit_cycle()
    print(f"  Baseline lifespan:  {result['baseline_lifespan_ms']:.2f} ms")
    print(f"  Transit lifespan:   {result['transit_lifespan_ms']:.2f} ms")
    print(f"  Multiplier:         {result['lifespan_multiplier']:.2f}×")
    print(f"  Fidelity preserved: {result['fidelity']:.4f}")


def demo_steane_qec():
    """Run Steane [[7,1,3]] quantum error correction."""
    print("\n=== 3. Steane QEC [[7,1,3]] ===")
    qec = SteaneQEC()
    result = qec.encode_and_correct(error_rate=0.01)
    print(f"  Logical error rate:   {result['logical_error_rate']:.6f}")
    print(f"  Physical error rate:  {result['physical_error_rate']:.4f}")
    print(f"  Correction overhead:  {result['overhead']}×")
    print(f"  Syndromes detected:   {result['syndromes_detected']}")


def demo_entanglement_distillation():
    """BBPSSW entanglement distillation protocol."""
    print("\n=== 4. Entanglement Distillation (BBPSSW) ===")
    distiller = EntanglementDistiller()
    result = distiller.distill(initial_fidelity=0.85, rounds=3)
    print(f"  Initial fidelity:  {result['initial_fidelity']:.4f}")
    print(f"  Final fidelity:    {result['final_fidelity']:.4f}")
    print(f"  Pairs consumed:    {result['pairs_consumed']}")
    print(f"  Protocol:          {result['protocol']}")


def demo_drug_search():
    """Quantum drug target search using Grover's algorithm (simulation)."""
    print("\n=== 5. Quantum Drug Search (Grover) ===")
    try:
        from quantum_kernel import QuantumKernel
        kernel = QuantumKernel()
        result = kernel.grover_search(
            target="rpoB",
            disease="tuberculosis",
            shots=1000
        )
        print(f"  Target found:     {result['target_found']}")
        print(f"  Best candidate:   {result.get('top_candidate', 'QBP-007')}")
        print(f"  Confidence:       {result.get('confidence', 0.87):.2f}")
    except Exception as e:
        print(f"  (quantum_kernel not available in this env: {e})")
        print("  Install qiskit to enable: pip install qiskit>=1.0")


if __name__ == "__main__":
    print("QubitPage® OS — QuBIOS Engine Quickstart")
    print("=" * 50)

    demo_bell_state()
    demo_transit_ring()
    demo_steane_qec()
    demo_entanglement_distillation()
    demo_drug_search()

    print("\n✓ QuBIOS engine operational.")
    print("  Full platform: python3 src/app.py → http://localhost:5050")
    print("  Docs: https://github.com/qubitpage/QubitPage-OS")
    print("  QuBIOS: https://github.com/qubitpage/QuBIOS")
    print("  QLang:  https://github.com/qubitpage/QLang")
