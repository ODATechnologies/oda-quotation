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


.hdr{font-weight:700;font-size:7.5px;text-decoration:underline;}
.val{font-size:8px;}

/* 상단 정보 테이블 */
.main-tbl{width:100%;border-collapse:collapse;font-size:8px;margin-bottom:6px;}
.main-tbl td{border:1px solid #999;padding:4px 6px;vertical-align:top;}

/* 품목 영역 - 테이블 없이 구분선만 */
.item-area{width:100%;margin-bottom:6px;}
.item-hdr{
  display:grid;
  grid-template-columns:28% 36% 12% 12% 12%;
  border-top:1px solid #999;
  border-bottom:1px solid #999;
  padding:4px 0;
  font-weight:700;font-size:8px;
}
.item-hdr > div{padding:0 4px;text-align:center;}
.item-hdr > div:nth-child(2){text-align:left;}
.item-row{
  display:grid;
  grid-template-columns:28% 36% 12% 12% 12%;
  border-bottom:1px solid #eee;
  padding:5px 0;
  font-size:8px;
  align-items:start;
}
.item-row > div{padding:0 4px;}
.item-row > div:nth-child(3),
.item-row > div:nth-child(4),
.item-row > div:nth-child(5){text-align:right;}

/* TOTAL */
.total-row{
  border-top:2px solid #333;
  display:flex;justify-content:space-between;
  padding:5px 4px;font-weight:700;font-size:9px;
  margin-bottom:8px;
}

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

<!-- 타이틀: QUOTATION은 A4 전체 기준 정중앙 -->
<div style="position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
  <div style="font-size:20px;font-weight:700;letter-spacing:2px;color:#111;text-align:center;">QUOTATION</div>
  <img src="${logoSrc}" style="height:20px;object-fit:contain;position:absolute;right:0;" alt="ODA"/>
</div>

<!-- 상단 정보 테이블 (6:4) -->
<table class="main-tbl">
  <colgroup>
    <col style="width:50%"/>
    <col style="width:50%"/>
  </colgroup>
  <tbody>
    <tr>
      <!-- 좌: Shipper + Consignee (rowspan 전체) -->
      <td rowspan="6" style="vertical-align:top;">
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
      <!-- 우: Invoice No -->
      <td>
        <div class="hdr">No.&amp; Date of Invoice</div>
        <div class="val" style="display:flex;justify-content:space-between;margin-top:2px;">
          <span>${invoiceNo}</span><span>${invoiceDateStr}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="hdr">Payment</div>
        <div class="val" style="text-align:center;font-weight:700;margin-top:2px;">${payment}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="hdr">L/C issuing bank</div>
        <div class="val" style="min-height:14px;margin-top:2px;">${lcBank}</div>
      </td>
    </tr>
    <!-- Buyer + Remarks 넓게 -->
    <tr>
      <td style="min-height:40px;">
        <div class="hdr">Buyer (if other than consignee)</div>
        <div class="val" style="min-height:28px;margin-top:2px;">${buyer}</div>
      </td>
    </tr>
    <tr>
      <td style="min-height:48px;">
        <div class="hdr">Remarks</div>
        <div class="val" style="min-height:36px;margin-top:2px;">${remarks}</div>
      </td>
    </tr>
    <!-- Port / Carrier -->
    <tr>
      <td>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;border-right:1px solid #ccc;padding-right:5px;vertical-align:top;">
              <div class="hdr">Port of loading</div>
              <div class="val">${portLoading}</div>
            </td>
            <td style="padding-left:5px;vertical-align:top;">
              <div class="hdr">Final destination</div>
              <div class="val">${finalDest}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:4px;border-top:1px solid #ccc;vertical-align:top;">
              <div class="hdr">Carrier</div>
              <div class="val">${carrier}${sailingDate ? " &nbsp;&nbsp; Sailing on or about: "+sailingDate : ""}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </tbody>
</table>

<!-- 품목 영역: 테이블 없이 grid 레이아웃 -->
<div class="item-area">
  <!-- 헤더 -->
  <div class="item-hdr">
    <div>Marks/No.of PKGS.</div>
    <div>Description</div>
    <div>Quantity</div>
    <div>Unit Price(USD)</div>
    <div>Total Price(USD)</div>
  </div>

  <!-- 품목 행들: Marks/HS Code는 첫 행에만 1회 표시 -->
  ${items.map((item, idx) => {
    const usd   = item.unitPriceUSD ?? item.unitPrice ?? 0;
    const total = item.amountUSD   ?? item.amount    ?? 0;
    const qty   = item.qty ?? 1;
    const details = (item.details||[]).map(d=>`<div style="font-size:7px;color:#555;margin-top:1px;">- ${d}</div>`).join("");
    return `
  <div class="item-row">
    <div>
      ${idx === 0 ? `
        <div style="font-size:7.5px;font-weight:700;">${marks}</div>
        ${hsCodes.length > 0 ? `
          <div style="font-size:7px;margin-top:4px;font-weight:700;">HS CODE :</div>
          <div style="font-size:7px;">${hsCodes[0]}</div>
        ` : ""}
      ` : ""}
    </div>
    <div>
      <div style="font-weight:700;">${item.category||""}</div>
      <div style="margin-top:1px;">${item.spec||""}</div>
      ${details}
    </div>
    <div style="text-align:center;">${qty} PCS</div>
    <div style="text-align:right;">${fmtUSD(usd)}</div>
    <div style="text-align:right;font-weight:700;">${fmtUSD(total)}</div>
  </div>`;
  }).join("")}

  <!-- 여백 -->
  <div style="height:18px;border-bottom:1px solid #eee;"></div>
</div>

<!-- freight 안내 -->
<div style="text-align:center;font-style:italic;color:#B45309;font-weight:700;font-size:8px;margin:4px 0 6px;">
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
