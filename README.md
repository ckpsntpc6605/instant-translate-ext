# TranslateGemma Translator

一個 Chrome Extension，讓你在任何網頁上選取文字後，即可透過本地 AI 模型即時翻譯。翻譯完全在本機執行，不需要 API Key，不傳送任何資料到外部伺服器。

![demo](https://placehold.co/600x300?text=Select+text+→+Red+dot+→+Translation)

## 功能

- 選取任意網頁上的文字，右下角出現紅點
- 點擊紅點，彈出翻譯視窗
- 支援 55 種語言互譯
- 完全本地運算，離線可用，隱私安全
- 可在設定頁面切換來源語言、目標語言、模型版本

---

## 安裝需求

### 1. Ollama

Ollama 是用來在本機執行 AI 模型的工具。

**安裝：**
```bash
brew install ollama
```

> 沒有 Homebrew？前往 [https://ollama.com](https://ollama.com) 下載安裝包。

**設定開機自動啟動（建議）：**
```bash
brew services start ollama
```

如果不想自動啟動，每次使用前手動執行：
```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

> 若使用手動啟動方式，**必須加上** `OLLAMA_ORIGINS="chrome-extension://*"`，否則 Extension 會收到 403 錯誤。
>
> 使用 `brew services start ollama` 自動啟動則不需要額外設定，服務會自動允許 Chrome Extension 存取。

---

### 2. TranslateGemma 模型

| 版本 | 大小 | 適合情境 |
|------|------|----------|
| `translategemma` (預設 4B) | 3.3 GB | 一般日常翻譯，速度快 |
| `translategemma:12b` | 8.1 GB | 品質更好，需要較多記憶體 |
| `translategemma:27b` | 17 GB | 最高品質，需要高階硬體 |

**下載模型（只需執行一次）：**
```bash
ollama pull translategemma
```

確認下載成功：
```bash
ollama list
# 應顯示 translategemma:latest
```

---

### 3. Chrome Extension

1. 開啟 Chrome，前往 `chrome://extensions/`
2. 開啟右上角的**開發人員模式**
3. 點擊**載入未封裝項目**
4. 選擇本專案的資料夾（`TranslateChromePlugin/`）
5. Extension 圖示出現在工具列即安裝完成

---

## 使用方式

### 翻譯網頁文字

1. 在任意網頁上用滑鼠**選取文字**
2. 選取範圍右下角會出現一個**紅點**
3. **點擊紅點**，翻譯視窗彈出並開始翻譯
4. 翻譯完成後結果顯示在視窗中
5. 點擊 `×` 或按 `Esc` 或點擊視窗外關閉

### 調整設定

點擊 Chrome 工具列的 **Extension 圖示**，可以調整：

- **Source Language**：來源語言（預設為 Auto Detect 自動偵測）
- **Target Language**：翻譯目標語言（預設為繁體中文）
- **Model**：使用的模型版本（預設為 `translategemma:latest`）
- **Check Connection**：檢查 Ollama 是否正常運行及模型是否已下載

---

## 疑難排解

### 出現「Ollama returned status 403」

Ollama 未允許 Chrome Extension 存取。請停止目前的 Ollama，改用以下指令啟動：

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

或改用 brew services 方式啟動。

### 出現「Ollama returned status 404」

模型名稱不符。請確認 `ollama list` 中顯示的模型名稱，並在 Extension 設定中選擇對應版本。

### 出現「Ollama not detected」

Ollama 服務未啟動。執行：

```bash
ollama serve
```

或確認 `brew services list` 中 ollama 狀態為 `started`。

### 翻譯一直轉圈圈，沒有結果

模型尚未下載完成，或下載失敗。重新執行：

```bash
ollama pull translategemma
```

---

## 技術架構

```
manifest.json          # Chrome Extension 設定（Manifest V3）
background.js          # Service Worker，代理 Ollama API 請求
content.js             # 注入所有網頁，處理選取偵測與 UI
content.css            # Shadow DOM host 基礎樣式
popup/
  popup.html           # Extension icon 點擊後的設定頁面
  popup.js
  popup.css
lib/
  languages.js         # 55 種語言清單（background + content 共用）
icons/                 # Extension 圖示
```

所有注入網頁的 UI（紅點、翻譯視窗）使用 **Shadow DOM** 實作，與網頁本身的 CSS 完全隔離，不互相干擾。

翻譯請求由 **Background Service Worker** 轉發給 Ollama，解決 Content Script 無法直接存取 `localhost` 的 CORS 限制。

---

## 支援語言

支援 55 種語言，包含：繁體中文、簡體中文、英文、日文、韓文、法文、德文、西班牙文、葡萄牙文、俄文、阿拉伯文、印地文⋯⋯等。
