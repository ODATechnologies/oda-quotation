import { useState, useEffect, useMemo } from "react";
import { getAllHistory, deleteQuote } from "../utils/historyStore";
import { exportToPdf } from "../utils/exportPdf";
import { fmtNumber } from "../utils/helpers";

export default function QuoteDashboard({ showToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState("savedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded,setExpanded]= useState(null);

  async function load() {
    setLoading(true);
    const all = await getAllHistory();
    setHistory(all);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // 업체별 그룹
  const grouped = useMemo(() => {
    const map = {};
    history.forEach(h => {
      const key = h.customer || "미지정";
      if (!map[key]) map[key] = [];
      map[key].push(h);
    });
    return map;
  }, [history]);

  // 검색 필터
  const customers = useMemo(() => {
    const keys = Object.keys(grouped);
    if (!search.trim()) return keys;
    return keys.filter(k =>
      k.toLowerCase().includes(search.toLowerCase()) ||
      grouped[k].some(h =>
        h.docNo?.toLowerCase().includes(search.toLowerCase()) ||
        h.staff?.name?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [grouped, search]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function sortedQuotes(quotes) {
    return [...quotes].sort((a,b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "savedAt") { av = new Date(av); bv = new Date(bv); }
      if (sortKey === "grandTotal") { av = Number(av); bv = Number(bv); }
      return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
  }

  async function handleDelete(docNo) {
    if (!confirm(`[${docNo}] 견적 이력을 삭제하시겠습니까?`)) return;
    try {
      await deleteQuote(docNo);
      showToast("삭제되었습니다.");
      load();
    } catch(e) { showToast("삭제 오류: " + e.message, "error"); }
  }

  const totalCount  = history.length;
  const totalAmount = history.reduce((s,h) => s + (Number(h.grandTotal)||0), 0);

  return (
    <div>
      {/* 상단 요약 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          ["전체 견적 건수", `${totalCount}건`, "#1E3C78"],
          ["업체 수",        `${Object.keys(grouped).length}개사`, "#F84F04"],
          ["총 견적 금액",   `₩${fmtNumber(totalAmount)}`, "#059669"],
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding:"16px 20px" }}>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:20, fontWeight:800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 새로고침 */}
      <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 업체명, 문서번호, 담당자 검색..."
          style={{ flex:1, maxWidth:380, padding:"8px 12px", border:"1px solid var(--border)", borderRadius:6, fontSize:13 }}
        />
        <button className="btn btn-secondary" onClick={load}>↺ 새로고침</button>
      </div>

      {loading && <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>불러오는 중...</div>}

      {!loading && customers.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>
          {search ? "검색 결과가 없습니다." : "저장된 견적이 없습니다."}
        </div>
      )}

      {/* 업체별 아코디언 */}
      {!loading && customers.map(cust => {
        const quotes = sortedQuotes(
          search.trim()
            ? grouped[cust].filter(h =>
                cust.toLowerCase().includes(search.toLowerCase()) ||
                h.docNo?.toLowerCase().includes(search.toLowerCase()) ||
                h.staff?.name?.toLowerCase().includes(search.toLowerCase())
              )
            : grouped[cust]
        );
        const custTotal = quotes.reduce((s,h) => s+(Number(h.grandTotal)||0), 0);

        return (
          <div className="card" key={cust} style={{ marginBottom:12 }}>
            <div className="card-header" style={{ cursor:"pointer" }}
              onClick={() => setExpanded(expanded===cust ? null : cust)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span className="card-title">🏢 {cust}</span>
                <span className="badge badge-blue">{quotes.length}건</span>
                <span style={{ fontSize:13, color:"var(--text-sub)" }}>
                  합계: <strong style={{color:"var(--primary)"}}>₩{fmtNumber(custTotal)}</strong>
                </span>
              </div>
              <span style={{ color:"var(--text-muted)" }}>{expanded===cust ? "▲" : "▼"}</span>
            </div>

            {expanded === cust && (
              <div className="card-body" style={{ padding:0 }}>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th onClick={() => toggleSort("docNo")} style={{cursor:"pointer"}}>
                          견적번호 {sortKey==="docNo" ? (sortDir==="desc"?"↓":"↑") : ""}
                        </th>
                        <th>견적 담당자</th>
                        <th onClick={() => toggleSort("savedAt")} style={{cursor:"pointer"}}>
                          견적일시 {sortKey==="savedAt" ? (sortDir==="desc"?"↓":"↑") : ""}
                        </th>
                        <th>품목 요약</th>
                        <th onClick={() => toggleSort("grandTotal")} style={{cursor:"pointer",textAlign:"right"}}>
                          금액 {sortKey==="grandTotal" ? (sortDir==="desc"?"↓":"↑") : ""}
                        </th>
                        <th style={{width:100}}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map(h => (
                        <tr key={h.docNo}>
                          <td style={{ fontWeight:700, color:"var(--accent)", fontSize:12 }}>{h.docNo}</td>
                          <td style={{ fontSize:12 }}>{h.staff?.name || "-"}</td>
                          <td style={{ fontSize:12, color:"var(--text-muted)" }}>
                            {h.savedAt ? new Date(h.savedAt).toLocaleDateString("ko-KR") : "-"}
                            <br/>
                            <span style={{fontSize:10}}>
                              {h.savedAt ? new Date(h.savedAt).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : ""}
                            </span>
                          </td>
                          <td style={{ fontSize:11, color:"var(--text-sub)" }}>
                            {(h.items||[]).slice(0,2).map(i =>
                              `${i.spec||i.category||""}${i.qty>1?` x${i.qty}`:""}`
                            ).join(", ")}
                            {(h.items||[]).length > 2 && ` 외 ${(h.items||[]).length-2}건`}
                          </td>
                          <td style={{ textAlign:"right", fontWeight:700, color:"var(--primary)" }}>
                            ₩{fmtNumber(h.grandTotal)}
                          </td>
                          <td>
                            <div style={{ display:"flex", gap:4 }}>
                              <button className="btn btn-secondary btn-sm"
                                onClick={() => exportToPdf(h)}>
                                🖨️
                              </button>
                              <button className="btn btn-ghost btn-sm"
                                onClick={() => handleDelete(h.docNo)}>✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
