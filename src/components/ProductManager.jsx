import { useState, useRef } from "react";
import { INITIAL_PRODUCTS } from "../data/masterData";
import { fmtNumber } from "../utils/helpers";
import * as XLSX from "xlsx";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function ProductManager({ showToast }) {
  const [list, setList] = useState(() => loadLS("oda_products", INITIAL_PRODUCTS));
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const fileRef = useRef();

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

  // ── Excel 양식 다운로드 ──
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["※ 이 파일을 작성 후 업로드하면 품목이 자동 등록됩니다."],
      [""],
      ["카테고리명", "규격명", "소비자가(원)", "상세사양1", "상세사양2", "상세사양3", "상세사양4", "상세사양5"],
      ["Programmable DC Power Supply", "EX80-22.5", 100000000, "DC Output : 0~80V / 0~22.5A 1Channel", "Display Resolution : 4 Digit", "AC Input : 220V / 60Hz", "RS-232C, RS-485 통신 기본장착", ""],
      ["Programmable DC Power Supply", "EX150-15", 120000000, "DC Output : 0~150V / 0~15A 1Channel", "Display Resolution : 4 Digit", "AC Input : 220V / 60Hz", "", ""],
      ["Programmable DC Electronic Load", "LF2100-A", 999000, "DC Input : 1~150V / 0~300A 1Channel", "Display Resolution : 5 Digit", "AC Input : 220V / 60Hz", "", ""],
      ["OPTION (EX)", "Analog Module(0~10V)", 150000, "Analog IN/OUT 0~10V", "전압/전류 제어 및 모니터링", "Analog ON/OFF", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      {wch:32},{wch:24},{wch:16},{wch:36},{wch:36},{wch:36},{wch:36},{wch:36}
    ];
    // 헤더 행(3행) 스타일
    ws["!merges"] = [{ s:{r:0,c:0}, e:{r:0,c:7} }];
    XLSX.utils.book_append_sheet(wb, ws, "품목목록");
    XLSX.writeFile(wb, "ODA_품목목록_양식.xlsx");
    showToast("양식 파일이 다운로드되었습니다.", "success");
  }

  // ── Excel 업로드 파싱 ──
  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // 헤더 행 찾기 (카테고리명이 있는 행)
        const headerIdx = rows.findIndex(r => String(r[0]).includes("카테고리"));
        if (headerIdx < 0) { showToast("양식 형식이 올바르지 않습니다.", "error"); return; }

        const dataRows = rows.slice(headerIdx + 1).filter(r => r[0] && r[1]);

        // 카테고리 → 규격 그룹화
        const catMap = {};
        dataRows.forEach(r => {
          const catName = String(r[0]).trim();
          const spec    = String(r[1]).trim();
          const price   = Number(String(r[2]).replace(/,/g,"")) || 0;
          const details = [r[3],r[4],r[5],r[6],r[7]]
            .map(d => String(d).trim()).filter(Boolean);

          if (!catMap[catName]) catMap[catName] = [];
          catMap[catName].push({ id:`spec-${Date.now()}-${Math.random()}`, spec, listPrice: price, details });
        });

        // 기존 목록에 merge (같은 카테고리명이면 규격 추가, 없으면 새 카테고리)
        let next = [...list];
        Object.entries(catMap).forEach(([catName, specs]) => {
          const existing = next.find(c => c.category === catName);
          if (existing) {
            // 중복 규격 제외하고 추가
            const newSpecs = specs.filter(s => !existing.specs.find(es => es.spec === s.spec));
            existing.specs = [...existing.specs, ...newSpecs];
          } else {
            next.push({ id: Date.now() + Math.random(), category: catName, specs });
          }
        });

        saveList(next);
        showToast(`✅ ${dataRows.length}개 항목이 등록되었습니다.`, "success");
      } catch(err) {
        showToast("파일 읽기 오류: " + err.message, "error");
      }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>품목 관리</h2>
        <div style={{ display:"flex", gap:8 }}>
          {/* 양식 다운로드 */}
          <button className="btn btn-secondary" onClick={downloadTemplate}>
            📥 Excel 양식 다운로드
          </button>
          {/* Excel 업로드 */}
          <button className="btn btn-success" onClick={() => fileRef.current.click()}>
            📤 Excel 업로드
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleUpload}/>
          <button className="btn btn-primary" onClick={() => setModal({ mode:"add-category" })}>
            + 카테고리 추가
          </button>
        </div>
      </div>

      {/* 업로드 안내 */}
      <div style={{
        background:"#EEF3FF", border:"1px solid #C7D7FD", borderRadius:8,
        padding:"10px 16px", marginBottom:16, fontSize:12.5, color:"#2952A3",
        display:"flex", alignItems:"center", gap:8
      }}>
        <span>💡</span>
        <span><strong>Excel 일괄 등록:</strong> 양식 다운로드 → 품목 입력 → 업로드 하면 자동 등록됩니다. 기존 카테고리는 규격이 추가되고, 새 카테고리는 자동 생성됩니다.</span>
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
                onClick={() => setModal({ mode:"add-spec", catId: cat.id, data:{spec:"",listPrice:"",details:[]} })}>
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
                    <tr><th>규격</th><th>소비자가 (정가)</th><th>상세 사양</th><th style={{width:90}}>관리</th></tr>
                  </thead>
                  <tbody>
                    {cat.specs.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight:700 }}>{s.spec}</td>
                        <td style={{ textAlign:"right" }}>₩{fmtNumber(s.listPrice)}</td>
                        <td>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                            {(s.details||[]).map((d,i) => <span key={i} className="detail-tag">{d}</span>)}
                          </div>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ mode:"edit-spec", catId:cat.id, specId:s.id, data:s })}>수정</button>
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

      {list.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>
          등록된 품목이 없습니다.<br/>
          <span style={{fontSize:12}}>Excel 양식을 다운로드해서 작성 후 업로드하거나, 직접 추가하세요.</span>
        </div>
      )}

      {modal?.mode === "add-category" && (
        <ModalWrap title="카테고리 추가" onClose={() => setModal(null)}>
          <CategoryForm onSave={addCategory} onClose={() => setModal(null)} />
        </ModalWrap>
      )}
      {(modal?.mode === "add-spec" || modal?.mode === "edit-spec") && (
        <ModalWrap title={modal.mode === "add-spec" ? "규격 추가" : "규격 수정"} onClose={() => setModal(null)}>
          <SpecForm initial={modal.data} onSave={d => saveSpec(modal.catId, d)} onClose={() => setModal(null)} />
        </ModalWrap>
      )}
    </div>
  );
}

function ModalWrap({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
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
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="예: Programmable DC Power Supply" />
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(name)}>추가</button>
      </div>
    </>
  );
}

function SpecForm({ initial, onSave, onClose }) {
  const [spec, setSpec] = useState(initial.spec||"");
  const [listPrice, setListPrice] = useState(initial.listPrice||"");
  const [detailsText, setDetailsText] = useState((initial.details||[]).join("\n"));
  function handleSave() {
    const details = detailsText.split("\n").map(s=>s.trim()).filter(Boolean);
    onSave({ spec, listPrice: Number(String(listPrice).replace(/,/g,"")), details });
  }
  return (
    <>
      <div className="form-grid" style={{gap:12}}>
        <div className="form-group">
          <label>규격명</label>
          <input value={spec} onChange={e=>setSpec(e.target.value)} placeholder="예: EX80-22.5" />
        </div>
        <div className="form-group">
          <label>소비자가 (정가, 원)</label>
          <input
            value={listPrice !== "" ? Number(String(listPrice).replace(/,/g,"")).toLocaleString("ko-KR") : ""}
            onChange={e=>setListPrice(e.target.value.replace(/,/g,""))}
            placeholder="100,000,000"
          />
        </div>
        <div className="form-group" style={{gridColumn:"1 / -1"}}>
          <label>상세 사양 (한 줄에 하나씩 입력)</label>
          <textarea rows={5} value={detailsText} onChange={e=>setDetailsText(e.target.value)}
            placeholder={"DC Output : 0~80V / 0~22.5A 1Channel\nDisplay Resolution : 4 Digit\nAC Input : 220V / 60Hz"} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={handleSave}>저장</button>
      </div>
    </>
  );
}
