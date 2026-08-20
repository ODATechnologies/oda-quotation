import { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function CustomerManager({ showToast }) {
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [search,   setSearch]   = useState("");

  // Firestore 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "customers"), snap => {
      const docs = snap.docs.map(d => ({ _id:d.id, ...d.data() }));
      docs.sort((a,b) => (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setList(docs);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);

  async function saveCompany(data) {
    try {
      if (modal.mode === "add-company") {
        const id = `cust_${Date.now()}`;
        await setDoc(doc(db, "customers", id), {
          company: data.company,
          address: data.address || "",
          contacts: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, "customers", modal.data._id), {
          ...modal.data,
          company: data.company,
          address: data.address || "",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      showToast("저장되었습니다.", "success");
      setModal(null);
    } catch(e) { showToast("저장 오류: " + e.message, "error"); }
  }

  async function removeCompany(item) {
    if (!confirm(`[${item.company}] 업체를 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, "customers", item._id));
      showToast("삭제되었습니다.");
    } catch(e) { showToast("삭제 오류: " + e.message, "error"); }
  }

  async function saveContact(companyItem, contactData) {
    const contacts = [...(companyItem.contacts || [])];
    if (modal.mode === "add-contact") {
      contacts.push(contactData);
    } else {
      contacts[modal.contactIdx] = contactData;
    }
    try {
      await setDoc(doc(db, "customers", companyItem._id), { ...companyItem, contacts, updatedAt: serverTimestamp() }, { merge: true });
      showToast("저장되었습니다.", "success");
      setModal(null);
    } catch(e) { showToast("저장 오류: " + e.message, "error"); }
  }

  async function removeContact(companyItem, idx) {
    if (!confirm("담당자를 삭제하시겠습니까?")) return;
    const contacts = (companyItem.contacts || []).filter((_,i) => i !== idx);
    try {
      await setDoc(doc(db, "customers", companyItem._id), { ...companyItem, contacts, updatedAt: serverTimestamp() }, { merge: true });
      showToast("삭제되었습니다.");
    } catch(e) { showToast("삭제 오류: " + e.message, "error"); }
  }

  const filteredList = search.trim()
    ? list.filter(c =>
        c.company?.toLowerCase().includes(search.toLowerCase()) ||
        (c.contacts||[]).some(ct =>
          ct.name?.toLowerCase().includes(search.toLowerCase()) ||
          ct.phone?.toLowerCase().includes(search.toLowerCase()) ||
          ct.email?.toLowerCase().includes(search.toLowerCase())
        )
      )
    : list;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>거래처 관리</h2>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>🌐 전체 공유 — 모든 사용자가 동일한 목록 사용</div>
        </div>
        <button className="btn btn-primary"
          onClick={() => setModal({ mode:"add-company", data:{ company:"", address:"" } })}>+ 업체 추가</button>
      </div>

      {/* 검색 */}
      <div style={{ marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 업체명, 담당자명, 전화, 이메일 검색..."
          style={{ width:"100%", maxWidth:420, padding:"8px 12px", border:"1px solid var(--border)", borderRadius:6, fontSize:13 }}
        />
        {search && <span style={{ fontSize:12, color:"var(--text-muted)", marginLeft:10 }}>{filteredList.length}개 업체</span>}
      </div>

      {loading && <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>불러오는 중...</div>}

      {!loading && filteredList.map(c => (
        <div className="card" key={c._id} style={{ marginBottom:12 }}>
          <div className="card-header">
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span className="card-title">{c.company}</span>
              <span className="badge badge-blue">{(c.contacts||[]).length}명</span>
              {c.address && <span style={{ fontSize:11, color:"var(--text-muted)" }}>📍 {c.address}</span>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setModal({ mode:"add-contact", companyItem:c, data:{ name:"", phone:"", email:"" } })}>
                + 담당자
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setModal({ mode:"edit-company", data:c })}>수정</button>
              <button className="btn btn-ghost btn-sm" onClick={() => removeCompany(c)}>삭제</button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setExpanded(expanded===c._id ? null : c._id)}>
                {expanded===c._id ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {expanded === c._id && (
            <div className="card-body" style={{ padding:"12px 18px" }}>
              {(c.contacts||[]).length === 0 ? (
                <p style={{ color:"var(--text-muted)", fontSize:13 }}>등록된 담당자가 없습니다.</p>
              ) : (
                <table style={{ width:"100%" }}>
                  <thead><tr><th>담당자</th><th>전화</th><th>이메일</th><th style={{width:90}}>관리</th></tr></thead>
                  <tbody>
                    {(c.contacts||[]).map((ct, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{ct.name}</td>
                        <td>{ct.phone}</td>
                        <td>{ct.email}</td>
                        <td style={{ textAlign:"center" }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ mode:"edit-contact", companyItem:c, contactIdx:i, data:ct })}>수정</button>
                          {" "}
                          <button className="btn btn-ghost btn-sm" onClick={() => removeContact(c, i)}>삭제</button>
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

      {!loading && filteredList.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--text-muted)", padding:48 }}>
          {search ? "검색 결과가 없습니다." : "등록된 업체가 없습니다."}
        </div>
      )}

      {/* 모달 */}
      {modal && (modal.mode==="add-company"||modal.mode==="edit-company") && (
        <ModalWrap title={modal.mode==="add-company"?"업체 추가":"업체 수정"} onClose={()=>setModal(null)}>
          <CompanyForm initial={modal.data} onSave={saveCompany} onClose={()=>setModal(null)}/>
        </ModalWrap>
      )}
      {modal && (modal.mode==="add-contact"||modal.mode==="edit-contact") && (
        <ModalWrap title={modal.mode==="add-contact"?"담당자 추가":"담당자 수정"} onClose={()=>setModal(null)}>
          <ContactForm initial={modal.data}
            onSave={d => saveContact(modal.companyItem, d)}
            onClose={()=>setModal(null)}/>
        </ModalWrap>
      )}
    </div>
  );
}

function ModalWrap({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal"><div className="modal-title">{title}</div>{children}</div>
    </div>
  );
}

function CompanyForm({ initial, onSave, onClose }) {
  const [company, setCompany] = useState(initial.company||"");
  const [address, setAddress] = useState(initial.address||"");
  return (<>
    <div className="form-group">
      <label>업체명</label>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="예: 삼성전자" autoFocus/>
    </div>
    <div className="form-group">
      <label>주소 <span style={{color:"var(--text-muted)",fontSize:11,fontWeight:400}}>(선택, 해외 견적서에 자동 반영)</span></label>
      <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="예: P.O. Box 43221, Channel Street, Abu Dhabi, UAE"/>
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>취소</button>
      <button className="btn btn-primary" onClick={()=>onSave({company,address})}>저장</button>
    </div>
  </>);
}

function ContactForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({name:"",phone:"",email:"",...initial});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  return (<>
    <div className="form-grid" style={{gap:12}}>
      {[["name","담당자 성명/직책","이재용 프로"],["phone","전화","010-0000-0000"],["email","이메일","email@co.com"]].map(([k,l,ph])=>(
        <div className="form-group" key={k}>
          <label>{l}</label>
          <input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/>
        </div>
      ))}
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>취소</button>
      <button className="btn btn-primary" onClick={()=>onSave(form)}>저장</button>
    </div>
  </>);
}
