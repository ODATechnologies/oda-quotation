import { useState } from "react";
import { INITIAL_PRODUCTS } from "../data/masterData";
import { fmtNumber } from "../utils/helpers";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function ProductManager({ showToast }) {
  const [list, setList] = useState(() => loadLS("oda_products", INITIAL_PRODUCTS));
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  function saveList(next) {
    setList(next);
    localStorage.setItem("oda_products", JSON.stringify(next));
  }

  // ── 카테고리 ──
  function addCategory(name) {
    saveList([...list, { id: Date.now(), category: name, specs: [] }]);
    showToast("카테고리가 추가되었습니다.", "success");
    setModal(null);
  }
  function removeCategory(id) {
    if (!confirm("카테고리를 삭제하시겠습니까?")) return;
    saveList(list.filter(c => c.id !== id));
    showToast("삭제되었습니다.");
  }

  // ── 규격 ──
  function saveSpec(catId, specData) {
    const next = list.map(c => {
      if (c.id !== catId) return c;
      let specs;
      if (modal.mode === "add-spec") {
        specs = [...c.specs, { id: `spec-${Date.now()}`, ...specData }];
      } else {
        specs = c.specs.map(s => s.id === modal.specId ? { ...s, ...specData } : s);
      }
      return { ...c, specs };
    });
    saveList(next);
    showToast("저장되었습니다.", "success");
    setModal(null);
  }
  function removeSpec(catId, specId) {
    if (!confirm("규격을 삭제하시겠습니까?")) return;
    const next = list.map(c => c.id !== catId ? c
      : { ...c, specs: c.specs.filter(s => s.id !== specId) });
    saveList(next);
    showToast("삭제되었습니다.");
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>품목 관리</h2>
        <button className="btn btn-primary" onClick={() => setModal({ mode:"add-category" })}>+ 카테고리 추가</button>
      </div>

      {list.map(cat => (
        <div className="card" key={cat.id} style={{ marginBottom:12 }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className="card-title">{cat.category}</span>
              <span className="badge badge-blue">{cat.specs.length}개 규격</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setModal({ mode:"add-spec", catId: cat.id, data:{ spec:"", listPrice:"", details:[] } })}>
                + 규격 추가
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => removeCategory(cat.id)}>카테고리 삭제</button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}>
                {expanded === cat.id ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {expanded === cat.id && (
            <div className="card-body" style={{ padding:"12px 18px" }}>
              {cat.specs.length === 0 ? (
                <p style={{ color:"var(--text-muted)", fontSize:13 }}>등록된 규격이 없습니다.</p>
              ) : (
                <table style={{ width:"100%" }}>
                  <thead>
                    <tr>
                      <th>규격</th>
                      <th>소비자가 (정가)</th>
                      <th>상세 사양</th>
                      <th style={{width:90}}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.specs.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight:700 }}>{s.spec}</td>
                        <td style={{ textAlign:"right" }}>₩{fmtNumber(s.listPrice)}</td>
                        <td>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                            {(s.details || []).map((d, i) => (
                              <span key={i} className="detail-tag">{d}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ mode:"edit-spec", catId: cat.id, specId: s.id, data: s })}>수정</button>
                          {" "}
                          <button className="btn btn-ghost btn-sm" onClick={() => removeSpec(cat.id, s.id)}>삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}

      {/* 카테고리 추가 모달 */}
      {modal?.mode === "add-category" && (
        <ModalWrap title="카테고리 추가" onClose={() => setModal(null)}>
          <CategoryForm onSave={addCategory} onClose={() => setModal(null)} />
        </ModalWrap>
      )}

      {/* 규격 추가/수정 모달 */}
      {(modal?.mode === "add-spec" || modal?.mode === "edit-spec") && (
        <ModalWrap title={modal.mode === "add-spec" ? "규격 추가" : "규격 수정"} onClose={() => setModal(null)}>
          <SpecForm
            initial={modal.data}
            onSave={d => saveSpec(modal.catId, d)}
            onClose={() => setModal(null)}
          />
        </ModalWrap>
      )}
    </div>
  );
}

function ModalWrap({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

function CategoryForm({ onSave, onClose }) {
  const [name, setName] = useState("");
  return (
    <>
      <div className="form-group">
        <label>카테고리명</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="예: Programmable DC Power Supply" />
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(name)}>추가</button>
      </div>
    </>
  );
}

function SpecForm({ initial, onSave, onClose }) {
  const [spec, setSpec] = useState(initial.spec || "");
  const [listPrice, setListPrice] = useState(initial.listPrice || "");
  const [detailsText, setDetailsText] = useState((initial.details || []).join("\n"));

  function handleSave() {
    const details = detailsText.split("\n").map(s => s.trim()).filter(Boolean);
    onSave({ spec, listPrice: Number(String(listPrice).replace(/,/g,"")), details });
  }

  return (
    <>
      <div className="form-grid" style={{ gap:12 }}>
        <div className="form-group">
          <label>규격명</label>
          <input value={spec} onChange={e => setSpec(e.target.value)} placeholder="예: EX80-22.5" />
        </div>
        <div className="form-group">
          <label>소비자가 (정가, 원)</label>
          <input
            value={listPrice !== "" ? Number(String(listPrice).replace(/,/g,"")).toLocaleString("ko-KR") : ""}
            onChange={e => setListPrice(e.target.value.replace(/,/g,""))}
            placeholder="100,000,000"
          />
        </div>
        <div className="form-group" style={{ gridColumn:"1 / -1" }}>
          <label>상세 사양 (한 줄에 하나씩 입력)</label>
          <textarea
            rows={5}
            value={detailsText}
            onChange={e => setDetailsText(e.target.value)}
            placeholder={"DC Output : 0~80V / 0~22.5A 1Channel\nDisplay Resolution : 4 Digit\nAC Input : 220V / 60Hz"}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={handleSave}>저장</button>
      </div>
    </>
  );
}
