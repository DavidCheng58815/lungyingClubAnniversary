# 龍穎部落座位查詢網站

可直接放到 GitHub Pages 的靜態網站版本。

## 檔案結構
- index.html：主網頁
- style.css：版面與魔獸部落風格樣式
- script.js：桌號點擊、搜尋、顯示名冊功能
- data.js：由 Excel 轉出的座位資料
- assets/background.png：空背景圖
- assets/main-table.png：主桌圖示
- assets/normal-table.png：一般桌圖示

## 上傳 GitHub Pages
將本資料夾所有檔案上傳到同一個 repository 根目錄，開啟 Pages 後即可使用。

## 調整桌子位置
打開 data.js，搜尋每桌的 x、y 數值。x/y 是相對背景圖的百分比位置。
