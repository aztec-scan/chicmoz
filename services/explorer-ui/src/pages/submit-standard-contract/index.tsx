import {
  CONTRACT_STANDARDS,
  type ContractStandardVersion,
} from "@chicmoz-pkg/types";
import { useParams } from "@tanstack/react-router";
import { useState, type FC } from "react";
import { ContractL2API } from "~/api/contract";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSubTitle } from "~/hooks";
import { BaseLayout } from "~/layout/base-layout";

export const SubmitStandardContract: FC = () => {
  const { id, version } = useParams({
    from: "/contracts/classes/$id/versions/$version/submit-standard-contract",
  });

  useSubTitle(`Submit Standard Contract - Class ${id}`);

  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [selectedContractType, setSelectedContractType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!id) {
    return <div>No classId</div>;
  }
  if (!version) {
    return <div>No version provided</div>;
  }

  const availableVersions = Object.keys(CONTRACT_STANDARDS);
  const availableContractTypes = selectedVersion
    ? CONTRACT_STANDARDS[selectedVersion as ContractStandardVersion]
    : [];

  const handleVersionChange = (value: string) => {
    setSelectedVersion(value);
    setSelectedContractType(""); // Reset contract type when version changes
    setSubmitResult(null); // Clear previous results
  };

  const handleContractTypeChange = (value: string) => {
    setSelectedContractType(value);
    setSubmitResult(null); // Clear previous results
  };

  const handleSubmit = async () => {
    if (!selectedVersion || !selectedContractType) {
      setSubmitResult({
        success: false,
        message: "Please select both version and contract type",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await ContractL2API.submitStandardContract({
        classId: id,
        version: version,
        standardVersion: selectedVersion,
        standardName: selectedContractType,
      });

      setSubmitResult({
        success: true,
        message: "Standard contract submitted successfully!",
      });
    } catch (error) {
      let errorMessage = "Failed to submit standard contract";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSubmitResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    !selectedVersion || !selectedContractType || isSubmitting;

  return (
    <BaseLayout>
      <div className="flex flex-wrap m-3">
        <h3 className="mt-2 text-primary md:hidden">
          Submit Standard Contract
        </h3>
        <h2 className="hidden md:block md:mt-6 md:text-primary">
          Submit Standard Contract
        </h2>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Contract Class Information
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <strong>Class ID:</strong> {id}
                </div>
                <div>
                  <strong>Version:</strong> {version}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Standard Contract Version
                </label>
                <Select
                  value={selectedVersion}
                  onValueChange={handleVersionChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a version" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVersions.map((ver) => (
                      <SelectItem key={ver} value={ver}>
                        {ver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contract Type
                </label>
                <Select
                  value={selectedContractType}
                  onValueChange={handleContractTypeChange}
                  disabled={!selectedVersion}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContractTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Standard Contract"}
              </Button>
            </div>

            {submitResult && (
              <div
                className={`p-4 rounded-md ${
                  submitResult.success
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {submitResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};
