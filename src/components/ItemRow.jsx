import { useState, useMemo, useRef, useEffect } from "react";
import { fmtNumber, applyDC } from "../utils/helpers";

export default function ItemRow({ item, idx, productList, onUpdate, onRemove, calc }) {
  const [showDetails, setShowDetails] = useState(true);
  const [specSearch,  setSpecSearch]  = useState("");
  const [showDrop,    setShowDrop]    = useState(false);
  const dropRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 전체 규격 목록 (공용 + 개인) flat
  const allSpecs = useMemo(() => {
    const result = [];
    (productList || []).forEach(cat => {
      (cat.specs || []).forEach(s => {
        result.push({
          catId:    cat._id || cat.id,
          catName:  cat.category,
          specId:   s.id,
          spec:     s.spec,
          listPrice:s.listPrice,
          details:  s.details || [],
          isShared: cat._type === "shared" || !cat._type,
        });
      });
    });
    return result;
  }, [productList]);

  // 검색 필터
  const filteredSpecs = useMemo(() => {
    const q = specSearch.toLowerCase();
    if (!q) return allSpecs;
    return allSpecs.filter(s =>
      s.spec?.toLowerCase().includes(q) ||
      s.catName?.toLowerCase().includes(q) ||
      s.details?.some(d => d.toLowerCase().includes(q))
    );
  }, [allSpecs, specSearch]);

  function handleSpecSelect(s) {
    onUpdate({
      category:   s.catName,
      spec:       s.spec,
      specId:     s.specId,
      listPrice:  s.listPrice,
      dc:         "",
      manualPrice:false,
      unitPrice:  s.listPrice,
      details:    s.details,
    });
    setSpecSearch(s.spec);
    setShowDrop(false);
  }

  function handleUnitPriceChange(e) {
    const v = e.target.value.replace(/,/g, "");
    onUpdate({ unitPrice:v, manualPrice:true, dc:"" });
  }

  const dcApplied      = !item.manualPrice && item.dc !== "" && item.dc !== null;
  const displayUnitPrice = calc?.unitPrice || 0;

  return (
    <>
      <tr>
        <td style={{ textAlign:"center", fontWeight:700, color:"var(--text-muted)" }}>{idx+1}</td>

        {/* 규격 통합 검색 */}
        <td colSpan={2} style={{ position:"relative", minWidth:280 }} ref={dropRef}>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <input
              value={specSearch || item.spec || ""}
              onChange={e => { setSpecSearch(e.target.value); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              placeholder="🔍 규격명 / 카테고리 검색..."
              style={{ flex:1, padding:"5px 8px", border:"1px solid var(--border)", borderRadius:4, fontSize:12 }}
            />
            {(item.spec || specSearch) && (
              <button onClick={() => { onUpdate({ category:"", spec:"", specId:"", listPrice:"", dc:"", manualPrice:false, unitPrice:"", details:[] }); setSpecSearch(""); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:14, padding:"0 4px" }}>✕</button>
            )}
          </div>
          {item.category && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{item.category}</div>}

          {/* 드롭다운 */}
          {showDrop && (
            <div style={{
              position:"absolute", top:"100%", left:0, right:0, zIndex:200,
              background:"#fff", border:"1px solid var(--border)",
              borderRadius:6, boxShadow:"0 4px 16px rgba(0,0,0,.12)",
              maxHeight:240, overflowY:"auto", marginTop:2,
            }}>
              {filteredSpecs.length === 0 ? (
                <div style={{ padding:"10px 12px", color:"var(--text-muted)", fontSize:12 }}>검색 결과 없음</div>
              ) : filteredSpecs.map(s => (
                <div key={`${s.catId}-${s.specId}`}
                  onClick={() => handleSpecSelect(s)}
                  style={{
                    padding:"8px 12px", cursor:"pointer", borderBottom:"1px solid #f0f0f0",
                    transition:"background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="#f5f7ff"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff"}
                >
                  <div style={{ fontSize:12, fontWeight:600 }}>{s.spec}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {s.catName}
                    {!s.isShared && <span style={{ marginLeft:6, color:"#854D0E", background:"#FEF9C3", padding:"0 5px", borderRadius:4 }}>내 품목</span>}
                    {" · "}₩{fmtNumber(s.listPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </td>

        {/* 수량 */}
        <td>
          <input type="number" min="0" value={item.qty}
            onChange={e => onUpdate({ qty:e.target.value })}
            style={{ width:56, textAlign:"center", padding:"4px 6px", border:"1px solid var(--border)", borderRadius:4 }}/>
        </td>

        {/* 소비자가 */}
        <td style={{ textAlign:"right" }}>
          <input
            value={item.listPrice !== "" ? fmtNumber(item.listPrice) : ""}
            onChange={e => { const v=e.target.value.replace(/,/g,""); onUpdate({ listPrice:v, manualPrice:false, unitPrice:v }); }}
            placeholder="0" style={{ width:"100%", textAlign:"right", padding:"4px 6px", border:"1px solid var(--border)", borderRadius:4 }}/>
        </td>

        {/* DC율 */}
        <td>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <input type="number" min="0" max="99" value={item.dc}
              onChange={e => onUpdate({ dc:e.target.value, manualPrice:false })}
              placeholder="65" disabled={item.manualPrice}
              style={{ width:46, textAlign:"center", padding:"4px 6px", border:"1px solid var(--border)", borderRadius:4 }}/>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>%</span>
          </div>
          {dcApplied && <div style={{ fontSize:10, color:"var(--success)", fontWeight:700 }}>×{((100-Number(item.dc))/100).toFixed(2)}</div>}
        </td>

        {/* 단가 */}
        <td>
          <input
            value={displayUnitPrice ? fmtNumber(displayUnitPrice) : ""}
            onChange={handleUnitPriceChange}
            placeholder="수기 입력"
            style={{
              width:"100%", textAlign:"right", padding:"4px 6px",
              border:"1px solid var(--border)", borderRadius:4,
              color: item.manualPrice ? "var(--accent)" : dcApplied ? "var(--success)" : "inherit",
              fontWeight: item.manualPrice || dcApplied ? 600 : 400,
            }}/>
          {item.manualPrice && <div style={{ fontSize:10, color:"var(--accent)" }}>수기</div>}
        </td>

        {/* 금액 */}
        <td style={{ textAlign:"right", fontWeight:600 }}>₩{fmtNumber(calc?.amount||0)}</td>

        {/* 부가세 */}
        <td style={{ textAlign:"right", color:"var(--text-sub)" }}>₩{fmtNumber(calc?.vat||0)}</td>

        {/* 비고 */}
        <td>
          <input value={item.note} onChange={e => onUpdate({ note:e.target.value })}
            placeholder="비고" style={{ width:"100%", padding:"4px 6px", border:"1px solid var(--border)", borderRadius:4 }}/>
        </td>

        {/* 삭제 */}
        <td style={{ textAlign:"center" }}>
          <button className="btn btn-ghost" onClick={onRemove} title="삭제">✕</button>
        </td>
      </tr>

      {/* 사양 상세 */}
      {item.details && item.details.length > 0 && (
        <tr>
          <td></td>
          <td colSpan={9} style={{ padding:"4px 8px 10px", background:"var(--surface2)" }}>
            <button style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", marginBottom:4 }}
              onClick={() => setShowDetails(v=>!v)}>
              {showDetails?"▲":"▼"} 상세 사양 ({item.details.length}개)
            </button>
            {showDetails && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {item.details.map((d,i) => <span key={i} className="detail-tag">• {d}</span>)}
              </div>
            )}
          </td>
          <td></td>
        </tr>
      )}
    </>
  );
}
