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
    detail: "윗사람이나 외부 환경이 알아서 나를 밀어주는 흐름이라, 큰 노력을 들이지 않아도 일이 순조롭게 풀리는 시기입니다. 인사·계약·승인처럼 누군가의 결정이 필요한 일은 이 방향에서 진행하면 한결 수월합니다.",
    badge: "대길",
  },
  지생천: {
    label: "지생천(地生天)",
    score: 70,
    summary: "내 노력으로 성과를 거두는 구조",
    desc: "내가 에너지를 쏟아야 결과가 나옵니다. 과로 주의.",
    detail: "내 쪽에서 먼저 움직이고 자원을 투입해야 비로소 결실이 맺히는 구조로, 가만히 있으면 기회가 그냥 지나갑니다. 단기간에 무리하게 밀어붙이기보다 꾸준히 에너지를 배분해야 번아웃을 피할 수 있습니다.",
    badge: "길",
  },
  천극지: {
    label: "천극지(天剋地)",
    score: 20,
    summary: "환경이 나를 억누르는 흉 구조",
    desc: "외부 압박·상사 불화·문서 손실 위험. 자중하고 때를 기다리세요.",
    detail: "내가 통제할 수 없는 외부 요인(상급자, 제도, 계약 조건 등)이 나를 짓누르는 흐름이라, 정면 돌파보다 일단 한 발 물러서서 충격을 흡수하는 전략이 안전합니다. 이 시기에 새 계약이나 큰 결정을 강행하면 손실로 이어지기 쉽습니다.",
    badge: "흉",
  },
  지극천: {
    label: "지극천(地剋天)",
    score: 40,
    summary: "내가 환경을 억누르는 구조",
    desc: "추진력은 있으나 주변과 마찰. 독단 금물, 협력이 키입니다.",
    detail: "내 추진력과 의지는 강하지만 그만큼 주변 환경·사람들과 부딫히기 쉬운 구조이므로, 혼자 밀고 나가기보다 사전에 의견을 모으고 협조를 구하는 과정이 마찰을 줄여줍니다. 일방적으로 결정을 강행하면 단기적으로는 이겨도 장기적으로 관계에 부담이 남습니다.",
    badge: "보통",
  },
  비화: {
    label: "비화(比和)",
    score: 60,
    summary: "천지가 같은 기운으로 안정된 구조",
    desc: "변화 없이 현상 유지. 안정적이나 획기적 발전은 어렵습니다.",
    detail: "위아래의 기운이 서로 같아 부딫힘 없이 평온하게 흘러가는 구조로, 큰 사고나 갈등 없이 무난하게 지나가는 시기입니다. 다만 같은 기운이 정체되어 있는 만큼 새로운 시도나 변화의 동력은 약하니, 안정을 지키는 용도로 활용하는 것이 좋습니다.",
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

// ── 신살(神煞) 데이터 ─────────────────────────────
// 오행 기준으로 각 궁에 발동되는 신살 정의
// 발동 조건: 해당 궁의 천반수·지반수 오행 조합
const SINSAL = {
  탕화살: {
    label: "탕화살(湯火煞)",
    severity: "대흉",
    score: -30,
    ohaeng: ["화", "토"],       // 화(火)극금(金) + 토(土) 중첩 시 발동
    triggerPairs: [             // [천반오행, 지반오행] 조합
      ["화", "금"],             // 불이 쇠를 달구는 형상 → 가마솥
      ["화", "토"],             // 불이 땅을 태움
    ],
    desc: "뜨거운 물·불에 의한 화상·사고 위험. 주방·보일러·전기 기구 주의.",
    detail: "화(火)와 금(金)이 정면 충돌하는 구조로, 끓는 물이나 불에 의한 사고 또는 열병·피부 질환이 발생할 수 있습니다. 이 방위의 이동·이사·공사를 피하고 화기 취급에 각별히 조심하세요.",
    symbol: "🔥",
  },
  수옥살: {
    label: "수옥살(囚獄煞)",
    severity: "흉",
    score: -25,
    triggerPairs: [
      ["금", "목"],             // 금이 목을 억압 → 갇힘
      ["토", "수"],             // 토가 수를 막음 → 차단
    ],
    desc: "갇힘·구속·소송 위험. 계약·보증·법적 문서 절대 주의.",
    detail: "강한 기운이 나를 가두는 형상으로, 소송·구속·계약 분쟁에 휘말릴 수 있는 살입니다. 이 방위에서의 계약·보증·법적 행위는 피하고, 이미 문제가 있다면 서두르지 말고 전문가의 조언을 먼저 구하세요.",
    symbol: "⛓",
  },
  고신살: {
    label: "고신살(孤身煞)",
    severity: "흉",
    score: -20,
    triggerPairs: [
      ["금", "화"],             // 금이 화를 받음 → 고립
      ["수", "토"],             // 수가 토에 막힘 → 단절
    ],
    desc: "고독·이별·인연 단절. 중요한 인간관계 결정 삼가세요.",
    detail: "기운이 흩어지고 인연이 끊기는 구조로, 이 시기에 이별·별거·독립 등의 사건이 생기거나 외로움이 깊어질 수 있습니다. 감정적 결정보다 냉정한 판단이 필요하며, 주변에 도움을 요청하는 것이 고립을 막는 방법입니다.",
    symbol: "🌑",
  },
  겁살: {
    label: "겁살(劫煞)",
    severity: "흉",
    score: -22,
    triggerPairs: [
      ["목", "금"],             // 목이 금에 극을 당함 → 강탈
      ["화", "수"],             // 화가 수에 꺼짐 → 손실
    ],
    desc: "강탈·손실·도난 위험. 투자·이동 시 각별히 주의.",
    detail: "강한 외부 세력이 내 자원을 빼앗아가는 형상으로, 투자 손실·도난·사기·예상치 못한 지출이 발생할 수 있습니다. 이 방위에서의 금전 거래나 귀중품 보관을 피하고, 새로운 투자 결정은 이 시기를 넘긴 후에 하는 것이 안전합니다.",
    symbol: "⚠️",
  },
  백호살: {
    label: "백호살(白虎煞)",
    severity: "대흉",
    score: -28,
    triggerPairs: [
      ["금", "수"],             // 금생수 과잉 → 혈액·수술
      ["금", "금"],             // 금비화 → 칼·금속 사고
    ],
    desc: "혈액·수술·금속 사고 위험. 수술 일정·교통 이동 주의.",
    detail: "날카로운 금속이나 칼날처럼 급격한 사고·수술·혈액 관련 문제가 발생할 수 있는 살입니다. 이 방위로의 장거리 이동, 수술 예약, 위험 작업은 피하고 신체 이상 신호에 민감하게 반응하세요.",
    symbol: "🐯",
  },
};

// 신살 발동 조건 체크 함수
function getSinsalForGung(cheonbanNum, jibanNum) {
  const co = getOhaengChar(cheonbanNum);
  const jo = getOhaengChar(jibanNum);
  const active = [];

  for (const [key, sinsal] of Object.entries(SINSAL)) {
    for (const [t1, t2] of sinsal.triggerPairs) {
      if (co === t1 && jo === t2) {
        active.push({ key, ...sinsal });
        break;
      }
    }
  }
  return active; // 복수 발동 가능
}

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
