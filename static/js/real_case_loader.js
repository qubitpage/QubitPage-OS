// Real World Data Loader for QubitPage OS
// Shows as a desktop icon; double-click opens the panel as a modal window.

const REAL_CASES = {
    "GBM_REAL_0001": {
        "name": "Glioblastoma Multiforme (Confirmed)",
        "type": "neuro",
        "image": "static/real_cases/gbm_real_0000.png",
        "report_url": "static/real_cases/GBM_REAL_0001_Report.html",
        "json_url": "static/real_cases/GBM_REAL_0001.json"
    },
    "TB_REAL_0001": {
        "name": "MDR-Tuberculosis (Confirmed)",
        "type": "tb",
        "image": "static/real_cases/tb_real_0000.png",
        "report_url": "static/real_cases/TB_REAL_0001_Report.html",
        "json_url": "static/real_cases/TB_REAL_0001.json"
    }
};

// ── Modal window ─────────────────────────────────────────────
function openCaseLoaderModal() {
    // Don't open twice
    if (document.getElementById("rcl-modal")) {
        document.getElementById("rcl-modal").style.display = "flex";
        return;
    }

    // Backdrop
    const modal = document.createElement("div");
    modal.id = "rcl-modal";
    modal.style.cssText = `
        position:fixed;inset:0;z-index:12000;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    `;

    // Panel
    const panel = document.createElement("div");
    panel.style.cssText = `
        background:#0a141e;border:1px solid #00ffcc;border-radius:10px;
        padding:20px 24px;width:310px;color:#00ffcc;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        box-shadow:0 0 36px rgba(0,255,204,0.18);position:relative;
    `;

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.title = "Close";
    closeBtn.style.cssText = `
        position:absolute;top:10px;right:12px;background:none;
        border:none;color:#00ffcc;font-size:16px;cursor:pointer;
        line-height:1;opacity:.7;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
    closeBtn.onmouseleave = () => closeBtn.style.opacity = ".7";
    closeBtn.onclick = () => modal.style.display = "none";
    panel.appendChild(closeBtn);

    // Title
    const title = document.createElement("h4");
    title.innerText = "🗂 Real World Data";
    title.style.cssText = "margin:0 0 4px;font-size:15px;";
    panel.appendChild(title);

    const sub = document.createElement("p");
    sub.innerText = "Verified medical imaging & AI analysis results";
    sub.style.cssText = "font-size:11px;color:#668;margin:0 0 14px;";
    panel.appendChild(sub);

    // Select
    const select = document.createElement("select");
    select.style.cssText = `
        width:100%;margin-bottom:10px;padding:6px 8px;
        background:#051018;color:#fff;border:1px solid #336699;
        border-radius:5px;font-size:13px;
    `;
    const defaultOpt = document.createElement("option");
    defaultOpt.text = "— Select a case —";
    defaultOpt.value = "";
    select.appendChild(defaultOpt);
    for (const [id, info] of Object.entries(REAL_CASES)) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.text = info.name;
        select.appendChild(opt);
    }
    panel.appendChild(select);

    // Load button
    const btnLoad = document.createElement("button");
    btnLoad.innerText = "Load Case Data";
    btnLoad.style.cssText = `
        width:100%;margin-bottom:10px;padding:8px;border:none;border-radius:6px;
        background:linear-gradient(90deg,#0066cc,#0099ff);color:#fff;
        font-weight:bold;font-size:13px;cursor:pointer;
    `;
    btnLoad.onclick = () => loadCase(select.value);
    panel.appendChild(btnLoad);

    const helperText = document.createElement("p");
    helperText.innerText = "Loads verified medical imaging and AI analysis results.";
    helperText.style.cssText = "font-size:11px;color:#888;margin:0 0 12px;";
    panel.appendChild(helperText);

    // Divider
    const hr = document.createElement("hr");
    hr.style.cssText = "border:none;border-top:1px solid #1a2a3a;margin:0 0 12px;";
    panel.appendChild(hr);

    // Download link
    const lnkDownload = document.createElement("a");
    lnkDownload.innerText = "⬇ Download Full Package (ZIP)";
    lnkDownload.href = "static/real_cases/Real_World_Medical_Cases.zip";
    lnkDownload.target = "_blank";
    lnkDownload.style.cssText = `
        display:block;text-align:center;color:#00ffcc;text-decoration:none;
        font-size:12px;border:1px solid rgba(0,255,204,.4);padding:6px;
        border-radius:5px;
    `;
    lnkDownload.onmouseenter = () => lnkDownload.style.background = "rgba(0,255,204,.08)";
    lnkDownload.onmouseleave = () => lnkDownload.style.background = "transparent";
    panel.appendChild(lnkDownload);

    modal.appendChild(panel);

    // Click backdrop to close
    modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

    document.body.appendChild(modal);
}

// ── Desktop icon ──────────────────────────────────────────────
function injectDesktopIcon() {
    const iconsContainer = document.getElementById("desktop-icons");
    if (!iconsContainer || document.getElementById("rcl-desktop-icon")) return;

    const icon = document.createElement("div");
    icon.id = "rcl-desktop-icon";
    icon.className = "desktop-icon";
    icon.title = "Double-click to open Real World Data";
    icon.innerHTML = `<div class="icon-img">🗂</div><span>Real Cases</span>`;

    let clickCount = 0, clickTimer = null;
    icon.addEventListener("click", () => {
        clickCount++;
        if (clickCount === 1) {
            clickTimer = setTimeout(() => { clickCount = 0; }, 350);
        } else if (clickCount >= 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            openCaseLoaderModal();
        }
    });

    iconsContainer.appendChild(icon);
}

// ── Load case logic ───────────────────────────────────────────
async function loadCase(caseId) {
    if (!caseId || !REAL_CASES[caseId]) {
        alert("Please select a case first.");
        return;
    }
    const caseData = REAL_CASES[caseId];

    try {
        const imgSelectors = ["#image-preview", "#preview", ".image-preview img", "#uploaded-image"];
        for (let sel of imgSelectors) {
            const el = document.querySelector(sel);
            if (el && el.tagName === "IMG") {
                el.src = caseData.image;
                el.style.display = "block";
                break;
            }
        }

        const response = await fetch(caseData.json_url);
        if (!response.ok) throw new Error("Failed to fetch case JSON");
        const data = await response.json();

        const outputSelectors = ["#analysis-result", "#result", "#output", "textarea", ".output-console"];
        for (let sel of outputSelectors) {
            const el = document.querySelector(sel);
            if (el) {
                let txt = `*** REAL WORLD CASE: ${caseId} ***\nCondition: ${caseData.name}\nSource: MIMIC/TCGA Validated\n─────────────────────────\n`;
                if (data.steps?.mri_analysis?.body?.steps?.gemini_synthesis)
                    txt += "MRI: " + data.steps.mri_analysis.body.steps.gemini_synthesis + "\n\n";
                if (data.steps?.cxr_analysis?.body?.steps?.gemini_synthesis)
                    txt += "CXR: " + data.steps.cxr_analysis.body.steps.gemini_synthesis + "\n\n";
                if (data.steps?.labs?.body?.data?.ai_interpretation?.assessment)
                    txt += "LABS: " + data.steps.labs.body.data.ai_interpretation.assessment + "\n\n";
                el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el.value = txt : el.innerText = txt;
                break;
            }
        }

        window.open(caseData.report_url, "_blank");
        alert(`Case ${caseId} loaded.\nFull report opened in new tab.`);
    } catch (e) {
        alert("Error loading case: " + e.message);
    }
}

// ── Init: wait for desktop to be shown ───────────────────────
function init() {
    const desktop = document.getElementById("desktop");
    if (!desktop) return;
    if (!desktop.classList.contains("hidden")) {
        injectDesktopIcon();
    } else {
        const obs = new MutationObserver(() => {
            if (!desktop.classList.contains("hidden")) {
                injectDesktopIcon();
                obs.disconnect();
            }
        });
        obs.observe(desktop, { attributes: true, attributeFilter: ["class"] });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
