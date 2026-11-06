"""Read public research inputs on the user's Mac, only after a job is claimed.

Uses stdlib, does not require API keys, never bypasses source access controls.
Unavailable != zero. RSS headlines are discovery inputs, not verified events.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime


def read(url: str, *, xml=False, sec=False):
    headers = {"User-Agent": "NorthstarPersonalResearch/0.3", "Accept": "application/json"}
    if sec:
        agent = os.environ.get("NORTHSTAR_SEC_USER_AGENT", "")
        if not re.search(r"[^\s@]+@[^\s@]+\.[^\s@]+", agent):
            raise ValueError("SEC 需要 NORTHSTAR_SEC_USER_AGENT（應用名稱及真實聯絡電郵）；未設定時不發送 SEC 請求。")
        headers["User-Agent"] = agent
        time.sleep(0.2)  # Sequential requests: below SEC's 10 requests/sec ceiling.
    if xml:
        headers["Accept"] = "application/xml,text/xml,application/rss+xml"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=12) as response:
        content = response.read(8_000_001)
    if len(content) > 8_000_000:
        raise ValueError("來源資料超過單次大小限制。")
    return ET.fromstring(content) if xml else json.loads(content)


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def iso_day(value):
    return datetime.fromtimestamp(value, timezone.utc).date().isoformat()


def parse_company_facts(data: dict, today: str):
    """Select a real filed annual/quarter record, never label YTD as a quarter.

    Exclude later amendments not yet available at the research cutoff, and keep
    each metric's own period, unit and accession. Do not combine unlike periods.
    """
    tags = {
        "revenue": ("RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"),
        "netIncome": ("NetIncomeLoss", "ProfitLoss"),
        "operatingCashFlow": ("NetCashProvidedByUsedInOperatingActivities",),
        "capex": ("PaymentsToAcquirePropertyPlantAndEquipment",),
        "dilutedEPS": ("EarningsPerShareDiluted",),
        "cash": ("CashAndCashEquivalentsAtCarryingValue",),
        "debtComponent": ("LongTermDebtCurrent", "LongTermDebtNoncurrent"),
    }
    results = []
    facts = data.get("facts", {}).get("us-gaap", {})
    for label, candidates in tags.items():
        for tag in candidates:
            found = []
            for unit, entries in facts.get(tag, {}).get("units", {}).items():
                if unit not in {"USD", "USD/shares"}:
                    continue
                for item in entries:
                    if not finite(item.get("val")) or not item.get("filed") or item["filed"] > today or item.get("end", "9999") > today:
                        continue
                    if item.get("form") not in {"10-Q", "10-K", "10-Q/A", "10-K/A"}:
                        continue
                    if item.get("start"):
                        try:
                            duration = (datetime.fromisoformat(item["end"]) - datetime.fromisoformat(item["start"])).days
                        except (ValueError, KeyError):
                            continue
                        period_type = "quarter" if 75 <= duration <= 105 else "annual" if 330 <= duration <= 380 else None
                        if not period_type:
                            continue
                    else:
                        period_type = "instant"
                    found.append({"label": label, "tag": tag, "unit": unit, "value": item["val"], "periodType": period_type,
                                  **{key: item.get(key) for key in ("start", "end", "filed", "accn", "form")}})
            if found:
                # Retain the latest available quarter and annual figure separately.
                for kind in ("quarter", "annual", "instant"):
                    selected = sorted((x for x in found if x["periodType"] == kind), key=lambda x: (x["end"], x["filed"]), reverse=True)
                    if selected:
                        results.append(selected[0])
                break
    return results


def parse_form4(root):
    for element in root.iter():
        element.tag = element.tag.split("}")[-1]
    owner = root.findtext(".//rptOwnerName")
    rows = []
    for transaction in root.findall(".//nonDerivativeTransaction"):
        def number(path):
            try:
                value = float(transaction.findtext(path, ""))
                return value if math.isfinite(value) else None
            except ValueError:
                return None
        rows.append({"owner": owner, "date": transaction.findtext("transactionDate/value"),
                     "code": transaction.findtext("transactionCoding/transactionCode"),
                     "shares": number("transactionAmounts/transactionShares/value"),
                     "price": number("transactionAmounts/transactionPricePerShare/value"),
                     "acquiredDisposed": transaction.findtext("transactionAmounts/transactionAcquiredDisposedCode/value"),
                     "plan10b5_1": "須核對原始文件及註腳；未知"})
    return rows


def parse_options(data, today: str):
    result = data.get("optionChain", {}).get("result", [])
    if not result or not result[0].get("options"):
        raise ValueError("來源沒有提供可用的 Call／Put 鏈。")
    chain = result[0]["options"][0]
    expiration = chain.get("expirationDate")
    if not finite(expiration) or iso_day(expiration) < today:
        raise ValueError("來源期權到期日已過或缺漏。")
    summary = {"expiration": iso_day(expiration), "calls": {}, "puts": {},
               "note": "僅單一到期日。成交量與未平倉合約日期可能不同；Call 不等於看多，Put 不等於看跌。沒有買賣方向或對沖資料，不能推定資金流向。"}
    for side in ("calls", "puts"):
        rows = chain.get(side, [])
        if not rows:
            raise ValueError("期權鏈缺少 Call 或 Put 一側，不推算比率。")
        for field in ("volume", "openInterest"):
            values = [row[field] for row in rows if finite(row.get(field)) and row[field] >= 0]
            # A partially supplied chain is not a complete-market aggregate.
            summary[side][field] = sum(values) if len(values) == len(rows) else None
            summary[side][field + "Coverage"] = f"{len(values)}/{len(rows)}"
        summary[side]["contracts"] = len(rows)
        dates = [row["lastTradeDate"] for row in rows if finite(row.get("lastTradeDate"))]
        summary[side]["latestTrade"] = datetime.fromtimestamp(max(dates), timezone.utc).isoformat() if dates else None
    for field in ("volume", "openInterest"):
        call, put = summary["calls"][field], summary["puts"][field]
        summary["putCall" + field[0].upper() + field[1:]] = put / call if call and put is not None else None
    return summary


def collect(snapshot: dict, *, fetch=read, now=None):
    now = now or datetime.now(timezone.utc)
    today, start = now.date().isoformat(), (now - timedelta(days=30)).date().isoformat()
    symbol = snapshot["quote"]["symbol"]
    if not re.fullmatch(r"[A-Z][A-Z0-9.-]{0,9}", symbol):
        raise ValueError("無效股票代碼。")
    encoded = urllib.parse.quote(symbol, safe="")
    bundle = {"collectedAt": now.isoformat(), "newsWindow": {"start": start, "end": today},
              "financials": None, "insiders": None, "options": None, "newsDiscovery": [], "missingData": [],
              "flowCaution": "日 K 線的 CMF／OBV 是價量代理，不是機構淨流入。13F 是延遲的持倉申報，不是當日資金流。"}
    def failure(label, error):
        # No response bodies, request headers or credentials enter the model input.
        detail = str(error) if isinstance(error, ValueError) else type(error).__name__
        bundle["missingData"].append(f"{label}：{detail[:250]}")
    try:
        query = urllib.parse.urlencode({"q": f'{symbol} stock after:{start} before:{(now+timedelta(days=1)).date().isoformat()}', "hl": "en-US", "gl": "US", "ceid": "US:en"})
        root = fetch("https://news.google.com/rss/search?" + query, xml=True)
        for item in root.findall("./channel/item"):
            try:
                published = parsedate_to_datetime(item.findtext("pubDate", "")).astimezone(timezone.utc)
            except (ValueError, TypeError):
                continue
            if not start <= published.date().isoformat() <= today or published > now:
                continue
            link = item.findtext("link", "")
            if link.startswith("https://"):
                bundle["newsDiscovery"].append({"title": item.findtext("title", "")[:500], "url": link,
                    "publishedAt": published.isoformat(), "verified": False, "scope": "headline-only；須精讀發布者原文後才可引用為事實"})
            if len(bundle["newsDiscovery"]) >= 12:
                break
        if not bundle["newsDiscovery"]:
            bundle["missingData"].append("最近 30 天未取得可驗證日期的新聞線索；不表示期間沒有新聞。")
    except Exception as error:
        failure("新聞發現", error)
    try:
        url = f"https://query1.finance.yahoo.com/v7/finance/options/{encoded}"
        data = fetch(url)
        results = data.get("optionChain", {}).get("result", [])
        expirations = results[0].get("expirationDates", []) if results else []
        target = int((now + timedelta(days=30)).timestamp())
        dates = [value for value in expirations if finite(value) and value >= now.timestamp()]
        if dates:
            chosen = min(dates, key=lambda value: abs(value-target))
            data = fetch(url + "?date=" + str(int(chosen)))
        bundle["options"] = {"url": url, "retrievedAt": now.isoformat(), "data": parse_options(data, today), "delay": "來源延遲未核實"}
    except Exception as error:
        failure("Call／Put 公開資料", error)
    if snapshot["quote"].get("symbol") in {"VOO", "SPY", "QQQ", "VTI", "SCHD", "BND"}:
        bundle["missingData"].append("此標的是 ETF：公司式營收／EPS 及高管 Form 4 不適用，須改查基金持倉、費用及發行商披露。")
        return bundle
    try:
        tickers = fetch("https://www.sec.gov/files/company_tickers.json", sec=True)
        company = next((item for item in tickers.values() if item["ticker"].replace(".", "-") == symbol), None)
        if not company:
            raise ValueError("SEC 代碼表未找到公司，不推定沒有財報。")
        cik = str(company["cik_str"]).zfill(10)
        facts_url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
        facts = fetch(facts_url, sec=True)
        bundle["financials"] = {"url": facts_url, "retrievedAt": now.isoformat(), "metrics": parse_company_facts(facts, today)}
        if not bundle["financials"]["metrics"]:
            bundle["missingData"].append("SEC 沒有可用的 US-GAAP 財務數值，可能需要 IFRS 或原始報表；不得補零。")
        filings_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
        recent = fetch(filings_url, sec=True).get("filings", {}).get("recent", {})
        filings, transactions, attempts = [], [], 0
        for index, form in enumerate(recent.get("form", [])):
            if form not in {"4", "4/A"} or not start <= recent["filingDate"][index] <= today:
                continue
            accession = recent["accessionNumber"][index].replace("-", "")
            document = recent["primaryDocument"][index]
            # XSL stylesheet paths cannot be parsed as Form 4 XML; request the
            # same filing's raw XML by the basename, preserving SEC's origin.
            name = document.rsplit("/", 1)[-1]
            if not name.lower().endswith(".xml"):
                continue
            if attempts >= 5:
                break
            attempts += 1
            filing_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{urllib.parse.quote(name)}"
            try:
                rows = parse_form4(fetch(filing_url, xml=True, sec=True))
                filings.append({"url": filing_url, "filed": recent["filingDate"][index]})
                transactions.extend({**row, "url": filing_url} for row in rows if row.get("date") and row["date"] <= today)
            except Exception as error:
                failure("個別 Form 4", error)
        bundle["insiders"] = {"url": filings_url, "filings": filings, "transactions": transactions,
                               "coverage": "僅 issuer submissions 最近 30 天、最多五份文件；不保證涵蓋所有內部人士。P/S、授股、行權及扣稅須分開。"}
        if not filings:
            bundle["missingData"].append("此檢索範圍未取得 Form 4，不等於沒有高管交易。")
    except Exception as error:
        failure("SEC 財報／高管申報", error)
    return bundle
