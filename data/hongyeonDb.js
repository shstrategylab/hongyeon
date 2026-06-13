/**
 * 홍연기문 서비스 개발용 핵심 데이터베이스 (Schema & Static Data)
 * 3x3 구궁도 배치 및 상생상극 연산의 기준 정보 데이터셋입니다.
 */

const HongYeonDatabase = {
  // 1. 구궁(九宮) 공간 좌표 데이터 (3x3 마방진 구조 기반)
  // 기문둔갑 판의 절대적인 물리적 위치와 오행 공간 정의
  gugung: {
    1: { name: "감궁(坎宮)", direction: "북", ohaeng: "수(水)", number: 1 },
    2: { name: "곤궁(坤宮)", direction: "남서", ohaeng: "토(土)", number: 2 },
    3: { name: "진궁(震宮)", direction: "동", ohaeng: "목(木)", number: 3 },
    4: { name: "손궁(巽宮)", direction: "남동", ohaeng: "목(木)", number: 4 },
    5: { name: "중궁(中宮)", direction: "중앙", ohaeng: "토(土)", number: 5 },
    6: { name: "건궁(乾宮)", direction: "북서", ohaeng: "금(金)", number: 6 },
    7: { name: "태궁(兌宮)", direction: "서", ohaeng: "금(金)", number: 7 },
    8: { name: "간궁(艮宮)", direction: "북동", ohaeng: "토(土)", number: 8 },
    9: { name: "리궁(離宮)", direction: "남", ohaeng: "화(火)", number: 9 }
  },

  // 2. [홍국 파트] 홍국수(洪局數) 기본 성향 및 생상극 정의
  // 생년월일시 조합 후 각 궁에 배치될 1~10 숫자의 메타데이터
  honggukNumbers: {
    1: { yinYang: "양(陽)", ohaeng: "수(水)", genericName: "일백수" },
    2: { yinYang: "음(陰)", ohaeng: "화(火)", genericName: "이화" },
    3: { yinYang: "양(陽)", ohaeng: "목(木)", genericName: "삼목" },
    4: { yinYang: "음(陰)", ohaeng: "금(金)", genericName: "사금" },
    5: { yinYang: "양(陽)", ohaeng: "토(土)", genericName: "오토" },
    6: { yinYang: "음(陰)", ohaeng: "수(水)", genericName: "육수" },
    7: { yinYang: "양(陽)", ohaeng: "화(火)", genericName: "칠화" },
    8: { yinYang: "음(陰)", ohaeng: "목(木)", genericName: "팔목" },
    9: { yinYang: "양(陽)", ohaeng: "금(金)", genericName: "구금" },
    10: { yinYang: "음(陰)", ohaeng: "토(土)", genericName: "십토" }
  },

  // 3. [연기 파트] 연기기문 상징 요소 데이터셋
  // 이사, 방향, 운세 디테일 풀이를 출력할 때 화면에 바인딩할 한자 및 길흉 정보
  yeongiElements: {
    // 팔문(八門) : 인간사의 행위와 활동 영역의 길흉을 판정
    palmun: {
      휴문: { hanja: "休門", type: "길문(吉)", desc: "휴식, 안주, 재충전, 부부화합" },
      생문: { hanja: "生門", type: "길문(吉)", desc: "생산, 재물, 이익, 개업, 활력" },
      상문: { hanja: "傷門", type: "흉문(凶)", desc: "상해, 파손, 수술, 소송, 분실" },
      두문: { hanja: "杜門", type: "평문(平)", desc: "막힘, 은둔, 연구, 비밀유지, 거래중단" },
      경문1: { hanja: "景門", type: "평문(平)", desc: "화려함, 문서계약, 구설, 시각적 성과" }, // 경치 경
      사문: { hanja: "死門", type: "흉문(凶)", desc: "정지, 폐업, 매장, 부동산 취득, 고립" },
      경문2: { hanja: "驚門", type: "흉문(凶)", desc: "놀람, 사고, 불안, 말다툼, 소송" }, // 놀랄 경
      개문: { hanja: "開門", type: "길문(吉)", desc: "시작, 승진, 취업, 사업확장, 이동" }
    },

    // 구성(九星) : 하늘의 기운과 타고난 천성 분석
    guseong: {
      천봉: { hanja: "天蓬", ohaeng: "수(水)", type: "대흉", desc: "도적, 모험심, 과감함" },
      천내: { hanja: "天芮", ohaeng: "토(土)", type: "대흉", desc: "질병, 학생, 학습, 문제점" },
      천충: { hanja: "天沖", ohaeng: "목(木)", type: "소길", desc: "자비심, 급한 성격, 충동적 행동" },
      천보: { hanja: "天輔", ohaeng: "목(木)", type: "대길", desc: "문화, 교육, 귀인의 도움, 학술" },
      천금: { hanja: "天禽", ohaeng: "토(土)", type: "대길", desc: "중앙의 권력, 신용, 정직함" },
      천심: { hanja: "天心", ohaeng: "금(金)", type: "대길", desc: "의술, 지도자, 기획력, 정의감" },
      천주: { hanja: "天柱", ohaeng: "금(金)", type: "소흉", desc: "말재주, 파괴, 구설수, 소송" },
      천임: { hanja: "天任", ohaeng: "토(土)", type: "대길", desc: "성실함, 부동산, 재물 축적" },
      천영: { hanja: "天英", ohaeng: "화(火)", type: "소흉", desc: "화려함, 성급함, 명예욕" }
    },

    // 팔장(八將) : 심리적 환경과 보이지 않는 운의 흐름
    paljang: {
      직부: { hanja: "直符", type: "최길", desc: "가장 큰 귀인, 우두머리, 보호막 역할" },
      등사: { hanja: "螣蛇", type: "흉", desc: "괴이함, 악몽, 불안증, 사기수" },
      태음: { hanja: "太陰", type: "길", desc: "음덕, 비밀스러운 도움, 기획, 연구" },
      육합: { hanja: "六合", type: "길", desc: "화합, 혼인, 계약 성사, 중개업 상생" },
      백호: { hanja: "白虎", type: "흉", desc: "혈광사, 사고, 강력한 압박, 수술수" },
      주작: { hanja: "朱雀", type: "흉", desc: "문서 구설, 말다툼, 소송, 정보 유출" },
      구천: { hanja: "九天", type: "길", desc: "비상, 확장, 해외 이동, 넓은 시야" },
      구지: { hanja: "九地", type: "길", desc: "안정, 저축, 비밀 유지, 기초 다지기" }
    }
  },

  // 4. [알고리즘 매핑용] 오행의 상생(Sangsaeng) 및 상극(Sanggeuk) 관계 정의
  // 구궁에 배치된 홍국수들끼리의 연산 로직 백엔드 뼈대
  ohaengLogic: {
    saeng: { "목(木)": "화(火)", "화(火)": "토(土)", "토(土)": "금(金)", "금(金)": "수(水)", "수(水)": "목(木)" },
    geuk: { "목(木)": "토(土)", "토(土)": "수(水)", "수(水)": "화(火)", "화(火)": "금(金)", "금(金)": "목(木)" }
  }
};

// 5. 비즈니스 로직(Helper Functions) 예시 데이터 가공 함수
// 포국이 끝난 데이터 객체를 받아 기초적인 상생/상극 관계를 검사하는 함수 프레임워크
export const checkRelation = (fromNumber, toNumber) => {
  const elementA = HongYeonDatabase.honggukNumbers[fromNumber].ohaeng;
  const elementB = HongYeonDatabase.honggukNumbers[toNumber].ohaeng;

  if (HongYeonDatabase.ohaengLogic.saeng[elementA] === elementB) {
    return { type: "SAENG", message: `${elementA}이(가) ${elementB}을(를) 생(生)합니다. (길)` };
  }
  if (HongYeonDatabase.ohaengLogic.geuk[elementA] === elementB) {
    return { type: "GEUK", message: `${elementA}이(가) ${elementB}을(를) 극(剋)합니다. (흉)` };
  }
  return { type: "NEUTRAL", message: "무난한 관계입니다." };
};

export default HongYeonDatabase;
