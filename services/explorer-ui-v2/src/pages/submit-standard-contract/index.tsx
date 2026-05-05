import {
  CONTRACT_STANDARDS,
  type ContractStandardVersion,
} from "@chicmoz-pkg/types";
import { useParams } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { ContractL2API } from "~/api";
import { CopyableAddress } from "~/components/common";
import { ConsoleHead, Shell } from "~/components/layout";
import { truncateHashString } from "~/lib/utils";

export const SubmitStandardContractPage: FC = () => {
  const { id, version } = useParams({
    from: "/contracts/classes/$id/versions/$version/submit-standard-contract",
  });

  const [standardVersion, setStandardVersion] = useState<string>("");
  const [standardName, setStandardName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const availableVersions = Object.keys(CONTRACT_STANDARDS);
  const availableNames = standardVersion
    ? CONTRACT_STANDARDS[standardVersion as ContractStandardVersion] ?? []
    : [];

  const handleVersionChange = (v: string): void => {
    setStandardVersion(v);
    setStandardName("");
    setResult(null);
  };

  const handleNameChange = (n: string): void => {
    setStandardName(n);
    setResult(null);
  };

  const onSubmit = async (): Promise<void> => {
    if (!standardVersion || !standardName) {
      setResult({
        ok: false,
        message: "Please select both a version and a contract type.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      await ContractL2API.submitStandardContract({
        classId: id,
        version,
        standardVersion,
        standardName,
      });
      setResult({
        ok: true,
        message: "Standard contract submitted successfully.",
      });
    } catch (err) {
      setResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "Failed to submit standard contract.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = !standardVersion || !standardName || isSubmitting;

  return (
    <Shell active="contracts">
      <ConsoleHead
        crumbs={[
          { label: "aztec-scan", to: "/" },
          { label: "contracts", to: "/contracts" },
          { label: "class", to: "/contracts" },
          { label: `${truncateHashString(id, 8, 6)} v${version}` },
          { label: "submit-standard", active: true },
        ]}
        comment="propose a standard-contract match for this class"
      />

      <div className="panel submit-panel">
        <div className="panel-head">
          <h3>Submit standard contract</h3>
        </div>

        <div className="kv-grid">
          <div className="kv wide">
            <span className="k">Class ID</span>
            <span className="v">
              <CopyableAddress value={id} title="Copy class id" />
            </span>
          </div>
          <div className="kv wide">
            <span className="k">Version</span>
            <span className="v">v{version}</span>
          </div>
        </div>

        <div className="submit-form">
          <div className="submit-field">
            <label htmlFor="std-version">Standard contract version</label>
            <select
              id="std-version"
              value={standardVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="submit-select"
            >
              <option value="">select a version…</option>
              {availableVersions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="submit-field">
            <label htmlFor="std-name">Contract type</label>
            <select
              id="std-name"
              value={standardName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="submit-select"
              disabled={!standardVersion}
            >
              <option value="">
                {standardVersion ? "select a type…" : "pick a version first"}
              </option>
              {availableNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="submit-actions">
            <button
              type="button"
              className="submit-btn"
              onClick={() => void onSubmit()}
              disabled={disabled}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>

          {result && (
            <div
              className={`submit-result${result.ok ? " ok" : " err"}`}
              role="alert"
            >
              {result.message}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};
