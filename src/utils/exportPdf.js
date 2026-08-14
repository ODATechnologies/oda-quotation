// PDF = 브라우저 인쇄(print) 방식 → 한글 완벽 지원
import { fmtNumber } from "./helpers";

export function exportToPdf(data) {
  const {
    docNo, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}logo.png`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>Quotation for ${customer} ${docNo.replace("ODA-","")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Noto Sans KR',sans-serif;font-size:11px;color:#111;background:#fff;padding:16mm 14mm;}
  @page{size:A4;margin:0;}
  @media print{body{padding:10mm 12mm;}}

  .header{display:flex;align-items:center;justify-content:center;margin-bottom:14px;gap:14px;}
  .header img{height:36px;}
  .title{font-size:22px;font-weight:700;letter-spacing:2px;text-align:center;}

  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0;}
  .info-box{border:1px solid #dde3ec;border-radius:6px;overflow:hidden;}
  .info-box-title{background:#1E3C78;color:#fff;font-weight:700;font-size:10px;padding:5px 10px;letter-spacing:.05em;}
  .info-row{display:grid;grid-template-columns:88px 1fr;border-bottom:1px solid #eef;font-size:10.5px;}
  .info-row:last-child{border-bottom:none;}
  .info-label{background:#f5f7fb;padding:5px 8px;font-weight:600;color:#4b5563;}
  .info-value{padding:5px 8px;color:#111;}

  table{width:100%;border-collapse:collapse;margin:12px 0;font-size:10px;}
  thead tr{background:#1E3C78;color:#fff;}
  th{padding:6px 5px;text-align:center;font-weight:600;font-size:10px;white-space:nowrap;}
  td{padding:5px 5px;border-bottom:1px solid #e8ecf2;vertical-align:middle;}
  tr:nth-child(even) td{background:#fafbfd;}
  .detail-row td{background:#f5f7fb!important;color:#555;font-size:9.5px;padding:3px 5px 3px 20px;}
  td.center{text-align:center;}
  td.right{text-align:right;}
  td.bold{font-weight:600;}

  .summary{display:flex;justify-content:flex-end;border-top:2px solid #1E3C78;margin-top:4px;}
  .sum-cell{display:flex;flex-direction:column;align-items:center;padding:8px 18px;border-right:1px solid #dde3ec;min-width:130px;}
  .sum-cell:last-child{border-right:none;}
  .sum-label{font-size:9px;color:#94a3b8;font-weight:600;margin-bottom:2px;}
  .sum-val{font-size:13px;font-weight:700;color:#1E3C78;}
  .sum-cell.total .sum-val{color:#2563EB;font-size:15px;}

  .terms-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
  .terms-box{border:1px solid #dde3ec;border-radius:6px;overflow:hidden;}
  .terms-box-title{background:#f1f4f9;color:#1E3C78;font-weight:700;font-size:10px;padding:5px 10px;}
  .terms-row{display:grid;grid-template-columns:90px 1fr;border-bottom:1px solid #eef;font-size:10.5px;}
  .terms-row:last-child{border-bottom:none;}
  .terms-label{background:#f8fafc;padding:5px 8px;font-weight:600;color:#4b5563;}
  .terms-value{padding:5px 8px;}

  .amt-box{border:1px solid #dde3ec;border-radius:6px;overflow:hidden;}
  .amt-row{display:grid;grid-template-columns:1fr auto;padding:6px 12px;border-bottom:1px solid #eef;font-size:10.5px;}
  .amt-row:last-child{border-bottom:none;background:#1E3C78;color:#fff;font-weight:700;font-size:12px;}
  .amt-row.total{background:#1E3C78;color:#fff;}

  .footer{margin-top:16px;text-align:center;color:#94a3b8;font-size:9.5px;border-top:1px solid #eee;padding-top:8px;}
</style>
</head>
<body>
<div class="header">
  <img src="${logoUrl}" alt="ODA Technologies" onerror="this.style.display='none'"/>
  <div class="title">QUOTATION</div>
</div>

<div class="info-grid">
  <div class="info-box">
    <div class="info-box-title">CUSTOMER</div>
    <div class="info-row"><div class="info-label">수  신</div><div class="info-value">${customer||''}</div></div>
    <div class="info-row"><div class="info-label">담당자</div><div class="info-value">${contact.name||''}</div></div>
    <div class="info-row"><div class="info-label">전  화</div><div class="info-value">${contact.phone||''}</div></div>
    <div class="info-row"><div class="info-label">E-mail</div><div class="info-value">${contact.email||''}</div></div>
  </div>
  <div class="info-box">
    <div class="info-box-title">ODA TECHNOLOGIES</div>
    <div class="info-row"><div class="info-label">문서번호</div><div class="info-value" style="font-weight:700">${docNo}</div></div>
    <div class="info-row"><div class="info-label">공급자</div><div class="info-value">${supplier.name}</div></div>
    <div class="info-row"><div class="info-label">사업자번호</div><div class="info-value">${supplier.bizNo}</div></div>
    <div class="info-row"><div class="info-label">담당자</div><div class="info-value">${staff.name||''}</div></div>
    <div class="info-row"><div class="info-label">전  화</div><div class="info-value">${staff.phone||''}</div></div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:28px">NO</th>
      <th style="width:22%">품목</th>
      <th style="width:16%">규격</th>
      <th style="width:36px">수량</th>
      <th style="width:14%">단가</th>
      <th style="width:14%">금액</th>
      <th style="width:11%">부가세</th>
      <th>비고</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((item, idx) => `
    <tr>
      <td class="center">${idx+1}</td>
      <td class="bold">${item.category||''}</td>
      <td>${item.spec||''}</td>
      <td class="center">${item.qty}</td>
      <td class="right">₩${fmtNumber(item.unitPrice)}</td>
      <td class="right bold">₩${fmtNumber(item.amount)}</td>
      <td class="right">₩${fmtNumber(item.vat)}</td>
      <td>${item.note||''}</td>
    </tr>
    ${(item.details||[]).map(d=>`<tr class="detail-row"><td></td><td colspan="7">• ${d}</td></tr>`).join('')}
    `).join('')}
  </tbody>
</table>

<div class="summary">
  <div class="sum-cell"><div class="sum-label">공급가액</div><div class="sum-val">₩${fmtNumber(totalSupply)}</div></div>
  <div class="sum-cell"><div class="sum-label">부가세 (10%)</div><div class="sum-val">₩${fmtNumber(totalVat)}</div></div>
  <div class="sum-cell total"><div class="sum-label">합계 TOTAL</div><div class="sum-val">₩${fmtNumber(grandTotal)}</div></div>
</div>

<div class="terms-grid">
  <div class="terms-box">
    <div class="terms-box-title">TERMS &amp; CONDITIONS</div>
    <div class="terms-row"><div class="terms-label">납기</div><div class="terms-value">${terms.delivery||''}</div></div>
    <div class="terms-row"><div class="terms-label">견적 유효기간</div><div class="terms-value">${terms.validity||''}</div></div>
    <div class="terms-row"><div class="terms-label">결제 조건</div><div class="terms-value">${terms.payment||''}</div></div>
  </div>
  <div class="amt-box">
    <div class="amt-row"><span>공급가액</span><span>₩${fmtNumber(totalSupply)} 원</span></div>
    <div class="amt-row"><span>부  가  세</span><span>₩${fmtNumber(totalVat)} 원</span></div>
    <div class="amt-row total"><span>TOTAL</span><span>₩${fmtNumber(grandTotal)} 원</span></div>
  </div>
</div>

<div class="footer">위와 같이 견적서를 제출합니다. &nbsp;|&nbsp; 발행일: ${new Date().toLocaleDateString('ko-KR')} &nbsp;|&nbsp; ㈜오디에이테크놀로지</div>

<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
}
