import HongYeonDatabase from './hongyeonDb.js';
import HongYeonTimeDatabase from './hongyeonTimeDb.js';

/**
 * 홍연기문 구궁 포국 엔진
 * 낙서 순서(마방진 경로)에 따라 숫자를 구궁에 배치하는 핵심 알고리즘입니다.
 */
const HongYeonEngine = {
  // 낙서순수(洛書順數): 숫자가 구궁을 순장(이동)하는 고정된 궁(Index)의 순서 경로
  // 중궁(5) -> 건궁(6) -> 태궁(7) -> 간궁(8) -> 리궁(9) -> 감궁(1) -> 곤궁(2) -> 진궁(3) -> 손궁(4)
  nakseoPath:,

  /**
   * 1단계: 기초 지반수(地盤數) 포국 함수
   * @param {number} startGuksu - 절기와 삼원으로 도출된 기준 국수 (1~9)
   * @returns {Object} 9개 궁에 배치된 지반수 결과 객체
   */
  deployJibansu: function(startGuksu) {
    // 3x3 구궁 판 초기화 (1번 궁부터 9번 궁까지)
    let board = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null };
    
    // 시작 국수가 낙서 경로의 첫 번째(중궁)에 놓인다고 가정하고, 
    // 9개 숫자를 순서대로 증가시키며 마방진 경로에 배치
    let currentNum = startGuksu;

    for (let i = 0; i < 9; i++) {
      let targetGung = this.nakseoPath[i]; // 배치할 궁 번호
      
      board[targetGung] = currentNum;

      // 숫자는 10이 되면 다시 1이 되거나, 1~9 순환 규칙을 따름 (기본 기문은 1~9 순환 후 홍국오행 변환)
      currentNum++;
      if (currentNum > 9) {
        currentNum = 1;
      }
    }
    return board;
  },

  /**
   * 2단계: 천반수(天盤數) 포국 함수
   * 홍연기문에서는 지반에서 '생 시(時)'가 속한 궁의 숫자를 가져와 중궁에 얹고 다시 순행시킵니다.
   * @param {Object} jibansuBoard - 1단계에서 완성된 지반수 보드
   * @param {number} siGung - 태어난 시(時)에 의해 지정된 상수 궁 번호
   * @returns {Object} 9개 궁에 배치된 천반수 결과 객체
   */
  deployCheonbansu: function(jibansuBoard, siGung) {
    let board = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null };
    
    // 시궁(時宮)에 위치한 지반수가 천반의 시작 숫자(중궁수)가 됨
    let startCheonbanNum = jibansuBoard[siGung];
    let currentNum = startCheonbanNum;

    // 천반수도 동일한 낙서 경로로 순행 배치
    for (let i = 0; i < 9; i++) {
      let targetGung = this.nakseoPath[i];
      board[targetGung] = currentNum;

      currentNum++;
      if (currentNum > 9) {
        currentNum = 1;
      }
    }
    return board;
  },

  /**
   * 최종 통합 포국 실행기 (Facade)
   * @param {string} jeolgiKey - 예: "ipsoon" (입춘)
   * @param {string} samwonType - "sangwon" | "jungwon" | "hawon"
   * @param {number} birthSiGung - 시(時) 간지에 의해 결정된 궁 (테스트용 예: 3)
   */
  generateHonggukMap: function(jeolgiKey, samwonType, birthSiGung) {
    // 1. 시간 기준 데이터에서 시작 국수 가져오기
    const timeInfo = HongYeonTimeDatabase.twentyFourJeolgi[jeolgiKey];
    const startGuksu = timeInfo.guksu[samwonType];

    // 2. 지반수 계산
    const jibansu = this.deployJibansu(startGuksu);

    // 3. 천반수 계산
    const cheonbansu = this.deployCheonbansu(jibansu, birthSiGung);

    // 4. 프론트엔드 및 데이터 매핑을 위한 최종 구궁 객체 조립
    let finalGugungBoard = {};
    
    for (let gung = 1; gung <= 9; gung++) {
      finalGugungBoard[gung] = {
        gungInfo: HongYeonDatabase.gugung[gung], // 궁의 이름, 방위, 오행
        jibansu: jibansu[gung],                  // 지반 숫자
        cheonbansu: cheonbansu[gung],            // 천반 숫자
        // 추후 여기에 3번 데이터인 팔문, 구성, 팔장을 매핑하여 넣습니다.
      };
    }

    return {
      meta: {
        jeolgi: timeInfo.name,
        type: timeInfo.type,
        baseGuksu: startGuksu
      },
      board: finalGugungBoard
    };
  }
};

export default HongYeonEngine;

// ==========================================
// [실행 테스트 예시]
// 입춘(ipsoon), 상원(sangwon)국 기준 (시작국수: 8)
// 태어난 시의 궁 자리가 3번(진궁)이라고 가정했을 때
// ==========================================
// const result = HongYeonEngine.generateHonggukMap("ipsoon", "sangwon", 3);
// console.log(JSON.stringify(result, null, 2));
