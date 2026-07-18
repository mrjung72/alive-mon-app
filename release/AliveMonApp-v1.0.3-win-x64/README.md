# Alive Mon App

서버 텔넷 접속 확인 도구 (Server Telnet Connection Monitor)

원격 서버의 텔넷 접속 여부를 확인하는 경량화된 도구입니다. 완전 폐쇄망에서도 실행 가능하도록 외부 의존성을 최소화했습니다.

## 특징

- **경량화**: 외부 의존성 없이 Node.js 내장 모듈만 사용
- **폐쇄망 지원**: 인터넷 연결 없이 완전히 독립적으로 실행 가능
- **CSV 기반**: CSV 파일로 서버 목록을 관리하여 대량 점검 지원
- **다국어 지원**: 한국어/영어 인터페이스
- **비대화형 실행**: 배치 파일이나 스케줄러에서 자동화 실행 가능

## 설치

```bash
npm install
```

## 사용법

### 대화형 모드

```bash
npm start
# 또는
node app.js
```

### 비대화형 모드 (CLI)

```bash
node app.js --mode=telnet --csv=request/server_list.csv --timeout=5
```

### 언어 설정

```bash
# 한국어
node app.js --lang=kr

# 영어 (기본값)
node app.js --lang=en
```

## CSV 파일 형식

`request/` 디렉토리에 `SERVER*.csv` 형식의 파일을 배치하세요.

```csv
server_ip,port,server_name
192.168.1.1,22,SSH Server
192.168.1.2,80,Web Server
192.168.1.3,3306,MySQL Server
google.com,80,Google HTTP
```

**필수 컬럼:**
- `server_ip`: 서버 IP 주소 또는 도메인
- `port`: 포트 번호

**선택 컬럼:**
- `server_name`: 서버 설명 (출력용)

## 실행 파일 빌드

```bash
npm run build
```

빌드된 실행 파일은 `dist/alive-mon-app-v1.0.0.exe`로 생성됩니다.

## CLI 옵션

```
--mode=telnet          텔넷 접속 확인 실행
--csv=<path>           CSV 파일 경로 (비대화형 모드 필수)
--timeout=<seconds>    연결 타임아웃 (초, 기본값: 3)
--lang=<en|kr>         언어 설정 (기본값: en)
--help                 도움말 표시
```

## 결과

결과는 `results/` 디렉토리에 CSV 파일로 저장됩니다.

```csv
timestamp,pc_ip,server_ip,port,server_name,result_code,error_code,error_msg,collapsed_time
2024-01-15T10:30:45.123Z,192.168.1.100,192.168.1.1,22,SSH Server,SUCCESS,,0.05
2024-01-15T10:30:45.234Z,192.168.1.100,192.168.1.2,80,Web Server,SUCCESS,,0.08
```

## 제한 사항

- 최대 파일 크기: 200KB
- 최대 행 수: 500개
- 지원 포트 범위: 1-65535

## 시스템 요구사항

- Node.js 18 이상
- Windows x64 (실행 파일 빌드 시)
