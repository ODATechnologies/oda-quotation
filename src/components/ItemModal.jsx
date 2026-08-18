import { useState, useMemo, useRef, useEffect } from "react";
import { fmtNumber, applyDC, calcItem } from "../utils/helpers";

export default function ItemModal({ item, productList, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const [specSearch, setSpecSearch] = useState(item.spec || "");
  const [showDrop,   setShowDrop]   = useState(false);
  const searchRef = useRef(null);
  const dropRef   = useRef(null);

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

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSpec(s) {
    setForm(f => ({
      ...f,
      category:    s.catName,
      spec:        s.spec,
      specId:      s.specId,
      listPrice:   s.listPrice,
      dc:          "",
      manualPrice: false,
      unitPrice:   s.listPrice,
      details:     s.details,
    }));
    setSpecSearch(s.spec);
    setShowDrop(false);
  }

  function clearSpec() {
    setForm(f => ({ ...f, category:"", spec:"", specId:"", listPrice:"", dc:"", manualPrice:false, unitPrice:"", details:[] }));
    setSpecSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  // 실시간 계산
  const calc = useMemo(() => calcItem(form), [form]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleSave() {
    onSave({ ...calc });
    onClose();
  }

  const inputStyle = {
    width:"100%", padding:"9px 12px",
    border:"1px solid var(--border)", borderRadius:6,
    fontSize:14, fontFamily:"inherit", outline:"none",
  };
  const labelStyle = { fontSize:12, fontWeight:600, color:"var(--text-sub)", display:"block", marginBottom:5 };

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000,
    }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}
    >
      <div style={{
        background:"#fff", borderRadius:12,
        boxShadow:"0 8px 40px rgba(0,0,0,.18)",
        width:"min(780px, 95vw)",
        maxHeight:"90vh", overflowY:"auto",
        display:"flex", flexDirection:"column",
      }}>
        {/* 팝업 헤더 */}
        <div style={{
          padding:"18px 24px", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, background:"#fff", zIndex:10,
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--primary)" }}>품목 입력</div>
            {form.category && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{form.category}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-muted)", padding:"4px 8px" }}>✕</button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:20 }}>

          {/* 규격 검색 */}
          <div ref={dropRef} style={{ position:"relative" }}>
            <label style={labelStyle}>규격 검색 <span style={{color:"var(--danger)"}}>*</span></label>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              border:"1px solid var(--border)", borderRadius:6,
              padding:"4px 12px", background:"#fff",
            }}>
              <span style={{ fontSize:14, color:"var(--text-muted)" }}>🔍</span>
              <input
                ref={searchRef}
                value={specSearch}
                onChange={e => { setSpecSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                placeholder="규격명, 카테고리, 사양으로 검색..."
                style={{ flex:1, border:"none", outline:"none", fontSize:14, padding:"6px 0", fontFamily:"inherit" }}
              />
              {form.spec && (
                <button onClick={clearSpec} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16, padding:"0 4px" }}>✕</button>
              )}
            </div>
            {specSearch && !form.spec && (
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>
                {filteredSpecs.length}개 규격 검색됨
              </div>
            )}

            {/* 드롭다운 */}
            {showDrop && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                zIndex:200, background:"#fff",
                border:"1px solid var(--border)", borderRadius:8,
                boxShadow:"0 8px 32px rgba(0,0,0,.12)",
                maxHeight:280, overflowY:"auto",
              }}>
                {filteredSpecs.length === 0 ? (
                  <div style={{ padding:"20px 16px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>검색 결과가 없습니다.</div>
                ) : filteredSpecs.map(s => (
                  <div key={`${s.catId}-${s.specId}`}
                    onClick={() => selectSpec(s)}
                    style={{
                      padding:"12px 16px", cursor:"pointer",
                      borderBottom:"1px solid #f4f4f4",
                      display:"grid", gridTemplateColumns:"1fr auto",
                      alignItems:"center", gap:16,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="#F5F7FF"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}
                  >
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{s.spec}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                        {s.catName}
                        {!s.isShared && <span style={{ marginLeft:6, background:"#FEF9C3", color:"#854D0E", padding:"1px 6px", borderRadius:4, fontSize:10 }}>내 품목</span>}
                      </div>
                      {s.details?.length > 0 && (
                        <div style={{ fontSize:11, color:"#999", marginTop:3 }}>
                          {s.details.slice(0,2).join(" · ")}{s.details.length>2 && ` 외 ${s.details.length-2}개`}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--primary)", whiteSpace:"nowrap" }}>
                      ₩{fmtNumber(s.listPrice)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 사양 표시 */}
          {form.details?.length > 0 && (
            <div style={{ background:"var(--surface2)", borderRadius:6, padding:"12px 14px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", marginBottom:6, textTransform:"uppercase", letterSpacing:".05em" }}>상세 사양</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {form.details.map((d,i) => <span key={i} className="detail-tag">• {d}</span>)}
              </div>
            </div>
          )}

          {/* 수량 / 소비자가 / DC율 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <div>
              <label style={labelStyle}>수량</label>
              <input type="number" min="0" value={form.qty}
                onChange={e => set("qty", e.target.value)}
                style={{ ...inputStyle, textAlign:"center" }}/>
            </div>
            <div>
              <label style={labelStyle}>소비자가 (List Price)</label>
              <input
                value={form.listPrice !== "" ? fmtNumber(form.listPrice) : ""}
                onChange={e => { const v=e.target.value.replace(/,/g,""); set("listPrice",v); if(!form.manualPrice) set("unitPrice",v); }}
                placeholder="0"
                style={{ ...inputStyle, textAlign:"right" }}/>
            </div>
            <div>
              <label style={labelStyle}>DC율 (%)</label>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input type="number" min="0" max="99" value={form.dc}
                  onChange={e => { set("dc", e.target.value); set("manualPrice", false); }}
                  placeholder="65" disabled={form.manualPrice}
                  style={{ ...inputStyle, textAlign:"center" }}/>
                <span style={{ fontSize:13, color:"var(--text-muted)", whiteSpace:"nowrap" }}>%</span>
              </div>
              {form.dc && !form.manualPrice && (
                <div style={{ fontSize:11, color:"var(--success)", marginTop:4, fontWeight:600 }}>
                  ×{((100-Number(form.dc))/100).toFixed(2)} 적용
                </div>
              )}
            </div>
          </div>

          {/* 단가 (적용) */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <label style={labelStyle}>
                단가 (적용)
                {form.manualPrice && <span style={{ marginLeft:6, color:"var(--accent)", fontSize:11 }}>수기 입력됨</span>}
              </label>
              <input
                value={calc.unitPrice ? fmtNumber(calc.unitPrice) : ""}
                onChange={e => { const v=e.target.value.replace(/,/g,""); set("unitPrice",v); set("manualPrice",true); set("dc",""); }}
                placeholder="단가를 직접 입력하거나 DC율로 자동 계산"
                style={{
                  ...inputStyle, textAlign:"right",
                  color: form.manualPrice ? "var(--accent)" : form.dc ? "var(--success)" : "inherit",
                  fontWeight: form.manualPrice || form.dc ? 600 : 400,
                  fontSize:15,
                }}/>
            </div>
            <div>
              <label style={labelStyle}>비고</label>
              <input value={form.note} onChange={e => set("note", e.target.value)}
                placeholder="납기, 특이사항 등"
                style={inputStyle}/>
            </div>
          </div>

          {/* 계산 결과 요약 */}
          <div style={{
            background:"linear-gradient(135deg,#1E3C78 0%,#2563EB 100%)",
            borderRadius:10, padding:"16px 20px",
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
            gap:0, color:"#fff",
          }}>
            {[
              ["공급가액", `₩${fmtNumber(calc.amount)}`],
              ["부가세 (10%)", `₩${fmtNumber(calc.vat)}`],
              ["합계", `₩${fmtNumber(calc.amount + calc.vat)}`],
            ].map(([label, value], i) => (
              <div key={label} style={{
                textAlign:"center",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,.2)" : "none",
                padding:"0 16px",
              }}>
                <div style={{ fontSize:11, opacity:.7, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:i===2?18:15, fontWeight:700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div style={{
          padding:"14px 24px", borderTop:"1px solid var(--border)",
          display:"flex", justifyContent:"flex-end", gap:8,
          position:"sticky", bottom:0, background:"#fff",
        }}>
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary"
            onClick={handleSave}
            style={{ minWidth:100 }}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
