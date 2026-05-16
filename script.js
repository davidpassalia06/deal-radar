const CONDS = ['da_riparare','buone','ottime','come_nuovo'];
const COND_LABELS = { da_riparare: 'Da riparare', buone: 'Buone', ottime: 'Ottime', come_nuovo: 'Come nuovo' };
const COND_COLORS = { da_riparare: '#ef4444', buone: '#f59e0b', ottime: '#3b82f6', come_nuovo: '#22c55e' };
const CATS = { console:'Console', gioco:'Gioco', gpu:'GPU', cpu:'CPU', portatile:'PC portatile', smartphone:'Smartphone', accessorio:'Accessorio' };
const DIFF_COLORS = { Facile: '#22c55e', Media: '#f59e0b', Difficile: '#ef4444', Specialistica: '#a78bfa' };

let db = { products: [], settings: { warnDays: 30, critDays: 60 } };
let histChartInst = null;
let currentFilter = 'all';
let currentSort = 'default'; // 'default' | 'az' | 'za'

function load() {
  try { const s = localStorage.getItem('dealradar'); if(s) db = JSON.parse(s); } catch(e){}
  if(!db.settings) db.settings = { warnDays: 30, critDays: 60 };
  document.getElementById('thresh-warning').value = db.settings.warnDays;
  document.getElementById('thresh-critical').value = db.settings.critDays;
}
function save() { localStorage.setItem('dealradar', JSON.stringify(db)); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function today() { return new Date().toISOString().slice(0,10); }
function daysAgo(dateStr) { if(!dateStr) return 9999; return Math.floor((Date.now() - new Date(dateStr).getTime())/86400000); }
function lastDate(product) {
  let last = null;
  for(const c of CONDS) { const arr = product.prices?.[c]; if(arr?.length) { const d = arr[arr.length-1].date; if(!last || d > last) last = d; } }
  return last;
}
function freshnessClass(days) {
  if(days < db.settings.warnDays) return 'fresh';
  if(days < db.settings.critDays) return 'stale';
  return 'very-stale';
}
function freshnessLabel(days) {
  if(days === 9999) return 'Nessun dato';
  if(days === 0) return 'Oggi';
  if(days === 1) return 'Ieri';
  return days + ' giorni fa';
}
function latestPrice(product, cond) {
  const arr = product.prices?.[cond];
  if(!arr?.length) return null;
  return arr[arr.length-1].value;
}
function formatEur(v) { return v != null ? '€' + Math.round(v) : '—'; }

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  if(name==='dashboard') renderDashboard();
  if(name==='catalogo') renderCatalog();
  if(name==='valuta') renderValuta();
  if(window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// --- DASHBOARD ---
function renderDashboard() {
  const now = new Date();
  document.getElementById('dash-date').textContent = now.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const total = db.products.length;
  const stale = db.products.filter(p => { const d = daysAgo(lastDate(p)); return d >= db.settings.warnDays; });
  const crit = db.products.filter(p => { const d = daysAgo(lastDate(p)); return d >= db.settings.critDays; });
  const cats = [...new Set(db.products.map(p=>p.category))].length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label"><i class="bi bi-box-seam"></i> Prodotti</div><div class="stat-value">${total}</div><div class="stat-sub">${cats} categorie</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-exclamation-circle"></i> Da aggiornare</div><div class="stat-value stale">${stale.length}</div><div class="stat-sub">oltre ${db.settings.warnDays} giorni</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-x-circle"></i> Critici</div><div class="stat-value very-stale">${crit.length}</div><div class="stat-sub">oltre ${db.settings.critDays} giorni</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-check-circle"></i> Freschi</div><div class="stat-value fresh">${total - stale.length}</div><div class="stat-sub">aggiornati di recente</div></div>
  `;

  // Stale badge in sidebar
  const badge = document.getElementById('stale-badge');
  if(stale.length > 0) { badge.textContent = stale.length; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); }

  // Alerts
  let alertHtml = '';
  if(crit.length > 0) alertHtml += `<div class="alert alert-danger"><i class="bi bi-exclamation-octagon-fill"></i><div class="alert-text"><strong>${crit.length} prodotto/i con dati scaduti</strong>I prezzi non vengono aggiornati da più di ${db.settings.critDays} giorni. Considera di fare un giro su Vinted.</div></div>`;
  else if(stale.length > 0) alertHtml += `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle-fill"></i><div class="alert-text"><strong>${stale.length} prodotto/i da aggiornare</strong>I prezzi potrebbero non essere attuali. Aggiorna i dati per valutazioni precise.</div></div>`;
  document.getElementById('alert-area').innerHTML = alertHtml;

  // Update list
  const sorted = [...db.products].filter(p=>daysAgo(lastDate(p))>=db.settings.warnDays).sort((a,b)=>daysAgo(lastDate(b))-daysAgo(lastDate(a))).slice(0,5);
  if(sorted.length === 0) {
    document.getElementById('update-list').innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3); font-size:13px;"><i class="bi bi-check-circle" style="font-size:22px; display:block; margin-bottom:8px; color:var(--green);"></i>Tutti i prodotti sono aggiornati.</div>`;
  } else {
    document.getElementById('update-list').innerHTML = sorted.map(p => {
      const d = daysAgo(lastDate(p)); const fc = freshnessClass(d);
      return `<div class="update-prompt-item"><div><div class="update-prompt-name">${p.name}</div><div class="update-prompt-age ${fc}" style="margin-top:2px;">${freshnessLabel(d)}</div></div><button class="btn btn-ghost btn-sm" onclick="openEditModal('${p.id}'); showPage('catalogo');"><i class="bi bi-pencil"></i> Aggiorna</button></div>`;
    }).join('');
  }

  // Recent
  const recent = [...db.products].sort((a,b) => { const da = lastDate(a)||''; const db2 = lastDate(b)||''; return db2.localeCompare(da); }).slice(0,4);
  document.getElementById('recent-products').innerHTML = recent.length ? recent.map(p => productCardHtml(p)).join('') : `<div style="color:var(--text3); font-size:13px;">Nessun prodotto ancora.</div>`;
}

// --- CATALOG ---
function renderCatalog() {
  const products = db.products;
  document.getElementById('catalog-count').textContent = products.length + ' prodotti nel database';
  // Chips
  const allCats = ['all', ...Object.keys(CATS).filter(k => products.some(p=>p.category===k))];
  document.getElementById('filter-chips').innerHTML = allCats.map(c => `<div class="filter-chip ${currentFilter===c?'active':''}" onclick="setFilter('${c}')">${c==='all'?'Tutti':CATS[c]}</div>`).join('');
  // Sort button
  const sortLabel = currentSort === 'az' ? '<i class="bi bi-sort-alpha-down"></i> A → Z' : currentSort === 'za' ? '<i class="bi bi-sort-alpha-up-alt"></i> Z → A' : '<i class="bi bi-arrow-down-up"></i> Ordine';
  const sortEl = document.getElementById('sort-btn');
  if(sortEl) sortEl.innerHTML = sortLabel;
  const q = document.getElementById('search-input')?.value?.toLowerCase() || '';
  let filtered = products.filter(p => {
    const matchCat = currentFilter === 'all' || p.category === currentFilter;
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  if(currentSort === 'az') filtered = [...filtered].sort((a,b) => a.name.localeCompare(b.name, 'it'));
  else if(currentSort === 'za') filtered = [...filtered].sort((a,b) => b.name.localeCompare(a.name, 'it'));
  if(filtered.length === 0) {
    document.getElementById('catalog-grid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="bi bi-search"></i><h3>Nessun risultato</h3><p>Prova un termine diverso o aggiungi un nuovo prodotto.</p></div>`;
  } else {
    document.getElementById('catalog-grid').innerHTML = filtered.map(p => productCardHtml(p)).join('');
  }
}
function setFilter(cat) { currentFilter = cat; renderCatalog(); }
function cycleSort() {
  if(currentSort === 'default') currentSort = 'az';
  else if(currentSort === 'az') currentSort = 'za';
  else currentSort = 'default';
  renderCatalog();
}

function productCardHtml(p) {
  const d = daysAgo(lastDate(p)); const fc = freshnessClass(d);
  const dotColor = fc==='fresh'?'var(--green)':fc==='stale'?'var(--amber)':'var(--red)';
  const priceRows = CONDS.map(c => { const v = latestPrice(p,c); if(!v) return ''; return `<div class="price-row"><span class="price-cond">${COND_LABELS[c]}</span><span class="price-val" style="color:${COND_COLORS[c]}">${formatEur(v)}</span></div>`; }).join('');
  return `<div class="product-card" onclick="openDetail('${p.id}')">
    <div class="cat-badge cat-${p.category}"><i class="bi ${catIcon(p.category)}"></i> ${CATS[p.category]||p.category}</div>
    <h3>${p.name}</h3>
    <div class="product-desc">${p.desc||'—'}</div>
    ${priceRows || '<div style="font-size:12px; color:var(--text3);">Nessun prezzo inserito</div>'}
    <div class="freshness-info"><span class="freshness-dot" style="background:${dotColor};"></span><span class="${fc}">${freshnessLabel(d)}</span></div>
  </div>`;
}

function catIcon(cat) {
  const m = { console:'bi-controller', gioco:'bi-disc', gpu:'bi-gpu-card', cpu:'bi-cpu', portatile:'bi-laptop', smartphone:'bi-phone', accessorio:'bi-plug' };
  return m[cat]||'bi-box';
}

// --- DETAIL MODAL ---
function openDetail(id) {
  const p = db.products.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('detail-name').textContent = p.name;
  document.getElementById('detail-cat-badge').innerHTML = `<span class="cat-badge cat-${p.category}" style="display:inline-flex;"><i class="bi ${catIcon(p.category)}"></i> ${CATS[p.category]}</span>`;
  document.getElementById('detail-edit-btn').onclick = () => { closeDetail(); openEditModal(id); };

  const d = daysAgo(lastDate(p)); const fc = freshnessClass(d);
  const dotColor = fc==='fresh'?'var(--green)':fc==='stale'?'var(--amber)':'var(--red)';

  let repairHtml = '';
  if(p.category === 'console' || p.difficulty) {
    const diffColor = DIFF_COLORS[p.difficulty]||'var(--text2)';
    repairHtml = `<div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:${p.repairNotes?'10px':'0'};">
        <span style="font-size:12px; color:var(--text3); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">Riparazione</span>
        ${p.difficulty?`<span class="tag" style="color:${diffColor}; background:${diffColor}22;">${p.difficulty}</span>`:''}
      </div>
      ${p.repairNotes?`<div style="font-size:13px; color:var(--text2); line-height:1.6;">${p.repairNotes}</div>`:''}
    </div>`;
  }

  let quickHtml = '';
  if(p.quickFixes?.length) {
    quickHtml = `<div style="margin-bottom:16px;"><div style="font-size:11px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">Quick fix</div>` +
    p.quickFixes.map(f => `<div class="quick-fix-item"><span class="quick-fix-label">${f.label}</span><div class="quick-fix-btns">
      <button class="btn btn-ghost btn-sm" onclick="copyFix('${encodeURIComponent(f.query)}')"><i class="bi bi-clipboard"></i> Copia</button>
      <button class="btn btn-ghost btn-sm" onclick="searchFix('${encodeURIComponent(f.query)}', 'ifixit')"><i class="bi bi-tools"></i> iFixit</button>
      <button class="btn btn-ghost btn-sm" onclick="searchFix('${encodeURIComponent(f.query)}', 'youtube')"><i class="bi bi-play-circle"></i> YT</button>
    </div></div>`).join('') + '</div>';
  }

  // Chart
  const chartId = 'detail-chart-'+id;
  // AI Prompt section
  const aiPrompt = buildAiPrompt(p);
  const aiHtml = `<div class="card card-sm" style="margin-bottom:16px; border-color: rgba(167,139,250,0.2); background: linear-gradient(135deg, var(--surface) 0%, rgba(167,139,250,0.04) 100%);">
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:14px; color:var(--purple);">✦</span>
        <span style="font-size:11px; font-weight:600; color:var(--purple); text-transform:uppercase; letter-spacing:0.07em;">Prompt per AI</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="copy-prompt-btn-${p.id}" onclick="copyAiPrompt('${p.id}')">
        <i class="bi bi-clipboard"></i> Copia prompt
      </button>
    </div>
    <div style="background:var(--bg1); border-radius:var(--radius-sm); border:1px solid var(--border1); padding:12px 14px; font-size:12px; color:var(--text2); line-height:1.7; font-family:'JetBrains Mono', monospace; white-space:pre-wrap; max-height:180px; overflow-y:auto;">${aiPrompt}</div>
    <div style="margin-top:8px; font-size:11.5px; color:var(--text3);">Incolla questo prompt in Claude, ChatGPT o qualsiasi AI per generare una descrizione del prodotto.</div>
  </div>`;

  document.getElementById('detail-body').innerHTML = `
    ${repairHtml}
    <div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <span style="font-size:11px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:0.05em;">Prezzi per condizione</span>
        <span class="freshness-info" style="margin:0;"><span class="freshness-dot" style="background:${dotColor};"></span><span class="${fc}">${freshnessLabel(d)}</span></span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(2,1fr); gap:10px; margin-bottom:16px;">
        ${CONDS.map(c => { const v = latestPrice(p,c); return `<div style="background:var(--surface2); border-radius:8px; padding:10px 14px;"><div style="font-size:11px; color:var(--text3); margin-bottom:4px;">${COND_LABELS[c]}</div><div style="font-size:18px; font-weight:700; color:${COND_COLORS[c]}">${formatEur(v)}</div></div>`; }).join('')}
      </div>
      <div class="chart-container"><canvas id="${chartId}"></canvas></div>
    </div>
    ${quickHtml}
    ${aiHtml}
    ${p.desc?`<div class="card card-sm"><div style="font-size:12px; color:var(--text3); margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Note</div><div style="font-size:13.5px; color:var(--text2); line-height:1.6;">${p.desc}</div></div>`:''}
  `;

  document.getElementById('detail-overlay').classList.remove('hidden');
  setTimeout(() => renderDetailChart(chartId, p), 50);
}

function buildAiPrompt(p) {
  const prices = CONDS.map(c => { const v = latestPrice(p,c); return v ? `${COND_LABELS[c]}: €${Math.round(v)}` : null; }).filter(Boolean).join(', ');
  const diffLine = p.difficulty ? `Difficoltà di riparazione: ${p.difficulty}.` : '';
  const notesLine = p.repairNotes ? `Note di riparazione: ${p.repairNotes}` : '';
  const descLine = p.desc ? `Descrizione attuale: "${p.desc}"` : '';
  const catLabel = CATS[p.category] || p.category;
  return `Scrivi una descrizione concisa e professionale per un annuncio su Vinted o un database di prodotti usati.

Prodotto: ${p.name}
Categoria: ${catLabel}
${descLine}
Prezzi medi di mercato (Vinted): ${prices || 'non disponibili'}
${diffLine}
${notesLine}

La descrizione deve:
- Essere in italiano
- Durare 2-4 frasi
- Evidenziare i punti di forza e i difetti comuni del prodotto
- Essere utile a chi vuole rivendere o valutare l'acquisto
- Non inventare specifiche tecniche non menzionate`;
}

function copyAiPrompt(id) {
  const p = db.products.find(x=>x.id===id);
  if(!p) return;
  const prompt = buildAiPrompt(p);
  navigator.clipboard.writeText(prompt).then(() => {
    const btn = document.getElementById('copy-prompt-btn-'+id);
    if(btn) { btn.innerHTML='<i class="bi bi-check-lg"></i> Copiato!'; setTimeout(()=>{ btn.innerHTML='<i class="bi bi-clipboard"></i> Copia prompt'; }, 2000); }
  }).catch(() => alert(buildAiPrompt(p)));
}

function renderDetailChart(canvasId, p) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const allDates = new Set();
  for(const c of CONDS) { (p.prices?.[c]||[]).forEach(e => allDates.add(e.date)); }
  const dates = [...allDates].sort();
  if(dates.length < 2) { canvas.parentElement.style.display='none'; return; }
  const datasets = CONDS.map(c => {
    const entries = p.prices?.[c]||[];
    return { label: COND_LABELS[c], data: dates.map(d => { const e = entries.filter(x=>x.date<=d); return e.length ? e[e.length-1].value : null; }), borderColor: COND_COLORS[c], backgroundColor: 'transparent', tension: 0.3, spanGaps: true, pointRadius: 3, borderWidth: 2 };
  });
  const existing = Chart.getChart(canvasId);
  if(existing) existing.destroy();
  new Chart(canvas, { type:'line', data:{ labels:dates.map(d=>d.slice(5)), datasets }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11}, boxWidth:10 } } }, scales:{ x:{ ticks:{color:'#555f6b', font:{size:10}}, grid:{color:'rgba(255,255,255,0.04)'} }, y:{ ticks:{color:'#555f6b', font:{size:10}, callback: v=>'€'+v}, grid:{color:'rgba(255,255,255,0.04)'} } } } });
}

function closeDetail() { document.getElementById('detail-overlay').classList.add('hidden'); }
function closeDetailOnOverlay(e) { if(e.target.id==='detail-overlay') closeDetail(); }

function copyFix(enc) {
  const t = decodeURIComponent(enc);
  navigator.clipboard.writeText(t).then(()=>alert('Copiato: '+t)).catch(()=>alert('Copia: '+t));
}
function searchFix(enc, site) {
  const q = decodeURIComponent(enc);
  const urls = { ifixit: 'https://www.ifixit.com/Search?query='+encodeURIComponent(q), youtube: 'https://www.youtube.com/results?search_query='+encodeURIComponent(q) };
  window.open(urls[site], '_blank');
}

// --- ADD/EDIT MODAL ---
let qfCount = 0;
function openAddModal() {
  document.getElementById('modal-id').value = '';
  document.getElementById('modal-name').value = '';
  document.getElementById('modal-desc').value = '';
  document.getElementById('modal-cat').value = 'console';
  document.getElementById('modal-repair-notes').value = '';
  document.querySelector('input[name="difficulty"]')?.form?.reset?.();
  document.querySelectorAll('input[name="difficulty"]').forEach(r=>r.checked=false);
  CONDS.forEach(c => { const el=document.getElementById('p-'+c); if(el) el.value=''; });
  document.getElementById('quick-fix-list').innerHTML = '';
  document.getElementById('price-history-section').classList.add('hidden');
  document.getElementById('modal-title').textContent = 'Nuovo prodotto';
  document.getElementById('save-btn-text').textContent = 'Salva prodotto';
  switchTabById('tab-info');
  checkRepairTab();
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function openEditModal(id) {
  const p = db.products.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('modal-id').value = id;
  document.getElementById('modal-name').value = p.name;
  document.getElementById('modal-desc').value = p.desc||'';
  document.getElementById('modal-cat').value = p.category;
  document.getElementById('modal-repair-notes').value = p.repairNotes||'';
  document.querySelectorAll('input[name="difficulty"]').forEach(r=>{ r.checked = r.value===p.difficulty; });
  CONDS.forEach(c => { const v=latestPrice(p,c); const el=document.getElementById('p-'+c); if(el) el.value=v!=null?v:''; });
  document.getElementById('quick-fix-list').innerHTML = '';
  (p.quickFixes||[]).forEach(f => addQuickFix(f.label, f.query));
  document.getElementById('modal-title').textContent = 'Modifica prodotto';
  document.getElementById('save-btn-text').textContent = 'Aggiorna';

  const hasHistory = CONDS.some(c=>(p.prices?.[c]||[]).length>1);
  if(hasHistory) {
    document.getElementById('price-history-section').classList.remove('hidden');
    setTimeout(()=>renderHistoryChart(p), 80);
    renderHistoryTable(p);
  } else { document.getElementById('price-history-section').classList.add('hidden'); }

  switchTabById('tab-info');
  checkRepairTab();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function renderHistoryChart(p) {
  const allDates = new Set();
  for(const c of CONDS) { (p.prices?.[c]||[]).forEach(e=>allDates.add(e.date)); }
  const dates = [...allDates].sort();
  const datasets = CONDS.map(c => {
    const entries = p.prices?.[c]||[];
    return { label:COND_LABELS[c], data:dates.map(d=>{ const e=entries.filter(x=>x.date<=d); return e.length?e[e.length-1].value:null; }), borderColor:COND_COLORS[c], backgroundColor:'transparent', tension:0.3, spanGaps:true, pointRadius:3, borderWidth:2 };
  });
  if(histChartInst) { histChartInst.destroy(); histChartInst=null; }
  const canvas = document.getElementById('history-chart');
  if(!canvas) return;
  histChartInst = new Chart(canvas, { type:'line', data:{ labels:dates.map(d=>d.slice(5)), datasets }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11}, boxWidth:10 } } }, scales:{ x:{ ticks:{color:'#555f6b', font:{size:10}}, grid:{color:'rgba(255,255,255,0.04)'} }, y:{ ticks:{color:'#555f6b', font:{size:10}, callback:v=>'€'+v}, grid:{color:'rgba(255,255,255,0.04)'} } } } });
}
function renderHistoryTable(p) {
  const rows = [];
  for(const c of CONDS) {
    (p.prices?.[c]||[]).forEach(e => rows.push({date:e.date, cond:COND_LABELS[c], val:e.value, color:COND_COLORS[c]}));
  }
  rows.sort((a,b)=>b.date.localeCompare(a.date));
  const tbl = document.getElementById('history-table-body');
  if(!tbl) return;
  tbl.innerHTML = `<thead><tr><th>Data</th><th>Condizione</th><th>Prezzo</th></tr></thead><tbody>` +
    rows.slice(0,20).map(r=>`<tr><td style="color:var(--text2)">${r.date}</td><td><span style="color:${r.color}; font-weight:600; font-size:12px;">${r.cond}</span></td><td style="font-weight:600;">${formatEur(r.val)}</td></tr>`).join('') + '</tbody>';
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); if(histChartInst){histChartInst.destroy();histChartInst=null;} }
function closeModalOnOverlay(e) { if(e.target.id==='modal-overlay') closeModal(); }

function checkRepairTab() {
  const cat = document.getElementById('modal-cat').value;
  const btn = document.getElementById('tab-repair-btn');
  if(cat==='console'||cat==='gpu'||cat==='cpu'||cat==='portatile'||cat==='smartphone') { btn.style.display=''; } else { btn.style.display='none'; }
}

function switchTab(panelId, el) {
  document.querySelectorAll('#modal-tabs .tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}
function switchTabById(panelId) {
  document.querySelectorAll('#modal-tabs .tab').forEach((t,i)=>{ t.classList.toggle('active', t.getAttribute('onclick')?.includes(panelId)); });
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active', p.id===panelId));
}

function addQuickFix(label='', query='') {
  const id = 'qf-'+uid();
  const div = document.createElement('div');
  div.className='quick-fix-item'; div.id=id;
  div.innerHTML=`<input class="form-input" style="flex:1; min-width:0;" placeholder="Problema (es. YLOD)" value="${label}">
    <input class="form-input" style="flex:2; min-width:0;" placeholder="Query ricerca (es. PS3 Fat YLOD fix)" value="${query}">
    <button class="btn-icon" onclick="document.getElementById('${id}').remove()"><i class="bi bi-x"></i></button>`;
  document.getElementById('quick-fix-list').appendChild(div);
}

function saveProduct() {
  const name = document.getElementById('modal-name').value.trim();
  if(!name) { alert('Inserisci il nome del prodotto'); return; }
  const id = document.getElementById('modal-id').value || uid();
  let p = db.products.find(x=>x.id===id);
  if(!p) { p = { id, prices: {} }; db.products.push(p); }
  p.name = name;
  p.category = document.getElementById('modal-cat').value;
  p.desc = document.getElementById('modal-desc').value.trim();
  p.repairNotes = document.getElementById('modal-repair-notes').value.trim();
  const diff = document.querySelector('input[name="difficulty"]:checked');
  p.difficulty = diff ? diff.value : null;
  const qfItems = document.getElementById('quick-fix-list').children;
  p.quickFixes = [];
  for(const item of qfItems) {
    const inputs = item.querySelectorAll('input');
    if(inputs[0]?.value.trim()) p.quickFixes.push({ label: inputs[0].value.trim(), query: inputs[1]?.value.trim()||'' });
  }
  // Prices
  const td = today();
  for(const c of CONDS) {
    const val = parseFloat(document.getElementById('p-'+c)?.value);
    if(!isNaN(val) && val > 0) {
      if(!p.prices[c]) p.prices[c]=[];
      const last = p.prices[c][p.prices[c].length-1];
      if(!last || last.date !== td) p.prices[c].push({ value: val, date: td });
      else last.value = val;
    }
  }
  save();
  closeModal();
  renderDashboard();
  renderCatalog();
  renderValuta();
}

// --- VALUTA AFFARE ---
function renderValuta() {
  const sel = document.getElementById('val-product');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— seleziona —</option>' + db.products.map(p=>`<option value="${p.id}" ${p.id===cur?'selected':''}>${p.name}</option>`).join('');
  updateValuta();
}
function updateValuta() {
  const pid = document.getElementById('val-product')?.value;
  const cond = document.getElementById('val-cond')?.value;
  const price = parseFloat(document.getElementById('val-price')?.value);
  const target = document.getElementById('val-target')?.value;
  const area = document.getElementById('deal-result-area');
  if(!area) return;
  if(!pid || !cond || isNaN(price)) {
    area.innerHTML=`<div class="card" style="text-align:center; padding:40px 20px; color:var(--text3);"><i class="bi bi-calculator" style="font-size:32px; display:block; margin-bottom:12px;"></i>Seleziona un prodotto e inserisci il prezzo</div>`;
    return;
  }
  const p = db.products.find(x=>x.id===pid);
  if(!p) return;
  const avg = latestPrice(p, cond);
  if(!avg) { area.innerHTML=`<div class="card" style="text-align:center; padding:30px; color:var(--text3);">Nessun prezzo medio per questa condizione.</div>`; return; }

  const diff = avg - price;
  const pct = Math.round((diff/avg)*100);
  let verdict, vClass, fillW, fillColor, suggestion;
  if(diff > avg*0.2) { verdict='Ottimo affare'; vClass='great'; fillW=90; fillColor=`var(--green)`; suggestion='Il prezzo è significativamente sotto la media. Vale la pena.'; }
  else if(diff > 0) { verdict='Buon affare'; vClass='great'; fillW=60; fillColor=`var(--green)`; suggestion='Il prezzo è sotto la media. Discretamente conveniente.'; }
  else if(diff > -avg*0.1) { verdict='Prezzo nella norma'; vClass='ok'; fillW=40; fillColor=`var(--amber)`; suggestion='Il prezzo è in linea con la media di mercato.'; }
  else { verdict='Prezzo alto'; vClass='bad'; fillW=15; fillColor=`var(--red)`; suggestion='Prezzi troppo alti. Tratta o passa oltre.'; }

  // Margine rivendita
  let marginHtml = '';
  const tCond = target==='same'?cond:target;
  const tPrice = latestPrice(p, tCond);
  if(tPrice && tCond !== cond) {
    const margin = tPrice - price;
    const mColor = margin > 0 ? 'var(--green)' : 'var(--red)';
    marginHtml = `<div style="background:var(--surface2); border-radius:8px; padding:14px 16px; margin-top:14px;">
      <div style="font-size:11px; color:var(--text3); text-transform:uppercase; font-weight:600; letter-spacing:0.05em; margin-bottom:8px;">Margine potenziale</div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:6px;"><span style="color:var(--text2)">Compri (${COND_LABELS[cond]})</span><span style="font-weight:600;">€${Math.round(price)}</span></div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:10px;"><span style="color:var(--text2)">Rivendi (${COND_LABELS[tCond]})</span><span style="font-weight:600;">~€${Math.round(tPrice)}</span></div>
      <div style="border-top:1px solid var(--border); padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; color:var(--text2);">Margine lordo stimato</span>
        <span style="font-size:18px; font-weight:700; color:${mColor};">${margin>0?'+':''}€${Math.round(margin)}</span>
      </div>
    </div>`;
  }

  // Difficulty warning
  let diffHtml = '';
  if(p.difficulty === 'Difficile' || p.difficulty === 'Specialistica') {
    diffHtml = `<div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:10px 14px; margin-top:12px; font-size:12.5px; color:var(--amber);"><i class="bi bi-wrench"></i> Riparazione ${p.difficulty} — considera i costi di riparazione nel margine.</div>`;
  }

  area.innerHTML = `<div class="deal-result">
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; flex-wrap:wrap; gap:8px;">
      <div class="verdict ${vClass}">${verdict}</div>
      <div style="text-align:right;"><div style="font-size:11px; color:var(--text3); margin-bottom:2px;">Media mercato</div><div style="font-size:16px; font-weight:700;">${formatEur(avg)}</div></div>
    </div>
    <div style="font-size:13px; color:var(--text2); margin-bottom:10px;">${suggestion}</div>
    <div class="deal-meter"><div class="deal-meter-fill" style="width:${fillW}%; background:${fillColor};"></div></div>
    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text3);"><span>Caro</span><span>In linea</span><span>Affare</span></div>
    <div style="margin-top:14px; display:flex; gap:16px; flex-wrap:wrap;">
      <div><div style="font-size:11px; color:var(--text3);">Prezzo visto</div><div style="font-size:20px; font-weight:700;">€${Math.round(price)}</div></div>
      <div><div style="font-size:11px; color:var(--text3);">Differenza</div><div style="font-size:20px; font-weight:700; color:${diff>0?'var(--green)':'var(--red)'};">${diff>0?'+':''}€${Math.round(diff)} (${pct>0?'+':''}${pct}%)</div></div>
    </div>
    ${marginHtml}
    ${diffHtml}
  </div>`;
}

// --- SETTINGS ---
function saveSettings() {
  db.settings.warnDays = parseInt(document.getElementById('thresh-warning').value)||30;
  db.settings.critDays = parseInt(document.getElementById('thresh-critical').value)||60;
  save(); alert('Impostazioni salvate.');
}
function exportData() {
  const blob = new Blob([JSON.stringify(db, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='dealradar-backup-'+today()+'.json'; a.click();
}
function importData(e) {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ev => { try { const d=JSON.parse(ev.target.result); if(d.products) { db=d; save(); load(); renderDashboard(); alert('Dati importati: '+d.products.length+' prodotti.'); } else alert('File non valido.'); } catch { alert('Errore nel file.'); } };
  r.readAsText(f);
}
function clearAllData() {
  if(confirm('Sei sicuro? Tutti i dati verranno eliminati definitivamente.')) { db={products:[],settings:{warnDays:30,critDays:60}}; save(); renderDashboard(); renderCatalog(); renderValuta(); alert('Dati eliminati.'); }
}

// --- INIT ---

load();
renderDashboard();

document.getElementById('dash-date').textContent = new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
