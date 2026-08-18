import { useState, useMemo, useRef, useEffect } from "react";
import { fmtNumber, applyDC } from "../utils/helpers";

export default function ItemRow({ item, idx, productList, onUpdate, onRemove, calc }) {
  const [showDetails, setShowDetails] = useState(true);
  const [specSearch,  setSpecSearch]  = useState("");
  const [showDrop,    setShowDrop]    = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 전체 규격 flat
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
      category:    s.catName,
      spec:        s.spec,
      specId:      s.specId,
      listPrice:   s.listPrice,
      dc:          "",
      manualPrice: false,
      unitPrice:   s.listPrice,
      details:     s.details,
    });
    setSpecSearch(s.spec);
    setShowDrop(false);
  }

  function handleUnitPriceChange(e) {
    const v = e.target.value.replace(/,/g, "");
    onUpdate({ unitPrice: v, manualPrice: true, dc: "" });
  }

  const dcApplied        = !item.manualPrice && item.dc !== "" && item.dc !== null;
  const displayUnitPrice = calc?.unitPrice || 0;
  const displayLabel     = item.spec ? `${item.spec}` : "";

  return (
    <>
      <tr>
        {/* NO */}
        <td style={{ textAlign:"center", fontWeight:700, color:"var(--text-muted)", width:36 }}>{idx+1}</td>

        {/* 품목 검색 — colSpan 없이 단독 셀, 드롭다운은 fixed로 */}
        <td style={{ position:"relative", minWidth:260 }} ref={dropRef}>
          {/* 선택된 품목 표시 또는 검색 입력 */}
          <div
            onClick={() => setShowDrop(true)}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              border:"1px solid var(--border)", borderRadius:4,
              padding:"6px 10px", cursor:"text", background:"#fff",
              minHeight:34,
            }}
          >
            {!showDrop && displayLabel ? (
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {item.spec}
                </div>
                <div style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {item.category}
                </div>
              </div>
            ) : (
              <input
                autoFocus={showDrop}
                value={showDrop ? specSearch : (item.spec || "")}
                onChange={e => { setSpecSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => { setShowDrop(true); setSpecSearch(""); }}
                placeholder="🔍 규격명 검색..."
                style={{
                  flex:1, border:"none", outline:"none",
                  fontSize:13, background:"transparent", padding:0,
                }}
              />
            )}
            {item.spec && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onUpdate({ category:"", spec:"", specId:"", listPrice:"", dc:"", manualPrice:false, unitPrice:"", details:[] });
                  setSpecSearch("");
                  setShowDrop(false);
                }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:14, padding:"0 2px", marginLeft:4 }}
              >✕</button>
            )}
          </div>

          {/* 드롭다운 — 행 아래에 넓게 */}
          {showDrop && (
            <div style={{
              position:"absolute",
              top:"calc(100% + 4px)",
              left:0,
              width:"520px",          // 고정 넓이
              zIndex:9999,
              background:"#fff",
              border:"1px solid var(--border)",
              borderRadius:8,
              boxShadow:"0 8px 32px rgba(0,0,0,.15)",
            }}>
              {/* 검색 입력창 (드롭다운 내부) */}
              <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--border)" }}>
                <input
                  autoFocus
                  value={specSearch}
                  onChange={e => setSpecSearch(e.target.value)}
                  placeholder="규격명, 카테고리, 사양으로 검색..."
                  style={{
                    width:"100%", padding:"8px 12px",
                    border:"1px solid var(--border)", borderRadius:6,
                    fontSize:13, outline:"none",
                  }}
                />
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
                  {filteredSpecs.length}개 규격
                  {specSearch && ` · "${specSearch}" 검색 결과`}
                </div>
              </div>

              {/* 결과 목록 */}
              <div style={{ maxHeight:300, overflowY:"auto" }}>
                {filteredSpecs.length === 0 ? (
                  <div style={{ padding:"20px 16px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>
                    검색 결과가 없습니다.
                  </div>
                ) : filteredSpecs.map(s => (
                  <div key={`${s.catId}-${s.specId}`}
                    onClick={() => handleSpecSelect(s)}
                    style={{
                      padding:"10px 14px",
                      cursor:"pointer",
                      borderBottom:"1px solid #f4f4f4",
                      display:"grid",
                      gridTemplateColumns:"1fr auto",
                      alignItems:"center",
                      gap:12,
                      transition:"background .1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="#F5F7FF"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}
                  >
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:"#111" }}>{s.spec}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
                        {s.catName}
                        {!s.isShared && (
                          <span style={{ marginLeft:6, background:"#FEF9C3", color:"#854D0E", padding:"1px 6px", borderRadius:4, fontSize:10 }}>
                            내 품목
                          </span>
                        )}
                      </div>
                      {s.details?.length > 0 && (
                        <div style={{ fontSize:10.5, color:"#888", marginTop:3 }}>
                          {s.details.slice(0,2).join(" · ")}
                          {s.details.length > 2 && ` 외 ${s.details.length-2}개`}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>
                        ₩{fmtNumber(s.listPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </td>

        {/* 규격 (선택 시 자동 표시) */}
        <td style={{ fontSize:12, color:"var(--text-sub)", whiteSpace:"nowrap" }}>
          {item.spec || ""}
        </td>

        {/* 수량 */}
        <td>
          <input type="number" min="0" value={item.qty}
            onChange={e => onUpdate({ qty:e.target.value })}
            style={{ width:56, textAlign:"center", padding:"5px 6px", border:"1px solid var(--border)", borderRadius:4, fontSize:13 }}/>
        </td>

        {/* 소비자가 */}
        <td>
          <input
            value={item.listPrice !== "" ? fmtNumber(item.listPrice) : ""}
            onChange={e => { const v=e.target.value.replace(/,/g,""); onUpdate({ listPrice:v, manualPrice:false, unitPrice:v }); }}
            placeholder="0"
            style={{ width:"100%", textAlign:"right", padding:"5px 6px", border:"1px solid var(--border)", borderRadius:4, fontSize:13 }}/>
        </td>

        {/* DC율 */}
        <td>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <input type="number" min="0" max="99" value={item.dc}
              onChange={e => onUpdate({ dc:e.target.value, manualPrice:false })}
              placeholder="65" disabled={item.manualPrice}
              style={{ width:48, textAlign:"center", padding:"5px 4px", border:"1px solid var(--border)", borderRadius:4, fontSize:13 }}/>
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
              width:"100%", textAlign:"right", padding:"5px 6px",
              border:"1px solid var(--border)", borderRadius:4, fontSize:13,
              color: item.manualPrice ? "var(--accent)" : dcApplied ? "var(--success)" : "inherit",
              fontWeight: item.manualPrice || dcApplied ? 600 : 400,
            }}/>
          {item.manualPrice && <div style={{ fontSize:10, color:"var(--accent)" }}>수기</div>}
        </td>

        {/* 금액 */}
        <td style={{ textAlign:"right", fontWeight:600, whiteSpace:"nowrap" }}>₩{fmtNumber(calc?.amount||0)}</td>

        {/* 부가세 */}
        <td style={{ textAlign:"right", color:"var(--text-sub)", whiteSpace:"nowrap" }}>₩{fmtNumber(calc?.vat||0)}</td>

        {/* 비고 */}
        <td>
          <input value={item.note} onChange={e => onUpdate({ note:e.target.value })}
            placeholder="비고"
            style={{ width:"100%", padding:"5px 6px", border:"1px solid var(--border)", borderRadius:4, fontSize:13 }}/>
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
            <button
              style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", marginBottom:4 }}
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
