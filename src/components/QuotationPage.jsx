import { useState, useEffect, useMemo, useCallback } from "react";
import {
  INITIAL_STAFF, INITIAL_CUSTOMERS, INITIAL_PRODUCTS,
  DEFAULT_TERMS, SUPPLIER_INFO,
} from "../data/masterData";
import { generateDocNo, fmtNumber, calcItem, emptyItem, todayStr } from "../utils/helpers";
import { exportToExcel } from "../utils/exportExcel";
import { exportToPdf }   from "../utils/exportPdf";
import { saveQuote, getHistoryByCustomer } from "../utils/historyStore";
import ItemRow from "./ItemRow";
import QuoteHistoryPanel from "./QuoteHistoryPanel";

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function QuotationPage({ showToast }) {
  const staffList    = loadLS("oda_staff",     INITIAL_STAFF);
  const customerList = loadLS("oda_customers", INITIAL_CUSTOMERS);
  const productList  = loadLS("oda_products",  INITIAL_PRODUCTS);
  const [seqMap, setSeqMap] = useState(() => loadLS("oda_seq", {}));

  const [date,        setDate]        = useState(todayStr());
  const [staffId,     setStaffId]     = useState(staffList[0]?.id || "");
  const [custId,      setCustId]      = useState("");
  const [contactIdx,  setContactIdx]  = useState(0);
  const [manualMode,  setManualMode]  = useState(false);
  const [manualCompany, setManualCompany] = useState("");
  const [manualContact, setManualContact] = useState({ name:"", phone:"", email:"" });
  const [terms,  setTerms]  = useState(DEFAULT_TERMS);
  const [items,  setItems]  = useState([emptyItem(1)]);
  const [nextId, setNextId] = useState(2);
  const [customerHistory, setCustomerHistory] = useState([]);

  const staff    = staffList.find(s => s.id === staffId) || staffList[0] || {};
  const custObj  = customerList.find(c => c.id === custId);
  const contact  = manualMode ? manualContact : (custObj?.contacts[contactIdx] || { name:"", phone:"", email:"" });
  const customerName = manualMode ? manualCompany : (custObj?.company || "");

  useEffect(() => {
    setCustomerHistory(getHistoryByCustomer(customerName));
  }, [customerName]);

  const { docNo, dateKey, seq } = useMemo(() => {
    const custKey = customerName.replace(/\s/g,"") || "UNKNOWN";
    return generateDocNo(date ? new Date(date) : new Date(), custKey, seqMap);
  }, [date, customerName, seqMap]);

  const calcedItems = useMemo(() => items.map(calcItem), [items]);
  const totalSupply = calcedItems.reduce((s,i) => s + i.amount, 0);
  const totalVat    = calcedItems.reduce((s,i) => s + i.vat,    0);
  const grandTotal  = totalSupply + totalVat;

  function addItem()           { setItems(p=>[...p, emptyItem(nextId)]); setNextId(n=>n+1); }
  function removeItem(id)      { setItems(p=>p.filter(i=>i.id!==id)); }
  function updateItem(id, pat) { setItems(p=>p.map(i=>i.id===id?{...i,...pat}:i)); }

  function buildExportData() {
    return {
      docNo, date,
      staff:    { name:staff.name||"", phone:staff.phone||"" },
      supplier: SUPPLIER_INFO,
      customer: customerName,
      contact,
      items: calcedItems,
      terms,
      totalSupply, totalVat, grandTotal,
    };
  }

  function confirmSeq() {
    setSeqMap(prev => {
      const next = { ...prev, [dateKey]: seq };
      localStorage.setItem("oda_seq", JSON.stringify(next));
      return next;
    });
  }

  function handleSave() {
    if (!customerName) { showToast("Please select or enter a customer.", "error"); return; }
    saveQuote(buildExportData());
    confirmSeq();
    setCustomerHistory(getHistoryByCustomer(customerName));
    showToast(`✅ [${docNo}] Quotation saved.`, "success");
  }

  const handleLoadFromHistory = useCallback((record) => {
    const foundCust = customerList.find(c => c.company === record.customer);
    if (foundCust) {
      setManualMode(false); setCustId(foundCust.id);
      const ci = foundCust.contacts.findIndex(c => c.name === record.contact?.name);
      setContactIdx(ci >= 0 ? ci : 0);
    } else {
      setManualMode(true);
      setManualCompany(record.customer||"");
      setManualContact(record.contact||{name:"",phone:"",email:""});
    }
    const foundStaff = staffList.find(s => s.name === record.staff?.name);
    if (foundStaff) setStaffId(foundStaff.id);
    setDate(record.date || todayStr());
    setTerms(record.terms || DEFAULT_TERMS);
    const restoredItems = (record.items||[]).map((item,i) => ({ ...item, id:i+1, manualPrice:true }));
    setItems(restoredItems.length > 0 ? restoredItems : [emptyItem(1)]);
    setNextId(restoredItems.length + 1);
    showToast(`[${record.docNo}] Quotation loaded.`, "success");
  }, [customerList, staffList, showToast]);

  function handleReset() {
    if (!confirm("Reset current quotation?")) return;
    setDate(todayStr()); setStaffId(staffList[0]?.id||"");
    setCustId(""); setContactIdx(0); setManualMode(false);
    setManualCompany(""); setManualContact({name:"",phone:"",email:""});
    setTerms(DEFAULT_TERMS); setItems([emptyItem(1)]); setNextId(2);
  }

  return (
    <div>
      {/* 액션 바 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>Document No.</div>
          <span className="docno-chip">{docNo}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary" onClick={handleReset}>↺ Reset</button>
          <button className="btn btn-secondary" onClick={() => { try { exportToExcel(buildExportData()); confirmSeq(); showToast("Excel saved.", "success"); } catch(e){ showToast(e.message,"error"); } }}>📊 Excel</button>
          <button className="btn btn-secondary" onClick={() => { try { exportToPdf(buildExportData()); confirmSeq(); showToast("Print dialog opened.", "success"); } catch(e){ showToast(e.message,"error"); } }}>🖨️ PDF Print</button>
          <button className="btn btn-primary"   onClick={handleSave}>💾 Save</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        {/* CUSTOMER */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">CUSTOMER</span>
            <label style={{ fontSize:12, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
              <input type="checkbox" checked={manualMode}
                onChange={e => { setManualMode(e.target.checked); setCustId(""); }}
              />
              Manual input
            </label>
          </div>
          <div className="card-body">
            {!manualMode ? (
              <div className="form-grid" style={{ gap:10 }}>
                <div className="form-group">
                  <label>Bill To <span className="required">*</span></label>
                  <select value={custId} onChange={e=>{ setCustId(Number(e.target.value)); setContactIdx(0); }}>
                    <option value="">-- Select Customer --</option>
                    {customerList.map(c=><option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                {custObj && (
                  <div className="form-group">
                    <label>Attention</label>
                    <select value={contactIdx} onChange={e=>setContactIdx(Number(e.target.value))}>
                      {custObj.contacts.map((ct,i)=><option key={i} value={i}>{ct.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Phone</label>
                  <input readOnly value={contact.phone||""} placeholder="Auto-filled" />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input readOnly value={contact.email||""} placeholder="Auto-filled" />
                </div>
              </div>
            ) : (
              <div className="form-grid" style={{ gap:10 }}>
                <div className="form-group">
                  <label>Bill To (Company)</label>
                  <input value={manualCompany} onChange={e=>setManualCompany(e.target.value)} placeholder="Company name" />
                </div>
                <div className="form-group">
                  <label>Attention</label>
                  <input value={manualContact.name} onChange={e=>setManualContact(p=>({...p,name:e.target.value}))} placeholder="Name / Title" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={manualContact.phone} onChange={e=>setManualContact(p=>({...p,phone:e.target.value}))} placeholder="010-0000-0000" />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input value={manualContact.email} onChange={e=>setManualContact(p=>({...p,email:e.target.value}))} placeholder="email@company.com" />
                </div>
              </div>
            )}
            <QuoteHistoryPanel
              history={customerHistory}
              onLoad={handleLoadFromHistory}
              onHistoryChange={() => setCustomerHistory(getHistoryByCustomer(customerName))}
            />
          </div>
        </div>

        {/* ODA TECHNOLOGIES */}
        <div className="card">
          <div className="card-header"><span className="card-title">ODA TECHNOLOGIES</span></div>
          <div className="card-body">
            <div className="form-grid" style={{ gap:10 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Document No.</label>
                <input readOnly value={docNo} style={{ fontWeight:700, color:"var(--accent)" }} />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input readOnly value={SUPPLIER_INFO.name} />
              </div>
              <div className="form-group">
                <label>Reg. No.</label>
                <input readOnly value={SUPPLIER_INFO.bizNo} />
              </div>
              <div className="form-group">
                <label>Sales Rep. <span className="required">*</span></label>
                <select value={staffId} onChange={e=>setStaffId(Number(e.target.value))}>
                  {staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input readOnly value={staff.phone||""} placeholder="Auto-filled" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 품목 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Line Items</span>
          <button className="btn btn-primary btn-sm" onClick={addItem}>+ Add Item</button>
        </div>
        <div className="card-body" style={{ padding:0 }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{width:36}}>NO</th>
                  <th style={{width:180}}>Description</th>
                  <th style={{width:160}}>Model</th>
                  <th style={{width:60}}>Qty</th>
                  <th style={{width:120}}>List Price</th>
                  <th style={{width:72}}>DC (%)</th>
                  <th style={{width:130}}>Unit Price</th>
                  <th style={{width:130}}>Amount</th>
                  <th style={{width:110}}>VAT</th>
                  <th style={{width:100}}>Remark</th>
                  <th style={{width:36}}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item,idx) => (
                  <ItemRow
                    key={item.id} item={item} idx={idx}
                    productList={productList}
                    onUpdate={pat=>updateItem(item.id,pat)}
                    onRemove={()=>removeItem(item.id)}
                    calc={calcedItems[idx]}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-row">
            <div className="summary-cell">
              <span className="label">Supply Amount</span>
              <span className="value">₩{fmtNumber(totalSupply)}</span>
            </div>
            <div className="summary-cell">
              <span className="label">VAT (10%)</span>
              <span className="value">₩{fmtNumber(totalVat)}</span>
            </div>
            <div className="summary-cell total">
              <span className="label">TOTAL</span>
              <span className="value">₩{fmtNumber(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TERMS */}
      <div className="card">
        <div className="card-header"><span className="card-title">TERMS &amp; CONDITIONS</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label>Delivery</label>
              <input value={terms.delivery} onChange={e=>setTerms(p=>({...p,delivery:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Validity</label>
              <input value={terms.validity} onChange={e=>setTerms(p=>({...p,validity:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Payment</label>
              <input value={terms.payment} onChange={e=>setTerms(p=>({...p,payment:e.target.value}))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
