import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage      from "./components/LoginPage";
import QuotationPage  from "./components/QuotationPage";
import StaffManager   from "./components/StaffManager";
import CustomerManager from "./components/CustomerManager";
import ProductManager  from "./components/ProductManager";
import AdminPage       from "./components/AdminPage";
import Toast from "./components/Toast";

const PAGES = [
  { id:"quote",    label:"견적서 작성", icon:"📄" },
  { id:"staff",    label:"담당자 관리", icon:"👤" },
  { id:"customer", label:"거래처 관리", icon:"🏢" },
  { id:"product",  label:"품목 관리",   icon:"📦" },
];

function AppInner() {
  const { currentUser, logout, displayName, isAdmin } = useAuth();
  const [page,   setPage]   = useState("quote");
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 2800);
  }, []);

  if (!currentUser) return <LoginPage />;

  const allPages = isAdmin
    ? [...PAGES, { id:"admin", label:"회원 관리", icon:"⚙️" }]
    : PAGES;

  return (
    <>
      <header style={{
        background:"#111111",
        color:"#fff",
        padding:"0 24px",
        height:56,
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        boxShadow:"0 2px 8px rgba(0,0,0,.4)",
        position:"sticky", top:0, zIndex:100,
      }}>
        {/* 타이틀: ODA와 QUOTATION 동일 폰트 크기 */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-.2px", color:"#fff" }}>ODA</span>
          <span style={{ color:"#F84F04", fontSize:17, fontWeight:400 }}>—</span>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-.2px", color:"#fff" }}>QUOTATION</span>
        </div>

        {/* 우측: 사용자 + 로그아웃 */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background:"#F84F04",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:700, color:"#fff",
            }}>
              {(displayName||"?").charAt(0)}
            </div>
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{displayName}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)" }}>
                {isAdmin ? "👑 관리자" : "사용자"}
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            background:"rgba(255,255,255,.1)",
            border:"1px solid rgba(255,255,255,.2)",
            color:"#fff", padding:"5px 12px", borderRadius:6,
            fontSize:12, cursor:"pointer", fontFamily:"inherit",
          }}>로그아웃</button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-title">메뉴</div>
          {allPages.map(p=>(
            <button key={p.id}
              className={`sidebar-btn${page===p.id?" active":""}`}
              onClick={()=>setPage(p.id)}>
              <span className="icon">{p.icon}</span>{p.label}
            </button>
          ))}
        </aside>
        <main className="content">
          {page==="quote"    && <QuotationPage  showToast={showToast}/>}
          {page==="staff"    && <StaffManager   showToast={showToast}/>}
          {page==="customer" && <CustomerManager showToast={showToast}/>}
          {page==="product"  && <ProductManager  showToast={showToast}/>}
          {page==="admin" && isAdmin && <AdminPage showToast={showToast}/>}
        </main>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
