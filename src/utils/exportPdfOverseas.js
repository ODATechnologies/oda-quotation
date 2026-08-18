import { fmtNumber } from "./helpers";
import logoSrc      from "../assets/logo.png";
import signatureSrc from "../assets/signature.png";

export function exportToPdfOverseas(data) {
  const { docNo, items, totalUSD, overseasForm = {} } = data;

  const {
    shipperCompany   = "ODA Technologies Co., Ltd.",
    shipperAddress   = "62, Bupyeong-daero 329 Beon-gil, Bupyeong-gu, Incheon, Republic of Korea (21315)",
    shipperAttn      = "",
    shipperTel       = "",
    shipperFax       = "82-32-715-5456",
    shipperEmail     = "",
    consigneeCompany = "",
    consigneeAddress = "",
    consigneeAttn    = "",
    consigneeTel     = "",
    consigneeEmail   = "",
    invoiceNo        = docNo,
    payment          = "T/T before shipment",
    lcBank           = "",
    buyer            = "",
    portLoading      = "Incheon",
    finalDest        = "",
    carrier          = "BY AIR",
    sailingDate      = "",
    remarks          = "",
    marks            = "MADE IN Korea",
    hsCodes          = [],
    priceTerm        = "",
    leadTime         = "",
    validUntil       = "",
    bankInfo         = `Industrial Bank of Korea/Gal San-Yeok Branch\nAccount no. : 483-022203-56-00012\nSwift Code : IBKOKRSE\nBenef'y name : ODA Technologies`,
  } = overseasForm;

  const fileName = `Quotation_${docNo.replace(/[^a-zA-Z0-9]/g,"_")}`;

  const fmtUSD = (n) => n != null
    ? "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})
    : "-";

  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const invoiceDateStr = `${now.getDate()}th ${months[now.getMonth()]}, ${now.getFullYear()}`;

  const validDateStr = validUntil
    ? new Date(validUntil).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})
    : "";

  // 품목 rows - 각 품목마다 독립 행
  const itemRows = items.map((item, idx) => {
    const usd    = item.unitPriceUSD ?? item.unitPrice ?? 0;
    const total  = item.amountUSD   ?? item.amount    ?? 0;
    const qty    = item.qty ?? 1;
    const details = (item.details||[]).map(d=>`<div style="font-size:7px;color:#555;margin-top:1px;">- ${d}</div>`).join("");
    return `
    <tr>
      <td style="vertical-align:top;padding:6px 5px;">
        <div style="font-weight:700;font-size:8px;">${item.category||""}</div>
        <div style="font-size:8px;margin-top:1px;">${item.spec||""}</div>
        ${details}
      </td>
      <td style="text-align:center;vertical-align:top;padding:6px 5px;font-size:8px;">${qty} PCS</td>
      <td style="text-align:right;vertical-align:top;padding:6px 5px;font-size:8px;">${fmtUSD(usd)}</td>
      <td style="text-align:right;vertical-align:top;padding:6px 5px;font-size:8px;font-weight:700;">${fmtUSD(total)}</td>
    </tr>`;
  }).join("");

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
.top .spacer{width:20px;height:20px;}
.top .logo{height:20px;object-fit:contain;}
.top .title{font-size:20px;font-weight:700;letter-spacing:2px;color:#111;text-align:center;flex:1;}

/* 공통 테이블 */
.bd{border:1px solid #999;}
.hdr{font-weight:700;font-size:7.5px;text-decoration:underline;}
.val{font-size:8px;}

/* 품목 테이블 */
.item-tbl{width:100%;border-collapse:collapse;font-size:8px;margin-bottom:0;}
.item-tbl td,.item-tbl th{border:1px solid #999;}
.item-tbl th{font-weight:700;font-size:8px;text-align:center;padding:4px 5px;background:#f5f5f5;}

/* TOTAL */
.total-row{border-top:2px solid #333;border-bottom:1px solid #999;
  display:flex;justify-content:space-between;padding:5px;
  font-weight:700;font-size:9px;margin-bottom:8px;}

/* Conditions */
.cond{font-size:8px;line-height:1.7;margin-bottom:8px;}
.lead-hl{color:#B45309;font-weight:700;background:#FEF9C3;padding:0 2px;}

/* 서명 */
.sign-area{display:flex;justify-content:flex-end;align-items:flex-end;gap:16px;margin-top:6px;}
.sign-label{font-size:8.5px;font-weight:700;white-space:nowrap;}
.sign-block{text-align:right;}
.sign-block .company1{font-size:12px;font-weight:700;font-style:italic;color:#1a3a6e;}
.sign-block img{height:44px;object-fit:contain;display:block;margin:2px 0 2px auto;}
.sign-block .company2{font-size:8.5px;font-style:italic;color:#1a3a6e;}
.sign-block .president{font-size:8.5px;font-weight:700;font-style:italic;color:#1a3a6e;}
</style>
</head>
<body>

<!-- 타이틀: 로고 좌 더미 / QUOTATION 중앙 / 로고 우 -->
<div class="top">
  <div class="spacer"></div>
  <div class="title">QUOTATION</div>
  <img src="${logoSrc}" class="logo" alt="ODA"/>
</div>

<!-- 상단 정보 테이블 (6:4 비율) -->
<table style="width:100%;border-collapse:collapse;margin-bottom:0;" class="bd">
  <colgroup>
    <col style="width:60%"/>
    <col style="width:40%"/>
  </colgroup>
  <tbody>
    <!-- Row1: Shipper / Invoice No -->
    <tr>
      <td rowspan="6" style="border-right:1px solid #999;padding:6px 7px;vertical-align:top;">
        <div class="hdr">Shipper/Exporter</div>
        <div class="val" style="font-weight:700;margin-top:2px;">${shipperCompany}</div>
        <div class="val">${shipperAddress}</div>
        <br/>
        ${shipperAttn  ? `<div class="val"><b>Attn : ${shipperAttn}</b></div>` : ""}
        ${shipperTel   ? `<div class="val">Tel : ${shipperTel}</div>` : ""}
        ${shipperFax   ? `<div class="val">Fax : ${shipperFax}</div>` : ""}
        ${shipperEmail ? `<div class="val">E-mail : ${shipperEmail}</div>` : ""}
        <br/>
        <div class="hdr">Consignee</div>
        <div class="val" style="font-weight:700;margin-top:2px;">${consigneeCompany}</div>
        ${consigneeAddress ? `<div class="val">${consigneeAddress}</div>` : ""}
        <br/>
        ${consigneeAttn  ? `<div class="val"><b>Attn: ${consigneeAttn}</b></div>` : ""}
        ${consigneeTel   ? `<div class="val">Tel: ${consigneeTel}</div>` : ""}
        ${consigneeEmail ? `<div class="val">E: ${consigneeEmail}</div>` : ""}
      </td>
      <td style="border-bottom:1px solid #999;padding:5px 7px;">
        <div class="hdr">No.&amp; Date of Invoice</div>
        <div class="val" style="display:flex;justify-content:space-between;margin-top:2px;">
          <span>${invoiceNo}</span><span>${invoiceDateStr}</span>
        </div>
      </td>
    </tr>
    <!-- Row2: Payment -->
    <tr>
      <td style="border-bottom:1px solid #999;padding:5px 7px;">
        <div class="hdr">Payment</div>
        <div class="val" style="text-align:center;font-weight:700;margin-top:2px;">${payment}</div>
      </td>
    </tr>
    <!-- Row3: L/C issuing bank -->
    <tr>
      <td style="border-bottom:1px solid #999;padding:5px 7px;">
        <div class="hdr">L/C issuing bank</div>
        <div class="val" style="min-height:14px;margin-top:2px;">${lcBank}</div>
      </td>
    </tr>
    <!-- Row4: Buyer + Remarks 병합 (세로로) -->
    <tr>
      <td style="border-bottom:1px solid #999;padding:5px 7px;">
        <div class="hdr">Buyer (if other than consignee)</div>
        <div class="val" style="min-height:12px;margin-top:2px;">${buyer}</div>
      </td>
    </tr>
    <!-- Row5: Remarks -->
    <tr>
      <td style="border-bottom:1px solid #999;padding:5px 7px;vertical-align:top;">
        <div class="hdr">Remarks</div>
        <div class="val" style="min-height:28px;margin-top:2px;">${remarks}</div>
      </td>
    </tr>
    <!-- Row6: Port / Carrier -->
    <tr>
      <td style="padding:5px 7px;vertical-align:top;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;border-right:1px solid #ccc;padding-right:6px;vertical-align:top;">
              <div class="hdr">Port of loading</div>
              <div class="val">${portLoading}</div>
            </td>
            <td style="padding-left:6px;vertical-align:top;">
              <div class="hdr">Final destination</div>
              <div class="val">${finalDest}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:4px;border-top:1px solid #ccc;">
              <div class="hdr">Carrier</div>
              <div class="val">${carrier}${sailingDate ? " &nbsp;|&nbsp; Sailing on or about: "+sailingDate : ""}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </tbody>
</table>

<!-- 품목 테이블 -->
<table class="item-tbl" style="margin-top:0;">
  <thead>
    <tr>
      <th style="width:32%">
        <div>Marks/No.of PKGS.</div>
        <div style="font-weight:400;font-size:7px;">${marks}</div>
        ${hsCodes.length>0 ? `<div style="margin-top:3px;font-weight:700;">HS CODE:</div>${hsCodes.map(h=>`<div style="font-weight:400;font-size:7px;">${h}</div>`).join("")}` : ""}
      </th>
      <th style="width:36%;text-align:left;padding:4px 5px;">Description</th>
      <th style="width:12%">Quantity</th>
      <th style="width:10%">Unit Price(USD)</th>
      <th style="width:10%">Total Price(USD)</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((item,idx) => {
      const usd   = item.unitPriceUSD ?? item.unitPrice ?? 0;
      const total = item.amountUSD   ?? item.amount    ?? 0;
      const qty   = item.qty ?? 1;
      const details = (item.details||[]).map(d=>`<div style="font-size:7px;color:#555;margin-top:1px;">- ${d}</div>`).join("");
      return `<tr>
        <td style="vertical-align:top;padding:6px 5px;"></td>
        <td style="vertical-align:top;padding:6px 5px;">
          <div style="font-weight:700;font-size:8px;">${item.category||""}</div>
          <div style="font-size:8px;margin-top:1px;">${item.spec||""}</div>
          ${details}
        </td>
        <td style="text-align:center;vertical-align:top;padding:6px 5px;font-size:8px;">${qty} PCS</td>
        <td style="text-align:right;vertical-align:top;padding:6px 5px;font-size:8px;">${fmtUSD(usd)}</td>
        <td style="text-align:right;vertical-align:top;padding:6px 5px;font-size:8px;font-weight:700;">${fmtUSD(total)}</td>
      </tr>`;
    }).join("")}
    <!-- 여백 행 -->
    <tr><td colspan="5" style="height:20px;border:none;"></td></tr>
  </tbody>
</table>

<!-- Freight 안내 (원본에 있는 경우) -->
<div style="text-align:center;font-style:italic;color:#B45309;font-weight:700;font-size:8px;margin:6px 0;">
  ***Please note that freight charges are subject to change.***
</div>

<!-- TOTAL -->
<div class="total-row">
  <span>TOTAL Amount (USD)/${priceTerm ? priceTerm.split(" ")[0] : "DAP"}</span>
  <span>${fmtUSD(totalUSD)}</span>
</div>

<!-- Conditions -->
<div class="cond">
  <div><b>Conditions;</b></div>
  ${priceTerm  ? `<div>1. Price term: ${priceTerm}</div>` : "<div>1. Price term:</div>"}
  ${leadTime   ? `<div>2. Lead time: <span class="lead-hl">${leadTime}</span></div>` : "<div>2. Lead time:</div>"}
  ${validDateStr ? `<div>3. This quotation is valid untill ${validDateStr} .</div>` : "<div>3. This quotation is valid untill .</div>"}
  <div>4. Bank information</div>
  ${bankInfo.split("\n").map(l=>`<div style="margin-left:14px;">${l}</div>`).join("")}
</div>

<!-- 서명 -->
<div class="sign-area">
  <div class="sign-label">Signed by</div>
  <div class="sign-block">
    <div class="company1">ODA Technologies CO.,LTD</div>
    <img src="${signatureSrc}" alt="signature"/>
    <div class="company2"><i>ODA Technologies Co.,Ltd.</i></div>
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
