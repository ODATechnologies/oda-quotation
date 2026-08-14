import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtNumber } from "./helpers";

export function exportToPdf(data) {
  const {
    docNo, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // 한글 폰트 미포함 시 영문 fallback
  doc.setFont("helvetica");
  const W = 210, M = 14;

  // ── 타이틀 ──
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", W / 2, 20, { align: "center" });

  // ── CUSTOMER / ODA TECHNOLOGIES 두 컬럼 ──
  const leftX = M, rightX = W / 2 + 4;
  let y = 30;

  const drawSection = (title, rows, x) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, x, y);
    doc.setFont("helvetica", "normal");
    rows.forEach(([label, value], i) => {
      doc.setFillColor(248, 248, 248);
      doc.rect(x, y + 3 + i * 7, 88, 6.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(label, x + 2, y + 7.5 + i * 7);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || ""), x + 28, y + 7.5 + i * 7);
    });
  };

  const custRows = [
    ["수  신", customer],
    ["담당자", contact.name],
    ["전  화", contact.phone],
    ["E-mail", contact.email],
  ];
  const supRows = [
    ["문서번호", docNo],
    ["공급자",   supplier.name],
    ["사업자No", supplier.bizNo],
    ["담당자",   staff.name],
    ["전  화",   staff.phone],
  ];

  drawSection("CUSTOMER", custRows, leftX);
  drawSection("ODA TECHNOLOGIES", supRows, rightX);

  y += 6 + Math.max(custRows.length, supRows.length) * 7 + 6;

  // ── 품목 테이블 ──
  const body = [];
  items.forEach((item, idx) => {
    body.push([
      idx + 1,
      item.category,
      item.spec,
      item.qty,
      fmtNumber(item.unitPrice),
      fmtNumber(item.amount),
      fmtNumber(item.vat),
      item.note || "",
    ]);
    (item.details || []).forEach((d) => {
      body.push(["", d, "", "", "", "", "", ""]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [["NO", "품  목", "규  격", "수량", "단  가", "금  액", "부가세", "비고"]],
    body,
    styles: { fontSize: 7, cellPadding: 1.5, font: "helvetica" },
    headStyles: { fillColor: [30, 60, 120], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 36 },
      2: { cellWidth: 24 },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    margin: { left: M, right: M },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── TERMS & CONDITIONS / 금액 합계 ──
  const termsRows = [
    ["납기",         terms.delivery],
    ["견적 유효기간", terms.validity],
    ["결제 조건",    terms.payment],
  ];
  const amtRows = [
    ["공급가액", fmtNumber(totalSupply) + " 원"],
    ["부  가  세", fmtNumber(totalVat) + " 원"],
    ["TOTAL",   fmtNumber(grandTotal) + " 원"],
  ];

  // Terms 왼쪽
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TERMS & CONDITIONS", leftX, y);
  y += 4;
  termsRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, leftX + 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, leftX + 34, y);
    y += 6;
  });

  // 금액 오른쪽
  let ay = doc.lastAutoTable.finalY + 12;
  amtRows.forEach(([label, value], i) => {
    const isTotal = i === 2;
    if (isTotal) {
      doc.setFillColor(30, 60, 120);
      doc.rect(rightX, ay - 4.5, 88, 7, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(240, 244, 252);
      doc.rect(rightX, ay - 4.5, 88, 7, "F");
      doc.setTextColor(0, 0, 0);
    }
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 8 : 7);
    doc.text(label, rightX + 4, ay);
    doc.text(value, rightX + 86, ay, { align: "right" });
    doc.setTextColor(0, 0, 0);
    ay += 8;
  });

  // ── 하단 서명란 ──
  const finalY = Math.max(y, ay) + 10;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(
    `위와 같이 견적서를 제출합니다.   발행일: ${new Date().toLocaleDateString("ko-KR")}`,
    W / 2, finalY, { align: "center" }
  );

  doc.save(`${docNo}_견적서.pdf`);
}
