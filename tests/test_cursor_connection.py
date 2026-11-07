import importlib.util
import io
import json
from pathlib import Path
import unittest
import urllib.error

spec = importlib.util.spec_from_file_location("cursor_check", Path(__file__).parents[1] / "scripts/check-cursor.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Opener:
    def __init__(self, response=None, error=None):
        self.response, self.error, self.requests = response, error, []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        if self.error:
            raise self.error
        return io.BytesIO(json.dumps(self.response).encode())


class CursorConnectionTests(unittest.TestCase):
    def test_missing_secret_does_not_contact_a_service(self):
        opener = Opener()
        self.assertEqual(module.check_connection(None, opener)["status"], "missing-secret")
        self.assertFalse(opener.requests)

    def test_only_reads_official_account_and_never_returns_credentials_or_personal_data(self):
        opener = Opener({"userEmail": "private@example.test", "userFirstName": "Test only", "apiKeyName": "Fixture"})
        result = module.check_connection("test-secret-not-a-real-key", opener)
        request, timeout = opener.requests[0]
        self.assertEqual(request.full_url, "https://api.cursor.com/v1/me")
        self.assertEqual(request.get_method(), "GET")
        self.assertIsNone(request.data)
        self.assertEqual(timeout, 20)
        self.assertTrue(result["connected"])
        output = json.dumps(result)
        self.assertNotIn("test-secret", output)
        self.assertNotIn("private@example", output)

    def test_errors_do_not_echo_provider_bodies_that_may_contain_secrets(self):
        for status in (301, 401, 403, 404, 429, 500):
            error = urllib.error.HTTPError(module.CURSOR_ACCOUNT_URL, status, "sensitive body", {}, None)
            result = module.check_connection("fixture-key", Opener(error=error))
            self.assertFalse(result["connected"])
            self.assertNotIn("sensitive", json.dumps(result))
            self.assertEqual(result["httpStatus"], status)

    def test_unexpected_json_is_not_authentication_success(self):
        for data in ([], {}, {"error": "unverified"}, {"user": "wrong shape"}):
            self.assertFalse(module.check_connection("fixture-key", Opener(data))["connected"])

    def test_authentication_is_not_forwarded_on_redirect(self):
        self.assertIsNone(module.NoRedirect().redirect_request(None, None, 302, "", {}, "https://example.test/"))


if __name__ == "__main__":
    unittest.main()
