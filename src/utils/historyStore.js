const KEY = "oda_quote_history";

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function saveQuote(quoteData) {
  const history = loadHistory();
  const existing = history.findIndex(h => h.docNo === quoteData.docNo);
  const record = { ...quoteData, savedAt: new Date().toISOString() };
  if (existing >= 0) {
    history[existing] = record; // 같은 문서번호면 덮어쓰기(수정)
  } else {
    history.unshift(record); // 새 견적은 맨 앞에
  }
  localStorage.setItem(KEY, JSON.stringify(history));
  return history;
}

export function deleteQuote(docNo) {
  const history = loadHistory().filter(h => h.docNo !== docNo);
  localStorage.setItem(KEY, JSON.stringify(history));
  return history;
}

// 특정 업체의 견적 이력만
export function getHistoryByCustomer(customerName) {
  if (!customerName) return [];
  return loadHistory().filter(h => h.customer === customerName);
}
