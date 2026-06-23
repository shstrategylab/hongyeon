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
// tier: "길" = 길방 후보 가능 / "흉" = 길방 후보 제외 (생극이 아무리 좋아도)
// [수정] 유혼 score 45→35 로 하향, tier:"흉" 추가
//        유혼은 불안정·방황을 뜻하므로 길방 TOP3에 오르면 사용자 혼란 유발
const PALMUN = {
  생기: { label: "생기(生氣)", score: 95, tier: "길", desc: "최고의 길방. 새 출발·사업·이사에 최적." },
  복덕: { label: "복덕(福德)", score: 85, tier: "길", desc: "복과 재물이 따르는 길방." },
  천의: { label: "천의(天醫)", score: 80, tier: "길", desc: "건강·치유·문서 계약에 유리." },
  유혼: { label: "유혼(遊魂)", score: 35, tier: "흉", desc: "방황·불안정. 신중한 행동 요구." },
  화해: { label: "화해(禍害)", score: 30, tier: "흉", desc: "작은 재앙. 구설·다툼 주의." },
  귀혼: { label: "귀혼(歸魂)", score: 25, tier: "흉", desc: "퇴보·후퇴. 현상 유지가 최선." },
  절체: { label: "절체(絶體)", score: 15, tier: "흉", desc: "막힘·차단. 큰일 금물." },
  절명: { label: "절명(絶命)", score: 5,  tier: "흉", desc: "최흉방. 이동·건축·계약 절대 금지." },
  // [BUG FIX] 복위(伏位): buildPalmunBoard에서 9번째 궁에 배속되지만 PALMUN에 정의가
  //           없어 assembleBoard에서 palmun이 undefined → tier 기본값 "흉"으로 처리되던
  //           버그 수정. 복위는 안정·중립 성격으로 tier:"중" 부여.
  복위: { label: "복위(伏位)", score: 55, tier: "중", desc: "안정·중립. 현상 유지에 무난한 방위." },
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

// ── 홍국수(洪局數) 육친(六親) 배속 ─────────────────
// 정통 홍연기문의 핵심: 일간(日干) 오행을 기준으로, 각 궁에 앉은
// 지반/천반 홍국수(1~9)의 오행이 일간과 어떤 생극 관계인지 따져
// 비겁·식상·재성·관성·인성 다섯 갈래로 분류한다.
// (자평명리 육친 산출법과 동일한 원리 — "나(일간)"를 기준점으로 삼음)
const YUKCHIN_LABEL = {
  비겁: "비겁(比劫)",   // 일간과 같은 오행 — 나 자신·형제·동료·경쟁
  식상: "식상(食傷)",   // 일간이 생(生)하는 오행 — 활동·표현·자식·소비
  재성: "재성(財星)",   // 일간이 극(剋)하는 오행 — 재물·결과물·배우자(남)
  관성: "관성(官星)",   // 일간을 극(剋)하는 오행 — 직위·명예·통제·배우자(여)
  인성: "인성(印星)",   // 일간을 생(生)하는 오행 — 문서·학문·도움·부모
};

// ilganOhaeng: 일간의 오행("목"·"화"·"토"·"금"·"수")
// targetOhaeng: 비교 대상(홍국수)의 오행
// 반환: YUKCHIN_LABEL의 값 중 하나, 또는 판별 불가 시 null
function getYukchin(ilganOhaeng, targetOhaeng) {
  if (!ilganOhaeng || !targetOhaeng) return null;
  if (ilganOhaeng === targetOhaeng) return YUKCHIN_LABEL.비겁;
  if (OHAENG_RULE.생[ilganOhaeng] === targetOhaeng) return YUKCHIN_LABEL.식상; // 내가 생함
  if (OHAENG_RULE.생[targetOhaeng] === ilganOhaeng) return YUKCHIN_LABEL.인성; // 나를 생함
  if (OHAENG_RULE.극[ilganOhaeng] === targetOhaeng) return YUKCHIN_LABEL.재성; // 내가 극함
  if (OHAENG_RULE.극[targetOhaeng] === ilganOhaeng) return YUKCHIN_LABEL.관성; // 나를 극함
  return null;
}

// 육친별 한 줄 의미 + 길흉 시 주의점 (해석 텍스트용)
const YUKCHIN_MEANING = {
  "비겁(比劫)": { keyword: "자립·경쟁·협업", desc: "스스로의 힘, 동료·형제·경쟁자와 관련된 기운입니다. 이 방위는 협업이나 동업, 경쟁 구도와 관련된 일에 영향을 줍니다." },
  "식상(食傷)": { keyword: "활동·표현·소비", desc: "내가 밖으로 펼치는 활동력과 표현력, 자식·아랫사람과 관련된 기운입니다. 이 방위는 사업 확장, 표현, 지출과 관련된 일에 영향을 줍니다." },
  "재성(財星)": { keyword: "재물·결과물", desc: "내가 직접 다루고 통제하는 재물·자원과 관련된 기운입니다. 이 방위는 돈, 재산, 거래와 관련된 일에 영향을 줍니다." },
  "관성(官星)": { keyword: "직위·명예·통제", desc: "나를 통제하거나 사회적 지위·명예를 부여하는 기운입니다. 이 방위는 직장, 승진, 시험, 법적 권위와 관련된 일에 영향을 줍니다." },
  "인성(印星)": { keyword: "문서·학문·후원", desc: "나를 돕고 길러주는 문서·학문·윗사람의 후원과 관련된 기운입니다. 이 방위는 계약, 공부, 인허가, 윗사람의 도움과 관련된 일에 영향을 줍니다." },
};

// ── 팔문 배속 함수 ────────────────────────────────
// 세궁(世宮)을 기준으로 낙서 순방향에 팔문 8개 배속
// 나머지 1궁 = 복위(안정·중립)
const PALMUN_ORDER = ["생기","복덕","천의","유혼","화해","귀혼","절체","절명"];

function buildPalmunBoard(segungIndex) {
  // [BUG FIX] 기존 코드는 세궁 위치(startIdx)부터 팔문을 배치해
  //           세궁 자신이 "생기"를 받고, 8번째 다음 궁이 "복위"가 되는 오류 발생.
  //           홍연기문 원칙: 세궁(世宮) 자신은 항상 복위(伏位).
  //           팔문 8개는 세궁 다음 궁부터 낙서 순방향으로 배속.
  const startIdx = NAKSEO_PATH.indexOf(segungIndex);
  const palmunBoard = {};

  // 세궁 자신 = 복위
  palmunBoard[segungIndex] = "복위";

  // 세궁 다음 궁부터 순방향으로 팔문 8개 배속
  for (let i = 0; i < 8; i++) {
    const gungNum = NAKSEO_PATH[(startIdx + 1 + i) % 9];
    palmunBoard[gungNum] = PALMUN_ORDER[i];
  }

  return palmunBoard;
}
