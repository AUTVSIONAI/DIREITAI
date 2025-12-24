FROM python:3.10-slim

WORKDIR /app

# Instalar dependências do sistema necessárias para compilação e áudio
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install torch first to leverage caching and avoid timeouts
# This is heavy, so we do it before copying requirements which change more often
RUN pip install --no-cache-dir torch==2.1.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cu118

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -v -r requirements.txt --timeout=1000

# Force downgrade transformers to compatible version after TTS installs a newer one
RUN pip uninstall -y transformers && pip install --no-cache-dir transformers==4.33.0

# Aceitar licença do Coqui TOS (necessário para alguns modelos)
ENV COQUI_TOS_AGREED=1

# Copiar o código
COPY . .

# Expor a porta
EXPOSE 8005

# Comando para rodar
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
