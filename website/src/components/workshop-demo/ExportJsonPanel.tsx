"use client";

import { CHALLENGER_VERDICT } from "@/lib/workshop-demo/demo-data";
import { formatExportPreviewJson } from "@/lib/workshop-demo/export-preview";

type ExportJsonPanelProps = {
  downloadUrl: string;
  exportFilename: string;
};

export function ExportJsonPanel({ downloadUrl, exportFilename }: ExportJsonPanelProps) {
  const previewJson = formatExportPreviewJson();

  return (
    <div className="workshop-export-panel">
      <section className="workshop-export-panel__preview">
        <p className="section-label text-parchment/70">Export preview (truncated)</p>
        <pre className="workshop-export-panel__json" aria-label="Hyperagent export JSON preview">
          <code>{previewJson}</code>
        </pre>
        <p className="mt-2 text-xs text-parchment/60">
          Full export includes embedded skill body. Demo preview omits large fields for readability.
        </p>
      </section>

      <section className="workshop-export-panel__defaults mt-6">
        <p className="section-label text-parchment/70">Governed defaults</p>
        <table className="workshop-export-panel__table mt-3 w-full text-sm">
          <thead>
            <tr>
              <th scope="col" className="pb-2 text-left text-parchment/60">
                Setting
              </th>
              <th scope="col" className="pb-2 text-left text-parchment/60">
                Value
              </th>
              <th scope="col" className="pb-2 text-left text-parchment/60">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {CHALLENGER_VERDICT.governedDefaults.map((d) => (
              <tr key={d.key} className="border-t border-parchment/10">
                <td className="py-2 pr-4 text-parchment">{d.label}</td>
                <td className="py-2 pr-4 text-parchment/75">{d.value}</td>
                <td className="py-2">
                  {d.locked ? (
                    <span className="workshop-export-panel__lock">Locked</span>
                  ) : (
                    <span className="text-parchment/60">Configurable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={downloadUrl} download={exportFilename} className="btn-primary text-sm">
          Download export JSON
        </a>
      </div>
    </div>
  );
}
