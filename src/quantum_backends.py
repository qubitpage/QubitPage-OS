"""QubitPage® Quantum OS — Quantum Backends Manager.

Manages all quantum computing backends:
  - Amazon Braket (simulators + real QPU hardware)
  - IBM Quantum (simulators + real QPU hardware)  
  - Local Stim simulator
  
Features:
  - Device enumeration with live status
  - Connection testing per provider
  - Free/paid classification
  - Admin-controlled backend visibility
  - Circuit execution on any backend
"""
from __future__ import annotations
import json, logging, time, traceback
from dataclasses import dataclass, field, asdict
from typing import Optional

logger = logging.getLogger("quantum_backends")

# ── SDK availability ─────────────────────────────────────────

try:
    import stim
    HAS_STIM = True
except ImportError:
    HAS_STIM = False

try:
    from braket.aws import AwsDevice, AwsSession
    from braket.circuits import Circuit as BraketCircuit
    from braket.devices import LocalSimulator as BraketLocalSim
    HAS_BRAKET = True
except ImportError:
    HAS_BRAKET = False

try:
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    from qiskit import QuantumCircuit
    HAS_IBM = True
except ImportError:
    HAS_IBM = False


# ── Master Backend Registry ─────────────────────────────────
# All known quantum backends with metadata

MASTER_BACKENDS = {
    # ═══ Local Simulators (Always Free) ═══
    "local_stim": {
        "id": "local_stim",
        "name": "Stim Simulator",
        "provider": "local",
        "provider_display": "QubitPage Local",
        "device_type": "simulator",
        "qubits": 1000,
        "pricing": "free",
        "price_info": "Always free — runs locally",
        "description": "Ultra-fast Clifford circuit simulator running locally on the server. Supports error correction circuits.",
        "region": "local",
        "technology": "Clifford simulation",
    },

    # ═══ Amazon Braket — Simulators ═══
    "braket_sv1": {
        "id": "braket_sv1",
        "name": "Amazon SV1",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket",
        "device_type": "simulator",
        "qubits": 34,
        "pricing": "free_tier",
        "price_info": "1 hr/month free, then $0.075/min",
        "description": "State Vector Simulator — full state vector simulation up to 34 qubits. Ideal for testing circuits.",
        "arn": "arn:aws:braket:::device/quantum-simulator/amazon/sv1",
        "region": "us-east-1",
        "technology": "State vector",
    },
    "braket_dm1": {
        "id": "braket_dm1",
        "name": "Amazon DM1",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket",
        "device_type": "simulator",
        "qubits": 17,
        "pricing": "free_tier",
        "price_info": "1 hr/month free, then $0.075/min",
        "description": "Density Matrix Simulator — supports noise modeling, up to 17 qubits. Great for error analysis.",
        "arn": "arn:aws:braket:::device/quantum-simulator/amazon/dm1",
        "region": "us-east-1",
        "technology": "Density matrix",
    },
    "braket_tn1": {
        "id": "braket_tn1",
        "name": "Amazon TN1",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket",
        "device_type": "simulator",
        "qubits": 50,
        "pricing": "free_tier",
        "price_info": "1 hr/month free, then $0.075/min",
        "description": "Tensor Network Simulator — efficient for sparse/structured circuits up to 50 qubits.",
        "arn": "arn:aws:braket:::device/quantum-simulator/amazon/tn1",
        "region": "us-west-2",
        "technology": "Tensor network",
    },
    "braket_local": {
        "id": "braket_local",
        "name": "Braket Local Sim",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket",
        "device_type": "simulator",
        "qubits": 25,
        "pricing": "free",
        "price_info": "Always free — runs locally with Braket SDK",
        "description": "Local Braket simulator running on server. No AWS charges. Requires amazon-braket-sdk installed.",
        "arn": "local",
        "region": "local",
        "technology": "State vector (local)",
    },

    # ═══ Amazon Braket — QPU Hardware ═══
    "braket_ionq_aria": {
        "id": "braket_ionq_aria",
        "name": "IonQ Aria",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket / IonQ",
        "device_type": "qpu",
        "qubits": 25,
        "pricing": "paid",
        "price_info": "$0.03/shot + $0.01/single-qubit gate",
        "description": "IonQ Aria trapped-ion quantum processor. High fidelity, all-to-all connectivity.",
        "arn": "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1",
        "region": "us-east-1",
        "technology": "Trapped ion",
    },
    "braket_ionq_aria2": {
        "id": "braket_ionq_aria2",
        "name": "IonQ Aria 2",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket / IonQ",
        "device_type": "qpu",
        "qubits": 25,
        "pricing": "paid",
        "price_info": "$0.03/shot + $0.01/single-qubit gate",
        "description": "IonQ Aria 2 trapped-ion QPU. Improved error rates over Aria 1.",
        "arn": "arn:aws:braket:us-east-1::device/qpu/ionq/Aria-2",
        "region": "us-east-1",
        "technology": "Trapped ion",
    },
    "braket_ionq_forte": {
        "id": "braket_ionq_forte",
        "name": "IonQ Forte",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket / IonQ",
        "device_type": "qpu",
        "qubits": 36,
        "pricing": "paid",
        "price_info": "$0.03/shot + $0.01/single-qubit gate",
        "description": "IonQ Forte trapped-ion QPU. 36 qubits with acoustic-optic deflector technology.",
        "arn": "arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1",
        "region": "us-east-1",
        "technology": "Trapped ion",
    },
    "braket_iqm_garnet": {
        "id": "braket_iqm_garnet",
        "name": "IQM Garnet",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket / IQM",
        "device_type": "qpu",
        "qubits": 20,
        "pricing": "paid",
        "price_info": "$0.00145/shot",
        "description": "IQM Garnet superconducting QPU. 20 transmon qubits, square-lattice topology.",
        "arn": "arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet",
        "region": "eu-north-1",
        "technology": "Superconducting",
    },
    "braket_rigetti_ankaa3": {
        "id": "braket_rigetti_ankaa3",
        "name": "Rigetti Ankaa-3",
        "provider": "amazon_braket",
        "provider_display": "Amazon Braket / Rigetti",
        "device_type": "qpu",
        "qubits": 84,
        "pricing": "paid",
        "price_info": "$0.00035/shot",
        "description": "Rigetti Ankaa-3 superconducting QPU. 84 qubits, tunable couplers.",
        "arn": "arn:aws:braket:us-west-1::device/qpu/rigetti/Ankaa-3",
        "region": "us-west-1",
        "technology": "Superconducting",
    },

    # ═══ IBM Quantum — Free Tier (Open Plan) ═══
    "ibm_fez": {
        "id": "ibm_fez",
        "name": "IBM Fez",
        "provider": "ibm_quantum",
        "provider_display": "IBM Quantum",
        "device_type": "qpu",
        "qubits": 156,
        "pricing": "free",
        "price_info": "Free with IBM Quantum Open plan (10 min/month)",
        "description": "IBM Heron r2 processor — 156 qubits. One of the largest IBM chips. Available on free Open plan.",
        "backend_name": "ibm_fez",
        "region": "eu-de",
        "technology": "Superconducting (Heron r2)",
    },
    "ibm_marrakesh": {
        "id": "ibm_marrakesh",
        "name": "IBM Marrakesh",
        "provider": "ibm_quantum",
        "provider_display": "IBM Quantum",
        "device_type": "qpu",
        "qubits": 156,
        "pricing": "free",
        "price_info": "Free with IBM Quantum Open plan (10 min/month)",
        "description": "IBM Heron r2 processor — 156 qubits. High-performance quantum computing. Available on free Open plan.",
        "backend_name": "ibm_marrakesh",
        "region": "eu-de",
        "technology": "Superconducting (Heron r2)",
    },
    "ibm_torino": {
        "id": "ibm_torino",
        "name": "IBM Torino",
        "provider": "ibm_quantum",
        "provider_display": "IBM Quantum",
        "device_type": "qpu",
        "qubits": 133,
        "pricing": "free",
        "price_info": "Free with IBM Quantum Open plan (10 min/month)",
        "description": "IBM Heron r2 processor — 133 qubits. Latest generation superconducting chip. Available on free Open plan.",
        "backend_name": "ibm_torino",
        "region": "eu-it",
        "technology": "Superconducting (Heron r2)",
    },

    # ═══ Google Quantum / Cirq — Simulators ═══
    "cirq_simulator": {
        "id": "cirq_simulator",
        "name": "Google Cirq Simulator",
        "provider": "google_cirq",
        "provider_display": "Google Cirq",
        "device_type": "simulator",
        "qubits": 25,
        "pricing": "free",
        "price_info": "Always free — runs locally with Cirq SDK",
        "description": "Google Cirq state vector simulator. Supports all gates including non-Clifford (T, Rx, Ry, Rz). Up to ~25 qubits.",
        "region": "local",
        "technology": "State vector (Cirq)",
    },
    "cirq_density_matrix": {
        "id": "cirq_density_matrix",
        "name": "Cirq Density Matrix",
        "provider": "google_cirq",
        "provider_display": "Google Cirq",
        "device_type": "simulator",
        "qubits": 16,
        "pricing": "free",
        "price_info": "Always free — runs locally with Cirq SDK",
        "description": "Cirq Density Matrix simulator with noise modeling support. Ideal for studying decoherence. Up to ~16 qubits.",
        "region": "local",
        "technology": "Density matrix (Cirq)",
    },
    "cirq_clifford": {
        "id": "cirq_clifford",
        "name": "Cirq Clifford Sim",
        "provider": "google_cirq",
        "provider_display": "Google Cirq",
        "device_type": "simulator",
        "qubits": 500,
        "pricing": "free",
        "price_info": "Always free — runs locally with Cirq SDK",
        "description": "Cirq Clifford simulator for stabilizer circuits. Ultra-fast for Clifford-only circuits up to 500+ qubits.",
        "region": "local",
        "technology": "Clifford (Cirq)",
    },

    # ═══ Google Quantum AI — QPU Hardware (Research Access) ═══
    "google_rainbow": {
        "id": "google_rainbow",
        "name": "Google Rainbow",
        "provider": "google_quantum_ai",
        "provider_display": "Google Quantum AI",
        "device_type": "qpu",
        "qubits": 72,
        "pricing": "research",
        "price_info": "Requires Google Quantum AI research partnership",
        "description": "Google Sycamore/Rainbow 72-qubit superconducting processor. Demonstrated quantum supremacy in 2019.",
        "region": "us-west1",
        "technology": "Superconducting (Sycamore)",
    },
    "google_willow": {
        "id": "google_willow",
        "name": "Google Willow",
        "provider": "google_quantum_ai",
        "provider_display": "Google Quantum AI",
        "device_type": "qpu",
        "qubits": 105,
        "pricing": "research",
        "price_info": "Requires Google Quantum AI research partnership",
        "description": "Google Willow 105-qubit processor (2024+). First chip to achieve below-threshold quantum error correction.",
        "region": "us-west1",
        "technology": "Superconducting (Willow)",
    },

}


# ── Backend Manager Class ────────────────────────────────────

class QuantumBackendManager:
    """Manages all quantum computing backends."""

    def __init__(self, ibm_token: str = "", aws_access_key: str = "",
                 aws_secret_key: str = "", aws_region: str = "us-east-1"):
        self.ibm_token = ibm_token
        self.aws_access_key = aws_access_key
        self.aws_secret_key = aws_secret_key
        self.aws_region = aws_region
        self._ibm_service = None
        self._braket_session = None
        self._status_cache = {}
        self._cache_time = 0
        self._cache_ttl = 300  # 5 min cache

    # ── List All Backends ────────────────────────────────────

    def list_all_backends(self, enabled_ids: list[str] | None = None,
                          is_admin: bool = False) -> list[dict]:
        """List all backends with status and access info.
        
        Args:
            enabled_ids: List of backend IDs enabled for users (from admin settings).
                         If None, all are shown as enabled.
            is_admin: If True, all backends are selectable regardless.
        
        Returns:
            List of backend dicts with added 'status', 'enabled', 'selectable' fields.
        """
        results = []
        for bid, binfo in MASTER_BACKENDS.items():
            entry = dict(binfo)

            # Determine if enabled for this user
            if is_admin:
                entry["enabled"] = True
                entry["selectable"] = True
            elif enabled_ids is not None:
                entry["enabled"] = bid in enabled_ids
                entry["selectable"] = bid in enabled_ids
            else:
                entry["enabled"] = True
                entry["selectable"] = True

            # SDK availability
            if binfo["provider"] == "amazon_braket":
                entry["sdk_installed"] = HAS_BRAKET
                entry["has_credentials"] = bool(self.aws_access_key)
            elif binfo["provider"] == "ibm_quantum":
                entry["sdk_installed"] = HAS_IBM
                entry["has_credentials"] = bool(self.ibm_token)
            elif binfo["provider"] in ("google_cirq", "google_quantum_ai"):
                try:
                    import cirq as _cirq
                    entry["sdk_installed"] = True
                except ImportError:
                    entry["sdk_installed"] = False
                entry["has_credentials"] = binfo["provider"] == "google_cirq"  # Simulators don't need creds
            else:
                entry["sdk_installed"] = HAS_STIM
                entry["has_credentials"] = True

            # Cached status
            cached = self._status_cache.get(bid)
            if cached and (time.time() - self._cache_time < self._cache_ttl):
                entry["status"] = cached
            else:
                entry["status"] = "unknown"

            results.append(entry)

        return results

    # ── Test Connection ──────────────────────────────────────

    def test_connection(self, backend_id: str) -> dict:
        """Test connection to a specific backend.

        Returns:
            dict with: success, backend_id, status, message, latency_ms, details
        """
        if backend_id not in MASTER_BACKENDS:
            return {"success": False, "backend_id": backend_id,
                    "status": "error", "message": f"Unknown backend: {backend_id}"}

        binfo = MASTER_BACKENDS[backend_id]
        provider = binfo["provider"]
        start = time.time()

        try:
            if provider == "local":
                return self._test_local(backend_id, start)
            elif provider == "amazon_braket":
                return self._test_braket(backend_id, binfo, start)
            elif provider == "ibm_quantum":
                return self._test_ibm(backend_id, binfo, start)
            elif provider in ("google_cirq", "google_quantum_ai"):
                return self._test_google(backend_id, binfo, start)
            else:
                return {"success": False, "backend_id": backend_id,
                        "status": "error", "message": f"Unknown provider: {provider}"}
        except Exception as e:
            latency = int((time.time() - start) * 1000)
            logger.error("Backend test error %s: %s", backend_id, e)
            return {"success": False, "backend_id": backend_id,
                    "status": "error", "message": str(e)[:200],
                    "latency_ms": latency}

    def _test_local(self, backend_id: str, start: float) -> dict:
        """Test local Stim simulator."""
        if not HAS_STIM:
            return {"success": False, "backend_id": backend_id,
                    "status": "unavailable", "message": "Stim not installed on server"}

        # Run a quick Bell state
        c = stim.Circuit()
        c.append("H", [0])
        c.append("CNOT", [0, 1])
        c.append("M", [0, 1])
        results = c.compile_sampler().sample(100)
        latency = int((time.time() - start) * 1000)
        self._status_cache[backend_id] = "online"
        self._cache_time = time.time()

        return {
            "success": True, "backend_id": backend_id,
            "status": "online", "message": "Stim simulator operational",
            "latency_ms": latency,
            "details": {
                "version": stim.__version__,
                "test_circuit": "Bell state (100 shots)",
                "sample_result": {
                    "00": sum(1 for r in results if r[0] == 0 and r[1] == 0),
                    "11": sum(1 for r in results if r[0] == 1 and r[1] == 1),
                },
            },
        }

    def _test_braket(self, backend_id: str, binfo: dict, start: float) -> dict:
        """Test Amazon Braket backend connection."""
        if not HAS_BRAKET:
            return {
                "success": False, "backend_id": backend_id,
                "status": "sdk_missing",
                "message": "Amazon Braket SDK not installed. Install: pip install amazon-braket-sdk",
                "latency_ms": int((time.time() - start) * 1000),
            }

        if binfo.get("arn") == "local":
            # Test local Braket simulator
            try:
                device = BraketLocalSim()
                circuit = BraketCircuit().h(0).cnot(0, 1)
                result = device.run(circuit, shots=10).result()
                latency = int((time.time() - start) * 1000)
                counts = result.measurement_counts
                self._status_cache[backend_id] = "online"
                self._cache_time = time.time()
                return {
                    "success": True, "backend_id": backend_id,
                    "status": "online",
                    "message": "Braket local simulator operational",
                    "latency_ms": latency,
                    "details": {"counts": dict(counts), "shots": 10},
                }
            except Exception as e:
                return {
                    "success": False, "backend_id": backend_id,
                    "status": "error", "message": f"Local sim error: {e}",
                    "latency_ms": int((time.time() - start) * 1000),
                }

        # Cloud Braket device — need AWS credentials
        if not self.aws_access_key:
            return {
                "success": False, "backend_id": backend_id,
                "status": "no_credentials",
                "message": "AWS credentials not configured. Add AWS Access Key in Settings → API Keys.",
                "latency_ms": int((time.time() - start) * 1000),
            }

        try:
            import boto3
            session = boto3.Session(
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                region_name=binfo.get("region", self.aws_region),
            )
            braket_client = session.client("braket", region_name=binfo.get("region", self.aws_region))
            arn = binfo["arn"]
            response = braket_client.get_device(deviceArn=arn)
            device_status = response.get("deviceStatus", "UNKNOWN")
            latency = int((time.time() - start) * 1000)

            status_map = {
                "ONLINE": "online",
                "OFFLINE": "offline",
                "RETIRED": "retired",
            }
            mapped_status = status_map.get(device_status, "unknown")
            self._status_cache[backend_id] = mapped_status
            self._cache_time = time.time()

            return {
                "success": True, "backend_id": backend_id,
                "status": mapped_status,
                "message": f"Connected! Device status: {device_status}",
                "latency_ms": latency,
                "details": {
                    "device_name": response.get("deviceName", ""),
                    "device_status": device_status,
                    "device_type": response.get("deviceType", ""),
                    "provider": response.get("providerName", ""),
                },
            }
        except Exception as e:
            latency = int((time.time() - start) * 1000)
            err = str(e)
            if "InvalidAccessKeyId" in err or "SignatureDoesNotMatch" in err:
                status = "auth_failed"
                msg = "Invalid AWS credentials"
            elif "ResourceNotFoundException" in err:
                status = "not_found"
                msg = "Device not found (may be retired)"
            elif "AccessDeniedException" in err:
                status = "access_denied"
                msg = "AWS access denied — check IAM permissions for Amazon Braket"
            else:
                status = "error"
                msg = err[:200]

            self._status_cache[backend_id] = status
            self._cache_time = time.time()
            return {
                "success": False, "backend_id": backend_id,
                "status": status, "message": msg, "latency_ms": latency,
            }

    def _test_ibm(self, backend_id: str, binfo: dict, start: float) -> dict:
        """Test IBM Quantum backend connection."""
        if not HAS_IBM:
            return {
                "success": False, "backend_id": backend_id,
                "status": "sdk_missing",
                "message": "Qiskit IBM Runtime not installed. Install: pip install qiskit-ibm-runtime",
                "latency_ms": int((time.time() - start) * 1000),
            }

        if not self.ibm_token:
            return {
                "success": False, "backend_id": backend_id,
                "status": "no_credentials",
                "message": "IBM Quantum token not configured. Add it in Settings → API Keys.",
                "latency_ms": int((time.time() - start) * 1000),
            }

        try:
            if self._ibm_service is None:
                self._ibm_service = QiskitRuntimeService(
                    channel="ibm_quantum_platform", token=self.ibm_token
                )

            backend_name = binfo.get("backend_name", backend_id)
            backend_obj = self._ibm_service.backend(backend_name)
            status = backend_obj.status()
            latency = int((time.time() - start) * 1000)

            is_online = status.operational
            pending = status.pending_jobs
            mapped_status = "online" if is_online else "offline"
            self._status_cache[backend_id] = mapped_status
            self._cache_time = time.time()

            return {
                "success": True, "backend_id": backend_id,
                "status": mapped_status,
                "message": f"Connected! {status.status_msg}",
                "latency_ms": latency,
                "details": {
                    "operational": is_online,
                    "pending_jobs": pending,
                    "status_msg": status.status_msg,
                    "num_qubits": backend_obj.num_qubits,
                    "backend_version": str(backend_obj.backend_version),
                },
            }
        except Exception as e:
            latency = int((time.time() - start) * 1000)
            err = str(e)
            if "401" in err or "Unauthorized" in err.lower():
                status = "auth_failed"
                msg = "Invalid IBM Quantum token"
            elif "not found" in err.lower():
                status = "not_found"
                msg = f"Backend {binfo.get('backend_name', '')} not found"
            else:
                status = "error"
                msg = err[:200]

            self._status_cache[backend_id] = status
            self._cache_time = time.time()
            return {
                "success": False, "backend_id": backend_id,
                "status": status, "message": msg, "latency_ms": latency,
            }

    # ── Test All Connections ─────────────────────────────────

    def test_all_connections(self) -> dict:
        """Test connections to all providers (one backend per provider).
        Returns a summary report.
        """
        report = {
            "timestamp": time.time(),
            "providers": {},
            "summary": {"total": 0, "online": 0, "offline": 0, "error": 0},
        }

        # Test one per provider
        tests = [
            ("local", "local_stim"),
            ("amazon_braket", "braket_sv1"),
            ("ibm_quantum", "ibm_fez"),
        ]

        for provider, test_backend in tests:
            result = self.test_connection(test_backend)
            report["providers"][provider] = {
                "test_backend": test_backend,
                "status": result["status"],
                "message": result["message"],
                "latency_ms": result.get("latency_ms", 0),
                "sdk_installed": {
                    "local": HAS_STIM,
                    "amazon_braket": HAS_BRAKET,
                    "ibm_quantum": HAS_IBM,
                }.get(provider, False),
                "has_credentials": {
                    "local": True,
                    "amazon_braket": bool(self.aws_access_key),
                    "ibm_quantum": bool(self.ibm_token),
                }.get(provider, False),
                "details": result.get("details", {}),
            }
            report["summary"]["total"] += 1
            if result["status"] == "online":
                report["summary"]["online"] += 1
            elif result["status"] in ("offline", "retired"):
                report["summary"]["offline"] += 1
            else:
                report["summary"]["error"] += 1

        return report

    # ── Generate Full Report ─────────────────────────────────

    def generate_report(self, enabled_ids: list[str] | None = None) -> dict:
        """Generate a comprehensive backend status report."""
        # Test all providers
        conn_report = self.test_all_connections()

        # Gather all backends
        all_backends = self.list_all_backends(enabled_ids)

        # Categorize
        by_provider = {}
        by_type = {"simulator": [], "qpu": []}
        by_pricing = {"free": [], "free_tier": [], "paid": []}

        for b in all_backends:
            provider = b["provider"]
            by_provider.setdefault(provider, []).append(b["id"])
            by_type.get(b["device_type"], []).append(b["id"])
            by_pricing.get(b["pricing"], []).append(b["id"])

        return {
            "timestamp": time.time(),
            "total_backends": len(all_backends),
            "enabled_for_users": sum(1 for b in all_backends if b.get("enabled")),
            "connection_tests": conn_report,
            "by_provider": {k: len(v) for k, v in by_provider.items()},
            "by_type": {k: len(v) for k, v in by_type.items()},
            "by_pricing": {k: len(v) for k, v in by_pricing.items()},
            "sdk_status": {
                "stim": {"installed": HAS_STIM, "version": stim.__version__ if HAS_STIM else None},
                "amazon_braket": {"installed": HAS_BRAKET},
                "qiskit_ibm": {"installed": HAS_IBM},
            },
            "backends": all_backends,
        }

    # ── System Info ──────────────────────────────────────────

    def _test_google(self, backend_id: str, binfo: dict, start: float) -> dict:
        """Test connection to a Google Cirq backend."""
        import time as _time
        try:
            import cirq
            if binfo["provider"] == "google_cirq":
                q0, q1 = cirq.LineQubit.range(2)
                circuit = cirq.Circuit([cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key='m')])
                sim = cirq.Simulator()
                result = sim.run(circuit, repetitions=100)
                elapsed = _time.time() - start
                counts = result.histogram(key='m')
                self._status_cache[backend_id] = "online"
                self._cache_time = _time.time()
                return {
                    "success": True,
                    "backend_id": backend_id,
                    "status": "online",
                    "latency_ms": round(elapsed * 1000, 1),
                    "message": f"Cirq simulator operational. Bell test: {dict(counts)}",
                }
            else:
                elapsed = _time.time() - start
                return {
                    "success": True,
                    "backend_id": backend_id,
                    "status": "requires_access",
                    "latency_ms": round(elapsed * 1000, 1),
                    "message": f"{binfo['name']} requires Google Quantum AI research access. Contact: quantumai-info@google.com",
                }
        except ImportError:
            return {
                "success": False,
                "backend_id": backend_id,
                "status": "sdk_missing",
                "latency_ms": round((_time.time() - start) * 1000, 1),
                "error": "Cirq not installed. Run: pip install cirq cirq-google",
            }
        except Exception as e:
            return {
                "success": False,
                "backend_id": backend_id,
                "status": "error",
                "latency_ms": round((_time.time() - start) * 1000, 1),
                "error": str(e),
            }

    def system_info(self) -> dict:
        return {
            "total_backends": len(MASTER_BACKENDS),
            "has_stim": HAS_STIM,
            "has_braket_sdk": HAS_BRAKET,
            "has_ibm_sdk": HAS_IBM,
            "has_aws_credentials": bool(self.aws_access_key),
            "has_ibm_token": bool(self.ibm_token),
            "providers": ["local", "amazon_braket", "ibm_quantum"],
        }
