# 유형별 원고

이 디렉터리에는 **사람이 쓴 원고만** 둔다. 코드는 `lib/`에 있다.

취약 시나리오와 4주 루틴은 LLM이 쓰지 않는다. 여기 있는 고정 원고를 붙인다.
(HANDOFF_v2 §13, §15.3 — 이게 품질을 안정시키고 비용도 줄인다.)

## 파일명

| 파일 | 유형 | 코드 | OFF/CAL/GEN |
|---|---|---|---|
| `type_01_captain.md` | 기장 | HHH | 高 高 高 |
| `type_02_first_officer.md` | 부조종사 | HHL | 高 高 低 |
| `type_03_glider.md` | 활공사 | HLH | 高 低 高 |
| `type_04_passenger.md` | 승객 | HLL | 高 低 低 |
| `type_05_mechanic.md` | 정비사 | LHH | 低 高 高 |
| `type_06_controller.md` | 관제사 | LHL | 低 高 低 |
| `type_07_climber.md` | 등반가 | LLH | 低 低 高 |
| `type_08_drifter.md` | 표류자 | LLL | 低 低 低 |
| `fallback.md` | LLM 실패 시 폴백 | — | — |

## 담기는 것

파일 하나당 취약 시나리오 3편(각 200자) + 4주 루틴 4편(각 100자 + 실행 지시 1줄).

**형식은 자유롭게 두고 커밋해도 된다.** 파서를 원고 구조에 맞춰 짠다.
