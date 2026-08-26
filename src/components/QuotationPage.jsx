import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_TERMS, SUPPLIER_INFO, SUPPLIER_INFO_OVERSEAS } from "../data/masterData";
import { generateDocNo, fmtNumber, calcItem, emptyItem, todayStr } from "../utils/helpers";
import { exportToExcel } from "../utils/exportExcel";
import { exportToPdf }         from "../utils/exportPdf";
import { exportToPdfOverseas } from "../utils/exportPdfOverseas";
import OverseasQuotationForm, { BANK_INFO_DEFAULT } from "./OverseasQuotationForm";
import { saveQuote, getHistoryByCustomer, getAllHistory } from "../utils/historyStore";
import { useSharedProducts } from "../hooks/useSharedData";
import { useAuth } from "../contexts/AuthContext";
import ItemRow           from "./ItemRow";
import ItemModal         from "./ItemModal";
import QuoteHistoryPanel from "./QuoteHistoryPanel";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function QuotationPage({ showToast }) {
  const { displayName } = useAuth();
  const { allItems: productList } = useSharedProducts();

  // ── Firestore 담당자 실시간 구독
  const [staffList, setStaffList] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db,"staff"), snap => {
      const docs = snap.docs.map(d => ({ _id:d.id, id:d.id, ...d.data() }));
      docs.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setStaffList(docs);
    });
    return unsub;
  }, []);

  const [customerList, setCustomerList] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id, _id: d.id }));
      docs.sort((a,b) => (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setCustomerList(docs);
    });
    return unsub;
  }, []);
  const [todayHistory, setTodayHistory] = useState([]);

  // ── 견적 모드: "domestic" | "overseas"
  const [mode, setMode] = useState("domestic");

  // 해외 모드: 환율
  const [exchangeRate, setExchangeRate] = useState(1350);

  const [date,          setDate]          = useState(todayStr());
  const [staffId,       setStaffId]       = useState("");
  const [custId,        setCustId]        = useState("");
  const [custSearch,    setCustSearch]    = useState("");
  const [custDropOpen,  setCustDropOpen]  = useState(false);
  const [contactIdx,    setContactIdx]    = useState(0);
  const [manualMode,    setManualMode]    = useState(false);
  const [manualCompany, setManualCompany] = useState("");
  const [manualContact, setManualContact] = useState({ name:"", phone:"", email:"" });
  const [terms,         setTerms]         = useState(DEFAULT_TERMS);
  const [items,         setItems]         = useState([]);
  const [memo,          setMemo]          = useState("");
  const [memoColor,     setMemoColor]     = useState("#111111");
  const [nextId,        setNextId]        = useState(1);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [histLoading,   setHistLoading]   = useState(false);
  const [fixedDocNo,    setFixedDocNo]    = useState(null);
  const [itemModal,     setItemModal]     = useState(null);
  const [overseasForm,  setOverseasForm]  = useState({
    shipperCompany: "ODA Technologies Co., Ltd.",
    shipperAddress: "62, Bupyeong-daero 329 Beon-gil, Bupyeong-gu, Incheon, Republic of Korea (21315)",
    shipperFax: "82-32-715-5456",
    payment: "T/T before shipment",
    portLoading: "Incheon",
    carrier: "BY AIR",
    marks: "MADE IN Korea",
    hsCodes: [],
    bankInfo: BANK_INFO_DEFAULT,
  });

  // 모드별 담당자 필터
  const filteredStaff = useMemo(() => {
    if (mode === "overseas") return staffList.filter(s => s.type === "overseas");
    return staffList.filter(s => !s.type || s.type === "domestic");
  }, [staffList, mode]);

  // 담당자 자동 매칭 (모드 변경 시 재매칭)
  useEffect(() => {
    if (filteredStaff.length === 0) return;
    const found = filteredStaff.find(s =>
      s.name && displayName && s.name.includes(displayName.split("/").pop()?.trim())
    );
    setStaffId((found || filteredStaff[0])?._id || "");
  }, [filteredStaff, displayName]);

  const supplier = mode === "overseas" ? SUPPLIER_INFO_OVERSEAS : SUPPLIER_INFO;
  const staff    = staffList.find(s => s._id === staffId) || filteredStaff[0] || {};
  const custObj  = customerList.find(c => (c._id || c.id) === custId);
  const contact  = manualMode ? manualContact : (custObj?.contacts[contactIdx] || { name:"", phone:"", email:"" });
  const customerName = manualMode ? manualCompany : (custObj?.company || "");

  // 당일 이력 로드 (문서번호 순번 계산용)
  async function loadTodayHistory() {
    try {
      const all = await getAllHistory();
      // savedAt 대신 docNo의 날짜로 필터링 (serverTimestamp 지연 문제 방지)
      const filtered = all.filter(h =>
        h.docNo && h.docNo.includes(`GQ${dateKey}`)
      );
      setTodayHistory(filtered);
      return filtered;
    } catch(e) { return []; }
  }
  useEffect(() => { loadTodayHistory(); }, [date]);

  async function loadHistory(name) {
    if (!name) { setCustomerHistory([]); return; }
    setHistLoading(true);
    try {
      // 전체 이력에서 클라이언트 필터링 (대소문자/공백 무관)
      const all = await getAllHistory();
      const filtered = all.filter(h =>
        h.customer?.replace(/\s/g,"").toLowerCase() === name.replace(/\s/g,"").toLowerCase()
      );
      setCustomerHistory(filtered);
    }
    catch(e) { console.error(e); }
    setHistLoading(false);
  }
  useEffect(() => { loadHistory(customerName); }, [customerName]);

  // 날짜 키: YYMMDD (일반 함수로 계산)
  function getDateKey(d) {
    const dt = d || (date ? new Date(date) : new Date());
    const yy = String(dt.getFullYear()).slice(2);
    const mm = String(dt.getMonth()+1).padStart(2,"0");
    const dd = String(dt.getDate()).padStart(2,"0");
    return `${yy}${mm}${dd}`;
  }
  const dateKey = getDateKey();

  // 문서번호: ODA-GQ[YYMMDD][순번]D (업체별 독립 순번)
  const autoDocNo = useMemo(() => {
    const custKey = customerName.replace(/[\s/.\[\]*`]/g,"");
    const prefix  = `GQ${dateKey}`;
    // todayHistory에서 같은 업체+날짜의 최대 순번 계산
    const maxSeq = todayHistory.reduce((max, h) => {
      if (!h.docNo) return max;
      const match = h.docNo.match(new RegExp(`GQ${dateKey}(\d{3})D$`));
      if (match && h.customer?.replace(/[\s/.\[\]*`]/g,"") === custKey) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    const seq    = String(maxSeq + 1).padStart(3, "0");
    // 공백 제거, Firestore ID 불가 문자(/ . [ ] * `) 만 언더바로 치환
    const custDisplay = customerName || "UNKNOWN";
    return `Quotation for ${custDisplay} GQ${dateKey}${seq}D`;
  }, [dateKey, customerName, todayHistory]);

  const docNo = fixedDocNo || autoDocNo;

  // 계산된 품목
  const calcedItems = useMemo(() => items.map(item => {
    const base = calcItem(item);
    if (mode === "overseas") {
      // 해외: unitPrice(=overseasPrice USD)를 그대로 사용
      const unitUSD  = Number(base.unitPrice) || 0;
      const amtUSD   = unitUSD * (Number(item.qty) || 1);
      return {
        ...base,
        amount:       amtUSD,  // 해외는 amount도 USD
        vat:          0,       // 해외는 VAT 없음
        unitPriceUSD: unitUSD,
        amountUSD:    amtUSD,
      };
    }
    return base;
  }), [items, mode]);

  const totalSupply = calcedItems.reduce((s,i) => s + i.amount, 0);
  const totalVat    = calcedItems.reduce((s,i) => s + (i.vat||0), 0);
  const grandTotal  = totalSupply + totalVat;
  const totalUSD    = mode === "overseas" ? calcedItems.reduce((s,i) => s + (i.amountUSD||0), 0) : 0;

  function handleItemSave(savedItem) {
    if (itemModal.mode === "add") {
      setItems(p => [...p, { ...savedItem, id:nextId }]);
      setNextId(n => n+1);
    } else {
      setItems(p => p.map(i => i.id===itemModal.itemId ? { ...savedItem, id:i.id } : i));
    }
  }
  function openAddModal()  { setItemModal({ mode:"add", item:emptyItem(nextId) }); }
  function openEditModal(id) {
    const item = items.find(i => i.id===id);
    if (item) setItemModal({ mode:"edit", itemId:id, item });
  }
  function removeItem(id) { setItems(p => p.filter(i => i.id!==id)); }

  function buildExportData() {
    // 해외 폼 - 상단 공급자/담당자/고객 정보 자동 반영
    const mergedOverseasForm = {
      ...overseasForm,
      // Shipper: 상단 ODA TECHNOLOGIES 정보 자동 반영
      shipperCompany: supplier.name || "ODA Technologies Co., Ltd.",
      shipperAttn:    staff.name  || "",
      shipperTel:     staff.phone || "",
      shipperEmail:   overseasForm.shipperEmail || "",
      // Consignee: 상단 CUSTOMER 정보 자동 반영
      consigneeCompany: customerName,
      consigneeAddress: custObj?.address || "",
      consigneeAttn:    contact.name  || "",
      consigneeTel:     contact.phone || "",
      consigneeEmail:   contact.email || "",
    };
    return {
      docNo, date, mode,
      staff:    { name:staff.name||"", phone:staff.phone||"" },
      supplier,
      customer: customerName, contact,
      items: calcedItems, terms, memo, memoColor,
      totalSupply, totalVat, grandTotal,
      totalUSD, exchangeRate,
      overseasForm: mergedOverseasForm,
    };
  }

  async function handleSave() {
    if (!customerName) { showToast("업체를 선택하거나 입력해주세요.", "error"); return; }

    // 저장 직전 Firestore에서 실시간 순번 재계산 (업체별 독립, 덮어쓰기 방지)
    const freshAll = await getAllHistory();
    const freshMaxSeq = freshAll
      .filter(h => h.customer === customerName && h.docNo?.includes(`GQ${dateKey}`))
      .reduce((max, h) => {
        if (!h.docNo) return max;
        const match = h.docNo.match(new RegExp("GQ" + dateKey + "(\d{3})D$"));
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
    const freshDocNo = `Quotation for ${customerName} GQ${dateKey}${String(freshMaxSeq+1).padStart(3,"0")}D`;

    const exportData = buildExportData();
    const saved = { ...exportData, docNo: freshDocNo };
    await saveQuote(saved);

    // todayHistory에 직접 추가 (서버 재조회 없이 즉시 순번 반영)
    setTodayHistory(prev => [...prev, {
      ...saved,
      savedAt: new Date().toISOString(),
    }]);

    showToast(`✅ [${freshDocNo}] 견적이 저장되었습니다.`, "success");
    setTimeout(() => handleReset(), 150);
  }

  const handleLoadFromHistory = useCallback((record) => {
    const foundCust = customerList.find(c => c.company===record.customer);
    if (foundCust) {
      setManualMode(false); setCustId(foundCust._id || foundCust.id);
      const contacts = foundCust.contacts || [];
      const ci = contacts.findIndex(c=>c.name===record.contact?.name);
      setContactIdx(ci>=0?ci:0);
    } else {
      setManualMode(true);
      setManualCompany(record.customer||"");
      setManualContact(record.contact||{name:"",phone:"",email:""});
    }
    const foundStaff = staffList.find(s => s.name===record.staff?.name);
    if (foundStaff) setStaffId(foundStaff._id);
    setDate(record.date||todayStr());
    setTerms(record.terms||DEFAULT_TERMS);
    setMemo(record.memo||"");
    setMemoColor(record.memoColor||"#111111");
    // 재견적 시 새 문서번호를 자동 발급하도록 fixedDocNo는 설정하지 않음
    setFixedDocNo(null);
    if (record.mode) setMode(record.mode);
    if (record.exchangeRate) setExchangeRate(record.exchangeRate);
    const restoredItems = (record.items||[]).map((item,i)=>({...item, id:i+1}));
    setItems(restoredItems);
    setNextId(restoredItems.length+1);
    showToast(`[${record.docNo}] 견적 내용을 불러왔습니다. (새 문서번호가 발급됩니다)`, "success");
  }, [customerList, staffList, showToast]);

  function handleReset() {
    if (!confirm("작성 내용을 초기화하시겠습니까?")) return;
    setDate(todayStr()); setMode("domestic"); setExchangeRate(1350);
    setCustId(""); setContactIdx(0); setManualMode(false); setCustSearch(""); setCustDropOpen(false);
    setManualCompany(""); setManualContact({name:"",phone:"",email:""});
    setTerms(DEFAULT_TERMS); setItems([]); setNextId(1); setFixedDocNo(null); setMemo(""); setMemoColor("#111111");
  }

  function handlePdfExport() {
    try {
      if (mode === "overseas") {
        exportToPdfOverseas(buildExportData());
      } else {
        exportToPdf(buildExportData());
      }
      showToast("PDF 인쇄창이 열렸습니다.", "success");
    } catch(e) { showToast(e.message, "error"); }
  }

  const isOverseas = mode === "overseas";

  return (
    <div>
      {/* 상단 액션 바 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>문서번호</div>
            <span className="docno-chip">{docNo}</span>
          </div>
          {/* 국내/해외 모드 선택 */}
          <div style={{ display:"flex", gap:0, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
            {[["domestic","🇰🇷 국내"],["overseas","🌐 해외"]].map(([v,label]) => (
              <button key={v} onClick={() => setMode(v)} style={{
                padding:"7px 16px", border:"none", cursor:"pointer",
                fontFamily:"inherit", fontSize:13, fontWeight:600,
                background: mode===v ? (v==="overseas" ? "#1E3C78" : "var(--primary)") : "#fff",
                color: mode===v ? "#fff" : "var(--text-sub)",
                transition:"all .15s",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary" onClick={handleReset}>↺ 초기화</button>
          <button className="btn btn-secondary" onClick={() => { try{ exportToExcel(buildExportData()); showToast("엑셀 저장 완료","success"); }catch(e){ showToast(e.message,"error"); } }}>📊 Excel</button>
          <button className="btn btn-secondary" onClick={handlePdfExport}>🖨️ PDF 인쇄</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 저장</button>
        </div>
      </div>

      {/* 해외 모드: 환율 입력 */}
      {isOverseas && (
        <div style={{ background:"#EEF3FF", border:"1px solid #C7D7FD", borderRadius:8, padding:"12px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#1E3C78" }}>🌐 해외 견적 모드</span>
            <span style={{ fontSize:12, color:"#4B5563" }}>· 공급자: <strong>{SUPPLIER_INFO_OVERSEAS.name}</strong></span>
            <span style={{ fontSize:12, color:"#4B5563" }}>· VAT 미적용</span>
            <span style={{ fontSize:12, color:"#059669", fontWeight:600 }}>· 품목별 해외단가(USD) 직접 적용</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#1E3C78" }}>환율 (참고용)</span>
            <span style={{ fontSize:12, color:"#4B5563" }}>USD $1 =</span>
            <div style={{ position:"relative" }}>
              <input
                type="number"
                min="0"
                value={exchangeRate}
                onChange={e => setExchangeRate(e.target.value)}
                style={{ width:110, padding:"5px 10px", border:"1px solid #C7D7FD", borderRadius:6, fontSize:13, textAlign:"right", paddingRight:28 }}
              />
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#6B7280" }}>₩</span>
            </div>
            <span style={{ fontSize:11, color:"#6B7280" }}>입력 시 품목 팝업에서 KRW 참고금액 표시</span>
          </div>
        </div>
      )}

      {/* 헤더 2컬럼 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* CUSTOMER */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">CUSTOMER (공급받는자)</span>
            <label style={{ fontSize:12, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
              <input type="checkbox" checked={manualMode}
                onChange={e => { setManualMode(e.target.checked); setCustId(""); }}/>
              수기 입력
            </label>
          </div>
          <div className="card-body">
            {!manualMode ? (
              <div className="form-grid" style={{ gap:10 }}>
                <div className="form-group" style={{position:"relative"}}>
                  <label>수신 (업체) <span className="required">*</span></label>
                  <input
                    value={custDropOpen
                      ? custSearch
                      : (customerList.find(c=>(c._id||c.id)===custId)?.company || "")}
                    onChange={e=>{ setCustSearch(e.target.value); setCustDropOpen(true); setCustId(""); }}
                    onFocus={()=>{ setCustSearch(""); setCustDropOpen(true); }}
                    onBlur={()=>setTimeout(()=>setCustDropOpen(false),200)}
                    placeholder="업체명 검색 또는 선택..."
                    style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}
                  />
                  {custDropOpen && (
                    <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#fff",border:"1px solid var(--border)",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,.12)",maxHeight:220,overflowY:"auto"}}>
                      {(custSearch
                        ? customerList.filter(c=>c.company?.toLowerCase().includes(custSearch.toLowerCase()))
                        : customerList
                      ).map(c=>(
                        <div key={c._id||c.id}
                          onMouseDown={()=>{ setCustId(c._id||c.id); setContactIdx(0); setCustSearch(""); setCustDropOpen(false); }}
                          style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"0.5px solid var(--border)"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#F5F7FF"}
                          onMouseLeave={e=>e.currentTarget.style.background=""}>
                          <div style={{fontWeight:600}}>{c.company}</div>
                          {c.address && <div style={{fontSize:11,color:"var(--text-muted)",marginTop:1}}>📍 {c.address}</div>}
                        </div>
                      ))}
                      {(custSearch
                        ? customerList.filter(c=>c.company?.toLowerCase().includes(custSearch.toLowerCase()))
                        : customerList
                      ).length === 0 && (
                        <div style={{padding:"10px 12px",color:"var(--text-muted)",fontSize:12,textAlign:"center"}}>검색 결과가 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
                {custObj && (
                  <div className="form-group">
                    <label>담당자</label>
                    <select value={contactIdx} onChange={e=>setContactIdx(Number(e.target.value))}>
                      {custObj.contacts.map((ct,i)=><option key={i} value={i}>{ct.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group"><label>전화</label><input readOnly value={contact.phone||""} placeholder="자동 입력"/></div>
                <div className="form-group"><label>E-mail</label><input readOnly value={contact.email||""} placeholder="자동 입력"/></div>
              </div>
            ) : (
              <div className="form-grid" style={{ gap:10 }}>
                <div className="form-group"><label>수신 (업체명)</label><input value={manualCompany} onChange={e=>setManualCompany(e.target.value)} placeholder="업체명 입력"/></div>
                <div className="form-group"><label>담당자</label><input value={manualContact.name} onChange={e=>setManualContact(p=>({...p,name:e.target.value}))} placeholder="성명/직책"/></div>
                <div className="form-group"><label>전화</label><input value={manualContact.phone} onChange={e=>setManualContact(p=>({...p,phone:e.target.value}))} placeholder="010-0000-0000"/></div>
                <div className="form-group"><label>E-mail</label><input value={manualContact.email} onChange={e=>setManualContact(p=>({...p,email:e.target.value}))} placeholder="email@company.com"/></div>
              </div>
            )}
            <QuoteHistoryPanel history={customerHistory} loading={histLoading}
              onLoad={handleLoadFromHistory}
              onHistoryChange={() => loadHistory(customerName)} />
          </div>
        </div>

        {/* ODA TECHNOLOGIES */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">ODA TECHNOLOGIES (공급자)</span>
            {isOverseas && <span style={{ fontSize:11, background:"#EEF3FF", color:"#2563EB", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>해외</span>}
          </div>
          <div className="card-body">
            <div className="form-grid" style={{ gap:10 }}>
              <div className="form-group"><label>견적 일자</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
              <div className="form-group"><label>문서번호</label><input readOnly value={docNo} style={{ fontWeight:700, color:"var(--accent)" }}/></div>
              <div className="form-group"><label>공급자</label><input readOnly value={supplier.name}/></div>
              <div className="form-group"><label>사업자등록번호</label><input readOnly value={supplier.bizNo}/></div>
              <div className="form-group">
                <label>담당자 <span className="required">*</span>
                  {isOverseas && <span style={{ fontSize:10, color:"#854D0E", marginLeft:6 }}>해외 담당자만 표시</span>}
                </label>
                <select value={staffId} onChange={e=>setStaffId(e.target.value)}>
                  <option value="">-- 선택 --</option>
                  {filteredStaff.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>전화</label><input readOnly value={staff.phone||""} placeholder="자동 입력"/></div>
            </div>
          </div>
        </div>
      </div>

      {/* 견적 내용 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            견적 내용
            {isOverseas && <span style={{ fontSize:11, color:"#2563EB", marginLeft:8 }}>· USD 기준 · VAT 미적용</span>}
          </span>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>+ 품목 추가</button>
        </div>
        <div className="card-body" style={{ padding:0 }}>
          {items.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-muted)" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
              <div style={{ fontSize:14 }}>상단 <strong>+ 품목 추가</strong> 버튼을 눌러 품목을 등록하세요.</div>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:36}}>NO</th>
                    <th style={{textAlign:"left"}}>품목</th>
                    <th style={{textAlign:"left"}}>규격</th>
                    <th style={{width:56}}>수량</th>
                    <th>{isOverseas ? "단가 (USD)" : "단가"}</th>
                    <th>{isOverseas ? "금액 (USD)" : "금액"}</th>
                    {!isOverseas && <th>부가세</th>}
                    <th>비고</th>
                    <th style={{width:36}}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item,idx) => (
                    <ItemRow
                      key={item.id} item={item} idx={idx}
                      calc={calcedItems[idx]}
                      isOverseas={isOverseas}
                      exchangeRate={exchangeRate}
                      onEdit={() => openEditModal(item.id)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 합계 */}
          {items.length > 0 && (
            <div className="summary-row">
              {isOverseas ? (
                <div className="summary-cell total">
                  <span className="label">TOTAL (USD)</span>
                  <span className="value">${totalUSD.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              ) : (<>
                <div className="summary-cell"><span className="label">공급가액</span><span className="value">₩{fmtNumber(totalSupply)}</span></div>
                <div className="summary-cell"><span className="label">부가세 (10%)</span><span className="value">₩{fmtNumber(totalVat)}</span></div>
                <div className="summary-cell total"><span className="label">합계 TOTAL</span><span className="value">₩{fmtNumber(grandTotal)}</span></div>
              </>)}
            </div>
          )}
        </div>
      </div>

      {/* 거래 조건 */}
      <div className="card">
        <div className="card-header"><span className="card-title">거래 조건</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group"><label>납기</label><input value={terms.delivery} onChange={e=>setTerms(p=>({...p,delivery:e.target.value}))}/></div>
            <div className="form-group"><label>견적 유효기간</label><input value={terms.validity} onChange={e=>setTerms(p=>({...p,validity:e.target.value}))}/></div>
            <div className="form-group"><label>결제 조건</label><input value={terms.payment} onChange={e=>setTerms(p=>({...p,payment:e.target.value}))}/></div>
          </div>
        </div>
      </div>

      {/* 해외 전용 추가 정보 */}
      {isOverseas && (
        <OverseasQuotationForm
          form={overseasForm}
          onChange={setOverseasForm}
          staffInfo={staff}
          supplierInfo={supplier}
        />
      )}

      {/* 견적 비고 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">비고 (견적서 하단 표시)</span>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>글씨 색상</span>
            {["#111111","#F84F04","#2563EB","#059669","#DC2626","#6B7280"].map(color => (
              <button key={color} onClick={() => setMemoColor(color)}
                style={{
                  width:20, height:20, borderRadius:"50%", border: memoColor===color ? "2px solid #333" : "2px solid transparent",
                  background:color, cursor:"pointer", padding:0, outline: memoColor===color ? "2px solid #fff" : "none", outlineOffset:"-3px"
                }}/>
            ))}
            <input type="color" value={memoColor} onChange={e=>setMemoColor(e.target.value)}
              style={{ width:24, height:24, border:"none", borderRadius:4, cursor:"pointer", padding:0 }} title="직접 선택"/>
          </div>
        </div>
        <div className="card-body">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={3}
            placeholder="견적서 품목 아래 별도 안내사항을 입력하세요."
            style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:6, fontSize:13, fontFamily:"inherit", resize:"vertical", color:memoColor, fontWeight: memoColor !== "#111111" ? 600 : 400 }}
          />
        </div>
      </div>

      {/* 품목 팝업 */}
      {itemModal && (
        <ItemModal item={itemModal.item} productList={productList}
          isOverseas={isOverseas} exchangeRate={exchangeRate}
          onSave={handleItemSave} onClose={() => setItemModal(null)}/>
      )}
    </div>
  );
}
