from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from trips.serializers import GeocodeSearchSerializer, PlanTripSerializer
from trips.services.geocode import GeocodeError, geocode_address, search_addresses
from trips.services.orchestrator import plan_trip
from trips.services.routing import RoutingError


class PlanTripView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PlanTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        options = data.get("options")
        if options is not None:
            options = dict(options)
        try:
            result = plan_trip(
                current_location=data["current_location"],
                pickup_location=data["pickup_location"],
                dropoff_location=data["dropoff_location"],
                current_cycle_used_hours=data["current_cycle_used_hours"],
                options=options,
            )
            return Response(result)
        except GeocodeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except RoutingError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeocodeSearchView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        serializer = GeocodeSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        q = serializer.validated_data["q"]
        limit = serializer.validated_data["limit"]
        try:
            results = search_addresses(q, limit=limit)
            return Response({"results": results})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})
