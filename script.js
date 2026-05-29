const DATA = window.SEATING_DATA || { tables: [], guests: [] };
const MAP_OFFSET_X = 0;   // 整體左右位移，負數往左、正數往右
const MAP_OFFSET_Y = -20;  // 整體上下位移，負數往上、正數往下
const TABLE_POSITIONS = {
  24: { x: 28, y: 36 },
  25: { x: 28, y: 44 },
  26: { x: 28, y: 52 },
  27: { x: 28, y: 60 },

  1:  { x: 44, y: 34 },
  19: { x: 40, y: 44 },
  20: { x: 40, y: 52 },
  21: { x: 40, y: 60 },
  22: { x: 40, y: 70 },
  28: { x: 40, y: 79 },

  2:  { x: 55, y: 34 },
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
const backToMapBtn = document.getElementById('backToMapBtn');
const tableSelect = document.getElementById('tableSelect');
const selectedTableText = document.getElementById('selectedTableText');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const tableList = document.getElementById('tableList');
const showRosterBtn = document.getElementById('showRosterBtn');
const showAllBtn = document.getElementById('showAllBtn');
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
function renderTableSelect() {
  if (!tableSelect) return;

  tableSelect.innerHTML = '<option value="">請選擇桌次</option>';

  DATA.tables
    .slice()
    .sort((a, b) => Number(a.tableNo) - Number(b.tableNo))
    .forEach(table => {
      const option = document.createElement('option');
      option.value = table.tableNo;
      option.textContent = tableLabel(table);
      tableSelect.appendChild(option);
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
  updateActiveTableCard();
  if (tableSelect) {
     tableSelect.value = String(tableNo);
}

  if (selectedTableText) {
     selectedTableText.textContent = tableLabel(table);
}
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

function getTableByNo(tableNo) {
  return DATA.tables.find(t => Number(t.tableNo) === Number(tableNo));
}

function getFirstGuestName(table) {
  if (!table || !table.guests || table.guests.length === 0) return '尚無名單';
  return table.guests[0].name || '尚無名單';
}

function getTableMatchInfo(table, query) {
  const q = normalize(query);

  if (!q) {
    return {
      visible: true,
      countText: `${table.guests.length} 位賓客`,
      nameText: getFirstGuestName(table)
    };
  }

  const tableText = normalize([
    table.tableNo,
    table.tableName,
    tableLabel(table)
  ].join(' '));

  const matchedGuests = table.guests.filter(g => {
    const guestText = normalize([
      g.name,
      g.club,
      g.title,
      g.referrer,
      g.food,
      g.district,
      g.tableNo,
      g.tableName
    ].join(' '));

    return guestText.includes(q);
  });

  const tableMatched = tableText.includes(q);

  if (!tableMatched && matchedGuests.length === 0) {
    return {
      visible: false,
      countText: '',
      nameText: ''
    };
  }

  if (tableMatched && matchedGuests.length === 0) {
    return {
      visible: true,
      countText: `${table.guests.length} 位賓客`,
      nameText: getFirstGuestName(table)
    };
  }

  return {
    visible: true,
    countText: `${matchedGuests.length} 位符合`,
    nameText: matchedGuests.slice(0, 2).map(g => g.name).join('、')
  };
}

function renderSideTableList(query = '') {
  const q = query.trim();
  tableList.innerHTML = '';

  const matchedTables = DATA.tables
    .map(table => {
      const info = getTableMatchInfo(table, q);
      return { table, info };
    })
    .filter(item => item.info.visible)
    .sort((a, b) => Number(a.table.tableNo) - Number(b.table.tableNo));

  if (matchedTables.length === 0) {
    tableList.innerHTML = `
      <div class="empty">
        查無結果，可嘗試輸入完整姓名、扶輪社、桌名或桌號。
      </div>
    `;
    return 0;
  }

  matchedTables.forEach(({ table, info }) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'table-card';
    card.dataset.tableNo = table.tableNo;

    if (Number(activeTableNo) === Number(table.tableNo)) {
      card.classList.add('active');
    }

    card.innerHTML = `
      <div>
        <div class="table-card-title">${esc(tableLabel(table))}</div>
        <div class="table-card-meta">${esc(info.countText)}｜${esc(info.nameText)}</div>
      </div>
      <div class="table-card-arrow">›</div>
    `;

    card.addEventListener('click', () => {
      showTable(table.tableNo);
      updateActiveTableCard();
    });

    tableList.appendChild(card);
  });

  return matchedTables.length;
}

function updateActiveTableCard() {
  document.querySelectorAll('.table-card').forEach(card => {
    card.classList.toggle(
      'active',
      Number(card.dataset.tableNo) === Number(activeTableNo)
    );
  });
}

function handleSearch() {
  const keyword = searchInput.value.trim();
  const count = renderSideTableList(keyword);

  if (!keyword) {
    showWelcome();
    setActiveTable(null);
    updateActiveTableCard();
    return;
  }

  if (count === 0) {
    setActiveTable(null);
    infoPanel.innerHTML = `
      <div class="info-card">
        <h2>查無結果</h2>
        <p class="sub">查詢關鍵字：${esc(keyword)}</p>
        <div class="empty">可嘗試輸入姓名、扶輪社、桌名、推薦人或桌號。</div>
      </div>
    `;
    return;
  }

  infoPanel.innerHTML = `
    <div class="info-card">
      <h2>搜尋結果</h2>
      <p class="sub">關鍵字：${esc(keyword)}｜左側已列出符合桌次</p>
      <div class="empty">請點擊左側桌卡，即可查看該桌完整名冊與位置。</div>
    </div>
  `;
}

function showAllRoster() {
  const rows = DATA.tables
    .sort((a, b) => Number(a.tableNo) - Number(b.tableNo))
    .map(table => `
      <tr>
        <td>${esc(table.tableNo)}</td>
        <td>${esc(table.tableName || '')}</td>
        <td>${table.guests.length}</td>
        <td>
          <button class="mini-btn" onclick="showTable(${Number(table.tableNo)})">
            查看
          </button>
        </td>
      </tr>
    `).join('');

  infoPanel.innerHTML = `
    <div class="info-card">
      <h2>龍穎部落席位名冊</h2>
      <p class="sub">點擊查看可切換至該桌完整名單。</p>
      <div class="roster-scroll">
      <table class="info-table">
       <thead>
          <tr>
             <th>桌號</th>
             <th>桌名</th>
             <th>人數</th>
             <th>操作</th>
          </tr>
       </thead>
    <tbody>${rows}</tbody>
  </table>
</div>
    </div>
  `;
}

searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

showAllBtn.addEventListener('click', () => {
  searchInput.value = '';
  setActiveTable(null);
  renderSideTableList('');
  showWelcome();
});

showRosterBtn.addEventListener('click', () => {
  showAllRoster();
});


if (backToMapBtn) {
  backToMapBtn.addEventListener('click', () => {
    const target = document.getElementById('mapLayer');

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });
}
if (tableSelect) {
  tableSelect.addEventListener('change', () => {
    const tableNo = tableSelect.value;

    if (!tableNo) {
      if (selectedTableText) {
        selectedTableText.textContent = '請選擇桌次';
      }
      return;
    }

    showTable(tableNo);
  });
}

renderMap();
renderSideTableList('');
renderTableSelect();
showWelcome();
if (backToMapBtn) {
  backToMapBtn.addEventListener('click', () => {
    const target = document.getElementById('mapLayer');

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });
}

if (tableSelect) {
  tableSelect.addEventListener('change', () => {
    const tableNo = tableSelect.value;

    if (!tableNo) {
      if (selectedTableText) {
        selectedTableText.textContent = '請選擇桌次';
      }
      return;
    }

    showTable(tableNo);
  });
}