import { type FC } from "react";
import { type ComponentHealth } from "~/hooks/use-system-health";
import { statusCopy } from "./status-copy";

interface ComponentCardProps {
  component: ComponentHealth;
}

export const ComponentCard: FC<ComponentCardProps> = ({ component }) => {
  const status = statusCopy(component.health);

  return (
    <div className={`health-component-card ${status.tone}`}>
      <div className="health-component-topline">
        <span className={`hc-dot ${status.tone === "ok" ? "" : status.tone}`} />
        <span className="status-pill-label">{status.label}</span>
      </div>
      <h3>{component.componentId}</h3>
      <p>{component.description}</p>
      <div className="health-component-detail" title={component.evaluationDetails}>
        {component.evaluationDetails || "no detail available"}
      </div>
    </div>
  );
};
