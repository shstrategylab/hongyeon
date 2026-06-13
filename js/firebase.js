// =====================================================
// firebase.js — Firebase Realtime DB 연동
// 유저 사주 저장 · 결제 상태 읽기/쓰기
// =====================================================

// ⚠️ 아래 설정값은 Firebase 콘솔에서 복사해서 채워주세요
const FIREBASE_CONFIG = {
  apiKey:            "여기에_API_KEY_입력",
  authDomain:        "여기에_AUTH_DOMAIN_입력",
  databaseURL:       "여기에_DATABASE_URL_입력",
  projectId:         "여기에_PROJECT_ID_입력",
  storageBucket:     "여기에_STORAGE_BUCKET_입력",
  messagingSenderId: "여기에_MESSAGING_SENDER_ID_입력",
  appId:             "여기에_APP_ID_입력",
};

// Firebase 초기화 (index.html에서 SDK 로드 후 사용)
function initFirebase() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK가 로드되지 않았습니다.");
    return false;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  return true;
}

const db = () => firebase.database();

// ── 유저 식별 키 생성 ────────────────────────────
// 로그인 없이 로컬스토리지 기반 익명 ID 사용
function getUserId() {
  let uid = localStorage.getItem("hongyeon_uid");
  if (!uid) {
    uid = "user_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("hongyeon_uid", uid);
  }
  return uid;
}

// ── 사주 데이터 저장 ─────────────────────────────
async function saveSaju(inputData) {
  if (!initFirebase()) return;
  const uid = getUserId();
  const ref = db().ref(`users/${uid}/saju`);
  await ref.set({
    ...inputData,
    savedAt: Date.now(),
  });
  console.log("사주 저장 완료:", uid);
}

// ── 저장된 사주 불러오기 ─────────────────────────
async function loadSaju() {
  if (!initFirebase()) return null;
  const uid = getUserId();
  const snap = await db().ref(`users/${uid}/saju`).once("value");
  return snap.val();
}

// ── 결제 상태 저장 ───────────────────────────────
async function setPremiumStatus(isPaid) {
  if (!initFirebase()) return;
  const uid = getUserId();
  await db().ref(`users/${uid}/premium`).set({
    isPaid,
    paidAt: isPaid ? Date.now() : null,
  });
}

// ── 결제 상태 확인 ───────────────────────────────
async function checkPremiumStatus() {
  if (!initFirebase()) return false;
  const uid = getUserId();
  const snap = await db().ref(`users/${uid}/premium`).once("value");
  const data = snap.val();
  return data?.isPaid === true;
}

// ── 포국 결과 저장 (히스토리) ────────────────────
async function saveResult(resultData) {
  if (!initFirebase()) return;
  const uid = getUserId();
  const ref = db().ref(`users/${uid}/history`).push();
  await ref.set({
    ...resultData,
    createdAt: Date.now(),
  });
}

// ── 히스토리 불러오기 ────────────────────────────
async function loadHistory() {
  if (!initFirebase()) return [];
  const uid = getUserId();
  const snap = await db().ref(`users/${uid}/history`)
    .orderByChild("createdAt")
    .limitToLast(10)
    .once("value");
  const data = snap.val();
  if (!data) return [];
  return Object.values(data).reverse();
}
