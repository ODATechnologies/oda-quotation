import { fmtNumber } from "./helpers";

export function exportToPdf(data) {
  const { docNo, staff, supplier, customer, contact, items, terms, totalSupply, totalVat, grandTotal } = data;

  const logoUrl  = `${window.location.origin}${import.meta.env.BASE_URL}logo.png`;
  const shortNo  = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}`;
  const ODA      = "#F84F04";
  const DARK     = "#1a1a1a";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${fileName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}

/* ── A4 꽉 채우기 핵심 ── */
html,body{width:210mm;height:297mm;overflow:hidden;}
body{
  font-family:'Noto Sans KR','Arial',sans-serif;
  font-size:9.5px;color:#111;background:#fff;
  display:flex;flex-direction:column;
  padding:8mm 10mm;
}
@page{size:A4 portrait;margin:0;}
@media print{
  html,body{width:210mm;height:297mm;overflow:hidden;}
  body{padding:8mm 10mm;}
}

/* ── 상단 헤더 ── */
.top-header{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  flex-shrink:0;
  padding-bottom:5px;
}
.logo-wrap img{height:42px;object-fit:contain;display:block;}
.title-block{text-align:right;}
.quotation-title{
  font-size:28px;font-weight:800;
  letter-spacing:10px;          /* 자간 넓게 */
  color:#111;display:block;line-height:1;
}
.subtitle{
  font-size:7px;
  letter-spacing:3.5px;         /* 자간 넓게 */
  color:#999;margin-top:5px;display:block;
  text-transform:uppercase;
}
.orange-bar{height:3px;background:${ODA};margin-bottom:7px;flex-shrink:0;}

/* ── INFO 2컬럼 ── */
.info-wrap{
  display:grid;grid-template-columns:1fr 1fr;
  gap:7px;margin-bottom:7px;flex-shrink:0;
}
.info-box{border:1px solid #ccc;}
.info-title{
  background:${DARK};color:#fff;
  font-size:8px;font-weight:700;letter-spacing:.12em;
  padding:3.5px 8px;
}
.info-row{display:flex;border-top:1px solid #e0e0e0;}
.info-label{
  background:#f4f4f4;font-size:8px;font-weight:700;color:#555;
  padding:3.5px 7px;min-width:78px;width:78px;
  border-right:1px solid #e0e0e0;
  display:flex;align-items:center;
}
.info-value{
  padding:3.5px 7px;font-size:8.5px;color:#111;
  display:flex;align-items:center;flex:1;
}

/* ── 품목 테이블 ── */
.item-wrap{flex:1;display:flex;flex-direction:column;min-height:0;}
.item-table{width:100%;border-collapse:collapse;font-size:8.5px;}
.item-table thead tr{background:${ODA};}
.item-table th{
  color:#fff;padding:5px 4px;text-align:center;
  font-size:8px;font-weight:700;letter-spacing:.04em;
  border-right:1px solid rgba(255,255,255,.25);white-space:nowrap;
}
.item-table th:last-child{border-right:none;}
.item-table td{
  padding:4px 5px;
  border-bottom:1px solid #ebebeb;
  border-right:1px solid #f2f2f2;
  vertical-align:middle;
}
.item-table td:last-child{border-right:none;}
.item-table tr:nth-child(even) td{background:#fafafa;}
.detail-row td{
  background:#f5f7fb!important;color:#666;
  font-size:7.5px;padding:1.5px 5px 1.5px 16px;
  border-bottom:1px solid #f2f2f2;
}
/* 빈 행으로 나머지 공간 채우기 */
.filler-row td{border:none;background:transparent;}

td.c{text-align:center;}td.r{text-align:right;}td.b{font-weight:700;}

/* ── 하단 ── */
.bottom-section{
  display:grid;grid-template-columns:1fr 1fr;
  gap:8px;margin-top:7px;flex-shrink:0;
}
.terms-box{border:1px solid #ccc;}
.terms-title{
  background:${DARK};color:#fff;
  font-size:8px;font-weight:700;letter-spacing:.08em;
  padding:3.5px 8px;
}
.terms-row{display:flex;border-top:1px solid #e0e0e0;}
.terms-label{
  background:#f4f4f4;font-size:8px;font-weight:700;color:#555;
  padding:3.5px 7px;min-width:75px;width:75px;
  border-right:1px solid #e0e0e0;display:flex;align-items:center;
}
.terms-value{padding:3.5px 7px;font-size:8.5px;flex:1;display:flex;align-items:center;}
.amt-box{border:1px solid #ccc;}
.amt-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:4px 9px;border-bottom:1px solid #e0e0e0;font-size:8.5px;
}
.amt-row:last-child{border-bottom:none;}
.amt-row.total{
  background:${ODA};color:#fff;
  font-weight:800;font-size:11px;padding:6px 9px;
}

.footer{
  margin-top:6px;text-align:center;color:#bbb;
  font-size:7.5px;border-top:1px solid #eee;padding-top:5px;flex-shrink:0;
}
</style>
</head>
<body>

<!-- 상단: 로고 좌 / QUOTATION 우 -->
<div class="top-header">
  <div class="logo-wrap">
    <img src="${logoUrl}" alt="ODA Technologies" onerror="this.style.display='none'"/>
  </div>
  <div class="title-block">
    <span class="quotation-title">QUOTATION</span>
    <span class="subtitle">Partner Ship, Core Power of ODA</span>
  </div>
</div>
<div class="orange-bar"></div>

<!-- INFO -->
<div class="info-wrap">
  <div class="info-box">
    <div class="info-title">CUSTOMER</div>
    <div class="info-row"><div class="info-label">Bill To</div><div class="info-value" style="font-weight:700">${customer||''}</div></div>
    <div class="info-row"><div class="info-label">Attention</div><div class="info-value">${contact.name||''}</div></div>
    <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${contact.phone||''}</div></div>
    <div class="info-row"><div class="info-label">E-mail</div><div class="info-value">${contact.email||''}</div></div>
  </div>
  <div class="info-box">
    <div class="info-title">ODA TECHNOLOGIES</div>
    <div class="info-row"><div class="info-label">Doc. No.</div><div class="info-value" style="color:#111;font-weight:700">${docNo}</div></div>
    <div class="info-row"><div class="info-label">Supplier</div><div class="info-value" style="color:#111">${supplier.name}</div></div>
    <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-value" style="color:#111">${supplier.bizNo}</div></div>
    <div class="info-row"><div class="info-label">Sales Rep.</div><div class="info-value" style="color:#111">${staff.name||''}</div></div>
    <div class="info-row"><div class="info-label">Phone</div><div class="info-value" style="color:#111">${staff.phone||''}</div></div>
  </div>
</div>

<!-- 품목 테이블 (flex:1로 남은 공간 채움) -->
<div class="item-wrap">
<table class="item-table">
  <thead>
    <tr>
      <th style="width:22px">NO</th>
      <th style="width:22%">Description</th>
      <th style="width:14%">Model</th>
      <th style="width:32px">Qty</th>
      <th style="width:13%">Unit Price</th>
      <th style="width:13%">Amount</th>
      <th style="width:10%">VAT</th>
      <th>Remark</th>
    </tr>
  </thead>
  <tbody id="item-tbody">
    ${items.map((item,idx)=>`
    <tr>
      <td class="c">${idx+1}</td>
      <td class="b">${item.category||''}</td>
      <td>${item.spec||''}</td>
      <td class="c">${item.qty}</td>
      <td class="r">${fmtNumber(item.unitPrice)}</td>
      <td class="r b">${fmtNumber(item.amount)}</td>
      <td class="r">${fmtNumber(item.vat)}</td>
      <td>${item.note||''}</td>
    </tr>
    ${(item.details||[]).map(d=>`<tr class="detail-row"><td></td><td colspan="7">- ${d}</td></tr>`).join('')}
    `).join('')}
  </tbody>
</table>
</div>

<!-- 하단 -->
<div class="bottom-section">
  <div class="terms-box">
    <div class="terms-title">TERMS &amp; CONDITIONS</div>
    <div class="terms-row"><div class="terms-label">Delivery</div><div class="terms-value">${terms.delivery||''}</div></div>
    <div class="terms-row"><div class="terms-label">Validity</div><div class="terms-value">${terms.validity||''}</div></div>
    <div class="terms-row"><div class="terms-label">Payment</div><div class="terms-value">${terms.payment||''}</div></div>
  </div>
  <div class="amt-box">
    <div class="amt-row"><span>Supply Amount</span><span>₩ ${fmtNumber(totalSupply)}</span></div>
    <div class="amt-row"><span>VAT (10%)</span><span>₩ ${fmtNumber(totalVat)}</span></div>
    <div class="amt-row total"><span>TOTAL</span><span>₩ ${fmtNumber(grandTotal)}</span></div>
  </div>
</div>

<div class="footer">
  We hereby submit our quotation as above. &nbsp;|&nbsp;
  Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &nbsp;|&nbsp;
  ODA Technologies Co., Ltd.
</div>

<script>
// A4에 꽉 맞게: body 높이와 실제 콘텐츠 높이를 비교해 폰트/패딩 자동 조정
window.onload = function() {
  // 폰트 로드 후 실행
  document.fonts.ready.then(function() {
    fitToA4();
    window.print();
    window.onafterprint = function(){ window.close(); };
  });
};

function fitToA4() {
  var A4_H = 297; // mm
  var body  = document.body;
  var DPI   = 96;
  var MM_TO_PX = DPI / 25.4;
  var targetPx = A4_H * MM_TO_PX; // ~1122px

  // 현재 콘텐츠 높이
  var contentH = body.scrollHeight;

  if (contentH <= targetPx) {
    // 콘텐츠가 A4보다 작으면 → item-wrap이 남은 공간 flex:1로 자동 채움
    body.style.height = targetPx + 'px';
    return;
  }

  // 콘텐츠가 넘치면 → 폰트 크기를 비율로 줄임
  var ratio = targetPx / contentH;
  var baseFontPx = 9.5;
  var newFont = Math.max(6.5, baseFontPx * ratio);
  body.style.fontSize = newFont + 'px';

  // 로고/타이틀도 비율 조정
  var logo = document.querySelector('.logo-wrap img');
  if (logo) logo.style.height = Math.max(24, 42 * ratio) + 'px';
  var title = document.querySelector('.quotation-title');
  if (title) title.style.fontSize = Math.max(18, 28 * ratio) + 'px';
  var sub = document.querySelector('.subtitle');
  if (sub) sub.style.fontSize = Math.max(5, 7 * ratio) + 'px';

  // body 높이 고정
  body.style.height = targetPx + 'px';
  body.style.overflow = 'hidden';
}
<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=760');
  w.document.write(html);
  w.document.close();
}
