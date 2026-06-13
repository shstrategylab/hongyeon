import HongYeonDatabase from './hongyeonDb.js';

/**
 * 홍연기문 해단(해석) 엔진
 * 각 궁에 배치된 지반수와 천반수의 오행을 비교하여 상생상극 및 길흉을 판정합니다.
 */
const HongYeonInterpreter = {
  
  /**
   * 단일 궁의 지반수 vs 천반수 관계 해석 함수
   * @param {number} jibansu - 해당 궁의 지반수 (1~10)
   * @param {number} cheonbansu - 해당 궁의 천반수 (1~10)
   * @returns {Object} 상생상극 결과 및 해석 텍스트
   */
  interpretGungRelation: function(jibansu, cheonbansu) {
    // 1. 홍국수의 오행(목, 화, 토, 금, 수) 정보 가져오기
    const jibaOhaeng = HongYeonDatabase.honggukNumbers[jibansu].ohaeng;
    const cheonOhaeng = HongYeonDatabase.honggukNumbers[cheonbansu].ohaeng;
    
    // 2. 오행 상생상극 데이터베이스 로직 매핑
    const saengLogic = HongYeonDatabase.ohaengLogic.saeng;
    const geukLogic = HongYeonDatabase.ohaengLogic.geuk;

    // 결과 객체 초기화
    let relationType = "비화(比和)"; // 기본값: 오행이 같은 경우
    let score = 50;                 // 평점 (50점 기준)
    let summary = "무난하고 평탄한 기운입니다.";
    let description = `지반수 ${jibansu}(${jibaOhaeng})와 천반수 ${cheonbansu}(${cheonOhaeng})의 기운이 서로 조화를 이룹니다.`;

    // 3. 상생/상극 조건 분기 연산
    if (jibansu === cheonbansu) {
      relationType = "복음(伏吟)";
      score = 40;
      summary = "기운이 정체되거나 중복됩니다.";
      description = "하늘과 땅의 숫자가 같아 변화가 적고 답답함을 느낄 수 있는 시기입니다.";
    } 
    // 천반이 지반을 생하는 경우 (하늘이 땅을 도와줌)
    else if (saengLogic[cheonOhaeng] === jibaOhaeng) {
      relationType = "천생지(天生地)";
      score = 90;
      summary = "윗사람이나 환경의 전폭적인 도움을 받습니다. (대길)";
      description = "하늘의 기운이 땅을 생하니, 생각지 못한 귀인의 도움이나 문서상의 이득이 따르는 운세입니다.";
    } 
    // 지반이 천반을 생하는 경우 (내가 기운을 쏟아 부음)
    else if (saengLogic[jibaOhaeng] === cheonOhaeng) {
      relationType = "지생천(地生天)";
      score = 70;
      summary = "노력한 만큼 성과를 거두는 시기입니다. (소길)";
      description = "내 능력을 발휘하여 성과를 내는 구조입니다. 지출이나 에너지 소모는 있으나 보람이 있습니다.";
    } 
    // 천반이 지반을 극하는 경우 (하늘이 땅을 내리침 - 가장 주의)
    else if (geukLogic[cheonOhaeng] === jibaOhaeng) {
      relationType = "천극지(天剋地)";
      score = 15;
      summary = "돌발 사고, 관재구설, 압박감을 주의해야 합니다. (대흉)";
      description = "상부의 압박이나 환경적 제약으로 인해 큰 스트레스를 받거나 계획이 좌절될 수 있으니 자중해야 합니다.";
    } 
    // 지반이 천반을 극하는 경우 (내가 환경을 이겨냄)
    else if (geukLogic[jibaOhaeng] === cheonOhaeng) {
      relationType = "지극천(地剋天)";
      score = 60;
      summary = "장애물을 극복하고 통제권을 쥡니다. (평길)";
      description = "어려운 상황이나 경쟁 상대를 본인의 의지와 노력으로 제압하고 원하는 것을 쟁취할 수 있는 운입니다.";
    }

    return {
      relationType,
      score,
      summary,
      description,
      debug: { cheonOhaeng, jibaOhaeng }
    };
  },

  /**
   * 포국 엔진에서 완성된 9개 궁 보드 전체를 순회하며 해석을 덧붙이는 함수
   * @param {Object} finalGugungBoard - `HongYeonEngine.generateHonggukMap`의 출력 결과물
   * @returns {Object} 해석 데이터가 바인딩된 최종 결과 객체
   */
  interpretFullBoard: function(finalGugungBoard) {
    const interpretedBoard = {};

    // 1번부터 9번 궁까지 돌면서 해석 데이터 주입
    for (let gung in finalGugungBoard.board) {
      const gungData = finalGugungBoard.board[gung];
      
      // 단일 궁 해석 로직 호출
      const interpretation = this.interpretGungRelation(gungData.jibansu, gungData.cheonbansu);

      interpretedBoard[gung] = {
        ...gungData,
        interpretation // 백엔드 분석 결과 바인딩
      };
    }

    return {
      meta: finalGugungBoard.meta,
      board: interpretedBoard
    };
  }
};

export default HongYeonInterpreter;

// ==========================================
// [통합 연동 가상 테스트]
// ==========================================
// const rawBoard = HongYeonEngine.generateHonggukMap("ipsoon", "sangwon", 3);
// const finalizedServiceData = HongYeonInterpreter.interpretFullBoard(rawBoard);
// console.log(finalizedServiceData.board[1].interpretation); 
// -> 1번 감궁의 지반수/천반수 분석 결과가 한글 텍스트와 스코어로 리턴됨
