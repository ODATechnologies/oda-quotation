import { fmtNumber } from "./helpers";

export function exportToPdf(data) {
  const { docNo, staff, supplier, customer, contact, items, terms, totalSupply, totalVat, grandTotal } = data;

  const shortNo  = docNo.replace("ODA-", "");
  const fileName = `Quotation for ${customer} ${shortNo}`;
  const ODA      = "#F84F04";
  const DARK     = "#1a1a1a";

  // 로고는 base64로 변환해서 직접 삽입 (외부 URL 참조 문제 방지)
  const logoUrl = `${location.origin}${import.meta.env.BASE_URL}logo.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${fileName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:210mm;min-height:297mm;}
body{
  font-family:'Noto Sans KR','Arial',sans-serif;
  font-size:9.5px;color:#111;background:#fff;
  padding:10mm 12mm;
}
@page{size:A4 portrait;margin:0;}
@media print{
  html,body{width:210mm;}
  body{padding:10mm 12mm;}
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}

/* 상단 헤더 */
.top-header{
  display:flex;align-items:flex-end;
  justify-content:space-between;
  margin-bottom:0;padding-bottom:5px;
}
.logo-wrap img{height:44px;object-fit:contain;display:block;}
.title-block{text-align:right;}
.quotation-title{
  font-size:26px;font-weight:800;
  letter-spacing:10px;color:#111;
  display:block;line-height:1;
}
.subtitle{
  font-size:6.5px;letter-spacing:3px;
  color:#aaa;margin-top:4px;display:block;
  text-transform:uppercase;
}
.orange-bar{height:3px;background:${ODA};margin-bottom:8px;}

/* INFO 2컬럼 */
.info-wrap{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;}
.info-box{border:1px solid #ccc;}
.info-title{
  background:${DARK};color:#fff;
  font-size:7.5px;font-weight:700;letter-spacing:.1em;
  padding:3px 7px;
}
.info-row{display:flex;border-top:1px solid #e2e2e2;}
.info-label{
  background:#f4f4f4;font-size:7.5px;font-weight:700;color:#555;
  padding:3px 6px;min-width:75px;width:75px;
  border-right:1px solid #e2e2e2;
  display:flex;align-items:center;
}
.info-value{
  padding:3px 6px;font-size:8px;color:#111;
  display:flex;align-items:center;flex:1;
}

/* 품목 테이블 */
.item-table{width:100%;border-collapse:collapse;font-size:8.5px;margin-bottom:8px;}
.item-table thead tr{background:${ODA};}
.item-table th{
  color:#fff;padding:5px 4px;text-align:center;
  font-size:7.5px;font-weight:700;letter-spacing:.04em;
  border-right:1px solid rgba(255,255,255,.25);white-space:nowrap;
}
.item-table th:last-child{border-right:none;}
.item-table td{
  padding:4.5px 5px;
  border-bottom:1px solid #ebebeb;
  border-right:1px solid #f2f2f2;
  vertical-align:middle;font-size:8.5px;
}
.item-table td:last-child{border-right:none;}
.item-table tr:nth-child(even) td{background:#fafafa;}
.detail-row td{
  background:#f4f6fb!important;color:#555;
  font-size:7.5px;padding:2px 5px 2px 14px;
  border-bottom:1px solid #f0f0f0;font-style:italic;
}
td.c{text-align:center;}td.r{text-align:right;}td.b{font-weight:700;}

/* 하단 */
.bottom-section{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.terms-box{border:1px solid #ccc;}
.terms-title{
  background:${DARK};color:#fff;
  font-size:7.5px;font-weight:700;letter-spacing:.08em;
  padding:3px 7px;
}
.terms-row{display:flex;border-top:1px solid #e2e2e2;}
.terms-label{
  background:#f4f4f4;font-size:7.5px;font-weight:700;color:#555;
  padding:3px 6px;min-width:70px;width:70px;
  border-right:1px solid #e2e2e2;display:flex;align-items:center;
}
.terms-value{padding:3px 6px;font-size:8px;flex:1;display:flex;align-items:center;}
.amt-box{border:1px solid #ccc;}
.amt-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:4.5px 9px;border-bottom:1px solid #e2e2e2;font-size:8.5px;
}
.amt-row:last-child{border-bottom:none;}
.amt-row.total{
  background:${ODA};color:#fff;
  font-weight:800;font-size:11px;padding:7px 9px;
}

.footer{
  margin-top:8px;text-align:center;color:#bbb;
  font-size:7px;border-top:1px solid #eee;padding-top:5px;
}
</style>
</head>
<body>

<!-- 로고 좌 / QUOTATION 우 -->
<div class="top-header">
  <div class="logo-wrap">
    <img id="logo-img" alt="ODA Technologies"/>
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
    <div class="info-row"><div class="info-label">Doc. No.</div><div class="info-value" style="font-weight:700">${docNo}</div></div>
    <div class="info-row"><div class="info-label">Supplier</div><div class="info-value">${supplier.name}</div></div>
    <div class="info-row"><div class="info-label">Reg. No.</div><div class="info-value">${supplier.bizNo}</div></div>
    <div class="info-row"><div class="info-label">Sales Rep.</div><div class="info-value">${staff.name||''}</div></div>
    <div class="info-row"><div class="info-label">Phone</div><div class="info-value">${staff.phone||''}</div></div>
  </div>
</div>

<!-- 품목 -->
<table class="item-table">
  <thead>
    <tr>
      <th style="width:20px">NO</th>
      <th style="width:22%">Description</th>
      <th style="width:14%">Model</th>
      <th style="width:30px">Qty</th>
      <th style="width:13%">Unit Price</th>
      <th style="width:13%">Amount</th>
      <th style="width:10%">VAT</th>
      <th>Remark</th>
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
// 로고를 fetch → base64 → img.src 방식으로 삽입 (크로스오리진 문제 없음)
(async function() {
  try {
    const res  = await fetch("${logoUrl}");
    const blob = await res.blob();
    const b64  = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
    document.getElementById('logo-img').src = b64;
  } catch(e) {
    document.querySelector('.logo-wrap').style.display = 'none';
  }
  // 폰트 로드 후 인쇄
  await document.fonts.ready;
  setTimeout(() => {
    window.print();
    window.onafterprint = () => window.close();
  }, 400);
})();
<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=760');
  w.document.write(html);
  w.document.close();
}
