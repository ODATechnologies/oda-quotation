import { fmtNumber } from "../utils/helpers";

// 메인 테이블에서는 간략하게만 표시, 클릭하면 팝업 오픈
export default function ItemRow({ item, idx, calc, onEdit, onRemove, isOverseas, exchangeRate }) {
  const fmtUSD = (n) => {
    if (!n && n !== 0) return "-";
    return "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  };
  return (
    <>
      <tr
        onClick={onEdit}
        style={{ cursor:"pointer" }}
        onMouseEnter={e => e.currentTarget.style.background="#EEF3FF"}
        onMouseLeave={e => e.currentTarget.style.background=""}
        title="클릭하여 수정"
      >
        {/* NO */}
        <td style={{ textAlign:"center", fontWeight:700, color:"var(--text-muted)", width:36 }}>{idx+1}</td>

        {/* 품목 */}
        <td>
          {item.category
            ? <span style={{ fontWeight:600 }}>{item.category}</span>
            : <span style={{ color:"var(--text-muted)", fontSize:12 }}>품목 미선택</span>
          }
        </td>

        {/* 규격 */}
        <td style={{ fontSize:13 }}>{item.spec || "-"}</td>

        {/* 수량 */}
        <td style={{ textAlign:"center" }}>{item.qty}</td>

        {/* 단가 */}
        <td style={{ textAlign:"right", fontSize:13 }}>
          {isOverseas
            ? (calc?.unitPriceUSD ? fmtUSD(calc.unitPriceUSD) : "-")
            : (calc?.unitPrice ? `₩${fmtNumber(calc.unitPrice)}` : "-")}
          {item.dc && !item.manualPrice && (
            <div style={{ fontSize:10, color:"var(--success)", fontWeight:600 }}>DC {item.dc}%</div>
          )}
          {item.manualPrice && (
            <div style={{ fontSize:10, color:"var(--accent)" }}>수기</div>
          )}
        </td>

        {/* 금액 */}
        <td style={{ textAlign:"right", fontWeight:700, color:"var(--primary)" }}>
          {isOverseas
            ? (calc?.amountUSD ? fmtUSD(calc.amountUSD) : "-")
            : (calc?.amount ? `₩${fmtNumber(calc.amount)}` : "-")}
        </td>

        {/* 부가세 (국내만) */}
        {!isOverseas && (
          <td style={{ textAlign:"right", color:"var(--text-sub)", fontSize:12 }}>
            {calc?.vat ? `₩${fmtNumber(calc.vat)}` : "-"}
          </td>
        )}

        {/* 비고 */}
        <td style={{ fontSize:12, color:"var(--text-sub)" }}>{item.note || ""}</td>

        {/* 삭제 */}
        <td style={{ textAlign:"center" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="삭제"
            style={{ fontSize:14, color:"var(--text-muted)" }}
          >✕</button>
        </td>
      </tr>

      {/* 사양 상세 (접기 없이 항상 표시) */}
      {item.details?.length > 0 && (
        <tr onClick={onEdit} style={{ cursor:"pointer" }}
          onMouseEnter={e => e.currentTarget.style.background="#EEF3FF"}
          onMouseLeave={e => e.currentTarget.style.background=""}>
          <td></td>
          <td colSpan={7} style={{ padding:"2px 8px 8px", background:"var(--surface2)" }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {item.details.map((d,i) => <span key={i} className="detail-tag">• {d}</span>)}
            </div>
          </td>
          <td style={{ background:"var(--surface2)" }}></td>
        </tr>
      )}
    </>
  );
}
