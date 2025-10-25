import { FormEvent, useMemo, useRef, useState } from "react";

import {
  useCreateImportJobMutation,
  useListImportJobsQuery,
  useListBranchesQuery,
  type ImportJob,
  type Branch,
} from "../store/api";
import StatusPill from "../components/StatusPill";
import { formatDateTime } from "../utils/format";

const ImportScreen = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data, isFetching } = useListImportJobsQuery();
  const { data: branches } = useListBranchesQuery();
  const [createImportJob, { isLoading: isUploading }] = useCreateImportJobMutation();
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  const branchLookup = useMemo(() => {
    const map = new Map<number, Branch>();
    branches?.forEach((branch) => map.set(branch.id, branch));
    return map;
  }, [branches]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    setFeedback(null);
    if (!file) {
      setFeedback({ type: "error", message: "Choose a spreadsheet to queue an import." });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    if (selectedBranchId !== null) {
      payload.append("branch_id", String(selectedBranchId));
    }
    if (sheetName.trim()) {
      payload.append("sheet_name", sheetName.trim());
    }

    try {
      await createImportJob(payload).unwrap();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSheetName("");
      setFeedback({ type: "success", message: `${file.name} queued for processing.` });
    } catch (error: unknown) {
      // TODO: surface notification once global toast system is in place.
      console.error("Import job failed", error);
      setFeedback({ type: "error", message: "Import job failed. Please verify the file and try again." });
    }
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-700">Legacy Data Import</h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload .csv or .xlsx worksheets with columns for branch_code, model_code, quantity, reserved, and optional details such as model_name, branch_name, city, latitude, and longitude. Data is written to inventory at upload time.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Need a starting point? Download the template as
          {" "}
          <a href="/import_template.csv" className="font-semibold text-honda-red underline">CSV</a>
          {" "}or{" "}
          <a href="/import_template.xlsx" className="font-semibold text-honda-red underline">Excel</a>
          {" "}and replace the sample rows with your showroom data.
        </p>
      </header>

      <form className="flex flex-col gap-4 lg:flex-row lg:items-end" onSubmit={handleUpload}>
        <div className="flex w-full flex-col gap-2 text-sm">
          <label className="font-medium text-slate-600" htmlFor="import-branch">
            Showroom (optional)
          </label>
          <select
            id="import-branch"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-honda-red focus:outline-none focus:ring-1 focus:ring-honda-red"
            value={selectedBranchId ?? ""}
            onChange={(event) => setSelectedBranchId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="" className="font-normal text-slate-500">
              All showrooms
            </option>
            {branches?.map((branch: Branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.city})
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-2 text-sm">
          <label className="font-medium text-slate-600" htmlFor="import-sheet">
            Sheet name (optional)
          </label>
          <input
            id="import-sheet"
            type="text"
            value={sheetName}
            onChange={(event) => setSheetName(event.target.value)}
            placeholder="e.g. April-2025"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-honda-red focus:outline-none focus:ring-1 focus:ring-honda-red"
          />
        </div>

        <div className="flex w-full flex-col gap-2 text-sm">
          <label className="font-medium text-slate-600" htmlFor="import-file">
            Spreadsheet
          </label>
          <input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".csv,.xlsx"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-600 focus:border-honda-red focus:outline-none focus:ring-1 focus:ring-honda-red"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="h-[42px] rounded-lg bg-honda-red px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Queue Import"}
        </button>
      </form>

      {feedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Rows</th>
              <th className="px-4 py-2">Inventory Δ</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  Loading import jobs...
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((job: ImportJob) => {
                const errors = Array.isArray(job.summary?.errors)
                  ? (job.summary?.errors as Array<{ row: number; detail: string }>)
                  : [];
                const errorCount = errors.length;
                const processedRows = Number(job.summary?.processed_rows ?? 0);
                const createdInventory = Number(job.summary?.created_inventory ?? 0);
                const updatedInventory = Number(job.summary?.updated_inventory ?? 0);
                const firstError = errors[0];
                const branchesCreated = Number(job.summary?.branches_created ?? 0);
                const branchesUpdated = Number(job.summary?.branches_updated ?? 0);

                return (
                  <>
                    <tr key={job.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-700">{job.source_filename}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {job.branch_id ? branchLookup.get(job.branch_id)?.code ?? job.branch_id : "--"}
                      </td>
                      <td className="px-4 py-2 text-slate-600"><StatusPill value={job.status} /></td>
                      <td className="px-4 py-2 text-slate-500">
                        {processedRows
                          ? `${processedRows} row${processedRows === 1 ? "" : "s"}${
                              errorCount ? ` · ${errorCount} issue${errorCount === 1 ? "" : "s"}` : ""
                            }`
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {createdInventory || updatedInventory ? (
                          <div className="flex flex-col">
                            <span>{`Inventory +${createdInventory} new / ${updatedInventory} updated`}</span>
                            {branchesCreated || branchesUpdated ? (
                              <span className="text-xs text-slate-400">{`Branches +${branchesCreated} created / ${branchesUpdated} updated`}</span>
                            ) : null}
                          </div>
                        ) : branchesCreated || branchesUpdated ? (
                          <span>{`Branches +${branchesCreated} created / ${branchesUpdated} updated`}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {errorCount > 0 ? (
                          <button
                            type="button"
                            className="text-left underline hover:text-slate-700"
                            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                          >
                            {errorCount} issue{errorCount === 1 ? "" : "s"} · {expandedJobId === job.id ? "Hide" : "Show"}
                          </button>
                        ) : (
                          "Completed"
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{formatDateTime(job.executed_at ?? job.updated_at ?? job.created_at)}</td>
                    </tr>
                    {expandedJobId === job.id && errorCount > 0 ? (
                      <tr key={`${job.id}-errors`} className="border-t border-slate-100 bg-rose-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-1 text-xs text-rose-700">
                            <p className="font-semibold">Import Issues:</p>
                            <ul className="ml-4 list-disc space-y-1">
                              {errors.map((err, idx) => (
                                <li key={idx}>
                                  Row {err.row}: {err.detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No import jobs submitted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ImportScreen;
