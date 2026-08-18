import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, where, or,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

// ── 공용 품목 (shared_products): 관리자 관리, 전체 읽기
export function useSharedProducts() {
  const { currentUser, isAdmin } = useAuth();
  const [sharedItems, setSharedItems] = useState([]);
  const [myItems,     setMyItems]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  // 공용 품목 구독
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "shared_products"),
      snap => {
        const docs = snap.docs.map(d => ({ _id:d.id, _type:"shared", ...d.data() }));
        docs.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
        setSharedItems(docs);
        setLoading(false);
      },
      err => { console.error("shared_products 오류:", err); setLoading(false); }
    );
    return unsub;
  }, []);

  // 개인 품목 구독
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, "my_products"), where("uid", "==", currentUser.uid)),
      snap => {
        const docs = snap.docs.map(d => ({ _id:d.id, _type:"my", ...d.data() }));
        docs.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
        setMyItems(docs);
      },
      err => console.error("my_products 오류:", err)
    );
    return unsub;
  }, [currentUser]);

  // 공용 품목 저장 (관리자만)
  const saveShared = useCallback(async (item) => {
    const id  = item._id || `sp_${Date.now()}`;
    const { _id, _type, ...rest } = item;
    await setDoc(doc(db, "shared_products", id), {
      ...rest,
      ...(item._id ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return id;
  }, []);

  // 개인 품목 저장
  const saveMy = useCallback(async (item) => {
    const id  = item._id || `mp_${Date.now()}`;
    const { _id, _type, ...rest } = item;
    await setDoc(doc(db, "my_products", id), {
      ...rest,
      uid: currentUser.uid,
      ...(item._id ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return id;
  }, [currentUser]);

  // 삭제
  const removeShared = useCallback(async (id) => {
    await deleteDoc(doc(db, "shared_products", id));
  }, []);
  const removeMy = useCallback(async (id) => {
    await deleteDoc(doc(db, "my_products", id));
  }, []);

  return {
    sharedItems,
    myItems,
    allItems: [...sharedItems, ...myItems],
    loading,
    isAdmin,
    saveShared,
    saveMy,
    removeShared,
    removeMy,
  };
}
