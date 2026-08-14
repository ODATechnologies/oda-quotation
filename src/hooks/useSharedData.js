import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Firestore 컬렉션 실시간 구독 + CRUD
export function useSharedCollection(collectionName, fallback = []) {
  const [data,    setData]    = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, collectionName),
      (snap) => {
        const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
        // id 기준 정렬 (생성 순)
        docs.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`${collectionName} 오류:`, err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [collectionName]);

  const save = useCallback(async (item) => {
    const isNew = !item._id;
    const id    = item._id || `${collectionName}_${Date.now()}`;
    const ref   = doc(db, collectionName, id);
    const { _id, ...rest } = item;
    await setDoc(ref, {
      ...rest,
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return id;
  }, [collectionName]);

  const remove = useCallback(async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  }, [collectionName]);

  return { data, loading, error, save, remove };
}
