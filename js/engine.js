// =====================================================
// engine.js — 홍연기문 핵심 연산 엔진 v2.6
//
// [v2.6 변경사항]
//   ADD: 홍국수 십신(十神, 음양 10분류) 계산 — data-yukhin.js의 YUKHIN_RULE을
//        그대로 재사용하되, 기준을 "세궁 위치 오행"이 아니라 "일간(日干) 오행"으로,
//        대상을 "타궁 위치 오행"이 아니라 "그 자리에 실제로 앉은 홍국수의 오행"으로 교정.
//        (음양도 "궁 번호"가 아니라 "홍국수 자신의 음양"으로 판별)
//        premium.html이 사람마다 달라지는 실제 포국 결과를 반영하도록 하기 위함.
//        결과는 board[gung].hongguksu.{jibanSipsin, cheonSipsin, jibanRelCode, cheonRelCode}.
// [v2.5 변경사항]
//   ADD: 홍국수(洪局數) 육친(六親) 배속(5분류) — 일간 오행 기준으로 9궁의
//        지반/천반 홍국수가 비겁·식상·재성·관성·인성 중 무엇에 해당하는지
//        산출(assembleBoard 4번째 인자 ilganOhaeng, getYukchin 사용).
//        "재성/관성이 어느 방위에 있는가"를 보는, 정통 홍연기문의 핵심 기능.
//        결과는 board[gung].hongguksu, analysis.yukchinMap, AI 프롬프트에 반영됨.
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
//                    RELATION_TYPE, getRelationType, getOhaengChar,
//                    YUKCHIN_LABEL, getYukchin, YUKCHIN_MEANING (v2.5 신규)
//   data-yukhin.js : YUKHIN_RULE, getYukhinRelCode (v2.6부터 engine.js가 직접 사용 —
//                    모든 html 파일에서 data-yukhin.js를 engine.js보다 먼저 로드해야 함,
//                    기존 스크립트 순서가 이미 그렇게 되어 있어 추가 조치 불필요)
// =====================================================


// ── 0. engine.js 자체 내장 유틸 ──────────────────
// getYukchin: data-gugung.js에도 정의되어 있지만, engine.js 실행 시점에
// data-gugung.js 로드가 완료되지 않은 경우(캐시 미스, 비동기 타이밍 등)
// typeof getYukchin === "function"이 false가 되어 모든 육친이 null로 처리됨.
// → engine.js 안에 동일 로직을 내장해 타이밍 문제를 완전히 차단한다.
const _OHAENG_SENG = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
const _OHAENG_KEUK = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };
const _YUKCHIN_LABEL = {
  비겁:"비겁(比劫)", 식상:"식상(食傷)", 재성:"재성(財星)",
  관성:"관성(官星)", 인성:"인성(印星)",
};
function _getYukchin(ilganOhaeng, targetOhaeng) {
  if (!ilganOhaeng || !targetOhaeng) return null;
  if (ilganOhaeng === targetOhaeng)               return _YUKCHIN_LABEL.비겁;
  if (_OHAENG_SENG[ilganOhaeng] === targetOhaeng) return _YUKCHIN_LABEL.식상;
  if (_OHAENG_SENG[targetOhaeng] === ilganOhaeng) return _YUKCHIN_LABEL.인성;
  if (_OHAENG_KEUK[ilganOhaeng] === targetOhaeng) return _YUKCHIN_LABEL.재성;
  if (_OHAENG_KEUK[targetOhaeng] === ilganOhaeng) return _YUKCHIN_LABEL.관성;
  return null;
}

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
// [FIX 6] 일간(日干) 음양에 따라 세궁을 고정 매핑으로 결정.
//         기존 코드는 동일 오행의 후보 궁 중 "지반수가 가장 큰 궁"을 세궁으로
//         선택했으나, 이는 홍연기문 원칙과 다르다.
//         정통 홍연기문: 양간(甲·丙·戊·庚·壬)은 양궁, 음간(乙·丁·己·辛·癸)은 음궁.
//           甲→진궁(3), 乙→손궁(4)
//           丙→이궁(9), 丁→이궁(9)   ← 火는 궁이 1개이므로 동일
//           戊→간궁(8), 己→곤궁(2)
//           庚→건궁(6), 辛→태궁(7)
//           壬→감궁(1), 癸→감궁(1)   ← 水는 궁이 1개이므로 동일
//         이 오류로 인해 세궁이 틀리면 팔문 배치 전체가 연쇄적으로 틀어져
//         길방·흉방이 역전되는 현상이 발생한다(가족 비교 불일치의 근본 원인).
function getSegung(dayGan, jibanBoard) {
  if (!dayGan || !CHEONGAN[dayGan]) return 5;

  // 일간 → 세궁 번호 고정 매핑 (홍연기문 음양궁 원칙)
  const GAN_TO_SEGUNG = {
    갑: 3, 을: 4,   // 木 양→진궁(震), 음→손궁(巽)
    병: 9, 정: 9,   // 火 단일→이궁(離)
    무: 8, 기: 2,   // 土 양→간궁(艮), 음→곤궁(坤)
    경: 6, 신: 7,   // 金 양→건궁(乾), 음→태궁(兌)
    임: 1, 계: 1,   // 水 단일→감궁(坎)
  };

  return GAN_TO_SEGUNG[dayGan] ?? 5;
}


// ── 8. 최종 board 조립 (팔문 + 신살 + 홍국수 육친 포함) ────────
// ilganOhaeng: 일간(日干)의 오행 — 홍국수 육친 배속의 기준점.
//              dayGan을 모르면 null로 들어오며, 이 경우 육친은 계산되지 않는다.
function assembleBoard(jibanBoard, cheonbanBoard, segungIndex, ilganOhaeng) {
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

    // ── 홍국수(洪局數) 자체의 오행·육친·십신·고유 기운 ──
    // 홍국수는 위치(궁)와 무관하게 "숫자 자신"이 갖는 오행과 본래의 궁(GUGUNG) 기운을
    // 지니고 다닌다고 보아, 그 숫자가 원래 속한 궁(GUGUNG[숫자])의 키워드를 함께 부여한다.
    const jibanOhaeng = getOhaengChar(jiban);
    const cheonOhaeng  = getOhaengChar(cheon);

    // 일간 기준 5분류 육친 — engine.js 내장 _getYukchin 사용 (타이밍 무관)
    // data-gugung.js의 getYukchin이 있으면 그것도 동일하게 동작하지만,
    // 로드 순서/캐시 문제로 undefined일 수 있으므로 내장 함수를 우선 사용한다.
    const yukchinFn = (typeof getYukchin === "function") ? getYukchin : _getYukchin;
    const jibanYukchin = yukchinFn(ilganOhaeng, jibanOhaeng);
    const cheonYukchin = yukchinFn(ilganOhaeng, cheonOhaeng);

    // 일간 기준 10분류 십신(十神) — data-yukhin.js의 YUKHIN_RULE을 그대로 재사용.
    // [중요] 음양은 "궁(자리) 번호"가 아니라 실제로 그 자리에 앉은 홍국수 자신의 음양으로 판별한다.
    //        (낙서수 음양: 1·3·5·7·9=양, 2·4·6·8=음 — 표준 홍국수 음양 규칙)
    // 이렇게 해야 premium.html의 십신 풀이가 "사람마다 달라지는 실제 홍국수 배치"를 반영한다.
    function deriveSipsin(num, ohaeng) {
      if (!ilganOhaeng || typeof getYukhinRelCode !== "function" || typeof YUKHIN_RULE === "undefined") {
        return { relCode: null, sipsin: null };
      }
      const relCode = getYukhinRelCode(ilganOhaeng, ohaeng);
      const isYang = (num % 2 !== 0);
      const sipsin = YUKHIN_RULE[relCode]?.[isYang ? "양" : "음"] || null;
      return { relCode, sipsin };
    }
    const jibanSip = deriveSipsin(jiban, jibanOhaeng);
    const cheonSip  = deriveSipsin(cheon, cheonOhaeng);

    const hongguksu = {
      jibanOhaeng,
      cheonOhaeng,
      // 일간 기준 5분류 육친 — 일간을 모르면 null
      jibanYukchin,
      cheonYukchin,
      // 일간 기준 10분류 십신(음양 구분) — premium.html과 공유하는 정식 데이터
      jibanRelCode: jibanSip.relCode,
      cheonRelCode: cheonSip.relCode,
      jibanSipsin:  jibanSip.sipsin,   // { name, label, businessLabel } | null
      cheonSipsin:  cheonSip.sipsin,
      // 숫자 자신이 원래 속한 궁(GUGUNG)의 고유 키워드 — "타고 온 기운"
      jibanNumKeyword: GUGUNG[jiban]?.desc || "",
      cheonNumKeyword: GUGUNG[cheon]?.desc || "",
    };

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
      hongguksu,
    };
  }
  return board;
}


// ── 8-e. 홍국수 육친 종합표 ────────────────────────
// "내 재성/관성/인성 등이 어느 방위에 와 있는가"를 한눈에 보기 위한 집계.
// 정통 홍연기문에서 길흉 방위 판단의 핵심 축 중 하나.
function summarizeYukchin(board) {
  const groups = {
    "비겁(比劫)": [], "식상(食傷)": [], "재성(財星)": [], "관성(官星)": [], "인성(印星)": [],
  };
  for (const g of Object.values(board)) {
    const h = g.hongguksu;
    if (!h) continue;
    if (h.jibanYukchin && groups[h.jibanYukchin]) {
      groups[h.jibanYukchin].push({
        gung: g.gungInfo.name, direction: g.gungInfo.direction,
        layer: "지반", num: g.jibansu, isSegung: g.isSegung,
      });
    }
    if (h.cheonYukchin && groups[h.cheonYukchin]) {
      groups[h.cheonYukchin].push({
        gung: g.gungInfo.name, direction: g.gungInfo.direction,
        layer: "천반", num: g.cheonbansu, isSegung: g.isSegung,
      });
    }
  }
  return groups;
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

  // 일간(日干) 오행 — 홍국수 육친 배속의 기준점 (일간을 모르면 null → 육친 미산출)
  const ilganOhaeng = dayGan ? CHEONGAN[dayGan]?.ohaeng : null;

  const board         = assembleBoard(jibanBoard, cheonbanBoard, segungIndex, ilganOhaeng);

  // 길흉 요약 자동 산출
  const giljung = deriveGiljung(board, segungIndex);

  // 홍국수 육친 종합표 — "재성/관성/인성 등이 어느 방위에 와 있는가"
  // ilganOhaeng이 없으면 육친 자체가 의미 없으므로 null 유지.
  // board의 hongguksu.jibanYukchin/cheonYukchin은 assembleBoard에서 _getYukchin으로
  // 이미 세팅되어 있으므로, summarizeYukchin이 제대로 집계하면 된다.
  // 만약 board 자체에서 육친이 null로 들어왔다면(데이터 깨짐) 직접 재계산 폴백.
  let yukchinMap = null;
  if (ilganOhaeng) {
    yukchinMap = (typeof summarizeYukchin === "function") ? summarizeYukchin(board) : null;

    // 폴백: summarizeYukchin이 없거나 board hongguksu가 null인 경우 직접 집계
    const allEmpty = yukchinMap && Object.values(yukchinMap).every(arr => arr.length === 0);
    if (!yukchinMap || allEmpty) {
      const groups = {
        "비겁(比劫)":[], "식상(食傷)":[], "재성(財星)":[], "관성(官星)":[], "인성(印星)":[],
      };
      for (const g of Object.values(board)) {
        const jibanO = getOhaengChar(g.jibansu);
        const cheonO  = getOhaengChar(g.cheonbansu);
        const jYc = _getYukchin(ilganOhaeng, jibanO);
        const cYc = _getYukchin(ilganOhaeng, cheonO);
        if (jYc && groups[jYc]) groups[jYc].push({ gung: g.gungInfo.name, direction: g.gungInfo.direction, layer:"지반", num: g.jibansu, isSegung: g.isSegung });
        if (cYc && groups[cYc]) groups[cYc].push({ gung: g.gungInfo.name, direction: g.gungInfo.direction, layer:"천반", num: g.cheonbansu, isSegung: g.isSegung });
      }
      yukchinMap = groups;
    }
  }

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
      dayGanOhaeng: ilganOhaeng,
      // 최종 적용된(계산식 우선) 사주팔자 — result.html 등에서 "입력 정보" 표시용
      yearGanji:  pairGanji(yearGan, yearJi),
      monthGanji: pairGanji(monthGan, monthJi),
      dayGanji:   pairGanji(dayGan, dayJi),
      hourGanji:  pairGanji(hourGanFinal, hourJiFinal),
      ganjiMismatch,
      yukchinMap, // 홍국수 육친 종합표 (재성/관성/인성 등이 어느 방위에 있는지)
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
    const palmunTier    = g.palmun?.tier  ?? "중";   // [BUG FIX] 기본값 "흉"→"중": 복위 미정의 시 길방 후보 부당 제외 방지
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
      // 홍국수 육친 — 일간 기준 재성/관성/인성 등 (일간 미상이면 null)
      jibanYukchin:  g.hongguksu?.jibanYukchin || null,
      cheonYukchin:  g.hongguksu?.cheonYukchin || null,
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
  // [BUG FIX] tier "중"(복위)도 길방 보충 후보에 포함. 기존엔 "길"만 허용해 복위가 흉 취급됐음.
  const gilTier   = others.filter(g => g.palmunTier === "길" || g.palmunTier === "중");
  const hyungTier = others.filter(g => g.palmunTier === "흉");

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

  // 구궁 포국 텍스트 (팔문 + 홍국수 육친 포함)
  const boardText = NAKSEO_PATH.map(gungNum => {
    const g = board[gungNum];
    const segMark   = g.isSegung ? " ★세궁" : "";
    const palmunStr = g.palmun
      ? ` [${g.palmun.label} ${g.palmun.score}점]` : "";
    const sinsalStr = (g.sinsal && g.sinsal.length > 0)
      ? ` ⚡신살: ${g.sinsal.map(s => s.label).join("·")}` : "";
    const yukchinStr = g.hongguksu
      ? ` (지반육친:${g.hongguksu.jibanYukchin || "-"} / 천반육친:${g.hongguksu.cheonYukchin || "-"})`
      : "";
    return `  ${g.gungInfo.name}(${g.gungInfo.direction}): 지반${g.jibansu} 천반${g.cheonbansu} [${g.relation.label} ${g.relation.score}점]${palmunStr}${sinsalStr}${yukchinStr}${segMark}`;
  }).join("\n");

  // 홍국수 육친 종합표 텍스트 — "재성/관성/인성 등이 어느 방위에 와 있는가"
  const yukchinMap = result.analysis.yukchinMap || summarizeYukchin(board);
  const yukchinText = Object.entries(yukchinMap)
    .map(([label, list]) => {
      if (!list.length) return `  ${label}: 없음`;
      const items = list.map(it =>
        `${it.gung}(${it.direction}, ${it.layer}${it.num}${it.isSegung ? "·세궁" : ""})`
      ).join(", ");
      return `  ${label}: ${items}`;
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
당신은 홍연기문(홍국기문)과 사주명리학을 함께 해석하는 전문가입니다.
홍연기문은 사주의 일간(日干) 오행을 기준으로 9개 방위의 기운이 나의 기운과 어떻게 만나는지를 보는 학문입니다.
단순한 길흉 판단이 아니라, 각 방위에 흐르는 기운(氣)의 성질과 나의 기운 사이의 관계를 에너지 흐름으로 해석해주세요.
조선 중기 서경덕(화담)의 기(氣)철학처럼, 우주의 기운이 방위별로 취산(聚散)하는 흐름을 사람의 삶과 연결하는 시각으로 서술하세요.

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

## 구궁 포국 결과 (지반 / 천반 / 생극관계 / 팔문 / 육친)
${boardText}

## 홍국수 육친(六親) 종합표 — 일간 기준
${yukchinText}

## 자동 산출 길흉 요약 (참고용)
▶ 길방 TOP3
${gilText}

▶ 흉방 TOP3 (주의)
${hyungText}

## 동처(動處) — 현재 가장 활성화된 방위
${dongcheoText}

---

[해석 지침 — 아래 순서와 관점으로 한국어로 서술하세요]

**해석의 핵심 관점:**
- 각 방위는 단순히 "좋다/나쁘다"가 아니라, 그 방위에 흐르는 오행 기운과 나의 일간 오행이 어떤 에너지 관계를 맺는지를 설명하세요.
- 사주명리의 용어(인성·재성·관성·식상·비겁)를 방위 에너지와 연결해 해석하세요.
- 이사나 물리적 이동이 어려운 경우에도 활용할 수 있도록, 방위를 공간 배치(침실·책상 방향), 인간관계 방향(어느 쪽 사람과 협력할지), 에너지 집중 분야로 응용하는 해석을 함께 제공하세요.

1. **나의 기운 — 세궁(${analysis.segungName}) 분석**
   일간 오행(${analysis.dayGanOhaeng || '?'})이 세궁에 자리잡은 구조를 설명하세요.
   지반수·천반수의 오행이 일간과 어떤 에너지 관계인지(생·극·비화), 그 기운이 현재 삶에서 어떻게 작용하는지 서술하세요.
   사주팔자가 있다면 일간의 강약(신강·신약 경향)과 연결해 설명하세요.

2. **방위별 기운 지도 — 9궁 에너지 흐름**
   각 방위를 오행 기운과 사주명리 육친 개념으로 설명하세요.
   예: "북동(간궁)은 土 기운이 강한 방위로, 일간 辛金에게는 인성(나를 생해주는 기운)이 위치한 곳입니다. 이 방위의 에너지는 외부의 지원과 문서·후원의 형태로 나에게 흘러옵니다."
   길방·흉방의 구분보다 각 방위 기운의 성질과 나와의 관계를 중심으로 서술하세요.

3. **실생활 에너지 활용**
   물리적 이동(이사·출장·여행)과 공간 내 배치(침실 머리 방향, 책상 방향) 두 가지 측면에서 각 방위를 어떻게 활용할 수 있는지 구체적으로 알려주세요.
   특히 나를 생해주는 방위(인성 방위)와 내가 에너지를 펼치는 방위(식상·재성 방위)를 구분해서 설명하세요.

4. **주의할 기운 — 충돌하는 에너지**
   천극지·지극천 구조이거나 흉한 팔문이 겹친 방위는, 단순히 "위험하다"가 아니라 어떤 기운이 충돌하기 때문에 긴장이 생기는지 설명하세요.
   신살(탕화살·수옥살·겁살·백호살 등)이 발동된 궁은 어떤 오행 충돌의 결과인지 함께 설명하세요.

5. **${topicGuide}** — 위 에너지 흐름을 바탕으로 주제에 맞는 실용적 조언을 제공하세요.

한국어로, 에너지 흐름을 중심으로 서술하되 지나치게 신비롭거나 추상적이지 않게, 실생활에서 참고할 수 있는 구체적인 언어로 답해주세요.`;
}
