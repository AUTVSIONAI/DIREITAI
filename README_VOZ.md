# Sistema de Clonagem de Voz Próprio (DireitaAI)

Este projeto contém um microsserviço Python para rodar o modelo de IA de clonagem de voz (XTTS v2) localmente usando Docker.

## Pré-requisitos

1.  **Docker Desktop** instalado e rodando.
2.  (Opcional mas recomendado) Placa de Vídeo NVIDIA com drivers atualizados e suporte a CUDA no Docker. Se não tiver, vai rodar na CPU (lento).

## Como Rodar

1.  Abra o terminal na pasta `ai-voice-service`:
    ```bash
    cd ai-voice-service
    ```

2.  Suba o container:
    ```bash
    docker-compose up --build
    ```

    *Nota: Na primeira vez, o sistema vai baixar o modelo de IA (alguns GBs). Isso pode levar alguns minutos dependendo da sua internet.*

3.  O serviço estará rodando em: `http://localhost:8005`

    Você pode verificar a documentação da API em:
    `http://localhost:8005/docs`

## Como Testar (Sem o Frontend)

Você pode testar a API diretamente pelo navegador acessando a documentação automática:
`http://localhost:8005/docs`

### 1. Cadastrar uma Voz (Treino)
1. Vá em `POST /voices` -> `Try it out`.
2. `name`: Nome do político (ex: "Bolsonaro").
3. `file`: Upload de um áudio `.wav` limpo (30s a 1min idealmente).
4. Execute. Copie o `voice_id` retornado.

### 2. Gerar Áudio (TTS)
1. Vá em `POST /tts` -> `Try it out`.
2. `text`: "Olá patriota, estamos juntos nessa batalha."
3. `voice_id`: Cole o ID que você copiou.
4. `language`: `pt`.
5. Execute e ouça o áudio gerado.

## Integração com Frontend

O frontend se comunica com o serviço de voz através do endpoint `/api/voice/clone`.
Certifique-se de que a configuração do político esteja apontando para:

1. Provider: `local`
2. URL da API: `http://localhost:8005` (padrão).
