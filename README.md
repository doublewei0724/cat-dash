# 貓咪跑酷 Cat Dash

手機直向的無盡跑酷遊戲。點擊、觸控、Space 或 ↑ 跳躍，空中可再跳一次。跳過紙箱、水坑與掃地機器人，收集小魚乾。分數為距離整數加小魚乾數量乘十。

朋友測試網址：**https://doublewei0724.github.io/cat-dash/**

## 技術與目錄

Vite、TypeScript、Phaser、Supabase、Vitest、Playwright、PWA。`src/main.ts` 放遊戲場景，`src/art.ts` 放自繪 placeholder，`src/config.ts` 放規則，`src/storage.ts` 放本機存檔，`src/supabase.ts` 放線上服務；SQL 位於 `supabase/migrations`。

## 本機啟動

安裝 Node.js LTS 後：

```sh
npm ci
cp .env.example .env
npm run dev
```

沒有 Supabase 設定也可以離線遊玩。啟用線上功能時，將 `.env` 的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY` 換成自己的專案 URL 和 publishable/anon key，絕不要放 secret/service role key。

## Supabase 設定

已建立 `Cat Dash` 組織中的 `cat-dash` 專案（東京區域），並啟用 Anonymous Sign-Ins。專案已連結至此工作目錄，`supabase/migrations/20260922063000_initial_schema.sql` 已透過 CLI 套用。新環境可用 `npx supabase link --project-ref <project-ref>` 和 `npx supabase db push` 套用 migration。雲端 Auth 設定由 `supabase/config.toml` 管理，變更前可用 `npx supabase config diff` 預覽。

本機 `.env` 已填入專案 URL 與 publishable key，`.supabase-db-password` 存放新專案的資料庫密碼；這兩個檔案都在 `.gitignore` 內，勿提交或分享。要檢查排行榜，可用兩個不同瀏覽器視窗建立匿名玩家並完成遊戲，不要直接寫入 `player_best_scores`。

線上提交使用驗證分數公式與合理範圍的 RPC。這只是 MVP 防護；使用者仍可偽造合理的前端資料。正式營運需增加伺服器 run session、速率限制和內容審核。匿名帳號在清除瀏覽器資料後可能無法找回。

## 檢查與部署

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

### GitHub Pages 自動部署

`.github/workflows/deploy.yml` 會在每次 push 到 `main` 時執行 lint、typecheck、test、build，成功後發佈 `dist` 到 GitHub Pages。建立 GitHub repository 後，在 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。把 `.env` 中的 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY` 設為 repository Actions secrets，切勿提交 `.env` 或資料庫密碼。部署網址通常是 `https://<帳號>.github.io/<repository>/`；建置時 `VITE_BASE_PATH` 會自動對應 repository 名稱。

網站使用 HTTPS，可在手機瀏覽器加入主畫面。已安裝的 PWA 在發現新版本時會顯示「更新遊戲」按鈕；玩家點擊後重新載入新版。為免遊戲中途被重載，不會強制更新正在進行的一局。

- iPhone：以 Safari 開啟測試網址，按分享 → 加入主畫面，並選擇作為網頁 App 開啟。
- Android：以 Chrome 開啟測試網址，從選單選「安裝應用程式」或「新增至主畫面」。

無網路時仍能進入遊戲，最佳紀錄保存於本機；恢復連線後會重試最高的待提交紀錄。首頁顯示離線狀態，排行榜則提示無法載入。正式圖片可在 `src/art.ts` 的繪圖函式替換，音訊目前尚未接入，設定頁的音樂與音效開關會保存偏好。
