export type Axis = "OFF" | "VER" | "GEN" | "ANX";

export type Question = {
  id: number;
  axis: Axis;
  text: string;
  reverse?: boolean;
};

export const AXIS_LABEL: Record<Axis, string> = {
  OFF: "인지 위탁도",
  VER: "검증 습관",
  GEN: "창발 잔존도",
  ANX: "의존 불안",
};

export const QUESTIONS: Question[] = [
  { id: 1, axis: "OFF", text: "궁금한 게 생기면 검색창보다 AI 채팅창을 먼저 연다." },
  { id: 2, axis: "OFF", text: "글을 쓸 때 빈 화면에서 시작하기보다 AI에게 초안을 먼저 시킨다." },
  { id: 3, axis: "OFF", text: "무언가 결정하기 전에 AI에게 의견을 물어본 적이 있다." },
  { id: 4, axis: "OFF", text: "막히는 지점이 나오면 붙잡고 있기보다 바로 AI에 붙여넣는다." },
  { id: 5, axis: "OFF", text: "원문보다 AI가 만든 요약본을 주로 읽는다." },

  { id: 6, axis: "VER", text: "AI가 알려준 사실은 출처를 따로 확인한다." },
  { id: 7, axis: "VER", text: "AI 답변에서 틀린 부분을 발견한 적이 여러 번 있다." },
  { id: 8, axis: "VER", text: "AI 결과물을 그대로 쓰지 않고 최소 한 번은 다시 쓴다." },
  { id: 9, axis: "VER", text: "AI가 자신 있게 말할수록 오히려 한 번 더 의심한다." },
  { id: 10, axis: "VER", text: "중요한 결과물일수록 AI 사용 비중을 의도적으로 줄인다." },

  { id: 11, axis: "GEN", text: "AI 없이도 내 문장으로 한 편을 끝까지 쓸 수 있다." },
  { id: 12, axis: "GEN", text: "아이디어가 떠오르면 일단 내 머리로 굴려본 뒤에 AI를 켠다." },
  { id: 13, axis: "GEN", text: "최근 반년 사이 내가 쓰는 어휘가 단조로워졌다고 느낀다.", reverse: true },
  { id: 14, axis: "GEN", text: "AI가 준 표현이 내 표현보다 나아 보여서 그대로 쓴 적이 많다.", reverse: true },
  { id: 15, axis: "GEN", text: "내 글을 보고 누군가 “AI 같다”고 말한 적이 있다.", reverse: true },

  { id: 16, axis: "ANX", text: "AI가 내일 사라지면 내 작업 속도가 절반 이하로 떨어질 것 같다." },
  { id: 17, axis: "ANX", text: "AI를 쓰고 나서 스스로 무능해졌다고 느낀 적이 있다." },
  { id: 18, axis: "ANX", text: "AI 없이 결과물을 냈을 때 오히려 불안하다." },
  { id: 19, axis: "ANX", text: "AI를 썼다는 사실을 굳이 남에게 말하지 않는다." },
  { id: 20, axis: "ANX", text: "이대로 가면 내 사고력이 퇴화할 것 같다는 생각이 든다." },
];

export const SCALE_LABELS = [
  "전혀 아니다",
  "아니다",
  "보통",
  "그렇다",
  "매우 그렇다",
];

export const PAGE_SIZE = 5;
export const PAGE_COUNT = QUESTIONS.length / PAGE_SIZE;
