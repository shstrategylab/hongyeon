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
// [v2.4 변경] 계산식(만세력 DB) 우선 원칙: 사용자가 간지를 직접 입력했더라도
//        DB로 정확히 계산 가능하면 계산값을 최종값으로 사용한다.
//        사용자가 직접 입력한 값은 _userXxx 필드에 그대로 보존해
//        runHongyeon()에서 "직접입력 vs 계산값" 비교에 활용한다.
//        DB 커버 범위(일주 1950~2050 / 절기 2010~2050 / 음양력 1930~2050)
//        밖이면 계산이 불가능하므로, 그 경우에 한해 사용자 입력값을 그대로 쓴다.
function autoFillGanjiFromManseDB(input) {
  const filled = { ...input };
  let { year, month, day, calType } = input;

  // 사용자가 직접 입력한 간지를 비교/검산용으로 먼저 보존해둔다.
  filled._userYearGan  = input.yearGan  || null;
  filled._userYearJi   = input.yearJi   || null;
  filled._userMonthGan = input.monthGan || null;
  filled._userMonthJi  = input.monthJi  || null;
  filled._userDayGan   = input.dayGan   || null;
  filled._userDayJi    = input.dayJi    || null;
  filled._userHourGan  = input.hourGan  || null;
  filled._userHourJi   = input.hourJi   || null;

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
      // 변환표 범위 밖(1930~2050 밖) — 변환 불가, 입력값 그대로 폴백
      return filled;
    }
  } else if (calType === "lunar" || calType === "leap") {
    // lunar_calendar.js가 로드되지 않은 환경 — 기존처럼 입력값 그대로 폴백
    return filled;
  }

  // ① 일주(日柱) — 계산식 우선 (직접 입력했어도 DB 계산값으로 덮어씀)
  if (typeof getDayGanjiFromDB === "function") {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayGanji = getDayGanjiFromDB(dateStr);
    if (dayGanji) {
      filled.dayGan = dayGanji.gan;
      filled.dayJi  = dayGanji.ji;
      filled._dayGanjiSource = "manse_db"; // 디버그/표기용
    }
  }

  // ② 연주(年柱) — 계산식 우선. 입춘 이전이면 전년도 간지 사용(절입 보정)
  if (typeof getYearGanjiFromDB === "function") {
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

  // ④ 월주(月柱) — 계산식 우선. 절기 키 + 연간(年干)이 확보된 후에만 가능
  //    (연간은 ②에서 계산식으로 이미 갱신된 값을 우선 사용)
  if (typeof getMonthGanjiFromJeolgi === "function") {
    const jeolgiForMonth = filled._exactJeolgiKey || getCurrentJeolgi(month, day);
    const yearGanForMonth = filled.yearGan; // ②에서 계산식으로 갱신된 값(또는 원래 입력값)
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


// ── 8-d. 시주(時柱) 자동 계산 ──────────────────────
// 시두법(時頭法/오자시법): 일간(日干)에 따라 자시(子時)의 시간(時干)이 정해지고,
// 그 뒤로는 천간이 순서대로 돌아간다. 만세력 DB 없이도 100% 공식으로 산출 가능.
// 갑·기일→갑자시 / 을·경일→병자시 / 병·신일→무자시 / 정·임일→경자시 / 무·계일→임자시
const SIDU_START_GAN = {
  갑: "갑", 기: "갑",
  을: "병", 경: "병",
  병: "무", 신: "무",
  정: "경", 임: "경",
  무: "임", 계: "임",
};
const JIJI_ORDER_FROM_JA = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

function getHourGanjiFromDayGan(dayGan, siji) {
  if (!dayGan || !siji || !SIDU_START_GAN[dayGan]) return { hourGan: null, hourJi: siji || null };
  const startGan = SIDU_START_GAN[dayGan];
  const startIdx = GAN_ORDER.indexOf(startGan);
  const jiIdx    = JIJI_ORDER_FROM_JA.indexOf(siji);
  if (jiIdx === -1) return { hourGan: null, hourJi: siji };

  const hourGan = GAN_ORDER[(startIdx + jiIdx) % 10];
  return { hourGan, hourJi: siji };
}


// ── 9. 메인 포국 함수 ─────────────────────────────
function runHongyeon(rawInput) {
  // 만세력 DB로 빈 간지·정확 절기를 먼저 보완 (DB 미로드 시 안전하게 통과)
  const input = autoFillGanjiFromManseDB(rawInput);

  const {
    year, month, day, hour, siji,
    yearGan, yearJi, monthGan, monthJi,
    dayGan,  dayJi,  hourGan,  hourJi,
    _exactJeolgiKey, _dayGanjiSource, _yearGanjiSource, _monthGanjiSource,
    _convertedFromLunar, _solarDate,
    _userYearGan, _userYearJi, _userMonthGan, _userMonthJi,
    _userDayGan,  _userDayJi,  _userHourGan,  _userHourJi,
  } = input;

  const sijiChar   = hourJi || siji || getHourToSiji(hour || 12);

  // 시(時)를 실제로 선택/입력했는지 여부 — "모르면 비워두세요" 케이스를 구분하기 위함
  const hasRealSiji = !!(siji || hourJi);

  // 시주(時柱) — 시두법(時頭法)으로 계산식 우선 산출.
  // 단, 태어난 시를 실제로 모르는(비워둔) 경우에는 시간을 정오로 임의 추정해
  // 시주 천간까지 계산에 끼워넣지 않는다(기존 동작과 동일하게 시주는 미상 처리).
  const hourCalc        = hasRealSiji ? getHourGanjiFromDayGan(dayGan, sijiChar) : { hourGan: null };
  const hourGanFinal     = hourCalc.hourGan || (hasRealSiji ? hourGan : null) || null;
  const hourJiFinal      = sijiChar;
  const hourGanjiSource  = hourCalc.hourGan ? "calc" : (hasRealSiji && hourGan ? "manual" : "none");

  // 정확 절기 DB(2010~2050)가 있으면 우선 사용, 없으면 근사 로직 폴백
  const jeolgiKey  = _exactJeolgiKey || getCurrentJeolgi(month, day);
  const samwonKey  = getSamwon(dayGan, dayJi, monthJi);
  const { guksu: baseGuksu, type, jeolgiName } = getBaseGuksu(jeolgiKey, samwonKey);

  const jibanBoard = buildJibanBoard(baseGuksu, type);

  const saju8     = [yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGanFinal, hourJiFinal].filter(Boolean);
  const cheongan4 = [yearGan, monthGan, dayGan, hourGanFinal].filter(Boolean);
  const { jibanHong, cheonbanHong } = calcHongguksu(saju8, cheongan4);

  const cheonbanBoard = buildCheonbanBoard(jibanBoard, jibanHong, cheonbanHong, type);
  const segungIndex   = getSegung(dayGan, jibanBoard);
  const board         = assembleBoard(jibanBoard, cheonbanBoard, segungIndex);

  // 길흉 요약 자동 산출
  const giljung = deriveGiljung(board, segungIndex);

  const hasSaju = !!(yearGan && monthGan && dayGan);
  const isAutoFilled = !!(_dayGanjiSource || _yearGanjiSource || _monthGanjiSource);
  const warning = hasSaju
    ? null // 계산식(만세력) 또는 직접입력 폴백 모두 정상 — 경고 없음
    : "사주팔자 간지를 산출하지 못해 절기 기반 근사값으로 포국했습니다. (만세력 DB 범위 밖)";

  // ── 계산값 vs 직접입력값 비교 (검산용) ───────────
  // 결과는 항상 계산식(만세력) 값을 우선 사용하며, 직접 입력한 값과 다르면 알려준다.
  const pairGanji = (gan, ji) => (gan && ji) ? `${gan}${ji}` : null;
  const ganjiSource = {
    year:  _yearGanjiSource  ? "calc" : (yearGan  ? "manual" : "none"),
    month: _monthGanjiSource ? "calc" : (monthGan ? "manual" : "none"),
    day:   _dayGanjiSource   ? "calc" : (dayGan   ? "manual" : "none"),
    hour:  hourGanjiSource,
  };
  const ganjiCompare = {
    year:  { computed: pairGanji(yearGan, yearJi),         user: pairGanji(_userYearGan,  _userYearJi)  },
    month: { computed: pairGanji(monthGan, monthJi),       user: pairGanji(_userMonthGan, _userMonthJi) },
    day:   { computed: pairGanji(dayGan, dayJi),           user: pairGanji(_userDayGan,   _userDayJi)   },
    hour:  { computed: pairGanji(hourGanFinal, hourJiFinal), user: pairGanji(_userHourGan, _userHourJi) },
  };
  const ganjiMismatch = Object.entries(ganjiCompare)
    .filter(([, v]) => v.user && v.computed && v.user !== v.computed)
    .map(([k]) => k);
  const PILLAR_LABEL = { year: "연주", month: "월주", day: "일주", hour: "시주" };
  const ganjiNotice = ganjiMismatch.length
    ? `입력하신 ${ganjiMismatch.map(k => PILLAR_LABEL[k]).join("·")} 간지가 만세력 계산값과 달라, 계산값을 우선 적용했습니다.`
    : null;

  return {
    meta: {
      jeolgiKey, jeolgiName, type, baseGuksu, samwonKey, sijiChar, warning,
      isAutoFilled,
      convertedFromLunar: !!_convertedFromLunar, // 음력→양력 변환이 일어났는지
      solarDateUsed: _solarDate || null,         // 변환된(또는 원래) 양력 날짜
      ganjiSource,    // 각 기둥이 계산식(calc)인지 직접입력(manual)인지
      ganjiNotice,    // 직접입력과 계산값이 다를 때 안내 문구 (없으면 null)
    },
    analysis: {
      jibanHong, cheonbanHong, segungIndex,
      segungName:   GUGUNG[segungIndex]?.name || "",
      dayGanOhaeng: dayGan ? CHEONGAN[dayGan]?.ohaeng : null,
      // 최종 적용된(계산식 우선) 사주팔자 — result.html 등에서 "입력 정보" 표시용
      yearGanji:  pairGanji(yearGan, yearJi),
      monthGanji: pairGanji(monthGan, monthJi),
      dayGanji:   pairGanji(dayGan, dayJi),
      hourGanji:  pairGanji(hourGanFinal, hourJiFinal),
      ganjiMismatch,
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

  // [FIX 5] 길방·흉방 상호 배타 처리
  //         8문 등급은 좋지만(예: 천의) 신살 페널티 등으로 종합 점수가 낮아진 방이
  //         길방·흉방 양쪽에 동시에 뜨는 모순을 방지한다. 이미 길방에 뽑힌 궁은
  //         흉방 후보에서 제외한 뒤, 남은 궁 중 하위 3개를 흉방으로 삼는다.
  const gilGungNums = new Set(gilbang.map(g => g.gungNum));
  const hyungCandidates = others.filter(g => !gilGungNums.has(g.gungNum));

  return {
    gilbang,
    hyungbang: hyungCandidates.slice(-3).reverse(),   // 길방을 제외한 하위 3개 = 흉방
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

  const hasSaju    = !!(analysis.yearGanji && analysis.monthGanji && analysis.dayGanji);
  const hasAnySaju = !!(analysis.yearGanji || analysis.monthGanji || analysis.dayGanji || analysis.hourGanji);

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

## 사주팔자 (간지) — 만세력 계산식 우선 적용
${hasAnySaju
  ? `- 연주: ${analysis.yearGanji || '?'}
- 월주: ${analysis.monthGanji || '?'}
- 일주: ${analysis.dayGanji || '?'}
- 시주: ${analysis.hourGanji || meta.sijiChar || '?'}${
  (analysis.ganjiMismatch && analysis.ganjiMismatch.length)
    ? `\n- 참고: 직접 입력한 간지와 계산값이 달라 계산값을 우선 사용함 (${analysis.ganjiMismatch.join(', ')})`
    : ''
}`
  : `- 간지 미산출 (절기 기반 근사 포국)`}

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
