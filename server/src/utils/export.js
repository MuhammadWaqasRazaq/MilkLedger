function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function toCsv(headers, rows) {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];
  return `\ufeff${lines.join("\r\n")}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toExcelHtml(title, headers, rows) {
  const headCells = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  return `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>table{border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px 10px;font-family:Calibri,Arial,sans-serif;font-size:11pt}th{background:#e2e8f0;font-weight:bold}</style>
</head><body><h2>${escapeHtml(title)}</h2><table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

export function sendCsv(res, filename, headers, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`
  );
  res.send(toCsv(headers, rows));
}

export function sendExcel(res, filename, title, headers, rows) {
  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.xls"`
  );
  res.send(toExcelHtml(title, headers, rows));
}

export function sendJsonDownload(res, filename, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.json"`
  );
  res.send(JSON.stringify(payload, null, 2));
}
