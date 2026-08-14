import { useState, useCallback } from "react";
import QuotationPage from "./components/QuotationPage";
import StaffManager  from "./components/StaffManager";
import CustomerManager from "./components/CustomerManager";
import ProductManager  from "./components/ProductManager";
import Toast from "./components/Toast";

const PAGES = [
  { id:"quote",    label:"Create Quotation", icon:"📄" },
  { id:"staff",    label:"Sales Rep.",        icon:"👤" },
  { id:"customer", label:"Customers",         icon:"🏢" },
  { id:"product",  label:"Products",          icon:"📦" },
];

export default function App() {
  const [page, setPage] = useState("quote");
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 2800);
  }, []);

  return (
    <>
      <header className="app-header">
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ODA Technologies"
            style={{ height:32, objectFit:"contain" }}
            onError={e=>e.target.style.display="none"} />
          <span style={{ width:1, height:24, background:"rgba(255,255,255,.3)", display:"inline-block" }}/>
          <h1>Quotation System</h1>
        </div>
        <span style={{ fontSize:12, opacity:.7 }}>ODA Technologies Co., Ltd. · Reg. 122-86-05459</span>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-title">Menu</div>
          {PAGES.map(p=>(
            <button key={p.id} className={`sidebar-btn${page===p.id?" active":""}`} onClick={()=>setPage(p.id)}>
              <span className="icon">{p.icon}</span>{p.label}
            </button>
          ))}
        </aside>
        <main className="content">
          {page==="quote"    && <QuotationPage showToast={showToast}/>}
          {page==="staff"    && <StaffManager  showToast={showToast}/>}
          {page==="customer" && <CustomerManager showToast={showToast}/>}
          {page==="product"  && <ProductManager  showToast={showToast}/>}
        </main>
      </div>
      <Toast toasts={toasts}/>
    </>
  );
}
