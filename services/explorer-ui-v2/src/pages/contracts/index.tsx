import { type FC } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useLatestContractClasses,
  useLatestContractInstances,
} from "~/hooks/api";
import { fmtNum } from "~/lib/utils";
import { ClassesPanel } from "./classes-panel";
import { InstancesPanel } from "./instances-panel";

export const ContractsPage: FC = () => {
  const { data: classes } = useLatestContractClasses();
  const { data: instances } = useLatestContractInstances();

  const totalClasses = classes?.length ?? 0;
  const totalInstances = instances?.length ?? 0;
  const verifiedCount = classes?.filter((c) => !!c.sourceCodeUrl).length ?? 0;
  const protocolCount =
    classes?.filter((c) => !!c.standardContractType).length ?? 0;
  const verifiedPct = totalClasses
    ? Math.round((100 * verifiedCount) / totalClasses)
    : 0;

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", active: true },
        ]}
        comment="classes (code) + instances (deployments)"
      />

      <div className="stats-strip">
        <div className="sc">
          <div className="lbl">Total contract classes</div>
          <div className="val">{fmtNum(totalClasses)}</div>
          <div className="sub">registered</div>
        </div>
        <div className="sc">
          <div className="lbl">Total instances</div>
          <div className="val">{fmtNum(totalInstances)}</div>
          <div className="sub">across all classes</div>
        </div>
        <div className="sc">
          <div className="lbl">Verified</div>
          <div className="val">
            {verifiedPct}
            <span className="u">%</span>
          </div>
          <div className="sub">of all classes</div>
        </div>
        <div className="sc">
          <div className="lbl">Protocol contracts</div>
          <div className="val">{protocolCount}</div>
          <div className="sub">fee-juice · registry · …</div>
        </div>
      </div>

      <div className="twin">
        <ClassesPanel classes={classes} />
        <InstancesPanel instances={instances} />
      </div>
    </Shell>
  );
};
