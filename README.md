# Alive Mon App

서버 텔넷 접속 확인 도구 (Server Telnet Connection Monitor)

원격 서버의 텔넷 접속 여부를 확인하는 경량화된 도구입니다.

## 특징

- **폐쇄망 지원**: 인터넷 연결 없이 완전히 독립적으로 실행 가능
- **CSV 기반**: CSV 파일로 서버 목록을 관리하여 대량 점검 지원
- **비대화형 실행**: 배치 파일이나 스케줄러에서 자동화 실행 가능

## CSV 파일 형식

`request/` 디렉토리에 `*.csv` 형식의 파일을 생성 하세요. (샘플파일 참조)
 
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


## 실행 파일

`alive-mon-app-vX.X.X.exe`을 실행 합니다.

## 결과

결과는 `results/` 디렉토리에 CSV 파일로 저장됩니다.

```csv
timestamp,pc_ip,server_ip,port,server_name,result_code,error_code,error_msg,collapsed_time
2024-01-15T10:30:45.123Z,192.168.1.100,192.168.1.1,22,SSH Server,SUCCESS,,0.05
2024-01-15T10:30:45.234Z,192.168.1.100,192.168.1.2,80,Web Server,SUCCESS,,0.08
```
