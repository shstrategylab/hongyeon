// =====================================================
// engine.js — 홍연기문 핵심 연산 엔진 v2.0 (정밀화)
// 문서 원칙 기준 재구현
//
// 포국 순서:
// 1. 절기 판별 → 양둔/음둔 확정
// 2. 부두일 지지 → 삼원(상/중/하원) 판별
// 3. 기준 국수 도출
// 4. 낙서 경로로 지반 9궁 배치
// 5. 사주 8글자 선천수 합산 → 홍국수(지반수·천반수) 산출
// 6. 천반을 지반 위에 오버레이 배치
// 7. 일간 오행 기준 세궁 도출
// =====================================================


// ── 1. 절기 판별 ──────────────────────────────────
function getCurrentJeolgi(month, day) {
  const today = month * 100 + day;
  let currentKey = "dongji";

  for (const key of JEOLGI_ORDER) {
    const [jMonth, jDay] = JEOLGI_APPROX_DATE[key];
    if (jMonth === 1) continue;
    if (today >= jMonth * 100 + jDay) currentKey = key;
  }

  if (month === 1) {
    if (day >= JEOLGI_APPROX_DATE.daehan[1]) return "daehan";
    if (day >= JEOLGI_APPROX_DATE.sohan[1])  return "sohan";
    return "dongji";
  }
  return currentKey;
}


// ── 2. 부두일(符頭日) 지지 → 삼원 판별 ──────────
// 부두일: 일간이 甲(갑) 또는 己(기)인 날
// 해당 날의 지지로 상원/중원/하원 결정
//
// 간지를 직접 입력한 경우 → 일지(dayJi) 사용
// 미입력 시 → 생월의 지지로 근사
function getSamwon(dayGan, dayJi, monthJi) {
  // 부두일 판별: 일간이 갑 또는 기인 날
  const isBudu = dayGan === "갑" || dayGan === "기";

  // 부두일의 지지로 삼원 결정
  // 부두일이 아닌 경우 해당 60갑자 구간의 부두 지지를 역산하기 어려우므로
  // 일지가 있으면 우선 사용, 없으면 월지로 근사
  const targetJi = dayJi || monthJi || "자";

  for (const [key, val] of Object.entries(SAMWON)) {
    if (val.jijiList.includes(targetJi)) return key;
  }
  return "sang";
}


// ── 3. 기준 국수 도출 ─────────────────────────────
function getBaseGuksu(jeolgiKey, samwonKey) {
  const jeolgi = JEOLGI_DATA[jeolgiKey];
  if (!jeolgi) return { guksu: 1, type: "양둔", jeolgiName: "알 수 없음" };
  return {
    guksu:     jeolgi.guksu[samwonKey],
    type:      jeolgi.type,
    jeolgiName: jeolgi.name,
  };
}


// ── 4. 낙서 경로 배치 ─────────────────────────────
// 고정 낙서 경로(궁 순서): 5→6→7→8→9→1→2→3→4
// 기준국수(S)를 5번궁(중궁)에 놓고 경로 순서대로 +1(양둔) 또는 -1(음둔)
const NAKSEO_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];

function buildJibanBoard(baseGuksu, type) {
  const isYangdun = type === "양둔";
  const jibanBoard = {}; // { 궁번호: 지반수 }

  for (let i = 0; i < 9; i++) {
    const gungNum = NAKSEO_PATH[i];
    let val;
    if (isYangdun) {
      val = ((baseGuksu - 1 + i) % 9) + 1;
    } else {
      val = ((baseGuksu - 1 - i + 900) % 9) + 1;
    }
    jibanBoard[gungNum] = val;
  }
  return jibanBoard;
}


// ── 5. 홍국수 산출 ────────────────────────────────
// 지반 홍국수: 사주 8글자 선천수 합산 → 9로 나눈 나머지
// 천반 홍국수: 천간 4글자 선천수 합산 → 9로 나눈 나머지
function calcHongguksu(saju8, cheongan4) {
  const sum8 = saju8.reduce((acc, ch) => {
    if (CHEONGAN[ch]) return acc + CHEONGAN[ch].num;
    if (JIJI[ch])     return acc + JIJI[ch].num;
    return acc;
  }, 0);

  const sum4 = cheongan4.reduce((acc, ch) => {
    return acc + (CHEONGAN[ch]?.num || 0);
  }, 0);

  const jibanHong  = sum8 % 9 === 0 ? 9 : sum8 % 9;
  const cheonbanHong = sum4 % 9 === 0 ? 9 : sum4 % 9;

  return { jibanHong, cheonbanHong };
}


// ── 6. 천반 오버레이 배치 ─────────────────────────
// 지반 홍국수가 있는 궁을 찾아 천반 홍국수를 그 위에 올리고
// 나머지 천반 숫자는 낙서 경로 따라 순행/역행 배치
function buildCheonbanBoard(jibanBoard, jibanHong, cheonbanHong, type) {
  const isYangdun = type === "양둔";

  // 지반에서 jibanHong이 있는 궁 찾기
  const anchorGung = Object.keys(jibanBoard).find(
    g => jibanBoard[g] === jibanHong
  );
  if (!anchorGung) return {};

  // anchorGung에서 NAKSEO_PATH 상 위치 찾기
  const anchorIdx = NAKSEO_PATH.indexOf(parseInt(anchorGung));

  const cheonbanBoard = {};
  for (let i = 0; i < 9; i++) {
    const gungNum = NAKSEO_PATH[(anchorIdx + i) % 9];
    let val;
    if (isYangdun) {
      val = ((cheonbanHong - 1 + i) % 9) + 1;
    } else {
      val = ((cheonbanHong - 1 - i + 900) % 9) + 1;
    }
    cheonbanBoard[gungNum] = val;
  }
  return cheonbanBoard;
}


// ── 7. 세궁(世宮) 도출 ───────────────────────────
// 세궁 = 일간(日干) 오행이 배속된 구궁
// 일간 오행 → 해당 오행의 구궁 번호
function getSegung(dayGan, jibanBoard) {
  if (!dayGan || !CHEONGAN[dayGan]) return 5; // 기본: 중궁

  const dayOhaeng = CHEONGAN[dayGan].ohaeng; // "목", "화", "토", "금", "수"

  // 오행별 대표 궁 매핑 (홍연기문 기준)
  const ohaengToGung = {
    목: [3, 4],   // 진궁, 손궁
    화: [9],      // 이궁
    토: [2, 5, 8], // 곤궁, 중궁, 간궁
    금: [6, 7],   // 건궁, 태궁
    수: [1],      // 감궁
  };

  const candidates = ohaengToGung[dayOhaeng] || [5];

  // 지반수가 가장 높은 궁(기운이 강한 궁)을 세궁으로
  let segung = candidates[0];
  let maxVal = 0;
  for (const g of candidates) {
    if (jibanBoard[g] > maxVal) {
      maxVal = jibanBoard[g];
      segung = g;
    }
  }
  return segung;
}


// ── 8. 최종 board 조립 ───────────────────────────
function assembleBoard(jibanBoard, cheonbanBoard, segungIndex) {
  const board = {};
  for (const gungNum of NAKSEO_PATH) {
    const jiban  = jibanBoard[gungNum]   || 5;
    const cheon  = cheonbanBoard[gungNum] || 5;
    board[gungNum] = {
      gungNum,
      gungInfo:   GUGUNG[gungNum],
      jibansu:    jiban,
      cheonbansu: cheon,
      isSegung:   gungNum === segungIndex,
      relation:   getRelationType(cheon, jiban),
    };
  }
  return board;
}


// ── 9. 메인 포국 함수 ─────────────────────────────
function runHongyeon(input) {
  const {
    year, month, day, hour, siji,
    yearGan, yearJi, monthGan, monthJi,
    dayGan,  dayJi,  hourGan,  hourJi,
  } = input;

  // 시지 확정 (입력값 우선, 없으면 시간에서 변환)
  const sijiChar = hourJi || siji || getHourToSiji(hour || 12);

  // ① 절기 판별
  const jeolgiKey = getCurrentJeolgi(month, day);

  // ② 삼원 판별 (일간·일지 기준, 미입력 시 월지 근사)
  const samwonKey = getSamwon(dayGan, dayJi, monthJi);

  // ③ 기준 국수
  const { guksu: baseGuksu, type, jeolgiName } = getBaseGuksu(jeolgiKey, samwonKey);

  // ④ 지반 포국 (낙서 경로)
  const jibanBoard = buildJibanBoard(baseGuksu, type);

  // ⑤ 홍국수 산출
  const saju8    = [yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, sijiChar].filter(Boolean);
  const cheongan4 = [yearGan, monthGan, dayGan, hourGan].filter(Boolean);
  const { jibanHong, cheonbanHong } = calcHongguksu(saju8, cheongan4);

  // ⑥ 천반 오버레이
  const cheonbanBoard = buildCheonbanBoard(jibanBoard, jibanHong, cheonbanHong, type);

  // ⑦ 세궁 도출 (일간 오행 기준)
  const segungIndex = getSegung(dayGan, jibanBoard);

  // ⑧ 최종 board 조립
  const board = assembleBoard(jibanBoard, cheonbanBoard, segungIndex);

  // 경고: 간지 미입력 시 정확도 저하 안내
  const hasSaju = !!(yearGan && monthGan && dayGan);
  const warning = hasSaju ? null
    : "사주팔자 간지를 입력하지 않아 절기 기반 근사값으로 포국했습니다. 정확한 풀이를 위해 만세력으로 간지를 확인 후 입력해주세요.";

  return {
    meta: {
      jeolgiKey, jeolgiName, type, baseGuksu, samwonKey,
      sijiChar, warning,
    },
    analysis: {
      jibanHong,
      cheonbanHong,
      segungIndex,
      segungName: GUGUNG[segungIndex]?.name || "",
      dayGanOhaeng: dayGan ? CHEONGAN[dayGan]?.ohaeng : null,
    },
    board,
  };
}


// ── 10. AI 프롬프트 조립 ──────────────────────────
function buildAiPrompt(result, userInput, topic) {
  const { meta, analysis, board } = result;

  const samwonLabel = { sang: "상원(上元)", jung: "중원(中元)", ha: "하원(下元)" };

  const boardText = NAKSEO_PATH.map(gungNum => {
    const g = board[gungNum];
    const r = g.relation;
    const segMark = g.isSegung ? " ★세궁" : "";
    return `  ${g.gungInfo.name}(${g.gungInfo.direction}): 지반${g.jibansu} 천반${g.cheonbansu} [${r.label} ${r.score}점]${segMark}`;
  }).join("\n");

  const topicMap = {
    general:   "전반적인 운세 흐름, 길흉 방위, 주의사항, 추천 행동",
    money:     "재물운과 투자 타이밍에 집중하여 구체적 조언",
    career:    "직장·사업·승진 관련 운세와 최적 행동 시기",
    health:    "건강 주의사항과 건강 회복에 좋은 방위·시기",
    love:      "인간관계·애정운, 좋은 인연을 만나는 방위와 시기",
    direction: "이사·여행에 가장 길한 방위 TOP3와 피해야 할 방위",
  };

  const topicGuide = topicMap[topic] || topicMap.general;

  // 간지 입력 여부에 따라 분기
  const hasSaju = !!(userInput.yearGan && userInput.monthGan && userInput.dayGan);

  // 간지 미입력 시: 내부 지시로만 처리 (출력하지 않음)
  const accuracyNote = hasSaju ? "" : `\
[내부 지침 — 응답에 이 내용을 그대로 출력하지 마세요]
이 포국은 사주팔자 간지 없이 절기 기반 근사값으로 산출되었습니다.
해석 시 다음을 반드시 준수하세요:
- 일간 오행·세궁이 근사치임을 감안해 단정적 표현보다 "가능성", "경향" 위주로 서술
- 해석 본문에 정확도 한계를 언급하지 말 것 (사용자 UX 저해)
- 응답 마지막에 딱 한 줄만, 아래 형식으로 안내 추가:
  "📌 만세력으로 일진 간지를 입력하시면 세궁·용신 연계 정밀 분석이 가능합니다."
`;

  // 간지 입력 시: 정밀 해석 지시
  const precisionNote = hasSaju ? `\
[내부 지침 — 응답에 이 내용을 그대로 출력하지 마세요]
사주팔자 간지가 모두 입력되었습니다.
- 일간(${analysis.dayGanOhaeng} 오행) 기준 용신·기신 관계를 세궁 분석에 반드시 반영
- 세궁 천반·지반 수의 오행 상생·상극 관계를 구체적으로 해석
- 단정적이고 구체적인 시기·방위 조언 제공
` : "";

  return `[시스템 역할]
당신은 홍연기문(홍국기문) 전문 역술가입니다. 아래 포국 데이터와 내부 지침을 바탕으로 심층 운세 해석을 제공하세요.

${accuracyNote}${precisionNote}
---

## 기본 정보
- 생년월일시: ${userInput.year}년 ${userInput.month}월 ${userInput.day}일 (${meta.sijiChar}시)
- 양력/음력: ${userInput.calType === 'solar' ? '양력' : userInput.calType === 'lunar' ? '음력' : '음력 윤달'}
- 성별: ${userInput.gender || '미입력'}

## 절기·포국 정보
- 절기: ${meta.jeolgiName} / ${meta.type} ${meta.baseGuksu}국
- 삼원: ${samwonLabel[meta.samwonKey]}
- 일간 오행: ${analysis.dayGanOhaeng || '미입력 (근사 포국)'}

## 홍국수
- 지반 홍국수: ${analysis.jibanHong}
- 천반 홍국수: ${analysis.cheonbanHong}
- 세궁(世宮): ${analysis.segungIndex}번 ${analysis.segungName}

## 구궁 포국 결과
${boardText}

---

## 해석 요청 (주제: ${topicGuide})
1. 세궁(${analysis.segungName})의 천반·지반 관계와 현재 운세 전체 흐름을 설명해주세요.
2. 가장 길한 방위 TOP 3와 구체적 활용법(이동 방향, 사무실 배치, 기도 방위 등)을 알려주세요.
3. 반드시 피해야 할 흉방과 회피 방법을 알려주세요.
4. ${topicGuide}에 맞춰 실용적이고 구체적인 조언을 해주세요.

한국어로, 실용적이고 구체적으로 답해주세요.`;
}
