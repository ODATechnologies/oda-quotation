// ODA-GQ YYMMDD 00#D  형식 문서번호 생성
// seqMap: { "YYYYMMDD-customerKey": count } – localStorage에서 관리
export function generateDocNo(date, customerKey, seqMap) {
  const d = date || new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dateKey = `${d.getFullYear()}${mm}${dd}-${customerKey}`;
  const seq = (seqMap[dateKey] || 0) + 1;
  const seqStr = String(seq).padStart(3, "0");
  return { docNo: `ODA-GQ${yy}${mm}${dd}${seqStr}D`, dateKey, seq };
}

// 천 단위 콤마 포맷
export function fmtNumber(n) {
  if (n === null || n === undefined || n === "") return "";
  return Number(n).toLocaleString("ko-KR");
}

// DC율 적용 단가 계산
// dc: 65 → 정가 * 0.35
export function applyDC(listPrice, dc) {
  if (dc === "" || dc === null || dc === undefined) return listPrice;
  const rate = (100 - Number(dc)) / 100;
  return Math.round(Number(listPrice) * rate);
}

// 오늘 날짜 YYYY-MM-DD
export function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 빈 품목 행 생성
export function emptyItem(id) {
  return {
    id,
    category: "",
    spec: "",
    qty: 1,
    listPrice: "",
    dc: "",
    unitPrice: "",  // 수기 입력 또는 DC 계산 결과
    manualPrice: false, // 수기 단가 여부
    amount: 0,
    vat: 0,
    note: "",
    details: [],
  };
}

// 금액 계산
export function calcItem(item) {
  const qty = Number(item.qty) || 0;
  let unitPrice;
  if (item.manualPrice) {
    unitPrice = Number(item.unitPrice) || 0;
  } else if (item.dc !== "" && item.dc !== null && item.dc !== undefined) {
    unitPrice = applyDC(item.listPrice, item.dc);
  } else {
    unitPrice = Number(item.listPrice) || 0;
  }
  const amount = qty * unitPrice;
  const vat = Math.round(amount * 0.1);
  return { ...item, unitPrice, amount, vat };
}
