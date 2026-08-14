import { fmtNumber } from "./helpers";

export function exportToPdf(data) {
  const {
    docNo, staff, supplier,
    customer, contact,
    items, terms,
    totalSupply, totalVat, grandTotal,
  } = data;

  const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}logo.png`;
  const shortNo = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${fileName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Arial:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR','Arial',sans-serif;font-size:10.5px;color:#111;background:#fff;padding:12mm 12mm 10mm;}
@page{size:A4;margin:0;}
@media print{body{padding:8mm 10mm;}}

/* ── 상단 헤더: 로고 좌 / QUOTATION 우 ── */
.top-header{
  display:flex;align-items:flex-start;justify-content:space-between;
  margin-bottom:10px;
}
.top-header img{height:44px;object-fit:contain;}
.top-header .title-block{text-align:right;}
.top-header .title-block .quotation-title{
  font-size:28px;font-weight:700;letter-spacing:3px;color:#111;line-height:1;
}
.top-header .title-block .subtitle{
  font-size:8px;letter-spacing:1.5px;color:#888;margin-top:3px;
}

/* ── INFO 2컬럼 테이블 ── */
.info-table{width:100%;border-collapse:collapse;margin-bottom:10px;}
.info-table td{padding:0;}

.info-box{width:50%;vertical-align:top;}
.info-box-inner{border:1px solid #ccc;}
.info-box-inner + .info-box-inner{border-left:none;}

.info-title{
  background:#1a1a1a;color:#fff;
  font-size:9px;font-weight:700;letter-spacing:.08em;
  padding:4px 8px;
}
.info-row{display:flex;border-top:1px solid #e0e0e0;}
.info-label{
  background:#f5f5f5;
  font-size:9px;font-weight:700;color:#444;
  padding:4px 8px;min-width:90px;width:90px;
  border-right:1px solid #e0e0e0;
  display:flex;align-items:center;
}
.info-value{
  padding:4px 8px;font-size:9.5px;color:#111;
  display:flex;align-items:center;flex:1;
}
.info-value.accent{color:#E84B00;font-weight:600;}

/* ── 품목 테이블 ── */
.item-table{width:100%;border-collapse:collapse;margin-bottom:0;}
.item-table thead tr{background:#1a1a1a;color:#fff;}
.item-table th{
  padding:6px 5px;text-align:center;
  font-size:9px;font-weight:700;letter-spacing:.04em;
  border-right:1px solid #444;white-space:nowrap;
}
.item-table th:last-child{border-right:none;}
.item-table td{
  padding:5px 6px;border-bottom:1px solid #e8e8e8;
  border-right:1px solid #eee;vertical-align:middle;font-size:9.5px;
}
.item-table td:last-child{border-right:none;}
.item-table tr:nth-child(even) td{background:#fafafa;}
.item-table .detail-row td{
  background:#f5f7fb!important;color:#666;
  font-size:8.5px;padding:2px 6px 2px 20px;
  border-bottom:1px solid #f0f0f0;
}
td.c{text-align:center;}
td.r{text-align:right;}
td.b{font-weight:700;}

/* ── 하단: TERMS 좌 / 합계 우 ── */
.bottom-section{
  display:grid;grid-template-columns:1fr 1fr;
  gap:12px;margin-top:10px;
}
.terms-box{border:1px solid #ccc;}
.terms-title{
  background:#1a1a1a;color:#fff;
  font-size:9px;font-weight:700;letter-spacing:.06em;
  padding:4px 8px;
}
.terms-row{display:flex;border-top:1px solid #e0e0e0;}
.terms-label{
  background:#f5f5f5;font-size:9px;font-weight:700;color:#444;
  padding:4px 8px;min-width:110px;width:110px;
  border-right:1px solid #e0e0e0;display:flex;align-items:center;
}
.terms-value{padding:4px 8px;font-size:9.5px;flex:1;display:flex;align-items:center;}

.amt-box{border:1px solid #ccc;}
.amt-row{
  display:flex;justify-content:space-between;
  padding:5px 10px;border-bottom:1px solid #e0e0e0;
  font-size:9.5px;
}
.amt-row:last-child{border-bottom:none;}
.amt-row.total{
  background:#1a1a1a;color:#fff;
  font-weight:700;font-size:11px;padding:7px 10px;
}
.amt-label{color:inherit;}
.amt-value{font-weight:600;color:inherit;}

/* ── 하단 서명 ── */
.footer{
  margin-top:12px;text-align:center;
  color:#aaa;font-size:8.5px;
  border-top:1px solid #eee;padding-top:6px;
}

/* ── 오렌지 구분선 (로고 하단) ── */
.orange-bar{
  height:3px;background:#E84B00;
  margin-bottom:8px;
}
</style>
</head>
<body>

<!-- 상단: 로고 + QUOTATION 타이틀 -->
<div class="top-header">
  <img src="${logoUrl}" alt="ODA Technologies" onerror="this.style.display='none'"/>
  <div class="title-block">
    <div class="quotation-title">QUOTATION</div>
    <div class="subtitle">PARTNER SHIP, CORE POWER OF ODA</div>
  </div>
</div>
<div class="orange-bar"></div>

<!-- CUSTOMER / ODA TECHNOLOGIES 정보 -->
<table class="info-table">
  <tr>
    <td class="info-box" style="padding-right:6px;">
      <div class="info-box-inner">
        <div class="info-title">CUSTOMER</div>
        <div class="info-row"><div class="info-label">Bill To</div><div class="info-value b">${customer||''}</div></div>
        <div class="info-row"><div class="info-label">Attention</div><div class="info-value">${contact.name||''}</div></div>
        <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${contact.phone||''}</div></div>
        <div class="info-row"><div class="info-label">E-mail</div><div class="info-value">${contact.email||''}</div></div>
      </div>
    </td>
    <td class="info-box" style="padding-left:6px;">
      <div class="info-box-inner">
        <div class="info-title">ODA TECHNOLOGIES</div>
        <div class="info-row"><div class="info-label">Doc. No.</div><div class="info-value accent">${docNo}</div></div>
        <div class="info-row"><div class="info-label">Supplier</div><div class="info-value accent">${supplier.name}</div></div>
        <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-value accent">${supplier.bizNo}</div></div>
        <div class="info-row"><div class="info-label">Sales Rep.</div><div class="info-value">${staff.name||''}</div></div>
        <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${staff.phone||''}</div></div>
      </div>
    </td>
  </tr>
</table>

<!-- 품목 테이블 -->
<table class="item-table">
  <thead>
    <tr>
      <th style="width:24px">NO</th>
      <th style="width:22%">Description</th>
      <th style="width:15%">Model</th>
      <th style="width:40px">Qty</th>
      <th style="width:13%">Unit Price</th>
      <th style="width:13%">Amount</th>
      <th style="width:10%">VAT</th>
      <th>Remark</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((item, idx) => `
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
    ${(item.details||[]).map(d=>`
    <tr class="detail-row">
      <td></td><td colspan="7">- ${d}</td>
    </tr>`).join('')}
    `).join('')}
  </tbody>
</table>

<!-- 하단: TERMS + 합계 -->
<div class="bottom-section">
  <div class="terms-box">
    <div class="terms-title">TERMS &amp; CONDITIONS</div>
    <div class="terms-row"><div class="terms-label">Delivery</div><div class="terms-value">${terms.delivery||''}</div></div>
    <div class="terms-row"><div class="terms-label">Validity</div><div class="terms-value">${terms.validity||''}</div></div>
    <div class="terms-row"><div class="terms-label">Payment</div><div class="terms-value">${terms.payment||''}</div></div>
  </div>
  <div class="amt-box">
    <div class="amt-row"><span class="amt-label">Supply Amount</span><span class="amt-value">₩ ${fmtNumber(totalSupply)}</span></div>
    <div class="amt-row"><span class="amt-label">VAT (10%)</span><span class="amt-value">₩ ${fmtNumber(totalVat)}</span></div>
    <div class="amt-row total"><span class="amt-label">TOTAL</span><span class="amt-value">₩ ${fmtNumber(grandTotal)}</span></div>
  </div>
</div>

<div class="footer">
  We hereby submit our quotation as above. &nbsp;|&nbsp; Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &nbsp;|&nbsp; ODA Technologies Co., Ltd.
</div>

<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=960,height=760');
  w.document.write(html);
  w.document.close();
}
