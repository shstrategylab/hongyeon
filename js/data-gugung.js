// =====================================================
// data-gugung.js — 구궁(九宮) 마스터 데이터
// 낙서구궁 배치 · 오행 · 방위 · 길흉 해석 텍스트
// =====================================================

// ── 구궁 기본 속성 ────────────────────────────────
// gridPos: CSS Grid에서의 위치 (전통 방위 배열 기준)
// 전통 배열: [4,9,2 / 3,5,7 / 8,1,6]
const GUGUNG = {
  1: {
    name: "감궁(坎宮)", hanja: "坎", direction: "북",
    ohaeng: "수(水)", color: "#1a6fbf",
    gridPos: 8,  // CSS Grid 8번째 칸
    desc: "지혜·은밀·흐름",
  },
  2: {
    name: "곤궁(坤宮)", hanja: "坤", direction: "남서",
    ohaeng: "토(土)", color: "#8B6914",
    gridPos: 3,
    desc: "순종·결실·어머니",
  },
  3: {
    name: "진궁(震宮)", hanja: "震", direction: "동",
    ohaeng: "목(木)", color: "#2d7a2d",
    gridPos: 4,
    desc: "진취·발전·장남",
  },
  4: {
    name: "손궁(巽宮)", hanja: "巽", direction: "남동",
    ohaeng: "목(木)", color: "#4a9e4a",
    gridPos: 1,
    desc: "유연·바람·장녀",
  },
  5: {
    name: "중궁(中宮)", hanja: "中", direction: "중앙",
    ohaeng: "토(土)", color: "#8B6914",
    gridPos: 5,
    desc: "중심·주재·변화",
  },
  6: {
    name: "건궁(乾宮)", hanja: "乾", direction: "북서",
    ohaeng: "금(金)", color: "#8a7a2e",
    gridPos: 9,
    desc: "권위·아버지·하늘",
  },
  7: {
    name: "태궁(兌宮)", hanja: "兌", direction: "서",
    ohaeng: "금(金)", color: "#9e6a2d",
    gridPos: 6,
    desc: "기쁨·소통·소녀",
  },
  8: {
    name: "간궁(艮宮)", hanja: "艮", direction: "북동",
    ohaeng: "토(土)", color: "#7a5c1a",
    gridPos: 7,
    desc: "정지·산·막내아들",
  },
  9: {
    name: "이궁(離宮)", hanja: "離", direction: "남",
    ohaeng: "화(火)", color: "#bf2d1a",
    gridPos: 2,
    desc: "문서·명예·빛",
  },
};

// ── 천반·지반 관계 해석 (길흉 점수 + 텍스트) ─────
// 관계 타입: 천반수가 지반수를 생/극/비화하는 관계
const RELATION_TYPE = {
  천생지: {
    label: "천생지(天生地)",
    score: 90,
    summary: "하늘이 땅을 돕는 대길 구조",
    desc: "윗사람·환경의 전폭적 지원. 귀인 도움과 문서 이득이 따릅니다.",
    badge: "대길",
  },
  지생천: {
    label: "지생천(地生天)",
    score: 70,
    summary: "내 노력으로 성과를 거두는 구조",
    desc: "내가 에너지를 쏟아야 결과가 나옵니다. 과로 주의.",
    badge: "길",
  },
  천극지: {
    label: "천극지(天剋地)",
    score: 20,
    summary: "환경이 나를 억누르는 흉 구조",
    desc: "외부 압박·상사 불화·문서 손실 위험. 자중하고 때를 기다리세요.",
    badge: "흉",
  },
  지극천: {
    label: "지극천(地剋天)",
    score: 40,
    summary: "내가 환경을 억누르는 구조",
    desc: "추진력은 있으나 주변과 마찰. 독단 금물, 협력이 키입니다.",
    badge: "보통",
  },
  비화: {
    label: "비화(比和)",
    score: 60,
    summary: "천지가 같은 기운으로 안정된 구조",
    desc: "변화 없이 현상 유지. 안정적이나 획기적 발전은 어렵습니다.",
    badge: "중",
  },
};

// 오행 상생상극 룰
const OHAENG_RULE = {
  // 생하는 관계 (나 → 상대)
  생: {
    목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
  },
  // 극하는 관계 (나 → 상대)
  극: {
    목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
  },
};

// 천반수와 지반수의 오행 관계 → 관계 타입 도출
function getRelationType(cheonbanNum, jibanNum) {
  const co = getOhaengChar(cheonbanNum);
  const jo = getOhaengChar(jibanNum);

  if (co === jo) return RELATION_TYPE.비화;
  if (OHAENG_RULE.생[co] === jo) return RELATION_TYPE.천생지;
  if (OHAENG_RULE.생[jo] === co) return RELATION_TYPE.지생천;
  if (OHAENG_RULE.극[co] === jo) return RELATION_TYPE.천극지;
  if (OHAENG_RULE.극[jo] === co) return RELATION_TYPE.지극천;
  return RELATION_TYPE.비화;
}

function getOhaengChar(num) {
  const map = { 1:"수",2:"토",3:"목",4:"목",5:"토",6:"금",7:"금",8:"토",9:"화" };
  return map[num] || "토";
}

// ── 8문(八門) 데이터 ──────────────────────────────
const PALMUN = {
  생기: { label: "생기(生氣)", score: 95, desc: "최고의 길방. 새 출발·사업·이사에 최적." },
  복덕: { label: "복덕(福德)", score: 85, desc: "복과 재물이 따르는 길방." },
  천의: { label: "천의(天醫)", score: 80, desc: "건강·치유·문서 계약에 유리." },
  유혼: { label: "유혼(遊魂)", score: 45, desc: "방황·불안정. 신중한 행동 요구." },
  화해: { label: "화해(禍害)", score: 30, desc: "작은 재앙. 구설·다툼 주의." },
  귀혼: { label: "귀혼(歸魂)", score: 25, desc: "퇴보·후퇴. 현상 유지가 최선." },
  절체: { label: "절체(絶體)", score: 15, desc: "막힘·차단. 큰일 금물." },
  절명: { label: "절명(絶命)", score: 5,  desc: "최흉방. 이동·건축·계약 절대 금지." },
};

// ── 팔문 배속 함수 ────────────────────────────────
// 세궁(世宮)을 기준으로 낙서 순방향에 팔문 8개 배속
// 나머지 1궁 = 복위(안정·중립)
const PALMUN_ORDER = ["생기","복덕","천의","유혼","화해","귀혼","절체","절명"];

function buildPalmunBoard(segungIndex) {
  const startIdx = NAKSEO_PATH.indexOf(segungIndex);
  const palmunBoard = {};

  for (let i = 0; i < 8; i++) {
    const gungNum = NAKSEO_PATH[(startIdx + i) % 9];
    palmunBoard[gungNum] = PALMUN_ORDER[i];
  }
  // 8문 배속 후 남는 1궁 = 복위
  const lastGung = NAKSEO_PATH[(startIdx + 8) % 9];
  palmunBoard[lastGung] = "복위";

  return palmunBoard;
}
