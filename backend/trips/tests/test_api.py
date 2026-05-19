from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from trips.views import GeocodeSearchView, HealthView, PlanTripView


class ApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_health(self):
        request = self.factory.get("/api/health/")
        response = HealthView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")

    def test_plan_trip_validation(self):
        request = self.factory.post("/api/plan-trip/", {}, format="json")
        response = PlanTripView.as_view()(request)
        self.assertEqual(response.status_code, 400)

    @patch("trips.views.plan_trip")
    def test_plan_trip_success(self, mock_plan):
        mock_plan.return_value = {
            "route": {"total_miles": 100, "duration_hours": 2, "polyline": [], "estimated_days": 1},
            "locations": {},
            "stops": [],
            "route_instructions": [],
            "segments": [],
            "daily_logs": [],
            "warnings": [],
            "summary": "ok",
        }
        request = self.factory.post(
            "/api/plan-trip/",
            {
                "current_location": "Chicago, IL",
                "pickup_location": "Denver, CO",
                "dropoff_location": "Los Angeles, CA",
                "current_cycle_used_hours": 10,
                "options": {"use_sleeper_berth": True},
            },
            format="json",
        )
        response = PlanTripView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"], "ok")
        mock_plan.assert_called_once()
        call_kw = mock_plan.call_args.kwargs
        self.assertTrue(call_kw["options"]["use_sleeper_berth"])

    @patch("trips.views.search_addresses")
    def test_geocode_search(self, mock_search):
        mock_search.return_value = [{"value": "Chicago, IL", "label": "Chicago", "lat": 41.8, "lon": -87.6}]
        request = self.factory.get("/api/geocode/search/", {"q": "Chicago"})
        response = GeocodeSearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
