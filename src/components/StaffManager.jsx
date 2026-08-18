import { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function StaffManager({ showToast }) {
  const [list,   setList]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [modal,  setModal]  = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "domestic" | "overseas"

  // Firestore 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), snap => {
      const docs = snap.docs.map(d => ({ _id:d.id, ...d.data() }));
      docs.sort((a,b) => (a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setList(docs);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);

  async function save(item) {
    try {
      const id  = item._id || `staff_${Date.now()}`;
      const { _id, ...rest } = item;
      await setDoc(doc(db,"staff",id), {
        ...rest,
        ...(!item._id ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      }, { merge:true });
      showToast(modal.mode==="add" ? "담당자가 추가되었습니다." : "수정되었습니다.", "success");
      setModal(null);
    } catch(e) { showToast("저장 오류: " + e.message, "error"); }
  }

  async function remove(id) {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db,"staff",id));
      showToast("삭제되었습니다.");
    } catch(e) { showToast("삭제 오류: " + e.message, "error"); }
  }

  const filtered = filter === "all" ? list : list.filter(s => s.type === filter);

  const TYPE_LABEL = { domestic:"국내", overseas:"해외" };
  const TYPE_COLOR = {
    domestic:{ bg:"#EEF3FF", color:"#2563EB" },
    overseas:{ bg:"#FEF9C3", color:"#854D0E" },
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>담당자 관리</h2>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>🌐 전체 공유 — 모든 사용자가 동일한 목록 사용</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode:"add", data:{ name:"", dept:"", phone:"", type:"domestic" } })}>
          + 담당자 추가
        </button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display:"flex", gap:0, marginBottom:16, border:"1px solid var(--border)", borderRadius:8, overflow:"hidden", width:"fit-content" }}>
        {[["all","전체"],["domestic","국내"],["overseas","해외"]].map(([v,label]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding:"7px 18px", border:"none", cursor:"pointer",
            fontFamily:"inherit", fontSize:13, fontWeight:600,
            background: filter===v ? "var(--primary)" : "#fff",
            color: filter===v ? "#fff" : "var(--text-sub)",
          }}>{label}</button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>이름 / 직책</th>
                <th>부서</th>
                <th>전화번호</th>
                <th>구분</th>
                <th style={{width:100}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ textAlign:"center", padding:24, color:"var(--text-muted)" }}>불러오는 중...</td></tr>}
              {!loading && filtered.map(s => {
                const tc = TYPE_COLOR[s.type] || TYPE_COLOR.domestic;
                return (
                  <tr key={s._id}>
                    <td style={{ fontWeight:600 }}>{s.name}</td>
                    <td>{s.dept}</td>
                    <td>{s.phone}</td>
                    <td>
                      <span style={{ background:tc.bg, color:tc.color, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>
                        {TYPE_LABEL[s.type] || "국내"}
                      </span>
                    </td>
                    <td style={{ textAlign:"center" }}>
                      <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode:"edit", data:s })}>수정</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => remove(s._id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:"center", color:"var(--text-muted)", padding:24 }}>등록된 담당자가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-title">{modal.mode==="add" ? "담당자 추가" : "담당자 수정"}</div>
            <StaffForm initial={modal.data} onSave={save} onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function StaffForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ type:"domestic", ...initial });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  return (
    <>
      <div className="form-grid" style={{ gap:12 }}>
        {[
          ["name","이름 / 직책","마케팅전략기획부 / 홍길동 수석"],
          ["dept","부서","마케팅전략기획부"],
          ["phone","전화번호","010-0000-0000"],
        ].map(([k,l,ph]) => (
          <div className="form-group" key={k}>
            <label>{l}</label>
            <input value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph} />
          </div>
        ))}
        <div className="form-group">
          <label>구분</label>
          <select value={form.type||"domestic"} onChange={e=>set("type",e.target.value)}>
            <option value="domestic">국내</option>
            <option value="overseas">해외</option>
          </select>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>저장</button>
      </div>
    </>
  );
}
