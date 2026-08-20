# SplitMe 🍲 視覺化極速分帳與多人即時協作工具

<p align="center">
  <img src="client/public/favicon.svg" alt="SplitMe Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>聚會無痛分帳 • 直覺拖拉分配 • 免註冊即時協作 • 貪婪最簡轉帳 • LINE 懶人包與收據長圖</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Kotlin-2.4.10-blue.svg?logo=kotlin" alt="Kotlin" />
  <img src="https://img.shields.io/badge/Ktor-3.5.2-orange.svg?logo=ktor" alt="Ktor" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.4-646CFF.svg?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.3-38B2AC.svg?logo=tailwindcss" alt="TailwindCSS v4" />
  <img src="https://img.shields.io/badge/PWA-Ready-success.svg?logo=pwa" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Database-SQLite%20%2B%20Exposed-green.svg?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
</p>

---

## 📖 專案簡介 (Introduction)

**SplitMe** 是一套專為朋友聚會、團隊聚餐與出遊合帳設計的現代化分帳 Web 應用。解決傳統記帳軟體「主揪一人手動算到瘋掉」或「朋友反覆確認誰付了什麼」的痛點。

SplitMe 提供**主揪端視覺化拖拉分帳**與**朋友端免註冊即時勾選**雙模式，結合**最小現金流（Greedy Min-Cash-Flow）多角債務精簡演算法**，一鍵產出**高質感結算收據長圖**、**銀行與 QR Code 收款資訊**與 **LINE 純文字排版懶人包**；並具備 **PWA 離線快取**，即使在地下室餐廳無網路環境下亦能流暢速算！

---

## ✨ 核心特色 (Key Features)

### 1. 🎨 視覺化拖拉與 1 鍵分帳 (Touch & Drag Splitting)
- **彩色頭像徽章列**：支援隨機色票生成、暱稱快速編輯與在線狀態即時標記。
- **拖拉分配互動**：主揪可直接拖曳成員頭像至餐點卡片完成分攤，亦支援點選與「全員分攤 / 清空」快捷鍵。
- **多代付人支援**：彈性指定單一品項之墊付成員。

### 2. ⚖️ 靈活權重倍率與自訂指定金額 (Weighted & Custom Shares)
- 支援份數倍率設定（如：大胃王吃 2 份、小鳥胃 0.5 份）。
- 支援指定固定金額（如：某成員單點專屬特調 $180）。

### 3. 💰 服務費與折扣攤提計算 (Fees & Discounts)
- **10% 服務費**：支援依每人消費金額比例精準攤提（Proportional Subtotal）。
- **折價券 / 附加費**：支援全員平分（Equal Members）或指定成員平分（Selected Members）。
- **多元捨入模式**：支援「四捨五入（整數）」、「無條件進位（Round Up）」、「無條件捨去（Round Down）」與「小數點兩位」，並自動調差平衝。

### 4. ⚡ 貪婪最簡轉帳演算法 (Debt Simplification Engine)
- 透過貪婪演算法將複雜的多角跨成員借貸精簡至**理論最少轉帳筆數**，例如 5 人互欠僅需 2~3 筆轉帳即可完全結清。

### 5. 👥 多人即時協作與結算鎖定 (Live WebSocket Collaboration)
- **免註冊即時同步**：產出 6 位房間短碼與 QR Code，朋友手機掃描即可進入專屬「朋友視圖」。
- **朋友勾選視圖**：僅需選取自己是誰，即可直覺勾選自己吃過的品項，主揪端即時看見勾選進度與在線狀態。
- **一鍵鎖定結算**：主揪鎖定後即時凍結所有協作者編輯權限，避免重複修改。

### 6. 🧾 高質感結算收據長圖與 QR 嵌入 (Receipt Card & Image Export)
- 整合 `html-to-image` 渲染高解析度結算收據 PNG 卡片，包含聚會主題、消費清單、各成員應付/應收明細與最簡轉帳指南。
- **收款資訊整合**：提供台灣常見銀行代碼快速選單（中國信託、國泰世華、玉山等）與帳號填寫，並支援上傳 LINE Pay / 街口 / 自訂收款 QR Code 圖檔嵌入收據。

### 7. 💬 LINE 友善純文字懶人包 (LINE Text Generator)
- 一鍵產生符合 LINE 閱讀排版的純文字明細（含轉帳指引、銀行帳號與備註），支援一鍵複製剪貼簿或直接喚起 Web Share API / LINE 聊天室。

### 8. 📱 PWA 離線支援與安裝 (PWA & Offline Service Worker)
- 完整的 Web App Manifest 與 Workbox 離線快取策略，支援安裝至 iOS / Android 主畫面或桌面獨立視窗運行。
- 後端離線或無網路時，自動降級為「本機速算模式」，所有計算與收據產出 100% 於瀏覽器端正常運作。

---

## 🏗️ 系統架構 (Architecture)

本專案採用現代化 **Kotlin Gradle Monorepo** 架構，前端由 Vite React 驅動，後端由 Ktor Netty 與 Exposed ORM 驅動，並支援打包為單一全端 Fat JAR。

```mermaid
flowchart TB
    subgraph Client["前端 Client (PWA / React 19 + TypeScript)"]
        UI["Tailwind CSS v4 響應式介面"]
        CoreEngine["前端財務與債務精簡引擎"]
        SyncHook["useRoomSync (WebSocket Hook)"]
        SW["Workbox Service Worker (離線快取)"]
    end

    subgraph Server["後端 Server (Kotlin Ktor 3.5 + Netty)"]
        Router["Ktor Routing & ContentNegotiation"]
        WSPool["RoomConnectionPool (WebSocket 連線池)"]
        Repo["SqliteRoomRepository (Exposed ORM)"]
        CleanupJob["7-day Auto-cleanup Scheduler"]
        StaticResource["Static Content Plugin (Client Dist)"]
    end

    subgraph Storage["資料儲存層"]
        SQLite[(SQLite Database)]
        LocalStorage[(Browser LocalStorage)]
    end

    UI --> CoreEngine
    UI --> SyncHook
    SyncHook <-->|WebSocket /ws/rooms/{id}| WSPool
    UI <-->|REST API /api/rooms| Router
    Router --> Repo
    WSPool --> Repo
    Repo --> SQLite
    UI <--> LocalStorage
    SW -.->|離線靜態資源提供| UI
```

---

## 📂 專案目錄結構 (Monorepo Layout)

```
SplitMe/
├── build.gradle.kts          # Root Gradle 構建腳本 (串接前端 build 與後端資源複製)
├── settings.gradle.kts       # Gradle 專案模組設定
├── server/                   # 後端 Ktor 應用模組
│   ├── build.gradle.kts      # Ktor, Exposed, SQLite 依賴與靜態資源打包任務
│   └── src/
│       ├── main/kotlin/com/splitme/
│       │   ├── Application.kt            # Ktor 應用入口點
│       │   ├── core/                     # 核心財務與債務精簡演算法 (Kotlin 實作)
│       │   ├── db/                       # SQLite 連線池與 Exposed Tables 定義
│       │   ├── model/                    # 共用資料模型與 WS 事件定義
│       │   ├── plugins/                  # Ktor 外掛 (CORS, WS, Routing, StatusPages)
│       │   ├── repository/               # 房間資料庫存取層 (RoomRepository)
│       │   ├── routes/                   # REST API 與 WebSocket 路由處理
│       │   ├── service/                  # 7 天房間定期自動清理排程服務
│       │   └── websocket/                # 多人連線池與廣播管理 (RoomConnectionPool)
│       └── test/kotlin/com/splitme/      # 後端單元與整合測試套件 (Ktor Test Host)
└── client/                   # 前端 React 19 應用模組
    ├── index.html            # Web App HTML 入口與 PWA Metadata
    ├── package.json          # 前端依賴設定
    ├── vite.config.ts        # Vite 6 + Tailwind CSS v4 + VitePWA 設定
    ├── public/               # PWA 圖示與 Manifest 資源 (SVG/PNG)
    └── src/
        ├── App.tsx           # 主揪/朋友雙視圖主工作區
        ├── components/       # UI 元件 (MemberBar, ItemList, SettlementDashboard, ReceiptCard 等)
        ├── core/             # 前端核心財務計算與最簡轉帳演算法 (TypeScript 實作)
        ├── hooks/            # 自訂 Hook (useRoomState, useRoomSync)
        ├── types/            # TypeScript 介面模型
        ├── utils/            # 色票、格式化與 LINE 文字產生器
        └── __tests__/        # 前端單元與全端整合測試套件 (Vitest)
```

---

## 🚀 快速上手 (Quick Start)

### 環境要求 (Prerequisites)
- **Java Development Kit (JDK)**: 21 或更高版本
- **Node.js**: 20.x 或更高版本 (`npm 10+`)
- **Git**

### 1. 複製專案
```bash
git clone https://github.com/0oWoodenDooro0/SplitMe.git
cd SplitMe
```

### 2. 開發模式啟動 (Development Mode)

#### 啟動後端 API & WebSocket 伺服器 (Port: 8080)
```bash
./gradlew :server:run
```

#### 啟動前端開發伺服器 (Port: 5173，具備 API 反向代理)
```bash
cd client
npm install
npm run dev
```
瀏覽器開啟 `http://localhost:5173` 即可開始使用！

---

## 🛠️ 生產建置與部署 (Production Build)

本專案支援一鍵自動化建置：Gradle 會自動執行前端 TypeScript 型別檢查、Vite 生產打包、產生 PWA Service Worker，並將 `client/dist` 嵌入至後端 JAR 靜態資源中。

```bash
# 於專案根目錄執行全端建置
./gradlew build
```

#### 執行全端單一 Fat JAR
```bash
java -jar server/build/libs/server-all.jar
```
伺服器將在 `http://localhost:8080` 提供完整 Web 服務（含前端 SPA、PWA 離線快取、REST API 與 WebSocket）。

---

## 🧮 核心演算法：貪婪最小現金流 (Debt Simplification)

在多人聚會中，每位成員各自墊付了不同的品項，若每對欠款人都進行轉帳，將產生大量瑣碎交易（最多高達 \(O(N^2)\) 筆）。

SplitMe 實作**貪婪最小現金流演算法（Greedy Min-Cash-Flow Algorithm）**：
1. **淨額計算 (Net Balance)**：計算每位成員的總代付金額減去應分攤金額，得出淨債權人（Net Balance > 0）與淨債務人（Net Balance < 0）。
2. **極值匹配 (Greedy Matching)**：每一輪找出「最大淨債務人」與「最大淨債權人」，建立一筆轉帳：
   $$\text{Transfer Amount} = \min(|\text{Max Debt}|, \text{Max Credit})$$
3. **消除更新**：更新雙方的淨額，若淨額歸零則自隊列中移除，重複直到所有人餘額歸零。
4. **複雜度**：最差僅需 \(N - 1\) 筆轉帳即可結清所有債務。

---

## 📡 REST API & WebSocket 協定參考

### REST API
| 方法 | 端點 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/api/health` | 伺服器健康狀態檢查 |
| `POST` | `/api/rooms` | 建立新分帳房間（產出 UUID 與 6 位短碼） |
| `GET` | `/api/rooms/{id}` | 取得指定房間完整狀態快照 |
| `POST` | `/api/rooms/{id}/lock` | 主揪切換房間結算鎖定狀態 |

### WebSocket 協定 (`/ws/rooms/{id}`)
- **客戶端發送 (Client -> Server)**:
  - `JOIN_ROOM`: `{ "type": "JOIN_ROOM", "memberId": "...", "memberName": "..." }`
  - `TOGGLE_ITEM_CHECK`: `{ "type": "TOGGLE_ITEM_CHECK", "itemId": "...", "memberId": "...", "isChecked": true }`
  - `LOCK_SETTLEMENT`: `{ "type": "LOCK_SETTLEMENT", "isLocked": true }`
  - `UPDATE_ROOM`: `{ "type": "UPDATE_ROOM", "room": { ... } }`
- **伺服器廣播 (Server -> Client)**:
  - `SYNC_STATE`: 廣播當前房間完整狀態與在線成員清單。
  - `ITEM_CHECK_TOGGLED`: 廣播成員勾選品項異動。
  - `SETTLEMENT_LOCKED`: 廣播鎖定結算狀態。
  - `MEMBER_JOINED`: 廣播成員在線狀態更新。

---

## 🧪 測試與品質驗證 (Testing)

本專案遵循嚴格的 **測試驅動開發 (TDD)** 流程，涵蓋前後端核心演算法、元件互動、WebSocket 協作與端到端離線容錯：

```bash
# 執行前端所有單元與端到端測試 (Vitest)
cd client && npm test

# 執行後端整合測試與演算法驗證 (JUnit 5 + Ktor Test Host)
./gradlew :server:test

# 執行全端完整檢查
./gradlew check test
```

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 授權開源。
