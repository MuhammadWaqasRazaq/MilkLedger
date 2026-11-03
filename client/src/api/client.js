const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.message || `Request failed with status ${response.status}.`
    );
  }

  return payload?.data;
}

function query(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const string = search.toString();
  return string ? `?${string}` : "";
}

export const api = {
  getDashboard(month, year) {
    return request(`/dashboard${query({ month, year })}`);
  },
  getMilkRecords(month, year) {
    return request(`/milk/records${query({ month, year })}`);
  },
  saveMilkRecord(payload) {
    return request("/milk/records", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  saveMilkMonth(payload) {
    return request("/milk/records/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateMilkRecord(date, payload) {
    return request(`/milk/records/${date}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteMilkRecord(date) {
    return request(`/milk/records/${date}`, { method: "DELETE" });
  },
  getMilkRates() {
    return request("/milk/rates");
  },
  createMilkRate(payload) {
    return request("/milk/rates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateMilkRate(id, payload) {
    return request(`/milk/rates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteMilkRate(id) {
    return request(`/milk/rates/${id}`, { method: "DELETE" });
  },
  getMilkPayments(month, year) {
    return request(`/milk/payments${query({ month, year })}`);
  },
  addMilkPayment(payload) {
    return request("/milk/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteMilkPayment(id) {
    return request(`/milk/payments/${id}`, { method: "DELETE" });
  },
  getYearlyMilkReport(year) {
    return request(`/reports/milk${query({ year })}`);
  },
  getPayables(search = "") {
    return request(`/payables${query({ search })}`);
  },
  createPayable(payload) {
    return request("/payables", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updatePayable(id, payload) {
    return request(`/payables/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deletePayable(id) {
    return request(`/payables/${id}`, { method: "DELETE" });
  },
  addPayablePayment(id, payload) {
    return request(`/payables/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deletePayablePayment(id, paymentId) {
    return request(`/payables/${id}/payments/${paymentId}`, {
      method: "DELETE",
    });
  },
  getPayablePersonHistory(name) {
    return request(`/payables/person/${encodeURIComponent(name)}`);
  },
  getReceivables(search = "") {
    return request(`/receivables${query({ search })}`);
  },
  createReceivable(payload) {
    return request("/receivables", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateReceivable(id, payload) {
    return request(`/receivables/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteReceivable(id) {
    return request(`/receivables/${id}`, { method: "DELETE" });
  },
  addReceivablePayment(id, payload) {
    return request(`/receivables/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteReceivablePayment(id, paymentId) {
    return request(`/receivables/${id}/payments/${paymentId}`, {
      method: "DELETE",
    });
  },
  getReceivablePersonHistory(name) {
    return request(`/receivables/person/${encodeURIComponent(name)}`);
  },
  getTrash() {
    return request("/trash");
  },
  restoreTrashItem(type, id) {
    return request(`/trash/${type}/${id}/restore`, { method: "POST" });
  },
  permanentlyDeleteTrashItem(type, id) {
    return request(`/trash/${type}/${id}`, { method: "DELETE" });
  },
  restoreBackup(payload) {
    return request("/backup/restore", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export function exportPath(dataset, format, filters = {}) {
  return `/backup/export/${dataset}${query({ format, ...filters })}`;
}

export function backupPath() {
  return "/backup";
}

export async function downloadFile(path, filename) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    let message = "Download failed.";
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore non-json error
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export { API_BASE };
