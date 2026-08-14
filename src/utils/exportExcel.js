import * as XLSX from "xlsx";
import { fmtNumber } from "./helpers";

export function exportToExcel(data) {
  const {
    docNo, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const shortNo = docNo.replace("ODA-", "");
  const wb = XLSX.utils.book_new();
  const ws_data = [];

  // 빈 행 1~5
  for (let i = 0; i < 5; i++) ws_data.push(Array(20).fill(""));

  // Row 6: 섹션 타이틀
  const r6 = Array(20).fill("");
  r6[0] = "CUSTOMER"; r6[8] = "ODA TECHNOLOGIES";
  ws_data.push(r6);

  // Row 7
  const r7 = Array(20).fill("");
  r7[0]="Bill To";      r7[2]=customer;
  r7[8]="Doc. No.";     r7[11]=docNo;
  ws_data.push(r7);

  // Row 8
  const r8 = Array(20).fill("");
  r8[0]="Attention";    r8[2]=contact.name;
  r8[8]="Supplier";     r8[11]=supplier.name;
  ws_data.push(r8);

  // Row 9
  const r9 = Array(20).fill("");
  r9[0]="Phone";        r9[2]=contact.phone;
  r9[8]="Reg. No.";     r9[11]=supplier.bizNo;
  ws_data.push(r9);

  // Row 10
  const r10 = Array(20).fill("");
  r10[0]="E-mail";      r10[2]=contact.email;
  r10[8]="Sales Rep.";  r10[11]=staff.name;
  ws_data.push(r10);

  // Row 11
  const r11 = Array(20).fill("");
  r11[8]="Phone";       r11[11]=staff.phone;
  ws_data.push(r11);

  ws_data.push(Array(20).fill(""));

  // 품목 헤더
  const hdr = Array(20).fill("");
  hdr[0]="NO"; hdr[1]="Description"; hdr[4]="Model";
  hdr[7]="Qty"; hdr[8]="Unit Price"; hdr[11]="Amount";
  hdr[13]="VAT"; hdr[15]="Remark";
  ws_data.push(hdr);

  // 품목 행
  items.forEach((item, idx) => {
    const main = Array(20).fill("");
    main[0]=idx+1; main[1]=item.category; main[4]=item.spec;
    main[7]=item.qty; main[8]=fmtNumber(item.unitPrice);
    main[11]=fmtNumber(item.amount); main[13]=fmtNumber(item.vat);
    main[15]=item.note;
    ws_data.push(main);
    (item.details||[]).forEach(d => {
      const dr = Array(20).fill(""); dr[1]="- "+d; ws_data.push(dr);
    });
    ws_data.push(Array(20).fill(""));
  });

  ws_data.push(Array(20).fill(""));

  // TERMS & 합계
  const tc0 = Array(20).fill("");
  tc0[0]="TERMS & CONDITIONS";
  tc0[8]="Supply Amount"; tc0[11]=fmtNumber(totalSupply); tc0[15]="KRW";
  ws_data.push(tc0);

  const tc1 = Array(20).fill("");
  tc1[0]="Delivery"; tc1[2]=terms.delivery;
  tc1[8]="VAT (10%)"; tc1[11]=fmtNumber(totalVat); tc1[15]="KRW";
  ws_data.push(tc1);

  const tc2 = Array(20).fill("");
  tc2[0]="Validity"; tc2[2]=terms.validity;
  tc2[8]="TOTAL"; tc2[11]=fmtNumber(grandTotal); tc2[15]="KRW";
  ws_data.push(tc2);

  const tc3 = Array(20).fill("");
  tc3[0]="Payment"; tc3[2]=terms.payment;
  ws_data.push(tc3);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws["!cols"] = [
    {wch:12},{wch:26},{wch:18},{wch:6},{wch:18},{wch:6},{wch:6},
    {wch:7},{wch:14},{wch:6},{wch:6},{wch:16},{wch:6},{wch:12},
    {wch:6},{wch:8},{wch:6},{wch:6},{wch:6},{wch:6},
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Quotation");
  XLSX.writeFile(wb, `Quotation for ${customer} ${shortNo}.xlsx`);
}
