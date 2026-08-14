import { useState } from "react";
import { INITIAL_CUSTOMERS } from "../data/masterData";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function CustomerManager({ showToast }) {
  const [list, setList] = useState(() => loadLS("oda_customers", INITIAL_CUSTOMERS));
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null);

  function saveList(next) {
    setList(next);
    localStorage.setItem("oda_customers", JSON.stringify(next));
  }

  // ── 업체 추가/수정 ──
  function saveCompany(data) {
    let next;
    if (modal.mode === "add-company") {
      next = [...list, { id: Date.now(), company: data.company, contacts: [] }];
    } else {
      next = list.map(c => c.id === modal.data.id ? { ...c, company: data.company } : c);
    }
    saveList(next);
    showToast("저장되었습니다.", "success");
    setModal(null);
  }

  function removeCompany(id) {
    if (!confirm("업체를 삭제하시겠습니까? (담당자 포함 삭제됩니다)")) return;
    saveList(list.filter(c => c.id !== id));
    showToast("삭제되었습니다.");
  }

  // ── 담당자 추가/수정 ──
  function saveContact(companyId, data) {
    const next = list.map(c => {
      if (c.id !== companyId) return c;
      let contacts;
      if (modal.mode === "add-contact") {
        contacts = [...c.contacts, data];
      } else {
        contacts = c.contacts.map((ct, i) => i === modal.contactIdx ? data : ct);
      }
      return { ...c, contacts };
    });
    saveList(next);
    showToast("저장되었습니다.", "success");
    setModal(null);
  }

  function removeContact(companyId, idx) {
    if (!confirm("담당자를 삭제하시겠습니까?")) return;
    const next = list.map(c => c.id !== companyId ? c
      : { ...c, contacts: c.contacts.filter((_, i) => i !== idx) });
    saveList(next);
    showToast("삭제되었습니다.");
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>거래처 관리</h2>
        <button className="btn btn-primary" onClick={() => setModal({ mode:"add-company", data:{ company:"" } })}>+ 업체 추가</button>
      </div>

      {list.map(c => (
        <div className="card" key={c.id} style={{ marginBottom:12 }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span className="card-title">{c.company}</span>
              <span className="badge badge-blue">{c.contacts.length}명</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setModal({ mode:"add-contact", companyId: c.id, data:{ name:"", phone:"", email:"" } })}>
                + 담당자
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setModal({ mode:"edit-company", data: c })}>수정</button>
              <button className="btn btn-ghost btn-sm" onClick={() => removeCompany(c.id)}>삭제</button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                {expanded === c.id ? "▲" : "▼"}
              </button>
            </div>
          </div>
          {expanded === c.id && (
            <div className="card-body" style={{ padding:"12px 18px" }}>
              {c.contacts.length === 0 ? (
                <p style={{ color:"var(--text-muted)", fontSize:13 }}>등록된 담당자가 없습니다.</p>
              ) : (
                <table style={{ width:"100%" }}>
                  <thead>
                    <tr>
                      <th>담당자</th><th>전화</th><th>이메일</th><th style={{width:90}}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.contacts.map((ct, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{ct.name}</td>
                        <td>{ct.phone}</td>
                        <td>{ct.email}</td>
                        <td style={{ textAlign:"center" }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ mode:"edit-contact", companyId: c.id, contactIdx: i, data: ct })}>수정</button>
                          {" "}
                          <button className="btn btn-ghost btn-sm" onClick={() => removeContact(c.id, i)}>삭제</button>
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
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>등록된 업체가 없습니다.</div>
      )}

      {/* 모달 */}
      {modal && (modal.mode === "add-company" || modal.mode === "edit-company") && (
        <ModalWrap title={modal.mode === "add-company" ? "업체 추가" : "업체 수정"} onClose={() => setModal(null)}>
          <CompanyForm initial={modal.data} onSave={saveCompany} onClose={() => setModal(null)} />
        </ModalWrap>
      )}
      {modal && (modal.mode === "add-contact" || modal.mode === "edit-contact") && (
        <ModalWrap title={modal.mode === "add-contact" ? "담당자 추가" : "담당자 수정"} onClose={() => setModal(null)}>
          <ContactForm
            initial={modal.data}
            onSave={d => saveContact(modal.companyId, d)}
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

function CompanyForm({ initial, onSave, onClose }) {
  const [company, setCompany] = useState(initial.company || "");
  return (
    <>
      <div className="form-group">
        <label>업체명</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="예: 삼성전자" />
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave({ company })}>저장</button>
      </div>
    </>
  );
}

function ContactForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ name:"", phone:"", email:"", ...initial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="form-grid" style={{ gap:12 }}>
        {[["name","담당자 성명/직책","이재용 프로"],["phone","전화","010-0000-0000"],["email","이메일","email@co.com"]].map(([k,l,ph]) => (
          <div className="form-group" key={k}>
            <label>{l}</label>
            <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} />
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>저장</button>
      </div>
    </>
  );
}
