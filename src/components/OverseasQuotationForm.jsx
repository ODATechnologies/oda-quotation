import { useState } from "react";
import { fmtNumber } from "../utils/helpers";

// 드롭다운 with 수기 입력 가능한 컴포넌트
function DropdownInput({ value, onChange, options, placeholder, style }) {
  const [showList, setShowList] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        placeholder={placeholder}
        style={{ width:"100%", padding:"7px 10px", border:"1px solid var(--border)", borderRadius:6, fontSize:13, fontFamily:"inherit", ...style }}
      />
      {showList && options.filter(o => !value || o.toLowerCase().includes(value.toLowerCase())).length > 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 2px)", left:0, right:0, zIndex:200,
          background:"#fff", border:"1px solid var(--border)", borderRadius:6,
          boxShadow:"0 4px 16px rgba(0,0,0,.1)", maxHeight:160, overflowY:"auto",
        }}>
          {options.filter(o => !value || o.toLowerCase().includes(value.toLowerCase())).map(o => (
            <div key={o} onMouseDown={() => { onChange(o); setShowList(false); }}
              style={{ padding:"8px 12px", cursor:"pointer", fontSize:13 }}
              onMouseEnter={e => e.currentTarget.style.background="#F5F7FF"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRICE_TERM_OPTIONS = [
  "DAP (Delivered at Place)",
  "FOB (Free on Board)",
  "CIF (Cost, Insurance and Freight)",
  "EXW (Ex Works)",
  "DDP (Delivered Duty Paid)",
  "CFR (Cost and Freight)",
];

const LEAD_TIME_OPTIONS = [
  "Around 4~5 weeks from PO receipt.",
  "Around 5~6 weeks from PO receipt.",
  "Around 6~8 weeks from PO receipt.",
  "Around 8~10 weeks from PO receipt.",
  "Around 10~12 weeks from PO receipt.",
];

const HS_CODE_OPTIONS = [
  "8504.40.9099",
  "9030.33.9000",
];

const BANK_INFO_DEFAULT = `Industrial Bank of Korea/Gal San-Yeok Branch
Account no. : 483-022203-56-00012
Swift Code : IBKOKRSE
Benef'y name : ODA Technologies`;

export default function OverseasQuotationForm({ form, onChange, staffInfo, supplierInfo }) {
  function set(key, val) { onChange({ ...form, [key]: val }); }

  const hsSelected = form.hsCodes || [];
  function toggleHS(code) {
    if (hsSelected.includes(code)) {
      set("hsCodes", hsSelected.filter(c => c !== code));
    } else {
      set("hsCodes", [...hsSelected, code]);
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── 공급자 (Shipper/Exporter) ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Shipper / Exporter</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ gap:12 }}>
            <div className="form-group">
              <label>Company</label>
              <input value={form.shipperCompany || supplierInfo?.name || "ODA Technologies Co., Ltd."}
                onChange={e => set("shipperCompany", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.shipperAddress || "62, Bupyeong-daero 329 Beon-gil, Bupyeong-gu, Incheon, Republic of Korea (21315)"}
                onChange={e => set("shipperAddress", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Attn (담당자)</label>
              <input value={form.shipperAttn || staffInfo?.name || ""}
                onChange={e => set("shipperAttn", e.target.value)} placeholder="담당자 이름"/>
            </div>
            <div className="form-group">
              <label>Tel</label>
              <input value={form.shipperTel || staffInfo?.phone || ""}
                onChange={e => set("shipperTel", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Fax</label>
              <input value={form.shipperFax || "82-32-715-5456"}
                onChange={e => set("shipperFax", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input value={form.shipperEmail || ""}
                onChange={e => set("shipperEmail", e.target.value)} placeholder="ate1@odacore.com"/>
            </div>
          </div>
        </div>
      </div>

      {/* ── 수요자 (Consignee) ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Consignee</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ gap:12 }}>
            <div className="form-group">
              <label>Company</label>
              <input value={form.consigneeCompany || ""}
                onChange={e => set("consigneeCompany", e.target.value)} placeholder="업체명"/>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.consigneeAddress || ""}
                onChange={e => set("consigneeAddress", e.target.value)} placeholder="주소"/>
            </div>
            <div className="form-group">
              <label>Attn</label>
              <input value={form.consigneeAttn || ""}
                onChange={e => set("consigneeAttn", e.target.value)} placeholder="담당자명"/>
            </div>
            <div className="form-group">
              <label>Tel</label>
              <input value={form.consigneeTel || ""}
                onChange={e => set("consigneeTel", e.target.value)}/>
            </div>
            <div className="form-group" style={{ gridColumn:"1/-1" }}>
              <label>E-mail</label>
              <input value={form.consigneeEmail || ""}
                onChange={e => set("consigneeEmail", e.target.value)}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── 운송 정보 ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Shipment Info</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ gap:12 }}>
            <div className="form-group">
              <label>No. & Date of Invoice</label>
              <input value={form.invoiceNo || ""}
                onChange={e => set("invoiceNo", e.target.value)} placeholder="ODA-OS260226001"/>
            </div>
            <div className="form-group">
              <label>Payment</label>
              <input value={form.payment || "T/T before shipment"}
                onChange={e => set("payment", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>L/C Issuing Bank</label>
              <input value={form.lcBank || ""}
                onChange={e => set("lcBank", e.target.value)} placeholder="선택 시 입력"/>
            </div>
            <div className="form-group">
              <label>Buyer (if other than consignee)</label>
              <input value={form.buyer || ""}
                onChange={e => set("buyer", e.target.value)} placeholder="해당 시 입력"/>
            </div>
            <div className="form-group">
              <label>Port of Loading</label>
              <input value={form.portLoading || "Incheon"}
                onChange={e => set("portLoading", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>Final Destination</label>
              <input value={form.finalDest || ""}
                onChange={e => set("finalDest", e.target.value)} placeholder="예: UAE"/>
            </div>
            <div className="form-group">
              <label>Carrier</label>
              <select value={form.carrier || "BY AIR"}
                onChange={e => set("carrier", e.target.value)}
                style={{ width:"100%", padding:"7px 10px", border:"1px solid var(--border)", borderRadius:6, fontSize:13 }}>
                <option value="BY AIR">BY AIR</option>
                <option value="BY SEA">BY SEA (SHIP)</option>
                <option value="BY COURIER">BY COURIER</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sailing on or about</label>
              <input value={form.sailingDate || ""}
                onChange={e => set("sailingDate", e.target.value)} placeholder="예: 2026년 3월"/>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input value={form.remarks || ""}
                onChange={e => set("remarks", e.target.value)}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Marks / HS Code ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Marks &amp; HS Code</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-2" style={{ gap:12 }}>
            <div className="form-group">
              <label>Marks / No. of PKGS.</label>
              <input value={form.marks || "MADE IN Korea"}
                onChange={e => set("marks", e.target.value)}/>
            </div>
            <div className="form-group">
              <label>HS CODE (복수 선택 가능)</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
                {HS_CODE_OPTIONS.map(code => (
                  <label key={code} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer",
                    background: hsSelected.includes(code) ? "#EEF3FF" : "#f4f4f4",
                    border: `1px solid ${hsSelected.includes(code) ? "#2563EB" : "var(--border)"}`,
                    borderRadius:6, padding:"6px 12px", fontSize:13, fontWeight: hsSelected.includes(code)?700:400,
                    color: hsSelected.includes(code) ? "#2563EB" : "var(--text)",
                    transition:"all .15s",
                  }}>
                    <input type="checkbox" checked={hsSelected.includes(code)}
                      onChange={() => toggleHS(code)} style={{ display:"none" }}/>
                    {code}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conditions ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Conditions</span></div>
        <div className="card-body">
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div className="form-group">
              <label>1. Price Term (운송조건)</label>
              <DropdownInput
                value={form.priceTerm || ""}
                onChange={v => set("priceTerm", v)}
                options={PRICE_TERM_OPTIONS}
                placeholder="운송조건 입력 또는 선택..."
              />
            </div>
            <div className="form-group">
              <label>2. Lead Time</label>
              <DropdownInput
                value={form.leadTime || ""}
                onChange={v => set("leadTime", v)}
                options={LEAD_TIME_OPTIONS}
                placeholder="리드타임 입력 또는 선택..."
              />
              {form.leadTime && (
                <div style={{ fontSize:11, color:"#F84F04", fontWeight:600, marginTop:4 }}>
                  ⚠ 출력 시 노란색 하이라이트로 강조됩니다.
                </div>
              )}
            </div>
            <div className="form-group">
              <label>3. Quotation valid until</label>
              <input type="date" value={form.validUntil || ""}
                onChange={e => set("validUntil", e.target.value)}/>
              {form.validUntil && (
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>
                  {new Date(form.validUntil).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>4. Bank Information</label>
              <textarea rows={4} value={form.bankInfo || BANK_INFO_DEFAULT}
                onChange={e => set("bankInfo", e.target.value)}
                style={{ width:"100%", fontSize:13, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:6, resize:"vertical" }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { BANK_INFO_DEFAULT };
