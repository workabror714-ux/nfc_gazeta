from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsActiveAdmin

from .serializers import PublicAnalyticsEventSerializer
from .services import build_analytics_overview


class PublicAnalyticsTrackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request: Request) -> Response:
        serializer = PublicAnalyticsEventSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        visit = serializer.save()

        return Response(
            {
                "accepted": True,
                "created": getattr(serializer, "was_created", True),
                "event_id": visit.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AdminAnalyticsOverviewView(APIView):
    permission_classes = [IsActiveAdmin]

    def get(self, request: Request) -> Response:
        raw_days = request.query_params.get("days", "30")

        try:
            days = int(raw_days)
        except (TypeError, ValueError):
            days = 30

        days = max(1, min(days, 365))

        return Response(
            build_analytics_overview(days),
            status=status.HTTP_200_OK,
        )
