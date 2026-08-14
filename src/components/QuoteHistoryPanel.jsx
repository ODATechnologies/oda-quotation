import { fmtNumber } from "../utils/helpers";
import { deleteQuote } from "../utils/historyStore";

export default function QuoteHistoryPanel({ history, onLoad, onHistoryChange }) {
  if (!history || history.length === 0) return null;

  function handleDoubleClick(record) {
    if (!confirm(`[${record.docNo}] 견적을 불러오시겠습니까?\n현재 작성 중인 내용은 사라집니다.`)) return;
    onLoad(record);
  }

  function handleDelete(e, docNo) {
    e.stopPropagation();
    if (!confirm(`[${docNo}] 견적 이력을 삭제하시겠습니까?`)) return;
    onHistoryChange(deleteQuote(docNo));
  }

  return (
    <div style={{ marginTop:12 }}>
      <div style={{
        fontSize:11, fontWeight:700, letterSpacing:".06em",
        color:"var(--text-muted)", textTransform:"uppercase",
        padding:"6px 0 6px", borderBottom:"1px solid var(--border)",
        marginBottom:8, display:"flex", alignItems:"center", gap:6,
      }}>
        <span>📋</span> 이 업체 견적 이력
        <span style={{ background:"var(--bg)", color:"var(--text-sub)", fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:600 }}>
          {history.length}건
        </span>
        <span style={{ fontSize:10, fontWeight:400, color:"var(--text-muted)", marginLeft:4 }}>
          더블클릭 시 해당 견적 불러오기
        </span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:260, overflowY:"auto" }}>
        {history.map(record => (
          <div key={record.docNo}
            onDoubleClick={() => handleDoubleClick(record)}
            style={{
              display:"grid", gridTemplateColumns:"1fr auto auto auto",
              alignItems:"center", gap:12,
              padding:"9px 12px",
              background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:6, cursor:"pointer", transition:"background .15s, border-color .15s",
              userSelect:"none",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#EEF3FF";e.currentTarget.style.borderColor="#C7D7FD";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.borderColor="var(--border)";}}
          >
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:".03em" }}>{record.docNo}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
                저장일: {new Date(record.savedAt).toLocaleDateString("ko-KR")} {new Date(record.savedAt).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}
                {record.contact?.name && <span style={{marginLeft:8}}>· {record.contact.name}</span>}
              </div>
            </div>
            <div style={{ textAlign:"center", minWidth:60 }}>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>품목</div>
              <div style={{ fontWeight:600, fontSize:13 }}>{record.items?.length||0}개</div>
            </div>
            <div style={{ textAlign:"right", minWidth:110 }}>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>합계</div>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--primary)" }}>₩{fmtNumber(record.grandTotal)}</div>
            </div>
            <button className="btn btn-ghost btn-sm"
              onClick={e=>handleDelete(e,record.docNo)}
              title="이력 삭제"
              style={{ fontSize:14, padding:"4px 6px", color:"var(--text-muted)" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
