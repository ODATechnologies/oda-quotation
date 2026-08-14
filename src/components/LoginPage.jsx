import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode,     setMode]     = useState("login"); // "login" | "register"
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [pwConfirm,setPwConfirm]= useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err.message === "PENDING") {
        setError("가입 승인 대기 중입니다. 관리자 승인 후 로그인 가능합니다.");
      } else if (err.message === "REJECTED") {
        setError("가입이 거절된 계정입니다. 관리자에게 문의하세요.");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim())            return setError("이름을 입력해주세요.");
    if (password.length < 6)     return setError("비밀번호는 6자 이상이어야 합니다.");
    if (password !== pwConfirm)  return setError("비밀번호가 일치하지 않습니다.");
    setLoading(true);
    try {
      await register(name.trim(), email, password);
      // 가입 후 바로 로그아웃 (승인 전이므로)
      const { auth } = await import("../firebase");
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      setSuccess("가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.");
      setMode("login");
      setName(""); setEmail(""); setPassword(""); setPwConfirm("");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else {
        setError("가입 신청 중 오류가 발생했습니다: " + err.message);
      }
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#F1F4F9",
    }}>
      <div style={{
        background:"#fff", borderRadius:12, boxShadow:"0 4px 24px rgba(0,0,0,.10)",
        padding:"40px 36px", width:"100%", maxWidth:420,
      }}>
        {/* 헤더 */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{
            fontSize:22, fontWeight:800, color:"#1E3C78", letterSpacing:"-.3px", marginBottom:6,
          }}>
            ODA <span style={{ color:"#F84F04" }}>—</span> QUOTATION
          </div>
          <div style={{ fontSize:12, color:"#94A3B8" }}>㈜오디에이테크놀로지 견적서 시스템</div>
        </div>

        {/* 탭 */}
        <div style={{
          display:"flex", background:"#F1F4F9", borderRadius:8,
          padding:3, marginBottom:24, gap:3,
        }}>
          {[["login","로그인"],["register","가입 신청"]].map(([m,label])=>(
            <button key={m}
              onClick={()=>{ setMode(m); setError(""); setSuccess(""); }}
              style={{
                flex:1, padding:"8px 0", border:"none", borderRadius:6,
                fontFamily:"inherit", fontSize:13.5, fontWeight:600, cursor:"pointer",
                background: mode===m ? "#fff" : "transparent",
                color:      mode===m ? "#1E3C78" : "#94A3B8",
                boxShadow:  mode===m ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                transition:"all .15s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* 알림 */}
        {error   && <div style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", borderRadius:6, padding:"10px 14px", fontSize:13, marginBottom:16 }}>{error}</div>}
        {success && <div style={{ background:"#F0FDF4", color:"#059669", border:"1px solid #BBF7D0", borderRadius:6, padding:"10px 14px", fontSize:13, marginBottom:16 }}>{success}</div>}

        {/* 로그인 폼 */}
        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>이메일</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="이메일 주소" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>비밀번호</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="비밀번호" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{
                padding:"11px 0", background:"#1E3C78", color:"#fff",
                border:"none", borderRadius:6, fontSize:14, fontWeight:700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1,
                fontFamily:"inherit", marginTop:4,
              }}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        )}

        {/* 가입 신청 폼 */}
        {mode === "register" && (
          <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>이름 <span style={{color:"#DC2626"}}>*</span></label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                placeholder="본인 이름" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>이메일 <span style={{color:"#DC2626"}}>*</span></label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="이메일 주소" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>비밀번호 <span style={{color:"#DC2626"}}>*</span></label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="6자 이상" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#4B5563", display:"block", marginBottom:5 }}>비밀번호 확인 <span style={{color:"#DC2626"}}>*</span></label>
              <input type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)}
                placeholder="비밀번호 재입력" required
                style={{ width:"100%", padding:"10px 12px", border:"1px solid #DDE3EC", borderRadius:6, fontSize:14, fontFamily:"inherit" }}
              />
            </div>
            <div style={{ background:"#EEF3FF", borderRadius:6, padding:"10px 12px", fontSize:12, color:"#2952A3" }}>
              💡 가입 신청 후 관리자 승인이 완료되어야 로그인 가능합니다.
            </div>
            <button type="submit" disabled={loading}
              style={{
                padding:"11px 0", background:"#F84F04", color:"#fff",
                border:"none", borderRadius:6, fontSize:14, fontWeight:700,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1,
                fontFamily:"inherit", marginTop:4,
              }}>
              {loading ? "신청 중..." : "가입 신청"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
