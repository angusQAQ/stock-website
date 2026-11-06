"""Offline source-parser tests. No financial endpoints or model calls."""
import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location("research_data", Path(__file__).resolve().parents[1] / "scripts/research_data.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublicResearchTests(unittest.TestCase):
    def test_financial_periods_do_not_confuse_ytd_with_quarter_or_use_future_filings(self):
        rows = [
            {"start": "2026-01-01", "end": "2026-09-30", "filed": "2026-10-25", "form": "10-Q", "val": 900},
            {"start": "2026-07-01", "end": "2026-09-30", "filed": "2026-10-25", "form": "10-Q", "val": 300},
            {"start": "2026-07-01", "end": "2026-09-30", "filed": "2026-11-07", "form": "10-Q/A", "val": 999},
        ]
        data = {"facts": {"us-gaap": {"Revenues": {"units": {"USD": rows}}}}}
        result = module.parse_company_facts(data, "2026-11-06")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["value"], 300)
        self.assertEqual(result[0]["periodType"], "quarter")
        self.assertEqual(result[0]["filed"], "2026-10-25")

    def test_form4_preserves_tax_code_and_unknown_price_instead_of_calling_it_bearish(self):
        root = ET.fromstring("""<ownershipDocument><reportingOwner><rptOwnerName>TEST OWNER</rptOwnerName></reportingOwner><nonDerivativeTable><nonDerivativeTransaction><transactionDate><value>2026-11-01</value></transactionDate><transactionCoding><transactionCode>F</transactionCode></transactionCoding><transactionAmounts><transactionShares><value>100</value></transactionShares><transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction></nonDerivativeTable></ownershipDocument>""")
        row = module.parse_form4(root)[0]
        self.assertEqual(row["code"], "F")
        self.assertEqual(row["shares"], 100)
        self.assertIsNone(row["price"])
        self.assertIn("未知", row["plan10b5_1"])

    def test_option_ratios_require_both_sides_and_complete_coverage(self):
        chain = {"expirationDate": 1796342400, "calls": [{"volume": 20, "openInterest": 100}], "puts": [{"volume": 10, "openInterest": 40}]}
        data = {"optionChain": {"result": [{"options": [chain]}]}}
        result = module.parse_options(data, "2026-11-06")
        self.assertEqual(result["putCallVolume"], 0.5)
        self.assertEqual(result["putCallOpenInterest"], 0.4)
        chain["puts"].append({"volume": None})
        self.assertIsNone(module.parse_options(data, "2026-11-06")["putCallVolume"])
        chain["puts"] = []
        with self.assertRaises(ValueError):
            module.parse_options(data, "2026-11-06")

    def test_source_denials_remain_explicit_gaps(self):
        calls = []
        def denied(url, **kwargs):
            calls.append(url)
            raise PermissionError("test denied")
        bundle = module.collect({"quote": {"symbol": "AAPL"}}, fetch=denied, now=datetime(2026, 11, 6, tzinfo=timezone.utc))
        self.assertIsNone(bundle["options"])
        self.assertIsNone(bundle["financials"])
        self.assertEqual(bundle["newsDiscovery"], [])
        self.assertEqual(len(bundle["missingData"]), 3)
        self.assertTrue(all(url.startswith("https://") for url in calls))

    def test_rss_drops_future_articles_and_never_marks_headlines_verified(self):
        root = ET.fromstring("""<rss><channel><item><title>Past test headline</title><link>https://example.com/old</link><pubDate>Thu, 05 Nov 2026 12:00:00 GMT</pubDate></item><item><title>Future</title><link>https://example.com/future</link><pubDate>Sat, 07 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>""")
        def source(url, **kwargs):
            if "news.google.com" in url:
                return root
            raise ValueError("offline fixture")
        bundle = module.collect({"quote": {"symbol": "SPY"}}, fetch=source, now=datetime(2026, 11, 6, 12, tzinfo=timezone.utc))
        self.assertEqual(len(bundle["newsDiscovery"]), 1)
        self.assertFalse(bundle["newsDiscovery"][0]["verified"])
        self.assertIn("ETF", bundle["missingData"][-1])

    def test_sec_is_not_contacted_without_a_real_contact_setting(self):
        with patch.dict("os.environ", {"NORTHSTAR_SEC_USER_AGENT": ""}), patch.object(module.urllib.request, "urlopen") as network:
            with self.assertRaises(ValueError):
                module.read("https://data.sec.gov/submissions/CIK0000320193.json", sec=True)
            network.assert_not_called()


if __name__ == "__main__":
    unittest.main()
