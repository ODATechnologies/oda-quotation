import { useRef, useState, useEffect } from "react";

/**
 * 입력/수정 팝업 공통 배경
 * - 팝업 바깥(배경)을 클릭하면 바로 닫지 않고 "나가시겠습니까?" 확인 팝업을 띄움
 * - 팝업 안에서 드래그(텍스트 선택 등)하다 바깥에서 마우스를 놓는 경우는 클릭으로 보지 않음
 */
export default function ModalBackdrop({ onClose, children, className, style }) {
  const pressedOnBackdrop = useRef(false);
  const [asking, setAsking] = useState(false);

  return (
    <>
      <div
        className={className}
        style={style}
        onMouseDown={e => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
        onClick={e => {
          if (e.target === e.currentTarget && pressedOnBackdrop.current) setAsking(true);
          pressedOnBackdrop.current = false;
        }}
      >
        {children}
      </div>
      {asking && (
        <LeaveConfirm
          onStay={() => setAsking(false)}
          onLeave={() => { setAsking(false); onClose(); }}
        />
      )}
    </>
  );
}

function LeaveConfirm({ onStay, onLeave }) {
  const stayRef = useRef(null);

  useEffect(() => {
    stayRef.current?.focus();
    const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); onStay(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onStay]);

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}
      onClick={e => { if (e.target === e.currentTarget) onStay(); }}
    >
      <div role="alertdialog" aria-modal="true" style={{
        background:"#fff", borderRadius:12, boxShadow:"0 8px 40px rgba(0,0,0,.25)",
        padding:"22px 24px 18px", width:"min(360px, 90vw)",
      }}>
        <div style={{ fontSize:15, fontWeight:700, color:"var(--primary)", marginBottom:8 }}>입력 화면에서 나가시겠습니까?</div>
        <div style={{ fontSize:13, color:"var(--text-sub)", lineHeight:1.6 }}>
          저장하지 않은 입력 내용은 모두 사라집니다.
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:20 }}>
          <button className="btn btn-secondary" onClick={onLeave}>나가기</button>
          <button ref={stayRef} className="btn btn-primary" onClick={onStay}>계속 작성</button>
        </div>
      </div>
    </div>
  );
}
