import { fmtNumber } from "./helpers";
import logoSrc from "../assets/logo.png";

export function exportToPdf(data) {
  const { docNo, staff, supplier, customer, contact, items, terms, totalSupply, totalVat, grandTotal } = data;
  const shortNo  = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}`;
  const ODA  = "#F84F04";
  const DARK = "#1a1a1a";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${fileName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:210mm;}
body{
  font-family:'Noto Sans KR','Arial',sans-serif;
  font-size:11px;color:#111;background:#fff;
  padding:32px 34px;
  display:flex;flex-direction:column;
}
@page{size:A4 portrait;margin:0;}
@media print{
  html,body{width:210mm;}
  body{padding:32px 34px;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}

/* 상단 */
.top-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6px;flex-shrink:0;}
.logo-wrap img{height:42px;object-fit:contain;display:block;}
.title-block{text-align:right;}
.quotation-title{font-size:24px;font-weight:800;letter-spacing:7px;color:#111;display:block;line-height:1;}
.subtitle{font-size:8px;letter-spacing:2.5px;color:#aaa;margin-top:3px;display:block;text-transform:uppercase;}
.orange-bar{height:2.5px;background:${ODA};margin-bottom:12px;flex-shrink:0;}

/* INFO */
.info-wrap{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;flex-shrink:0;}
.info-box{border:1px solid #ccc;}
.info-title{background:${DARK};color:#fff;font-size:9px;font-weight:700;padding:4px 8px;letter-spacing:.1em;display:block;width:100%;}
.info-row{display:flex;border-top:1px solid #e0e0e0;}
.info-label{background:#f4f4f4;font-size:9px;font-weight:700;color:#555;padding:4px 7px;min-width:70px;width:70px;border-right:1px solid #e0e0e0;display:flex;align-items:center;}
.info-value{padding:4px 7px;font-size:10px;color:#111;display:flex;align-items:center;flex:1;}

/* 품목 테이블 */
.item-table{width:100%;border-collapse:collapse;font-size:9px;flex-shrink:0;}
.item-table thead tr{background:${ODA};}
.item-table th{color:#fff;padding:6px 5px;text-align:center;font-size:9px;font-weight:700;border-right:1px solid rgba(255,255,255,.3);white-space:nowrap;}
.item-table th:last-child{border-right:none;}
.item-table td{padding:7px 6px;border-bottom:1px solid #ebebeb;border-right:1px solid #f2f2f2;vertical-align:middle;}
.item-table td:last-child{border-right:none;}
.item-table tr:nth-child(even) td{background:#fafafa;}
.detail-row td{background:#f4f6fb!important;color:#666;font-size:8.5px;padding:3px 6px 3px 16px;border-bottom:1px solid #efefef;font-style:italic;}
td.c{text-align:center;}td.r{text-align:right;}td.b{font-weight:700;}

.spacer{flex:1;min-height:60px;max-height:120px;}

/* ── TERMS + 합계: 완전한 table 레이아웃 ── */
.bottom-wrap{flex-shrink:0;width:100%;}
.bottom-wrap table{
  width:100%;
  border-collapse:separate;
  border-spacing:8px 0;
  table-layout:fixed;
}
.bottom-wrap table td{
  width:50%;
  vertical-align:top;
  padding:0;
}

/* TERMS 박스 — table 내부를 또 table로 구성 */
.terms-table{
  width:100%;
  border-collapse:collapse;
  border:1px solid #ccc;
}
.terms-table .terms-hdr{
  background:${DARK};
  color:#fff;
  font-size:9px;
  font-weight:700;
  padding:4px 8px;
  letter-spacing:.08em;
}
.terms-table .terms-row td{
  border-top:1px solid #e0e0e0;
  padding:4px 7px;
  font-size:10px;
}
.terms-table .terms-row td:first-child{
  background:#f4f4f4;
  font-weight:700;
  font-size:9px;
  color:#555;
  width:60px;
  border-right:1px solid #e0e0e0;
}

/* 합계 박스 */
.amt-table{
  width:100%;
  border-collapse:collapse;
  border:1px solid #ccc;
}
.amt-table tr td{
  padding:6px 10px;
  font-size:10px;
  border-bottom:1px solid #e0e0e0;
}
.amt-table tr:last-child td{ border-bottom:none; }
.amt-table .amt-label{ text-align:left; }
.amt-table .amt-value{ text-align:right; }
.amt-table .total-row td{
  background:${ODA};
  color:#fff;
  font-weight:800;
  font-size:12px;
  padding:8px 10px;
  border-bottom:none;
}

.footer{margin-top:10px;text-align:center;color:#bbb;font-size:8px;border-top:1px solid #eee;padding-top:7px;flex-shrink:0;}
</style>
</head>
<body>

<!-- 헤더 -->
<div class="top-header">
  <div class="logo-wrap"><img src="${logoSrc}" alt="ODA Technologies"/></div>
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
    <div class="info-row"><div class="info-label">Company</div><div class="info-value" style="font-weight:700">${customer||''}</div></div>
    <div class="info-row"><div class="info-label">Contact</div><div class="info-value">${contact.name||''}</div></div>
    <div class="info-row"><div class="info-label">Tel.</div><div class="info-value">${contact.phone||''}</div></div>
    <div class="info-row"><div class="info-label">E-mail</div><div class="info-value">${contact.email||''}</div></div>
  </div>
  <div class="info-box">
    <div class="info-title">ODA TECHNOLOGIES</div>
    <div class="info-row"><div class="info-label">Doc. No.</div><div class="info-value" style="font-weight:700">${docNo}</div></div>
    <div class="info-row"><div class="info-label">Supplier</div><div class="info-value">${supplier.name}</div></div>
    <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-value">${supplier.bizNo}</div></div>
    <div class="info-row"><div class="info-label">Sales Rep.</div><div class="info-value">${staff.name||''}</div></div>
    <div class="info-row"><div class="info-label">Tel.</div><div class="info-value">${staff.phone||''}</div></div>
  </div>
</div>

<!-- 품목 -->
<table class="item-table">
  <thead>
    <tr>
      <th style="width:20px">NO</th>
      <th style="text-align:center;width:22%">Description</th>
      <th style="text-align:center;width:14%">Model</th>
      <th style="width:28px">Qty</th>
      <th style="width:13%">Unit Price</th>
      <th style="width:13%">Amount</th>
      <th style="width:10%">VAT</th>
      <th style="text-align:center">Remark</th>
    </tr>
  </thead>
  <tbody>
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

<div class="spacer"></div>

<!-- TERMS & 합계: 완전한 table-in-table 방식 -->
<div class="bottom-wrap">
  <table>
    <tr>
      <!-- TERMS -->
      <td>
        <table class="terms-table">
          <tr><td colspan="2" class="terms-hdr">TERMS &amp; CONDITIONS</td></tr>
          <tr class="terms-row"><td>Delivery</td><td>${terms.delivery||''}</td></tr>
          <tr class="terms-row"><td>Validity</td><td>${terms.validity||''}</td></tr>
          <tr class="terms-row"><td>Payment</td><td>${terms.payment||''}</td></tr>
        </table>
      </td>
      <!-- 합계 -->
      <td>
        <table class="amt-table">
          <tr><td class="amt-label">Supply Amount</td><td class="amt-value">₩ ${fmtNumber(totalSupply)}</td></tr>
          <tr><td class="amt-label">VAT (10%)</td><td class="amt-value">₩ ${fmtNumber(totalVat)}</td></tr>
          <tr class="total-row"><td class="amt-label">TOTAL</td><td class="amt-value">₩ ${fmtNumber(grandTotal)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</div>

<div class="footer">
  We hereby submit our quotation as above. &nbsp;|&nbsp;
  Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &nbsp;|&nbsp;
  ODA Technologies Co., Ltd.
</div>

<script>
document.fonts.ready.then(function(){
  setTimeout(function(){
    window.print();
    window.onafterprint = function(){ window.close(); };
  }, 400);
});
<\/script>
</body></html>`;

  const w = window.open('','_blank','width=900,height=760');
  w.document.write(html);
  w.document.close();
}
