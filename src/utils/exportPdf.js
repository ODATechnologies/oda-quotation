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
  font-size:9px;color:#111;background:#fff;
  padding:32px 34px;
  display:flex;flex-direction:column;
}
@page{size:A4 portrait;margin:0;}
@media print{
  html,body{width:210mm;}
  body{padding:32px 34px;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}
.top-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6px;flex-shrink:0;}
.logo-wrap img{height:36px;object-fit:contain;display:block;}
.title-block{text-align:right;}
.quotation-title{font-size:22px;font-weight:800;letter-spacing:7px;color:#111;display:block;line-height:1;}
.subtitle{font-size:6.5px;letter-spacing:2.5px;color:#aaa;margin-top:3px;display:block;text-transform:uppercase;}
.orange-bar{height:2.5px;background:${ODA};margin-bottom:12px;flex-shrink:0;}

/* INFO */
.info-wrap{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;flex-shrink:0;}
.info-box{border:1px solid #ccc;}
.info-title{background:${DARK};color:#fff;font-size:7px;font-weight:700;padding:3.5px 7px;letter-spacing:.1em;display:block;width:100%;}
.info-row{display:flex;border-top:1px solid #e0e0e0;}
.info-label{background:#f4f4f4;font-size:7px;font-weight:700;color:#555;padding:3.5px 6px;min-width:62px;width:62px;border-right:1px solid #e0e0e0;display:flex;align-items:center;}
.info-value{padding:3.5px 6px;font-size:7.5px;color:#111;display:flex;align-items:center;flex:1;}

/* 품목 */
.item-table{width:100%;border-collapse:collapse;font-size:8px;flex-shrink:0;}
.item-table thead tr{background:${ODA};}
.item-table th{color:#fff;padding:5.5px 4px;text-align:center;font-size:7px;font-weight:700;border-right:1px solid rgba(255,255,255,.3);white-space:nowrap;}
.item-table th:last-child{border-right:none;}
.item-table td{padding:6px 5px;border-bottom:1px solid #ebebeb;border-right:1px solid #f2f2f2;vertical-align:middle;}
.item-table td:last-child{border-right:none;}
.item-table tr:nth-child(even) td{background:#fafafa;}
.detail-row td{background:#f4f6fb!important;color:#666;font-size:7px;padding:2.5px 5px 2.5px 14px;border-bottom:1px solid #efefef;font-style:italic;}
td.c{text-align:center;}td.r{text-align:right;}td.b{font-weight:700;}

.spacer{flex:1;min-height:60px;max-height:120px;}

/* ── TERMS & 합계: table 방식으로 완전 교체 ── */
.bottom-table{width:100%;border-collapse:collapse;flex-shrink:0;}
.bottom-table td{vertical-align:top;width:50%;padding:0;}
.bottom-table td+td{padding-left:8px;}

/* TERMS */
.terms-box{border:1px solid #ccc;border-collapse:collapse;width:100%;}
.terms-box .t-hdr{
  background:${DARK};color:#fff;
  font-size:7px;font-weight:700;letter-spacing:.08em;
  padding:3.5px 7px;
}
.terms-box .t-row{display:flex;border-top:1px solid #e0e0e0;}
.terms-box .t-label{background:#f4f4f4;font-size:7px;font-weight:700;color:#555;padding:3.5px 6px;min-width:54px;width:54px;border-right:1px solid #e0e0e0;display:flex;align-items:center;}
.terms-box .t-val{padding:3.5px 6px;font-size:7.5px;flex:1;display:flex;align-items:center;}

/* 합계 */
.amt-box{border:1px solid #ccc;width:100%;}
.amt-box .a-row{display:flex;justify-content:space-between;align-items:center;padding:5px 9px;border-bottom:1px solid #e0e0e0;font-size:8px;}
.amt-box .a-row.last{border-bottom:none;}
.amt-box .a-total{
  display:flex;justify-content:space-between;align-items:center;
  padding:7px 9px;
  background:${ODA};
  color:#fff;font-weight:800;font-size:10.5px;
}

.footer{margin-top:10px;text-align:center;color:#bbb;font-size:6.5px;border-top:1px solid #eee;padding-top:6px;flex-shrink:0;}
</style>
</head>
<body>
<div class="top-header">
  <div class="logo-wrap"><img src="${logoSrc}" alt="ODA Technologies"/></div>
  <div class="title-block">
    <span class="quotation-title">QUOTATION</span>
    <span class="subtitle">Partner Ship, Core Power of ODA</span>
  </div>
</div>
<div class="orange-bar"></div>

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
    <div class="info-row"><div class="info-label">Doc. No.</div><div class="info-value" style="font-weight:700">${docNo}</div></div>
    <div class="info-row"><div class="info-label">Supplier</div><div class="info-value">${supplier.name}</div></div>
    <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-value">${supplier.bizNo}</div></div>
    <div class="info-row"><div class="info-label">Sales Rep.</div><div class="info-value">${staff.name||''}</div></div>
    <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${staff.phone||''}</div></div>
  </div>
</div>

<table class="item-table">
  <thead>
    <tr>
      <th style="width:20px">NO</th>
      <th style="text-align:left;width:22%">Description</th>
      <th style="text-align:left;width:14%">Model</th>
      <th style="width:28px">Qty</th>
      <th style="width:13%">Unit Price</th>
      <th style="width:13%">Amount</th>
      <th style="width:10%">VAT</th>
      <th style="text-align:left">Remark</th>
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

<!-- TERMS & 합계: table로 나란히 배치 (색상 문제 완전 해결) -->
<table class="bottom-table">
  <tr>
    <td>
      <div class="terms-box">
        <div class="t-hdr">TERMS &amp; CONDITIONS</div>
        <div class="t-row"><div class="t-label">Delivery</div><div class="t-val">${terms.delivery||''}</div></div>
        <div class="t-row"><div class="t-label">Validity</div><div class="t-val">${terms.validity||''}</div></div>
        <div class="t-row"><div class="t-label">Payment</div><div class="t-val">${terms.payment||''}</div></div>
      </div>
    </td>
    <td>
      <div class="amt-box">
        <div class="a-row"><span>Supply Amount</span><span>₩ ${fmtNumber(totalSupply)}</span></div>
        <div class="a-row last"><span>VAT (10%)</span><span>₩ ${fmtNumber(totalVat)}</span></div>
        <div class="a-total"><span>TOTAL</span><span>₩ ${fmtNumber(grandTotal)}</span></div>
      </div>
    </td>
  </tr>
</table>

<div class="footer">
  We hereby submit our quotation as above. &nbsp;|&nbsp;
  Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &nbsp;|&nbsp;
  ODA Technologies Co., Ltd.
</div>
<script>
document.fonts.ready.then(function(){
  setTimeout(function(){ window.print(); window.onafterprint=function(){window.close();}; }, 400);
});
<\/script>
</body></html>`;

  const w = window.open('','_blank','width=900,height=760');
  w.document.write(html);
  w.document.close();
}
