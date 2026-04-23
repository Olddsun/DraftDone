# DraftDone

草圖轉 AutoCAD，室內設計師的必備工具。

## 解決的痛點

室內設計師完成工程草圖後，傳統流程需要人工重繪成 CAD 檔案，耗時且容易出錯。DraftDone 讓設計師直接拍照或上傳數位草圖，AI 自動解析成可編輯的平面圖，確認沒問題後一鍵匯出 AutoCAD 可讀取的 DXF 檔案。

## 核心功能

- 上傳手繪或數位草圖（JPG、PNG、HEIC）
- Claude Vision AI 自動辨識牆面、門、窗、房間、尺寸標註
- 瀏覽器內即時預覽平面圖
- 支援縮放、拖曳牆面微調、對照原圖
- 一鍵匯出 `.dxf`，AutoCAD 直接開啟

## 專案連結

| 項目 | 網址 |
|------|------|
| 網站 | https://frontend-seven-indol-wnhap56xo0.vercel.app |
| Vercel 後台 | https://vercel.com/olddsuns-projects/frontend |
| Render 後台 | https://dashboard.render.com/web/srv-d7l0smmgvqtc73885j8g |
| GitHub | https://github.com/Olddsun/DraftDone |

## 技術架構

| 層 | 技術 | 說明 |
|----|------|------|
| 前端 | Next.js + Tailwind CSS | 部署於 Vercel |
| 後端 | Python FastAPI + ezdxf | 部署於 Render |
| AI | Claude Vision API (claude-opus-4-6) | 草圖解析 |

## 本地開發

**後端**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 填入 ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

**前端**
```bash
cd frontend
npm install
# .env.local 已設定 NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## 未來規劃

- iOS / iPad App
- Mac App
- 多層平面圖支援
- 匯出 DWG 格式
