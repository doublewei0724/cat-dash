# 《貓咪跑酷》Phaser＋TypeScript 開發規格

> 用途：將本文件直接交給 Codex，依照規格建立可執行專案。  
> 文件版本：v1.0  
> 第一版平台：手機瀏覽器、桌面瀏覽器、PWA  
> 技術主軸：Phaser＋TypeScript＋Vite＋Supabase

---

## 0. 給 Codex 的執行指令

請依照本文件建立一個完整、可執行、可部署的《貓咪跑酷》專案。

執行原則：

1. 使用 Phaser、TypeScript、Vite 與 Supabase JavaScript Client。
2. 第一階段先使用程式繪製或自製 placeholder 素材，不要因為缺少正式美術而停止開發。
3. 不得使用有版權疑慮的角色、音樂、圖片或遊戲素材。
4. 不要在前端放入 Supabase Secret Key 或 Service Role Key。
5. 所有環境變數放入 `.env`，並建立可提交的 `.env.example`。
6. 依序完成核心玩法、本機存檔、Supabase 登入、分數提交、排行榜、PWA、測試與文件。
7. 每完成一個階段都要執行 typecheck、lint、test 與 build；若失敗，先修正再繼續。
8. 不要只產生範例程式，必須完成可以從首頁進入遊戲、遊玩、死亡、提交分數及查看排名的完整流程。
9. 若實作內容與本文件衝突，以「簡單、穩定、可完成」為優先，並在 README 記錄差異與原因。
10. SQL migration 必須保存在專案內，不能只叫使用者去 Supabase Dashboard 手動建立。

---

## 1. 遊戲概要

### 1.1 暫定名稱

中文：**《貓咪跑酷》**  
英文：**Cat Dash**

### 1.2 遊戲定位

- 2D 橫向無盡跑酷遊戲
- 手機直向畫面
- 單局約 30 秒～3 分鐘
- 單手即可操作
- 免費遊玩
- 第一版不加入廣告及內購
- 使用 Supabase 儲存玩家最高分與排行榜

### 1.3 核心玩法

貓咪會自動向前奔跑，玩家透過點擊或按鍵跳躍，避開障礙物並收集小魚乾。遊戲速度會隨時間逐漸提升，碰到障礙物後遊戲結束。

核心循環：

**開始遊戲 → 自動奔跑 → 跳躍閃避 → 收集小魚乾 → 累積距離與分數 → 碰撞死亡 → 提交分數 → 查看個人排名 → 再玩一次**

---

## 2. 第一版範圍

### 2.1 必須完成

1. 遊戲首頁。
2. 玩家匿名登入。
3. 玩家暱稱設定。
4. 貓咪自動奔跑。
5. 點擊、觸控或鍵盤跳躍。
6. 二段跳。
7. 三種障礙物。
8. 小魚乾收集物。
9. 距離、分數與最高分顯示。
10. 遊戲速度逐漸提升。
11. 暫停與繼續。
12. 遊戲結算畫面。
13. Supabase 分數提交。
14. 全球排行榜前 100 名。
15. 顯示玩家自己的最高分與排名。
16. 本機設定與暫存。
17. 手機版響應式畫面。
18. PWA 安裝能力。
19. 基礎音效與音樂開關。
20. README、SQL migration、測試與部署說明。

### 2.2 第一版暫時不做

- 角色抽卡
- 多人即時連線
- 玩家互加好友
- 聊天系統
- 商店與付費
- 廣告
- 帳號密碼登入
- Facebook、Google、Apple 登入
- 完整反作弊系統
- 大量關卡或劇情
- 3D 場景
- 角色裝備與複雜養成

---

## 3. 技術架構

### 3.1 技術選擇

- Node.js：目前維護中的 LTS 版本
- 套件管理器：pnpm
- 建置工具：Vite
- 語言：TypeScript，開啟 strict mode
- 遊戲框架：Phaser
- 物理系統：Phaser Arcade Physics
- 後端：Supabase
- 資料庫：Supabase PostgreSQL
- 身分驗證：Supabase Anonymous Auth
- PWA：`vite-plugin-pwa`
- 單元測試：Vitest
- E2E 測試：Playwright
- 程式品質：ESLint＋Prettier

### 3.2 架構原則

- Phaser 負責所有遊戲 Scene、動畫、碰撞與 HUD。
- Supabase 模組與 Phaser Scene 解耦。
- 計分公式放在純 TypeScript module，方便測試。
- 遊戲參數集中在 config，不散落魔法數字。
- Scene 不直接組 SQL 或處理複雜 API 資料轉換。
- 線上功能失敗時仍能進入遊戲，但不提交排行榜。
- 使用匿名登入，不要求玩家輸入個資即可開始遊玩。

### 3.3 畫面尺寸

- 設計基準：390 × 844
- Phaser scale mode：`Phaser.Scale.FIT`
- auto center：`Phaser.Scale.CENTER_BOTH`
- 背景延伸填滿安全區域
- 互動按鈕不得緊貼瀏海、圓角或 Home Indicator
- 最小觸控範圍約 44 × 44 CSS pixels

---

## 4. 專案目錄

```text
cat-dash/
├── public/
│   ├── assets/
│   │   ├── audio/
│   │   ├── backgrounds/
│   │   ├── cats/
│   │   ├── obstacles/
│   │   ├── pickups/
│   │   └── ui/
│   ├── icons/
│   └── favicon.svg
├── src/
│   ├── config/
│   │   ├── gameConfig.ts
│   │   ├── difficultyConfig.ts
│   │   └── scoringConfig.ts
│   ├── game/
│   │   ├── entities/
│   │   │   ├── Cat.ts
│   │   │   ├── Obstacle.ts
│   │   │   └── FishPickup.ts
│   │   ├── managers/
│   │   │   ├── DifficultyManager.ts
│   │   │   ├── SpawnManager.ts
│   │   │   ├── ScoreManager.ts
│   │   │   └── AudioManager.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   ├── MenuScene.ts
│   │   │   ├── GameScene.ts
│   │   │   ├── PauseScene.ts
│   │   │   ├── GameOverScene.ts
│   │   │   ├── LeaderboardScene.ts
│   │   │   └── SettingsScene.ts
│   │   ├── systems/
│   │   │   ├── CollisionSystem.ts
│   │   │   ├── InputSystem.ts
│   │   │   └── ParallaxSystem.ts
│   │   └── types.ts
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   ├── authService.ts
│   │   ├── profileService.ts
│   │   ├── leaderboardService.ts
│   │   └── storageService.ts
│   ├── ui/
│   │   ├── NameInputOverlay.ts
│   │   └── LoadingOverlay.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── main.ts
│   ├── style.css
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── tests/
│   ├── scoring.test.ts
│   ├── difficulty.test.ts
│   └── validation.test.ts
├── e2e/
│   └── smoke.spec.ts
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 5. 遊戲場景

### 5.1 BootScene

職責：

- 建立最小 loading UI。
- 初始化 Supabase Client。
- 讀取本機設定。
- 取得既有 Supabase Session。
- 若沒有 Session，嘗試匿名登入。
- 若 Supabase 無法連線，切換成 offline mode。
- 完成後進入 PreloadScene。

不得因 Supabase 連線失敗而讓遊戲白畫面。

### 5.2 PreloadScene

職責：

- 載入圖片、spritesheet、音效及音樂。
- 顯示真實載入進度。
- 捕捉載入失敗事件。
- 缺少非必要音效時仍能繼續。
- 載入完成後進入 MenuScene。

### 5.3 MenuScene

顯示：

- 遊戲 Logo
- 目前暱稱
- 個人最高分
- 「開始遊戲」按鈕
- 「排行榜」按鈕
- 「設定」按鈕
- 線上／離線狀態

首次進入時：

- 產生預設暱稱，例如 `旅貓4821`。
- 顯示修改暱稱的 HTML overlay。
- 暱稱設定成功後才嘗試建立 profile。
- 若離線，仍可使用預設暱稱開始遊戲。

### 5.4 GameScene

負責：

- 建立貓咪、地面、背景及物件池。
- 處理輸入、跳躍、碰撞與生成。
- 更新距離、魚數量、分數及速度。
- 顯示 HUD。
- 處理暫停。
- 碰到障礙物後結束遊戲。

### 5.5 PauseScene

以 overlay 方式顯示：

- 繼續
- 重新開始
- 回首頁
- 音樂開關
- 音效開關

暫停期間必須停止物理、計時器、生成器及分數累積。

### 5.6 GameOverScene

顯示：

- 本局分數
- 本局距離
- 收集的小魚乾數量
- 是否刷新個人最高分
- 分數提交狀態
- 個人排名
- 再玩一次
- 排行榜
- 回首頁

如果離線或提交失敗：

- 顯示「分數暫存，連線後可重新提交」。
- 將尚未提交的最佳紀錄存入 localStorage。
- 下次成功登入後只重試尚未提交的最佳紀錄。

### 5.7 LeaderboardScene

顯示：

- 全球排行榜前 100 名
- 排名、暱稱、最高分
- 前三名用不同顏色標示
- 玩家自己的排名固定顯示在底部
- 若玩家位於前 100 名，自己的列需要 highlight
- loading、empty、offline、error 四種狀態
- 重新整理按鈕
- 返回按鈕

第一版不需要即時訂閱排行榜；每次進入及手動重新整理時查詢即可。

### 5.8 SettingsScene

設定項目：

- 音樂開關
- 音效開關
- 震動開關
- 修改暱稱
- 顯示玩家公開代碼
- 顯示版本號
- 清除本機設定前需二次確認

---

## 6. 遊戲規則

### 6.1 貓咪控制

- 貓咪保持在畫面左側約 25%～30% 的位置。
- 世界與障礙物向左移動，形成向右奔跑的視覺效果。
- 觸控畫面、滑鼠左鍵、Space 或 ArrowUp 皆可跳躍。
- 空中可以再跳一次，形成二段跳。
- 落地後重置跳躍次數。
- 按住時間不影響高度，第一版使用固定跳躍力，降低操作複雜度。
- 觸控 UI 按鈕時不可觸發跳躍。

建議初始參數：

```ts
export const PLAYER_CONFIG = {
  gravityY: 1800,
  jumpVelocity: -680,
  maxJumps: 2,
  bodyWidthRatio: 0.58,
  bodyHeightRatio: 0.82,
} as const;
```

碰撞框應小於圖片可見範圍，降低玩家覺得「明明沒碰到卻死亡」的挫折感。

### 6.2 障礙物

第一版包含三種：

| 障礙物 | 行為 | 解法 |
| --- | --- | --- |
| 紙箱 | 固定在地面 | 一段跳即可 |
| 水坑 | 寬度較長、碰到即失敗 | 提前跳躍 |
| 掃地機器人 | 沿地面移動，速度略有變化 | 觀察後跳躍 |

規則：

- 開局前 5 秒不生成障礙物。
- 不可生成理論上無法通過的組合。
- 障礙物之間必須保留最低反應距離。
- 遊戲速度增加時，生成時間要同步調整，維持合理的實際距離。
- 水坑後方不能立即接最高紙箱。
- 所有障礙物使用 object pool，離開畫面後回收。

### 6.3 小魚乾

- 小魚乾不會造成碰撞死亡。
- 每一個小魚乾增加魚數量 1。
- 同一段可排列成直線、小弧線或跳躍引導線。
- 魚的配置不能引導玩家撞向不可避開的障礙物。
- 收集時播放音效、縮放動畫及粒子效果。
- 小魚乾同樣使用 object pool。

### 6.4 難度曲線

第一版分四階段：

| 遊玩時間 | 世界速度 | 障礙物間隔 | 組合複雜度 |
| --- | ---: | ---: | --- |
| 0～20 秒 | 280 px/s | 1.8～2.6 秒 | 單一障礙物 |
| 20～45 秒 | 340 px/s | 1.5～2.2 秒 | 單一＋簡單組合 |
| 45～90 秒 | 410 px/s | 1.25～1.9 秒 | 更多移動障礙 |
| 90 秒以上 | 緩慢增加至上限 520 px/s | 最低 1.1 秒 | 混合組合 |

要求：

- 速度必須平滑插值，不可瞬間跳變。
- 世界速度上限固定，避免後期必死。
- 生成器必須根據世界速度計算安全距離。
- 難度設定集中於 `difficultyConfig.ts`。

### 6.5 分數公式

第一版採用容易在伺服器驗證的公式：

```text
總分 = 距離公尺整數 + 小魚乾數量 × 10
```

例如：

```text
距離 742 公尺
小魚乾 31 個
總分 = 742 + 31 × 10 = 1,052 分
```

限制：

- 距離、魚數量及分數皆使用非負整數。
- UI 顯示分數時加上千分位。
- 一局最長記錄 30 分鐘，超過即不接受排行榜提交。
- 分數由 `ScoreManager` 唯一計算，Scene 不可自行重複公式。

---

## 7. 視覺與音效方向

### 7.1 美術風格

- 可愛、明亮、柔和的 2D 插畫風格
- 主色：奶油白、淺橘、薄荷綠、咖啡棕
- 大圓角 UI
- 避免過多文字與細小按鈕
- 角色與背景需有清楚輪廓，方便手機閱讀

### 7.2 場景

第一版場景為住宅街道：

- 遠景：天空、雲、城市輪廓
- 中景：房屋、圍牆、樹木
- 近景：道路、花盆、路牌
- 地面：可重複拼接

使用 3～4 層 parallax，速度由慢到快。

### 7.3 Placeholder 原則

若沒有正式素材：

- 使用 Phaser Graphics 畫簡單幾何形狀。
- 貓咪可使用圓形頭、三角耳朵、矩形身體組成。
- 障礙物使用顏色與文字標記。
- 不可從網路下載不明授權素材充數。
- 保持 asset key 穩定，正式素材只需替換檔案。

### 7.4 音效

第一版至少包含：

- 跳躍
- 二段跳
- 收集小魚乾
- 撞擊
- 按鈕
- 遊戲開始
- 刷新最高分
- 背景音樂一首

瀏覽器尚未收到使用者互動前，不可強制播放音訊。

---

## 8. Supabase 身分驗證

### 8.1 匿名登入

Supabase Dashboard 必須啟用 Anonymous Sign-Ins。

啟動流程：

1. 呼叫 `supabase.auth.getSession()`。
2. 已有 session 就沿用。
3. 沒有 session 時呼叫 `supabase.auth.signInAnonymously()`。
4. 成功後確保 profiles 有該玩家資料。
5. 失敗則標記 offline mode，遊戲仍可開始。

注意：

- 匿名玩家清除瀏覽器資料、登出或更換裝置後，可能無法取回原帳號。
- 第一版設定頁需顯示這項提醒。
- 未來可將匿名帳號綁定 Email、Google 或 Apple，第一版不做。

### 8.2 暱稱規則

- 長度：2～12 個可見字元。
- 允許中文、英文、數字、底線。
- 移除前後空白。
- 禁止換行與控制字元。
- 前端做基本驗證。
- 資料庫再次驗證長度。
- 第一版建立簡單 banned words 陣列，並在 README 說明正式營運需補強內容審核。
- 暱稱不要求唯一；排行榜以暱稱搭配公開玩家代碼辨識。

### 8.3 環境變數

建立 `.env.example`：

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

規則：

- `.env` 加入 `.gitignore`。
- 只能使用 publishable key／anon key。
- 禁止在瀏覽器程式碼出現 secret key 或 service role key。
- 缺少環境變數時顯示離線模式，不可直接 crash。

---

## 9. Supabase 資料庫設計

### 9.1 資料表

#### profiles

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid | 對應 `auth.users.id`，主鍵 |
| public_code | text | 玩家公開代碼，唯一 |
| display_name | text | 玩家暱稱 |
| created_at | timestamptz | 建立時間 |
| updated_at | timestamptz | 更新時間 |

#### game_runs

保留玩家每次成功提交的遊戲紀錄，方便未來分析與偵測異常。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | bigint | identity 主鍵 |
| user_id | uuid | 玩家 ID |
| score | integer | 本局分數 |
| distance_m | integer | 本局距離 |
| fish_count | integer | 小魚乾數量 |
| duration_ms | integer | 本局時間 |
| client_version | text | 遊戲版本 |
| created_at | timestamptz | 建立時間 |

#### player_best_scores

每位玩家只保留一筆最高分，用於排行榜快速查詢。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| user_id | uuid | 玩家 ID，主鍵 |
| best_score | integer | 最高分 |
| best_distance_m | integer | 該局距離 |
| best_fish_count | integer | 該局小魚乾 |
| best_duration_ms | integer | 該局時間 |
| achieved_at | timestamptz | 達成時間 |
| updated_at | timestamptz | 更新時間 |

### 9.2 SQL Migration

建立 `supabase/migrations/001_initial_schema.sql`，內容至少包含以下 SQL。Codex 可以修正語法細節，但不可降低安全限制。

```sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (char_length(trim(display_name)) between 2 and 12)
);

create table if not exists public.game_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  distance_m integer not null check (distance_m >= 0),
  fish_count integer not null check (fish_count >= 0),
  duration_ms integer not null check (duration_ms between 1000 and 1800000),
  client_version text not null default '0.0.0',
  created_at timestamptz not null default now()
);

create table if not exists public.player_best_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  best_score integer not null check (best_score >= 0),
  best_distance_m integer not null check (best_distance_m >= 0),
  best_fish_count integer not null check (best_fish_count >= 0),
  best_duration_ms integer not null check (best_duration_ms between 1000 and 1800000),
  achieved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_best_scores_rank_idx
  on public.player_best_scores (best_score desc, achieved_at asc);

create index if not exists game_runs_user_created_idx
  on public.game_runs (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.game_runs enable row level security;
alter table public.player_best_scores enable row level security;

revoke all on public.profiles from anon;
revoke all on public.game_runs from anon;
revoke all on public.player_best_scores from anon;

grant select, insert, update on public.profiles to authenticated;
grant select on public.player_best_scores to authenticated;

create policy "authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "authenticated users can read best scores"
on public.player_best_scores for select
to authenticated
using (true);

create or replace function public.submit_game_run(
  p_score integer,
  p_distance_m integer,
  p_fish_count integer,
  p_duration_ms integer,
  p_client_version text default '0.0.0'
)
returns table (
  accepted boolean,
  is_new_best boolean,
  best_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_expected_score integer;
  v_previous_best integer;
  v_max_distance integer;
  v_max_fish integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_score is null
     or p_distance_m is null
     or p_fish_count is null
     or p_duration_ms is null then
    raise exception 'Missing run data';
  end if;

  if p_score < 0
     or p_distance_m < 0
     or p_fish_count < 0
     or p_duration_ms < 1000
     or p_duration_ms > 1800000 then
    raise exception 'Invalid run range';
  end if;

  v_expected_score := p_distance_m + p_fish_count * 10;

  if p_score <> v_expected_score then
    raise exception 'Invalid score formula';
  end if;

  -- 寬鬆的 MVP 合理性檢查，不能視為完整反作弊。
  v_max_distance := ceil((p_duration_ms / 1000.0) * 35.0)::integer + 100;
  v_max_fish := ceil(p_duration_ms / 250.0)::integer + 10;

  if p_distance_m > v_max_distance or p_fish_count > v_max_fish then
    raise exception 'Run exceeds allowed limits';
  end if;

  select pbs.best_score
    into v_previous_best
  from public.player_best_scores as pbs
  where pbs.user_id = v_user_id;

  insert into public.game_runs (
    user_id,
    score,
    distance_m,
    fish_count,
    duration_ms,
    client_version
  ) values (
    v_user_id,
    p_score,
    p_distance_m,
    p_fish_count,
    p_duration_ms,
    left(coalesce(p_client_version, '0.0.0'), 32)
  );

  insert into public.player_best_scores (
    user_id,
    best_score,
    best_distance_m,
    best_fish_count,
    best_duration_ms,
    achieved_at,
    updated_at
  ) values (
    v_user_id,
    p_score,
    p_distance_m,
    p_fish_count,
    p_duration_ms,
    now(),
    now()
  )
  on conflict (user_id) do update
  set best_score = excluded.best_score,
      best_distance_m = excluded.best_distance_m,
      best_fish_count = excluded.best_fish_count,
      best_duration_ms = excluded.best_duration_ms,
      achieved_at = excluded.achieved_at,
      updated_at = now()
  where excluded.best_score > public.player_best_scores.best_score;

  return query
  select
    true,
    v_previous_best is null or p_score > v_previous_best,
    greatest(coalesce(v_previous_best, 0), p_score);
end;
$$;

create or replace function public.get_leaderboard(p_limit integer default 100)
returns table (
  rank bigint,
  display_name text,
  public_code text,
  best_score integer,
  achieved_at timestamptz,
  is_current_user boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    ranked.rank,
    ranked.display_name,
    ranked.public_code,
    ranked.best_score,
    ranked.achieved_at,
    ranked.user_id = auth.uid() as is_current_user
  from (
    select
      dense_rank() over (
        order by scores.best_score desc, scores.achieved_at asc
      ) as rank,
      profiles.id as user_id,
      profiles.display_name,
      profiles.public_code,
      scores.best_score,
      scores.achieved_at
    from public.player_best_scores as scores
    join public.profiles as profiles on profiles.id = scores.user_id
  ) as ranked
  order by ranked.rank asc
  limit least(greatest(coalesce(p_limit, 100), 1), 100);
$$;

create or replace function public.get_my_rank()
returns table (
  rank bigint,
  display_name text,
  public_code text,
  best_score integer,
  achieved_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    ranked.rank,
    ranked.display_name,
    ranked.public_code,
    ranked.best_score,
    ranked.achieved_at
  from (
    select
      dense_rank() over (
        order by scores.best_score desc, scores.achieved_at asc
      ) as rank,
      profiles.id as user_id,
      profiles.display_name,
      profiles.public_code,
      scores.best_score,
      scores.achieved_at
    from public.player_best_scores as scores
    join public.profiles as profiles on profiles.id = scores.user_id
  ) as ranked
  where ranked.user_id = auth.uid();
$$;

revoke all on function public.submit_game_run(integer, integer, integer, integer, text)
  from public, anon;
revoke all on function public.get_leaderboard(integer)
  from public, anon;
revoke all on function public.get_my_rank()
  from public, anon;

grant execute on function public.submit_game_run(integer, integer, integer, integer, text)
  to authenticated;
grant execute on function public.get_leaderboard(integer)
  to authenticated;
grant execute on function public.get_my_rank()
  to authenticated;
```

### 9.3 Migration 驗證

Codex 必須檢查：

1. 匿名登入使用者能新增及更新自己的 profile。
2. 玩家不能修改其他人的 profile。
3. 玩家不能直接 insert 或 update `player_best_scores`。
4. 玩家不能直接 insert `game_runs`。
5. `submit_game_run` 只能替目前登入者提交。
6. 分數不符合公式時 RPC 會拒絕。
7. 新分數低於最高分時，不可覆蓋最高分。
8. 同分時較早達成者排名在前。
9. `get_leaderboard` 最多回傳 100 筆。
10. 排行榜結果不回傳玩家的 auth UUID。

---

## 10. 前端 Supabase Service

### 10.1 supabaseClient.ts

職責：

- 驗證必要環境變數。
- 建立單例 Supabase Client。
- 缺少設定時回傳 offline 狀態。
- 不要把 key 印到 log。

### 10.2 authService.ts

至少提供：

```ts
type AuthState = {
  userId: string | null;
  online: boolean;
  isAnonymous: boolean;
};

getOrCreateSession(): Promise<AuthState>;
getCurrentUserId(): Promise<string | null>;
```

### 10.3 profileService.ts

至少提供：

```ts
type PlayerProfile = {
  displayName: string;
  publicCode: string;
};

ensureProfile(displayName: string): Promise<PlayerProfile>;
getMyProfile(): Promise<PlayerProfile | null>;
updateDisplayName(displayName: string): Promise<PlayerProfile>;
```

### 10.4 leaderboardService.ts

至少提供：

```ts
type RunResult = {
  score: number;
  distanceM: number;
  fishCount: number;
  durationMs: number;
};

type LeaderboardEntry = {
  rank: number;
  displayName: string;
  publicCode: string;
  bestScore: number;
  achievedAt: string;
  isCurrentUser: boolean;
};

submitRun(run: RunResult): Promise<{
  accepted: boolean;
  isNewBest: boolean;
  bestScore: number;
}>;

getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
getMyRank(): Promise<LeaderboardEntry | null>;
```

RPC 呼叫範例：

```ts
const { data, error } = await supabase.rpc('submit_game_run', {
  p_score: run.score,
  p_distance_m: run.distanceM,
  p_fish_count: run.fishCount,
  p_duration_ms: run.durationMs,
  p_client_version: APP_VERSION,
});
```

所有 Supabase row 必須轉換成 camelCase domain object，不可讓 snake_case 滲透到 Scene。

---

## 11. 本機資料

使用 localStorage 保存：

```ts
type LocalSettings = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

type LocalProgress = {
  displayName?: string;
  localBestScore: number;
  pendingBestRun?: RunResult;
};
```

建議 key：

```text
cat-dash:settings:v1
cat-dash:progress:v1
```

要求：

- JSON parse 失敗時使用預設值。
- localStorage 不可作為線上排行榜的可信來源。
- pending run 只保留尚未提交的最高分。
- 線上最高分與本機最高分取較大值顯示，但只有已成功提交者計入排名。

---

## 12. 離線與錯誤處理

### 12.1 Offline Mode

Supabase 無法使用時：

- 首頁顯示「離線模式」。
- 玩家仍能開始遊戲。
- 分數保存於本機。
- 排行榜頁顯示無法載入。
- 恢復連線後可重試提交 pending best run。

### 12.2 錯誤訊息

使用玩家看得懂的訊息：

- 「目前無法連線，已切換為離線模式。」
- 「分數已保存在裝置，下次連線時會重新提交。」
- 「排行榜暫時無法載入，請稍後再試。」
- 「暱稱格式不正確，請輸入 2～12 個字。」

技術錯誤可在開發模式使用 `console.error`，Production 不顯示資料庫結構、JWT 或環境設定。

---

## 13. 防作弊說明

第一版是 MVP 排行榜，不宣稱完全防作弊。

目前防護：

- 玩家必須先經 Supabase Auth 驗證。
- RLS 限制 profile 修改範圍。
- 玩家不能直接寫入排行榜表。
- 透過資料庫 RPC 提交。
- 伺服器重新驗證分數公式。
- 驗證時間、距離與魚數量合理範圍。
- 保留每局紀錄以供日後分析。

仍存在的限制：

- 玩家可修改前端程式或直接呼叫 RPC，偽造看似合理的資料。
- 匿名帳號可被大量建立。
- 瀏覽器端無法保存真正的秘密。

正式營運升級方向：

1. 使用 Supabase Edge Function 發放 run token。
2. 遊戲開始時由伺服器建立 run session。
3. 提交時驗證開始時間、結束時間與一次性 token。
4. 加入 CAPTCHA、速率限制及異常分數標記。
5. 建立管理員審核與封鎖流程。
6. 對前幾名紀錄進行額外驗證。

---

## 14. PWA 與部署

### 14.1 PWA

使用 `vite-plugin-pwa`：

- 可加入手機主畫面。
- portrait orientation。
- standalone display。
- 提供 192×192 與 512×512 icon。
- 快取靜態遊戲素材。
- 不快取 Supabase API 回應。
- 更新版本時提示重新整理。

manifest 基本資訊：

```json
{
  "name": "貓咪跑酷 Cat Dash",
  "short_name": "Cat Dash",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#F5A65B",
  "background_color": "#FFF7E8"
}
```

### 14.2 部署

第一版優先部署到：

- Cloudflare Pages
- Vercel
- Netlify
- GitHub Pages（需要正確設定 base path）

README 必須寫出至少一種完整部署方法與環境變數設定方式。

---

## 15. 測試要求

### 15.1 單元測試

至少測試：

1. 分數公式正確。
2. 負數輸入被拒絕或正規化。
3. 距離與魚數量只產生整數分數。
4. 難度曲線在各時間區間回傳正確速度。
5. 世界速度不超過上限。
6. 暱稱長度及字元驗證。
7. localStorage 壞資料能回復預設值。
8. pending run 只保存最高分。

### 15.2 E2E Smoke Test

使用 Playwright 至少測試：

1. 首頁可以載入。
2. 可以點擊開始遊戲。
3. GameScene 成功顯示。
4. 可以暫停並繼續。
5. 可進入排行榜頁。
6. Supabase 未設定時仍可離線遊玩。

### 15.3 手動測試

- iPhone Safari
- Android Chrome
- 桌面 Chrome
- 直向 390×844
- 小尺寸手機 360×640
- 網路中斷與恢復
- 清除 localStorage 後首次啟動
- 背景切換後回到遊戲
- 快速連點跳躍
- 暫停期間分數不增加
- 同一局不會重複提交

---

## 16. 效能要求

- 目標 60 FPS；較弱手機至少維持可玩的 30 FPS。
- 障礙物和小魚乾使用 object pooling。
- 不在每一幀建立大量新物件。
- 不在 update loop 中呼叫 Supabase。
- 圖片使用適當尺寸與壓縮格式。
- 避免過大 texture atlas。
- 背景圖可重複拼接，不製作超長單張圖片。
- 頁面進入背景時自動暫停。
- 回前景時顯示繼續提示，不直接恢復導致死亡。

---

## 17. 開發階段

### Phase 1：專案骨架

- 建立 Vite＋TypeScript＋Phaser。
- 設定 lint、format、test、build。
- 建立 Scene 切換。
- 使用 placeholder 顯示首頁。

驗收：`pnpm dev`、`pnpm test`、`pnpm build` 均成功。

### Phase 2：核心跑酷

- 貓咪跳躍及二段跳。
- 地面與背景移動。
- 障礙物生成。
- 碰撞死亡。
- 分數及距離。

驗收：可以完整遊玩一局並重新開始。

### Phase 3：內容與體驗

- 三種障礙物。
- 小魚乾。
- 難度曲線。
- Parallax。
- 暫停、音效及設定。

驗收：持續遊玩兩分鐘不出現無解障礙組合或明顯卡頓。

### Phase 4：Supabase

- 匿名登入。
- profiles。
- SQL migration 與 RLS。
- submit RPC。
- 排行榜及個人排名。
- 離線模式與重試。

驗收：兩個不同瀏覽器匿名帳號能提交不同分數，排行榜排序正確，且彼此不能修改資料。

### Phase 5：PWA 與品質

- PWA manifest、icons、service worker。
- 手機安全區域。
- 自動與手動測試。
- README。
- Production build。

驗收：手機可以加入主畫面並以 standalone 模式啟動。

---

## 18. 驗收條件

專案完成必須同時符合：

1. 新使用者打開遊戲後不需註冊即可開始。
2. 玩家可以設定暱稱。
3. 手機點擊和桌面鍵盤都能操作。
4. 貓咪能跳躍及二段跳。
5. 障礙物生成合理且能被避開。
6. 分數符合 `距離＋魚×10`。
7. 碰撞後會進入結算頁。
8. 有網路時可以提交分數。
9. 排行榜顯示前 100 名。
10. 玩家看得到自己的最高分與名次。
11. 新分數較低時不覆蓋最高分。
12. 無網路或 Supabase 未設定時仍可離線遊玩。
13. 玩家不能直接修改其他人的資料。
14. 專案沒有 secret key。
15. `pnpm lint` 通過。
16. `pnpm typecheck` 通過。
17. `pnpm test` 通過。
18. `pnpm build` 通過。
19. README 包含本機啟動、Supabase 設定、migration、測試及部署方法。
20. 不含未授權第三方素材。

---

## 19. package.json scripts

至少提供：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

如果 TypeScript project references 與 `tsc -b` 不適用，可調整 build 指令，但 typecheck 必須保留。

---

## 20. README 必須包含

1. 遊戲簡介。
2. 技術棧。
3. 專案目錄。
4. 安裝需求。
5. `pnpm install` 與 `pnpm dev`。
6. `.env` 設定。
7. 如何在 Supabase 啟用 Anonymous Sign-Ins。
8. 如何執行 SQL migration。
9. 如何建立測試資料。
10. 如何執行 lint、typecheck、test、E2E 與 build。
11. 如何部署。
12. Offline Mode 行為。
13. 匿名帳號清除瀏覽器資料後可能遺失的提醒。
14. 第一版防作弊限制。
15. 正式素材替換位置。

---

## 21. 建議的後續版本

完成 MVP 後再考慮：

### v1.1

- 每日任務
- Combo 系統
- 護盾、磁鐵、減速道具
- 更多貓咪造型
- 更多背景主題

### v1.2

- Email／Google／Apple 帳號綁定
- 每週排行榜
- 好友排行榜
- 成就系統
- 分享成績圖片

### v1.3

- 獎勵式廣告復活一次
- 永久去廣告
- 造型商店
- Supabase Edge Function 強化提交驗證

---

## 22. 最終交付清單

Codex 完成後應交付：

- [ ] 可執行的完整原始碼
- [ ] Phaser 遊戲場景
- [ ] Placeholder 素材
- [ ] Supabase Client 整合
- [ ] SQL migration
- [ ] RLS 與排行榜 RPC
- [ ] 本機離線存檔
- [ ] PWA 設定
- [ ] 單元測試
- [ ] E2E smoke test
- [ ] README
- [ ] `.env.example`
- [ ] 成功的 production build
- [ ] 已知限制與後續建議

完成時，請在最終回覆中列出：

1. 已完成項目。
2. 測試與 build 結果。
3. 需要使用者在 Supabase Dashboard 執行的步驟。
4. 本機啟動指令。
5. 部署步驟。
6. 尚未完成或需要正式素材的部分。

