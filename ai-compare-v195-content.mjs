// Editable scene copy. Commands, IDs and roles below are mockup examples only.
export const copy={
 title:'LLM 기반 업무에서 에이전트 기반 업무로',
 steps:['1 AI마다 따로 지시하고 확인','2 CLI로 연결된 공통 업무 기록'],
 labels:[['LLM 기반 업무 방식','AI마다 대화창이 따로'],['에이전트 기반 현재 업무 방식','모든 AI가 CLI로 같은 기록에 연결']],
 tabs:['Codex','Claude','Gemini'], input:'메시지 입력', terminal:'terminal · task',board:'공통 업무 기록',count:'오늘 3건',
 headers:['업무 ID','상태','구현','검토','레드팀'],
 rows:[['W-0412','결과 화면 수정','접수','-','-','-'],['W-0409','통합 DB 문구','검토 중','Codex','Claude','대기'],['W-0405','LMS 첫 화면','완료','Codex','Claude','Gemini']],
 captions:[['AI마다 지시와 대화가 흩어짐','어디서 지시하든 공통 업무 기록에 기록'],['작업 진행 상황을 각각 확인','업무 상태와 결과를 한곳에서 확인'],['같은 업무가 중복될 수 있음','업무 ID로 중복 접수와 선점 확인'],['작성한 AI가 결과 검토까지 맡음','구현과 반증·예외 검토를 다른 AI로 분리'],['','레드팀 AI가 반례를 찾아 통과해야 완료']],
 replay:'다시 재생 ↻'
};
// ms and operations preserve the supplied v03 play() sequence.
export const timeline=[
 [100,[['step',0],['tab',0],['say','u','단어력 결과 화면 수정해 줘'],['lit','o1']]],
 [800,[['say','a','수정했습니다.']]],
 [1700,[['tab',1],['say','u','통합 DB 작업 어디까지 됐어?'],['lit','o2']]],
 [2400,[['say','a','이 대화에서는 기록이 없습니다.']]],
 [3300,[['tab',2],['say','u dup','단어력 결과 화면 수정해 줘'],['lit','o3']]],
 [4000,[['say','a','수정했습니다.']]],
 [4900,[['tab',0],['say','u','검토도 해 줘']]],
 [5500,[['say','a','제가 확인했는데 문제없습니다.'],['lit','o4']]],
 [6900,[['step',1],['log','c','task add "결과 화면 수정" --from codex']]],
 [7400,[['log','ok','W-0412 접수 · 공통 업무 기록에 저장'],['row',true,true],['lit','n1']]],
 [8300,[['log','c','task add "결과 화면 수정" --from gemini']]],
 [8800,[['log','bad','중복 · W-0412 이미 접수됨 · 새로 만들지 않음'],['lit','n3']]],
 [9700,[['log','c','task claim W-0412 --agent codex']]],
 [10100,[['log','ok','codex 선점 · 구현 시작'],['status','go','진행 중'],['cell',0,'Codex']]],
 [11000,[['log','c','task review W-0412 --agent claude']]],
 [11500,[['log','ok','검토 통과 · 빠진 예외 0건'],['status','go','검토 중'],['cell',1,'Claude'],['lit','n4']]],
 [12400,[['log','c','task redteam W-0412 --agent gemini']]],
 [12900,[['log','bad','반례 1건 · 0문항으로 끝나면 결과 화면이 빔'],['status','warn','반례 1건'],['cell',2,'Gemini']]],
 [13900,[['log','c','task fix W-0412 --agent codex']]],
 [14400,[['log','ok','반례 재확인 통과 · 완료'],['status','ok','완료'],['row',true,false],['lit','n5'],['lit','n2']]]
];
