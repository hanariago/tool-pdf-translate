# tool-pdf-translate

PDF를 브라우저에서 열어 **원문 위치 그대로** 번역을 표시하는 정적 웹 도구.
파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다. (LLM 보정 사용 시에만 사용자 본인 API 키로 해당 제공자에 직접 호출)

## 기능

- **텍스트 PDF**: pdf.js로 텍스트 레이어와 좌표를 추출해 원문 위치에 번역 오버레이
- **스캔본 PDF**: 텍스트 레이어가 없으면 자동 감지 → Tesseract.js OCR로 글자·위치 추정
- **원문 / 번역 보기 토글** + 페이지 네비게이션
- **LLM 보정 번역(선택)**: Claude API 또는 OpenAI API 키를 입력하면 OCR 문맥 보정 + 고품질 번역
- **PNG 다운로드**: 현재 페이지를 원문/번역 상태 그대로 이미지로 저장
- **모바일 대응**: 반응형 레이아웃

## 번역 엔진

| 환경 | 번역 수단 |
|------|-----------|
| 데스크톱 Chrome / Edge 138+ | 내장 Translator API (무료, 온디바이스) |
| 모바일 / 기타 브라우저 | 사용자 본인 API 키(Claude·OpenAI) 입력 시 동작 |
| 키 없음 + 미지원 브라우저 | 텍스트 추출·OCR까지만, 번역은 안내 후 비활성 |

> Chrome 내장 Translator API는 **데스크톱 Chrome/Edge 138+ 전용**입니다(모바일·Web Worker 미지원).
> 모바일에서 번역하려면 설정에서 API 키를 입력하세요.

## 사용법

1. PDF를 끌어다 놓거나 선택
2. (선택) ⚙️ 설정에서 원문/번역 언어, OCR 언어, API 키 지정
3. **번역하기** 클릭 → 원문/번역 토글로 비교
4. 필요 시 ⬇️로 PNG 저장

## 기술 스택

- [pdf.js](https://mozilla.github.io/pdf.js/) — 렌더링 + 텍스트 좌표 추출
- [Tesseract.js](https://tesseract.js.org/) — 스캔본 OCR
- [Chrome Translator API](https://developer.chrome.com/docs/ai/translator-api) — 내장 번역
- Claude / OpenAI API — 선택적 LLM 보정

빌드 도구 없는 순수 정적 사이트(HTML/CSS/ESM). GitHub Pages로 그대로 배포됩니다.

## 개인정보

- PDF·텍스트·이미지는 브라우저에서만 처리됩니다.
- API 키는 이 브라우저(localStorage)에만 저장됩니다.
- 번역 요청(LLM)은 사용자가 입력한 키로 해당 제공자에 직접 전송됩니다. 그 외 외부 전송은 없습니다.
