import { type FC } from "react";
import { L2AddressLink } from "~/components/common";
import { fmtNum, truncateHashString } from "~/lib/utils";

interface PrivateLog {
  fields: string[];
  emittedLength: number;
}

interface PublicLog {
  contractAddress: string;
  fields: string[];
}

interface ContractClassLog {
  contractAddress: string;
  fields: string[];
  emittedLength: number;
}

interface Props {
  privateLogs: PrivateLog[];
  publicLogs: PublicLog[];
  contractClassLogs: ContractClassLog[];
}

const FieldList: FC<{ fields: string[] }> = ({ fields }) => (
  <details className="log-fields">
    <summary>show fields</summary>
    <div className="log-fields-grid">
      {fields.map((f, i) => (
        <div key={i} className="log-field-row">
          <span className="idx">F{i}</span>
          <span className="v" title={f}>
            {truncateHashString(f, 14, 12)}
          </span>
        </div>
      ))}
    </div>
  </details>
);

const Section: FC<{
  title: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}> = ({ title, count, emptyMessage, children }) => (
  <div className="log-section">
    <div className="log-section-head">
      <h4>
        {title}
        <span className="c">{count}</span>
      </h4>
    </div>
    {count === 0 ? (
      <div className="empty-state">{emptyMessage}</div>
    ) : (
      <div className="log-list">{children}</div>
    )}
  </div>
);

export const LogsPanel: FC<Props> = ({
  privateLogs,
  publicLogs,
  contractClassLogs,
}) => {
  return (
    <div className="logs-panel">
      <Section
        title="Private logs"
        count={privateLogs.length}
        emptyMessage="no private logs"
      >
        {privateLogs.map((log, i) => (
          <div key={i} className="log-entry">
            <div className="log-entry-head">
              <span className="idx">#{i}</span>
              <span className="meta">
                {fmtNum(log.fields.length)} fields
                <span className="sep">·</span>
                emittedLen {fmtNum(log.emittedLength)}
              </span>
            </div>
            <FieldList fields={log.fields} />
          </div>
        ))}
      </Section>

      <Section
        title="Public logs"
        count={publicLogs.length}
        emptyMessage="no public logs"
      >
        {publicLogs.map((log, i) => (
          <div key={i} className="log-entry">
            <div className="log-entry-head">
              <span className="idx">#{i}</span>
              <L2AddressLink address={log.contractAddress} />
              <span className="meta">{fmtNum(log.fields.length)} fields</span>
            </div>
            <FieldList fields={log.fields} />
          </div>
        ))}
      </Section>

      <Section
        title="Contract class logs"
        count={contractClassLogs.length}
        emptyMessage="no contract class logs"
      >
        {contractClassLogs.map((log, i) => (
          <div key={i} className="log-entry">
            <div className="log-entry-head">
              <span className="idx">#{i}</span>
              <L2AddressLink address={log.contractAddress} />
              <span className="meta">
                {fmtNum(log.fields.length)} fields
                <span className="sep">·</span>
                emittedLen {fmtNum(log.emittedLength)}
              </span>
            </div>
            <FieldList fields={log.fields} />
          </div>
        ))}
      </Section>
    </div>
  );
};
