import { fmtNumber } from "./helpers";
import logoSrc from "../assets/logo.png";

function formatDateEn(dateStr) {
  if (!dateStr) return "";
  return dateStr; // YYYY-MM-DD 그대로 표시
}

export function exportToPdf(data) {
  const { docNo, date, staff, supplier, customer, contact, items, terms, memo, memoColor, totalSupply, totalVat, grandTotal } = data;
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
  @page{size:A4 portrait;margin:0;-webkit-print-color-adjust:exact;}
}

/* 상단 */
.top-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6px;flex-shrink:0;}
.logo-wrap img{height:32px;object-fit:contain;display:block;}
.title-block{text-align:right;}
.quotation-title{font-size:24px;font-weight:800;letter-spacing:7px;color:#111;display:block;line-height:1;}
.subtitle{font-size:8px;letter-spacing:2.5px;color:#aaa;margin-top:3px;display:block;text-transform:uppercase;}
.orange-bar{height:2.5px;background:${ODA};margin-bottom:12px;flex-shrink:0;}

/* INFO - table 방식 (인쇄 배경색 안정) */
.info-table{width:100%;border-collapse:collapse;margin-bottom:14px;flex-shrink:0;}
.info-table > tbody > tr > td{width:50%;vertical-align:top;padding:0;}
.info-table > tbody > tr > td:first-child{padding-right:3px;}
.info-table > tbody > tr > td:last-child{padding-left:3px;}
.i-box{width:100%;border-collapse:collapse;border:1px solid #ccc;}
.i-box tr.hdr td{background:${DARK};color:#fff;font-size:9px;font-weight:700;padding:4px 8px;letter-spacing:.1em;border:none;}
.i-box tr td{border-top:1px solid #e0e0e0;padding:4px 7px;font-size:10px;color:#111;}
.i-box tr td.lbl{background:#f4f4f4;font-size:9px;font-weight:700;color:#555;width:70px;border-right:1px solid #e0e0e0;white-space:nowrap;}

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
<table class="info-table"><tr>
  <td>
    <table class="i-box">
      <tr class="hdr"><td colspan="2">CUSTOMER</td></tr>
      <tr><td class="lbl">Company</td><td style="font-weight:700">${customer||''}</td></tr>
      <tr><td class="lbl">Contact</td><td>${contact.name||''}</td></tr>
      <tr><td class="lbl">Tel.</td><td>${contact.phone||''}</td></tr>
      <tr><td class="lbl">E-mail</td><td>${contact.email||''}</td></tr>
      <tr><td class="lbl">Date</td><td style="font-weight:600">${formatDateEn(date)}</td></tr>
    </table>
  </td>
  <td>
    <table class="i-box">
      <tr class="hdr"><td colspan="2">ODA TECHNOLOGIES</td></tr>
      <tr><td class="lbl">Doc. No.</td><td style="font-weight:700">${docNo}</td></tr>
      <tr><td class="lbl">Supplier</td><td>${supplier.name}</td></tr>
      <tr><td class="lbl">Reg. No.</td><td>${supplier.bizNo}</td></tr>
      <tr><td class="lbl">Sales Rep.</td><td>${staff.name||''}</td></tr>
      <tr><td class="lbl">Tel.</td><td>${staff.phone||''}</td></tr>
    </table>
  </td>
</tr></table>

<!-- 품목 -->
<table class="item-table">
  <thead>
    <tr>
      <th style="width:20px">NO</th>
      <th style="text-align:center;width:26%">Description</th>
      <th style="text-align:center;width:18%">Model</th>
      <th style="width:28px">Qty</th>
      <th style="width:12%">Unit Price</th>
      <th style="width:12%">Amount</th>
      <th style="width:9%">VAT</th>
      <th style="text-align:center;width:7%">Remark</th>
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
    ${(() => {
      let rows = "";
      // 번들 구성품 목록
      if (item.isBundle && item.bundleItems?.length > 0) {
        rows += `<tr class="detail-row"><td></td><td colspan="7" style="padding-top:5px;padding-bottom:2px;font-weight:700;color:#444;font-size:7.5px;border-bottom:1px dashed #ddd;">▸ 구성품 내역</td></tr>`;
        rows += item.bundleItems.map(b => {
          const baseAmt = (Number(b.qty)||1) * (Number(b.unitPrice)||0);
          const nego = Number(b.nego||0);
          const finalAmt = nego > 0 ? Math.round(baseAmt * (1 - nego/100)) : baseAmt;
          const negoStr = nego > 0 ? ` <span style="color:#e07000">(NEGO ${nego}%)</span>` : "";
          return `<tr class="detail-row"><td></td><td colspan="7">&nbsp;&nbsp;· ${b.name}${Number(b.qty)>1?" ×"+b.qty:""} &nbsp;<span style="color:#888;">₩${finalAmt.toLocaleString("ko-KR")}${negoStr}</span></td></tr>`;
        }).join("");
      }
      // 상세사양
      const details = item.details || [];
      if (details.length > 0) {
        if (item.isBundle) {
          rows += `<tr class="detail-row"><td></td><td colspan="7" style="padding-top:5px;padding-bottom:2px;font-weight:700;color:#444;font-size:7.5px;border-bottom:1px dashed #ddd;border-top:1px dashed #eee;">▸ 상세 사양</td></tr>`;
        }
        rows += details.map(d=>`<tr class="detail-row"><td></td><td colspan="7">- ${d}</td></tr>`).join("");
      }
      return rows;
    })()}
    `).join('')}
  </tbody>
</table>

<div class="spacer"></div>
${memo ? `
<div style="margin-bottom:10px;padding:6px 2px;font-size:9px;color:${memoColor||"#111"};line-height:1.8;flex-shrink:0;white-space:pre-wrap;font-weight:${(memoColor&&memoColor!=="#111111")?"600":"400"};">${memo}</div>
` : ""}

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
  var body = document.body;
  var mmToPx = 3.7795275591;
  var maxH = 297 * mmToPx;
  var contentH = body.scrollHeight;
  if (contentH > maxH) {
    var scale = Math.floor((maxH / contentH) * 100) / 100;
    body.style.zoom = scale;
  }
  setTimeout(function(){
    window.print();
    window.onafterprint = function(){ window.close(); };
  }, 450);
});
<\/script>
</body></html>`;

  const w = window.open('','_blank','width=900,height=760');
  w.document.write(html);
  w.document.close();
}
