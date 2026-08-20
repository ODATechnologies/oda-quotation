import { useState, useEffect, useMemo } from "react";
import { getAllHistory, deleteQuote } from "../utils/historyStore";
import { exportToPdf }         from "../utils/exportPdf";
import { exportToPdfOverseas } from "../utils/exportPdfOverseas";
import { fmtNumber } from "../utils/helpers";

export default function QuoteDashboard({ showToast }) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [period,   setPeriod]   = useState("monthly"); // yearly | monthly | daily
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [modeFilter, setModeFilter] = useState("all"); // all | domestic | overseas
  const [custSearch, setCustSearch] = useState("");
  const [applied,  setApplied]  = useState({ dateFrom:"", dateTo:"", mode:"all", cust:"" });

  async function load() {
    setLoading(true);
    const all = await getAllHistory();
    setHistory(all);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function applyFilter() {
    setApplied({ dateFrom, dateTo, mode: modeFilter, cust: custSearch });
  }
  function resetFilter() {
    setDateFrom(""); setDateTo(""); setModeFilter("all"); setCustSearch("");
    setApplied({ dateFrom:"", dateTo:"", mode:"all", cust:"" });
  }

  // 필터 적용
  const filtered = useMemo(() => {
    return history.filter(h => {
      const d = h.savedAt ? new Date(h.savedAt) : null;
      if (applied.dateFrom && d && d < new Date(applied.dateFrom)) return false;
      if (applied.dateTo   && d && d > new Date(applied.dateTo + "T23:59:59")) return false;
      if (applied.mode !== "all") {
        const isOverseas = h.mode === "overseas";
        if (applied.mode === "overseas" && !isOverseas) return false;
        if (applied.mode === "domestic" && isOverseas) return false;
      }
      if (applied.cust && !h.customer?.toLowerCase().includes(applied.cust.toLowerCase())) return false;
      return true;
    });
  }, [history, applied]);

  // 기간별 그룹 키
  function periodKey(savedAt) {
    if (!savedAt) return "미상";
    const d = new Date(savedAt);
    if (period === "yearly")  return `${d.getFullYear()}년`;
    if (period === "monthly") return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  // 국내/해외 분리 통계 (현재 기간 탭 기준 - 필터 미적용 전체 기준)
  const domestic = history.filter(h => h.mode !== "overseas");
  const overseas = history.filter(h => h.mode === "overseas");

  // 현재 기간 라벨
  const now = new Date();
  const periodLabel = period === "yearly"  ? `${now.getFullYear()}년 기준`
                    : period === "monthly" ? `${now.getFullYear()}년 ${now.getMonth()+1}월 기준`
                    : `${now.toLocaleDateString("ko-KR")} 기준`;

  // 현재 기간에 해당하는 데이터만 통계
  const inPeriod = (h) => {
    const d = h.savedAt ? new Date(h.savedAt) : null;
    if (!d) return false;
    if (period === "yearly")  return d.getFullYear() === now.getFullYear();
    if (period === "monthly") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return d.toDateString() === now.toDateString();
  };
  const domPeriod = domestic.filter(inPeriod);
  const ovsPeriod = overseas.filter(inPeriod);
  const domTotal  = domPeriod.reduce((s,h) => s+(Number(h.grandTotal)||0), 0);
  const ovsTotal  = ovsPeriod.reduce((s,h) => s+(Number(h.totalUSD)||0), 0);
  const domCompanies = new Set(domPeriod.map(h=>h.customer)).size;
  const ovsCompanies = new Set(ovsPeriod.map(h=>h.customer)).size;

  // 필터된 데이터 업체별 그룹
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(h => {
      const key = periodKey(h.savedAt);
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [filtered, period]);
  const periodKeys = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  const fmtUSD = (n) => "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

  async function handleDelete(docNo) {
    if (!confirm(`[${docNo}] 견적 이력을 삭제하시겠습니까?`)) return;
    try { await deleteQuote(docNo); showToast("삭제되었습니다."); load(); }
    catch(e) { showToast("삭제 오류: " + e.message, "error"); }
  }

  const PERIOD_TABS = [["yearly","연도별"],["monthly","월별"],["daily","일별"]];

  return (
    <div>
      {/* 기간 탭 + 기준 라벨 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, padding:"12px 16px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:10 }}>
        <div style={{ display:"flex", gap:0, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
          {PERIOD_TABS.map(([v,label]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              padding:"7px 18px", border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, fontWeight:600,
              background: period===v ? "var(--fill-accent)" : "transparent",
              color: period===v ? "var(--on-accent)" : "var(--text-secondary)",
            }}>{label}</button>
          ))}
        </div>
        <span style={{ fontSize:12, color:"var(--text-muted)" }}>{periodLabel}</span>
      </div>

      {/* 국내/해외 요약 - 하나의 카드로 묶기 */}
      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
        {/* 국내 */}
        <div style={{ fontSize:11, color:"#185FA5", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#185FA5", display:"inline-block" }}></span>
          국내 견적
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
          {[
            ["건수", `${domPeriod.length}건`],
            ["업체 수", `${domCompanies}개사`],
            ["총 금액", `₩${fmtNumber(domTotal)}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background:"#EBF3FD", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:11, color:"#3B6BA5", marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:17, fontWeight:500, color:"#185FA5" }}>{value}</div>
              <div style={{ fontSize:10, color:"#6B9DC2", marginTop:2 }}>이번 {period==="yearly"?"연도":period==="monthly"?"달":"날"}</div>
            </div>
          ))}
        </div>
        {/* 해외 */}
        <div style={{ fontSize:11, color:"#0F6E56", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#0F6E56", display:"inline-block" }}></span>
          해외 견적
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[
            ["건수", `${ovsPeriod.length}건`],
            ["업체 수", `${ovsCompanies}개사`],
            ["총 금액", fmtUSD(ovsTotal)],
          ].map(([label, value]) => (
            <div key={label} style={{ background:"#E8F5EF", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:11, color:"#2D7A5F", marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:17, fontWeight:500, color:"#0F6E56" }}>{value}</div>
              <div style={{ fontSize:10, color:"#5A9E84", marginTop:2 }}>이번 {period==="yearly"?"연도":period==="monthly"?"달":"날"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 필터 바 */}
      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
        {[
          ["기간 시작", <input key="df" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ padding:"6px 10px", border:"0.5px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--surface-2)", color:"var(--text-primary)", fontFamily:"inherit" }}/>],
          ["기간 종료", <input key="dt" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ padding:"6px 10px", border:"0.5px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--surface-2)", color:"var(--text-primary)", fontFamily:"inherit" }}/>],
          ["구분", <select key="md" value={modeFilter} onChange={e=>setModeFilter(e.target.value)}
            style={{ padding:"6px 10px", border:"0.5px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--surface-2)", color:"var(--text-primary)", fontFamily:"inherit" }}>
            <option value="all">전체</option>
            <option value="domestic">국내</option>
            <option value="overseas">해외</option>
          </select>],
          ["업체명", <input key="cs" type="text" value={custSearch} onChange={e=>setCustSearch(e.target.value)}
            placeholder="업체명 검색..."
            style={{ padding:"6px 10px", border:"0.5px solid var(--border)", borderRadius:6, fontSize:13, background:"var(--surface-2)", color:"var(--text-primary)", fontFamily:"inherit", minWidth:140 }}/>],
        ].map(([label, input]) => (
          <div key={label} style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>{label}</span>
            {input}
          </div>
        ))}
        <button onClick={applyFilter} style={{
          padding:"7px 16px", borderRadius:6, border:"none", cursor:"pointer",
          background:"var(--fill-accent)", color:"var(--on-accent)", fontSize:13, fontFamily:"inherit", fontWeight:500
        }}>조회</button>
        <button onClick={resetFilter} style={{
          padding:"7px 14px", borderRadius:6, border:"0.5px solid var(--border-strong)", cursor:"pointer",
          background:"transparent", color:"var(--text-primary)", fontSize:13, fontFamily:"inherit"
        }}>초기화</button>
        <button onClick={load} style={{
          padding:"7px 14px", borderRadius:6, border:"0.5px solid var(--border-strong)", cursor:"pointer",
          background:"transparent", color:"var(--text-primary)", fontSize:13, fontFamily:"inherit"
        }}>↺ 새로고침</button>
      </div>

      {loading && <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>불러오는 중...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>조회된 견적이 없습니다.</div>
      )}

      {/* 기간별 그룹 목록 */}
      {!loading && periodKeys.map(key => {
        const quotes = grouped[key].sort((a,b) => new Date(b.savedAt)-new Date(a.savedAt));
        const domAmt = quotes.filter(h=>h.mode!=="overseas").reduce((s,h)=>s+(Number(h.grandTotal)||0),0);
        const ovsAmt = quotes.filter(h=>h.mode==="overseas").reduce((s,h)=>s+(Number(h.totalUSD)||0),0);

        return (
          <div key={key} style={{ marginBottom:16 }}>
            {/* 기간 헤더 */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, padding:"8px 14px", background:"var(--surface-1)", border:"1px solid var(--border)", borderRadius:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{key}</span>
              <span style={{ fontSize:12, background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:20, padding:"1px 8px", color:"var(--text-muted)" }}>{quotes.length}건</span>
              {domAmt > 0 && <span style={{ fontSize:12, background:"#EBF3FD", color:"#185FA5", borderRadius:20, padding:"1px 8px", fontWeight:600 }}>국내 ₩{fmtNumber(domAmt)}</span>}
              {ovsAmt > 0 && <span style={{ fontSize:12, background:"#E8F5EF", color:"#0F6E56", borderRadius:20, padding:"1px 8px", fontWeight:600 }}>해외 {fmtUSD(ovsAmt)}</span>}
            </div>

            {/* 테이블 */}
            <div style={{ background:"var(--surface-2)", border:"0.5px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr>
                    {["견적번호","구분","업체명","견적 담당자","견적일시","품목 요약","금액","관리"].map((h,i) => (
                      <th key={h} style={{
                        padding:"9px 14px", textAlign: i>=6 ? "right" : "left",
                        fontSize:11, fontWeight:500, color:"var(--text-muted)",
                        borderBottom:"0.5px solid var(--border)",
                        background:"var(--surface-1)",
                        ...(i===7?{textAlign:"center"}:{})
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(h => {
                    const isOvs = h.mode === "overseas";
                    return (
                      <tr key={h.docNo} style={{ borderBottom:"0.5px solid var(--border)" }}>
                        <td style={{ padding:"10px 14px", color:"#185FA5", fontWeight:500, fontSize:12 }}>{h.docNo}</td>
                        <td style={{ padding:"10px 14px" }}>
                          <span style={{
                            display:"inline-block", fontSize:11, padding:"2px 8px",
                            borderRadius:20, fontWeight:500,
                            background: isOvs ? "#E1F5EE" : "#E6F1FB",
                            color: isOvs ? "#0F6E56" : "#185FA5",
                          }}>{isOvs ? "해외" : "국내"}</span>
                        </td>
                        <td style={{ padding:"10px 14px" }}>{h.customer}</td>
                        <td style={{ padding:"10px 14px", color:"var(--text-secondary)", fontSize:12 }}>{h.staff?.name||"-"}</td>
                        <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:12 }}>
                          {h.savedAt ? new Date(h.savedAt).toLocaleDateString("ko-KR") : "-"}
                          <br/>
                          <span style={{fontSize:11}}>{h.savedAt ? new Date(h.savedAt).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                        </td>
                        <td style={{ padding:"10px 14px", color:"var(--text-muted)", fontSize:12 }}>
                          {(h.items||[]).slice(0,2).map(i=>`${i.spec||i.category||""}${i.qty>1?` x${i.qty}`:""}`).join(", ")}
                          {(h.items||[]).length>2 && ` 외 ${(h.items||[]).length-2}건`}
                        </td>
                        <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:500, color: isOvs?"#0F6E56":"var(--text-primary)" }}>
                          {isOvs ? fmtUSD(h.totalUSD||0) : `₩${fmtNumber(h.grandTotal)}`}
                        </td>
                        <td style={{ padding:"10px 14px", textAlign:"center" }}>
                          <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => isOvs ? exportToPdfOverseas(h) : exportToPdf(h)}>🖨️</button>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => handleDelete(h.docNo)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
