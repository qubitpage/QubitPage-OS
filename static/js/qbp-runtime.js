/* ═══════════════════════════════════════════════════════════
   QBP Runtime JS — Browser runtime for QBP transpiled pages
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const QBP = {
    version: "1.0.0",
    circuits: {},
    results: {},

    // ── Init ──────────────────────────────────────────────
    init() {
      this.initCircuits();
      this.initTabs();
      this.initModals();
      this.initButtons();
      console.log("[QBP] Runtime v" + this.version + " initialized");
    },

    // ── Circuit Components ────────────────────────────────
    initCircuits() {
      document.querySelectorAll(".qbp-circuit").forEach((el) => {
        const id = el.dataset.id || "circuit-" + Math.random().toString(36).slice(2, 6);
        const editor = el.querySelector(".circuit-editor");
        const statusEl = el.querySelector(".circuit-status");

        if (editor) {
          editor.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const start = editor.selectionStart;
              editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(editor.selectionEnd);
              editor.selectionStart = editor.selectionEnd = start + 2;
            }
          });
        }

        this.circuits[id] = { el, editor, statusEl };
      });
    },

    // ── Run Circuit ───────────────────────────────────────
    runCircuit(circuitId, options = {}) {
      const circuit = this.circuits[circuitId];
      if (!circuit) return Promise.reject(new Error("Circuit not found: " + circuitId));

      const source = circuit.editor ? circuit.editor.value : "";
      if (circuit.statusEl) circuit.statusEl.textContent = "Compiling...";

      return fetch("/api/qplang/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (circuit.statusEl) {
            circuit.statusEl.textContent = data.success ? "Compiled ✓" : "Error: " + (data.error || "");
          }
          return data;
        });
    },

    // ── Simulate ──────────────────────────────────────────
    simulate(circuitType, params = {}) {
      return fetch("/api/quantum/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: circuitType, params }),
      }).then((r) => r.json());
    },

    // ── Render Results ────────────────────────────────────
    renderResult(elementId, data) {
      const el = document.getElementById(elementId) || document.querySelector(`[data-circuit="${elementId}"]`);
      if (!el) return;

      const counts = data.counts || {};
      const total = data.shots || 1;
      let html = "";

      for (const [state, count] of Object.entries(counts)) {
        const pct = ((count / total) * 100).toFixed(1);
        html += `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-family:monospace;width:60px;color:var(--accent,#00d4ff)">|${this.escapeHTML(state)}⟩</span>
            <div style="flex:1;height:20px;background:var(--border,#1e2a45);border-radius:4px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#00d4ff,#00ffaa);border-radius:4px"></div>
            </div>
            <span style="font-family:monospace;font-size:12px;width:45px;text-align:right">${pct}%</span>
          </div>`;
      }
      el.innerHTML = html;
    },

    // ── Tabs ──────────────────────────────────────────────
    initTabs() {
      document.querySelectorAll(".qbp-tabs").forEach((tabBar) => {
        tabBar.querySelectorAll(".qbp-tab").forEach((tab) => {
          tab.addEventListener("click", () => {
            tabBar.querySelectorAll(".qbp-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            const panel = tab.dataset.panel;
            if (panel) {
              const parent = tabBar.parentElement;
              parent.querySelectorAll(".qbp-tab-panel").forEach((p) => p.classList.add("hidden"));
              const target = parent.querySelector(`#${panel}`);
              if (target) target.classList.remove("hidden");
            }
          });
        });
      });
    },

    // ── Modals ────────────────────────────────────────────
    initModals() {
      document.querySelectorAll(".qbp-modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) modal.classList.add("hidden");
        });
      });
    },

    // ── Buttons ───────────────────────────────────────────
    initButtons() {
      document.querySelectorAll(".qbp-button[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          if (action === "simulate") {
            const type = btn.dataset.circuit || "bell";
            this.simulate(type, { shots: 1024 }).then((data) => {
              if (data.success) {
                const target = btn.dataset.target;
                if (target) this.renderResult(target, data.data);
              }
            });
          }
        });
      });
    },

    // ── AI Chat ───────────────────────────────────────────
    askAria(message, history = []) {
      return fetch("/api/aria/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      }).then((r) => r.json());
    },

    // ── Crypto ────────────────────────────────────────────
    encrypt(text) {
      return fetch("/api/crypto/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).then((r) => r.json());
    },

    decrypt(ciphertextHex, keyHex) {
      return fetch("/api/crypto/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext_hex: ciphertextHex, key_hex: keyHex }),
      }).then((r) => r.json());
    },

    qrng(bits = 256) {
      return fetch("/api/crypto/qrng", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bits }),
      }).then((r) => r.json());
    },

    // ── Utilities ─────────────────────────────────────────
    escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    },

    notify(message, type = "info") {
      const el = document.createElement("div");
      el.className = "qbp-notification";
      el.textContent = message;
      if (type === "success") el.style.borderColor = "#00ffaa";
      if (type === "error") el.style.borderColor = "#ff4060";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    },
  };

  // Auto-init on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => QBP.init());
  } else {
    QBP.init();
  }

  // Expose globally
  window.QBP = QBP;
})();
