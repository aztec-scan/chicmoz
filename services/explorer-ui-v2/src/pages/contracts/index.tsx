import { type FC, useState } from "react";
import { ConsoleHead, Shell } from "~/components/layout";
import {
  useContractClassesSummary,
  usePaginatedContractClasses,
  usePaginatedContractInstances,
  useTotalContractInstances,
  useTotalContracts,
} from "~/hooks/api";
import { type ContractFilter } from "~/hooks/api/contract";
import { fmtNum } from "~/lib/utils";
import { ClassesPanel } from "./classes-panel";
import { InstancesPanel } from "./instances-panel";

const PAGE_SIZE = 14;

export const ContractsPage: FC = () => {
  const { data: totalClassesStr } = useTotalContracts();
  const { data: totalInstancesStr } = useTotalContractInstances();
  const { data: summary } = useContractClassesSummary();

  const totalClasses = Number(totalClassesStr ?? 0);
  const totalInstances = Number(totalInstancesStr ?? 0);
  const verifiedCount = summary?.verifiedClasses ?? 0;
  const protocolCount = summary?.protocolClasses ?? 0;
  const verifiedPct = totalClasses
    ? Math.round((100 * verifiedCount) / totalClasses)
    : 0;

  const [classesPage, setClassesPage] = useState(0);
  const [instancesPage, setInstancesPage] = useState(0);
  const [classesFilter, setClassesFilter] = useState<ContractFilter>("all");
  const [instancesFilter, setInstancesFilter] = useState<ContractFilter>("all");

  const { data: classes } = usePaginatedContractClasses(
    classesPage,
    PAGE_SIZE,
    classesFilter,
  );
  const { data: instances } = usePaginatedContractInstances(
    instancesPage,
    PAGE_SIZE,
    instancesFilter,
  );

  const handleClassesFilterChange = (f: ContractFilter) => {
    setClassesFilter(f);
    setClassesPage(0);
  };

  const handleInstancesFilterChange = (f: ContractFilter) => {
    setInstancesFilter(f);
    setInstancesPage(0);
  };

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
        <ClassesPanel
          classes={classes}
          totalClasses={totalClasses}
          page={classesPage}
          onPageChange={setClassesPage}
          pageSize={PAGE_SIZE}
          filter={classesFilter}
          onFilterChange={handleClassesFilterChange}
        />
        <InstancesPanel
          instances={instances}
          totalInstances={totalInstances}
          page={instancesPage}
          onPageChange={setInstancesPage}
          pageSize={PAGE_SIZE}
          filter={instancesFilter}
          onFilterChange={handleInstancesFilterChange}
        />
      </div>
    </Shell>
  );
};
