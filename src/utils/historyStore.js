import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COL = "quote_history";

export async function saveQuote(quoteData) {
  const id  = quoteData.docNo.replace(/[^a-zA-Z0-9]/g, "_");
  await setDoc(doc(db, COL, id), {
    ...quoteData,
    savedAt: serverTimestamp(),
  }, { merge: true });
}

// where만 사용 (복합 인덱스 불필요) → 클라이언트에서 정렬
export async function getHistoryByCustomer(customerName) {
  if (!customerName) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COL), where("customer", "==", customerName))
    );
    const result = snap.docs.map(d => ({
      ...d.data(),
      docNo:   d.id.replace(/_/g, "-"),
      savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    // 클라이언트에서 최신순 정렬
    return result.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) {
    console.error("이력 조회 오류:", e.message);
    return [];
  }
}

export async function getAllHistory() {
  try {
    const snap = await getDocs(collection(db, COL));
    const result = snap.docs.map(d => ({
      ...d.data(),
      docNo:   d.id.replace(/_/g, "-"),
      savedAt: d.data().savedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    return result.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) {
    console.error("전체 이력 조회 오류:", e.message);
    return [];
  }
}

export async function deleteQuote(docNo) {
  const id = docNo.replace(/[^a-zA-Z0-9]/g, "_");
  await deleteDoc(doc(db, COL, id));
}
