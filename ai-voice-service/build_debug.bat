docker build -t direitaai-voice . > build_log.txt 2>&1
if %errorlevel% neq 0 (
    echo Build failed! >> build_log.txt
    exit /b %errorlevel%
)
docker-compose up -d
