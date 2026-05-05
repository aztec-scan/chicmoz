import { type FC } from "react";
import { type ContractClassSourceResponse } from "~/api/contract";

interface Props {
  source: ContractClassSourceResponse | undefined;
  verified: boolean;
}

export const SourceTab: FC<Props> = ({ source, verified }) => (
  <div className="source-block">
    <div className="source-meta">
      {source?.sourceCodeUrl && (
        <div>
          <span className="k">Source</span>
          <a href={source.sourceCodeUrl} target="_blank" rel="noreferrer">
            {source.sourceCodeUrl.replace("https://", "")}
          </a>
        </div>
      )}
      {source?.sourceCodeCommitHash && (
        <div>
          <span className="k">Commit</span>
          {source.sourceCodeCommitHash.slice(0, 8)}
        </div>
      )}
      {source?.aztecVersion && (
        <div>
          <span className="k">Aztec version</span>
          {source.aztecVersion}
        </div>
      )}
      {source && (
        <div>
          <span className="k">Match</span>
          <span style={{ color: "var(--green)" }}>● bytecode verified</span>
        </div>
      )}
    </div>
    {source?.sourceCode?.length ? (
      source.sourceCode.slice(0, 3).map((entry, i) => (
        <pre key={`${entry.path}-${i}`} className="code">
          <span className="cmt">// {entry.path}</span>
          {"\n"}
          {entry.content ?? ""}
        </pre>
      ))
    ) : (
      <div className="empty-state" style={{ background: "var(--bg-1)" }}>
        {verified
          ? "source not yet fetched"
          : "contract class is unverified — submit source to verify"}
      </div>
    )}
  </div>
);
