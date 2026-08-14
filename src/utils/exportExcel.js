import * as XLSX from "xlsx";
import { fmtNumber } from "./helpers";

export function exportToExcel(data) {
  const {
    docNo, date, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const wb = XLSX.utils.book_new();
  const ws_data = [];

  // 헤더 빈 행 (row 1~5)
  for (let i = 0; i < 5; i++) ws_data.push(Array(20).fill(""));

  // Row 6: CUSTOMER / ODA TECHNOLOGIES 타이틀
  const r6 = Array(20).fill("");
  r6[0] = "CUSTOMER"; r6[8] = "ODA TECHNOLOGIES";
  ws_data.push(r6);

  // Row 7: 수신 / 문서번호
  const r7 = Array(20).fill("");
  r7[0] = "수 신"; r7[2] = customer; r7[8] = "문 서 번 호"; r7[11] = docNo;
  ws_data.push(r7);

  // Row 8: 담당자 / 공급자
  const r8 = Array(20).fill("");
  r8[0] = "담 당 자"; r8[2] = contact.name;
  r8[8] = "공 급 자"; r8[11] = supplier.name;
  ws_data.push(r8);

  // Row 9: 전화 / 사업자등록번호
  const r9 = Array(20).fill("");
  r9[0] = "전 화"; r9[2] = contact.phone;
  r9[8] = "사업자등록번호"; r9[11] = supplier.bizNo;
  ws_data.push(r9);

  // Row 10: E-mail / 담당자(공급자)
  const r10 = Array(20).fill("");
  r10[0] = "E-mail"; r10[2] = contact.email;
  r10[8] = "담 당 자"; r10[11] = staff.name;
  ws_data.push(r10);

  // Row 11: 전화(공급자)
  const r11 = Array(20).fill("");
  r11[8] = "전 화"; r11[11] = staff.phone;
  ws_data.push(r11);

  // 빈 행
  ws_data.push(Array(20).fill(""));

  // 품목 헤더
  const hdr = Array(20).fill("");
  hdr[0]="NO"; hdr[1]="품   목"; hdr[4]="규   격"; hdr[7]="수 량";
  hdr[8]="단   가"; hdr[11]="금   액"; hdr[13]="부 가 세"; hdr[15]="비 고";
  ws_data.push(hdr);

  // 품목 행
  items.forEach((item, idx) => {
    const main = Array(20).fill("");
    main[0] = idx + 1;
    main[1] = item.category;
    main[4] = item.spec;
    main[7] = item.qty;
    main[8] = fmtNumber(item.unitPrice);
    main[11] = fmtNumber(item.amount);
    main[13] = fmtNumber(item.vat);
    main[15] = item.note;
    ws_data.push(main);

    // 사양 상세 행
    (item.details || []).forEach((d) => {
      const dr = Array(20).fill("");
      dr[1] = d;
      ws_data.push(dr);
    });

    // 품목 간 빈 행
    ws_data.push(Array(20).fill(""));
  });

  // STANDARD SPECIFICATION / TERMS & CONDITIONS 섹션
  ws_data.push(Array(20).fill(""));

  const tcRow = Array(20).fill("");
  tcRow[0] = "TERMS & CONDITIONS";
  tcRow[8] = "공 급 가 액"; tcRow[11] = fmtNumber(totalSupply); tcRow[15] = "원";
  ws_data.push(tcRow);

  const tc1 = Array(20).fill("");
  tc1[0] = "납기"; tc1[2] = terms.delivery;
  tc1[8] = "부 가 세"; tc1[11] = fmtNumber(totalVat); tc1[15] = "원";
  ws_data.push(tc1);

  const tc2 = Array(20).fill("");
  tc2[0] = "견적 유효기간"; tc2[2] = terms.validity;
  tc2[8] = "TOTAL"; tc2[11] = fmtNumber(grandTotal); tc2[15] = "원";
  ws_data.push(tc2);

  const tc3 = Array(20).fill("");
  tc3[0] = "결제 조건"; tc3[2] = terms.payment;
  ws_data.push(tc3);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // 열 너비 설정
  ws["!cols"] = [
    {wch:8},{wch:24},{wch:18},{wch:6},{wch:18},{wch:6},{wch:6},
    {wch:7},{wch:14},{wch:6},{wch:6},{wch:16},{wch:6},{wch:12},
    {wch:6},{wch:8},{wch:6},{wch:6},{wch:6},{wch:6},
  ];

  XLSX.utils.book_append_sheet(wb, ws, "견적서");
  const shortNo = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
