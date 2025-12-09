flowchart TD
    %% 시작
    START([앱 접속]) --> AUTH{로그인?}
    
    %% 인증
    AUTH -->|No| LOGIN[로그인/회원가입]
    AUTH -->|Yes| HOME
    LOGIN --> HOME[🏠 홈 피드]
    
    %% 메인 네비게이션
    HOME --> POST_VIEW[게시물 보기]
    HOME --> CREATE[➕ 게시물 작성]
    HOME --> PROFILE[👤 프로필]
    
    %% 게시물 작성
    CREATE --> UPLOAD[이미지 업로드]
    UPLOAD --> CAPTION[캡션 작성]
    CAPTION --> PUBLISH[게시]
    PUBLISH --> HOME
    
    %% 게시물 인터랙션
    POST_VIEW --> LIKE[❤️ 좋아요]
    POST_VIEW --> COMMENT[💬 댓글]
    POST_VIEW --> DELETE[🗑️ 삭제]
    LIKE --> POST_VIEW
    COMMENT --> POST_VIEW
    DELETE --> HOME
    
    %% 프로필
    PROFILE --> MY{내 프로필?}
    MY -->|Yes| MY_POSTS[내 게시물 그리드]
    MY -->|No| FOLLOW[팔로우/언팔로우]
    MY_POSTS --> POST_VIEW
    FOLLOW --> PROFILE
    