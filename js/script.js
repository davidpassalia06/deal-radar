const CONDS = ['da_riparare','buone','ottime','come_nuovo'];
const COND_LABELS = { da_riparare: 'Da riparare', buone: 'Buone', ottime: 'Ottime', come_nuovo: 'Come nuovo' };
const COND_COLORS = { da_riparare: '#ef4444', buone: '#f59e0b', ottime: '#3b82f6', come_nuovo: '#22c55e' };
const CATS = { console:'Console', gioco:'Gioco', gpu:'GPU', cpu:'CPU', portatile:'PC portatile', smartphone:'Smartphone', accessorio:'Accessorio' };
const DIFF_COLORS = { Facile: '#22c55e', Media: '#f59e0b', Difficile: '#ef4444', Specialistica: '#a78bfa' };

// ── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    label: 'Dark', icon: 'bi-moon-stars-fill',
    vars: {
      '--bg0':'#0d1117','--bg1':'#161b22','--bg2':'#141820', '--bg3':'#1a1f2e',
      '--surface':'#1c2128','--surface2':'#22272e',
      '--border':'rgba(255,255,255,0.07)','--border1':'rgba(255,255,255,0.10)',
      '--text1':'#e6edf3','--text2':'#8b949e','--text3':'#555f6b',
      '--accent':'#58a6ff','--accent-dim':'rgba(88,166,255,0.12)',
      '--green':'#3fb950','--amber':'#d29922','--red':'#f85149',
      '--blue':'#58a6ff','--purple':'#a78bfa',
      '--sidebar-bg':'#161b22','--sidebar-border':'rgba(255,255,255,0.07)'
    }
  },
  amoled: {
    label: 'AMOLED', icon: 'bi-circle-fill',
    vars: {
      '--bg0':'#000000','--bg1':'#0a0a0a','--bg2':'#000000', '--bg3':'#111111',
      '--surface':'#111111','--surface2':'#111111',
      '--border':'rgba(255,255,255,0.06)','--border1':'rgba(255,255,255,0.09)',
      '--text1':'#ffffff','--text2':'#888888','--text3':'#444444',
      '--accent':'#58a6ff','--accent-dim':'rgba(88,166,255,0.12)',
      '--green':'#3fb950','--amber':'#d29922','--red':'#f85149',
      '--blue':'#58a6ff','--purple':'#a78bfa',
      '--sidebar-bg':'#000000','--sidebar-border':'rgba(255,255,255,0.06)'
    }
  },
  light: {
    label: 'Light', icon: 'bi-sun-fill',
    vars: {
      '--bg0':'#f0f2f5','--bg1':'#ffffff','--bg2':'#ffffff', '--bg3':'#f6f8fa',
      '--surface':'#ffffff','--surface2':'#f6f8fa',
      '--border':'rgba(0,0,0,0.09)','--border1':'rgba(0,0,0,0.13)',
      '--text1':'#1c2128','--text2':'#57606a','--text3':'#8c959f',
      '--accent':'#2a9bff','--accent-dim':'rgba(9,105,218,0.10)',
      '--green':'#1a7f37','--amber':'#9a6700','--red':'#cf222e',
      '--blue':'#0969da','--purple':'#8250df',
      '--sidebar-bg':'#ffffff','--sidebar-border':'rgba(0,0,0,0.09)'
    }
  },
  nord: {
    label: 'Nord', icon: 'bi-snow',
    vars: {
      '--bg0':'#242933','--bg1':'#2e3440','--bg2':'#2e3440', '--bg3':'#434c5e',
      '--surface':'#434c5e','--surface2':'#434c5e',
      '--border':'rgba(216,222,233,0.08)','--border1':'rgba(216,222,233,0.13)',
      '--text1':'#eceff4','--text2':'#d8dee9','--text3':'#9099a7',
      '--accent':'#88c0d0','--accent-dim':'rgba(136,192,208,0.15)',
      '--green':'#a3be8c','--amber':'#ebcb8b','--red':'#bf616a',
      '--blue':'#81a1c1','--purple':'#b48ead',
      '--sidebar-bg':'#2e3440','--sidebar-border':'rgba(216,222,233,0.08)'
    }
  },
  dracula: {
    label: 'Dracula', icon: 'bi-droplet-fill',
    vars: {
      '--bg0':'#191a21','--bg1':'#22212c','--bg2':'#22212c', '--bg3':'#282a36',
      '--surface':'#282a36','--surface2':'#282a36',
      '--border':'rgba(255,255,255,0.07)','--border1':'rgba(255,255,255,0.11)',
      '--text1':'#f8f8f2','--text2':'#c5c8c6','--text3':'#6272a4',
      '--accent':'#bd93f9','--accent-dim':'rgba(189,147,249,0.15)',
      '--green':'#50fa7b','--amber':'#f1fa8c','--red':'#ff5555',
      '--blue':'#8be9fd','--purple':'#bd93f9',
      '--sidebar-bg':'#22212c','--sidebar-border':'rgba(255,255,255,0.07)'
    }
  }
};

function applyTheme(name) {
  const theme = THEMES[name] || THEMES.dark;
  for(const [k,v] of Object.entries(theme.vars))
    document.documentElement.style.setProperty(k, v);
  db.settings.theme = name;
  document.querySelectorAll('.theme-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === name)
  );
}

// ── STATE ────────────────────────────────────────────────────────────────────
let db = { products: [], settings: { warnDays: 30, critDays: 60, theme: 'dark' } };
let histChartInst = null;
let currentFilter = 'all';
let currentSort = 'default';
let currentBreadcrumb = [];

// ── PERSIST ──────────────────────────────────────────────────────────────────
function load() {
  try { const s = localStorage.getItem('dealradar'); if(s) db = JSON.parse(s); } catch(e){}
  if(!db.settings) db.settings = { warnDays:30, critDays:60, theme:'dark' };
  if(!db.settings.theme) db.settings.theme = 'dark';
  document.getElementById('thresh-warning').value = db.settings.warnDays;
  document.getElementById('thresh-critical').value = db.settings.critDays;
  applyTheme(db.settings.theme);
}
function save() { localStorage.setItem('dealradar', JSON.stringify(db)); }

// ── UTILS ────────────────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function today() { return new Date().toISOString().slice(0,10); }
function daysAgo(dateStr) { if(!dateStr) return 9999; return Math.floor((Date.now()-new Date(dateStr).getTime())/86400000); }
function lastDate(product) {
  let last = null;
  for(const c of CONDS) { const arr=product.prices?.[c]; if(arr?.length){ const d=arr[arr.length-1].date; if(!last||d>last) last=d; } }
  return last;
}
function freshnessClass(days) {
  if(days < db.settings.warnDays) return 'fresh';
  if(days < db.settings.critDays) return 'stale';
  return 'very-stale';
}
function freshnessLabel(days) {
  if(days===9999) return 'Nessun dato';
  if(days===0) return 'Oggi';
  if(days===1) return 'Ieri';
  return days+' giorni fa';
}
function latestPrice(product, cond) { const arr=product.prices?.[cond]; if(!arr?.length) return null; return arr[arr.length-1].value; }
function formatEur(v) { return v!=null?'€'+Math.round(v):'—'; }
function catIcon(cat) {
  const m={console:'bi-controller',gioco:'bi-disc',gpu:'bi-gpu-card',cpu:'bi-cpu',portatile:'bi-laptop',smartphone:'bi-phone',accessorio:'bi-plug'};
  return m[cat]||'bi-box';
}
function arrEq(a,b) { return a.length===b.length && a.every((v,i)=>v===b[i]); }

// ── NAVIGATION ───────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('nav-'+name).classList.add('active');
  if(name==='dashboard') renderDashboard();
  if(name==='catalogo') { currentBreadcrumb=[]; renderCatalog(); }
  if(name==='valuta') renderValuta();
  if(window.innerWidth<768) closeSidebar();
}
function toggleSidebar() {
  const open = document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('visible', open);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('visible');
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const now = new Date();
  document.getElementById('dash-date').textContent = now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const total = db.products.length;
  const stale = db.products.filter(p=>daysAgo(lastDate(p))>=db.settings.warnDays);
  const crit  = db.products.filter(p=>daysAgo(lastDate(p))>=db.settings.critDays);
  const cats  = [...new Set(db.products.map(p=>p.category))].length;
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label"><i class="bi bi-box-seam"></i> Prodotti</div><div class="stat-value">${total}</div><div class="stat-sub">${cats} categorie</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-exclamation-circle"></i> Da aggiornare</div><div class="stat-value stale">${stale.length}</div><div class="stat-sub">oltre ${db.settings.warnDays} giorni</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-x-circle"></i> Critici</div><div class="stat-value very-stale">${crit.length}</div><div class="stat-sub">oltre ${db.settings.critDays} giorni</div></div>
    <div class="stat-card"><div class="stat-label"><i class="bi bi-check-circle"></i> Freschi</div><div class="stat-value fresh">${total-stale.length}</div><div class="stat-sub">aggiornati di recente</div></div>`;
  const badge=document.getElementById('stale-badge');
  if(stale.length>0){badge.textContent=stale.length;badge.classList.remove('hidden');}else{badge.classList.add('hidden');}
  let alertHtml='';
  if(crit.length>0) alertHtml=`<div class="alert alert-danger"><i class="bi bi-exclamation-octagon-fill"></i><div class="alert-text"><strong>${crit.length} prodotto/i con dati scaduti</strong>I prezzi non vengono aggiornati da più di ${db.settings.critDays} giorni.</div></div>`;
  else if(stale.length>0) alertHtml=`<div class="alert alert-warning"><i class="bi bi-exclamation-triangle-fill"></i><div class="alert-text"><strong>${stale.length} prodotto/i da aggiornare</strong>Aggiorna i dati per valutazioni precise.</div></div>`;
  document.getElementById('alert-area').innerHTML=alertHtml;
  const sorted=[...db.products].filter(p=>daysAgo(lastDate(p))>=db.settings.warnDays).sort((a,b)=>daysAgo(lastDate(b))-daysAgo(lastDate(a))).slice(0,5);
  document.getElementById('update-list').innerHTML=sorted.length===0
    ?`<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;"><i class="bi bi-check-circle" style="font-size:22px;display:block;margin-bottom:8px;color:var(--green);"></i>Tutti i prodotti sono aggiornati.</div>`
    :sorted.map(p=>{const d=daysAgo(lastDate(p));const fc=freshnessClass(d);return`<div class="update-prompt-item"><div><div class="update-prompt-name">${p.name}</div><div class="update-prompt-age ${fc}" style="margin-top:2px;">${freshnessLabel(d)}</div></div><button class="btn btn-ghost btn-sm" onclick="openEditModal('${p.id}');showPage('catalogo');"><i class="bi bi-pencil"></i> Aggiorna</button></div>`;}).join('');
  const recent=[...db.products].sort((a,b)=>(lastDate(b)||'').localeCompare(lastDate(a)||'')).slice(0,4);
  document.getElementById('recent-products').innerHTML=recent.length?recent.map(p=>productCardHtml(p)).join(''):`<div style="color:var(--text3);font-size:13px;">Nessun prodotto ancora.</div>`;
}

// ── CATALOG + BREADCRUMB ──────────────────────────────────────────────────────
function renderCatalog() {
  const products = db.products;
  document.getElementById('catalog-count').textContent = products.length+' prodotti nel database';
  renderBreadcrumbNav();

  const inScope = getBreadcrumbProducts(products);
  const allCats = ['all',...Object.keys(CATS).filter(k=>inScope.some(p=>p.category===k))];
  document.getElementById('filter-chips').innerHTML = allCats.map(c=>
    `<div class="filter-chip ${currentFilter===c?'active':''}" onclick="setFilter('${c}')">${c==='all'?'Tutti':CATS[c]}</div>`
  ).join('');

  const sortLabels={default:'<i class="bi bi-arrow-down-up"></i> Ordine',az:'<i class="bi bi-sort-alpha-down"></i> A → Z',za:'<i class="bi bi-sort-alpha-up-alt"></i> Z → A'};
  const sortEl=document.getElementById('sort-btn');
  if(sortEl) sortEl.innerHTML=sortLabels[currentSort];

  const q=document.getElementById('search-input')?.value?.toLowerCase()||'';
  let filtered=inScope.filter(p=>{
    const matchCat=currentFilter==='all'||p.category===currentFilter;
    const matchQ=!q||p.name.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q);
    return matchCat&&matchQ;
  });
  if(currentSort==='az') filtered=[...filtered].sort((a,b)=>a.name.localeCompare(b.name,'it'));
  else if(currentSort==='za') filtered=[...filtered].sort((a,b)=>b.name.localeCompare(a.name,'it'));

  // Show section folders when not searching
  if(!q && currentFilter==='all') {
    const sections=getNextLevelSections(products);
    if(sections.length>0) {
      const sectionHtml=sections.map(s=>{
        const count=products.filter(p=>{
          const bc=p.breadcrumb||[];
          return bc.length>currentBreadcrumb.length && arrEq(bc.slice(0,currentBreadcrumb.length),currentBreadcrumb) && bc[currentBreadcrumb.length]===s;
        }).length;
        return `<div class="product-card section-tile" onclick="drillInto('${encodeURIComponent(s)}')" style="display:flex;align-items:center;gap:14px;padding:18px 20px;cursor:pointer;">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="bi bi-folder2-open" style="color:var(--accent);font-size:18px;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;color:var(--text1);">${s}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:2px;">${count} prodott${count===1?'o':'i'}</div>
          </div>
          <i class="bi bi-chevron-right" style="color:var(--text3);"></i>
        </div>`;
      }).join('');
      const exactProducts=filtered.filter(p=>{const bc=p.breadcrumb||[];return bc.length===currentBreadcrumb.length&&arrEq(bc,currentBreadcrumb);});
      document.getElementById('catalog-grid').innerHTML=sectionHtml+(exactProducts.length?exactProducts.map(p=>productCardHtml(p)).join(''):'');
      return;
    }
  }

  document.getElementById('catalog-grid').innerHTML=filtered.length===0
    ?`<div class="empty-state" style="grid-column:1/-1;"><i class="bi bi-search"></i><h3>Nessun risultato</h3><p>Prova un termine diverso o aggiungi un nuovo prodotto.</p></div>`
    :filtered.map(p=>productCardHtml(p)).join('');
}

function getBreadcrumbProducts(products) {
  if(currentBreadcrumb.length===0) return products;
  return products.filter(p=>arrEq((p.breadcrumb||[]).slice(0,currentBreadcrumb.length),currentBreadcrumb));
}
function getNextLevelSections(products) {
  const depth=currentBreadcrumb.length; const seen=new Set();
  for(const p of products){const bc=p.breadcrumb||[];if(bc.length>depth&&arrEq(bc.slice(0,depth),currentBreadcrumb))seen.add(bc[depth]);}
  return [...seen].sort();
}
function renderBreadcrumbNav() {
  const nav=document.getElementById('breadcrumb-nav');
  if(!nav) return;
  if(currentBreadcrumb.length===0){nav.innerHTML='';nav.style.display='none';return;}
  nav.style.display='flex';
  const crumbs=[`<span class="breadcrumb-item" onclick="setBreadcrumbDepth(-1)"><i class="bi bi-grid-2x2"></i> Tutti</span>`];
  currentBreadcrumb.forEach((seg,i)=>{
    crumbs.push(`<i class="bi bi-chevron-right" style="font-size:10px;color:var(--text3);"></i>`);
    const isLast=i===currentBreadcrumb.length-1;
    crumbs.push(`<span class="breadcrumb-item${isLast?' active':''}" ${isLast?'':` onclick="setBreadcrumbDepth(${i})"`}>${seg}</span>`);
  });
  nav.innerHTML=crumbs.join('');
}
function setBreadcrumbDepth(depth){currentBreadcrumb=depth===-1?[]:currentBreadcrumb.slice(0,depth+1);currentFilter='all';renderCatalog();}
function drillInto(enc){currentBreadcrumb=[...currentBreadcrumb,decodeURIComponent(enc)];currentFilter='all';renderCatalog();}
function setFilter(cat){currentFilter=cat;renderCatalog();}
function cycleSort(){currentSort=currentSort==='default'?'az':currentSort==='az'?'za':'default';renderCatalog();}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function productCardHtml(p) {
  const d=daysAgo(lastDate(p));const fc=freshnessClass(d);
  const dotColor=fc==='fresh'?'var(--green)':fc==='stale'?'var(--amber)':'var(--red)';
  const priceRows=CONDS.map(c=>{const v=latestPrice(p,c);if(!v)return'';return`<div class="price-row"><span class="price-cond">${COND_LABELS[c]}</span><span class="price-val" style="color:${COND_COLORS[c]}">${formatEur(v)}</span></div>`;}).join('');
  const liqResult=liquidityScore(p);const liq=liqResult.value;const stab=liqResult.stability;
  const ll=liquidityLabel(liq);
  const liqBarColor=liq>=75?'var(--green)':liq>=50?'var(--amber)':'var(--red)';
  const stabText = stab?.avgCvPct!=null
    ? `Volatilità storica: ${stab.avgCvPct}% CV · ${stab.detail}`
    : null;
  return`<div class="product-card" onclick="openDetail('${p.id}')">
    <div class="cat-badge cat-${p.category}"><i class="bi ${catIcon(p.category)}"></i> ${CATS[p.category]||p.category}</div>
    <h3>${p.name}</h3>
    <div class="product-desc">${p.desc||'—'}</div>
    ${priceRows||'<div style="font-size:12px;color:var(--text3);">Nessun prezzo inserito</div>'}
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Liquidit\u00e0</span>
        <span style="font-size:11px;font-weight:700;color:${ll.color};">${liq}/100 \u2014 ${ll.label}</span>
      </div>
      <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${liq}%;background:${liqBarColor};border-radius:2px;"></div>
      </div>
      ${stabText ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">${stabText}</div>` : ''}
    </div>
    <div class="freshness-info"><span class="freshness-dot" style="background:${dotColor};"></span><span class="${fc}">${freshnessLabel(d)}</span></div>
  </div>`;
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
function openDetail(id) {
  const p=db.products.find(x=>x.id===id); if(!p) return;
  document.getElementById('detail-name').textContent=p.name;
  document.getElementById('detail-cat-badge').innerHTML=`<span class="cat-badge cat-${p.category}" style="display:inline-flex;"><i class="bi ${catIcon(p.category)}"></i> ${CATS[p.category]}</span>`;
  document.getElementById('detail-edit-btn').onclick=()=>{closeDetail();openEditModal(id);};

  const d=daysAgo(lastDate(p));const fc=freshnessClass(d);
  const dotColor=fc==='fresh'?'var(--green)':fc==='stale'?'var(--amber)':'var(--red)';

  // Repair
  let repairHtml='';
  if(p.category==='console'||p.difficulty){
    const dc=DIFF_COLORS[p.difficulty]||'var(--text2)';
    repairHtml=`<div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${p.repairNotes?'10px':'0'};">
        <span style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Riparazione</span>
        ${p.difficulty?`<span class="tag" style="color:${dc};background:${dc}22;">${p.difficulty}</span>`:''}
      </div>
      ${p.repairNotes?`<div style="font-size:13px;color:var(--text2);line-height:1.6;">${p.repairNotes}</div>`:''}
    </div>`;
  }

  // Quick Fix — iFixit usa l'URL diretta del prodotto (punto 5)
  let quickHtml='';
  if(p.quickFixes?.length){
    const ifixitBase=p.ifixitUrl||'https://www.ifixit.com/Search?query=';
    quickHtml=`<div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Quick fix</div>`+
      p.quickFixes.map(f=>{
        const enc=encodeURIComponent(f.query);
        const ytUrl='https://www.youtube.com/results?search_query='+enc;
        return`<div class="quick-fix-item"><span class="quick-fix-label">${f.label}</span><div class="quick-fix-btns">
          <button class="btn btn-ghost btn-sm" onclick="copyFix('${enc}')"><i class="bi bi-clipboard"></i> Copia</button>
          <button class="btn btn-ghost btn-sm" onclick="window.open('${ifixitBase}','_blank')"><i class="bi bi-tools"></i> iFixit</button>
          <button class="btn btn-ghost btn-sm" onclick="window.open('${ytUrl}','_blank')"><i class="bi bi-play-circle"></i> YT</button>
        </div></div>`;
      }).join('')+'</div>';
  }

  // CFW / Homebrew (punto 3)
  let cfwHtml='';
  if(p.cfw && (p.category==='console'||p.category==='portatile')) {
    const ok=p.cfw.supporta;
    const cc=ok?'var(--green)':'var(--text3)';
    cfwHtml=`<div class="card card-sm" style="margin-bottom:16px;border-color:${ok?'rgba(63,185,80,0.2)':'var(--border)'};background:${ok?'rgba(63,185,80,0.05)':'transparent'};">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${p.cfw.note||p.cfw.metodo?'10px':'0'};">
        <div style="display:flex;align-items:center;gap:8px;">
          <i class="bi bi-cpu-fill" style="color:${cc};"></i>
          <span style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;">CFW / Homebrew</span>
        </div>
        <span class="tag" style="color:${cc};background:${cc}22;">${ok?'✓ Supportato':'✗ Non supportato'}</span>
      </div>
      ${p.cfw.metodo?`<div style="font-size:12.5px;color:var(--text1);font-weight:500;margin-bottom:6px;">${p.cfw.metodo}</div>`:''}
      ${p.cfw.note?`<div style="font-size:12px;color:var(--text2);line-height:1.6;${p.cfw.guida?'margin-bottom:10px;':''}">${p.cfw.note}</div>`:''}
      ${p.cfw.guida?`<a href="${p.cfw.guida}" target="_blank" class="btn btn-ghost btn-sm" style="display:inline-flex;width:auto;"><i class="bi bi-book"></i> Guida alla modifica</a>`:''}
    </div>`;
  }

  // Storage / HDD (punto 3)
  let storageHtml='';
  if(p.storage && (p.category==='console'||p.category==='portatile')) {
    const hasHdd=p.storage.hdd;
    const vale=p.storage.vale;
    const sc=hasHdd?(vale===false?'var(--amber)':'var(--blue)'):'var(--text3)';
    const si=hasHdd?'bi-device-hdd':'bi-x-circle';
    const sl=hasHdd?(vale===false?'HDD — upgrade poco conveniente':'HDD sostituibile / upgradabile'):'Nessun HDD interno';
    storageHtml=`<div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${p.storage.note?'8px':'0'};">
        <i class="bi ${si}" style="color:${sc};"></i>
        <span style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.07em;">Storage</span>
        <span class="tag" style="color:${sc};background:${sc}22;margin-left:auto;">${sl}</span>
      </div>
      ${p.storage.note?`<div style="font-size:12px;color:var(--text2);line-height:1.6;">${p.storage.note}</div>`:''}
    </div>`;
  }

  // AI Prompt
  const aiPrompt=buildAiPrompt(p);
  const aiHtml=`<div class="card card-sm" style="margin-bottom:16px;border-color:rgba(167,139,250,0.2);background:linear-gradient(135deg,var(--surface) 0%,rgba(167,139,250,0.04) 100%);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;color:var(--purple);">✦</span>
        <span style="font-size:11px;font-weight:600;color:var(--purple);text-transform:uppercase;letter-spacing:0.07em;">Prompt per AI</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="copy-prompt-btn-${p.id}" onclick="copyAiPrompt('${p.id}')"><i class="bi bi-clipboard"></i> Copia prompt</button>
    </div>
    <div style="background:var(--bg1);border-radius:var(--radius-sm);border:1px solid var(--border1);padding:12px 14px;font-size:12px;color:var(--text2);line-height:1.7;font-family:'JetBrains Mono',monospace;white-space:pre-wrap;max-height:180px;overflow-y:auto;">${aiPrompt}</div>
    <div style="margin-top:8px;font-size:11.5px;color:var(--text3);">Incolla questo prompt in Claude, ChatGPT o qualsiasi AI per generare una descrizione.</div>
  </div>`;

  const chartId='detail-chart-'+id;
  document.getElementById('detail-body').innerHTML=`
    ${repairHtml}
    <div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Prezzi per condizione</span>
        <span class="freshness-info" style="margin:0;"><span class="freshness-dot" style="background:${dotColor};"></span><span class="${fc}">${freshnessLabel(d)}</span></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
        ${CONDS.map(c=>{const v=latestPrice(p,c);return`<div style="background:var(--surface2);border-radius:8px;padding:10px 14px;"><div style="font-size:11px;color:var(--text3);margin-bottom:4px;">${COND_LABELS[c]}</div><div style="font-size:18px;font-weight:700;color:${COND_COLORS[c]}">${formatEur(v)}</div></div>`;}).join('')}
      </div>
      <div class="chart-container"><canvas id="${chartId}"></canvas></div>
    </div>
    ${quickHtml}
    ${cfwHtml}
    ${storageHtml}
    ${aiHtml}
    ${p.desc?`<div class="card card-sm"><div style="font-size:12px;color:var(--text3);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Note</div><div style="font-size:13.5px;color:var(--text2);line-height:1.6;">${p.desc}</div></div>`:''}
  `;
  // Liquidità editabile inline
  const liqRes = liquidityScore(p);
  const liqLbl = liquidityLabel(liqRes.value);
  const liqHtml = `<div class="card card-sm" style="margin-top:16px;margin-bottom:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;">Liquidità</span>
      <span style="font-size:12px;font-weight:700;color:${liqLbl.color};" id="liq-label-${p.id}">${liqRes.value}/100 — ${liqLbl.label}</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <input type="range" min="0" max="100" value="${liqRes.value}" style="flex:1;accent-color:var(--accent);"
        oninput="updateLiqSlider('${p.id}',this.value)">
      <input type="number" min="0" max="100" value="${liqRes.value}" id="liq-input-${p.id}"
        class="form-input" style="width:58px;text-align:center;padding:4px 6px;font-size:13px;"
        oninput="updateLiqSlider('${p.id}',this.value)">
    </div>
    <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%;" onclick="saveLiquidity('${p.id}')">
      <i class="bi bi-check-lg"></i> Salva liquidità
    </button>
  </div>`;
  // Append after detail-body
  const existingLiq = document.getElementById('liq-widget-'+p.id);
  if(existingLiq) existingLiq.remove();
  const liqDiv = document.createElement('div');
  liqDiv.id = 'liq-widget-'+p.id;
  liqDiv.innerHTML = liqHtml;
  document.getElementById('detail-body').appendChild(liqDiv);

  document.getElementById('detail-overlay').classList.remove('hidden');
  setTimeout(()=>renderDetailChart(chartId,p),50);
}

function updateLiqSlider(id, val) {
  val = Math.max(0, Math.min(100, parseInt(val)||0));
  const inp = document.getElementById('liq-input-'+id);
  if(inp) inp.value = val;
  // Sync range input
  const wrap = document.getElementById('liq-widget-'+id);
  if(wrap) { const range = wrap.querySelector('input[type=range]'); if(range) range.value = val; }
  // Update label live
  const lbl = document.getElementById('liq-label-'+id);
  if(lbl) { const ll = liquidityLabel(val); lbl.textContent = val+'/100 — '+ll.label; lbl.style.color = ll.color; }
}

function saveLiquidity(id) {
  const p = db.products.find(x=>x.id===id); if(!p) return;
  const inp = document.getElementById('liq-input-'+id);
  const val = Math.max(0, Math.min(100, parseInt(inp?.value)||0));
  p.liquidityBase = val;
  save(); renderCatalog(); renderDashboard();
  const btn = document.querySelector(`#liq-widget-${id} button`);
  if(btn){btn.innerHTML='<i class="bi bi-check-lg"></i> Salvato!';setTimeout(()=>{btn.innerHTML='<i class="bi bi-check-lg"></i> Salva liquidità';},1500);}
}

function buildAiPrompt(p) {
  const prices=CONDS.map(c=>{const v=latestPrice(p,c);return v?`${COND_LABELS[c]}: €${Math.round(v)}`:null;}).filter(Boolean).join(', ');
  return`Scrivi una descrizione concisa e professionale per un annuncio su Vinted o un database di prodotti usati.

Prodotto: ${p.name}
Categoria: ${CATS[p.category]||p.category}
${p.desc?`Descrizione attuale: "${p.desc}"`:''}
Prezzi medi di mercato (Vinted): ${prices||'non disponibili'}
${p.difficulty?`Difficoltà di riparazione: ${p.difficulty}.`:''}
${p.repairNotes?`Note di riparazione: ${p.repairNotes}`:''}

La descrizione deve:
- Essere in italiano
- Durare 2-4 frasi
- Evidenziare i punti di forza e i difetti comuni del prodotto
- Essere utile a chi vuole rivendere o valutare l'acquisto
- Non inventare specifiche tecniche non menzionate`;
}

function copyAiPrompt(id) {
  const p=db.products.find(x=>x.id===id); if(!p) return;
  navigator.clipboard.writeText(buildAiPrompt(p)).then(()=>{
    const btn=document.getElementById('copy-prompt-btn-'+id);
    if(btn){btn.innerHTML='<i class="bi bi-check-lg"></i> Copiato!';setTimeout(()=>{btn.innerHTML='<i class="bi bi-clipboard"></i> Copia prompt';},2000);}
  }).catch(()=>alert(buildAiPrompt(p)));
}

function renderDetailChart(canvasId,p) {
  const canvas=document.getElementById(canvasId); if(!canvas) return;
  const allDates=new Set();
  for(const c of CONDS){(p.prices?.[c]||[]).forEach(e=>allDates.add(e.date));}
  const dates=[...allDates].sort();
  if(dates.length<2){canvas.parentElement.style.display='none';return;}
  const datasets=CONDS.map(c=>{const entries=p.prices?.[c]||[];return{label:COND_LABELS[c],data:dates.map(d=>{const e=entries.filter(x=>x.date<=d);return e.length?e[e.length-1].value:null;}),borderColor:COND_COLORS[c],backgroundColor:'transparent',tension:0.3,spanGaps:true,pointRadius:3,borderWidth:2};});
  const existing=Chart.getChart(canvasId); if(existing) existing.destroy();
  new Chart(canvas,{type:'line',data:{labels:dates.map(d=>d.slice(5)),datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b949e',font:{size:11},boxWidth:10}}},scales:{x:{ticks:{color:'#555f6b',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#555f6b',font:{size:10},callback:v=>'€'+v},grid:{color:'rgba(255,255,255,0.04)'}}}}});
}

function closeDetail(){document.getElementById('detail-overlay').classList.add('hidden');}
function closeDetailOnOverlay(e){if(e.target.id==='detail-overlay')closeDetail();}
function copyFix(enc){navigator.clipboard.writeText(decodeURIComponent(enc)).catch(()=>{});}

// ── EDIT / ADD MODAL ──────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modal-id').value='';
  document.getElementById('modal-name').value='';
  document.getElementById('modal-desc').value='';
  document.getElementById('modal-cat').value='console';
  document.getElementById('modal-repair-notes').value='';
  document.getElementById('modal-breadcrumb').value='';
  document.querySelectorAll('input[name="difficulty"]').forEach(r=>r.checked=false);
  CONDS.forEach(c=>{const el=document.getElementById('p-'+c);if(el)el.value='';});
  document.getElementById('quick-fix-list').innerHTML='';
  document.getElementById('price-history-section').classList.add('hidden');
  document.getElementById('modal-title').textContent='Nuovo prodotto';
  document.getElementById('save-btn-text').textContent='Salva prodotto';
  document.getElementById('delete-product-btn')?.classList.add('hidden');
  switchTabById('tab-info'); checkRepairTab();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function openEditModal(id) {
  const p=db.products.find(x=>x.id===id); if(!p) return;
  document.getElementById('modal-id').value=id;
  document.getElementById('modal-name').value=p.name;
  document.getElementById('modal-desc').value=p.desc||'';
  document.getElementById('modal-cat').value=p.category;
  document.getElementById('modal-repair-notes').value=p.repairNotes||'';
  document.getElementById('modal-breadcrumb').value=(p.breadcrumb||[]).join(' > ');
  document.querySelectorAll('input[name="difficulty"]').forEach(r=>{r.checked=r.value===p.difficulty;});
  CONDS.forEach(c=>{const v=latestPrice(p,c);const el=document.getElementById('p-'+c);if(el)el.value=v!=null?v:'';});
  document.getElementById('quick-fix-list').innerHTML='';
  (p.quickFixes||[]).forEach(f=>addQuickFix(f.label,f.query));
  document.getElementById('modal-title').textContent='Modifica prodotto';
  document.getElementById('save-btn-text').textContent='Aggiorna';
  document.getElementById('delete-product-btn')?.classList.remove('hidden');
  const hasHistory=CONDS.some(c=>(p.prices?.[c]||[]).length>1);
  if(hasHistory){document.getElementById('price-history-section').classList.remove('hidden');setTimeout(()=>renderHistoryChart(p),80);renderHistoryTable(p);}
  else{document.getElementById('price-history-section').classList.add('hidden');}
  switchTabById('tab-info'); checkRepairTab();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function renderHistoryChart(p) {
  const allDates=new Set();
  for(const c of CONDS){(p.prices?.[c]||[]).forEach(e=>allDates.add(e.date));}
  const dates=[...allDates].sort();
  const datasets=CONDS.map(c=>{const entries=p.prices?.[c]||[];return{label:COND_LABELS[c],data:dates.map(d=>{const e=entries.filter(x=>x.date<=d);return e.length?e[e.length-1].value:null;}),borderColor:COND_COLORS[c],backgroundColor:'transparent',tension:0.3,spanGaps:true,pointRadius:3,borderWidth:2};});
  if(histChartInst){histChartInst.destroy();histChartInst=null;}
  const canvas=document.getElementById('history-chart'); if(!canvas) return;
  histChartInst=new Chart(canvas,{type:'line',data:{labels:dates.map(d=>d.slice(5)),datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b949e',font:{size:11},boxWidth:10}}},scales:{x:{ticks:{color:'#555f6b',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#555f6b',font:{size:10},callback:v=>'€'+v},grid:{color:'rgba(255,255,255,0.04)'}}}}});
}
function renderHistoryTable(p) {
  const rows=[];
  for(const c of CONDS){(p.prices?.[c]||[]).forEach(e=>rows.push({date:e.date,cond:COND_LABELS[c],val:e.value,color:COND_COLORS[c]}));}
  rows.sort((a,b)=>b.date.localeCompare(a.date));
  const tbl=document.getElementById('history-table-body'); if(!tbl) return;
  tbl.innerHTML=`<thead><tr><th>Data</th><th>Condizione</th><th>Prezzo</th></tr></thead><tbody>`+rows.slice(0,20).map(r=>`<tr><td style="color:var(--text2)">${r.date}</td><td><span style="color:${r.color};font-weight:600;font-size:12px;">${r.cond}</span></td><td style="font-weight:600;">${formatEur(r.val)}</td></tr>`).join('')+'</tbody>';
}

function closeModal(){document.getElementById('modal-overlay').classList.add('hidden');if(histChartInst){histChartInst.destroy();histChartInst=null;}}
function closeModalOnOverlay(e){if(e.target.id==='modal-overlay')closeModal();}
function checkRepairTab(){const cat=document.getElementById('modal-cat').value;const btn=document.getElementById('tab-repair-btn');if(cat==='console'||cat==='gpu'||cat==='cpu'||cat==='portatile'||cat==='smartphone')btn.style.display='';else btn.style.display='none';}
function switchTab(panelId,el){document.querySelectorAll('#modal-tabs .tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.getElementById(panelId).classList.add('active');}
function switchTabById(panelId){document.querySelectorAll('#modal-tabs .tab').forEach(t=>t.classList.toggle('active',t.getAttribute('onclick')?.includes(panelId)));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===panelId));}

function addQuickFix(label='',query='') {
  const id='qf-'+uid(); const div=document.createElement('div');
  div.className='quick-fix-item'; div.id=id;
  div.innerHTML=`<input class="form-input" style="flex:1;min-width:0;" placeholder="Problema (es. YLOD)" value="${label}">
    <input class="form-input" style="flex:2;min-width:0;" placeholder="Query ricerca" value="${query}">
    <button class="btn-icon" onclick="document.getElementById('${id}').remove()"><i class="bi bi-x"></i></button>`;
  document.getElementById('quick-fix-list').appendChild(div);
}

function deleteProductFromModal() {
  const id = document.getElementById('modal-id').value; if(!id) return;
  const p = db.products.find(x=>x.id===id); if(!p) return;
  if(!confirm(`Eliminare "${p.name}" definitivamente?`)) return;
  db.products = db.products.filter(x=>x.id!==id);
  save(); closeModal(); renderDashboard(); renderCatalog(); renderValuta();
}

function saveProduct() {
  const name=document.getElementById('modal-name').value.trim();
  if(!name){alert('Inserisci il nome del prodotto');return;}
  const id=document.getElementById('modal-id').value||uid();
  let p=db.products.find(x=>x.id===id);
  if(!p){p={id,prices:{}};db.products.push(p);}
  p.name=name;
  p.category=document.getElementById('modal-cat').value;
  p.desc=document.getElementById('modal-desc').value.trim();
  p.repairNotes=document.getElementById('modal-repair-notes').value.trim();
  const bcRaw=document.getElementById('modal-breadcrumb').value.trim();
  p.breadcrumb=bcRaw?bcRaw.split('>').map(s=>s.trim()).filter(Boolean):[];
  const diff=document.querySelector('input[name="difficulty"]:checked');
  p.difficulty=diff?diff.value:null;
  p.quickFixes=[];
  for(const item of document.getElementById('quick-fix-list').children){
    const inputs=item.querySelectorAll('input');
    if(inputs[0]?.value.trim())p.quickFixes.push({label:inputs[0].value.trim(),query:inputs[1]?.value.trim()||''});
  }
  const td=today();
  for(const c of CONDS){
    const val=parseFloat(document.getElementById('p-'+c)?.value);
    if(!isNaN(val)&&val>0){
      if(!p.prices[c])p.prices[c]=[];
      const last=p.prices[c][p.prices[c].length-1];
      if(!last||last.date!==td)p.prices[c].push({value:val,date:td});
      else last.value=val;
    }
  }
  save(); closeModal(); renderDashboard(); renderCatalog(); renderValuta();
}

// ── VINTED FEES ───────────────────────────────────────────────────────────────
// Tariffe spedizione Vinted per dimensione prodotto (stime medie carrier integrati)
// Tariffe spedizione Vinted Italia (aggiornate, fonte: Vinted + BRT/InPost 2024-2025)
// Vinted Go integrato: S ≤500g=€2.99, M ≤1kg=€3.49, L ≤2kg=€4.49
// Oltre 2kg → spedizione personalizzata (BRT/GLS/Poste): ~€7-13 in base al peso
// Le console home vengono quasi sempre spedite senza scatola originale,
// quindi si considera solo il peso della console nuda + bubble wrap minimo.
const SHIPPING_SIZES = {
  // Controller, giochi, accessori piccoli (~200-500g) → pacco S Vinted
  accessorio: { label: 'Pacco S (≤500g)',   ship: 2.99 },
  gioco:      { label: 'Pacco S (≤500g)',   ship: 2.99 },
  cpu:        { label: 'Pacco S (≤500g)',   ship: 2.99 },
  // GPU (~800g-1.4kg), smartphone (~200g+imballo), PSP/GBA → pacco M
  gpu:        { label: 'Pacco M (≤1kg)',    ship: 3.49 },
  smartphone: { label: 'Pacco M (≤1kg)',    ship: 3.49 },
  // Laptop/console portatili (~2kg con imballo) → pacco L Vinted (limite 2kg)
  portatile:  { label: 'Pacco L (≤2kg)',    ship: 4.49 },
  // Console home: peso reale senza scatola originale:
  //   GBA/PSP/DS/Vita ~200-300g → categoria portatile
  //   Switch nuda ~300g, con dock ~600g → pacco M/L
  //   PS4 Slim ~2.1kg, Switch OLED ~420g, Wii ~1.3kg → personalizzata ~€7.99
  //   PS3 Fat ~3.5kg, Xbox 360 ~3.2kg → personalizzata pesante ~€9.99
  //   La categoria 'console' è usata per console home medie (PS4/Switch/Wii)
  console:    { label: 'Personalizzata (>2kg)', ship: 7.99 },
};

// Peso stimato console naked (senza scatola) per nota informativa
const CONSOLE_WEIGHTS = {
  'Game Boy': 90, 'Game Boy Pocket': 70, 'Game Boy Color': 80,
  'Game Boy Advance': 95, 'Game Boy Advance SP': 143,
  'Nintendo DS': 275, 'Nintendo DS Lite': 218, 'Nintendo DSi': 214,
  'Nintendo 3DS': 235, 'Nintendo 2DS': 260, 'New 3DS XL': 329,
  'PSP': 189, 'PS Vita': 260,
  'Switch Lite': 275, 'Nintendo Switch': 297,
  'Switch OLED': 420,
  'Wii': 1200, 'Wii Mini': 1000, 'Wii U': 1600,
  'NES': 1400, 'SNES': 700, 'GameCube': 1500,
  'PS1': 900, 'PSone': 450, 'PS2 Fat': 2400, 'PS2 Slim': 900,
  'PS3 Fat': 3500, 'PS3 Slim': 2100, 'PS3 Super Slim': 2100,
  'PS4': 2800, 'PS4 Slim': 2100, 'PS4 Pro': 3300,
  'Xbox 360': 3200, 'Xbox 360 Slim': 2900, 'Xbox One': 3200, 'Xbox One S': 2900, 'Xbox One X': 3810,
};

// Ritorna la fascia spedizione corretta per una console specifica
function shippingForProduct(p) {
  if (p.category !== 'console' && p.category !== 'portatile') {
    return SHIPPING_SIZES[p.category] || SHIPPING_SIZES.accessorio;
  }
  // Cerca peso per nome (match parziale)
  const name = p.name.toLowerCase();
  let weightG = null;
  for (const [key, w] of Object.entries(CONSOLE_WEIGHTS)) {
    if (name.includes(key.toLowerCase())) { weightG = w; break; }
  }
  // Fallback: portatile 400g, console home 2200g
  if (weightG === null) weightG = p.category === 'portatile' ? 400 : 2200;
  // +400g imballo (bubble wrap + scatola)
  const totalG = weightG + 400;
  if (totalG <= 500)  return { label: `Pacco S (${Math.round(totalG/100)*100}g stimati)`, ship: 2.99 };
  if (totalG <= 1000) return { label: `Pacco M (${Math.round(totalG/100)*100}g stimati)`, ship: 3.49 };
  if (totalG <= 2000) return { label: `Pacco L (${Math.round(totalG/100)*100}g stimati)`, ship: 4.49 };
  if (totalG <= 3000) return { label: `Personalizzata (~${Math.round(totalG/1000*10)/10}kg)`, ship: 7.99 };
  return { label: `Personalizzata (~${Math.round(totalG/1000*10)/10}kg)`, ship: 9.99 };
}
// Protezione acquisti Vinted: 5% del prezzo + €0.70, min €0.70
function vintedBuyerProtection(price) { return Math.max(0.70, price * 0.05 + 0.70); }
function vintedTotalCostBuyer(price, p) {
  const shipInfo = shippingForProduct(p);
  const prot = vintedBuyerProtection(price);
  return { ship: shipInfo.ship, shipLabel: shipInfo.label, prot, total: price + shipInfo.ship + prot };
}

// ── LIQUIDITY SCORE ───────────────────────────────────────────────────────────
// Segnale corretto (Jankowitsch et al., ricerca C2C price dispersion):
// mercati liquidi = prezzi STABILI nel tempo per ciascuna condizione (bassa varianza).
// Alta varianza storica = incertezza/asimmetria informativa = illiquidità.
// Misuriamo il coefficiente di variazione (CV = σ/μ) per ogni condizione con ≥2 osservazioni.

function priceStabilityAnalysis(p) {
  const cvs = [];

  for (const c of CONDS) {
    const hist = p.prices?.[c] || [];
    if (hist.length < 2) continue;
    const vals = hist.map(e => e.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (mean === 0) continue;
    const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
    const cv = Math.sqrt(variance) / mean; // 0 = stabile, 1 = molto volatile
    cvs.push(cv);
  }

  if (cvs.length === 0) return { score: 0, detail: 'storico insufficiente', avgCvPct: null, condCount: 0 };

  const avgCv = cvs.reduce((a, b) => a + b, 0) / cvs.length;
  const avgCvPct = Math.round(avgCv * 100);

  // CV basso = consensus di mercato = alta liquidità
  // CV alto = incertezza/asimmetria informativa = bassa liquidità
  // Soglie calibrate su mercato secondhand electronics:
  // <5%  → consensus forte, prezzi stabili   → +15 pt
  // 5-12% → buona stabilità                  → +8 pt
  // 12-20% → volatilità moderata             → 0 pt
  // 20-35% → alta incertezza                 → -8 pt
  // >35%  → mercato caotico                  → -15 pt
  let score;
  if (avgCv < 0.05)       score = 15;
  else if (avgCv < 0.12)  score = 8;
  else if (avgCv < 0.20)  score = 0;
  else if (avgCv < 0.35)  score = -8;
  else                    score = -15;

  let detail;
  if (avgCv < 0.05)       detail = 'prezzi stabili';
  else if (avgCv < 0.12)  detail = 'buona stabilità';
  else if (avgCv < 0.20)  detail = 'volatilità moderata';
  else if (avgCv < 0.35)  detail = 'alta incertezza';
  else                    detail = 'prezzi molto volatili';

  return { score, detail, avgCvPct, condCount: cvs.length };
}

function liquidityScore(p) {
  const value = Math.max(0, Math.min(100, p.liquidityBase ?? 50));
  return { value, stability: { detail: null, avgCvPct: null } };
}

function liquidityLabel(score) {
  if(score>=75) return {label:'Alta',color:'var(--green)'};
  if(score>=50) return {label:'Media',color:'var(--amber)'};
  if(score>=25) return {label:'Bassa',color:'var(--red)'};
  return {label:'Molto bassa',color:'#ef4444'};
}

// ── BID-ASK SPREAD ────────────────────────────────────────────────────────────
// Stima spread: differenza % tra prezzo di acquisto realistico (domanda) e rivendita (offerta)
// Basata su volatilità storica e categoria
function estimateSpread(p, cond) {
  // Spread base per categoria
  const catSpread = { gioco:8, smartphone:12, accessorio:10, console:15, gpu:18, cpu:14, portatile:20 };
  let spread = catSpread[p.category] || 15;

  // Se abbiamo dati storici per la condizione, calcola volatilità reale
  const hist = p.prices?.[cond] || [];
  if(hist.length>=3) {
    const vals = hist.map(e=>e.value);
    const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
    const variance = vals.reduce((a,v)=>a+(v-mean)**2,0)/vals.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev/mean)*100;
    spread = Math.max(5, Math.min(40, Math.round(cv*1.5)));
  }

  // Correttivo liquidità (market microstructure: spread ∝ 1/liquidità)
  // liquidityBase 100 → fattore 0.75 (spread -25%)
  // liquidityBase 50  → fattore 1.00 (neutro)
  // liquidityBase 0   → fattore 1.25 (spread +25%)
  const liq = p.liquidityBase ?? 50;
  const liquidityFactor = 1 + (50 - liq) / 200;
  spread = Math.max(3, Math.min(50, Math.round(spread * liquidityFactor)));

  return spread; // %
}

// ── VALUTA AFFARE ─────────────────────────────────────────────────────────────
// Searchable product select state
let valutaSelectedId = '';

function renderValuta() {
  // Re-build the hidden select for compatibility, but render custom UI
  const sel = document.getElementById('val-product'); if(!sel) return;
  const old = valutaSelectedId;
  sel.innerHTML = '<option value="">— seleziona —</option>' +
    db.products.map(p=>`<option value="${p.id}" ${p.id===old?'selected':''}>${p.name}</option>`).join('');
  if(old) sel.value = old;

  // Build searchable widget if not yet present
  if(!document.getElementById('val-product-search-wrap')) {
    buildSearchableProductSelect();
  } else {
    refreshSearchableOptions('');
  }
  updateValuta();
}

function buildSearchableProductSelect() {
  const orig = document.getElementById('val-product');
  if(!orig) return;
  orig.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.id = 'val-product-search-wrap';
  wrap.style.cssText = 'position:relative;';

  wrap.innerHTML = `
    <div id="val-search-input-wrap" style="position:relative;">
      <i class="bi bi-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:13px;pointer-events:none;"></i>
      <input type="text" id="val-search-input" class="form-input" placeholder="Cerca prodotto..." autocomplete="off"
        style="padding-left:34px;"
        oninput="refreshSearchableOptions(this.value)"
        onfocus="document.getElementById('val-dropdown').style.display='block'"
        onblur="setTimeout(()=>document.getElementById('val-dropdown').style.display='none',160)"
      >
    </div>
    <div id="val-dropdown" style="display:none;position:absolute;z-index:200;left:0;right:0;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border1);border-radius:var(--radius-sm);max-height:220px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.35);">
      <div id="val-dropdown-list"></div>
    </div>
  `;
  orig.parentNode.insertBefore(wrap, orig.nextSibling);
  refreshSearchableOptions('');
}

function refreshSearchableOptions(q) {
  const list = document.getElementById('val-dropdown-list'); if(!list) return;
  const filter = q.toLowerCase();
  const matches = db.products.filter(p => !filter || p.name.toLowerCase().includes(filter) || (p.desc||'').toLowerCase().includes(filter));
  if(!matches.length) {
    list.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text3);">Nessun prodotto trovato</div>';
    return;
  }
  list.innerHTML = matches.map(p => {
    const sel = p.id === valutaSelectedId;
    return `<div class="val-dropdown-item${sel?' selected':''}" onmousedown="selectValProduct('${p.id}','${p.name.replace(/'/g,"&#39;")}')"
      style="padding:10px 14px;cursor:pointer;font-size:13.5px;color:${sel?'var(--accent)':'var(--text1)'};background:${sel?'var(--accent-dim)':'transparent'};display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);">
      <i class="bi ${catIcon(p.category)}" style="color:var(--text3);font-size:12px;flex-shrink:0;"></i>
      ${p.name}
    </div>`;
  }).join('');
}

function selectValProduct(id, name) {
  valutaSelectedId = id;
  const orig = document.getElementById('val-product');
  if(orig) orig.value = id;
  const inp = document.getElementById('val-search-input');
  if(inp) inp.value = name;
  const drop = document.getElementById('val-dropdown');
  if(drop) drop.style.display = 'none';
  updateValuta();
}

function updateValuta() {
  const pid = valutaSelectedId || document.getElementById('val-product')?.value;
  const cond = document.getElementById('val-cond')?.value;
  const price = parseFloat(document.getElementById('val-price')?.value);
  const target = document.getElementById('val-target')?.value;
  const area = document.getElementById('deal-result-area'); if(!area) return;
  if(!pid||!cond||isNaN(price)){area.innerHTML=`<div class="card" style="text-align:center;padding:40px 20px;color:var(--text3);"><i class="bi bi-calculator" style="font-size:32px;display:block;margin-bottom:12px;"></i>Seleziona un prodotto e inserisci il prezzo</div>`;return;}
  const p=db.products.find(x=>x.id===pid); if(!p) return;
  const avg=latestPrice(p,cond);
  if(!avg){area.innerHTML=`<div class="card" style="text-align:center;padding:30px;color:var(--text3);">Nessun prezzo medio per questa condizione.</div>`;return;}

  // Base deal assessment — soglie: ottimo <-25%, buon -25%/-15%, discreto -15%/0%, norma 0%/+10%, alto >+10%
  const diff=avg-price; const pct=Math.round((diff/avg)*100);
  let verdict,vClass,fillW,fillColor,suggestion;
  if(diff>avg*0.25){verdict='Ottimo affare';vClass='great';fillW=95;fillColor='var(--green)';suggestion='Il prezzo è >25% sotto la media. Raro — acquista senza esitare.';}
  else if(diff>avg*0.15){verdict='Buon affare';vClass='great';fillW=78;fillColor='var(--green)';suggestion='Il prezzo è tra il 15% e il 25% sotto la media. Vale decisamente la pena.';}
  else if(diff>0){verdict='Discreto';vClass='ok';fillW=55;fillColor='var(--amber)';suggestion='Sotto la media, ma di poco. Tratta se puoi, altrimenti va bene.';}
  else if(diff>-avg*0.1){verdict='Prezzo nella norma';vClass='ok';fillW=35;fillColor='var(--amber)';suggestion='Il prezzo è in linea con la media di mercato.';}
  else{verdict='Prezzo alto';vClass='bad';fillW=12;fillColor='var(--red)';suggestion='Prezzo sopra la media. Tratta o passa oltre.';}

  // Nota console: prezzo include cavi + controller (standard Vinted elettronica)
  const isConsole = p.category === 'console' || p.category === 'portatile';
  const consoleNoteHtml = isConsole ? `<div style="background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.18);border-radius:8px;padding:9px 13px;margin-top:10px;font-size:12px;color:var(--text3);display:flex;align-items:center;gap:7px;"><i class="bi bi-info-circle" style="color:var(--blue);flex-shrink:0;"></i> Il prezzo di riferimento assume che la console includa <strong style="color:var(--text2);">cavi (alimentazione + HDMI/AV) e almeno un controller</strong>. Senza accessori il valore cala del 15-25%.</div>` : '';

  // Vinted costs
  const fees = vintedTotalCostBuyer(price, p);
  const feesHtml = `<div style="background:var(--surface2);border-radius:8px;padding:14px 16px;margin-top:14px;">
    <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:0.05em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i class="bi bi-receipt" style="color:var(--accent);"></i> Costi Vinted (acquirente)</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:var(--text2);">Prezzo oggetto</span><span style="font-weight:600;">€${price.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:var(--text2);">Spedizione <span style="color:var(--text3);font-size:11px;">(${fees.shipLabel})</span></span><span style="font-weight:600;">€${fees.ship.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:var(--text2);">Protezione acquisti Vinted</span><span style="font-weight:600;">€${fees.prot.toFixed(2)}</span></div>
      <div style="border-top:1px solid var(--border);padding-top:8px;display:flex;justify-content:space-between;"><span style="font-size:12px;color:var(--text2);font-weight:600;">Totale pagato</span><span style="font-size:17px;font-weight:700;color:var(--accent);">€${fees.total.toFixed(2)}</span></div>
    </div>
  </div>`;

  // Spread bid-ask
  const spreadPct = estimateSpread(p, cond);
  const spreadAbs = Math.round(avg * spreadPct / 100);
  const bid = Math.round(avg * (1 - spreadPct/200));
  const ask = Math.round(avg * (1 + spreadPct/200));
  const spreadColor = spreadPct<=10?'var(--green)':spreadPct<=20?'var(--amber)':'var(--red)';
  const spreadHtml = `<div style="background:var(--surface2);border-radius:8px;padding:14px 16px;margin-top:14px;">
    <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:0.05em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i class="bi bi-arrows-expand" style="color:${spreadColor};"></i> Spread bid-ask stimato</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin-bottom:10px;">
      <div style="background:var(--bg1);border-radius:6px;padding:8px;"><div style="font-size:10px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Bid</div><div style="font-size:16px;font-weight:700;color:var(--green);">€${bid}</div><div style="font-size:10px;color:var(--text3);">acquisto</div></div>
      <div style="background:var(--bg1);border-radius:6px;padding:8px;"><div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Spread</div><div style="font-size:16px;font-weight:700;color:${spreadColor};">${spreadPct}%</div><div style="font-size:10px;color:var(--text3);">~€${spreadAbs}</div></div>
      <div style="background:var(--bg1);border-radius:6px;padding:8px;"><div style="font-size:10px;color:var(--red);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Ask</div><div style="font-size:16px;font-weight:700;color:var(--red);">€${ask}</div><div style="font-size:10px;color:var(--text3);">rivendita</div></div>
    </div>
    <div style="font-size:11.5px;color:var(--text3);">Spread ${spreadPct<=10?'stretto — mercato liquido':spreadPct<=20?'medio — negoziazione consigliata':'ampio — mercato volatile, tratta il prezzo'}.</div>
  </div>`;

  // Margin block
  const tCond=target==='same'?cond:target; const tPrice=latestPrice(p,tCond);
  let marginHtml='';
  if(tPrice&&tCond!==cond){
    const margin=tPrice-price;
    const marginNet=margin-fees.ship-fees.prot;
    const mColor=margin>0?'var(--green)':'var(--red)';
    const mnColor=marginNet>0?'var(--green)':'var(--red)';
    marginHtml=`<div style="background:var(--surface2);border-radius:8px;padding:14px 16px;margin-top:14px;">
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:0.05em;margin-bottom:8px;">Margine potenziale</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--text2)">Compri (${COND_LABELS[cond]})</span><span style="font-weight:600;">€${Math.round(price)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="color:var(--text2)">Rivendi (${COND_LABELS[tCond]})</span><span style="font-weight:600;">~€${Math.round(tPrice)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);"><span style="color:var(--text2)">Margine lordo</span><span style="font-weight:600;color:${mColor};">${margin>0?'+':''}€${Math.round(margin)}</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="font-size:12px;color:var(--text2);">Netto (al netto spedizione+protezione)</span><span style="font-size:18px;font-weight:700;color:${mnColor};">${marginNet>0?'+':''}€${Math.round(marginNet)}</span></div>
    </div>`;
  }

  let diffHtml='';
  if(p.difficulty==='Difficile'||p.difficulty==='Specialistica')diffHtml=`<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px 14px;margin-top:12px;font-size:12.5px;color:var(--amber);"><i class="bi bi-wrench"></i> Riparazione ${p.difficulty} — considera i costi nel margine.</div>`;

  // Stima danno specifico per condizione
  const damageEstimates = {
    da_riparare: [
      'Schermo rotto o malfunzionante',
      'Problema di alimentazione / non si accende',
      'Lettore ottico difettoso o assente',
      'Joystick con drift o tasti non funzionanti',
      'Porta HDMI / USB danneggiata',
    ],
    buone: [
      'Graffi superficiali sulla scocca',
      'Griglia ventola sporca / polvere interna',
      'Pasta termica da riapplicare',
      'Tasti con gioco o piccola usura',
    ],
    ottime: [
      'Graffi minimi, visibili solo da vicino',
      'Piccole impronte o aloni sullo schermo',
    ],
    come_nuovo: [],
  };
  const damages = damageEstimates[cond] || [];
  const damageHtml = damages.length ? `<div style="background:var(--surface2);border-radius:8px;padding:14px 16px;margin-top:14px;">
    <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;letter-spacing:0.05em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i class="bi bi-exclamation-triangle" style="color:var(--amber);"></i> Difetti tipici — ${COND_LABELS[cond]}</div>
    <ul style="margin:0;padding-left:16px;display:flex;flex-direction:column;gap:5px;">
      ${damages.map(d=>`<li style="font-size:12.5px;color:var(--text2);">${d}</li>`).join('')}
    </ul>
    <div style="font-size:11px;color:var(--text3);margin-top:8px;">Verifica questi punti prima di acquistare. Chiedi foto specifiche al venditore.</div>
  </div>` : '';

  area.innerHTML=`<div class="deal-result">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px;flex-wrap:wrap;gap:8px;">
      <div class="verdict ${vClass}">${verdict}</div>
      <div style="text-align:right;"><div style="font-size:11px;color:var(--text3);margin-bottom:2px;">Media mercato</div><div style="font-size:16px;font-weight:700;">${formatEur(avg)}</div></div>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:10px;">${suggestion}</div>
    <div class="deal-meter"><div class="deal-meter-fill" style="width:${fillW}%;background:${fillColor};"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);"><span>Caro</span><span>In linea</span><span>Affare</span></div>
    <div style="margin-top:14px;display:flex;gap:16px;flex-wrap:wrap;">
      <div><div style="font-size:11px;color:var(--text3);">Prezzo visto</div><div style="font-size:20px;font-weight:700;">€${Math.round(price)}</div></div>
      <div><div style="font-size:11px;color:var(--text3);">Differenza</div><div style="font-size:20px;font-weight:700;color:${diff>0?'var(--green)':'var(--red)'};">${diff>0?'+':''}€${Math.round(diff)} (${pct>0?'+':''}${pct}%)</div></div>
    </div>
    ${consoleNoteHtml}
    ${feesHtml}
    ${spreadHtml}
    ${damageHtml}
    ${marginHtml}
    ${diffHtml}
  </div>`;
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function saveSettings() {
  db.settings.warnDays=parseInt(document.getElementById('thresh-warning').value)||30;
  db.settings.critDays=parseInt(document.getElementById('thresh-critical').value)||60;
  save(); alert('Impostazioni salvate.');
}
function exportData() {
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dealradar-backup-'+today()+'.json';a.click();
}

// ── IMPORT WITH MERGE (punto 1) ───────────────────────────────────────────────
function importData(e) {
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=async ev=>{
    try {
      const incoming=JSON.parse(ev.target.result);
      if(!incoming.products){alert('File non valido.');return;}
      let added=0,merged=0,skipped=0;
      for(const np of incoming.products){
        const existing=db.products.find(x=>x.name.toLowerCase()===np.name.toLowerCase());
        if(!existing){db.products.push({...np,id:uid()});added++;}
        else {
          const action=await showMergeDialog(np.name);
          if(action==='merge'){
            for(const c of CONDS){
              if(!np.prices?.[c]?.length) continue;
              if(!existing.prices[c])existing.prices[c]=[];
              for(const entry of np.prices[c]){if(!existing.prices[c].some(e=>e.date===entry.date))existing.prices[c].push(entry);}
              existing.prices[c].sort((a,b)=>a.date.localeCompare(b.date));
            }
            if(np.repairNotes&&!existing.repairNotes)existing.repairNotes=np.repairNotes;
            if(np.difficulty&&!existing.difficulty)existing.difficulty=np.difficulty;
            if(np.quickFixes?.length&&!existing.quickFixes?.length)existing.quickFixes=np.quickFixes;
            if(np.breadcrumb?.length&&!existing.breadcrumb?.length)existing.breadcrumb=np.breadcrumb;
            if(np.ifixitUrl&&!existing.ifixitUrl)existing.ifixitUrl=np.ifixitUrl;
            if(np.cfw&&!existing.cfw)existing.cfw=np.cfw;
            if(np.storage&&!existing.storage)existing.storage=np.storage;
            merged++;
          } else if(action==='replace'){
            const idx=db.products.indexOf(existing);db.products[idx]={...np,id:existing.id};merged++;
          } else {skipped++;}
        }
      }
      save();load();renderDashboard();renderCatalog();renderValuta();
      alert(`Import completato:\n✅ ${added} nuovi\n🔀 ${merged} aggiornati\n⏭ ${skipped} saltati`);
    } catch(err){alert('Errore nel file: '+err.message);}
  };
  r.readAsText(f); e.target.value='';
}

function showMergeDialog(name) {
  return new Promise(resolve=>{
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML=`<div style="background:var(--surface);border:1px solid var(--border1);border-radius:var(--radius);padding:24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <div style="font-size:15px;font-weight:600;margin-bottom:6px;color:var(--text1);">Prodotto già esistente</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:20px;"><strong>"${name}"</strong> esiste già nel database.</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="_mg_merge" class="btn btn-ghost" style="justify-content:flex-start;text-align:left;"><i class="bi bi-git" style="margin-right:8px;"></i><strong>Unisci prezzi</strong><span style="font-weight:400;color:var(--text3);margin-left:6px;">— aggiunge solo le date nuove</span></button>
        <button id="_mg_replace" class="btn btn-ghost" style="justify-content:flex-start;text-align:left;"><i class="bi bi-arrow-repeat" style="margin-right:8px;"></i><strong>Sostituisci</strong><span style="font-weight:400;color:var(--text3);margin-left:6px;">— sovrascrive con i dati importati</span></button>
        <button id="_mg_skip" class="btn btn-ghost" style="justify-content:flex-start;text-align:left;color:var(--text3);"><i class="bi bi-skip-forward" style="margin-right:8px;"></i>Salta questo prodotto</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const pick=action=>{overlay.remove();resolve(action);};
    overlay.querySelector('#_mg_merge').onclick=()=>pick('merge');
    overlay.querySelector('#_mg_replace').onclick=()=>pick('replace');
    overlay.querySelector('#_mg_skip').onclick=()=>pick('skip');
  });
}

function clearAllData() {
  if(confirm('Sei sicuro? Tutti i dati verranno eliminati definitivamente.')){
    db={products:[],settings:{warnDays:30,critDays:60,theme:db.settings?.theme||'dark'}};
    save();renderDashboard();renderCatalog();renderValuta();alert('Dati eliminati.');
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
load();
renderDashboard();
