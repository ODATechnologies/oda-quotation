import { useState, useEffect } from "react";
import { fmtNumber, applyDC } from "../utils/helpers";

export default function ItemRow({ item, idx, productList, onUpdate, onRemove, calc }) {
  const [showDetails, setShowDetails] = useState(true);

  // 카테고리 변경 시 규격 초기화
  function handleCategoryChange(e) {
    onUpdate({ category: e.target.value, spec: "", listPrice: "", dc: "", manualPrice: false, unitPrice: "", details: [] });
  }

  // 규격 선택 시 소비자가 & 사양 자동 입력
  function handleSpecChange(e) {
    const specId = e.target.value;
    const catObj = productList.find(p => p.category === item.category);
    const specObj = catObj?.specs.find(s => s.id === specId);
    if (specObj) {
      onUpdate({
        spec: specObj.spec,
        specId,
        listPrice: specObj.listPrice,
        dc: "",
        manualPrice: false,
        unitPrice: specObj.listPrice,
        details: specObj.details || [],
      });
    }
  }

  // DC율 입력
  function handleDcChange(e) {
    const dc = e.target.value;
    onUpdate({ dc, manualPrice: false });
  }

  // 단가 수기 입력
  function handleUnitPriceChange(e) {
    const v = e.target.value.replace(/,/g, "");
    onUpdate({ unitPrice: v, manualPrice: true, dc: "" });
  }

  const catObj  = productList.find(p => p.category === item.category);
  const dcApplied = !item.manualPrice && item.dc !== "" && item.dc !== null;
  const displayUnitPrice = calc?.unitPrice || 0;

  return (
    <>
      {/* 메인 행 */}
      <tr>
        {/* NO */}
        <td style={{ textAlign:"center", fontWeight:700, color:"var(--text-muted)" }}>{idx + 1}</td>

        {/* 품목 (카테고리) */}
        <td>
          <select
            value={item.category}
            onChange={handleCategoryChange}
            style={{ width:"100%", minWidth:140 }}
          >
            <option value="">-- 선택 --</option>
            {productList.map(p => (
              <option key={p.id} value={p.category}>{p.category}</option>
            ))}
          </select>
        </td>

        {/* 규격 */}
        <td>
          {catObj ? (
            <select
              value={item.specId || ""}
              onChange={handleSpecChange}
              style={{ width:"100%", minWidth:120 }}
            >
              <option value="">-- 규격 --</option>
              {catObj.specs.map(s => (
                <option key={s.id} value={s.id}>{s.spec}</option>
              ))}
            </select>
          ) : (
            <input
              value={item.spec}
              onChange={e => onUpdate({ spec: e.target.value })}
              placeholder="직접 입력"
              style={{ width:"100%" }}
            />
          )}
        </td>

        {/* 수량 */}
        <td>
          <input
            type="number" min="0"
            value={item.qty}
            onChange={e => onUpdate({ qty: e.target.value })}
            style={{ width:60, textAlign:"center" }}
          />
        </td>

        {/* 소비자가 */}
        <td style={{ textAlign:"right" }}>
          <input
            value={item.listPrice !== "" ? fmtNumber(item.listPrice) : ""}
            onChange={e => {
              const v = e.target.value.replace(/,/g, "");
              onUpdate({ listPrice: v, manualPrice: false, unitPrice: v });
            }}
            placeholder="0"
            style={{ width:"100%", textAlign:"right" }}
          />
        </td>

        {/* DC율 */}
        <td>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <input
              type="number" min="0" max="99"
              value={item.dc}
              onChange={handleDcChange}
              placeholder="65"
              style={{ width:48, textAlign:"center" }}
              disabled={item.manualPrice}
            />
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>%</span>
          </div>
          {dcApplied && (
            <div className="dc-applied">
              ×{((100 - Number(item.dc)) / 100).toFixed(2)}
            </div>
          )}
        </td>

        {/* 단가 (적용) */}
        <td>
          <input
            value={displayUnitPrice ? fmtNumber(displayUnitPrice) : ""}
            onChange={handleUnitPriceChange}
            placeholder="수기 입력 가능"
            style={{ width:"100%", textAlign:"right",
              color: item.manualPrice ? "var(--accent)" : dcApplied ? "var(--success)" : "inherit",
              fontWeight: item.manualPrice || dcApplied ? 600 : 400,
            }}
          />
          {item.manualPrice && <div style={{ fontSize:10, color:"var(--accent)" }}>수기</div>}
        </td>

        {/* 금액 */}
        <td style={{ textAlign:"right", fontWeight:600 }}>
          ₩{fmtNumber(calc?.amount || 0)}
        </td>

        {/* 부가세 */}
        <td style={{ textAlign:"right", color:"var(--text-sub)" }}>
          ₩{fmtNumber(calc?.vat || 0)}
        </td>

        {/* 비고 */}
        <td>
          <input
            value={item.note}
            onChange={e => onUpdate({ note: e.target.value })}
            placeholder="비고"
            style={{ width:"100%" }}
          />
        </td>

        {/* 삭제 */}
        <td style={{ textAlign:"center" }}>
          <button className="btn btn-ghost" onClick={onRemove} title="삭제">✕</button>
        </td>
      </tr>

      {/* 상세 사양 행 */}
      {item.details && item.details.length > 0 && (
        <tr>
          <td></td>
          <td colSpan={9} style={{ padding:"4px 8px 10px", background:"var(--surface2)" }}>
            <button
              style={{ fontSize:11, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", marginBottom:4 }}
              onClick={() => setShowDetails(v => !v)}
            >
              {showDetails ? "▲" : "▼"} 상세 사양 ({item.details.length}개)
            </button>
            {showDetails && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {item.details.map((d, i) => (
                  <span key={i} className="detail-tag">• {d}</span>
                ))}
              </div>
            )}
          </td>
          <td></td>
        </tr>
      )}
    </>
  );
}
