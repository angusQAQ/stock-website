---
name: Northstar 美股研究平台
description: 明亮、資訊密集的個人美股研究與美元帳本介面；以橙色串連選取與明確操作。
colors:
  bg: '#f5f6f7'
  panel: '#ffffff'
  ink: '#191b1f'
  muted: '#626872'
  border: '#e6e8eb'
  brand: '#ff5b00'
  brand-hover: '#ee5000'
  brand-soft: '#fff1e8'
  brand-ink: '#b63d00'
  green: '#087f5b'
  red: '#c4333c'
  warning: '#8b5900'
  blue: '#365eb1'
  chart-grid: '#f0f1f3'
  ma20: '#986200'
  ma50: '#365eb1'
  button-ink: '#171717'
  control-bg: '#f0f2f4'
  control-hover: '#e5e8eb'
  disabled-bg: '#eceef0'
  disabled-ink: '#737780'
  input-border: '#cdd1d6'
  placeholder: '#6c727c'
  text-hover: '#802b00'
  support-ink: '#505862'
  table-bg: '#fafbfc'
  warning-bg: '#fff6e7'
  warning-ink: '#805100'
  error-bg: '#fff0f0'
  error-ink: '#a62932'
  positive-bg: '#eaf6f0'
  dark-muted: '#c7cacf'
  search-bg: '#f3f4f5'
typography:
  display:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 46px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.03em
  headline:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.03em
  quote:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 40px
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: -0.035em
  asset-value:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 31px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  title:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 16px
    fontWeight: 650
    lineHeight: 1.5
  body:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.95
  body-compact:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.95
  label:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: '''Helvetica Neue'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', ''PingFang TC'', ''Noto Sans CJK TC'',
      ''Microsoft JhengHei'', sans-serif'
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.8
rounded:
  panel: 14px
  field: 8px
  chip: 6px
  notice: 10px
  dialog: 20px
  pill: 999px
spacing:
  micro: 8px
  tight: 12px
  compact: 16px
  regular: 20px
  relaxed: 24px
  roomy: 32px
  gutter: 40px
components:
  button-primary:
    backgroundColor: '{colors.brand}'
    textColor: '{colors.button-ink}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 11px 19px
  button-primary-hover:
    backgroundColor: '{colors.brand-hover}'
  button-dark:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.panel}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 11px 19px
  button-secondary:
    backgroundColor: '{colors.control-bg}'
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 11px 19px
  button-secondary-hover:
    backgroundColor: '{colors.control-hover}'
  button-disabled:
    backgroundColor: '{colors.disabled-bg}'
    textColor: '{colors.disabled-ink}'
  button-text:
    textColor: '{colors.brand-ink}'
    padding: 4px 0
  button-text-hover:
    textColor: '{colors.text-hover}'
  field:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    padding: 11px 12px
  search:
    backgroundColor: '{colors.search-bg}'
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
    padding: 0 14px
    height: 42px
    width: 220px
  nav-active:
    textColor: '{colors.ink}'
  range-active:
    backgroundColor: '{colors.brand-soft}'
    textColor: '{colors.brand-ink}'
    rounded: '{rounded.chip}'
    padding: 6px 9px
  panel:
    backgroundColor: '{colors.panel}'
    rounded: '{rounded.panel}'
  stock-selected:
    backgroundColor: '{colors.brand-soft}'
    textColor: '{colors.brand-ink}'
    padding: 13px 10px
---

# Design System: Northstar

## Overview

**Creative North Star: "明亮的研究座標"**


「明亮的研究座標」是對已實作 Northstar 的描述：白色面板與冷灰底色承載密集報價、圖表和帳本，近黑字體建立閱讀層級，橙色把主要操作與選取狀態串起來。繁體中文敘述與英文股票代碼共用一套標準無襯線字體；數字的對齊與資訊的分組優先於裝飾。


本次方向源自使用者指定的 Longbridge 香港網站，但該頁面在雲端環境遭代理 CONNECT 403 阻擋，未取得可量測的網頁或參考截圖。這份文件記錄 Northstar 已實作的白、冷灰、近黑及橙色視覺詮釋；所有色碼、字體、版型與響應式數值以本專案程式為準，不代表已核對 Longbridge 的樣式或視覺相似程度。


閱讀採明確的層級與平面分區，主要導覽保持橫向，研究內容在窄螢幕依序排列。行情及資產缺漏是完整的介面狀態；留白、破折號與連線提示承擔說明，不以虛構數據填補畫面。

**Key Characteristics:**

- 明亮底色與白色研究面板，細線分隔資訊。
- 橙色標示明確操作與選取；漲跌、警告和連線各有語義。
- 中文標題、報價與表格形成可掃讀層級，數據使用等寬數字對齊。
- 橫向導覽、股票帶與區域捲動保留窄螢幕的資訊密度。

## Colors

色彩原始來源是 `src/styles.css` 的 CSS 自訂屬性；前言是機器可讀的規範，以下說明使用位置。品牌只有一組橙色主調，其他彩色是資料語義與圖表識別，不是額外品牌色。

### Primary

- **動作橙**（`brand`、`brand-hover`）：明確分析、記錄資金與交易等主按鈕；按鈕以深色文字配對。
- **淡橙與深橙**（`brand-soft`、`brand-ink`、`text-hover`）：選取股票、圖表期間、小型連結與鍵盤焦點；淡橙承載選取，深橙承載小字。

### Neutral

- **冷灰畫布**（`bg`）與 **白色面板**（`panel`）：全頁背景和資訊容器。
- **近黑主字**（`ink`、`button-ink`）、**冷灰輔字**（`muted`、`support-ink`）與 **細灰分隔**（`border`）：標題、正文、來源時間、層級與邊界。
- **控制灰階**（`control-bg`、`control-hover`、`search-bg`、`input-border`、`placeholder`）：次操作、搜尋與表單；`disabled-bg`／`disabled-ink` 說明不可執行狀態。`table-bg` 支持表頭與列懸停，`dark-muted` 用於深色總資產卡的輔字。

資料語義：`green` 為上漲／正向、`red` 為下跌／失敗、`warning` 為待核對或風險，`blue` 為資訊。通知另有實作中的淡色底與較深文字配對。圖表沿用 `panel`、`muted`、`border` 與漲跌色，`chart-grid` 保持格線安靜，`ma20` 和 `ma50` 分辨均線；不另立圖表主題。

### Named Rules

**The Orange Continuity Rule.** 主要動作使用鮮橙底與深色字；小型連結與淡橙選取區使用深橙文字。漲跌與警告保留各自的語義色。

側車中的八階 OKLCH 色帶由現有色碼衍生，只供預覽探索，並非應用程式已採用的新增色階。

## Typography

**Display Font / Body Font:** 同一套標準無襯線字體，順序見前言 `fontFamily`；系統依平台提供英文字體及繁體中文 fallback，沒有外部字體載入依賴。大字負責報價與清楚的頁面層級，不作裝飾性展示字體。

**Character:** 緊湊、清楚、適合長時間研究。一般介面基礎字級為（14px）；閱讀正文以較寬行距承載完整理由，表格與輔助標籤維持精簡。

### Hierarchy

- **Display**：市場頁主標；較一般頁標大一階。實際響應式變化依序為（46 → 40 → 32 → 30px），手機行高為（1.4）。
- **Headline**：資產與報告頁的一般主標；手機縮為（29px）。
- **Quote / Asset value**：主報價與資產數字；手機主報價為（35px），資產數字按可用空間降階。
- **Title**：面板標題；公司名稱、連線卡與報告結論有按內容需要的局部尺寸，不另建立品牌字體。
- **Body / Body compact**：報告詳文與理由／風險；長文最寬（70ch），連線說明最寬（65ch）。
- **Label / Caption**：按鈕、表單提示與圖表空狀態；圖表本身的座標字體為（11px）。

### Named Rules

**The Data Alignment Rule.** 報價、資產與表格使用 tabular-nums；表格數字靠右，股票識別靠左。以換行與區域捲動維持密度。

## Layout

主容器和頂部橫列的最大寬度為（1480px），桌面左右內距為（40px）。頂部導覽黏在頁首，三個目的地採文字按鈕與橙色底線。市場與資產摘要桌面為四欄；研究區以窄股票清單、伸縮研究主欄與資產側欄組成，預設欄寬為（202px / minmax(0,1fr) / 250px），欄距為（20px）。空間節奏來自前言的已用間距，而非補入新的比例系統。

實際 CSS 斷點如下；這些是樣式規則，不是測試截圖的視窗尺寸：

| 條件 | 已實作行為 |
| --- | --- |
| 最小寬（1600px） | 研究左右欄擴至（216px / 272px），欄距（24px）。 |
| 最大寬（1180px） | 外側內距（28px）；研究改兩欄（190px / 伸縮欄），資產區移到研究下方並排。 |
| 最大寬（1000px） | 頂列換行；完整導覽移到第二行，保留橫向三項入口。 |
| 最大寬（920px） | 研究改單欄；股票清單變成局部橫向捲動帶，資產摘要改兩欄。 |
| 最大寬（640px） | 外側內距（20px）；市場摘要兩欄、理由／風險單欄，分析主按鈕佔整行；資產脈絡區單欄。搜尋建議貼合視窗左右內距。 |
| 最大寬（360px） | 外側內距（16px）；品牌、股票摘要與控制群作局部壓縮，資產摘要改為單欄以完整顯示金額，保留研究流程。 |

圖表高度依版面從桌面（310px）、單欄（340px）到手機（280px）。表格保持靠右數字與不換行欄位，在自身容器橫向捲動；股票帶亦有自己的捲動範圍。頁面切換及選股回到頂端。

## Elevation & Depth

主要容器使用平面色階與細線，靜態研究卡沒有陰影。只有搜尋建議和原生對話框有柔和浮層陰影；對話框另以半透明近黑 backdrop 分離背景。焦點以深橙外框呈現（2px，外距 4px），不靠陰影表示選取。

### Shadow Vocabulary

- **搜尋浮層**（`0 12px 40px #20262e26`）：將建議列表放在頂部搜尋之上。
- **對話框**（`0 24px 80px #11182733`）：支援暫時的資金輸入工作；backdrop 為（`#191b1f66`）。

### Named Rules

**The Quiet Surface Rule.** 研究面板在靜止時以白底、冷灰背景與細邊框分層；懸浮陰影只承擔搜尋建議與對話框的覆蓋關係。

按鈕和連結只有背景、文字與邊框色的短轉場（160ms ease-out）。展開證據的箭頭直接旋轉，沒有捲動演出；`prefers-reduced-motion: reduce` 關閉轉場並還原自動捲動。

## Shapes

面板以同一種柔和圓角與細線收邊。按鈕和搜尋是膠囊，輸入框與期間選項用較小圓角；對話框圓角較寬。精確可重用值見前言 `rounded`。股票列另有實作的局部圓角（9px），公司與分析圖示容器採柔角方形，狀態點與純圖示按鈕採圓形。

圖示使用細線幾何 SVG，與文字對齊，沒有以文字字元替代圖示。專案沒有新增出貨點陣圖片；`public/favicon.svg` 是幾何品牌圖示，不形成影像素材風格。

## Components

### Buttons

主按鈕清楚、果斷，以鮮橙底配深色字；標準最小高度為（42px），膠囊形狀與內距見前言。深色按鈕用於資產區的相關操作，次按鈕使用灰底，文字按鈕用深橙。懸停只改色；停用使用灰色配對及不可執行游標。所有互動都保留可見鍵盤焦點。

### Chips

圖表期間使用小圓角與淡橙／深橙選取。投資期間是灰底分段控制，選取項為白底近黑字；股票清單分類以近黑膠囊標示當前分類。它們是不同任務的選擇器，保留各自已實作的狀態。

### Cards / Containers

白色研究容器以細邊框與面板圓角組成，內部標題列以分隔線和穩定內距建立分組。一般內容內距多為（20–24px），手機多為（16px）。總資產卡使用近黑底與淺字建立數值重點；摘要卡以白色或淡色背景建立層次，保持平面。

### Inputs / Fields

白底、灰色細邊框、柔和小圓角；搜尋另用灰底膠囊。輸入有完整文字標籤，輔助文字與錯誤留在相關欄位旁。風險選單維持原生選擇行為。搜尋支援方向鍵、Enter 選股和 Escape 關閉；建議浮層的懸停與鍵盤選取共用淡橙底。

### Navigation

白色橫向導覽以近黑／冷灰區分當前頁，細橙底線確認位置；窄螢幕仍呈三個文字入口。股票列和圖表期間延續橙色選取語言，與明確分析動作形成可辨識的系統特徵。

### Research and ledger

報價、來源時間、行情狀態和圖表形成一組；分析報告依結論、理由、風險、價位、倉位與可展開證據閱讀。持倉與帳本以表格呈現精確數字，資訊缺漏保留破折號或等待狀態。這些是已存在的內容組件，不以設計規範推定正式後端已連線。

### Transaction dialog

原生 dialog 以受視窗限制的寬高承載輸入；窄畫面可在對話框內捲到儲存操作。關閉、Escape、背景點擊與成功儲存結束後，焦點回到仍存在的原始開啟按鈕。互動行為由應用程式負責，側車範例只展示可攜的 HTML／CSS。

## Do's and Don'ts

### Do:

- **Do** 讓新元件沿用既有橙色操作／選取語言，並保留漲跌、風險與連線的文字說明。
- **Do** 維持完整詞組換行、數字對齊、清楚的鍵盤焦點，以及表格與股票帶的局部橫向捲動。
- **Do** 將資料時間、缺漏和不可用提示保留在相關內容附近；新畫面沿用白色平面容器。

### Don't:

- **Don't** 把這次採用的色碼、字體或排列宣稱為已量測的 Longbridge 網站規範。
- **Don't** 為填滿版面加入看似真實的報價、持倉或研究結果；本機 fixture 截圖只作測試證據。
- **Don't** 以品牌橙色取代漲跌／錯誤語義，或把研究面板全面改成陰影浮卡。

本文件沒有把 `CODEX RESEARCH` 的裝飾性小標與局部極小字級收編為可重用的標題規範，也沒有藉此要求修改現有功能。採樣依據是樣式與五個主要元件；已查看桌面／手機實際截圖。完成審查與修正評分的範圍見 `.impeccable/review/finish-review.md`、`.impeccable/review/verdict.md`；本機報告與持倉 fixture 只供視覺測試，不是正式金融資料或後端連線證據。
