/**
 * 홍국기문 해석 사전 데이터 (콘텐츠 DB)
 */

// ==========================================
// 1. 궁별 홍국수 및 특수 격국(상황) 해석 문구
// ==========================================
export const HONGGUK_SITUATIONAL_INTERPRET = {
  // 특수 신살 및 살성 조합 (삼살, 형파해 등)
  SPECIAL_SHINSAL: {
    'SAM_SAL_5_7_9': {
      title: '세궁 삼살(三殺) 국면: 5·7·9 대흉살',
      summary: '강한 살성이 본신(세궁)을 압박하는 형국입니다.',
      description: '세궁에 5(토), 7(화), 9(금)가 모여 삼살을 이루면 뜻밖의 관재구설이나 사고수, 건강상의 급격한 악화가 염려됩니다. 칼을 쥐고 호랑이를 만난 격이니 매사 겸손하고 투기성 투자는 절대 금물입니다.'
    },
    'HYUNG_3_2_9': {
      title: '삼형(三刑) 성국: 3·2·9 형살',
      summary: '관재수와 구설, 계약상의 마찰을 주의해야 합니다.',
      description: '3목, 2화, 9금이 맞물려 형살을 이루면 인간관계에서 배신을 당하거나 법적인 분쟁에 휘말릴 수 있습니다. 문서를 다룰 때 도장을 신중히 찍어야 하며, 가까운 사이일수록 금전 거래는 피해야 합니다.'
    }
  },

  // 육친(六親)의 상태에 따른 해석
  YUKCHIN_STATUS: {
    'JAESUNG_WANG': {
      title: '재성(財星) 왕성: 재물운의 만개',
      summary: '내가 극하여 취할 수 있는 재물이 사방에 가득합니다.',
      description: '재성을 뜻하는 홍국수가 왕성하고 힘을 얻었습니다. 사업자는 큰 매출을 올리고 직장인은 인센티브나 부가 수익을 기대할 수 있는 시기입니다. 다만 건강(본신)이 받쳐주지 못하면 그림의 떡이 되니 체력 관리도 필수입니다.'
    },
    'GWANGWI_DONG': {
      title: '관귀(官鬼) 발동: 직장 스트레스 혹은 명예운',
      summary: '나를 극하는 기운이 강해져 책임감이 무거워집니다.',
      description: '관귀가 강하게 움직이면 평소보다 직장에서의 압박이나 책임감이 커집니다. 사주가 강하면 승진이나 명예를 얻는 기회가 되지만, 사주가 약하면 극심한 스트레스나 건강 저하로 이어질 수 있으니 휴식이 필요합니다.'
    },
    'BUMO_HYO': {
      title: '부모(父母) 효동: 문서운과 귀인의 조력',
      summary: '나를 생해주는 은인의 기운이 나를 돕습니다.',
      description: '학문, 문서, 윗사람을 뜻하는 부모궁이 활성화되었습니다. 자격증 취득, 부동산 계약, 시험 합격에 아주 유리한 흐름입니다. 힘들 때 예상치 못한 귀인이 나타나 길을 열어줄 것입니다.'
    }
  }
};

// ==========================================
// 2. 원국(평생운) 및 신수(1년운) 해석 콘텐츠 데이터
// ==========================================
export const LIFETIME_AND_NEWYEAR_DB = {
  // 원국 (평생 타고난 사주 해석)
  LIFETIME_CORE: {
    'SADU_TYPE_STRONG': {
      category: '성격/기질',
      tag: '강왕(强旺) 사주',
      content: '주관이 뚜렷하고 독립심이 강해 자수성가할 운명입니다. 남 밑에서 일하기보다는 스스로 조직을 이끌거나 전문직으로 나아갈 때 성공 가능성이 비약적으로 상승합니다.'
    },
    'SADU_TYPE_WEAK': {
      category: '성격/기질',
      tag: '신약(身弱) 사주',
      content: '타인을 배려하는 마음이 깊고 협업에 능한 기질입니다. 혼자서 무리하게 판을 벌리기보다는 든든한 파트너나 대기업, 공공기관 등 안정적인 울타리 안에서 능력을 발휘하는 것이 평생 안락합니다.'
    }
  },

  // 신수운 (1년 단위 세운 해석 - 결제 유도 및 스페셜 조회용)
  NEW_YEAR_FORTUNE: {
    'JAE_SU_UN': {
      title: '재수운 (財數運)',
      grade: '대길(大吉)',
      text: '올해는 뿌린 대로 거두는 해입니다. 과거에 투자해 둔 자산이 있다면 이익을 실현하기 좋은 타이밍이며, 새로운 파이프라인을 구축하기에 최적의 시기입니다.'
    },
    'SAUP_UN': {
      title: '사업/직장운',
      grade: '평고(平高)',
      text: '상반기에는 변동수가 많아 혼란스러울 수 있으나, 하반기로 갈수록 자리가 잡힙니다. 이직을 고려 중이라면 8월 이후 가을의 기운이 들어올 때 움직이는 것이 길합니다.'
    },
    'SAGO_UN_WARNING': {
      title: '주의해야 할 살성 (경고)',
      grade: '주의(注意)',
      text: '신수도에 충(沖)의 기운이 강하게 들어옵니다. 올해는 장거리 운전을 조심하고, 특히 음력 5월과 9월에는 무리한 아웃도어 활동이나 스포츠를 삼가는 것이 신상에 이롭습니다.'
    }
  }
};

// ==========================================
// 3. 조건 기반 해석 문구 매칭 엔진 (결과 도출 함수)
// ==========================================

/**
 * 포국 엔진에서 계산된 구궁 데이터 상태를 받아 유저에게 보여줄 커스텀 문구를 조립합니다.
 * @param {Object} gungStatus - 구궁의 연산 결과 (예: { hasSamSal: true, mainYukchin: '처재', isWang: true })
 * @returns {Array} 유저에게 노출할 최종 해석 카드 리스트
 */
export function generateUserReport(gungStatus) {
  const reports = [];

  // 1. 삼살 여부 체크
  if (gungStatus.hasSamSal) {
    reports.push(HONGGUK_SITUATIONAL_INTERPRET.SPECIAL_SHINSAL.SAM_SAL_5_7_9);
  }

  // 2. 육친 왕쇠에 따른 문구 매칭
  if (gungStatus.mainYukchin === '처재' && gungStatus.isWang) {
    reports.push(HONGGUK_SITUATIONAL_INTERPRET.YUKCHIN_STATUS.JAESUNG_WANG);
  } else if (gungStatus.mainYukchin === '관귀') {
    reports.push(HONGGUK_SITUATIONAL_INTERPRET.YUKCHIN_STATUS.GWANGWI_DONG);
  }

  // 기본 평생운 데이터 결합
  reports.push(LIFETIME_AND_NEWYEAR_DB.LIFETIME_CORE.SADU_TYPE_STRONG);

  return reports;
}
