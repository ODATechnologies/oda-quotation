import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { fmtNumber } from "./helpers";

// ExcelJS: 스타일 완전 지원
export async function exportToExcel(data) {
  const { docNo, staff, supplier, customer, contact, items, terms, totalSupply, totalVat, grandTotal } = data;
  const shortNo = docNo.replace("ODA-", "");

  const ODA  = "FFF84F04";
  const DARK = "FF1A1A1A";
  const WHITE= "FFFFFFFF";
  const LGRAY= "FFF4F4F4";
  const BGRAY= "FFFAFAFA";
  const DBLUE= "FFF4F6FB";

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Quotation");

  // 열 너비
  ws.columns = [
    {width:8},{width:20},{width:8},{width:8},
    {width:14},{width:6},{width:7},
    {width:14},{width:4},{width:14},
    {width:4},{width:13},{width:4},
    {width:10},{width:4},
  ];

  const border = {
    top:{style:"thin",color:{argb:"FFCCCCCC"}},
    left:{style:"thin",color:{argb:"FFCCCCCC"}},
    bottom:{style:"thin",color:{argb:"FFCCCCCC"}},
    right:{style:"thin",color:{argb:"FFCCCCCC"}},
  };

  function fill(argb) { return { type:"pattern", pattern:"solid", fgColor:{argb} }; }
  function font(opts) { return { name:"맑은 고딕", size:9, ...opts }; }

  function styleRange(ws, r1, c1, r2, c2, style) {
    for (let r=r1; r<=r2; r++) {
      for (let c=c1; c<=c2; c++) {
        const cell = ws.getCell(r,c);
        if (style.fill)      cell.fill      = style.fill;
        if (style.font)      cell.font      = style.font;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.border)    cell.border    = border;
      }
    }
  }

  let R = 1; // ExcelJS는 1-indexed

  // ── Row 1: QUOTATION 제목
  ws.mergeCells(R,1,R,15);
  const titleCell = ws.getCell(R,1);
  titleCell.value     = "QUOTATION";
  titleCell.font      = font({ bold:true, size:18 });
  titleCell.alignment = { vertical:"middle", horizontal:"center" };
  ws.getRow(R).height = 30;
  R++;

  // ── Row 2: 빈 행
  R++;

  // ── Row 3: CUSTOMER / ODA TECHNOLOGIES 헤더
  ws.mergeCells(R,1,R,7);
  ws.mergeCells(R,9,R,15);
  const custHdr = ws.getCell(R,1);
  custHdr.value     = "CUSTOMER";
  custHdr.fill      = fill(DARK);
  custHdr.font      = font({ bold:true, color:{argb:WHITE} });
  custHdr.alignment = { vertical:"middle", horizontal:"left" };
  custHdr.border    = border;
  const odaHdr = ws.getCell(R,9);
  odaHdr.value     = "ODA TECHNOLOGIES";
  odaHdr.fill      = fill(DARK);
  odaHdr.font      = font({ bold:true, color:{argb:WHITE} });
  odaHdr.alignment = { vertical:"middle", horizontal:"left" };
  odaHdr.border    = border;
  styleRange(ws,R,2,R,7,{fill:fill(DARK),border});
  styleRange(ws,R,10,R,15,{fill:fill(DARK),border});
  ws.getRow(R).height = 16;
  R++;

  // ── Row 4~8: 정보
  const infoRows = [
    ["Bill To",   customer||"",      "Doc. No.",   docNo],
    ["Attention", contact.name||"",  "Supplier",   supplier.name],
    ["Phone",     contact.phone||"", "Reg. No.",   supplier.bizNo],
    ["E-mail",    contact.email||"", "Sales Rep.", staff.name||""],
    ["",          "",                "Phone",      staff.phone||""],
  ];
  infoRows.forEach(([ll,lv,rl,rv]) => {
    ws.mergeCells(R,2,R,7);
    ws.mergeCells(R,10,R,15);
    const lLabel = ws.getCell(R,1); lLabel.value=ll; lLabel.fill=fill(LGRAY); lLabel.font=font({bold:true,size:8,color:{argb:"FF555555"}}); lLabel.alignment={vertical:"middle"}; lLabel.border=border;
    const lVal   = ws.getCell(R,2); lVal.value=lv;   lVal.font=font();         lVal.alignment={vertical:"middle"};   lVal.border=border;
    styleRange(ws,R,2,R,7,{border});
    const rLabel = ws.getCell(R,9);  rLabel.value=rl; rLabel.fill=fill(LGRAY); rLabel.font=font({bold:true,size:8,color:{argb:"FF555555"}}); rLabel.alignment={vertical:"middle"}; rLabel.border=border;
    const rVal   = ws.getCell(R,10); rVal.value=rv;   rVal.font=font();         rVal.alignment={vertical:"middle"};   rVal.border=border;
    styleRange(ws,R,10,R,15,{border});
    ws.getRow(R).height=15;
    R++;
  });

  R++; // 빈 행

  // ── 품목 헤더
  const hdrDefs = [
    [1,"NO",1],[2,"Description",3],[5,"Model",2],[7,"Qty",1],
    [8,"Unit Price",2],[10,"Amount",2],[12,"VAT",2],[14,"Remark",2],
  ];
  hdrDefs.forEach(([c,label,span]) => {
    if (span>1) ws.mergeCells(R,c,R,c+span-1);
    const cell = ws.getCell(R,c);
    cell.value     = label;
    cell.fill      = fill(ODA);
    cell.font      = font({ bold:true, color:{argb:WHITE} });
    cell.alignment = { vertical:"middle", horizontal:"center" };
    cell.border    = border;
    // 병합 셀 내 나머지 칸도 스타일
    for(let i=1;i<span;i++){
      const mc=ws.getCell(R,c+i);
      mc.fill=fill(ODA); mc.border=border;
    }
  });
  ws.getRow(R).height=18;
  R++;

  // ── 품목 행
  items.forEach((item,idx) => {
    const bgArgb = idx%2===1 ? BGRAY : "FFFFFFFF";
    ws.mergeCells(R,2,R,4);
    ws.mergeCells(R,5,R,6);
    ws.mergeCells(R,8,R,9);
    ws.mergeCells(R,10,R,11);
    ws.mergeCells(R,12,R,13);
    ws.mergeCells(R,14,R,15);

    const rowData = [
      [1, idx+1,           "center"],
      [2, item.category||"","left"],
      [5, item.spec||"",    "left"],
      [7, item.qty||1,      "center"],
      [8, item.unitPrice||0,"right"],
      [10,item.amount||0,   "right"],
      [12,item.vat||0,      "right"],
      [14,item.note||"",    "left"],
    ];
    rowData.forEach(([c,v,align]) => {
      const cell = ws.getCell(R,c);
      cell.value     = v;
      cell.fill      = fill(bgArgb);
      cell.font      = font(c===2?{bold:true}:{});
      cell.alignment = { vertical:"middle", horizontal:align };
      cell.border    = border;
      if (typeof v==="number" && c!==1 && c!==7) cell.numFmt="#,##0";
    });
    for(let c=1;c<=15;c++){
      const cell=ws.getCell(R,c);
      if(!cell.fill||!cell.fill.fgColor) { cell.fill=fill(bgArgb); cell.border=border; }
    }
    ws.getRow(R).height=16;
    R++;

    // 상세 사양
    (item.details||[]).forEach(d => {
      ws.mergeCells(R,2,R,15);
      ws.getCell(R,1).fill=fill(DBLUE); ws.getCell(R,1).border=border;
      const dc=ws.getCell(R,2);
      dc.value=`- ${d}`; dc.fill=fill(DBLUE);
      dc.font=font({italic:true,color:{argb:"FF666666"},size:8});
      dc.alignment={vertical:"middle",horizontal:"left"};
      dc.border=border;
      ws.getRow(R).height=13;
      R++;
    });
  });

  R++; // 빈 행

  // ── TERMS & 합계
  ws.mergeCells(R,1,R,7);
  const termsHdr=ws.getCell(R,1);
  termsHdr.value="TERMS & CONDITIONS";
  termsHdr.fill=fill(DARK); termsHdr.font=font({bold:true,color:{argb:WHITE}});
  termsHdr.alignment={vertical:"middle",horizontal:"left"}; termsHdr.border=border;
  styleRange(ws,R,2,R,7,{fill:fill(DARK),border});

  ws.mergeCells(R,9,R,11);
  ws.mergeCells(R,12,R,13);
  ws.mergeCells(R,14,R,15);
  const saLabel=ws.getCell(R,9); saLabel.value="Supply Amount"; saLabel.font=font(); saLabel.alignment={vertical:"middle"}; saLabel.border=border;
  const saVal=ws.getCell(R,12); saVal.value=totalSupply; saVal.numFmt="#,##0"; saVal.alignment={vertical:"middle",horizontal:"right"}; saVal.border=border;
  const saKrw=ws.getCell(R,14); saKrw.value="KRW"; saKrw.font=font(); saKrw.alignment={vertical:"middle"}; saKrw.border=border;
  styleRange(ws,R,10,R,11,{border}); styleRange(ws,R,13,R,13,{border}); styleRange(ws,R,15,R,15,{border});
  ws.getRow(R).height=15; R++;

  const termsRows2 = [
    ["Delivery", terms.delivery||"", "VAT (10%)", totalVat],
    ["Validity", terms.validity||"", "TOTAL",     grandTotal],
    ["Payment",  terms.payment||"",  null,         null],
  ];
  termsRows2.forEach(([tl,tv,al,av],i) => {
    ws.mergeCells(R,2,R,7);
    const tlC=ws.getCell(R,1); tlC.value=tl; tlC.fill=fill(LGRAY); tlC.font=font({bold:true,size:8,color:{argb:"FF555555"}}); tlC.alignment={vertical:"middle"}; tlC.border=border;
    const tvC=ws.getCell(R,2); tvC.value=tv; tvC.font=font(); tvC.alignment={vertical:"middle"}; tvC.border=border;
    styleRange(ws,R,2,R,7,{border});
    if(al) {
      ws.mergeCells(R,9,R,11);
      ws.mergeCells(R,12,R,13);
      ws.mergeCells(R,14,R,15);
      const isTotal=al==="TOTAL";
      const rowFill=isTotal?fill(ODA):{type:"pattern",pattern:"solid",fgColor:{argb:"FFFFFFFF"}};
      const rowFont=isTotal?font({bold:true,color:{argb:WHITE},size:10}):font();
      const alC=ws.getCell(R,9); alC.value=al; alC.fill=rowFill; alC.font=rowFont; alC.alignment={vertical:"middle"}; alC.border=border;
      const avC=ws.getCell(R,12); avC.value=av; avC.fill=rowFill; avC.font=rowFont; avC.numFmt="#,##0"; avC.alignment={vertical:"middle",horizontal:"right"}; avC.border=border;
      const akC=ws.getCell(R,14); akC.value="KRW"; akC.fill=rowFill; akC.font=rowFont; akC.alignment={vertical:"middle"}; akC.border=border;
      styleRange(ws,R,10,R,11,{fill:rowFill,border});
      styleRange(ws,R,13,R,13,{fill:rowFill,border});
      styleRange(ws,R,15,R,15,{fill:rowFill,border});
    }
    ws.getRow(R).height=15; R++;
  });

  // 파일 저장
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Quotation for ${customer} ${shortNo}.xlsx`);
}
