import * as XLSX from "xlsx";
import { fmtNumber } from "./helpers";
import logoSrc from "../assets/logo.png";

export function exportToExcel(data) {
  const { docNo, staff, supplier, customer, contact, items, terms, totalSupply, totalVat, grandTotal } = data;
  const shortNo  = docNo.replace("ODA-", "");
  const ODA_COLOR = "F84F04";
  const DARK_COLOR = "1A1A1A";
  const WHITE = "FFFFFF";
  const LIGHT_GRAY = "F4F4F4";
  const BORDER_COLOR = "CCCCCC";

  const wb = XLSX.utils.book_new();
  const ws = {};
  const merges = [];
  let R = 0;

  function addr(r, c) { return XLSX.utils.encode_cell({ r, c }); }
  function setCell(r, c, v, s) {
    ws[addr(r,c)] = { v: v ?? "", t: typeof v === "number" ? "n" : "s", s };
  }
  function setNum(r, c, v, s) {
    ws[addr(r,c)] = { v: Number(v)||0, t:"n", z:"#,##0", s };
  }
  function merge(r1,c1,r2,c2) { merges.push({ s:{r:r1,c:c1}, e:{r:r2,c:c2} }); }

  const border = {
    top:    { style:"thin", color:{ rgb:BORDER_COLOR } },
    bottom: { style:"thin", color:{ rgb:BORDER_COLOR } },
    left:   { style:"thin", color:{ rgb:BORDER_COLOR } },
    right:  { style:"thin", color:{ rgb:BORDER_COLOR } },
  };
  const darkHdr = {
    font:{ bold:true, color:{ rgb:WHITE }, sz:9 },
    fill:{ fgColor:{ rgb:DARK_COLOR }, patternType:"solid" },
    alignment:{ vertical:"center", horizontal:"left" },
    border,
  };
  const odaHdr = {
    font:{ bold:true, color:{ rgb:WHITE }, sz:9 },
    fill:{ fgColor:{ rgb:ODA_COLOR }, patternType:"solid" },
    alignment:{ vertical:"center", horizontal:"center" },
    border,
  };
  const labelCell = {
    font:{ bold:true, sz:8, color:{ rgb:"555555" } },
    fill:{ fgColor:{ rgb:LIGHT_GRAY }, patternType:"solid" },
    alignment:{ vertical:"center", horizontal:"left" },
    border,
  };
  const valueCell = {
    font:{ sz:9 },
    alignment:{ vertical:"center", horizontal:"left" },
    border,
  };
  const totalRow = {
    font:{ bold:true, color:{ rgb:WHITE }, sz:10 },
    fill:{ fgColor:{ rgb:ODA_COLOR }, patternType:"solid" },
    alignment:{ vertical:"center", horizontal:"right" },
    border,
  };

  // ── Row 0~1: 제목 (QUOTATION)
  setCell(R, 0, "QUOTATION", {
    font:{ bold:true, sz:20, color:{ rgb:"111111" } },
    alignment:{ vertical:"center", horizontal:"center" },
  });
  merge(R, 0, R, 14);
  R++;

  // ── Row 1: 빈 행
  R++;

  // ── Row 2: CUSTOMER / ODA TECHNOLOGIES 헤더
  setCell(R, 0, "CUSTOMER",        darkHdr); merge(R,0,R,6);
  setCell(R, 8, "ODA TECHNOLOGIES", darkHdr); merge(R,8,R,14);
  R++;

  // ── Row 3~6: 정보
  const infoRows = [
    ["Bill To",   customer||"",      "Doc. No.",   docNo],
    ["Attention", contact.name||"",  "Supplier",   supplier.name],
    ["Phone",     contact.phone||"", "Reg. No.",   supplier.bizNo],
    ["E-mail",    contact.email||"", "Sales Rep.", staff.name||""],
    ["",          "",                "Phone",      staff.phone||""],
  ];
  infoRows.forEach(([ll,lv,rl,rv]) => {
    setCell(R,0,ll,labelCell); merge(R,0,R,0);
    setCell(R,1,lv,valueCell); merge(R,1,R,6);
    setCell(R,8,rl,labelCell); merge(R,8,R,8);
    setCell(R,9,rv,valueCell); merge(R,9,R,14);
    R++;
  });

  R++; // 빈 행

  // ── 품목 헤더
  const itemHdrs = [
    [0,"NO",2],
    [1,"Description",5],
    [4,"Model",2],
    [6,"Qty",1],
    [7,"Unit Price",2],
    [9,"Amount",2],
    [11,"VAT",2],
    [13,"Remark",2],
  ];
  itemHdrs.forEach(([col,label,span]) => {
    setCell(R, col, label, odaHdr);
    if (span > 1) merge(R, col, R, col+span-1);
  });
  R++;

  // ── 품목 행
  items.forEach((item, idx) => {
    const even = idx % 2 === 1;
    const rowBg = even ? "FAFAFA" : "FFFFFF";
    const rowStyle = {
      font:{ sz:9 }, border,
      fill:{ fgColor:{ rgb:rowBg }, patternType:"solid" },
      alignment:{ vertical:"center" },
    };
    const rowStyleR = { ...rowStyle, alignment:{ vertical:"center", horizontal:"right" } };
    const rowStyleC = { ...rowStyle, alignment:{ vertical:"center", horizontal:"center" } };
    const rowStyleB = { ...rowStyleR, font:{ sz:9, bold:true } };

    setCell(R,0,idx+1,rowStyleC); merge(R,0,R,0);
    setCell(R,1,item.category||"",{ ...rowStyle, font:{ sz:9, bold:true } }); merge(R,1,R,3);
    setCell(R,4,item.spec||"",rowStyle); merge(R,4,R,5);
    setNum(R,6,item.qty,rowStyleC);
    setNum(R,7,item.unitPrice,rowStyleR); merge(R,7,R,8);
    setNum(R,9,item.amount,rowStyleB); merge(R,9,R,10);
    setNum(R,11,item.vat,rowStyleR); merge(R,11,R,12);
    setCell(R,13,item.note||"",rowStyle); merge(R,13,R,14);
    R++;

    // 상세 사양
    (item.details||[]).forEach(d => {
      const detailStyle = {
        font:{ sz:8, italic:true, color:{ rgb:"666666" } },
        fill:{ fgColor:{ rgb:"F4F6FB" }, patternType:"solid" },
        alignment:{ vertical:"center", horizontal:"left" },
        border,
      };
      setCell(R,0,"",detailStyle);
      setCell(R,1,`- ${d}`,detailStyle); merge(R,1,R,14);
      R++;
    });
  });

  R++; // 빈 행

  // ── TERMS & CONDITIONS + 합계
  setCell(R,0,"TERMS & CONDITIONS",darkHdr); merge(R,0,R,6);
  setCell(R,8,"Supply Amount",valueCell); merge(R,8,R,10);
  setNum(R,11,totalSupply,{ ...valueCell, alignment:{ horizontal:"right" } }); merge(R,11,R,12);
  setCell(R,13,"KRW",valueCell); merge(R,13,R,14);
  R++;

  setCell(R,0,"Delivery",labelCell);
  setCell(R,1,terms.delivery||"",valueCell); merge(R,1,R,6);
  setCell(R,8,"VAT (10%)",valueCell); merge(R,8,R,10);
  setNum(R,11,totalVat,{ ...valueCell, alignment:{ horizontal:"right" } }); merge(R,11,R,12);
  setCell(R,13,"KRW",valueCell); merge(R,13,R,14);
  R++;

  setCell(R,0,"Validity",labelCell);
  setCell(R,1,terms.validity||"",valueCell); merge(R,1,R,6);
  setCell(R,8,"TOTAL",totalRow); merge(R,8,R,10);
  setNum(R,11,grandTotal,totalRow); merge(R,11,R,12);
  setCell(R,13,"KRW",totalRow); merge(R,13,R,14);
  R++;

  setCell(R,0,"Payment",labelCell);
  setCell(R,1,terms.payment||"",valueCell); merge(R,1,R,6);
  R++;

  ws["!ref"]    = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:R, c:14} });
  ws["!merges"] = merges;
  ws["!cols"]   = [
    {wch:8},{wch:18},{wch:6},{wch:6},{wch:12},{wch:6},
    {wch:6},{wch:12},{wch:4},{wch:10},{wch:4},{wch:12},
    {wch:4},{wch:8},{wch:4},
  ];
  // 행 높이
  ws["!rows"] = Array(R).fill(null).map(() => ({ hpt:16 }));
  ws["!rows"][0] = { hpt:28 }; // QUOTATION 제목행

  XLSX.utils.book_append_sheet(wb, ws, "Quotation");
  XLSX.writeFile(wb, `Quotation for ${customer} ${shortNo}.xlsx`);
}
