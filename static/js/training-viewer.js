/* Training Results Viewer */

function initTrainingViewer(winEl) {
  const container = winEl.querySelector(".training-viewer-app");
  if (!container) return;

  container.innerHTML = '<div style="padding:20px;text-align:center;opacity:.5">Loading training results...</div>';

  fetch("/api/docs/training-results")
    .then(r => r.json())
    .then(data => {
      const results = data.training_results || {};
      let html = '<div style="padding:16px;font-family:system-ui;color:#e0e0e0">';
      html += '<h2 style="margin:0 0 12px;color:#00ff88;font-size:1.1em">\ud83c\udfaf Training Results Dashboard</h2>';

      // Model weights summary
      if (results.fix2_results && results.fix2_results.weights) {
        html += '<h3 style="margin:12px 0 8px;font-size:.9em;color:#45b7d1">Trained Model Weights</h3>';
        html += '<table style="width:100%;font-size:.78em;border-collapse:collapse">';
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,.2)"><th style="text-align:left;padding:6px">Model</th><th>Size (MB)</th></tr>';
        for (const [model, size] of Object.entries(results.fix2_results.weights)) {
          html += `<tr style="border-bottom:1px solid rgba(255,255,255,.05)"><td style="padding:6px">${model}</td><td style="padding:6px;text-align:center">${size}</td></tr>`;
        }
        html += '</table>';
      }

      // MedGemma LoRA
      if (results.fix2_results && results.fix2_results.medgemma_lora) {
        const lora = results.fix2_results.medgemma_lora;
        html += '<h3 style="margin:16px 0 8px;font-size:.9em;color:#6c5ce7">MedGemma LoRA Training</h3>';
        html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
        lora.train_loss.forEach((loss, i) => {
          html += `<div style="background:rgba(108,92,231,.1);border:1px solid rgba(108,92,231,.3);border-radius:8px;padding:10px 16px;text-align:center">
            <div style="font-size:.7em;opacity:.5">Epoch ${i+1}</div>
            <div style="font-size:1.3em;font-weight:700;color:#6c5ce7">${loss.toFixed(4)}</div>
          </div>`;
        });
        html += '</div>';
      }

      // ADMET Results
      if (results.txgemma_admet_full) {
        const drugs = Object.keys(results.txgemma_admet_full);
        html += `<h3 style="margin:16px 0 8px;font-size:.9em;color:#ffd700">TxGemma ADMET (${drugs.length} drugs)</h3>`;
        html += '<div style="max-height:300px;overflow-y:auto;background:rgba(0,0,0,.2);border-radius:8px;padding:8px">';
        html += '<table style="width:100%;font-size:.72em;border-collapse:collapse">';
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,.2);position:sticky;top:0;background:#1a1a2e"><th style="text-align:left;padding:4px">Drug</th><th>BBB</th><th>hERG</th><th>AMES</th><th>DILI</th><th>ClinTox</th></tr>';
        for (const [drug, info] of Object.entries(results.txgemma_admet_full)) {
          const p = info.predictions || {};
          html += `<tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:4px;font-weight:600">${drug}</td>
            <td style="padding:4px;text-align:center">${(p.BBB_Martins || '-').toString().substring(0,6)}</td>
            <td style="padding:4px;text-align:center">${(p.hERG || '-').toString().substring(0,6)}</td>
            <td style="padding:4px;text-align:center">${(p.AMES || '-').toString().substring(0,6)}</td>
            <td style="padding:4px;text-align:center">${(p.DILI || '-').toString().substring(0,6)}</td>
            <td style="padding:4px;text-align:center">${(p.ClinTox || '-').toString().substring(0,6)}</td>
          </tr>`;
        }
        html += '</table></div>';
      }

      html += '</div>';
      container.innerHTML = html;
    })
    .catch(e => { container.innerHTML = '<div style="padding:20px;color:#ff6b6b">Error: ' + e.message + '</div>'; });
}
