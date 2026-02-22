/* ═══════════════════════════════════════════════════════════════════════════
   Medical File Browser (medfiles.js) — QubitPage OS
   Real medical imaging library with pipeline integration
   ═══════════════════════════════════════════════════════════════════════════ */

function initMedFiles(winEl) {
  const app = winEl.querySelector(".medfiles-app");
  if (!app) return;

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    index: null,
    activeCategory: null,
    activeFolder: null,
    files: [],
    selectedFile: null,
    uploadFolder: null,
  };

  // ── CSS injection ──────────────────────────────────────────────────────
  if (!document.getElementById("mf-style")) {
    const s = document.createElement("style");
    s.id = "mf-style";
    s.textContent = `
      .mf-root { display:flex; height:100%; font-family:'Segoe UI',sans-serif; color:#e0e8f0; overflow:hidden; }
      .mf-sidebar { width:220px; min-width:180px; background:#030a12; border-right:1px solid #0d2235; display:flex; flex-direction:column; overflow:hidden; flex-shrink:0; }
      .mf-sidebar-header { padding:14px 14px 10px; font-size:.7em; font-weight:700; letter-spacing:.1em; color:#00d4ff; text-transform:uppercase; border-bottom:1px solid #0d2235; }
      .mf-cat-btn { display:flex; align-items:center; gap:8px; padding:10px 14px; cursor:pointer; font-size:.82em; border-left:3px solid transparent; transition:all .15s; color:#8faabb; }
      .mf-cat-btn:hover { background:#0a1a28; color:#c0d8f0; }
      .mf-cat-btn.active { background:#081522; border-left-color:#00d4ff; color:#e0f0ff; font-weight:600; }
      .mf-cat-icon { font-size:1.1em; }
      .mf-sub-list { padding:0; }
      .mf-sub-btn { display:flex; align-items:center; gap:6px; padding:7px 14px 7px 28px; cursor:pointer; font-size:.77em; color:#6a8a9e; transition:all .15s; border-left:2px solid transparent; }
      .mf-sub-btn:hover { color:#a0c8e0; background:#060f1a; }
      .mf-sub-btn.active { color:#00d4ff; background:#071018; border-left-color:#00d4ff; }
      .mf-upload-zone { margin:12px; border:1.5px dashed #1a3545; border-radius:8px; padding:12px 8px; text-align:center; cursor:pointer; font-size:.72em; color:#456080; transition:all .2s; }
      .mf-upload-zone:hover { border-color:#00d4ff; color:#00d4ff; background:#041018; }
      .mf-upload-zone.drag-over { border-color:#00ff88; color:#00ff88; background:#021210; }
      .mf-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
      .mf-toolbar { padding:10px 16px; background:#040c18; border-bottom:1px solid #0d2235; display:flex; align-items:center; gap:10px; flex-shrink:0; }
      .mf-breadcrumb { font-size:.78em; color:#6a8a9e; flex:1; }
      .mf-breadcrumb strong { color:#c0d8f8; }
      .mf-count-badge { background:#0a2030; color:#6a9ab8; font-size:.7em; padding:3px 8px; border-radius:10px; }
      .mf-search { background:#0a1a28; border:1px solid #1a3550; border-radius:6px; padding:5px 10px; color:#e0e8f0; font-size:.8em; width:180px; outline:none; }
      .mf-search:focus { border-color:#00d4ff; }
      .mf-content-area { flex:1; overflow:hidden; display:flex; }
      .mf-grid-wrap { flex:1; overflow-y:auto; padding:16px; }
      .mf-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:14px; }
      .mf-file-card { background:#071422; border:1.5px solid #112235; border-radius:10px; overflow:hidden; cursor:pointer; transition:all .2s; position:relative; }
      .mf-file-card:hover { border-color:#1a4060; transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,100,200,.15); }
      .mf-file-card.selected { border-color:#00d4ff; box-shadow:0 0 0 2px rgba(0,212,255,.25); }
      .mf-thumb { width:100%; aspect-ratio:1; object-fit:cover; display:block; background:#030d18; }
      .mf-thumb-placeholder { width:100%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:2.5em; background:#040c18; }
      .mf-card-info { padding:8px 9px; }
      .mf-card-label { font-size:.72em; font-weight:600; color:#c0d8f8; line-height:1.3; margin-bottom:4px; }
      .mf-card-disease { font-size:.67em; color:#7090a8; }
      .mf-urgency-badge { position:absolute; top:6px; right:6px; font-size:.58em; font-weight:700; padding:2px 6px; border-radius:6px; }
      .mf-urgency-badge.URGENT { background:#ff2244; color:#fff; }
      .mf-urgency-badge.ROUTINE { background:#1a4530; color:#00cc66; }
      .mf-card-type-badge { position:absolute; top:6px; left:6px; font-size:.6em; background:rgba(0,0,0,.7); color:#00d4ff; padding:2px 6px; border-radius:4px; }
      .mf-detail { width:320px; min-width:280px; background:#040e1c; border-left:1px solid #0d2235; display:flex; flex-direction:column; overflow-y:auto; flex-shrink:0; transition:width .2s; }
      .mf-detail.empty { display:flex; align-items:center; justify-content:center; }
      .mf-detail-img { width:100%; max-height:200px; object-fit:contain; background:#020a14; display:block; }
      .mf-detail-body { padding:14px; }
      .mf-detail-label { font-size:.88em; font-weight:700; color:#e0f0ff; margin-bottom:8px; line-height:1.3; }
      .mf-detail-section { margin-bottom:12px; }
      .mf-detail-section-title { font-size:.65em; text-transform:uppercase; letter-spacing:.1em; color:#00d4ff; margin-bottom:5px; font-weight:700; }
      .mf-detail-text { font-size:.76em; color:#8faabb; line-height:1.5; }
      .mf-findings { font-size:.76em; color:#c0d8f0; line-height:1.5; }
      .mf-action-btn { display:block; width:100%; margin-bottom:8px; padding:10px 14px; border:none; border-radius:8px; font-size:.8em; font-weight:600; cursor:pointer; transition:all .2s; text-align:center; }
      .mf-action-primary { background:linear-gradient(135deg,#0066bb,#0044aa); color:#fff; }
      .mf-action-primary:hover { background:linear-gradient(135deg,#0088ee,#0066cc); transform:translateY(-1px); }
      .mf-action-secondary { background:#0a1f30; color:#70a0c0; border:1px solid #1a3550; }
      .mf-action-secondary:hover { background:#0d2538; color:#90c0e0; }
      .mf-action-danger { background:#1a0810; color:#ff5577; border:1px solid #3a1525; }
      .mf-meta-grid { display:grid; grid-template-columns:auto 1fr; gap:4px 10px; font-size:.72em; }
      .mf-meta-key { color:#456080; }
      .mf-meta-val { color:#80aac8; word-break:break-all; }
      .mf-empty-state { text-align:center; padding:40px 20px; color:#3a5060; }
      .mf-empty-state .mf-empty-icon { font-size:3em; margin-bottom:12px; display:block; }
      .mf-empty-state p { font-size:.82em; line-height:1.6; }
      .mf-loading { display:flex; align-items:center; justify-content:center; padding:40px; color:#456080; font-size:.85em; gap:8px; }
      .mf-spinner { width:18px; height:18px; border:2px solid #1a3040; border-top-color:#00d4ff; border-radius:50%; animation:mf-spin .8s linear infinite; }
      @keyframes mf-spin { to { transform:rotate(360deg) } }
      .mf-section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      .mf-section-title { font-size:.82em; font-weight:700; color:#8faabb; }
      .mf-pill { font-size:.65em; padding:3px 8px; border-radius:8px; font-weight:600; }
      .mf-pill-neuro { background:#0a1040; color:#6688ff; }
      .mf-pill-tb { background:#1a0a05; color:#ff8844; }
      .mf-drop-hint { font-size:.68em; color:#2a4555; margin-top:4px; }
      .mf-upload-progress { font-size:.7em; color:#00ff88; text-align:center; padding:8px; display:none; }
      .mf-notes-area { width:100%; background:#040d18; border:1px solid #1a3045; border-radius:6px; color:#c0d8f0; font-size:.76em; padding:8px; resize:vertical; min-height:60px; font-family:inherit; outline:none; }
      .mf-notes-area:focus { border-color:#00d4ff; }
      .mf-detail-divider { border:none; border-top:1px solid #0d2235; margin:10px 0; }
      .mf-upload-form { padding:12px 14px; }
      .mf-upload-input-label { font-size:.7em; color:#6a8a9e; margin-bottom:4px; display:block; }
      .mf-upload-text-input { width:100%; background:#040d18; border:1px solid #1a3045; border-radius:6px; color:#c0d8f0; font-size:.76em; padding:6px 8px; margin-bottom:6px; outline:none; box-sizing:border-box; }
      .mf-upload-text-input:focus { border-color:#00d4ff; }
      .mf-upload-select { width:100%; background:#040d18; border:1px solid #1a3045; border-radius:6px; color:#c0d8f0; font-size:.76em; padding:6px 8px; margin-bottom:6px; outline:none; }
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function typeLabel(t) {
    const map = {
      mri_t1_contrast:"T1+Gd MRI", mri_flair:"FLAIR MRI", mri_dwi:"DWI MRI",
      mri_t1:"T1 MRI", pet_fdg:"FDG-PET", pathology_he:"H&E Path",
      xray_cxr:"CXR X-Ray", microscopy_afb:"AFB Smear", labs:"Labs Panel",
      labs_dst:"Drug Susceptibility", upload:"Upload",
    };
    return map[t] || t || "File";
  }

  function pipelineLabel(p) {
    return p === "quantumneuro" ? "QuantumNeuro (GBM)" :
           p === "quantumtb" ? "QuantumTB (MDR-TB)" : p;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  app.innerHTML = `
    <div class="mf-root">
      <aside class="mf-sidebar" id="mf-sidebar">
        <div class="mf-sidebar-header">📂 Medical Library</div>
        <div id="mf-cat-list"></div>
        <div style="flex:1"></div>
        <div style="padding:12px 14px; border-top:1px solid #0d2235;">
          <div class="mf-upload-zone" id="mf-upload-zone" title="Upload new medical file">
            ⬆ Upload New File
            <div class="mf-drop-hint">drag & drop or click</div>
          </div>
          <input type="file" id="mf-file-input" accept="image/*,.pdf,.dcm" style="display:none">
          <div class="mf-upload-progress" id="mf-upload-progress">Uploading...</div>
        </div>
      </aside>

      <div class="mf-main">
        <div class="mf-toolbar">
          <div class="mf-breadcrumb" id="mf-breadcrumb">Select a category ↓</div>
          <input class="mf-search" id="mf-search" placeholder="🔍 Search files...">
          <span class="mf-count-badge" id="mf-count">0 files</span>
        </div>
        <div class="mf-content-area">
          <div class="mf-grid-wrap" id="mf-grid-wrap">
            <div class="mf-loading"><div class="mf-spinner"></div> Loading library…</div>
          </div>
          <aside class="mf-detail" id="mf-detail">
            <div class="mf-empty-state">
              <span class="mf-empty-icon">🔬</span>
              <p>Select a file to view findings<br>and launch its pipeline</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  const sidebar   = app.querySelector("#mf-cat-list");
  const gridWrap  = app.querySelector("#mf-grid-wrap");
  const detail    = app.querySelector("#mf-detail");
  const search    = app.querySelector("#mf-search");
  const countBadge= app.querySelector("#mf-count");
  const breadcrumb= app.querySelector("#mf-breadcrumb");
  const uploadZone= app.querySelector("#mf-upload-zone");
  const fileInput = app.querySelector("#mf-file-input");
  const uploadProg= app.querySelector("#mf-upload-progress");

  // ── Load library index ─────────────────────────────────────────────────
  async function loadIndex() {
    try {
      const r = await fetch("/api/med/library");
      if (!r.ok) throw new Error("HTTP " + r.status);
      state.index = await r.json();
      renderSidebar();
      // Auto-select first category
      if (state.index.categories && state.index.categories.length > 0) {
        selectCategory(state.index.categories[0]);
      }
    } catch (e) {
      gridWrap.innerHTML = `<div class="mf-empty-state"><span class="mf-empty-icon">⚠️</span><p>Failed to load library<br><small>${esc(e.message)}</small></p></div>`;
    }
  }

  function renderSidebar() {
    if (!state.index) return;
    let html = "";
    for (const cat of state.index.categories) {
      html += `<div class="mf-cat-btn" id="mf-cat-${esc(cat.id)}" data-catid="${esc(cat.id)}">
        <span class="mf-cat-icon">${esc(cat.icon)}</span>${esc(cat.label)}
      </div>`;
      // Sub-folders shown when category is active
      html += `<div class="mf-sub-list" id="mf-sub-${esc(cat.id)}" style="display:none">`;
      for (const sf of (cat.subfolders || [])) {
        const parts = sf.split("/");
        const label = parts[parts.length - 1];
        const icons = { mri:"🧠", pathology:"🔬", labs:"🧪", xray:"📡", sputum:"🫁", uploads:"📤" };
        const ico = icons[label] || "📁";
        html += `<div class="mf-sub-btn" data-folder="${esc(sf)}">${ico} ${esc(label)}</div>`;
      }
      html += `</div>`;
    }
    sidebar.innerHTML = html;

    // Bind events
    sidebar.querySelectorAll(".mf-cat-btn").forEach(el => {
      el.addEventListener("click", () => {
        const catId = el.dataset.catid;
        const cat = state.index.categories.find(c => c.id === catId);
        if (cat) selectCategory(cat);
      });
    });
    sidebar.querySelectorAll(".mf-sub-btn").forEach(el => {
      el.addEventListener("click", () => {
        const folder = el.dataset.folder;
        selectFolder(folder);
        sidebar.querySelectorAll(".mf-sub-btn").forEach(b => b.classList.remove("active"));
        el.classList.add("active");
      });
    });
  }

  function selectCategory(cat) {
    state.activeCategory = cat;
    // Toggle sub-list visibility
    document.querySelectorAll(".mf-sub-list").forEach(el => el.style.display = "none");
    document.querySelectorAll(".mf-cat-btn").forEach(el => el.classList.remove("active"));
    const subList = app.querySelector(`#mf-sub-${cat.id}`);
    const catBtn = app.querySelector(`#mf-cat-${cat.id}`);
    if (subList) subList.style.display = "block";
    if (catBtn) catBtn.classList.add("active");
    // Clear sub-folder selection
    state.activeFolder = null;
    sidebar.querySelectorAll(".mf-sub-btn").forEach(b => b.classList.remove("active"));
    // Load all files from all subfolders of this category
    loadCategoryFiles(cat);
  }

  async function loadCategoryFiles(cat) {
    gridWrap.innerHTML = `<div class="mf-loading"><div class="mf-spinner"></div> Loading ${esc(cat.label)}…</div>`;
    breadcrumb.innerHTML = `<strong>${esc(cat.label)}</strong> / All files`;
    let allFiles = [];
    for (const sf of (cat.subfolders || [])) {
      try {
        const r = await fetch("/api/med/library/folder/" + encodeURIComponent(sf));
        if (r.ok) {
          const data = await r.json();
          const files = data.files || [];
          files.forEach(f => {
            f._folder = sf;
            f._url = "/medical-library/" + sf + "/" + f.filename;
          });
          allFiles = allFiles.concat(files);
        }
      } catch {}
    }
    state.files = allFiles;
    renderGrid(allFiles);
  }

  async function selectFolder(folderPath) {
    state.activeFolder = folderPath;
    const parts = folderPath.split("/");
    gridWrap.innerHTML = `<div class="mf-loading"><div class="mf-spinner"></div> Loading…</div>`;
    const cat = state.activeCategory;
    breadcrumb.innerHTML = `<strong>${esc(cat ? cat.label : "")}</strong> / ${esc(parts[parts.length-1])}`;
    try {
      const r = await fetch("/api/med/library/folder/" + encodeURIComponent(folderPath));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const files = (data.files || []).map(f => {
        f._folder = folderPath;
        f._url = "/medical-library/" + folderPath + "/" + f.filename;
        return f;
      });
      state.files = files;
      renderGrid(files);
    } catch (e) {
      gridWrap.innerHTML = `<div class="mf-empty-state"><span class="mf-empty-icon">⚠️</span><p>${esc(e.message)}</p></div>`;
    }
  }

  function renderGrid(files) {
    const q = search.value.toLowerCase().trim();
    const filtered = q ? files.filter(f =>
      (f.label||"").toLowerCase().includes(q) ||
      (f.disease||"").toLowerCase().includes(q) ||
      (f.clinical||"").toLowerCase().includes(q) ||
      (f.findings||"").toLowerCase().includes(q)
    ) : files;

    countBadge.textContent = filtered.length + " file" + (filtered.length === 1 ? "" : "s");

    if (filtered.length === 0) {
      gridWrap.innerHTML = `<div class="mf-empty-state"><span class="mf-empty-icon">🗂️</span><p>No files found${q ? ` for "${esc(q)}"` : ""}</p></div>`;
      return;
    }

    let html = `<div class="mf-grid">`;
    for (const f of filtered) {
      const isImg = /\.(png|jpg|jpeg|webp)$/i.test(f.filename);
      const thumb = isImg ? `<img class="mf-thumb" src="${esc(f._url)}" loading="lazy" alt="${esc(f.label)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="mf-thumb-placeholder" style="display:none">${f.urgency==='URGENT'?'🧠':'🗂️'}</div>` : `<div class="mf-thumb-placeholder">${f.type && f.type.includes('lab') ? '🧪' : '📄'}</div>`;
      html += `
        <div class="mf-file-card" data-filename="${esc(f.filename)}" data-folder="${esc(f._folder||'')}">
          ${thumb}
          <span class="mf-urgency-badge ${esc(f.urgency||'ROUTINE')}">${esc(f.urgency||'?')}</span>
          <span class="mf-card-type-badge">${esc(typeLabel(f.type))}</span>
          <div class="mf-card-info">
            <div class="mf-card-label">${esc(f.label||f.filename)}</div>
            <div class="mf-card-disease">${esc(f.disease||'')}</div>
          </div>
        </div>`;
    }
    html += `</div>`;
    gridWrap.innerHTML = html;

    gridWrap.querySelectorAll(".mf-file-card").forEach(card => {
      card.addEventListener("click", () => {
        gridWrap.querySelectorAll(".mf-file-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const fname = card.dataset.filename;
        const folder = card.dataset.folder;
        const file = state.files.find(f => f.filename === fname && f._folder === folder);
        if (file) showDetail(file);
      });
      card.addEventListener("dblclick", () => {
        const fname = card.dataset.filename;
        const folder = card.dataset.folder;
        const file = state.files.find(f => f.filename === fname && f._folder === folder);
        if (file) launchPipeline(file);
      });
    });
  }

  // ── Detail Panel ───────────────────────────────────────────────────────
  function showDetail(file) {
    state.selectedFile = file;
    const isImg = /\.(png|jpg|jpeg|webp)$/i.test(file.filename);
    const pipeline = file.pipeline || "quantumneuro";

    detail.innerHTML = `
      ${isImg ? `<img class="mf-detail-img" src="${esc(file._url)}" alt="${esc(file.label)}" onerror="this.style.background='#020a14'">` : `<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2em;background:#020a14">${file.type&&file.type.includes('lab')?'🧪':'📄'}</div>`}

      <div class="mf-detail-body">
        <div class="mf-detail-label">${esc(file.label || file.filename)}</div>
        <span class="mf-urgency-badge ${esc(file.urgency||'ROUTINE')}" style="display:inline-block;position:static;margin-bottom:10px">${esc(file.urgency||'?')}</span>

        <div class="mf-detail-section">
          <div class="mf-detail-section-title">📋 Clinical Context</div>
          <div class="mf-detail-text">${esc(file.clinical||'No clinical context available')}</div>
        </div>

        <div class="mf-detail-section">
          <div class="mf-detail-section-title">🔍 Key Findings</div>
          <div class="mf-findings">${esc(file.findings||'—')}</div>
        </div>

        <div class="mf-detail-section">
          <div class="mf-meta-grid">
            <span class="mf-meta-key">Type</span><span class="mf-meta-val">${esc(typeLabel(file.type))}</span>
            <span class="mf-meta-key">Disease</span><span class="mf-meta-val">${esc(file.disease||'—')}</span>
            <span class="mf-meta-key">Pipeline</span><span class="mf-meta-val">${esc(pipelineLabel(pipeline))}</span>
            <span class="mf-meta-key">File</span><span class="mf-meta-val">${esc(file.filename)}</span>
          </div>
        </div>

        <hr class="mf-detail-divider">

        <div class="mf-detail-section">
          <div class="mf-detail-section-title">📝 Additional Notes (optional)</div>
          <textarea class="mf-notes-area" id="mf-physician-notes" placeholder="Add clinical context, patient history, specific questions for AI analysis...">${esc(file._notes||'')}</textarea>
        </div>

        <hr class="mf-detail-divider">

        <button class="mf-action-btn mf-action-primary" id="mf-btn-launch">
          🚀 Open in ${esc(pipelineLabel(pipeline))}
        </button>
        <button class="mf-action-btn mf-action-secondary" id="mf-btn-view">
          🖼️ View Full Image
        </button>
        ${isImg ? `<button class="mf-action-btn mf-action-secondary" id="mf-btn-download">⬇️ Download</button>` : ''}
        <button class="mf-action-btn mf-action-secondary" id="mf-btn-analyze-direct">
          🤖 Quick AI Analysis (MedGemma)
        </button>

        <div id="mf-quick-result" style="margin-top:10px;font-size:.73em;color:#8faabb;display:none;background:#040e1c;border:1px solid #112235;border-radius:6px;padding:10px;max-height:180px;overflow-y:auto;line-height:1.5"></div>
      </div>
    `;

    // Actions
    detail.querySelector("#mf-btn-launch")?.addEventListener("click", () => {
      const notes = detail.querySelector("#mf-physician-notes")?.value || "";
      file._notes = notes;
      launchPipeline(file);
    });

    detail.querySelector("#mf-btn-view")?.addEventListener("click", () => {
      window.open(file._url, "_blank");
    });

    detail.querySelector("#mf-btn-download")?.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = file._url;
      a.download = file.filename;
      a.click();
    });

    detail.querySelector("#mf-btn-analyze-direct")?.addEventListener("click", () => {
      runQuickAnalysis(file);
    });
  }

  // ── Launch Pipeline ────────────────────────────────────────────────────
  function launchPipeline(file) {
    const notes = detail.querySelector("#mf-physician-notes")?.value || "";
    const appId = file.pipeline || "quantumneuro";

    // Set global preload state
    window.__qp_medPreload = {
      url: file._url,
      filename: file.filename,
      type: file.type,
      disease: file.disease,
      label: file.label,
      clinical: file.clinical,
      findings: file.findings,
      urgency: file.urgency,
      physicianNotes: notes,
      pipeline: appId,
      _timestamp: Date.now(),
    };

    // Launch the app
    if (typeof window._qpOpenApp === "function") {
      window._qpOpenApp(appId);
    } else {
      // Fallback: dispatch custom event
      document.dispatchEvent(new CustomEvent("qp-open-app", { detail: { appId } }));
    }

    // Visual feedback
    const btn = detail.querySelector("#mf-btn-launch");
    if (btn) {
      btn.textContent = "✓ Pipeline launched!";
      btn.style.background = "linear-gradient(135deg,#004422,#006633)";
      setTimeout(() => {
        btn.textContent = `🚀 Open in ${pipelineLabel(appId)}`;
        btn.style.background = "";
      }, 3000);
    }
  }

  // ── Quick MedGemma Analysis ────────────────────────────────────────────
  async function runQuickAnalysis(file) {
    const resultEl = detail.querySelector("#mf-quick-result");
    const btn = detail.querySelector("#mf-btn-analyze-direct");
    if (!resultEl || !btn) return;

    resultEl.style.display = "block";
    resultEl.textContent = "🔄 Sending to MedGemma...";
    btn.disabled = true;

    try {
      // Fetch the image, then post to analyze-image endpoint
      const imgResponse = await fetch(file._url);
      const blob = await imgResponse.blob();
      const fd = new FormData();
      fd.append("image", blob, file.filename);
      fd.append("image_type", file.type || "general");
      fd.append("clinical_context", (file.clinical || "") + (file._notes ? "\nPhysician notes: " + file._notes : ""));

      const resp = await fetch("/api/med/analyze-image", { method: "POST", body: fd });
      const data = await resp.json();

      if (data.success || data.data) {
        const d = data.data || data;
        const steps = d.steps || {};
        const medgemma = steps.medgemma_image || steps.medgemma || {};
        const gemini = steps.gemini_synthesis || "";
        let text = "";
        if (medgemma.response) text += "**MedGemma:**\n" + medgemma.response.substring(0, 600) + (medgemma.response.length > 600 ? "..." : "");
        if (gemini) text += "\n\n**Gemini Synthesis:**\n" + gemini.substring(0, 400) + (gemini.length > 400 ? "..." : "");
        if (!text) text = JSON.stringify(d, null, 2).substring(0, 800);
        resultEl.innerHTML = `<div style="white-space:pre-wrap;font-family:monospace">${esc(text)}</div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #1a3040">
            <button class="mf-action-btn mf-action-primary" style="margin:0" onclick="window.__qp_medPreload=window.__qp_medPreload||{};window.__qp_medPreload._quickResult=${JSON.stringify(JSON.stringify(d)).slice(0,200)};document.querySelector('#mf-btn-launch').click()">
              🚀 Send Full Analysis to Pipeline →
            </button>
          </div>`;
      } else {
        resultEl.textContent = "Error: " + (data.error || "Unknown error");
      }
    } catch (e) {
      resultEl.textContent = "Error: " + e.message;
    } finally {
      btn.disabled = false;
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────
  search.addEventListener("input", () => renderGrid(state.files));

  // ── Upload ─────────────────────────────────────────────────────────────
  uploadZone.addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
  uploadZone.addEventListener("drop", e => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) handleUpload(fileInput.files[0]);
  });

  // Drag & drop onto the grid area too
  gridWrap.addEventListener("dragover", e => { e.preventDefault(); gridWrap.style.outline = "2px dashed #00d4ff"; });
  gridWrap.addEventListener("dragleave", () => gridWrap.style.outline = "");
  gridWrap.addEventListener("drop", e => {
    e.preventDefault();
    gridWrap.style.outline = "";
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  });

  function handleUpload(file) {
    const cat = state.activeCategory;
    const catId = cat ? cat.id : "general";
    const sub = state.activeFolder ? state.activeFolder.split("/").pop() : "uploads";

    showUploadForm(file, catId, sub);
  }

  function showUploadForm(file, defaultCat, defaultSub) {
    const isImg = file.type.startsWith("image/");
    const previewUrl = isImg ? URL.createObjectURL(file) : null;

    detail.innerHTML = `
      <div class="mf-upload-form">
        <div style="font-size:.85em;font-weight:700;color:#00d4ff;margin-bottom:12px">📤 Upload Medical File</div>
        ${previewUrl ? `<img src="${previewUrl}" style="width:100%;max-height:160px;object-fit:contain;background:#020a14;border-radius:6px;margin-bottom:10px">` : `<div style="text-align:center;font-size:2em;padding:20px">📄</div>`}
        <div style="font-size:.75em;color:#456080;margin-bottom:10px">File: <strong style="color:#80a8c0">${esc(file.name)}</strong> (${(file.size/1024).toFixed(1)} KB)</div>

        <label class="mf-upload-input-label">Label / Title</label>
        <input class="mf-upload-text-input" id="mf-up-label" placeholder="e.g., GBM MRI Post-Contrast" value="">

        <label class="mf-upload-input-label">Disease</label>
        <select class="mf-upload-select" id="mf-up-disease">
          <option value="GBM">GBM (Glioblastoma)</option>
          <option value="MDR-TB">MDR-TB</option>
          <option value="TB">Tuberculosis</option>
          <option value="Alzheimer">Alzheimer's</option>
          <option value="ALS">ALS</option>
          <option value="Other">Other</option>
        </select>

        <label class="mf-upload-input-label">Category</label>
        <select class="mf-upload-select" id="mf-up-cat">
          <option value="neuro" ${defaultCat==="neuro"?"selected":""}>🧠 Neuro / Brain</option>
          <option value="tb" ${defaultCat==="tb"?"selected":""}>🫁 Tuberculosis</option>
          <option value="general">General</option>
        </select>

        <label class="mf-upload-input-label">Clinical Context</label>
        <textarea class="mf-notes-area" id="mf-up-clinical" placeholder="Patient age, symptoms, relevant history..."></textarea>

        <button class="mf-action-btn mf-action-primary" id="mf-up-submit" style="margin-top:10px">⬆ Upload & Add to Library</button>
        <button class="mf-action-btn mf-action-secondary" id="mf-up-cancel" style="margin-top:0">✕ Cancel</button>
        <div id="mf-up-status" style="font-size:.72em;text-align:center;color:#456080;margin-top:6px"></div>
      </div>
    `;

    detail.querySelector("#mf-up-cancel").addEventListener("click", () => {
      detail.innerHTML = `<div class="mf-empty-state"><span class="mf-empty-icon">🔬</span><p>Select a file to view findings<br>and launch its pipeline</p></div>`;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    });

    detail.querySelector("#mf-up-submit").addEventListener("click", async () => {
      const label = detail.querySelector("#mf-up-label").value.trim() || file.name;
      const disease = detail.querySelector("#mf-up-disease").value;
      const category = detail.querySelector("#mf-up-cat").value;
      const clinical = detail.querySelector("#mf-up-clinical").value.trim();
      const statusEl = detail.querySelector("#mf-up-status");
      const submitBtn = detail.querySelector("#mf-up-submit");

      submitBtn.disabled = true;
      statusEl.textContent = "Uploading...";
      uploadProg.style.display = "block";

      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label);
      fd.append("disease", disease);
      fd.append("category", category);
      fd.append("subcategory", "uploads");
      fd.append("clinical", clinical);
      fd.append("pipeline", category === "neuro" ? "quantumneuro" : category === "tb" ? "quantumtb" : "quantumneuro");

      try {
        const r = await fetch("/api/med/library/upload", { method: "POST", body: fd });
        const data = await r.json();
        uploadProg.style.display = "none";
        if (data.status === "ok") {
          statusEl.innerHTML = `<span style="color:#00ff88">✓ Uploaded successfully!</span>`;
          // Add to current file list and re-render
          const newFile = {
            ...data.metadata,
            _folder: category + "/uploads",
            _url: data.url,
          };
          state.files = [newFile, ...state.files];
          renderGrid(state.files);
          await new Promise(r => setTimeout(r, 1200));
          showDetail(newFile);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        } else {
          statusEl.innerHTML = `<span style="color:#ff4466">✗ ${esc(data.error || "Upload failed")}</span>`;
          submitBtn.disabled = false;
        }
      } catch (e) {
        uploadProg.style.display = "none";
        statusEl.innerHTML = `<span style="color:#ff4466">✗ ${esc(e.message)}</span>`;
        submitBtn.disabled = false;
      }
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────
  loadIndex();
}
