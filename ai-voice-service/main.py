from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from TTS.api import TTS
import torch
import os
import uuid
import io

import subprocess
import shutil

def convert_to_wav(input_path):
    """
    Converts audio to 16-bit PCM WAV using ffmpeg if possible.
    Returns the path to the converted file (or original if conversion fails).
    """
    try:
        output_path = input_path.rsplit('.', 1)[0] + "_converted.wav"
        
        # Check if ffmpeg is available
        try:
            subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ FFmpeg not found, skipping conversion.")
            return input_path

        print(f"🔄 Converting {input_path} to WAV...")
        # Convert to 22050Hz mono WAV (good for TTS)
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, 
            "-ac", "1", "-ar", "22050", 
            output_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print(f"✅ Converted to {output_path}")
        return output_path
    except Exception as e:
        print(f"❌ Error converting audio: {e}")
        return input_path

app = FastAPI(title="DireitaAI Voice Service")

# Configurar Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Conectado ao Supabase!")
    except Exception as e:
        print(f"❌ Erro ao conectar ao Supabase: {e}")
else:
    print("⚠️ Supabase não configurado via variáveis de ambiente.")

# Configurar CORS (Permitir que o frontend React acesse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja para seu domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração do Modelo
# Vamos usar o XTTS v2 que é multilingue e suporta clonagem
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Iniciando Serviço de Voz no dispositivo: {DEVICE}")

# Carregar modelo na inicialização (pode demorar na primeira vez para baixar)
try:
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(DEVICE)
    print("✅ Modelo XTTS v2 carregado com sucesso!")
except Exception as e:
    print(f"❌ Erro ao carregar modelo: {e}")
    tts = None

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

VOICES_DIR = "stored_voices"
os.makedirs(VOICES_DIR, exist_ok=True)

@app.get("/")
def health_check():
    return {"status": "online", "device": DEVICE, "model": "xtts_v2", "stored_voices": len(os.listdir(VOICES_DIR))}

@app.post("/voices")
async def upload_voice(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Uploads a voice reference file to be used for cloning.
    Returns a voice_id.
    """
    voice_id = str(uuid.uuid4())
    # Sanitize name for filename
    safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
    filename = f"{voice_id}_{safe_name}.wav"
    file_path = os.path.join(VOICES_DIR, filename)
    
    content = await file.read()
    
    # Save locally (cache)
    with open(file_path, "wb") as buffer:
        buffer.write(content)
        
    # Ensure it's a valid WAV
    converted_path = convert_to_wav(file_path)
    if converted_path != file_path:
        # Replace original with converted
        shutil.move(converted_path, file_path)
        # Update content for upload
        with open(file_path, "rb") as f:
            content = f.read()

    # Upload to Supabase Storage
    if supabase:
        try:
            # Re-wrap content for upload if needed, or pass bytes directly
            supabase.storage.from_("voices").upload(filename, content, {"content-type": "audio/wav"})
            print(f"✅ Voz {filename} enviada para o Supabase Storage")
        except Exception as e:
            print(f"❌ Erro ao enviar para Supabase: {e}")
            # Continue normally, local cache works
        
    return {
        "voice_id": voice_id,
        "filename": filename,
        "message": "Voice reference saved successfully."
    }

@app.get("/voices")
def list_voices():
    voices = []
    local_files = set()
    
    # List from local (cache)
    if os.path.exists(VOICES_DIR):
        for filename in os.listdir(VOICES_DIR):
            if filename.endswith(".wav"):
                local_files.add(filename)
                parts = filename.split("_", 1)
                if len(parts) == 2:
                    voices.append({"id": parts[0], "name": parts[1].replace(".wav", ""), "source": "local"})

    # List from Supabase
    if supabase:
        try:
            res = supabase.storage.from_("voices").list()
            # res is usually a list of dicts or objects depending on the client version
            # In supabase-py v2, it returns a list of objects or dicts
            files = res if isinstance(res, list) else []
            
            for file in files:
                # Handle both object (attr) and dict (key) access if unsure, but dict is standard for list()
                filename = file.get('name') if isinstance(file, dict) else getattr(file, 'name', None)
                
                if filename and filename not in local_files and filename.endswith(".wav"):
                    parts = filename.split("_", 1)
                    if len(parts) == 2:
                        voices.append({"id": parts[0], "name": parts[1].replace(".wav", ""), "source": "supabase"})
        except Exception as e:
            print(f"❌ Erro ao listar do Supabase: {e}")

    return voices

@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    voice_id: str = Form(None),
    language: str = Form("pt")
):
    """
    Synthesizes speech using a stored voice_id.
    """
    if not tts:
        raise HTTPException(status_code=500, detail="Modelo de voz não está carregado.")

    if not voice_id:
        raise HTTPException(status_code=400, detail="voice_id is required.")

    # Find the voice file
    speaker_wav = None
    
    # Check local first
    if os.path.exists(VOICES_DIR):
        for filename in os.listdir(VOICES_DIR):
            if filename.startswith(voice_id):
                speaker_wav = os.path.join(VOICES_DIR, filename)
                break
            
    # If not found locally, check Supabase
    if not speaker_wav and supabase:
        try:
            print(f"🔍 Voz {voice_id} não encontrada localmente. Buscando no Supabase...")
            res = supabase.storage.from_("voices").list()
            files = res if isinstance(res, list) else []
            
            target_file = None
            for f in files:
                fname = f.get('name') if isinstance(f, dict) else getattr(f, 'name', None)
                if fname and fname.startswith(voice_id):
                    target_file = fname
                    break
            
            if target_file:
                print(f"⬇️ Baixando {target_file} do Supabase...")
                # Download file
                data = supabase.storage.from_("voices").download(target_file)
                save_path = os.path.join(VOICES_DIR, target_file)
                with open(save_path, "wb") as f:
                    f.write(data)
                speaker_wav = save_path
                print(f"✅ Voz baixada e salva em {speaker_wav}")
        except Exception as e:
            print(f"❌ Erro ao buscar/baixar do Supabase: {e}")

    if not speaker_wav:
        raise HTTPException(status_code=404, detail="Voice not found")

    output_filename = f"output_{uuid.uuid4()}.wav"
    output_path = os.path.join(TEMP_DIR, output_filename)

    try:
        # Convert to WAV if needed
        converted_path = convert_to_wav(speaker_wav)
        
        # Log to verify which file is being used
        print(f"🎤 Using speaker wav: {converted_path}")

        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=converted_path,
            language=language
        )

        return FileResponse(output_path, media_type="audio/wav", filename="response.wav")

    except Exception as e:
        print(f"❌ Erro na geração de voz: {str(e)}")
        # Try to delete potentially corrupted converted file
        if 'converted' in str(speaker_wav) and os.path.exists(speaker_wav):
             os.remove(speaker_wav)
        raise HTTPException(status_code=500, detail=f"Erro na geração de voz: {str(e)}")

@app.post("/clone-speech")
async def clone_speech(
    text: str = Form(...),
    speaker_wav: UploadFile = File(None),
    language: str = Form("pt")
):
    if not tts:
        raise HTTPException(status_code=500, detail="Modelo de voz não está carregado.")

    if not speaker_wav:
        # Se não enviar áudio, usar um padrão (opcional)
        raise HTTPException(status_code=400, detail="É necessário enviar um arquivo de áudio 'speaker_wav' para clonagem.")

    # Salvar o áudio de referência temporariamente
    temp_speaker_filename = f"{uuid.uuid4()}_{speaker_wav.filename}"
    temp_speaker_path = os.path.join(TEMP_DIR, temp_speaker_filename)
    
    with open(temp_speaker_path, "wb") as buffer:
        content = await speaker_wav.read()
        buffer.write(content)

    output_filename = f"output_{uuid.uuid4()}.wav"
    output_path = os.path.join(TEMP_DIR, output_filename)

    try:
        # Convert to WAV if needed
        temp_speaker_path = convert_to_wav(temp_speaker_path)

        # Gerar a fala clonada
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=temp_speaker_path,
            language=language
        )

        # Limpar arquivo de referência
        os.remove(temp_speaker_path)

        return FileResponse(output_path, media_type="audio/wav", filename="response.wav")

    except Exception as e:
        if os.path.exists(temp_speaker_path):
            os.remove(temp_speaker_path)
        raise HTTPException(status_code=500, detail=f"Erro na geração de voz: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
