import { fmtNumber } from "./helpers";
import logoSrc      from "../assets/logo.png";
import signatureSrc from "../assets/signature.png";

export function exportToPdfOverseas(data) {
  const {
    docNo, items, totalUSD,
    // 해외 전용 필드
    overseasForm = {},
  } = data;

  const {
    shipperCompany  = "ODA Technologies Co., Ltd.",
    shipperAddress  = "62, Bupyeong-daero 329 Beon-gil, Bupyeong-gu, Incheon, Republic of Korea (21315)",
    shipperAttn     = "",
    shipperTel      = "",
    shipperFax      = "82-32-715-5456",
    shipperEmail    = "",
    consigneeCompany= "",
    consigneeAddress= "",
    consigneeAttn   = "",
    consigneeTel    = "",
    consigneeEmail  = "",
    invoiceNo       = docNo,
    payment         = "T/T before shipment",
    lcBank          = "",
    buyer           = "",
    portLoading     = "Incheon",
    finalDest       = "",
    carrier         = "BY AIR",
    sailingDate     = "",
    remarks         = "",
    marks           = "MADE IN Korea",
    hsCodes         = [],
    priceTerm       = "",
    leadTime        = "",
    validUntil      = "",
    bankInfo        = `Industrial Bank of Korea/Gal San-Yeok Branch\nAccount no. : 483-022203-56-00012\nSwift Code : IBKOKRSE\nBenef'y name : ODA Technologies`,
  } = overseasForm;

  const fileName = `Quotation_${docNo.replace(/[^a-zA-Z0-9]/g,"_")}`;

  const fmtUSD = (n) => n != null
    ? "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})
    : "-";

  const validDateStr = validUntil
    ? new Date(validUntil).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})
    : "";

  const dateStr = new Date().toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"})
    .replace(",","").split(" ");
  const invoiceDateStr = `${dateStr[0]}th ${dateStr[1]}, ${dateStr[2]}`;

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
  font-family:'Arial','Noto Sans KR',sans-serif;
  font-size:8.5px;color:#111;background:#fff;
  padding:10mm 12mm;
  display:flex;flex-direction:column;
}
@page{size:A4 portrait;margin:0;}
@media print{
  html,body{width:210mm;}
  body{padding:10mm 12mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}

/* 타이틀 */
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.top .title{font-size:20px;font-weight:700;letter-spacing:2px;color:#111;text-align:center;flex:1;}
.top .logo{height:38px;object-fit:contain;}

/* 메인 테이블 */
.main-tbl{width:100%;border-collapse:collapse;font-size:8px;margin-bottom:6px;}
.main-tbl td,.main-tbl th{border:1px solid #999;padding:3.5px 5px;vertical-align:top;}
.main-tbl .hdr{font-weight:700;font-size:7.5px;text-decoration:underline;}
.main-tbl .val{font-size:8px;}

/* 품목 테이블 */
.item-tbl{width:100%;border-collapse:collapse;font-size:8px;margin-bottom:6px;}
.item-tbl td,.item-tbl th{border:1px solid #999;padding:4px 5px;vertical-align:middle;}
.item-tbl th{font-weight:700;font-size:8px;text-align:center;}
.item-tbl td.c{text-align:center;}
.item-tbl td.r{text-align:right;}
.item-tbl td.b{font-weight:700;}

/* TOTAL */
.total-row{display:flex;justify-content:space-between;border-top:2px solid #333;border-bottom:1px solid #999;padding:5px 5px;font-weight:700;font-size:9px;margin-bottom:8px;}

/* Conditions */
.cond{font-size:8px;line-height:1.6;margin-bottom:8px;}
.cond .lead{color:#B45309;font-weight:700;background:#FEF9C3;padding:0 2px;}

/* 서명 영역 */
.sign-area{display:flex;justify-content:flex-end;align-items:flex-end;gap:20px;margin-top:4px;}
.sign-left{font-size:8.5px;font-weight:700;}
.sign-right{text-align:right;}
.sign-right img.sig{height:48px;object-fit:contain;}
.sign-right .company-name{font-size:11px;font-weight:700;font-style:italic;color:#1a3a6e;}
.sign-right .president{font-size:9px;font-weight:700;font-style:italic;color:#1a3a6e;}
</style>
</head>
<body>

<!-- 타이틀 -->
<div class="top">
  <div class="title">QUOTATION</div>
  <img src="${logoSrc}" class="logo" alt="ODA"/>
</div>

<!-- 메인 정보 테이블 -->
<table class="main-tbl">
  <tr>
    <!-- 좌: Shipper -->
    <td rowspan="5" style="width:48%;vertical-align:top;">
      <div class="hdr">Shipper/Exporter</div>
      <div class="val" style="font-weight:700;margin-top:2px;">${shipperCompany}</div>
      <div class="val">${shipperAddress}</div>
      <br/>
      ${shipperAttn ? `<div class="val"><b>Attn : ${shipperAttn}</b></div>` : ""}
      ${shipperTel  ? `<div class="val">Tel : ${shipperTel}</div>` : ""}
      ${shipperFax  ? `<div class="val">Fax : ${shipperFax}</div>` : ""}
      ${shipperEmail? `<div class="val">E-mail : ${shipperEmail}</div>` : ""}
      <br/>
      <div class="hdr">Consignee</div>
      <div class="val" style="font-weight:700;margin-top:2px;">${consigneeCompany}</div>
      ${consigneeAddress ? `<div class="val">${consigneeAddress}</div>` : ""}
      <br/>
      ${consigneeAttn  ? `<div class="val"><b>Attn: ${consigneeAttn}</b></div>` : ""}
      ${consigneeTel   ? `<div class="val">Tel: ${consigneeTel}</div>` : ""}
      ${consigneeEmail ? `<div class="val">E: ${consigneeEmail}</div>` : ""}
    </td>
    <!-- 우상: Invoice No & Date -->
    <td colspan="2">
      <span class="hdr">No.&amp; Date of Invoice</span><br/>
      <span class="val">${invoiceNo},</span>
      <span class="val" style="float:right">${invoiceDateStr}</span>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="hdr">Payment</div>
      <div class="val" style="text-align:center;font-weight:700;margin-top:2px;">${payment}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="hdr">L/C issuing bank</div>
      <div class="val" style="min-height:16px;">${lcBank}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="hdr">Buyer (if other than consignee)</div>
      <div class="val" style="min-height:16px;">${buyer}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="hdr">Remarks</div>
      <div class="val" style="min-height:24px;">${remarks}</div>
    </td>
  </tr>
  <!-- Port / Destination / Carrier -->
  <tr>
    <td style="width:48%">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="border-right:1px solid #999;padding-right:6px;width:50%">
            <div class="hdr">Port of loading</div>
            <div class="val">${portLoading}</div>
          </td>
          <td style="padding-left:6px;">
            <div class="hdr">Final destination</div>
            <div class="val">${finalDest}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4px;">
            <div class="hdr">Carrier</div>
            <div class="val">${carrier}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:4px;">
            <div class="hdr">Sailing on or about</div>
            <div class="val">${sailingDate}</div>
          </td>
        </tr>
      </table>
    </td>
    <td colspan="2" style="vertical-align:top;">
      <!-- 빈 공간 (우측 하단) -->
    </td>
  </tr>
</table>

<!-- 품목 테이블 -->
<table class="item-tbl">
  <thead>
    <tr>
      <th style="width:28%">Marks/No.of PKGS.</th>
      <th style="width:35%">Description</th>
      <th style="width:13%">Quantity</th>
      <th style="width:12%">Unit Price(USD)</th>
      <th style="width:12%">Total Price(USD)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align:top;line-height:1.8;">
        <div class="val"><b>${marks}</b></div>
        ${hsCodes.length > 0 ? `<div class="val" style="margin-top:4px;"><b>HS CODE :</b></div>${hsCodes.map(c=>`<div class="val">${c}</div>`).join("")}` : ""}
      </td>
      <td style="vertical-align:top;">
        ${items.map((item,idx) => `
          <div style="font-weight:700;margin-bottom:2px;">${item.category||""}</div>
          <div style="margin-bottom:${idx<items.length-1?'10px':'0'}">${item.spec||""}</div>
          ${(item.details||[]).map(d=>`<div style="font-size:7.5px;color:#555;">- ${d}</div>`).join("")}
        `).join('<div style="height:8px;"></div>')}
      </td>
      <td style="vertical-align:top;">
        ${items.map(item => `
          <div style="text-align:center;margin-bottom:12px;">${item.qty} PCS</div>
        `).join("")}
      </td>
      <td style="vertical-align:top;">
        ${items.map(item => `
          <div style="text-align:right;margin-bottom:12px;">${fmtUSD(item.unitPriceUSD||item.unitPrice)}</div>
        `).join("")}
      </td>
      <td style="vertical-align:top;">
        ${items.map(item => `
          <div style="text-align:right;font-weight:700;margin-bottom:12px;">${fmtUSD(item.amountUSD||item.amount)}</div>
        `).join("")}
      </td>
    </tr>
  </tbody>
</table>

<!-- TOTAL -->
<div class="total-row">
  <span>TOTAL Amount (USD)/${priceTerm ? priceTerm.split(" ")[0] : "DAP"}</span>
  <span>${fmtUSD(totalUSD)}</span>
</div>

<!-- Conditions -->
<div class="cond">
  <div><b>Conditions;</b></div>
  ${priceTerm ? `<div>1. Price term: ${priceTerm}</div>` : ""}
  ${leadTime  ? `<div>2. Lead time: <span class="lead">${leadTime}</span></div>` : ""}
  ${validDateStr ? `<div>3. This quotation is valid untill ${validDateStr} .</div>` : ""}
  <div>4. Bank information</div>
  ${bankInfo.split("\n").map(l=>`<div style="margin-left:12px;">${l}</div>`).join("")}
</div>

<!-- 서명 -->
<div class="sign-area">
  <div class="sign-left">Signed by</div>
  <div class="sign-right">
    <div class="company-name">ODA Technologies CO.,LTD</div>
    <img src="${signatureSrc}" class="sig" alt="signature"/>
    <div class="president"><i>ODA Technologies Co.,Ltd.</i></div>
    <div class="president">President / Kim Jung Suk</div>
  </div>
</div>

<script>
document.fonts.ready.then(function(){
  setTimeout(function(){
    window.print();
    window.onafterprint = function(){ window.close(); };
  }, 500);
});
<\/script>
</body></html>`;

  const w = window.open("","_blank","width=900,height=760");
  w.document.write(html);
  w.document.close();
}
