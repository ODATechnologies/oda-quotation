import {
  collection, collectionGroup, doc, setDoc, getDocs, getDocsFromServer,
  deleteDoc, serverTimestamp, query,
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

  await setDoc(custDoc(customer), { customer, updatedAt: serverTimestamp() }, { merge: true });
  await setDoc(quoteDoc(customer, docId), {
    ...quoteData,
    savedAt: serverTimestamp(),
  }, { merge: true });
}

// 업체별 조회
export async function getHistoryByCustomer(customerName) {
  if (!customerName) return [];
  try {
    const snap = await getDocsFromServer(quotesCol(customerName));
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

// 전체 조회 (견적 현황용) - collectionGroup으로 모든 quotes 서브컬렉션 한 번에 조회
export async function getAllHistory() {
  try {
    console.log("[DEBUG] collectionGroup 쿼리 시작...");
    const q = query(collectionGroup(db, "quotes"));
    const snap = await getDocsFromServer(q);
    console.log("[DEBUG] collectionGroup 결과:", snap.docs.length, "건");
    const all = snap.docs.map(d => ({
      ...d.data(),
      docNo:   d.id,
      savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    return all.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) {
    console.error("[DEBUG] collectionGroup 실패:", e.code, e.message);
    // fallback: 기존 방식
    try {
      console.log("[DEBUG] fallback 방식 시도...");
      const custSnap = await getDocsFromServer(collection(db, "quote_history"));
      console.log("[DEBUG] 업체 문서 수:", custSnap.docs.length, custSnap.docs.map(d=>d.id));
      const results = await Promise.all(
        custSnap.docs.map(custD => getDocsFromServer(quotesCol(custD.id)))
      );
      const all = [];
      results.forEach((quotesSnap, i) => {
        console.log(`[DEBUG] ${custSnap.docs[i].id} 견적 수:`, quotesSnap.docs.length);
        quotesSnap.docs.forEach(d => {
          all.push({
            ...d.data(),
            docNo:   d.id,
            savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
      });
      return all.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
    } catch(e2) {
      console.error("[DEBUG] fallback도 실패:", e2.code, e2.message);
      return [];
    }
  }
}

// 삭제
export async function deleteQuote(customer, docNo) {
  if (!customer || !docNo) {
    throw new Error(`삭제 실패: customer 또는 docNo가 없습니다. (customer=${customer}, docNo=${docNo})`);
  }
  await deleteDoc(quoteDoc(customer, docNo));
}
