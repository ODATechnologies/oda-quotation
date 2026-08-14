import { useState } from "react";
import { INITIAL_STAFF } from "../data/masterData";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function StaffManager({ showToast }) {
  const [list, setList] = useState(() => loadLS("oda_staff", INITIAL_STAFF));
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", data }

  const empty = { name: "", phone: "", dept: "" };

  function save(item) {
    let next;
    if (modal.mode === "add") {
      const newItem = { ...item, id: Date.now() };
      next = [...list, newItem];
    } else {
      next = list.map(s => s.id === modal.data.id ? { ...s, ...item } : s);
    }
    setList(next);
    localStorage.setItem("oda_staff", JSON.stringify(next));
    showToast(modal.mode === "add" ? "담당자가 추가되었습니다." : "수정되었습니다.", "success");
    setModal(null);
  }

  function remove(id) {
    if (!confirm("삭제하시겠습니까?")) return;
    const next = list.filter(s => s.id !== id);
    setList(next);
    localStorage.setItem("oda_staff", JSON.stringify(next));
    showToast("삭제되었습니다.");
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>담당자 관리</h2>
        <button className="btn btn-primary" onClick={() => setModal({ mode:"add", data: empty })}>+ 담당자 추가</button>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>이름 / 직책</th>
                <th>부서</th>
                <th>전화번호</th>
                <th style={{width:100}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:600 }}>{s.name}</td>
                  <td>{s.dept}</td>
                  <td>{s.phone}</td>
                  <td style={{ textAlign:"center", display:"flex", gap:4 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:"edit", data: s })}>수정</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(s.id)}>삭제</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:"center", color:"var(--text-muted)", padding:24 }}>등록된 담당자가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "담당자 추가" : "담당자 수정"}
          fields={[
            { key:"name",  label:"이름 / 직책", placeholder:"마케팅전략기획부 / 홍길동 수석" },
            { key:"dept",  label:"부서",          placeholder:"마케팅전략기획부" },
            { key:"phone", label:"전화번호",       placeholder:"010-0000-0000" },
          ]}
          initial={modal.data}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function FormModal({ title, fields, initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial });
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="form-grid" style={{ gap:12 }}>
          {fields.map(f => (
            <div className="form-group" key={f.key}>
              <label>{f.label}</label>
              <input
                value={form[f.key] || ""}
                onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>저장</button>
        </div>
      </div>
    </div>
  );
}
