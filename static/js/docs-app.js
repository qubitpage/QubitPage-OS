/* Documentation App — Browse QuantumMed OS documentation */

function initDocsApp(winEl) {
  const container = winEl.querySelector(".docs-app");
  if (!container) return;

  const state = { sections: [], activeSection: null, content: null, loading: false };

  function render() {
    container.innerHTML = `
      <div class="docs-layout">
        <div class="docs-sidebar">
          <h3>📚 Documentation</h3>
          <div class="docs-nav">
            ${state.sections.map(s => `
              <div class="docs-nav-item ${state.activeSection === s.id ? 'active' : ''}" data-section="${s.id}">
                ${s.title}
              </div>
            `).join("")}
          </div>
          <div class="docs-sidebar-footer">
            <small>QuantumMed OS v2.0</small>
          </div>
        </div>
        <div class="docs-main">
          ${state.loading ? '<div class="docs-loading"><div class="docs-spinner"></div></div>' : ''}
          ${state.content ? `<div class="docs-content">${formatMarkdown(state.content.content)}</div>` : `
            <div class="docs-welcome">
              <h2>📚 QuantumMed OS Documentation</h2>
              <p>Welcome to the documentation for the QuantumMed OS medical AI research platform.</p>
              <div class="docs-cards">
                <div class="docs-card" data-section="intro">
                  <h4>🚀 Introduction</h4>
                  <p>Overview of the platform and its capabilities</p>
                </div>
                <div class="docs-card" data-section="architecture">
                  <h4>🏗️ Architecture</h4>
                  <p>System design and component diagram</p>
                </div>
                <div class="docs-card" data-section="models">
                  <h4>🤖 AI Models</h4>
                  <p>HAI-DEF models: MedGemma, TxGemma, HeAR, CXR, Path</p>
                </div>
                <div class="docs-card" data-section="quantumneuro">
                  <h4>🧠 QuantumNeuro</h4>
                  <p>Glioblastoma drug discovery pipeline</p>
                </div>
                <div class="docs-card" data-section="quantumtb">
                  <h4>🫁 QuantumTB</h4>
                  <p>Tuberculosis elimination platform</p>
                </div>
                <div class="docs-card" data-section="quantum">
                  <h4>⚛️ Quantum Computing</h4>
                  <p>IBM Quantum, Braket, Aer backends</p>
                </div>
                <div class="docs-card" data-section="api">
                  <h4>🔌 API Reference</h4>
                  <p>REST API endpoints and parameters</p>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
    bindEvents();
  }

  function formatMarkdown(text) {
    if (!text) return "";
    // Handle code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>');
    // Handle tables
    text = text.replace(/\|(.+)\|\n\|[-|: ]+\|\n((?:\|.+\|\n)*)/g, (match, header, rows) => {
      const headers = header.split('|').map(h => h.trim()).filter(Boolean);
      const rowsArr = rows.trim().split('\n').map(r => r.split('|').map(c => c.trim()).filter(Boolean));
      return `<table class="docs-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rowsArr.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    });
    return text
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function bindEvents() {
    container.querySelectorAll("[data-section]").forEach(el => {
      el.addEventListener("click", () => loadSection(el.dataset.section));
    });
  }

  async function loadSection(sectionId) {
    state.activeSection = sectionId;
    state.loading = true;
    render();
    try {
      const resp = await fetch(`/api/docs/section/${sectionId}`);
      state.content = await resp.json();
    } catch (e) {
      state.content = { title: "Error", content: "Failed to load section: " + e.message };
    }
    state.loading = false;
    render();
  }

  async function loadSections() {
    try {
      const resp = await fetch("/api/docs/sections");
      const data = await resp.json();
      state.sections = data.sections || [];
    } catch (e) {
      state.sections = [];
    }
    render();
  }

  // Styles
  if (!document.getElementById("docs-styles")) {
    const style = document.createElement("style");
    style.id = "docs-styles";
    style.textContent = `
      .docs-layout { display: flex; height: 100%; font-family: 'Segoe UI', sans-serif; color: #e0e0e0; }
      .docs-sidebar { width: 240px; min-width: 240px; background: rgba(0,0,0,0.4); border-right: 1px solid #333; padding: 16px; display: flex; flex-direction: column; }
      .docs-sidebar h3 { margin: 0 0 16px; color: #fff; }
      .docs-nav { flex: 1; overflow-y: auto; }
      .docs-nav-item { padding: 10px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s; font-size: 14px; }
      .docs-nav-item:hover { background: rgba(255,255,255,0.1); }
      .docs-nav-item.active { background: rgba(0,200,255,0.2); border-left: 3px solid #00c8ff; color: #00c8ff; }
      .docs-sidebar-footer { padding-top: 12px; border-top: 1px solid #333; }
      .docs-sidebar-footer small { color: #666; }
      .docs-main { flex: 1; padding: 24px; overflow-y: auto; }
      .docs-welcome h2 { margin: 0 0 12px; }
      .docs-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 20px; }
      .docs-card { padding: 20px; background: rgba(0,0,0,0.3); border: 1px solid #444; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
      .docs-card:hover { border-color: #00c8ff; background: rgba(0,200,255,0.1); transform: translateY(-2px); }
      .docs-card h4 { margin: 0 0 8px; color: #fff; }
      .docs-card p { margin: 0; color: #888; font-size: 13px; }
      .docs-content { line-height: 1.7; }
      .docs-content h2 { color: #fff; border-bottom: 1px solid #333; padding-bottom: 8px; }
      .docs-content h3 { color: #ccc; margin-top: 24px; }
      .docs-content h4 { color: #aaa; }
      .docs-content code { background: rgba(0,200,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #00c8ff; }
      .docs-content pre { background: rgba(0,0,0,0.5); padding: 16px; border-radius: 8px; overflow-x: auto; }
      .docs-content pre code { background: none; padding: 0; color: #ddd; }
      .docs-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      .docs-table th { background: rgba(0,0,0,0.3); padding: 10px; text-align: left; border: 1px solid #444; }
      .docs-table td { padding: 10px; border: 1px solid #333; }
      .docs-loading { display: flex; justify-content: center; align-items: center; height: 200px; }
      .docs-spinner { width: 32px; height: 32px; border: 3px solid #333; border-top-color: #00c8ff; border-radius: 50%; animation: docs-spin 1s linear infinite; }
      @keyframes docs-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  loadSections();
}
