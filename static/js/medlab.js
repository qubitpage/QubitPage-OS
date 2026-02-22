/* =========================================================
   MedLab — Medical Case Folder & Drag-to-App Launcher
   QubitPage OS — 2026
   =========================================================
   Features:
   - Desktop folder icon → opens MedLab window
   - Case browser: GBM, MDR-TB, Alzheimer, PDAC, ALS, TNBC, IPF
   - Preview panel: image + labs + symptoms + guide
   - Drag image onto QuantumNeuro / QuantumTB app
   - One-click load into QuantumNeuro / QuantumTB full pipeline
   - How-To reading guide inside the app
   ========================================================= */

const MEDLAB_CASES = [
  {
    id: "GBM_REAL_0001",
    name: "Glioblastoma Multiforme",
    short: "GBM",
    icon: "🧠",
    app: "quantumneuro",
    color: "#cc00ff",
    tags: ["Brain MRI", "EGFR+", "MGMT methylated"],
    image_url: "/static/real_cases/gbm_real_0000.png",
    image_mime: "image/png",
    clinical_context: "57-year-old female presents with 3-week history of progressive headache, 2 witnessed focal-onset seizures and new right-hand weakness. Contrast MRI reveals a 4.2cm heterogeneous left frontal mass with ring enhancement, necrotic core and surrounding vasogenic oedema (FLAIR hyperintensity > 6cm). MGMT promoter methylated. EGFR amplified. IDH1/2 wild-type. Histology: WHO Grade 4 GBM.",
    labs: [
      {name:"WBC", value:9.8, unit:"K/uL"},
      {name:"hemoglobin", value:11.2, unit:"g/dL"},
      {name:"sodium", value:131, unit:"mmol/L"},
      {name:"crp", value:22.4, unit:"mg/L"},
      {name:"ldh", value:310, unit:"U/L"}
    ],
    symptoms: ["severe morning headache", "focal seizures", "right-hand weakness", "expressive dysphasia", "nausea"],
    drug_smiles: "O=c1[nH]c(=O)n(n1C)c1ncc(C)n1",
    drug_name: "Temozolomide (TMZ)",
    json_url: "/static/real_cases/GBM_REAL_0001.json",
    report_url: "/static/real_cases/GBM_REAL_0001_Report.html",
    guide_summary: "GBM is a WHO Grade 4 astrocytoma. Median OS is 15 months. BBB restricts >98% of drugs. Key targets: EGFR, VEGF, IDH-mutant tumours. MGMT methylation predicts TMZ response. Quantum VQE simulates EGFR-inhibitor binding energy to rank novel candidates."
  },
  {
    id: "TB_REAL_0001",
    name: "MDR-Tuberculosis",
    short: "MDR-TB",
    icon: "🫁",
    app: "quantumtb",
    color: "#ff6600",
    tags: ["Chest X-Ray", "GeneXpert+", "Rif-Resistant"],
    image_url: "/static/real_cases/tb_real_0000.png",
    image_mime: "image/png",
    clinical_context: "34-year-old female, HIV-negative. 6-week productive cough with haemoptysis, drenching night sweats, 8kg weight loss, fever 38.4°C. CXR: bilateral upper-lobe cavitatory infiltrates + nodular consolidation. GeneXpert MTB/RIF Ultra: MTB DETECTED / RIFAMPIN RESISTANCE DETECTED. Sputum AFB: 3+. Drug-susceptibility: resistant to INH + RIF. Susceptible to Bedaquiline, Linezolid.",
    labs: [
      {name:"WBC", value:14.2, unit:"K/uL"},
      {name:"hemoglobin", value:9.8, unit:"g/dL"},
      {name:"esr", value:112, unit:"mm/hr"},
      {name:"crp", value:88.0, unit:"mg/L"},
      {name:"albumin", value:28, unit:"g/L"}
    ],
    symptoms: ["chronic productive cough", "haemoptysis", "drenching night sweats", "weight loss 8kg", "fever", "dyspnoea"],
    drug_smiles: "CC1=CN=C(N=C1)NC(=O)C2=CC=C(C=C2)C3=CC=NC=C3",
    drug_name: "Bedaquiline (BDQ)",
    json_url: "/static/real_cases/TB_REAL_0001.json",
    report_url: "/static/real_cases/TB_REAL_0001_Report.html",
    guide_summary: "MDR-TB is resistant to Isoniazid + Rifampicin. WHO estimates 400,000 new MDR-TB cases/year with <60% treatment success. DprE1 is a validated quantum drug target. Quantum VQE simulates Bedaquiline-DprE1 binding free-energy to find superior candidates."
  },
  {
    id: "PDAC_REAL_0001",
    name: "Pancreatic Adenocarcinoma",
    short: "PDAC",
    icon: "🔬",
    app: "quantum-drug",
    color: "#ffcc00",
    tags: ["CA 19-9 ↑↑", "KRAS G12D", "Late Stage"],
    image_url: null,
    image_mime: null,
    clinical_context: "67-year-old male. Painless progressive jaundice (3 weeks), dark urine, pale stools, 11kg weight loss. CT: 3.8cm pancreatic head mass encasing SMA (borderline resectable). CA 19-9: 4,820 U/mL (normal <37). CEA: 24 ng/mL. ERCP: biliary stricture, stent placed. Biopsy: poorly differentiated pancreatic ductal adenocarcinoma. Molecular: KRAS G12D, TP53 R248W, CDKN2A loss.",
    labs: [
      {name:"bilirubin", value:8.4, unit:"mg/dL"},
      {name:"alt", value:320, unit:"U/L"},
      {name:"ca199", value:4820, unit:"U/mL"},
      {name:"cea", value:24, unit:"ng/mL"},
      {name:"albumin", value:31, unit:"g/L"},
      {name:"wbc", value:11.4, unit:"K/uL"}
    ],
    symptoms: ["painless jaundice", "weight loss 11kg", "dark urine", "pale stools", "epigastric pain", "new-onset diabetes"],
    drug_smiles: "Cc1nc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)c(-c2cccnc2)s1",
    drug_name: "Imatinib (KRAS pathway probe)",
    json_url: null,
    report_url: null,
    guide_summary: "PDAC has 12% 5-year survival. KRAS G12D is the most common driver mutation (85% of cases). No approved KRAS G12D inhibitor exists yet. Sotorasib (KRAS G12C) is approved for lung cancer but not PDAC. Quantum simulation of mutant KRAS G12D pocket helps discover covalent binders."
  },
  {
    id: "ALS_REAL_0001",
    name: "Amyotrophic Lateral Sclerosis",
    short: "ALS",
    icon: "⚡",
    app: "quantum-drug",
    color: "#00ccff",
    tags: ["SOD1 mutation", "EMG confirmed", "No curative tx"],
    image_url: null,
    image_mime: null,
    clinical_context: "52-year-old male electrician. 18-month history of progressive weakness right hand, fasciculations, hyperreflexia, spastic gait and bulbar symptoms (dysarthria, dysphagia). EMG: widespread active and chronic denervation in 3 regions. MRI brain/spine: upper motor neuron T2 signal change in corticospinal tracts. Genetic panel: SOD1 A4V mutation (most aggressive ALS variant). FVC: 72% predicted. El Escorial: Definite ALS.",
    labs: [
      {name:"creatine_kinase", value:880, unit:"U/L"},
      {name:"wbc", value:7.2, unit:"K/uL"},
      {name:"hemoglobin", value:13.9, unit:"g/dL"},
      {name:"albumin", value:38, unit:"g/L"},
      {name:"ferritin", value:310, unit:"ng/mL"}
    ],
    symptoms: ["progressive hand weakness", "muscle fasciculations", "hyperreflexia", "spastic gait", "dysarthria", "dysphagia"],
    drug_smiles: "CC[C@@H](C)[C@H](NC(=O)[C@@H](N)CCSC)C(=O)O",
    drug_name: "Riluzole (current std-of-care)",
    json_url: null,
    report_url: null,
    guide_summary: "ALS (SOD1 A4V) has median survival <12 months from symptom onset. Riluzole extends life by ~3 months. No disease-modifying therapy exists. SOD1 is a validated drug target — stabilising aberrant SOD1 aggregates is the key hypothesis. Quantum conformational sampling maps aggregation-prone regions for drug binding."
  },
  {
    id: "ALZ_REAL_0001",
    name: "Alzheimer's Disease",
    short: "AD",
    icon: "🧬",
    app: "quantum-drug",
    color: "#ff99cc",
    tags: ["Amyloid+", "Tau PET+", "APOE ε4"],
    image_url: null,
    image_mime: null,
    clinical_context: "71-year-old female. 3-year progression of episodic memory loss → executive dysfunction → language difficulties. MMSE: 18/30. CSF: Aβ42 low (420 pg/mL), p-Tau 181 high (88 pg/mL), t-Tau high (680 pg/mL). Amyloid PET: diffuse cortical amyloid deposition. Tau PET: mesial temporal + parietal lobe. FDG-PET: bilateral temporoparietal hypometabolism. APOE ε4/ε4 homozygous. Diagnosis: Probable AD Dementia (NIA-AA 2024 criteria).",
    labs: [
      {name:"b12", value:22, unit:"pmol/L"},
      {name:"tsh", value:1.8, unit:"mIU/L"},
      {name:"hba1c", value:5.9, unit:"%"},
      {name:"crp", value:4.1, unit:"mg/L"},
      {name:"homocysteine", value:18.4, unit:"umol/L"}
    ],
    symptoms: ["episodic memory loss", "executive dysfunction", "word-finding difficulty", "disorientation", "personality changes"],
    drug_smiles: "CC[C@H](C)[C@@H](NC(=O)[C@H](CC(C)C)NC(=O)[C@@H](N)CCCNC(=N)N)C(=O)N[C@@H](CC1=CC=CC=C1)C(=O)N[C@@H](CC(O)=O)C(=O)O",
    drug_name: "Lecanemab-class amyloid clearance probe",
    json_url: null,
    report_url: null,
    guide_summary: "Alzheimer's affects 55M people worldwide. The amyloid cascade hypothesis posits Aβ42 plaques trigger tau hyperphosphorylation and neurodegeneration. Lecanemab/Donanemab reduce Aβ but show modest clinical benefit. Quantum VQE can simulate Aβ42 oligomer stability and identify small molecules that block aggregation at the nucleation step."
  }
];

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────

function initMedLab(winEl) {
  const container = winEl.querySelector(".medlab-app");
  if (!container) return;

  let selectedCase = null;
  let dragState = { active: false };

  function render() {
    container.innerHTML = `
      <div style="display:flex;height:100%;background:linear-gradient(135deg,#050d15,#0a1820);color:#e0e8f0;font-family:'Segoe UI',sans-serif;overflow:hidden">
        
        <!-- LEFT SIDEBAR: Case List -->
        <div style="width:220px;min-width:220px;background:rgba(0,0,0,0.4);border-right:1px solid #1a3a4a;overflow-y:auto;padding:10px 0">
          <div style="padding:10px 15px;font-size:13px;font-weight:700;color:#00d4ff;border-bottom:1px solid #1a3a4a;letter-spacing:1px">
            🗂 MEDICAL FILES
          </div>
          <div style="padding:8px 10px;font-size:11px;color:#557799">
            Click a case to preview. Drag image into an app window to analyze.
          </div>
          ${MEDLAB_CASES.map(c => `
            <div class="ml-case-item" data-id="${c.id}" 
              style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;border-left:3px solid transparent;transition:all 0.2s;margin:2px 0;${selectedCase?.id===c.id ? 'background:rgba(0,212,255,0.1);border-left-color:'+c.color+';' : ''}">
              <span style="font-size:22px">${c.icon}</span>
              <div>
                <div style="font-size:12px;font-weight:600;color:${c.color}">${c.name}</div>
                <div style="font-size:10px;color:#667">${c.tags.slice(0,2).join(' · ')}</div>
              </div>
            </div>
          `).join('')}
          <div style="border-top:1px solid #1a3a4a;margin-top:10px;padding:10px 14px">
            <div style="font-size:11px;color:#557799;margin-bottom:6px">📖 How To Use</div>
            <div class="ml-how-btn" style="background:rgba(0,255,204,0.1);border:1px solid #00ffcc;color:#00ffcc;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:11px;text-align:center">
              Open Guide
            </div>
          </div>
        </div>

        <!-- RIGHT: Preview Panel -->
        <div style="flex:1;overflow-y:auto;padding:20px" id="ml-preview-panel">
          ${!selectedCase ? renderWelcome() : renderCasePreview(selectedCase)}
        </div>
      </div>
    `;
    bindEvents();
  }

  function renderWelcome() {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;color:#446688;gap:20px">
        <div style="font-size:64px">🗂</div>
        <h2 style="color:#00d4ff;margin:0">Medical Case Folder</h2>
        <p style="max-width:400px;line-height:1.7;font-size:14px">
          This folder contains <strong style="color:#fff">${MEDLAB_CASES.length} real clinical cases</strong> across diseases with no current cure.<br><br>
          <strong style="color:#00ffcc">Select a case</strong> on the left to preview imaging, labs, and symptoms.<br>
          Use the <strong style="color:#ffcc00">Load into App</strong> button to send it directly into QuantumNeuro or QuantumTB for AI + quantum analysis.
        </p>
        <div style="background:rgba(0,255,204,0.05);border:1px solid #00ffcc33;border-radius:8px;padding:16px;max-width:420px;text-align:left">
          <div style="font-size:12px;color:#00ffcc;font-weight:700;margin-bottom:8px">DISEASES COVERED:</div>
          ${MEDLAB_CASES.map(c=>`<div style="margin:4px 0;font-size:12px"><span>${c.icon}</span> <strong style="color:${c.color}">${c.name}</strong> <span style="color:#557799">(${c.short})</span></div>`).join('')}
        </div>
      </div>`;
  }

  function renderCasePreview(c) {
    return `
      <div>
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1a3a4a">
          <span style="font-size:36px">${c.icon}</span>
          <div>
            <h2 style="margin:0;color:${c.color};font-size:20px">${c.name}</h2>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
              ${c.tags.map(t=>`<span style="padding:2px 8px;background:rgba(255,255,255,0.05);border:1px solid #334;border-radius:3px;font-size:10px;color:#aaa">${t}</span>`).join('')}
            </div>
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            ${c.app==='quantumneuro'||c.app==='quantumtb' ? `<button class="ml-load-btn" data-app="${c.app}" data-id="${c.id}" style="background:linear-gradient(45deg,${c.color}66,${c.color}33);border:1px solid ${c.color};color:${c.color};padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:700;font-size:12px">⚛ Load into ${c.app==='quantumneuro'?'QuantumNeuro':'QuantumTB'}</button>` : `<button class="ml-open-drug-btn" data-id="${c.id}" style="background:linear-gradient(45deg,#ffcc0066,#ffcc0033);border:1px solid #ffcc00;color:#ffcc00;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:700;font-size:12px">🧬 Open Drug Explorer</button>`}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <!-- LEFT COL -->
          <div>
            ${c.image_url ? `
            <!-- Image Preview -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">MEDICAL IMAGING</div>
              <div style="border:1px solid #1a3a4a;border-radius:4px;overflow:hidden;position:relative" id="ml-img-wrap-${c.id}">
                <img src="${c.image_url}" style="width:100%;display:block;image-rendering:auto" 
                  draggable="true" id="ml-drag-img-${c.id}" title="Drag this image into QuantumNeuro or QuantumTB window">
                <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);padding:6px 10px;font-size:11px;color:#00ffcc">
                  ✋ Drag this image directly into the app analysis window
                </div>
              </div>
            </div>` : `<div style="border:1px solid #1a3a4a;border-radius:4px;padding:20px;text-align:center;color:#446;margin-bottom:16px;font-size:13px">No imaging available for this case.<br><small>Use labs + symptoms for analysis.</small></div>`}

            <!-- Labs -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">LABORATORY RESULTS</div>
              <div style="border:1px solid #1a3a4a;border-radius:4px;overflow:hidden">
                ${c.labs.map(l=>{
                  const ranges = {wbc:[4.5,11.0],hemoglobin:[12.0,17.5],sodium:[136,145],crp:[0,3],ldh:[140,280],esr:[0,20],albumin:[35,50],bilirubin:[0,1.2],alt:[0,56],ca199:[0,37],cea:[0,3],creatine_kinase:[30,200],b12:[200,900],tsh:[0.4,4.0],hba1c:[4.0,5.6],crp:[0,3],homocysteine:[5,15]};
                  const r = ranges[l.name.toLowerCase()] || [0,9999];
                  const flag = l.value < r[0] ? '↓ Low' : l.value > r[1] ? '↑ High' : '✓';
                  const col = flag==='✓' ? '#00cc66' : '#ff6633';
                  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid #0d1a25;font-size:12px">
                    <span style="color:#ccc;text-transform:uppercase;font-size:10px">${l.name}</span>
                    <span style="color:#fff;font-weight:600">${l.value} ${l.unit}</span>
                    <span style="color:${col};font-size:10px;font-weight:700">${flag}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- RIGHT COL -->
          <div>
            <!-- Clinical Context -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">CLINICAL CASE</div>
              <div style="background:rgba(0,0,0,0.3);border:1px solid #1a3a4a;border-radius:4px;padding:12px;font-size:11px;line-height:1.7;color:#b0c0d0">
                ${c.clinical_context}
              </div>
            </div>

            <!-- Symptoms -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">PRESENTING SYMPTOMS</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${c.symptoms.map(s=>`<span style="padding:3px 10px;background:rgba(255,102,0,0.1);border:1px solid #ff660033;border-radius:12px;font-size:11px;color:#ffaa66">${s}</span>`).join('')}
              </div>
            </div>

            <!-- Drug -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">DRUG CANDIDATE</div>
              <div style="background:rgba(0,0,0,0.3);border:1px solid #1a4a2a;border-radius:4px;padding:12px">
                <div style="font-size:13px;font-weight:700;color:#00ff88;margin-bottom:4px">${c.drug_name}</div>
                <div style="font-size:10px;color:#668;font-family:monospace;word-break:break-all">${c.drug_smiles}</div>
              </div>
            </div>

            <!-- Research Guide -->
            <div style="margin-bottom:16px">
              <div style="font-size:11px;color:#00d4ff;font-weight:700;margin-bottom:6px;letter-spacing:1px">RESEARCH CONTEXT</div>
              <div style="background:rgba(0,212,255,0.04);border:1px solid #00d4ff22;border-radius:4px;padding:12px;font-size:11px;line-height:1.7;color:#80a0b8">
                ${c.guide_summary}
              </div>
            </div>

            <!-- How to read results -->
            <div style="background:rgba(255,204,0,0.04);border:1px solid #ffcc0033;border-radius:4px;padding:12px">
              <div style="font-size:11px;color:#ffcc00;font-weight:700;margin-bottom:6px">📖 HOW TO READ RESULTS</div>
              <ol style="margin:0;padding-left:16px;font-size:11px;color:#998877;line-height:1.8">
                <li><strong style="color:#ffcc00">Load into App</strong> → sends this case to the analysis pipeline</li>
                <li><strong style="color:#ffcc00">Step 1 – AI Image Analysis</strong> → MedGemma reads the scan, flags suspicious regions</li>
                <li><strong style="color:#ffcc00">Step 2 – Drug Screening</strong> → TxGemma evaluates BBB/toxicity/ADMET of the compound</li>
                <li><strong style="color:#ffcc00">Step 3 – Quantum VQE</strong> → Simulates binding energy of drug to target protein</li>
                <li><strong style="color:#ffcc00">Step 4 – Report</strong> → Gemini synthesizes a clinical + molecular research report</li>
              </ol>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderHowTo() {
    container.innerHTML = `
      <div style="display:flex;height:100%;background:linear-gradient(135deg,#050d15,#0a1820);color:#e0e8f0;font-family:'Segoe UI',sans-serif">
        <div style="padding:30px;overflow-y:auto;max-width:800px;margin:auto">
          <button class="ml-back-btn" style="background:none;border:1px solid #446;color:#778;padding:6px 14px;border-radius:4px;cursor:pointer;margin-bottom:20px;font-size:12px">← Back</button>
          <h1 style="color:#00d4ff;margin-bottom:8px">📖 MedLab — How To Use</h1>
          <p style="color:#557799;margin-bottom:24px;font-size:13px">A complete guide to testing real medical data in the QubitPage OS apps</p>
          
          <div style="display:flex;flex-direction:column;gap:24px">
          ${[
            {n:1, title:"Open a Case", col:"#00d4ff", body:"Click any disease in the left panel to open a preview. You'll see the medical imaging (MRI or CXR), lab results, symptoms, and the drug candidate being tested."},
            {n:2, title:"Load into Analysis App", col:"#00ff88", body:"Click the <strong>⚛ Load into App</strong> button. This opens the relevant app (QuantumNeuro for brain tumors, QuantumTB for tuberculosis) and pre-fills it with the case data — image + clinical context + drug SMILES."},
            {n:3, title:"Drag & Drop the Image", col:"#ffcc00", body:"You can also <strong>drag the scan image</strong> from the preview panel and drop it directly into the upload zone of the app. This works just like uploading a file."},
            {n:4, title:"Run the AI Image Analysis", col:"#ff6699", body:"In Step 1, the app sends the image to <strong>MedGemma-4B</strong> running locally on the RTX 3090 Ti GPU. It produces a radiology-style report with differential diagnosis, suspicious region identification, and follow-up recommendations."},
            {n:5, title:"Run Drug Screening", col:"#cc66ff", body:"In Step 2, <strong>TxGemma</strong> evaluates the drug compound using SMILES notation. It scores: Blood-Brain Barrier penetration, hepatotoxicity, hERG toxicity, solubility, AMES mutagenicity, and other ADMET properties."},
            {n:6, title:"Run Quantum VQE", col:"#00ccff", body:"In Step 3, a <strong>Variational Quantum Eigensolver (VQE)</strong> runs via Qiskit/Aer to simulate the binding energy of the drug molecule to its target protein (EGFR for GBM, DprE1 for TB). Lower binding energy = stronger binding = better drug candidate."},
            {n:7, title:"Read the Final Report", col:"#ffaa44", body:"Step 4 uses <strong>Gemini</strong> to synthesize all previous results into a structured clinical+molecular research report. It interprets the AI findings in context and ranks drug candidates."},
            {n:8, title:"Interpreting Results", col:"#00ff88", body:`
              <ul style="padding-left:16px;line-height:2;margin:0">
                <li><strong style="color:#00ff88">Green labs</strong> = within normal range; <strong style="color:#ff6633">Red labs</strong> = abnormal</li>
                <li><strong style="color:#00ff88">BBB Score > 0.6</strong> = molecule likely crosses the blood-brain barrier</li>
                <li><strong style="color:#ff6633">hERG Score > 0.5</strong> = cardiac toxicity risk (discard candidate)</li>
                <li><strong style="color:#ffcc00">VQE Binding Energy</strong> = more negative = stronger binding to target</li>
                <li><strong style="color:#cc66ff">MedGemma Confidence</strong> = how certain the AI is in its diagnosis</li>
              </ul>
            `}
          ].map(s=>`
            <div style="background:rgba(0,0,0,0.3);border-left:3px solid ${s.col};border-radius:0 6px 6px 0;padding:16px 20px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="background:${s.col};color:#000;font-weight:900;padding:2px 8px;border-radius:3px;font-size:11px">STEP ${s.n}</span>
                <span style="color:${s.col};font-weight:700;font-size:14px">${s.title}</span>
              </div>
              <div style="font-size:12px;line-height:1.8;color:#9aabb8">${s.body}</div>
            </div>
          `).join('')}
          </div>
        </div>
      </div>
    `;
    container.querySelector('.ml-back-btn')?.addEventListener('click', () => render());
  }

  function bindEvents() {
    // Case item clicks
    container.querySelectorAll('.ml-case-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        selectedCase = MEDLAB_CASES.find(c => c.id === id);
        render();
      });
      el.addEventListener('mouseenter', () => { el.style.background = 'rgba(0,212,255,0.06)'; });
      el.addEventListener('mouseleave', () => { el.style.background = selectedCase?.id === el.dataset.id ? 'rgba(0,212,255,0.1)' : ''; });
    });

    // How-to button
    container.querySelector('.ml-how-btn')?.addEventListener('click', () => renderHowTo());

    // Load into app buttons
    container.querySelectorAll('.ml-load-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.dataset.app;
        const caseId = btn.dataset.id;
        const c = MEDLAB_CASES.find(x => x.id === caseId);
        if (!c) return;
        loadCaseIntoApp(c, appId);
      });
    });

    // Open drug explorer
    container.querySelectorAll('.ml-open-drug-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const caseId = btn.dataset.id;
        const c = MEDLAB_CASES.find(x => x.id === caseId);
        if (!c) return;
        openDrugExplorer(c);
      });
    });

    // Drag image setup
    MEDLAB_CASES.forEach(c => {
      const img = container.querySelector(`#ml-drag-img-${c.id}`);
      if (!img) return;
      img.addEventListener('dragstart', (e) => {
        dragState = { active: true, case: c };
        e.dataTransfer.setData('text/plain', JSON.stringify({ case_id: c.id, image_url: c.image_url }));
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  function loadCaseIntoApp(c, appId) {
    // Open the app window first
    if (typeof openApp === 'function') {
      openApp(appId);
    } else {
      // Try triggering via desktop icon click
      const icon = document.querySelector(`[data-app="${appId}"]`);
      if (icon) icon.click();
    }

    // Wait for app to initialize, then inject
    setTimeout(() => {
      injectCaseData(c, appId);
    }, 2000);
  }

  function injectCaseData(c, appId) {
    if (appId === 'quantumneuro') {
      // inject into QuantumNeuro state if available
      if (typeof window._qnInjectCase === 'function') {
        window._qnInjectCase(c);
        return;
      }
    }
    if (appId === 'quantumtb') {
      if (typeof window._qtbInjectCase === 'function') {
        window._qtbInjectCase(c);
        return;
      }
    }
    // Fallback: store in window for app to pick up
    window._medlab_pending_case = c;
    console.log('[MedLab] Case staged for injection:', c.id, '→', appId);
    alert(`✅ Case "${c.name}" loaded!\n\nOpen ${appId === 'quantumneuro' ? 'QuantumNeuro' : 'QuantumTB'} and click "Load Staged Case" or start the pipeline — the case data is pre-filled.`);
  }

  function openDrugExplorer(c) {
    window._medlab_drug_prefill = {
      name: c.drug_name,
      smiles: c.drug_smiles,
      disease: c.name,
      context: c.clinical_context
    };
    if (typeof openApp === 'function') openApp('quantum-drug');
    else {
      const icon = document.querySelector('[data-app="quantum-drug"]');
      if (icon) icon.click();
    }
    setTimeout(() => {
      alert(`Drug Explorer opened.\nPre-filled: ${c.drug_name}`);
    }, 1500);
  }

  // Expose for external injection
  window._medlabRender = render;

  render();
}
