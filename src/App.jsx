import { useState, useCallback } from "react";
import QuotationPage from "./components/QuotationPage";
import StaffManager  from "./components/StaffManager";
import CustomerManager from "./components/CustomerManager";
import ProductManager  from "./components/ProductManager";
import Toast from "./components/Toast";

const PAGES = [
  { id: "quote",    label: "견적서 작성",  icon: "📄" },
  { id: "staff",    label: "담당자 관리",  icon: "👤" },
  { id: "customer", label: "거래처 관리",  icon: "🏢" },
  { id: "product",  label: "품목 관리",    icon: "📦" },
];

export default function App() {
  const [page, setPage] = useState("quote");
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>ODA Technologies — 견적서 시스템</h1>
        <div className="header-right">
          <span style={{ fontSize: 12, opacity: .7 }}>㈜오디에이테크놀로지 · 사업자 122-86-05459</span>
        </div>
      </header>

      <div className="main-layout">
        {/* 사이드바 */}
        <aside className="sidebar">
          <div className="sidebar-title">메뉴</div>
          {PAGES.map(p => (
            <button
              key={p.id}
              className={`sidebar-btn${page === p.id ? " active" : ""}`}
              onClick={() => setPage(p.id)}
            >
              <span className="icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </aside>

        {/* 컨텐츠 */}
        <main className="content">
          {page === "quote"    && <QuotationPage showToast={showToast} />}
          {page === "staff"    && <StaffManager  showToast={showToast} />}
          {page === "customer" && <CustomerManager showToast={showToast} />}
          {page === "product"  && <ProductManager  showToast={showToast} />}
        </main>
      </div>

      <Toast toasts={toasts} />
    </>
  );
}
