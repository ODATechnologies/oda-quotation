import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, orderBy, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "quote_history";

// 견적 저장 (Firestore)
export async function saveQuote(quoteData) {
  const id  = quoteData.docNo.replace(/[^a-zA-Z0-9-]/g, "_");
  const ref = doc(db, COL, id);
  await setDoc(ref, {
    ...quoteData,
    savedAt: serverTimestamp(),
  }, { merge: true });
}

// 특정 업체 견적 이력
export async function getHistoryByCustomer(customerName) {
  if (!customerName) return [];
  try {
    const q    = query(
      collection(db, COL),
      where("customer", "==", customerName),
      orderBy("savedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      docNo: d.id.replace(/_/g, "-"),
      savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch(e) {
    console.error("이력 조회 오류:", e);
    return [];
  }
}

// 전체 견적 이력 (견적 현황 페이지용)
export async function getAllHistory() {
  try {
    const q    = query(collection(db, COL), orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...d.data(),
      docNo: d.id.replace(/_/g, "-"),
      savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch(e) {
    console.error("전체 이력 조회 오류:", e);
    return [];
  }
}

// 견적 삭제
export async function deleteQuote(docNo) {
  const id = docNo.replace(/[^a-zA-Z0-9-]/g, "_");
  await deleteDoc(doc(db, COL, id));
}
