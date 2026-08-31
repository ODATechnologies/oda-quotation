import { useState, useEffect } from "react";
import { fmtNumber } from "../utils/helpers";
import { deleteQuote } from "../utils/historyStore";
import { exportToPdf } from "../utils/exportPdf";

export default function QuoteHistoryPanel({ history, onLoad, onHistoryChange, loading }) {
  const [popup, setPopup] = useState(null); // 선택된 record
  const [idx,   setIdx]   = useState(0);    // 현재 표시 중인 인덱스

  // 최신 저장순 정렬
  const sorted = [...(history || [])].sort(
    (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
  );

  // history가 바뀌면(삭제/추가) 인덱스 범위 보정
  useEffect(() => {
    if (idx >= sorted.length) setIdx(Math.max(0, sorted.length - 1));
  }, [sorted.length]); // eslint-disable-line

  if (loading) return (
    <div style={{ marginTop:12, padding:"10px 0", color:"var(--text-muted)", fontSize:12 }}>
      이력 불러오는 중...
    </div>
  );
  if (!sorted || sorted.length === 0) return null;

  const record = sorted[idx];

  async function handleDelete(e, docNo, customer) {
    e.stopPropagation();
    if (!confirm(`[${docNo}] 견적 이력을 삭제하시겠습니까?`)) return;
    await deleteQuote(customer, docNo);
    onHistoryChange();
  }

  function handleLoadEdit() {
    if (!confirm(`[${popup.docNo}] 견적을 불러오시겠습니까?\n현재 작성 중인 내용은 사라집니다.\n(같은 문서번호로 수정/재저장됩니다)`)) return;
    onLoad(popup, "edit");
    setPopup(null);
  }

  function handleCopy() {
    if (!confirm(`[${popup.docNo}] 견적을 복사하시겠습니까?\n현재 작성 중인 내용은 사라집니다.\n(새 문서번호로 저장되며, 수신 업체를 변경할 수 있습니다)`)) return;
    onLoad(popup, "copy");
    setPopup(null);
  }

  function handleView() {
    exportToPdf(popup);
  }

  function goPrev() { setIdx(i => Math.max(0, i - 1)); }
  function goNext() { setIdx(i => Math.min(sorted.length - 1, i + 1)); }

  return (
    <div style={{ marginTop:12 }}>
      {/* 이력 헤더 */}
      <div style={{
        fontSize:11, fontWeight:700, letterSpacing:".06em",
        color:"var(--text-muted)", textTransform:"uppercase",
        padding:"6px 0", borderBottom:"1px solid var(--border)",
        marginBottom:8, display:"flex", alignItems:"center", gap:6,
      }}>
        <span>📋</span> 이 업체 견적 이력
        <span style={{ background:"var(--bg)", color:"var(--text-sub)", fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:600 }}>
          {sorted.length}건
        </span>
        <span style={{ fontSize:10, fontWeight:400, color:"var(--text-muted)", marginLeft:4 }}>
          최신순 · 클릭하여 선택
        </span>
      </div>

      {/* 카드 + 위/아래 네비게이션 */}
      <div style={{ display:"flex", alignItems:"stretch", gap:6 }}>
        {/* 이전(더 오래된) / 다음(더 최신) 버튼 - 세로 배치 */}
        {sorted.length > 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:4, justifyContent:"center" }}>
            <button
              onClick={goPrev}
              disabled={idx === 0}
              title="이전 (더 최신)"
              style={{
                width:28, height:28, borderRadius:6, border:"1px solid var(--border)",
                background: idx===0 ? "var(--bg)" : "#fff",
                color: idx===0 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: idx===0 ? "default" : "pointer", fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >▲</button>
            <div style={{ textAlign:"center", fontSize:10, color:"var(--text-muted)", fontWeight:600 }}>
              {idx+1}/{sorted.length}
            </div>
            <button
              onClick={goNext}
              disabled={idx === sorted.length - 1}
              title="다음 (더 오래됨)"
              style={{
                width:28, height:28, borderRadius:6, border:"1px solid var(--border)",
                background: idx===sorted.length-1 ? "var(--bg)" : "#fff",
                color: idx===sorted.length-1 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: idx===sorted.length-1 ? "default" : "pointer", fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >▼</button>
          </div>
        )}

        {/* 현재 카드 (1건만 표시) */}
        <div
          onClick={() => setPopup(record)}
          style={{
            flex:1,
            display:"grid", gridTemplateColumns:"1fr auto auto auto",
            alignItems:"center", gap:12,
            padding:"9px 12px",
            background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:6, cursor:"pointer",
            transition:"background .15s, border-color .15s",
            userSelect:"none",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="#EEF3FF";e.currentTarget.style.borderColor="#C7D7FD";}}
          onMouseLeave={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.borderColor="var(--border)";}}
        >
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:".03em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {record.docNo}
            </div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
              저장일: {new Date(record.savedAt).toLocaleDateString("ko-KR")} {new Date(record.savedAt).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}
              {record.contact?.name && <span style={{marginLeft:8}}>· {record.contact.name}</span>}
            </div>
          </div>
          <div style={{ textAlign:"center", minWidth:52 }}>
            <div style={{ fontSize:11, color:"var(--text-muted)" }}>품목</div>
            <div style={{ fontWeight:600, fontSize:13 }}>{record.items?.length||0}개</div>
          </div>
          <div style={{ textAlign:"right", minWidth:110 }}>
            <div style={{ fontSize:11, color:"var(--text-muted)" }}>공급가</div>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--primary)" }}>₩{fmtNumber(record.totalSupply)}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={e=>{e.stopPropagation();handleDelete(e,record.docNo,record.customer);}}
            title="이력 삭제"
            style={{ fontSize:14, padding:"4px 6px", color:"var(--text-muted)" }}>✕</button>
        </div>
      </div>

      {/* 선택 팝업 */}
      {popup && (
        <div
          style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,.45)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:500,
          }}
          onClick={() => setPopup(null)}
        >
          <div
            onClick={e=>e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:12,
              boxShadow:"0 8px 32px rgba(0,0,0,.18)",
              padding:"28px 28px 24px",
              minWidth:320, maxWidth:400,
            }}
          >
            {/* 팝업 헤더 */}
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>견적 선택</div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--accent)" }}>{popup.docNo}</div>
              <div style={{ fontSize:12, color:"var(--text-sub)", marginTop:3 }}>
                {popup.customer}
                {popup.contact?.name && ` · ${popup.contact.name}`}
              </div>
            </div>

            {/* 요약 정보 */}
            <div style={{
              background:"var(--bg)", borderRadius:8,
              padding:"10px 14px", margin:"14px 0",
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8,
            }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--text-muted)" }}>저장일</div>
                <div style={{ fontSize:12, fontWeight:600, marginTop:2 }}>
                  {new Date(popup.savedAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--text-muted)" }}>품목 수</div>
                <div style={{ fontSize:12, fontWeight:600, marginTop:2 }}>{popup.items?.length||0}개</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--text-muted)" }}>공급가</div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--primary)", marginTop:2 }}>
                  ₩{fmtNumber(popup.totalSupply)}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button
                onClick={handleView}
                style={{
                  width:"100%", padding:"11px 0",
                  background:"#111", color:"#fff",
                  border:"none", borderRadius:8,
                  fontSize:14, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                🖨️ 견적서 보기 (PDF 인쇄)
              </button>
              <button
                onClick={handleLoadEdit}
                style={{
                  width:"100%", padding:"11px 0",
                  background:"#1E3C78", color:"#fff",
                  border:"none", borderRadius:8,
                  fontSize:14, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                📝 다시 불러오기 (수정)
              </button>
              <button
                onClick={handleCopy}
                style={{
                  width:"100%", padding:"11px 0",
                  background:"#fff", color:"#1E3C78",
                  border:"1.5px solid #1E3C78", borderRadius:8,
                  fontSize:14, fontWeight:600, cursor:"pointer",
                  fontFamily:"inherit",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                📄 견적서 복사하기 (새 견적)
              </button>
              <button
                onClick={() => setPopup(null)}
                style={{
                  width:"100%", padding:"9px 0",
                  background:"none", color:"var(--text-muted)",
                  border:"1px solid var(--border)", borderRadius:8,
                  fontSize:13, cursor:"pointer", fontFamily:"inherit",
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
