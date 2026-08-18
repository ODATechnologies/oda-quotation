import * as XLSX from "xlsx";
import { fmtNumber } from "./helpers";

export function exportToExcel(data) {
  const {
    docNo, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const shortNo  = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}.xlsx`;

  const wb = XLSX.utils.book_new();
  const ws = {};
  const merges = [];

  // ── 헬퍼
  function c(r, col, v, style) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    ws[addr] = { v, t: typeof v === "number" ? "n" : "s", s: style };
  }
  function numFmt(r, col, v) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    ws[addr] = { v, t: "n", z: "#,##0" };
  }
  function merge(rs, cs, re, ce) { merges.push({ s:{r:rs,c:cs}, e:{r:re,c:ce} }); }

  // ── 행 인덱스
  let R = 0;

  // Row 0~3: 빈 행 (상단 여백)
  R = 4;

  // Row 4: CUSTOMER / ODA TECHNOLOGIES 타이틀
  c(R, 0, "CUSTOMER");
  c(R, 8, "ODA TECHNOLOGIES");
  merge(R,0,R,5); merge(R,8,R,13);
  R++;

  // Row 5~8: 고객/공급자 정보 (2컬럼)
  const infoRows = [
    ["Bill To",    customer||"",      "Doc. No.",   docNo],
    ["Attention",  contact.name||"",  "Supplier",   supplier.name],
    ["Phone",      contact.phone||"", "Reg. No.",   supplier.bizNo],
    ["E-mail",     contact.email||"", "Sales Rep.", staff.name||""],
    ["",           "",                "Phone",      staff.phone||""],
  ];
  infoRows.forEach(([ll, lv, rl, rv]) => {
    c(R, 0, ll); c(R, 2, lv);
    merge(R,2,R,6);
    c(R, 8, rl); c(R, 11, rv);
    merge(R,11,R,15);
    R++;
  });

  R++; // 빈 행

  // ── 품목 헤더
  const hdrs = ["NO","Description","","","Model","","Qty","Unit Price","","Amount","","VAT","","Remark",""];
  const hdrCols = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
  hdrs.forEach((h,i) => c(R, hdrCols[i], h));
  merge(R,1,R,3); // Description
  merge(R,4,R,5); // Model
  merge(R,7,R,8); // Unit Price
  merge(R,9,R,10); // Amount
  merge(R,11,R,12); // VAT
  merge(R,13,R,14); // Remark
  const hdrRow = R;
  R++;

  // ── 품목 행
  items.forEach((item, idx) => {
    c(R, 0, idx + 1);
    c(R, 1, item.category || "");
    merge(R,1,R,3);
    c(R, 4, item.spec || "");
    merge(R,4,R,5);
    numFmt(R, 6, Number(item.qty) || 0);
    numFmt(R, 7, Number(item.unitPrice) || 0);
    merge(R,7,R,8);
    numFmt(R, 9, Number(item.amount) || 0);
    merge(R,9,R,10);
    numFmt(R, 11, Number(item.vat) || 0);
    merge(R,11,R,12);
    c(R, 13, item.note || "");
    merge(R,13,R,14);
    R++;

    // 상세 사양
    (item.details || []).forEach(d => {
      c(R, 1, `- ${d}`);
      merge(R,1,R,14);
      R++;
    });

    R++; // 품목 간 빈 행
  });

  R++; // 빈 행

  // ── TERMS & CONDITIONS + 합계
  c(R, 0, "TERMS & CONDITIONS");
  merge(R,0,R,5);
  c(R, 8, "Supply Amount");
  numFmt(R, 11, totalSupply);
  merge(R,11,R,12);
  c(R, 13, "KRW");
  R++;

  c(R, 0, "Delivery"); c(R, 2, terms.delivery || "");
  merge(R,2,R,5);
  c(R, 8, "VAT (10%)");
  numFmt(R, 11, totalVat);
  merge(R,11,R,12);
  c(R, 13, "KRW");
  R++;

  c(R, 0, "Validity"); c(R, 2, terms.validity || "");
  merge(R,2,R,5);
  c(R, 8, "TOTAL");
  numFmt(R, 11, grandTotal);
  merge(R,11,R,12);
  c(R, 13, "KRW");
  R++;

  c(R, 0, "Payment"); c(R, 2, terms.payment || "");
  merge(R,2,R,5);

  // ── 범위 설정
  ws["!ref"] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:R, c:14} });
  ws["!merges"] = merges;
  ws["!cols"] = [
    {wch:6},   // A: NO
    {wch:22},  // B: Description
    {wch:10},  // C
    {wch:8},   // D
    {wch:14},  // E: Model
    {wch:6},   // F
    {wch:6},   // G: Qty
    {wch:14},  // H: Unit Price
    {wch:6},   // I
    {wch:14},  // J: Amount
    {wch:6},   // K
    {wch:12},  // L: VAT
    {wch:4},   // M
    {wch:10},  // N: Remark
    {wch:4},   // O
  ];
  ws["!rows"] = [];
  // 헤더 행 높이
  ws["!rows"][hdrRow] = { hpt: 18 };

  XLSX.utils.book_append_sheet(wb, ws, "Quotation");
  XLSX.writeFile(wb, fileName);
}
