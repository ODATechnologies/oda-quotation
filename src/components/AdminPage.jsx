import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const STATUS_LABEL = {
  pending:  { text:"승인 대기", bg:"#FEF9C3", color:"#854D0E" },
  approved: { text:"승인됨",   bg:"#F0FDF4", color:"#166534" },
  rejected: { text:"거절됨",   bg:"#FEF2F2", color:"#991B1B" },
};

export default function AdminPage({ showToast }) {
  const { displayName } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("pending"); // pending | approved | rejected | all

  async function fetchUsers() {
    setLoading(true);
    const q    = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleApprove(uid, name) {
    await updateDoc(doc(db, "users", uid), {
      status:     "approved",
      approvedAt: serverTimestamp(),
    });
    showToast(`✅ ${name} 승인 완료`, "success");
    fetchUsers();
  }

  async function handleReject(uid, name) {
    if (!confirm(`${name} 계정을 거절하시겠습니까?`)) return;
    await updateDoc(doc(db, "users", uid), { status: "rejected" });
    showToast(`${name} 거절 완료`);
    fetchUsers();
  }

  async function handleSetAdmin(uid, name) {
    if (!confirm(`${name}에게 관리자 권한을 부여하시겠습니까?`)) return;
    await updateDoc(doc(db, "users", uid), { role: "admin" });
    showToast(`${name} 관리자 권한 부여됨`, "success");
    fetchUsers();
  }

  async function handleRevokeAdmin(uid, name) {
    if (!confirm(`${name}의 관리자 권한을 해제하시겠습니까?`)) return;
    await updateDoc(doc(db, "users", uid), { role: "user" });
    showToast(`${name} 권한 해제됨`);
    fetchUsers();
  }

  const filtered = filter === "all" ? users : users.filter(u => u.status === filter);
  const pendingCount = users.filter(u => u.status === "pending").length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:"var(--primary)" }}>회원 관리</h2>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>관리자: {displayName}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>↺ 새로고침</button>
      </div>

      {/* 대기 중 알림 */}
      {pendingCount > 0 && (
        <div style={{
          background:"#FEF9C3", border:"1px solid #FDE047", borderRadius:8,
          padding:"10px 16px", marginBottom:16, fontSize:13, color:"#854D0E",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span>⏳</span>
          <span>승인 대기 중인 가입 신청이 <strong>{pendingCount}건</strong> 있습니다.</span>
        </div>
      )}

      {/* 필터 탭 */}
      <div className="tab-bar" style={{ marginBottom:16 }}>
        {[["pending","대기"],["approved","승인됨"],["rejected","거절됨"],["all","전체"]].map(([v,label])=>(
          <button key={v} className={`tab-btn${filter===v?" active":""}`} onClick={()=>setFilter(v)}>
            {label}
            {v==="pending" && pendingCount>0 && (
              <span style={{
                background:"#F84F04", color:"#fff", borderRadius:20,
                fontSize:10, fontWeight:700, padding:"1px 6px", marginLeft:6,
              }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>권한</th>
                <th>상태</th>
                <th>가입 신청일</th>
                <th style={{width:200}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--text-muted)"}}>불러오는 중...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--text-muted)"}}>해당하는 계정이 없습니다.</td></tr>
              )}
              {!loading && filtered.map(u => {
                const st = STATUS_LABEL[u.status] || STATUS_LABEL.pending;
                return (
                  <tr key={u.id}>
                    <td style={{fontWeight:700}}>{u.name}</td>
                    <td style={{color:"var(--text-sub)"}}>{u.email}</td>
                    <td>
                      <span style={{
                        background: u.role==="admin" ? "#EEF3FF" : "#F1F4F9",
                        color:      u.role==="admin" ? "#2563EB" : "#4B5563",
                        fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20,
                      }}>
                        {u.role==="admin" ? "👑 관리자" : "일반 사용자"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background:st.bg, color:st.color,
                        fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20,
                      }}>{st.text}</span>
                    </td>
                    <td style={{color:"var(--text-muted)",fontSize:12}}>
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {u.status==="pending" && <>
                          <button className="btn btn-success btn-sm" onClick={()=>handleApprove(u.id,u.name)}>승인</button>
                          <button className="btn btn-danger btn-sm"  onClick={()=>handleReject(u.id,u.name)}>거절</button>
                        </>}
                        {u.status==="approved" && u.role!=="admin" &&
                          <button className="btn btn-secondary btn-sm" onClick={()=>handleSetAdmin(u.id,u.name)}>관리자 지정</button>
                        }
                        {u.status==="approved" && u.role==="admin" &&
                          <button className="btn btn-ghost btn-sm" onClick={()=>handleRevokeAdmin(u.id,u.name)}>권한 해제</button>
                        }
                        {u.status==="rejected" &&
                          <button className="btn btn-secondary btn-sm" onClick={()=>handleApprove(u.id,u.name)}>재승인</button>
                        }
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
