import { type FC } from "react";
import { InfoCard } from "~/components/info-card";
import { HealthStatus, type EvaluatedSystemHealth } from "~/hooks";

interface Props {
  systemHealth: EvaluatedSystemHealth;
}

export const SystemHealthOverview: FC<Props> = ({ systemHealth }) => {
  const { components } = systemHealth;

  // Extract individual component health for InfoCards
  const apiConnectivity = components.find(c => c.componentId === "API-connectivity");
  const apiLiveness = components.find(c => c.componentId === "API-livesness");
  const apiQuality = components.find(c => c.componentId === "API-quality");
  const indexer = components.find(c => c.componentId === "Indexer");
  const webSocket = components.find(c => c.componentId === "WebSocket");

  const getHealthStatusText = (health: HealthStatus) => {
    switch (health) {
      case HealthStatus.UP:
        return "✅ UP";
      case HealthStatus.UNHEALTHY:
        return "⚠️ UNHEALTHY";
      case HealthStatus.DOWN:
        return "🛑 DOWN";
      default:
        return "❓ UNKNOWN";
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-5 md:gap-5">
      <InfoCard
        title="API Connectivity"
        header={getHealthStatusText(apiConnectivity?.health ?? HealthStatus.DOWN)}
        details={apiConnectivity?.description}
        isLoading={false}
        error={null}
      />
      <InfoCard
        title="API Liveness"
        header={getHealthStatusText(apiLiveness?.health ?? HealthStatus.DOWN)}
        details={apiLiveness?.description}
        isLoading={false}
        error={null}
      />
      <InfoCard
        title="API Quality"
        header={getHealthStatusText(apiQuality?.health ?? HealthStatus.DOWN)}
        details={apiQuality?.description}
        isLoading={false}
        error={null}
      />
      <InfoCard
        title="Indexer"
        header={getHealthStatusText(indexer?.health ?? HealthStatus.DOWN)}
        details={indexer?.description}
        isLoading={false}
        error={null}
      />
      <InfoCard
        title="WebSocket"
        header={getHealthStatusText(webSocket?.health ?? HealthStatus.DOWN)}
        details={webSocket?.description}
        isLoading={false}
        error={null}
      />
    </div>
  );
};
