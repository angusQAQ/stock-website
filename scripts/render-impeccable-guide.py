#!/usr/bin/env python3
"""Render the checked-in Traditional Chinese guide to a standalone Pages document.

Requires Python Markdown, available in the project's AI Berkshire environment.
"""
from pathlib import Path
import re

import markdown

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/impeccable-guide.zh-Hant.md"
OUTPUT = ROOT / "public/guides/impeccable.html"
source = SOURCE.read_text(encoding="utf-8")
title, text = source.split("\n", 1)
title = title.removeprefix("# ")
renderer = markdown.Markdown(extensions=["tables", "fenced_code", "toc", "sane_lists"], extension_configs={"toc": {"toc_depth": "2"}})
body = renderer.convert(text)
body = re.sub(r'href="\.\./([^\"]+)"', r'href="https://github.com/angusQAQ/stock-website/blob/main/\1"', body)
body = body.replace('href="deployment.md"', 'href="https://github.com/angusQAQ/stock-website/blob/main/docs/deployment.md"')
CSS = """
:root{font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;color:#243746;background:#f1f4f5;font-size:17px;line-height:1.9;font-synthesis:none}
*{box-sizing:border-box}body{margin:0}a{color:#146154;text-underline-offset:4px;text-decoration-thickness:1px}a:hover{color:#08483d}a:focus-visible,summary:focus-visible{outline:2px solid #24836f;outline-offset:4px}::selection{background:#b9dfd1;color:#102e26}
.masthead{background:#122b36;color:#f5f9fa;border-bottom:4px solid #3b8b76}.masthead-inner{max-width:1280px;margin:auto;padding:26px 32px 32px}.topline{display:flex;justify-content:space-between;gap:16px;align-items:center;font-size:14px}.guide-actions{display:flex;gap:18px;flex-wrap:wrap}.topline a{color:#d3e8e4}.title{font-size:36px;line-height:1.45;font-weight:700;letter-spacing:-.02em;text-wrap:balance;max-width:29em;margin:25px 0 14px}.masthead p{font-size:15px;line-height:1.8;color:#d4e3e9;margin:0;max-width:60em}
.layout{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:252px minmax(0,1fr);gap:36px;padding:34px 32px 70px}.contents{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow:auto;padding-right:12px;font-size:14px;line-height:1.65}.contents h2{font-size:17px;margin:0 0 14px;color:#173d43}.contents ul{padding:0;list-style:none;margin:0}.contents li{margin:0}.contents a{display:block;color:#344f5b;text-decoration:none;padding:7px 0}.contents a:hover{color:#146154;text-decoration:underline}.article{background:#fff;min-width:0;padding:30px 40px 48px;border-radius:3px;box-shadow:0 8px 24px #173b4b08}.article>p:first-child{margin-top:0}.article h2{font-size:26px;line-height:1.5;margin:2.4em 0 .75em;padding-top:.3em;border-top:1px solid #dbe4e6;padding-top:22px;color:#123d42;text-wrap:balance;scroll-margin-top:24px}.article h3{font-size:20px;line-height:1.6;margin:1.9em 0 .6em;color:#1c4f50}.article p{margin:.85em 0;overflow-wrap:anywhere}.article ul,.article ol{padding-left:1.5em}.article li{margin:.4em 0}.article li p{margin:.4em 0}.article strong{font-weight:700;color:#1b3540}.article code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.85em;background:#edf3f2;padding:.12em .32em;border-radius:3px;overflow-wrap:anywhere}.article pre{background:#132d38;color:#f0f6f7;padding:18px 20px;border-radius:5px;overflow:auto;margin:1.2em 0;line-height:1.8;font-size:14px;tab-size:2}.article pre code{color:inherit;background:none;padding:0;font-size:inherit;overflow-wrap:normal}.table-wrap{width:100%;overflow-x:auto;margin:1.2em 0}.article table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.85}.article th{text-align:left;background:#e7f0ed;color:#18463e;font-weight:700}.article th,.article td{padding:11px 13px;border:1px solid #d3e0dd;vertical-align:top}.article td:first-child{font-weight:500}.article table code{font-size:12px;white-space:normal;overflow-wrap:anywhere}.footer{max-width:1216px;margin:0 auto;padding:24px 0 32px;border-top:1px solid #cbd9dc;font-size:14px;color:#3e5965;display:flex;justify-content:space-between;gap:15px}.mobile-contents{display:none}.reading-note{padding-top:18px;margin-top:30px;border-top:1px solid #d4dfe2;font-size:14px;color:#455f68}
@media(max-width:1000px){.layout{grid-template-columns:210px minmax(0,1fr);padding:28px 22px 50px;gap:22px}.article{padding:24px 26px 38px}.contents{font-size:13px}.title{font-size:32px}.footer{margin:0 22px}}
@media(max-width:760px){:root{font-size:16px}.masthead-inner{padding:22px 20px 26px}.topline{font-size:13px;flex-wrap:wrap}.title{font-size:28px;margin-top:22px;line-height:1.5}.masthead p{font-size:14px}.layout{display:block;padding:20px 14px 36px}.contents{display:none}.mobile-contents{display:block;background:#e4eeea;border:1px solid #c7d9d2;padding:13px 17px;margin-bottom:17px;border-radius:4px;font-size:14px}.mobile-contents summary{font-weight:700;color:#244e42;cursor:pointer}.mobile-contents ul{list-style:none;padding:4px 0;margin:0}.mobile-contents a{display:block;padding:7px 0;text-decoration:none}.article{padding:23px 18px 32px}.article h2{font-size:22px;margin-top:2.1em;padding-top:19px}.article h3{font-size:18px}.article pre{padding:14px 13px;font-size:13px}.article table{font-size:13px;min-width:420px}.article th,.article td{padding:9px 10px}.footer{display:block;font-size:13px;margin:0 20px;padding-top:20px}.footer span{display:block;margin-bottom:8px}}
@media print{.guide-actions{display:none} @page{size:A4;margin:17mm 17mm 19mm}:root{font-size:10.5pt;color:#152b36;background:white;line-height:1.65}.masthead{background:white;color:#123d42;border-bottom:2px solid #347a68}.masthead-inner{padding:0 0 16px}.masthead p,.topline a{color:#344f5b}.topline{font-size:9pt}.title{font-size:24pt;margin:13px 0 9px;max-width:none}.layout{display:block;padding:0}.contents,.mobile-contents{display:none!important}.article{padding:0;box-shadow:none;border:0}.article h2{font-size:17pt;margin:1.7em 0 .65em;padding-top:13px;break-after:avoid}.article h3{font-size:13pt;break-after:avoid}.article pre{font-size:8.5pt;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;background:#eef3f3;color:#142e38;padding:12px;break-inside:auto}.article pre code{white-space:pre-wrap;overflow-wrap:anywhere}.table-wrap{overflow:visible}.article table{font-size:9pt;min-width:0}.article tr{break-inside:avoid}.article th,.article td{padding:6px 8px}.article table code{font-size:8.3pt}a{color:#195e50;text-decoration:none}p,li{orphans:3;widows:3}.footer{font-size:9pt;padding-top:15px;margin-top:24px}.reading-note{font-size:9pt}}
"""
body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
html = f'''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Impeccable 4.8.0 繁體中文操作手冊：以 Codex 與美股網站為例，說明設計指令、提示詞、審查與發布。">
<title>{title}</title><style>{CSS}</style></head><body>
<header class="masthead"><div class="masthead-inner"><div class="topline"><span>Northstar 專案使用手冊</span><nav class="guide-actions" aria-label="閱讀格式"><a href="impeccable.zh-Hant.pdf" download>下載 PDF</a><a href="https://angusqaq.github.io/stock-website/">返回美股研究工作台</a></nav></div>
<h1 class="title">{title}</h1><p>從產品背景、設計評估到逐輪改善與發布。範例指令可直接貼到 Codex；涵蓋 Impeccable 4.8.0 的 24 個設計指令。</p></div></header>
<div class="layout"><aside class="contents" aria-label="章節目錄"><h2>閱讀目錄</h2>{renderer.toc}</aside>
<main class="article"><details class="mobile-contents"><summary>展開章節目錄</summary>{renderer.toc}</details>{body}
<p class="reading-note">離線閱讀：使用瀏覽器的列印功能（macOS：⌘P），即可另存 PDF。本文以安裝版本為準，網站功能狀態需另外驗證。</p></main></div>
<footer class="footer"><span>Impeccable 4.8.0 · Engine 0.1.18</span><span>繁體中文 · Codex / macOS · Northstar</span></footer></body></html>
'''
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(html, encoding="utf-8")
print(f"Rendered {SOURCE.relative_to(ROOT)} → {OUTPUT.relative_to(ROOT)}")
