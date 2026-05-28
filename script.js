const DATA = window.SEATING_DATA || { tables: [], guests: [] };
const MAP_OFFSET_X = 0;   // 整體左右位移，負數往左、正數往右
const MAP_OFFSET_Y = -20;  // 整體上下位移，負數往上、正數往下
const TABLE_POSITIONS = {
  24: { x: 28, y: 36 },
  25: { x: 28, y: 44 },
  26: { x: 28, y: 52 },
  27: { x: 28, y: 60 },

  1:  { x: 44, y: 28 },
  19: { x: 40, y: 44 },
  20: { x: 40, y: 52 },
  21: { x: 40, y: 60 },
  22: { x: 40, y: 70 },
  28: { x: 40, y: 79 },

  2:  { x: 56, y: 28 },
  14: { x: 52, y: 44 },
  15: { x: 52, y: 52 },
  16: { x: 52, y: 60 },
  17: { x: 52, y: 70 },
  23: { x: 52, y: 79 },

  8:  { x: 66, y: 36 },
  9:  { x: 66, y: 44 },
  10: { x: 66, y: 52 },
  11: { x: 66, y: 60 },
  12: { x: 66, y: 70 },
  18: { x: 66, y: 79 },

  3:  { x: 78, y: 36 },
  4:  { x: 78, y: 44 },
  5:  { x: 78, y: 52 },
  6:  { x: 78, y: 60 },
  7:  { x: 78, y: 70 },
  13: { x: 78, y: 79 }
};
const mapLayer = document.getElementById('mapLayer');
const infoPanel = document.getElementById('infoPanel');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
let activeTableNo = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, '');
}

function tableLabel(table) {
  const prefix = table.tableNo <= 2 ? `主桌 ${table.tableNo}` : `第 ${table.tableNo} 桌`;
  return `${prefix}｜${table.tableName || '未命名席位'}`;
}

function renderMap() {
  mapLayer.innerHTML = '';
  DATA.tables.forEach(table => {
    const btn = document.createElement('button');
    btn.className = `table-token ${table.type}`;
    const pos = TABLE_POSITIONS[Number(table.tableNo)] || { x: 50, y: 50 };
    btn.style.left = `${pos.x + MAP_OFFSET_X}%`;
    btn.style.top = `${pos.y + MAP_OFFSET_Y}%`;
    btn.dataset.tableNo = table.tableNo;
    btn.title = tableLabel(table);
    btn.innerHTML = `
      <img src="assets/${table.type === 'main' ? 'main-table.png' : 'normal-table.png'}" alt="${esc(tableLabel(table))}">
      <span class="table-number">${table.tableNo}</span>
    `;
    btn.addEventListener('click', () => showTable(table.tableNo));
    mapLayer.appendChild(btn);
  });
}

function setActiveTable(tableNo) {
  activeTableNo = tableNo;
  document.querySelectorAll('.table-token').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.tableNo) === Number(tableNo));
  });
}

function showWelcome() {
  infoPanel.innerHTML = `
    <div class="info-card">
      <h2>龍穎部落席位名冊</h2>
      <p class="sub">請點擊上方戰略座位圖的桌號，或在左側輸入姓名、扶輪社、桌名查詢席位。</p>
      <div class="empty">戰鼓已響，請尋找你的英雄席位。</div>
    </div>`;
}

function showTable(tableNo) {
  const table = DATA.tables.find(t => Number(t.tableNo) === Number(tableNo));
  if (!table) return;
  setActiveTable(tableNo);
  const rows = table.guests.map((g, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${esc(g.title)}</td>
      <td>${esc(g.name)}</td>
      <td>${esc(g.club)}</td>
      <td>${esc(g.food)}</td>
    </tr>`).join('');
  infoPanel.innerHTML = `
    <div class="info-card">
      <h2>${esc(tableLabel(table))}</h2>
      <p class="sub">本桌共 ${table.guests.length} 位｜點擊其他桌號可切換名冊</p>
      <table class="info-table">
        <thead><tr><th>序</th><th>職稱</th><th>姓名</th><th>所屬單位</th><th>飲食</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">此桌目前沒有名單資料</td></tr>'}</tbody>
      </table>
    </div>`;
}

function search() {
  const q = normalize(searchInput.value);
  if (!q) { showWelcome(); setActiveTable(null); return; }
  const matchedGuests = DATA.guests.filter(g => {
    const haystack = normalize([g.name, g.club, g.title, g.referrer, g.food, g.tableNo, g.tableName, g.district].join(' '));
    return haystack.includes(q);
  });
  const matchedTables = DATA.tables.filter(t => normalize([t.tableNo, t.tableName, tableLabel(t)].join(' ')).includes(q));
  const tableMatches = matchedTables.map(t => ({ type: 'table', table: t }));
  const guestMatches = matchedGuests.map(g => ({ type: 'guest', guest: g, table: DATA.tables.find(t => Number(t.tableNo) === Number(g.tableNo)) }));
  const combined = [...tableMatches, ...guestMatches];
  if (combined.length === 0) {
    setActiveTable(null);
    infoPanel.innerHTML = `<div class="info-card"><h2>查無結果</h2><p class="sub">查詢關鍵字：${esc(searchInput.value)}</p><div class="empty">可嘗試輸入完整姓名、扶輪社簡稱或桌號。</div></div>`;
    return;
  }
  const firstTableNo = combined[0].table?.tableNo || combined[0].guest?.tableNo;
  setActiveTable(firstTableNo);
  const items = combined.slice(0, 80).map(item => {
    if (item.type === 'table') {
      const t = item.table;
      return `<div class="result-item"><div><div class="result-title">${esc(tableLabel(t))}</div><div class="result-meta">本桌共 ${t.guests.length} 位</div></div><button class="mini-btn" onclick="showTable(${t.tableNo})">查看名冊</button></div>`;
    }
    const g = item.guest;
    const t = item.table;
    return `<div class="result-item"><div><div class="result-title">${esc(g.name)}｜${esc(tableLabel(t || { tableNo: g.tableNo, tableName: g.tableName }))}</div><div class="result-meta">${esc(g.title)}｜${esc(g.club)}｜推薦：${esc(g.referrer)}｜${esc(g.food)}</div></div><button class="mini-btn" onclick="showTable(${g.tableNo})">看位置</button></div>`;
  }).join('');
  infoPanel.innerHTML = `<div class="info-card"><h2>搜尋結果</h2><p class="sub">關鍵字：${esc(searchInput.value)}｜共 ${combined.length} 筆</p>${items}</div>`;
}

searchBtn.addEventListener('click', search);
clearBtn.addEventListener('click', () => { searchInput.value = ''; setActiveTable(null); showWelcome(); });
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

renderMap();
showWelcome();
