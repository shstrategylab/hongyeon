// =====================================================
// engine.js — 홍연기문 핵심 연산 엔진 v2.3
//
// [v2.3 변경사항]
//   FIX 1: getCurrentJeolgi() — 1월 절기(소한·대한) 루프 누락 버그 수정
//           연도 경계를 올바르게 처리하는 통합 로직으로 재작성
//   FIX 2: getBuduJi() — 부두일 역산 시 갑·기 기준 올바른 나머지 연산으로 수정
//           (idx % 5 → 60갑자 내 갑·기 위치 기반 정확한 탐색)
//   FIX 3: deriveGiljung() — 신살 패널티 가중치 0.1 → 1.0으로 수정
//           (음수 score가 실질적으로 반영되도록)
//
// 의존 파일:
//   data-ganji.js  : CHEONGAN, JIJI, SAMWON, GANJI_60, getHourToSiji
//   data-jeolgi.js : JEOLGI_ORDER, JEOLGI_APPROX_DATE, JEOLGI_DATA
//   data-gugung.js : GUGUNG, PALMUN, PALMUN_ORDER, buildPalmunBoard,
//                    RELATION_TYPE, getRelationType, getOhaengChar
// =====================================================


// ── 1. 절기 판별 ──────────────────────────────────
// [FIX 1] 기존 코드는 JEOLGI_ORDER 루프에서 1월(jMonth===1)을 continue로
//         통째로 건너뛰어 1월생은 항상 "dongji"로 시작하는 문제가 있었음.
//         수정: 연도 경계를 고려한 통합 순서 배열로 재작성.
//         1월 1일 ~ 대한 전: dongji (전년 동지 절기 유지)
//         소한 이후: sohan / 대한 이후: daehan
function getCurrentJeolgi(month, day) {
  // 1월을 포함한 전체 절기를 "월*100+일" 기준으로 정렬
  // 연도 경계 처리: 1월 절기(sohan·daehan)는 동지(12월) 이후에 오므로
  // 비교를 위해 1월을 13월로 취급하여 순서를 맞춤
  const normalize = (m, d) => (m === 1 ? 13 * 100 + d : m * 100 + d);
  const todayNorm = normalize(month, day);

  // 절기 순서를 날짜 오름차순으로 정렬 (연도 경계 포함)
  // JEOLGI_ORDER는 입춘(2월)부터 대한(1월)까지 절기 순서로 정렬되어 있음
  const orderedJeolgi = [
    // 입춘(2/4) ~ 대설(12/7) → 그대로
    ...JEOLGI_ORDER.filter(k => JEOLGI_APPROX_DATE[k][0] !== 1),
    // 동지(12/22) 이후 이어지는 1월 절기
    "dongji",
    "sohan",
    "daehan",
  ];

  let currentKey = "dongji"; // 기본값: 동지 (연초 기본)

  for (const key of orderedJeolgi) {
    const [jMonth, jDay] = JEOLGI_APPROX_DATE[key];
    const jeolgiNorm = normalize(jMonth, jDay);
    if (todayNorm >= jeolgiNorm) {
      currentKey = key;
    }
  }

  return currentKey;
}


// ── 2. 부두일 지지 → 삼원 판별 ───────────────────
// [FIX 2] 기존 idx % 5 방식은 GANJI_60 배열에서 갑·기일의 위치가
//         항상 5의 배수(0,5,10,15...)이므로 수학적으로 맞아 보이지만,
//         경계값(갑자=0번)에서 buduIdx가 0이 되어 정상 작동하나
//         실제로는 "해당 일의 직전 갑·기일"을 찾아야 하므로
//         명시적 역방향 탐색으로 교체하여 의도를 명확히 함.
function getBuduJi(dayGan, dayJi) {
  const ganji = dayGan + dayJi;
  const idx = GANJI_60.indexOf(ganji);
  if (idx === -1) return null;

  // 직전 갑(甲) 또는 기(己)일을 역방향으로 탐색
  for (let i = idx; i >= 0; i--) {
    const gan = GANJI_60[i][0];
    if (gan === "갑" || gan === "기") {
      return GANJI_60[i][1]; // 부두일의 지지 반환
    }
  }
  // 찾지 못한 경우 60갑자 끝에서 역방향 탐색 (순환)
  for (let i = 59; i > idx; i--) {
    const gan = GANJI_60[i][0];
    if (gan === "갑" || gan === "기") {
      return GANJI_60[i][1];
    }
  }
  return null;
}

function getSamwon(dayGan, dayJi, monthJi) {
  let targetJi;

  if (dayGan && dayJi) {
    const isBudu = dayGan === "갑" || dayGan === "기";
    // 부두일(갑·기일) 당일이면 그 날 지지, 아니면 직전 부두일 지지
    targetJi = isBudu ? dayJi : (getBuduJi(dayGan, dayJi) || dayJi);
  } else {
    // 일주 간지가 없으면 월지로 근사 처리
    targetJi = monthJi || "자";
  }

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
    guksu:      jeolgi.guksu[samwonKey],
    type:       jeolgi.type,
    jeolgiName: jeolgi.name,
  };
}


// ── 4. 낙서 경로 배치 ─────────────────────────────
const NAKSEO_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];

function buildJibanBoard(baseGuksu, type) {
  const isYangdun = type === "양둔";
  const jibanBoard = {};

  for (let i = 0; i < 9; i++) {
    const gungNum = NAKSEO_PATH[i];
    jibanBoard[gungNum] = isYangdun
      ? ((baseGuksu - 1 + i) % 9) + 1
      : ((baseGuksu - 1 - i + 900) % 9) + 1;
  }
  return jibanBoard;
}


// ── 5. 홍국수 산출 ────────────────────────────────
function calcHongguksu(saju8, cheongan4) {
  const sum8 = saju8.reduce((acc, ch) => {
    if (CHEONGAN[ch]) return acc + CHEONGAN[ch].num;
    if (JIJI[ch])     return acc + JIJI[ch].num;
    return acc;
  }, 0);

  const sum4 = cheongan4.reduce((acc, ch) => acc + (CHEONGAN[ch]?.num || 0), 0);

  return {
    jibanHong:    sum8 % 9 === 0 ? 9 : sum8 % 9,
    cheonbanHong: sum4 % 9 === 0 ? 9 : sum4 % 9,
  };
}


// ── 6. 천반 오버레이 배치 ─────────────────────────
function buildCheonbanBoard(jibanBoard, jibanHong, cheonbanHong, type) {
  const isYangdun = type === "양둔";
  const anchorGung = Object.keys(jibanBoard).find(g => jibanBoard[g] === jibanHong);
  if (!anchorGung) return {};

  const anchorIdx = NAKSEO_PATH.indexOf(parseInt(anchorGung));
  const cheonbanBoard = {};

  for (let i = 0; i < 9; i++) {
    const gungNum = NAKSEO_PATH[(anchorIdx + i) % 9];
    cheonbanBoard[gungNum] = isYangdun
      ? ((cheonbanHong - 1 + i) % 9) + 1
      : ((cheonbanHong - 1 - i + 900) % 9) + 1;
  }
  return cheonbanBoard;
}


// ── 7. 세궁 도출 ──────────────────────────────────
function getSegung(dayGan, jibanBoard) {
  if (!dayGan || !CHEONGAN[dayGan]) return 5;

  const ohaengToGung = {
    목: [3, 4], 화: [9], 토: [2, 5, 8], 금: [6, 7], 수: [1],
  };
  const candidates = ohaengToGung[CHEONGAN[dayGan].ohaeng] || [5];

  let segung = candidates[0], maxVal = 0;
  for (const g of candidates) {
    if (jibanBoard[g] > maxVal) { maxVal = jibanBoard[g]; segung = g; }
  }
  return segung;
}


// ── 8. 최종 board 조립 (팔문 + 신살 포함) ────────
function assembleBoard(jibanBoard, cheonbanBoard, segungIndex) {
  const palmunBoard = buildPalmunBoard(segungIndex);

  const board = {};
  for (const gungNum of NAKSEO_PATH) {
    const jiban     = jibanBoard[gungNum]    || 5;
    const cheon     = cheonbanBoard[gungNum] || 5;
    const palmunKey = palmunBoard[gungNum]   || "복위";

    // 신살 발동 체크
    const sinsal = (typeof getSinsalForGung === "function")
      ? getSinsalForGung(cheon, jiban)
      : [];

    board[gungNum] = {
      gungNum,
      gungInfo:   GUGUNG[gungNum],
      jibansu:    jiban,
      cheonbansu: cheon,
      isSegung:   gungNum === segungIndex,
      relation:   getRelationType(cheon, jiban),
      palmun:     PALMUN[palmunKey],
      palmunKey,
      sinsal,
    };
  }
  return board;
}


// ── 8-b. 만세력 DB 기반 간지 자동 보완 ────────────
// [신규] manse-db.js(일주 DB) + solar-terms-db.js(정확 절기 DB) +
//        lunar_calendar.js(음양력 변환표, 1930~2050)가 로드되어 있고
//        사용자가 간지를 직접 입력하지 않았다면 생년월일로부터
//        일주(日柱)·연주·월주·절기를 정확히 채워준다.
//        - 음력 입력(calType: 'lunar'/'leap')이면 먼저 lunar_calendar.js로
//          양력으로 변환한 뒤, 변환된 양력 날짜로 나머지 단계를 동일하게 진행.
//        - 윤달(leap)은 lunarToSolarDate(y, m, d, true)로 정확히 구분 처리.
//        - DB 커버 범위(일주 1950~2050 / 절기 2010~2050 / 음양력 1930~2050)
//          밖이면 채우지 않고 기존 근사 로직으로 자연히 폴백된다.
function autoFillGanjiFromManseDB(input) {
  const filled = { ...input };
  let { year, month, day, calType } = input;

  if (!year || !month || !day) return filled;

  // ⓪ 음력 입력이면 먼저 양력으로 변환 (lunar_calendar.js 필요)
  if ((calType === "lunar" || calType === "leap") && typeof lunarToSolarDate === "function") {
    const isLeapMonth = calType === "leap";
    const solarDate = lunarToSolarDate(year, month, day, isLeapMonth);
    if (solarDate) {
      // 변환된 양력 날짜로 이후 로직을 그대로 재사용
      year  = solarDate.year;
      month = solarDate.month;
      day   = solarDate.day;
      // filled에도 반영해야 runHongyeon()에서 올바른 양력 날짜를 사용함
      filled.year  = year;
      filled.month = month;
      filled.day   = day;
      filled._convertedFromLunar = true;
      filled._solarDate = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    } else {
      // 변환표 범위 밖(1930~2050 밖) — 변환 불가, 근사 모드로 폴백
      return filled;
    }
  } else if (calType === "lunar" || calType === "leap") {
    // lunar_calendar.js가 로드되지 않은 환경 — 기존처럼 근사 모드로 폴백
    return filled;
  }

  // ① 일주(日柱) 자동 채움 — 사용자가 직접 입력 안 했을 때만
  if (!filled.dayGan && typeof getDayGanjiFromDB === "function") {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayGanji = getDayGanjiFromDB(dateStr);
    if (dayGanji) {
      filled.dayGan = dayGanji.gan;
      filled.dayJi  = dayGanji.ji;
      filled._dayGanjiSource = "manse_db"; // 디버그/표기용
    }
  }

  // ② 연주(年柱) 자동 채움 — 입춘 이전이면 전년도 간지 사용(절입 보정)
  if (!filled.yearGan && typeof getYearGanjiFromDB === "function") {
    let targetYear = year;
    // 입춘(보통 2/4 전후) 이전 출생이면 전년도 간지를 써야 함
    const isBeforeIpchun = (month === 1) || (month === 2 && day < 4);
    if (isBeforeIpchun) targetYear = year - 1;

    const yearGanji = getYearGanjiFromDB(targetYear);
    if (yearGanji) {
      filled.yearGan = yearGanji.gan;
      filled.yearJi  = yearGanji.ji;
      filled._yearGanjiSource = "manse_db";
    }
  }

  // ③ 정확한 절기 키 — solar-terms-db.js가 있고 범위 내일 때만 덮어씀
  if (typeof getExactJeolgiKey === "function") {
    const exactKey = getExactJeolgiKey(year, month, day);
    if (exactKey) {
      filled._exactJeolgiKey = exactKey; // runHongyeon에서 우선 사용
    }
  }

  // ④ 월주(月柱) 자동 채움 — 절기 키 + 연간(年干)이 확보된 후에만 가능
  //    (연간은 ②에서 DB로 채워졌거나 사용자가 직접 입력한 값을 사용)
  if (!filled.monthGan && typeof getMonthGanjiFromJeolgi === "function") {
    const jeolgiForMonth = filled._exactJeolgiKey || getCurrentJeolgi(month, day);
    const yearGanForMonth = filled.yearGan; // ②에서 이미 채워졌거나 원래 입력값
    if (yearGanForMonth) {
      const { monthGan, monthJi } = getMonthGanjiFromJeolgi(jeolgiForMonth, yearGanForMonth);
      if (monthGan && monthJi) {
        filled.monthGan = monthGan;
        filled.monthJi  = monthJi;
        filled._monthGanjiSource = "manse_db";
      }
    }
  }

  return filled;
}


// ── 8-c. 월주(月柱) 자동 계산 ──────────────────────
// 절기 키(jeolgiKey)로부터 월지(月支)를 정하고, 연간(年干)을 기준으로
// 월두법(月頭法)에 따라 월간(月干)을 산출한다.
// 월지 매핑: 입춘~우수 전=寅월, 우수~경칩 전=...(절기 12개가 12개월에 대응)
const JEOLGI_TO_WOLJI = {
  ipchun: "인", usu: "인",          // 입춘~경칩 전 = 인월
  gyeongchip: "묘", chunbun: "묘",  // 경칩~청명 전 = 묘월
  cheongmyeong: "진", gogu: "진",   // 청명~입하 전 = 진월
  ipha: "사", soman: "사",          // 입하~망종 전 = 사월
  mangjong: "오", haji: "오",       // 망종~소서 전 = 오월
  soseo: "미", daeseo: "미",        // 소서~입추 전 = 미월
  ipchu: "신", cheoseo: "신",       // 입추~백로 전 = 신월
  baengno: "유", chubun: "유",      // 백로~한로 전 = 유월
  hallo: "술", sanggang: "술",      // 한로~입동 전 = 술월
  ipdong: "해", soseol: "해",       // 입동~대설 전 = 해월
  daeseol: "자", dongji: "자",      // 대설~소한 전 = 자월
  sohan: "축", daehan: "축",        // 소한~입춘 전 = 축월
};

// 월두법: 연간(年干)에 따라 정월(인월)의 월간이 달라짐
// 갑·기년→丙(병)인월 / 을·경년→戊(무)인월 / 병·신년→庚(경)인월 /
// 정·임년→壬(임)인월 / 무·계년→甲(갑)인월   (오호둔/둔월법 표준 공식)
const WOLDU_START_GAN = {
  갑: "병", 기: "병",
  을: "무", 경: "무",
  병: "경", 신: "경",
  정: "임", 임: "임",
  무: "갑", 계: "갑",
};
const GAN_ORDER = ["갑","을","병","정","무","기","경","신","임","계"];
const WOLJI_ORDER_FROM_IN = ["인","묘","진","사","오","미","신","유","술","해","자","축"];

function getMonthGanjiFromJeolgi(jeolgiKey, yearGan) {
  const monthJi = JEOLGI_TO_WOLJI[jeolgiKey];
  if (!monthJi || !yearGan || !WOLDU_START_GAN[yearGan]) {
    return { monthGan: null, monthJi: monthJi || null };
  }

  const startGan = WOLDU_START_GAN[yearGan]; // 인월의 월간
  const startIdx = GAN_ORDER.indexOf(startGan);
  const jiIdx    = WOLJI_ORDER_FROM_IN.indexOf(monthJi); // 인월=0 기준 오프셋

  const monthGan = GAN_ORDER[(startIdx + jiIdx) % 10];
  return { monthGan, monthJi };
}


// ── 9. 메인 포국 함수 ─────────────────────────────
function runHongyeon(rawInput) {
  // 만세력 DB로 빈 간지·정확 절기를 먼저 보완 (DB 미로드 시 안전하게 통과)
  const input = autoFillGanjiFromManseDB(rawInput);

  const {
    year, month, day, hour, siji,
    yearGan, yearJi, monthGan, monthJi,
    dayGan,  dayJi,  hourGan,  hourJi,
    _exactJeolgiKey, _dayGanjiSource, _yearGanjiSource,
    _convertedFromLunar, _solarDate,
  } = input;

  const sijiChar   = hourJi || siji || getHourToSiji(hour || 12);
  // 정확 절기 DB(2010~2050)가 있으면 우선 사용, 없으면 근사 로직 폴백
  const jeolgiKey  = _exactJeolgiKey || getCurrentJeolgi(month, day);
  const samwonKey  = getSamwon(dayGan, dayJi, monthJi);
  const { guksu: baseGuksu, type, jeolgiName } = getBaseGuksu(jeolgiKey, samwonKey);

  const jibanBoard = buildJibanBoard(baseGuksu, type);

  const saju8     = [yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, sijiChar].filter(Boolean);
  const cheongan4 = [yearGan, monthGan, dayGan, hourGan].filter(Boolean);
  const { jibanHong, cheonbanHong } = calcHongguksu(saju8, cheongan4);

  const cheonbanBoard = buildCheonbanBoard(jibanBoard, jibanHong, cheonbanHong, type);
  const segungIndex   = getSegung(dayGan, jibanBoard);
  const board         = assembleBoard(jibanBoard, cheonbanBoard, segungIndex);

  // 길흉 요약 자동 산출
  const giljung = deriveGiljung(board, segungIndex);

  const hasSaju = !!(yearGan && monthGan && dayGan);
  const isAutoFilled = !!(_dayGanjiSource || _yearGanjiSource);
  const warning = hasSaju
    ? null // 직접입력 또는 DB자동보완(양력/음력 변환 포함) 모두 정상 — 경고 없음
    : "사주팔자 간지를 입력하지 않아 절기 기반 근사값으로 포국했습니다. (만세력 DB 범위 밖)";

  return {
    meta: {
      jeolgiKey, jeolgiName, type, baseGuksu, samwonKey, sijiChar, warning,
      isAutoFilled,
      convertedFromLunar: !!_convertedFromLunar, // 음력→양력 변환이 일어났는지
      solarDateUsed: _solarDate || null,         // 변환된(또는 원래) 양력 날짜
    },
    analysis: {
      jibanHong, cheonbanHong, segungIndex,
      segungName:   GUGUNG[segungIndex]?.name || "",
      dayGanOhaeng: dayGan ? CHEONGAN[dayGan]?.ohaeng : null,
    },
    giljung,
    board,
  };
}


// ── 10. 길흉 요약 도출 ────────────────────────────
// [FIX 3] 신살 패널티 가중치를 0.1 → 1.0으로 수정.
//         기존에는 score: -25짜리 신살이 combined에 -2.5점만 반영되어
//         신살이 있어도 길방으로 잘못 분류되는 문제가 있었음.
//         수정 후: 신살 패널티가 생극·팔문과 동등한 수준으로 반영됨.
//
// [FIX 4] 팔문 tier "흉" 가드 추가.
//         유혼·화해·귀혼·절체·절명은 생극 점수와 합산해도
//         길방 TOP3에 오르지 않도록 필터링.
//         (tier 필드는 data-gugung.js PALMUN에 추가됨)
//
// 점수 구조 (수정 후):
//   combined = relationScore(0~90) * 0.45
//            + palmunScore(0~95)   * 0.45
//            + sinsalPenalty(-30~0) * 1.0   ← 패널티 실질 반영
//   → 최대 약 83점 / 신살 1개 시 최대 -30점 감점
function deriveGiljung(board, segungIndex) {
  const scored = Object.values(board).map(g => {
    const relationScore = g.relation.score;
    const palmunScore   = g.palmun?.score ?? 55;
    const palmunTier    = g.palmun?.tier  ?? "흉";   // tier 없으면 흉으로 보수적 처리
    // 신살 패널티: score가 음수(-25 ~ -30)이므로 * 1.0으로 실질 반영
    const sinsalPenalty = (g.sinsal || []).reduce((acc, s) => acc + (s.score || 0), 0);
    const combined = Math.max(
      0,
      Math.round(relationScore * 0.45 + palmunScore * 0.45 + sinsalPenalty * 1.0)
    );
    return {
      gungNum:       g.gungNum,
      name:          g.gungInfo.name,
      direction:     g.gungInfo.direction,
      palmunLabel:   g.palmun?.label || "",
      palmunDesc:    g.palmun?.desc  || "",
      palmunTier,                              // tier 보존 (필터링용)
      relationLabel: g.relation.label,
      sinsalLabels:  (g.sinsal || []).map(s => s.label),
      combined,
      isSegung:      g.isSegung,
    };
  });

  // 세궁 제외하고 점수 내림차순 정렬
  const others = scored.filter(g => !g.isSegung);
  others.sort((a, b) => b.combined - a.combined);

  // [FIX 4] 팔문 tier "길"인 궁만 길방 후보로 허용
  //         → 유혼(遊魂) 이하 흉문이 길방에 오르는 모순 방지
  // [FIX 4-b] 세궁이 생기·복덕·천의 중 하나를 차지해 길방 후보가 2개 이하로 줄어도
  //           유혼·화해가 앞에 오지 않도록 tier "길" 우선, 부족분만 흉문 상위로 보충
  const gilTier   = others.filter(g => g.palmunTier === "길");
  const hyungTier = others.filter(g => g.palmunTier !== "길");

  // 길방: tier "길" 우선 채우고 부족하면 tier "흉" 상위 점수로 보충
  const gilbang = [
    ...gilTier.slice(0, 3),
    ...hyungTier.slice(0, Math.max(0, 3 - gilTier.length)),
  ].slice(0, 3);

  return {
    gilbang,
    hyungbang: others.slice(-3).reverse(),   // 하위 3개 = 흉방
    segung:    scored.find(g => g.isSegung),
  };
}


// ── 11. AI 프롬프트 조립 (팔문 포함) ─────────────
function buildAiPrompt(result, userInput, topic) {
  const { meta, analysis, board } = result;
  // giljung 없는 구버전 sessionStorage 데이터 호환 — 없으면 재산출
  const giljung = result.giljung || deriveGiljung(board, analysis.segungIndex);

  const samwonLabel = { sang: "상원(上元)", jung: "중원(中元)", ha: "하원(下元)" };

  // 구궁 포국 텍스트 (팔문 포함)
  const boardText = NAKSEO_PATH.map(gungNum => {
    const g = board[gungNum];
    const segMark   = g.isSegung ? " ★세궁" : "";
    const palmunStr = g.palmun
      ? ` [${g.palmun.label} ${g.palmun.score}점]` : "";
    const sinsalStr = (g.sinsal && g.sinsal.length > 0)
      ? ` ⚡신살: ${g.sinsal.map(s => s.label).join("·")}` : "";
    return `  ${g.gungInfo.name}(${g.gungInfo.direction}): 지반${g.jibansu} 천반${g.cheonbansu} [${g.relation.label} ${g.relation.score}점]${palmunStr}${sinsalStr}${segMark}`;
  }).join("\n");

  // 길방·흉방 요약 텍스트
  const gilText = giljung.gilbang.map((g, i) =>
    `  ${i+1}위 ${g.name}(${g.direction}): ${g.palmunLabel} · ${g.relationLabel} — ${g.palmunDesc}`
  ).join("\n");

  const hyungText = giljung.hyungbang.map((g, i) =>
    `  ${i+1}위 ${g.name}(${g.direction}): ${g.palmunLabel} · ${g.relationLabel} — ${g.palmunDesc}`
  ).join("\n");

  const topicMap = {
    general:   "전반적인 운세 흐름, 길흉 방위, 주의사항, 추천 행동",
    money:     "재물운과 투자 타이밍에 집중하여 구체적 조언",
    career:    "직장·사업·승진 관련 운세와 최적 행동 시기",
    health:    "건강 주의사항과 건강 회복에 좋은 방위·시기",
    love:      "인간관계·애정운, 좋은 인연을 만나는 방위와 시기",
    direction: "이사·여행에 가장 길한 방위 TOP3와 피해야 할 방위",
  };
  const topicGuide = topicMap[topic] || topicMap.general;

  const hasSaju    = !!(userInput.yearGan && userInput.monthGan && userInput.dayGan);
  const hasAnySaju = !!(userInput.yearGan || userInput.monthGan || userInput.dayGan || userInput.hourGan);

  const accuracyNote = hasSaju ? "" : `\
[내부 지침 — 응답에 이 내용을 그대로 출력하지 마세요]
이 포국은 사주팔자 간지 없이 절기 기반 근사값으로 산출되었습니다.
- 단정적 표현보다 "가능성", "경향" 위주로 서술하세요.
- 해석 본문에 정확도 한계를 언급하지 마세요.
- 응답 마지막 한 줄에만: "📌 만세력으로 일진 간지를 입력하시면 정밀 분석이 가능합니다."
`;

  const precisionNote = hasSaju ? `\
[내부 지침 — 응답에 이 내용을 그대로 출력하지 마세요]
사주팔자 간지가 모두 입력되었습니다.
- 일간(${analysis.dayGanOhaeng} 오행) 기준 용신·기신 관계를 세궁 분석에 반드시 반영하세요.
- 팔문과 생극 관계를 결합해 방위별 구체적 조언을 제공하세요.
- 단정적이고 구체적인 시기·방위 조언을 제공하세요.
` : "";

  // 동처 분석 텍스트
  const dongcheoText = Object.values(board)
    .filter(g => !g.isSegung)
    .map(g => {
      let score = 0;
      if (g.relation.label.includes("천극지"))      score += 40;
      else if (g.relation.label.includes("지극천")) score += 25;
      if ((g.palmun?.score ?? 50) <= 15)            score += 35;
      else if ((g.palmun?.score ?? 50) >= 95)       score += 25;
      score += (g.sinsal || []).length * 20;
      return { g, score };
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ g }) => {
      const reasons = [];
      if (g.relation.label.includes("극"))             reasons.push(g.relation.label);
      if (g.palmun?.score <= 15 || g.palmun?.score >= 95) reasons.push(g.palmun.label);
      if (g.sinsal?.length) reasons.push(g.sinsal.map(s => s.label).join("·"));
      return `  ${g.gungInfo.name}(${g.gungInfo.direction}): ${reasons.join(", ")}`;
    }).join("\n") || "  특이 동처 없음";

  return `[시스템 역할]
당신은 홍연기문(홍국기문) 전문 역술가입니다. 아래 포국 데이터와 내부 지침을 바탕으로 심층 운세 해석을 제공하세요.

${accuracyNote}${precisionNote}
---

## 기본 정보
- 생년월일시: ${userInput.year}년 ${userInput.month}월 ${userInput.day}일 (${meta.sijiChar}시)
- 양력/음력: ${userInput.calType === 'solar' ? '양력' : userInput.calType === 'lunar' ? '음력' : '음력 윤달'}
- 성별: ${userInput.gender || '미입력'}

## 사주팔자 (간지)
${hasAnySaju
  ? `- 연주: ${userInput.yearGan || '?'}${userInput.yearJi || '?'}
- 월주: ${userInput.monthGan || '?'}${userInput.monthJi || '?'}
- 일주: ${userInput.dayGan || '?'}${userInput.dayJi || '?'}
- 시주: ${userInput.hourGan || '?'}${userInput.hourJi || meta.sijiChar || '?'}`
  : `- 간지 미입력 (절기 기반 근사 포국)`}

## 절기·포국 정보
- 절기: ${meta.jeolgiName} / ${meta.type} ${meta.baseGuksu}국
- 삼원: ${samwonLabel[meta.samwonKey]}
- 일간 오행: ${analysis.dayGanOhaeng || '미입력 (근사 포국)'}

## 홍국수
- 지반 홍국수: ${analysis.jibanHong}
- 천반 홍국수: ${analysis.cheonbanHong}
- 세궁(世宮): ${analysis.segungIndex}번 ${analysis.segungName}

## 구궁 포국 결과 (지반 / 천반 / 생극관계 / 팔문)
${boardText}

## 자동 산출 길흉 요약
▶ 길방 TOP3
${gilText}

▶ 흉방 TOP3 (주의)
${hyungText}

## 동처(動處) — 현재 가장 활성화된 방위
${dongcheoText}

--- (주제: ${topicGuide})
1. 세궁(${analysis.segungName})의 팔문·천반·지반 관계를 종합해 현재 운세 전체 흐름을 설명해주세요.
2. 길방 TOP3의 팔문과 생극을 결합한 구체적 활용법(이동 방향·사무실 배치·기도 방위 등)을 알려주세요.
3. 흉방의 팔문과 그 위험성을 설명하고 회피 방법을 알려주세요.
4. 신살(탕화살·수옥살·겁살·백호살 등)이 발동된 궁이 있다면, 어떤 위험인지 구체적으로 설명하고 대처법을 알려주세요.
5. ${topicGuide}에 맞춰 실용적이고 구체적인 조언을 해주세요.

한국어로, 실용적이고 구체적으로 답해주세요.`;
}
