import {
  collection, doc, setDoc, getDocs,
  deleteDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// quote_history/{customer}/quotes/{docId}
function custDoc(customer) {
  return doc(db, "quote_history", customer);
}
function quotesCol(customer) {
  return collection(db, "quote_history", customer, "quotes");
}
function quoteDoc(customer, docId) {
  return doc(db, "quote_history", customer, "quotes", docId);
}

// 저장
export async function saveQuote(quoteData) {
  const customer = quoteData.customer || "UNKNOWN";
  const docId    = quoteData.docNo || `Quotation for ${customer} ${Date.now()}`;

  // 업체 문서 생성 (없으면)
  await setDoc(custDoc(customer), { customer, updatedAt: serverTimestamp() }, { merge: true });

  // 견적 저장
  await setDoc(quoteDoc(customer, docId), {
    ...quoteData,
    savedAt: serverTimestamp(),
  }, { merge: true });
}

// 업체별 조회
export async function getHistoryByCustomer(customerName) {
  if (!customerName) return [];
  try {
    const snap = await getDocs(quotesCol(customerName));
    return snap.docs
      .map(d => ({
        ...d.data(),
        docNo:   d.id,
        savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }))
      .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) {
    console.error("이력 조회 오류:", e.message);
    return [];
  }
}

// 전체 조회 (견적 현황용) - 병렬 조회로 성능 개선
export async function getAllHistory() {
  try {
    const custSnap = await getDocs(collection(db, "quote_history"));
    // 모든 업체의 서브컬렉션을 병렬로 조회
    const results = await Promise.all(
      custSnap.docs.map(custD => getDocs(quotesCol(custD.id)))
    );
    const all = [];
    results.forEach(quotesSnap => {
      quotesSnap.docs.forEach(d => {
        all.push({
          ...d.data(),
          docNo:   d.id,
          savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });
    });
    return all.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) {
    console.error("전체 이력 조회 오류:", e.message);
    return [];
  }
}

// 삭제
export async function deleteQuote(customer, docNo) {
  if (!customer || !docNo) {
    throw new Error(`삭제 실패: customer 또는 docNo가 없습니다. (customer=${customer}, docNo=${docNo})`);
  }
  await deleteDoc(quoteDoc(customer, docNo));
}
