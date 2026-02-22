/* ═══════════════════════════════════════════════════════════════════════════
   Disease Research Hub — 7-Disease Navigator
   Fixes: proper pipeline launch via window._qpOpenApp · rich disease data
   ═══════════════════════════════════════════════════════════════════════════ */

function initDiseaseDashboard(winEl) {
  const container = winEl.querySelector(".disease-dashboard-app");
  if (!container) return;

  const DISEASES = [
    {
      id: "gbm", name: "Glioblastoma (GBM)", shortName: "GBM",
      icon: "🧠", color: "#ff4466", bgColor: "rgba(255,60,90,.08)",
      survival: "~15 months median", pipeline: "quantumneuro",
      category: "Brain Cancer",
      severity: "CRITICAL",
      unmet: "No curative treatment. MGMT methylation in only 40% enables TMZ benefit.",
      stats: { incidence: "~18,000/yr (US)", prevalence: "WHO Grade IV", funding: "$250M/yr" },
      targets: ["EGFR (amplified 40%)", "IDH-wildtype", "PTEN loss", "MGMT", "VEGF/VEGFR"],
      current_treatments: ["Stupp Protocol (TMZ + RT)", "Bevacizumab (2nd line)", "Tumor Treating Fields (TTF)"],
      research_gap: "Blood-Brain Barrier blocks 98% of molecules. No immunotherapy success in GBM yet.",
      our_discovery_angle: "DprE1-derived BBB-crossing inhibitor scaffold adapted for EGFR. BTZ-Cl compound shows >-10 kcal/mol EGFR docking.",
    },
    {
      id: "mdr_tb", name: "MDR-TB / XDR-TB", shortName: "MDR-TB",
      icon: "🫁", color: "#00ccff", bgColor: "rgba(0,160,220,.08)",
      survival: "<56% cure (XDR-TB: <40%)", pipeline: "quantumtb",
      category: "Infectious Disease",
      severity: "CRITICAL",
      unmet: "500,000 new MDR-TB cases/year. DprE1 is a novel validated target with no FDA-approved inhibitors.",
      stats: { incidence: "10.6M TB cases/yr", prevalence: "MDR: 500K cases/yr", funding: "$2.8B globally" },
      targets: ["DprE1 (Rv3790) — novel, no drug", "InhA (INH target)", "ATP synthase (Bedaquiline)", "CYP121"],
      current_treatments: ["BPaL (Bedaquiline+Pretomanid+Linezolid)", "XDR: 9-18 month regimen", "Delamanid"],
      research_gap: "DprE1 validated — BTZ-043 in Phase II. ZERO approved DprE1-targeting drugs. Novel covalent inhibitors needed.",
      our_discovery_angle: "BTZ-Cl derivative: chlorine modification to BTZ-043 scaffold shows predicted ΔG −11.2 kcal/mol DprE1. Lower hERG risk than parent compound.",
    },
    {
      id: "pdac", name: "Pancreatic Cancer", shortName: "PDAC",
      icon: "🎯", color: "#f7b731", bgColor: "rgba(247,180,40,.08)",
      survival: "12% 5-year survival", pipeline: null,
      category: "GI Cancer",
      severity: "CRITICAL",
      unmet: "KRAS-mutant (92%) — undruggable until 2021. Late diagnosis (Stage IV: 80% of cases).",
      stats: { incidence: "~60,000/yr (US)", prevalence: "4% cancer deaths", funding: "$190M/yr" },
      targets: ["KRAS G12C/G12D (AMG-510 class)", "SMAD4 loss", "TP53 R175H", "CDK4/6", "SHH pathway"],
      current_treatments: ["FOLFIRINOX", "Gemcitabine + nab-paclitaxel", "PARP inhibitors (BRCA-mutant)"],
      research_gap: "KRAS G12D direct inhibitor (unlike G12C, not yet approved). Dense stroma prevents drug delivery.",
      our_discovery_angle: "Quantum docking: KRAS G12D switch-II pocket inhibitors — flexible linker molecules predicted to penetrate stroma.",
    },
    {
      id: "als", name: "ALS (Lou Gehrig's)", shortName: "ALS",
      icon: "⚡", color: "#a78bfa", bgColor: "rgba(160,130,240,.08)",
      survival: "2-5 years from diagnosis", pipeline: null,
      category: "Neurodegeneration",
      severity: "CRITICAL",
      unmet: "Only 3 FDA-approved drugs (Riluzole, Edaravone, AMX0035 — all modest effect). No cure.",
      stats: { incidence: "~5,000/yr (US)", prevalence: "~30,000 living with ALS", funding: "$90M/yr" },
      targets: ["TDP-43 aggregation", "SOD1 misfolding", "FUS/HNRNPA2B1", "C9orf72 DPR toxicity", "Neuroinflammation"],
      current_treatments: ["Riluzole (glutamate modulator)", "Edaravone (antioxidant)", "AMX0035 (NRF2 + mitochondria)"],
      research_gap: "TDP-43 nuclear-cytoplasmic transport disruption — no druggable pocket identified. Phase 3 failures consistently.",
      our_discovery_angle: "VQE simulation of TDP-43 RRM2 domain — screening small molecule stabilizers of nuclear localization signal.",
    },
    {
      id: "ipf", name: "Idiopathic Pulm. Fibrosis", shortName: "IPF",
      icon: "💨", color: "#6db33f", bgColor: "rgba(90,180,50,.08)",
      survival: "3-5 years from diagnosis", pipeline: null,
      category: "Pulmonary",
      severity: "HIGH",
      unmet: "Nintedanib/Pirfenidone slow progression ~50% but no reversal. Lung transplant is only cure.",
      stats: { incidence: "~50,000/yr (US)", prevalence: "200,000 in US", funding: "$120M/yr" },
      targets: ["TGF-β signaling", "Myofibroblast activation", "IL-13 / IL-4 axis", "Autotaxin / LPA1", "WIPF1"],
      current_treatments: ["Nintedanib (triple kinase inhibitor)", "Pirfenidone", "Lung transplant"],
      research_gap: "No anti-fibrotic reversal agent approved. Senescent cell accumulation drives fibrosis — senolytics untested.",
      our_discovery_angle: "Quantum screening of ABT-737-derived senolytics targeting BCL-2/BCL-XL in IPF myofibroblasts.",
    },
    {
      id: "tnbc", name: "Triple-Neg Breast Cancer", shortName: "TNBC",
      icon: "🎗️", color: "#fd79a8", bgColor: "rgba(250,100,160,.08)",
      survival: "12% metastatic (5yr)", pipeline: null,
      category: "Breast Cancer",
      severity: "HIGH",
      unmet: "No hormone receptor or HER2 — no targeted therapy except BRCA-mutant subset. Most aggressive breast cancer.",
      stats: { incidence: "~50,000 TNBC/yr (US)", prevalence: "15% of all breast cancers", funding: "$300M TNBC-specific" },
      targets: ["PD-L1 (Atezolizumab)", "BRCA1/2 (olaparib subset)", "TROP-2 (ADC)", "Androgen receptor", "PI3K/AKT"],
      current_treatments: ["Pembrolizumab + chemo", "Sacituzumab govitecan (ADC)", "Olaparib (BRCA+)"],
      research_gap: "PD-L1 low TNBC (60%) — only chemo option. WNT/β-catenin and STAT3 inhibitors show preclinical promise.",
      our_discovery_angle: "VQE docking to STAT3 SH2 domain — novel peptidomimetic inhibitors predicted to cross TNBC membranes.",
    },
    {
      id: "alzheimers", name: "Alzheimer's Disease", shortName: "AD",
      icon: "🧬", color: "#c7aeff", bgColor: "rgba(190,160,255,.08)",
      survival: "4-8 years (after diagnosis)", pipeline: null,
      category: "Neurodegeneration",
      severity: "HIGH",
      unmet: "Lecanemab/Donanemab clear amyloid — modest cognitive benefit, significant ARIA risk. No tau-targeted therapy approved.",
      stats: { incidence: "~600,000 new dx/yr (US)", prevalence: "6.7M Americans", funding: "$3.5B/yr" },
      targets: ["Amyloid-β aggregation", "Tau hyperphosphorylation (CDK5/GSK3β)", "Neuroinflammation (TREM2)", "ApoE4", "Synaptic NMDAR"],
      current_treatments: ["Lecanemab (Leqembi) — amyloid clearance", "Donepezil/Memantine (symptomatic)", "Donanemab"],
      research_gap: "Tau propagation mechanism druggable site not identified. ApoE4 structure finally solved 2024 — small molecule stabilizers needed.",
      our_discovery_angle: "Quantum simulation of tau PHF6 hexapeptide aggregation core — screening D-amino acid peptoids as aggregation blockers.",
    },
  ];

  let selectedId = null;
  const el = (id) => container.querySelector("#" + id);

  // ── CSS ─────────────────────────────────────────────────────────────────
  if (!document.getElementById("dd-style")) {
    const s = document.createElement("style");
    s.id = "dd-style";
    s.textContent = `
      .dd-wrap { display:flex; flex-direction:column; height:100%; background:#060c14; color:#d0e0f0; font-family:'Segoe UI',sans-serif; overflow:hidden; }
      .dd-header { padding:14px 20px 10px; background:rgba(0,0,0,.3); border-bottom:1px solid #1a2840; flex-shrink:0; }
      .dd-title { font-size:1.05em; font-weight:700; color:#c0e8ff; }
      .dd-subtitle { font-size:.73em; color:#4a7090; margin-top:3px; }
      .dd-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; padding:14px 16px; overflow-y:auto; }
      .dd-card { border-radius:10px; padding:14px; cursor:pointer; transition:all .2s; border:1.5px solid transparent; position:relative; overflow:hidden; }
      .dd-card:hover { transform:translateY(-2px); }
      .dd-card.selected { border-color:var(--card-color); box-shadow:0 0 14px var(--card-glow); }
      .dd-card-icon { font-size:1.8em; margin-bottom:6px; }
      .dd-card-name { font-size:.8em; font-weight:700; margin-bottom:2px; }
      .dd-card-surv { font-size:.68em; opacity:.6; }
      .dd-card-badge { font-size:.62em; margin-top:5px; padding:2px 7px; border-radius:6px; display:inline-block; font-weight:700; }
      .dd-card-badge.pipeline { background:rgba(0,255,136,.12); color:#00ff88; border:1px solid rgba(0,255,136,.25); }
      .dd-card-badge.research { background:rgba(255,200,0,.1); color:#ffcc44; border:1px solid rgba(255,200,0,.25); }
      .dd-card-badge.critical { position:absolute; top:8px; right:8px; background:#ff2244; color:#fff; padding:1px 5px; border-radius:4px; font-size:.58em; font-weight:700; }
      .dd-detail { flex:1; overflow-y:auto; padding:16px 20px; }
      .dd-empty { display:flex; align-items:center; justify-content:center; height:100%; color:#2a4060; font-size:.88em; text-align:center; }
      .dd-d-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
      .dd-d-icon { font-size:2.2em; }
      .dd-d-title { font-size:1.1em; font-weight:700; }
      .dd-d-cat { font-size:.72em; color:#5a8090; }
      .dd-section { margin-bottom:14px; }
      .dd-section-title { font-size:.72em; font-weight:700; color:#5a8090; text-transform:uppercase; letter-spacing:.07em; margin-bottom:6px; }
      .dd-unmet { background:rgba(255,50,50,.06); border:1px solid rgba(255,80,80,.2); border-radius:8px; padding:10px 14px; font-size:.78em; color:#e08888; line-height:1.6; }
      .dd-discovery { background:rgba(255,200,0,.05); border:1px solid rgba(255,200,0,.2); border-radius:8px; padding:10px 14px; font-size:.78em; color:#ccaa55; line-height:1.6; }
      .dd-tags { display:flex; flex-wrap:wrap; gap:6px; }
      .dd-tag { padding:3px 10px; border-radius:12px; font-size:.7em; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); color:#90aab8; }
      .dd-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .dd-stat { background:#060f1c; border:1px solid #0d2238; border-radius:8px; padding:8px 10px; text-align:center; }
      .dd-stat-val { font-size:.78em; font-weight:700; color:#80c8e0; }
      .dd-stat-lbl { font-size:.62em; color:#3a6080; margin-top:2px; }
      .dd-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; padding-top:14px; border-top:1px solid #0d2030; }
      .dd-action-btn { padding:9px 16px; border-radius:8px; font-size:.8em; font-weight:600; cursor:pointer; border:none; transition:all .2s; }
      .dd-action-btn:hover { transform:translateY(-1px); }
      .dd-action-btn.primary { color:#000; }
      .dd-action-btn.secondary { background:#0a1a28; color:#60a0c0; border:1px solid #1a3045; }
      .dd-action-btn.secondary:hover { background:#0d2035; color:#90c8e0; }
      .dd-divider { width:100%; height:1px; background:#0d2030; margin:0; }
      .dd-layout { display:flex; flex-direction:column; height:100%; }
      .dd-panel-grid { display:grid; grid-template-columns:280px 1fr; height:calc(100% - 60px); overflow:hidden; }
      .dd-left { overflow-y:auto; border-right:1px solid #0d2030; }
      .dd-right { overflow-y:auto; }
      .dd-card-list { padding:10px; display:flex; flex-direction:column; gap:6px; }
      .dd-list-card { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; cursor:pointer; transition:all .15s; border:1px solid transparent; }
      .dd-list-card:hover { background:rgba(255,255,255,.03); }
      .dd-list-card.selected { border-color:var(--card-color); background:var(--card-bg); }
      .dd-list-card-icon { font-size:1.4em; flex-shrink:0; }
      .dd-list-card-info { flex:1; overflow:hidden; }
      .dd-list-card-name { font-size:.8em; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dd-list-card-sub { font-size:.67em; color:#4a7090; margin-top:1px; }
      .dd-list-card-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    `;
    document.head.appendChild(s);
  }

  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function render() {
    const sel = DISEASES.find(d => d.id === selectedId);
    container.innerHTML = `
      <div class="dd-wrap dd-layout">
        <div class="dd-header">
          <div class="dd-title">🏥 Disease Research Hub</div>
          <div class="dd-subtitle">7 incurable / hard-to-treat diseases · HAI-DEF + Quantum Drug Discovery Platform</div>
        </div>
        <div class="dd-panel-grid">
          <div class="dd-left">
            <div class="dd-card-list">
              ${DISEASES.map(d => `
                <div class="dd-list-card ${d.id===selectedId?'selected':''}"
                     style="--card-color:${d.color};--card-bg:${d.bgColor}"
                     data-id="${d.id}">
                  <span class="dd-list-card-icon">${d.icon}</span>
                  <div class="dd-list-card-info">
                    <div class="dd-list-card-name" style="${d.id===selectedId?'color:'+d.color:''}">${esc(d.shortName||d.name)}</div>
                    <div class="dd-list-card-sub">${esc(d.category)} · ${esc(d.survival)}</div>
                  </div>
                  <div class="dd-list-card-dot" style="background:${d.pipeline?'#00ff88':'#ffcc44'}"></div>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="dd-right" id="dd-detail">
            ${sel ? renderDetail(sel) : renderEmpty()}
          </div>
        </div>
      </div>
    `;
    bindEvents();
  }

  function renderEmpty() {
    return `<div class="dd-empty"><div>
      <div style="font-size:2em;margin-bottom:10px">🔬</div>
      <div style="color:#50809a">Select a disease to view research data<br>and launch the drug discovery pipeline</div>
    </div></div>`;
  }

  function renderDetail(d) {
    return `
      <div class="dd-detail">
        <div class="dd-d-header">
          <span class="dd-d-icon">${d.icon}</span>
          <div>
            <div class="dd-d-title" style="color:${d.color}">${esc(d.name)}</div>
            <div class="dd-d-cat">${esc(d.category)} · Survival: <strong>${esc(d.survival)}</strong></div>
          </div>
          ${d.severity === 'CRITICAL' ? `<span style="margin-left:auto;background:#ff2244;color:#fff;font-size:.65em;font-weight:700;padding:3px 8px;border-radius:6px">CRITICAL</span>` : ''}
        </div>

        <div class="dd-section">
          <div class="dd-section-title">⚠️ Unmet Medical Need</div>
          <div class="dd-unmet">${esc(d.unmet)}</div>
        </div>

        <div class="dd-section">
          <div class="dd-section-title">📊 Epidemiology</div>
          <div class="dd-stats">
            <div class="dd-stat"><div class="dd-stat-val">${esc(d.stats.incidence)}</div><div class="dd-stat-lbl">Incidence</div></div>
            <div class="dd-stat"><div class="dd-stat-val">${esc(d.stats.prevalence)}</div><div class="dd-stat-lbl">Prevalence</div></div>
            <div class="dd-stat"><div class="dd-stat-val">${esc(d.stats.funding)}</div><div class="dd-stat-lbl">Annual R&D Funding</div></div>
          </div>
        </div>

        <div class="dd-section">
          <div class="dd-section-title">🎯 Drug Targets</div>
          <div class="dd-tags">${d.targets.map(t => `<span class="dd-tag">${esc(t)}</span>`).join("")}</div>
        </div>

        <div class="dd-section">
          <div class="dd-section-title">💊 Current Treatments</div>
          <div class="dd-tags" style="gap:4px">${d.current_treatments.map(t => `<span class="dd-tag" style="color:#80b8a0;border-color:rgba(0,180,100,.2)">${esc(t)}</span>`).join("")}</div>
        </div>

        <div class="dd-section">
          <div class="dd-section-title">🔬 Research Gap</div>
          <div class="dd-unmet" style="color:#c0a070;border-color:rgba(200,150,50,.2);background:rgba(200,150,0,.05)">${esc(d.research_gap)}</div>
        </div>

        ${d.our_discovery_angle ? `
          <div class="dd-section">
            <div class="dd-section-title">⚛️ QubitPage Discovery Angle</div>
            <div class="dd-discovery">${esc(d.our_discovery_angle)}</div>
          </div>
        ` : ''}

        <div class="dd-actions">
          ${d.pipeline ? `
            <button class="dd-action-btn primary" style="background:${d.color}" data-launch="${d.pipeline}">
              ▶ Open ${d.pipeline === 'quantumneuro' ? 'QuantumNeuro Pipeline' : 'QuantumTB Pipeline'}
            </button>
          ` : `
            <button class="dd-action-btn secondary" disabled style="opacity:.5" title="Pipeline coming soon">🔬 Pipeline Coming Soon</button>
          `}
          <button class="dd-action-btn secondary" data-ai-research="${d.id}">🤖 AI Research Analysis</button>
          <button class="dd-action-btn secondary" data-article="${d.id}">📄 Research Article</button>
        </div>

        <div id="dd-extra-${d.id}" style="margin-top:12px"></div>
      </div>
    `;
  }

  function bindEvents() {
    // Disease list selection
    container.querySelectorAll("[data-id]").forEach(el => {
      el.onclick = () => {
        selectedId = el.dataset.id;
        render();
      };
    });

    // Pipeline launch — use window._qpOpenApp (exposed from quantum-os.js IIFE)
    container.querySelectorAll("[data-launch]").forEach(btn => {
      btn.onclick = () => {
        const app = btn.dataset.launch;
        if (window._qpOpenApp) {
          window._qpOpenApp(app);
        } else {
          // Fallback: find and click the desktop icon
          const icon = document.querySelector(`[data-app="${app}"]`);
          if (icon) icon.click();
          else alert("Pipeline not found — please open it from the desktop.");
        }
      };
    });

    // AI Research Analysis
    container.querySelectorAll("[data-ai-research]").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.aiResearch;
        const d = DISEASES.find(x => x.id === id);
        if (!d) return;
        const extra = container.querySelector(`#dd-extra-${id}`);
        if (!extra) return;

        extra.innerHTML = `<div style="padding:14px;text-align:center;color:#50809a;font-size:.82em">
          <div style="width:20px;height:20px;border:2px solid #0d2030;border-top-color:#00d4ff;border-radius:50%;animation:qt-spin .8s linear infinite;display:inline-block;margin-right:8px"></div>
          Asking Gemini for ${d.name} research synthesis...
        </div>`;

        try {
          const r = await fetch("/api/med/analyze-text", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              text: `Provide a concise research synthesis for ${d.name}: (1) Key unmet need, (2) Most promising drug target (${d.targets[0]}), (3) Novel therapeutic hypothesis, (4) Current Phase II/III pipeline, (5) What QubitPage quantum VQE could contribute. Disease context: survival ${d.survival}, gap: ${d.research_gap}`,
              type:"research_synthesis"
            }),
          });
          const data = await r.json();
          const dd = data.data || data;
          const text = dd.analysis || dd.result || dd.message || JSON.stringify(dd).substring(0,800);
          extra.innerHTML = `
            <div style="background:rgba(0,0,0,.25);border:1px solid ${d.color}30;border-radius:8px;padding:14px;font-size:.78em;line-height:1.7;color:#90b0c0;white-space:pre-wrap;max-height:280px;overflow-y:auto">
              <strong style="color:${d.color};display:block;margin-bottom:6px">🤖 AI Research Synthesis — ${d.name}</strong>
              ${esc(text)}
            </div>`;
        } catch(e) {
          extra.innerHTML = `<div style="color:#cc5555;font-size:.78em;padding:10px">Error: ${esc(e.message)}</div>`;
        }
      };
    });

    // Research Article
    container.querySelectorAll("[data-article]").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.article;
        const d = DISEASES.find(x => x.id === id);
        if (!d) return;
        const extra = container.querySelector(`#dd-extra-${id}`);
        if (!extra) return;

        extra.innerHTML = `<div style="padding:10px;font-size:.78em;color:#50809a">Loading article...</div>`;
        try {
          const r = await fetch(`/api/docs/article/${id}_comprehensive_research`);
          const data = await r.json();
          if (data.content) {
            extra.innerHTML = `<div style="background:rgba(0,0,0,.2);border-radius:8px;padding:12px;font-size:.75em;line-height:1.6;white-space:pre-wrap;max-height:300px;overflow-y:auto;color:#80a0b0;border:1px solid #0d2030">${esc(data.content.substring(0,5000))}</div>`;
          } else {
            extra.innerHTML = `<div style="font-size:.78em;color:#50809a;padding:10px">No article cached for ${d.name}. Run AI Research Analysis to generate one.</div>`;
          }
        } catch(e) {
          extra.innerHTML = `<div style="font-size:.78em;color:#50809a;padding:10px">Article not available locally for ${d.shortName}.</div>`;
        }
      };
    });
  }

  render();
}
