import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { fmtNumber } from "../utils/helpers";
import { useSharedProducts } from "../hooks/useSharedData";

export default function ProductManager({ showToast }) {
  const {
    sharedItems, myItems, loading, isAdmin,
    saveShared, saveMy, removeShared, removeMy,
  } = useSharedProducts();

  const [tab,      setTab]      = useState("shared"); // "shared" | "my"
  const [modal,    setModal]    = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [search,   setSearch]   = useState("");
  const fileRef = useRef();

  const list = tab === "shared" ? sharedItems : myItems;

  // 검색 필터
  const filtered = search.trim()
    ? list.filter(p =>
        p.category?.toLowerCase().includes(search.toLowerCase()) ||
        (p.specs||[]).some(s =>
          s.spec?.toLowerCase().includes(search.toLowerCase()) ||
          (s.details||[]).some(d => d.toLowerCase().includes(search.toLowerCase()))
        )
      )
    : list;

  async function saveCategory(name) {
    try {
      const fn = tab === "shared" ? saveShared : saveMy;
      await fn({ category: name, specs: [] });
      showToast("카테고리가 추가되었습니다.", "success");
      setModal(null);
    } catch(e) { showToast("오류: " + e.message, "error"); }
  }

  async function removeCategory(item) {
    if (!confirm("카테고리를 삭제하시겠습니까?")) return;
    try {
      const fn = tab === "shared" ? removeShared : removeMy;
      await fn(item._id);
      showToast("삭제되었습니다.");
    } catch(e) { showToast("오류: " + e.message, "error"); }
  }

  async function saveSpec(catItem, specData) {
    const specs = [...(catItem.specs || [])];
    if (modal.mode === "add-spec") {
      specs.push({ id:`spec_${Date.now()}`, ...specData });
    } else {
      const idx = specs.findIndex(s => s.id === modal.specId);
      if (idx >= 0) specs[idx] = { ...specs[idx], ...specData };
    }
    try {
      const fn = tab === "shared" ? saveShared : saveMy;
      await fn({ ...catItem, specs });
      showToast("저장되었습니다.", "success");
      setModal(null);
    } catch(e) { showToast("오류: " + e.message, "error"); }
  }

  async function removeSpec(catItem, specId) {
    if (!confirm("규격을 삭제하시겠습니까?")) return;
    const specs = (catItem.specs || []).filter(s => s.id !== specId);
    try {
      const fn = tab === "shared" ? saveShared : saveMy;
      await fn({ ...catItem, specs });
      showToast("삭제되었습니다.");
    } catch(e) { showToast("오류: " + e.message, "error"); }
  }

  // Excel 양식 다운로드
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["카테고리명", "규격명", "소비자가(원)", "상세사양1", "상세사양2", "상세사양3", "상세사양4", "상세사양5"],
      ["Programmable DC Power Supply", "EX80-22.5", 100000000, "DC Output : 0~80V / 0~22.5A 1Channel", "Display Resolution : 4 Digit", "AC Input : 220V / 60Hz", "RS-232C, RS-485 통신 기본장착", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{wch:32},{wch:24},{wch:16},{wch:36},{wch:36},{wch:36},{wch:36},{wch:36}];
    XLSX.utils.book_append_sheet(wb, ws, "품목목록");
    XLSX.writeFile(wb, "ODA_품목목록_양식.xlsx");
    showToast("양식 파일이 다운로드되었습니다.", "success");
  }

  // Excel 업로드
  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:"binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
        const headerIdx = rows.findIndex(r => String(r[0]).includes("카테고리"));
        if (headerIdx < 0) { showToast("양식 형식이 올바르지 않습니다.", "error"); return; }
        const dataRows = rows.slice(headerIdx + 1).filter(r => r[0] && r[1]);
        const catMap = {};
        dataRows.forEach(r => {
          const catName = String(r[0]).trim();
          const spec    = String(r[1]).trim();
          const price   = Number(String(r[2]).replace(/,/g,"")) || 0;
          const details = [r[3],r[4],r[5],r[6],r[7]].map(d=>String(d).trim()).filter(Boolean);
          if (!catMap[catName]) catMap[catName] = [];
          catMap[catName].push({ id:`spec_${Date.now()}_${Math.random().toString(36).slice(2)}`, spec, listPrice:price, details });
        });
        const fn = tab === "shared" ? saveShared : saveMy;
        const existing = tab === "shared" ? sharedItems : myItems;
        for (const [catName, specs] of Object.entries(catMap)) {
          const found = existing.find(c => c.category === catName);
          if (found) {
            const newSpecs = specs.filter(s => !found.specs?.find(es => es.spec === s.spec));
            await fn({ ...found, specs: [...(found.specs||[]), ...newSpecs] });
          } else {
            await fn({ category: catName, specs });
          }
        }
        showToast(`✅ ${dataRows.length}개 항목이 등록되었습니다.`, "success");
      } catch(err) { showToast("파일 읽기 오류: " + err.message, "error"); }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  }

  const canEdit = tab === "my" || isAdmin;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>품목 관리</h2>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary" onClick={downloadTemplate}>📥 양식 다운로드</button>
          <button className="btn btn-success"   onClick={() => fileRef.current.click()}>📤 Excel 업로드</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setModal({ mode:"add-category" })}>+ 카테고리 추가</button>
          )}
        </div>
      </div>

      {/* 탭: 공용 / 내 품목 */}
      <div style={{ display:"flex", gap:0, marginBottom:14, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden", width:"fit-content" }}>
        {[["shared","🌐 공용 품목"],["my","👤 내 품목"]].map(([v,label]) => (
          <button key={v} onClick={() => { setTab(v); setExpanded(null); }}
            style={{
              padding:"8px 20px", border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, fontWeight:600,
              background: tab===v ? "var(--primary)" : "#fff",
              color: tab===v ? "#fff" : "var(--text-sub)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "shared" && !isAdmin && (
        <div style={{ background:"#EEF3FF", border:"1px solid #C7D7FD", borderRadius:8, padding:"8px 14px", marginBottom:12, fontSize:12, color:"#2952A3" }}>
          💡 공용 품목은 관리자만 추가/수정할 수 있습니다. 개인 품목은 <strong>내 품목</strong> 탭에서 관리하세요.
        </div>
      )}

      {/* 검색 */}
      <div style={{ marginBottom:14 }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 카테고리, 규격명, 사양으로 검색..."
          style={{ width:"100%", maxWidth:420, padding:"8px 12px", border:"1px solid var(--border)", borderRadius:6, fontSize:13 }}
        />
      </div>

      {loading && <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>불러오는 중...</div>}

      {!loading && filtered.map(cat => (
        <div className="card" key={cat._id} style={{ marginBottom:12 }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className="card-title">{cat.category}</span>
              <span className="badge badge-blue">{(cat.specs||[]).length}개 규격</span>
              {cat._type === "my" && <span style={{ fontSize:11, background:"#FEF9C3", color:"#854D0E", padding:"1px 8px", borderRadius:20, fontWeight:600 }}>내 품목</span>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {canEdit && (
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setModal({ mode:"add-spec", catItem:cat, data:{spec:"",listPrice:"",details:[]} })}>
                  + 규격 추가
                </button>
              )}
              {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => removeCategory(cat)}>카테고리 삭제</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded===cat._id ? null : cat._id)}>
                {expanded===cat._id ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {expanded === cat._id && (
            <div className="card-body" style={{ padding:"12px 18px" }}>
              {(cat.specs||[]).length === 0 ? (
                <p style={{ color:"var(--text-muted)", fontSize:13 }}>등록된 규격이 없습니다.</p>
              ) : (
                <table style={{ width:"100%" }}>
                  <thead><tr><th>규격</th><th>소비자가</th><th>상세 사양</th><th style={{width:90}}>관리</th></tr></thead>
                  <tbody>
                    {(cat.specs||[]).filter(s =>
                      !search.trim() ||
                      s.spec?.toLowerCase().includes(search.toLowerCase()) ||
                      (s.details||[]).some(d => d.toLowerCase().includes(search.toLowerCase()))
                    ).map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight:700 }}>{s.spec}</td>
                        <td style={{ textAlign:"right" }}>₩{fmtNumber(s.listPrice)}</td>
                        <td><div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                          {(s.details||[]).map((d,i) => <span key={i} className="detail-tag">{d}</span>)}
                        </div></td>
                        <td style={{ textAlign:"center" }}>
                          {canEdit && <>
                            <button className="btn btn-secondary btn-sm"
                              onClick={() => setModal({ mode:"edit-spec", catItem:cat, specId:s.id, data:s })}>수정</button>
                            {" "}
                            <button className="btn btn-ghost btn-sm" onClick={() => removeSpec(cat, s.id)}>삭제</button>
                          </>}
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

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>
          {search ? "검색 결과가 없습니다." : "등록된 품목이 없습니다."}
        </div>
      )}

      {modal?.mode === "add-category" && (
        <ModalWrap title="카테고리 추가" onClose={() => setModal(null)}>
          <CategoryForm onSave={saveCategory} onClose={() => setModal(null)} />
        </ModalWrap>
      )}
      {(modal?.mode === "add-spec" || modal?.mode === "edit-spec") && (
        <ModalWrap title={modal.mode === "add-spec" ? "규격 추가" : "규격 수정"} onClose={() => setModal(null)}>
          <SpecForm initial={modal.data} onSave={d => saveSpec(modal.catItem, d)} onClose={() => setModal(null)} />
        </ModalWrap>
      )}
    </div>
  );
}

function ModalWrap({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal"><div className="modal-title">{title}</div>{children}</div>
    </div>
  );
}
function CategoryForm({ onSave, onClose }) {
  const [name, setName] = useState("");
  return (<>
    <div className="form-group"><label>카테고리명</label>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="예: Programmable DC Power Supply" autoFocus/>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>취소</button>
      <button className="btn btn-primary" onClick={() => onSave(name)}>추가</button>
    </div>
  </>);
}
function SpecForm({ initial, onSave, onClose }) {
  const [spec,       setSpec]       = useState(initial.spec || "");
  const [listPrice,  setListPrice]  = useState(initial.listPrice || "");
  const [detailsText,setDetailsText]= useState((initial.details||[]).join("\n"));
  function handleSave() {
    const details = detailsText.split("\n").map(s=>s.trim()).filter(Boolean);
    onSave({ spec, listPrice: Number(String(listPrice).replace(/,/g,"")), details });
  }
  return (<>
    <div className="form-grid" style={{gap:12}}>
      <div className="form-group"><label>규격명</label>
        <input value={spec} onChange={e=>setSpec(e.target.value)} placeholder="예: EX80-22.5" autoFocus/>
      </div>
      <div className="form-group"><label>소비자가 (원)</label>
        <input value={listPrice !== "" ? Number(String(listPrice).replace(/,/g,"")).toLocaleString("ko-KR") : ""}
          onChange={e=>setListPrice(e.target.value.replace(/,/g,""))} placeholder="100,000,000"/>
      </div>
      <div className="form-group" style={{gridColumn:"1 / -1"}}><label>상세 사양 (줄바꿈으로 구분)</label>
        <textarea rows={5} value={detailsText} onChange={e=>setDetailsText(e.target.value)}
          placeholder={"DC Output : 0~80V / 0~22.5A 1Channel\nDisplay Resolution : 4 Digit"}/>
      </div>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>취소</button>
      <button className="btn btn-primary" onClick={handleSave}>저장</button>
    </div>
  </>);
}
