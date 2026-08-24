import { useState, useMemo, useRef, useEffect } from "react";
import { fmtNumber, calcItem } from "../utils/helpers";

export default function ItemModal({ item, productList, onSave, onClose, isOverseas, exchangeRate }) {
  const [form, setForm] = useState({ ...item });
  const [specSearch, setSpecSearch] = useState(item.spec || "");
  const [showDrop,   setShowDrop]   = useState(false);
  const searchRef = useRef(null);
  const dropRef   = useRef(null);

  const rate = Number(exchangeRate) || 1350;

  const fmtUSD = (n) => {
    if (n == null || n === "") return "";
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
  };
  const krwFromUSD = (usd) => Math.round(Number(usd) * rate);

  // 전체 규격 flat
  const allSpecs = useMemo(() => {
    const result = [];
    (productList || []).forEach(cat => {
      (cat.specs || []).forEach(s => {
        result.push({
          catId: cat._id || cat.id, catName: cat.category,
          specId: s.id, spec: s.spec,
          listPrice: s.listPrice,
          overseasPrice: s.overseasPrice ?? null,
          details: s.details || [],
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

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 모드에 따라 상세사양 필터링
  function filterDetails(details, overseas) {
    return (details||[])
      .filter(d => {
        if (d.startsWith("[domestic]")) return !overseas; // 국내전용
        if (d.startsWith("[overseas]")) return overseas;  // 해외전용
        return true; // 공통
      })
      .map(d => d.replace(/^\[(domestic|overseas)\]/, "")); // 태그 제거
  }

  function selectSpec(s) {
    const hasOverseas = isOverseas && s.overseasPrice != null && s.overseasPrice !== 0;
    // 번들이면 listPrice가 이미 합산금액
    setForm(f => ({
      ...f,
      category:     s.catName,
      spec:         s.spec,
      specId:       s.specId,
      listPrice:    s.listPrice,
      overseasPrice:s.overseasPrice ?? null,
      dc:           "",
      manualPrice:  false,
      unitPrice:    hasOverseas ? s.overseasPrice : s.listPrice,
      details:      filterDetails(s.details, isOverseas),
      isBundle:     s.isBundle || false,
      bundleItems:  s.bundleItems || [],
    }));
    setSpecSearch(s.spec);
    setShowDrop(false);
  }

  function clearSpec() {
    setForm(f => ({ ...f, category:"", spec:"", specId:"", listPrice:"", overseasPrice:null, dc:"", manualPrice:false, unitPrice:"", details:[] }));
    setSpecSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  const calc = useMemo(() => calcItem(form), [form]);
  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function handleSave() {
    onSave({
      ...calc,
      isBundle:    form.isBundle || false,
      bundleItems: form.bundleItems || [],
    });
    onClose();
  }

  const inputStyle = { width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:6, fontSize:14, fontFamily:"inherit", outline:"none" };
  const labelStyle = { fontSize:12, fontWeight:600, color:"var(--text-sub)", display:"block", marginBottom:5 };

  // 참고 금액 표시 (회색 작은 텍스트)
  const RefPrice = ({ label, value }) => (
    <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>
      {label}: <span style={{ fontWeight:600 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 8px 40px rgba(0,0,0,.18)", width:"min(780px, 95vw)", maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* 헤더 */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16, fontWeight:700, color:"var(--primary)" }}>품목 입력</span>
              {isOverseas && (
                <span style={{ background:"#EEF3FF", color:"#2563EB", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>
                  🌐 해외 · USD $1 = ₩{fmtNumber(rate)}
                </span>
              )}
            </div>
            {form.category && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{form.category}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-muted)", padding:"4px 8px" }}>✕</button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:20 }}>

          {/* 규격 검색 */}
          <div ref={dropRef} style={{ position:"relative" }}>
            <label style={labelStyle}>규격 검색 <span style={{color:"var(--danger)"}}>*</span></label>
            <div style={{ display:"flex", alignItems:"center", gap:8, border:"1px solid var(--border)", borderRadius:6, padding:"4px 12px", background:"#fff" }}>
              <span style={{ fontSize:14, color:"var(--text-muted)" }}>🔍</span>
              <input ref={searchRef} value={specSearch}
                onChange={e => { setSpecSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                placeholder="규격명, 카테고리, 사양으로 검색..."
                style={{ flex:1, border:"none", outline:"none", fontSize:14, padding:"6px 0", fontFamily:"inherit" }}
              />
              {form.spec && <button onClick={clearSpec} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16 }}>✕</button>}
            </div>

            {showDrop && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:200, background:"#fff", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 8px 32px rgba(0,0,0,.12)", maxHeight:280, overflowY:"auto" }}>
                {filteredSpecs.length === 0 ? (
                  <div style={{ padding:"20px 16px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>검색 결과가 없습니다.</div>
                ) : filteredSpecs.map(s => (
                  <div key={`${s.catId}-${s.specId}`} onClick={() => selectSpec(s)}
                    style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f4f4f4", display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:16 }}
                    onMouseEnter={e => e.currentTarget.style.background="#F5F7FF"}
                    onMouseLeave={e => e.currentTarget.style.background="#fff"}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{s.spec}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                        {s.catName}
                        {!s.isShared && <span style={{ marginLeft:6, background:"#FEF9C3", color:"#854D0E", padding:"1px 6px", borderRadius:4, fontSize:10 }}>내 품목</span>}
                      </div>
                      {s.details?.length > 0 && <div style={{ fontSize:11, color:"#999", marginTop:3 }}>{s.details.slice(0,2).join(" · ")}{s.details.length>2 && ` 외 ${s.details.length-2}개`}</div>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {isOverseas ? (
                        s.overseasPrice != null ? (
                          <>
                            <div style={{ fontSize:14, fontWeight:700, color:"#059669" }}>{fmtUSD(s.overseasPrice)}</div>
                            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>₩{fmtNumber(s.listPrice)}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize:12, color:"var(--text-muted)" }}>해외단가 미등록</div>
                            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>₩{fmtNumber(s.listPrice)}</div>
                          </>
                        )
                      ) : (
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>₩{fmtNumber(s.listPrice)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 상세 사양 */}
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
            {/* 수량 */}
            <div>
              <label style={labelStyle}>수량</label>
              <input type="number" min="0" value={form.qty}
                onChange={e => set("qty", e.target.value)}
                style={{ ...inputStyle, textAlign:"center" }}/>
            </div>

            {/* 소비자가 */}
            <div>
              <label style={labelStyle}>
                {isOverseas ? "해외단가 List Price (USD)" : "소비자가 List Price (KRW)"}
              </label>
              {isOverseas ? (
                // 해외: USD 입력 (= overseasPrice)
                <>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#059669", fontWeight:700, fontSize:14 }}>$</span>
                    <input
                      type="number" step="0.01"
                      value={form.overseasPrice ?? ""}
                      onChange={e => {
                        const v = e.target.value;
                        set("overseasPrice", v === "" ? null : Number(v));
                        set("unitPrice", v === "" ? "" : Number(v));
                        set("manualPrice", true);
                      }}
                      placeholder="0.00"
                      style={{ ...inputStyle, textAlign:"right", paddingLeft:22, color:"#059669", fontWeight:600 }}
                    />
                  </div>
                  {form.listPrice != null && form.listPrice !== "" && (
                    <RefPrice label="국내 소비자가" value={`₩${fmtNumber(form.listPrice)}`} />
                  )}
                </>
              ) : (
                // 국내: KRW 입력
                <input
                  value={form.listPrice !== "" ? fmtNumber(form.listPrice) : ""}
                  onChange={e => { const v=e.target.value.replace(/[^0-9.-]/g,""); set("listPrice",v); if(!form.manualPrice) set("unitPrice",v); }}
                  placeholder="0"
                  style={{ ...inputStyle, textAlign:"right" }}/>
              )}
            </div>

            {/* DC율 (국내만) */}
            <div>
              <label style={labelStyle}>DC율 (%)</label>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input type="number" min="0" max="99" value={form.dc}
                  onChange={e => {
                    const dc = e.target.value;
                    set("dc", dc);
                    set("manualPrice", false);
                    // 해외: overseasPrice 기반 DC 적용
                    if (isOverseas && form.overseasPrice && dc !== "") {
                      const discounted = Number(form.overseasPrice) * (1 - Number(dc)/100);
                      set("unitPrice", Math.round(discounted * 100) / 100);
                    }
                  }}
                  placeholder="65"
                  disabled={false}
                  style={{ ...inputStyle, textAlign:"center" }}/>
                <span style={{ fontSize:13, color:"var(--text-muted)", whiteSpace:"nowrap" }}>%</span>
              </div>
              {form.dc && !form.manualPrice && (
                <div style={{ fontSize:11, color:"var(--success)", marginTop:4, fontWeight:600 }}>×{((100-Number(form.dc))/100).toFixed(2)} 적용</div>
              )}
            </div>
          </div>

          {/* 단가 / 비고 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <label style={labelStyle}>
                {isOverseas ? "단가 (USD)" : "단가 (적용)"}
                {form.manualPrice && !isOverseas && <span style={{ marginLeft:6, color:"var(--accent)", fontSize:11 }}>수기 입력됨</span>}
              </label>
              {isOverseas ? (
                // 해외: USD 단가 (= overseasPrice와 동일)
                <>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#059669", fontWeight:700, fontSize:14 }}>$</span>
                    <input
                      type="number" step="0.01"
                      value={form.unitPrice ?? ""}
                      onChange={e => { const v=e.target.value; set("unitPrice", v===""?"":Number(v)); set("overseasPrice", v===""?null:Number(v)); set("manualPrice",true); }}
                      placeholder="0.00"
                      style={{ ...inputStyle, textAlign:"right", paddingLeft:22, color:"#059669", fontWeight:600 }}
                    />
                  </div>
                  {/* 하단: 환율 적용 KRW 참고금액 */}
                  {form.unitPrice != null && form.unitPrice !== "" && (
                    <RefPrice
                      label={`₩${fmtNumber(rate)}/USD 환율 기준`}
                      value={`≈ ₩${fmtNumber(krwFromUSD(form.unitPrice))}`}
                    />
                  )}
                </>
              ) : (
                // 국내: KRW 단가 (마이너스 입력 허용)
                <>
                  <input
                    value={form.manualPrice
                      ? (form.unitPrice ?? "")
                      : (calc.unitPrice ? fmtNumber(calc.unitPrice) : "")}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9,.\-]/g, "");
                      set("unitPrice", v);
                      set("manualPrice", true);
                      set("dc", "");
                    }}
                    placeholder="단가를 직접 입력하거나 DC율로 자동 계산"
                    style={{ ...inputStyle, textAlign:"right",
                      color: form.manualPrice ? "var(--accent)" : form.dc ? "var(--success)" : "inherit",
                      fontWeight: form.manualPrice || form.dc ? 600 : 400 }}/>
                </>
              )}
            </div>
            {form.isBundle && form.bundleItems?.length > 0 && (
              <div style={{gridColumn:"1 / -1"}}>
                <label style={labelStyle}>번들 구성품 내역</label>
                <div style={{border:"0.5px solid var(--border)",borderRadius:6,overflow:"hidden",fontSize:12}}>
                  {form.bundleItems.map((b,i)=>{
                    const baseAmt = (Number(b.qty)||1)*(Number(b.unitPrice)||0);
                    const nego = Number(b.nego||0);
                    const finalAmt = nego > 0 ? Math.round(baseAmt*(1-nego/100)) : baseAmt;
                    return (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 10px",borderBottom:"0.5px solid var(--border)",background:i%2===0?"var(--surface-1)":"transparent"}}>
                      <span style={{color:"var(--text-secondary)"}}>{b.name}{Number(b.qty)>1?` ×${b.qty}`:""}</span>
                      <span style={{color:"var(--text-primary)",fontWeight:500}}>
                        ₩{finalAmt.toLocaleString("ko-KR")}
                        {nego>0&&<span style={{fontSize:10,color:"#e07000",marginLeft:4}}>NEGO {nego}%</span>}
                      </span>
                    </div>
                  );})}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",fontWeight:600,background:"var(--surface-1)"}}>
                    <span>합산 단가</span>
                    <span style={{color:"var(--text-accent)"}}>₩{form.bundleItems.reduce((s,b)=>{
                      const base=(Number(b.qty)||1)*(Number(b.unitPrice)||0);
                      const nego=Number(b.nego||0);
                      return s+(nego>0?Math.round(base*(1-nego/100)):base);
                    },0).toLocaleString("ko-KR")}</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label style={labelStyle}>비고</label>
              <input value={form.note} onChange={e => set("note", e.target.value)}
                placeholder="납기, 특이사항 등" style={inputStyle}/>
            </div>
          </div>

          {/* 계산 결과 요약 */}
          <div style={{ background:"linear-gradient(135deg,#1E3C78 0%,#2563EB 100%)", borderRadius:10, padding:"16px 20px", color:"#fff" }}>
            {isOverseas ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                <div style={{ textAlign:"center", borderRight:"1px solid rgba(255,255,255,.2)", paddingRight:16 }}>
                  <div style={{ fontSize:11, opacity:.7, marginBottom:4 }}>단가 (USD)</div>
                  <div style={{ fontSize:16, fontWeight:700 }}>{fmtUSD(Number(form.unitPrice)||0)}</div>
                </div>
                <div style={{ textAlign:"center", paddingLeft:16 }}>
                  <div style={{ fontSize:11, opacity:.7, marginBottom:4 }}>금액 (USD)</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#86EFAC" }}>
                    {fmtUSD((Number(form.unitPrice)||0) * (Number(form.qty)||1))}
                  </div>
                  <div style={{ fontSize:10, opacity:.6, marginTop:3 }}>
                    ≈ ₩{fmtNumber(krwFromUSD((Number(form.unitPrice)||0) * (Number(form.qty)||1)))} 참고
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0 }}>
                {[
                  ["공급가액", `₩${fmtNumber(calc.amount)}`],
                  ["부가세 (10%)", `₩${fmtNumber(calc.vat)}`],
                  ["합계", `₩${fmtNumber(calc.amount + calc.vat)}`],
                ].map(([label, value], i) => (
                  <div key={label} style={{ textAlign:"center", borderRight:i<2?"1px solid rgba(255,255,255,.2)":"none", padding:"0 16px" }}>
                    <div style={{ fontSize:11, opacity:.7, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:i===2?18:15, fontWeight:700 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ padding:"14px 24px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"flex-end", gap:8, position:"sticky", bottom:0, background:"#fff" }}>
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ minWidth:100 }}>확인</button>
        </div>
      </div>
    </div>
  );
}
