import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Statistika</p>
          <h1>Analitika</h1>
          <p>
            NFC ochilishlari, gazeta betlari va maqola ko‘rishlarini real vaqtga yaqin kuzating.
          </p>
        </div>
      </header>

      <AnalyticsDashboard />
    </>
  );
}
