from django.urls import path

from trips.views import GeocodeSearchView, HealthView, PlanTripView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
    path("geocode/search/", GeocodeSearchView.as_view(), name="geocode-search"),
]
