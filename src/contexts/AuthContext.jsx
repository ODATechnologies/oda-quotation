import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// 최고관리자 UID (첫 승인 후 여기에 등록)
// 최초 가입 시 이 이메일로 가입하면 자동으로 admin 권한 부여
const ADMIN_EMAIL = "이승목@oda"; // ← 본인 이메일로 변경 필요 (아래 설명 참고)

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userProfile,  setUserProfile]  = useState(null); // Firestore 프로필
  const [loading,      setLoading]      = useState(true);

  // ── 가입 신청 (이름 + 이메일 + 비밀번호)
  async function register(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    // Firestore에 사용자 프로필 저장
    // 첫 번째 계정(관리자)이면 바로 approved + admin
    const isAdmin = email === ADMIN_EMAIL;
    await setDoc(doc(db, "users", uid), {
      name,
      email,
      role:      isAdmin ? "admin"    : "pending", // pending = 승인 대기
      status:    isAdmin ? "approved" : "pending",
      createdAt: serverTimestamp(),
      approvedAt: isAdmin ? serverTimestamp() : null,
    });
    return cred;
  }

  // ── 로그인
  async function login(email, password) {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);

    if (profile?.status === "pending") {
      await signOut(auth);
      throw new Error("PENDING"); // 미승인 계정
    }
    if (profile?.status === "rejected") {
      await signOut(auth);
      throw new Error("REJECTED");
    }
    return cred;
  }

  // ── 로그아웃
  function logout() { return signOut(auth); }

  // ── Firestore 프로필 읽기
  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  // ── Auth 상태 감지
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userProfile,
    register,
    login,
    logout,
    fetchProfile,
    isAdmin: userProfile?.role === "admin",
    isApproved: userProfile?.status === "approved",
    displayName: userProfile?.name || currentUser?.email || "",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
