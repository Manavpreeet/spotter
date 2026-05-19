from rest_framework import serializers


class TripOptionsSerializer(serializers.Serializer):
    use_sleeper_berth = serializers.BooleanField(default=False)
    allow_34_hour_restart = serializers.BooleanField(default=False)
    carrier_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    driver_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    co_driver_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    vehicle_number = serializers.CharField(max_length=80, required=False, allow_blank=True)
    trailer_number = serializers.CharField(max_length=80, required=False, allow_blank=True)
    shipping_document = serializers.CharField(max_length=200, required=False, allow_blank=True)
    home_terminal = serializers.CharField(max_length=200, required=False, allow_blank=True)
    prior_cycle_daily_hours = serializers.ListField(
        child=serializers.FloatField(min_value=0, max_value=24),
        required=False,
        allow_null=True,
        max_length=7,
    )


class PlanTripSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=500)
    pickup_location = serializers.CharField(max_length=500)
    dropoff_location = serializers.CharField(max_length=500)
    current_cycle_used_hours = serializers.FloatField(min_value=0, max_value=70, default=0)
    options = TripOptionsSerializer(required=False)


class GeocodeSearchSerializer(serializers.Serializer):
    q = serializers.CharField(max_length=200)
    limit = serializers.IntegerField(min_value=1, max_value=15, default=8)
