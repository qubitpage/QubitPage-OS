#!/usr/bin/env python3
"""Extended QubiLogic tests — detailed analysis at key parameter ranges."""
import json
import time
from qubilogic import QubiLogicEngine, SteaneQEC


def run_crossover_analysis():
    """Find exactly where QubiLogic buffer starts helping."""
    print("=" * 70)
    print("CROSSOVER ANALYSIS: When does the buffer start helping?")
    print("noise=0.005, bell — fine-grained idle rounds")
    print("=" * 70)
    print(f"{'idle':>6} {'no_buf':>10} {'escort':>10} {'delta':>10}")
    print("-" * 40)

    for idle in [0, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 40, 50]:
        engine = QubiLogicEngine(n_escorts=2, n_transit=3, error_rate=0.005)
        nb = engine.benchmark_no_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=0.005, idle_rounds=idle)
        wb = engine.benchmark_with_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=0.005, idle_rounds=idle)
        nb_f = nb.get("fidelity", 0)
        wb_f = wb.get("effective_fidelity", 0)
        print(f"{idle:>6d} {nb_f:>10.6f} {wb_f:>10.6f} {wb_f - nb_f:>+10.6f}")
    print()


def run_noise_threshold():
    """Find the noise threshold where QEC can't help anymore."""
    print("=" * 70)
    print("NOISE THRESHOLD: At what error rate does QEC stop helping?")
    print("idle=20, bell")
    print("=" * 70)
    print(f"{'noise':>10} {'no_buf':>10} {'escort':>10} {'delta':>10} {'p_L':>12}")
    print("-" * 60)

    for noise in [0.0001, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]:
        engine = QubiLogicEngine(n_escorts=2, n_transit=3, error_rate=max(noise, 0.0001))
        nb = engine.benchmark_no_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=noise, idle_rounds=20)
        wb = engine.benchmark_with_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=noise, idle_rounds=20)
        nb_f = nb.get("fidelity", 0)
        wb_f = wb.get("effective_fidelity", 0)
        p_L = 21 * noise * noise
        print(f"{noise:>10.4f} {nb_f:>10.6f} {wb_f:>10.6f} "
              f"{wb_f - nb_f:>+10.6f} {p_L:>12.8f}")
    print()


def run_multi_round_qec():
    """Test multiple QEC rounds per idle cycle."""
    print("=" * 70)
    print("MULTI-ROUND QEC: Effect of qec_rounds parameter")
    print("noise=0.005, idle=20, bell")
    print("=" * 70)
    print(f"{'qec_rnds':>10} {'escort':>10} {'delta_vs_0':>12}")
    print("-" * 35)

    engine_nb = QubiLogicEngine(n_escorts=2, n_transit=3, error_rate=0.005)
    nb = engine_nb.benchmark_no_buffer(
        circuit_type="bell", shots=10000,
        noise_rate=0.005, idle_rounds=20)
    nb_f = nb.get("fidelity", 0)

    for qec_rounds in [1, 2, 3, 5]:
        engine = QubiLogicEngine(n_escorts=2, n_transit=3, error_rate=0.005)
        wb = engine.benchmark_with_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=0.005, idle_rounds=20,
            qec_rounds=qec_rounds)
        wb_f = wb.get("effective_fidelity", 0)
        print(f"{qec_rounds:>10d} {wb_f:>10.6f} {wb_f - nb_f:>+12.6f}")

    print(f"\n(no_buffer baseline: {nb_f:.6f})")
    print()


def run_overhead_analysis():
    """Analyze qubit overhead."""
    print("=" * 70)
    print("QUBIT OVERHEAD ANALYSIS")
    print("=" * 70)

    for n_esc in [1, 2, 3, 4]:
        for n_tran in [2, 3, 4]:
            engine = QubiLogicEngine(n_escorts=n_esc, n_transit=n_tran, error_rate=0.005)
            overhead = engine.total_overhead_qubits()
            # Steane code: 13 qubits per block (7 data + 6 ancilla)
            available_on_fez = 156 - overhead
            print(f"  escorts={n_esc}, transit={n_tran}: "
                  f"overhead={overhead} qubits, "
                  f"available on IBM Fez (156q): {available_on_fez}")
    print()


def run_statistical_significance():
    """Run same test multiple times to check variance."""
    print("=" * 70)
    print("STATISTICAL SIGNIFICANCE: 5 runs at same parameters")
    print("noise=0.005, idle=10, bell, 10000 shots each")
    print("=" * 70)

    nb_vals = []
    wb_vals = []
    imp_vals = []

    for run in range(5):
        engine = QubiLogicEngine(n_escorts=2, n_transit=3, error_rate=0.005)
        nb = engine.benchmark_no_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=0.005, idle_rounds=10)
        wb = engine.benchmark_with_buffer(
            circuit_type="bell", shots=10000,
            noise_rate=0.005, idle_rounds=10)
        nb_f = nb.get("fidelity", 0)
        wb_f = wb.get("effective_fidelity", 0)
        imp = wb_f - nb_f
        nb_vals.append(nb_f)
        wb_vals.append(wb_f)
        imp_vals.append(imp)
        print(f"  Run {run+1}: no_buf={nb_f:.6f}, escort={wb_f:.6f}, "
              f"improvement={imp:+.6f}")

    import statistics
    print(f"\n  no_buf mean={statistics.mean(nb_vals):.6f} "
          f"stdev={statistics.stdev(nb_vals):.6f}")
    print(f"  escort mean={statistics.mean(wb_vals):.6f} "
          f"stdev={statistics.stdev(wb_vals):.6f}")
    print(f"  improvement mean={statistics.mean(imp_vals):+.6f} "
          f"stdev={statistics.stdev(imp_vals):.6f}")
    print()


if __name__ == "__main__":
    t0 = time.time()
    print("\n" + "=" * 70)
    print("  QubiLogic Memory® — Extended Analysis")
    print("=" * 70 + "\n")

    run_crossover_analysis()
    run_noise_threshold()
    run_multi_round_qec()
    run_overhead_analysis()
    run_statistical_significance()

    elapsed = time.time() - t0
    print(f"Total test time: {elapsed:.1f} seconds")
    print("=" * 70)
