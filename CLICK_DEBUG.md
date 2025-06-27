# 클릭 이벤트 디버깅 가이드

## 문제 상황
- 건물 클릭과 빈 공간 클릭이 동시에 작동하지 않음
- 한쪽이 작동하면 다른 쪽이 작동하지 않는 상황 반복

## 현재 구조
1. BuildingClickLayerFixed 내부에:
   - 배경 Graphics (zIndex: -1) - 빈 공간 클릭 처리
   - 건물 Container들 (zIndex: 100) - 건물 클릭 처리

## 디버깅 방법
1. 브라우저 개발자 도구 콘솔 열기
2. 건물 클릭 시: "Building clicked: [id]" 출력되어야 함
3. 빈 공간 클릭 시: "Background clicked" 출력되어야 함

## 예상되는 문제
- 배경 Graphics가 Container 내부에서 다른 요소들을 가리고 있을 수 있음
- zIndex가 제대로 작동하지 않을 수 있음
EOF < /dev/null
