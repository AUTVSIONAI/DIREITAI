const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

// Configuração do Supabase com service role key para operações administrativas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupVoicesBucket() {
  try {
    console.log('🚀 Configurando bucket "voices" do Supabase Storage...');
    
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    console.log('📋 Buckets existentes:', buckets.map(b => b.name));
    
    const bucketExists = buckets.some(bucket => bucket.name === 'voices');
    
    if (bucketExists) {
      console.log('✅ Bucket "voices" já existe!');
    } else {
      console.log('📦 Criando bucket "voices"...');
      
      // Criar o bucket
      const { data, error } = await supabase.storage.createBucket('voices', {
        public: true, // Arquivos de voz podem ser públicos para leitura
        allowedMimeTypes: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('❌ Erro ao criar bucket:', error);
        return;
      }
      
      console.log('✅ Bucket "voices" criado com sucesso!');
    }
    
    // Testar upload
    console.log('🧪 Testando upload...');
    const testBuffer = Buffer.from('test audio data');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voices')
      .upload(`test/${testFileName}`, testBuffer, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('voices')
        .getPublicUrl(`test/${testFileName}`);
      
      console.log('🌐 URL pública de teste:', publicUrlData.publicUrl);
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('voices')
        .remove([`test/${testFileName}`]);
      
      console.log('🧹 Arquivo de teste removido');
    }
    
    console.log('🎉 Configuração do Supabase Storage concluída!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar configuração
setupVoicesBucket();
