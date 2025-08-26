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

async function fixBucketConfiguration() {
  try {
    console.log('🔧 Corrigindo configuração do bucket...');
    
    // Primeiro, vamos deletar o bucket atual e recriar com configurações corretas
    console.log('🗑️  Removendo bucket atual...');
    
    const { error: deleteError } = await supabase.storage.deleteBucket('images');
    if (deleteError) {
      console.log('⚠️  Erro ao deletar bucket (pode não existir):', deleteError.message);
    }
    
    console.log('📦 Criando novo bucket com configurações públicas...');
    
    // Criar bucket público
    const { data, error } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5242880, // 5MB
      avifAutoDetection: false
    });
    
    if (error) {
      console.error('❌ Erro ao criar bucket:', error);
      return;
    }
    
    console.log('✅ Bucket público criado com sucesso!');
    
    // Aguardar um pouco para o bucket ser configurado
    console.log('⏳ Aguardando configuração do bucket...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Testar upload
    console.log('🧪 Testando upload no bucket público...');
    
    // Criar um buffer de imagem PNG válido (1x1 pixel)
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testFileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`test/${testFileName}`, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(`test/${testFileName}`);
      
      console.log('🌐 URL pública de teste:', publicUrlData.publicUrl);
      
      // Testar se a URL é acessível
      try {
        const response = await fetch(publicUrlData.publicUrl);
        if (response.ok) {
          console.log('✅ URL pública acessível!');
        } else {
          console.log('⚠️  URL pública não acessível:', response.status);
        }
      } catch (fetchError) {
        console.log('⚠️  Erro ao testar URL pública:', fetchError.message);
      }
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('images')
        .remove([`test/${testFileName}`]);
      
      console.log('🧹 Arquivo de teste removido');
    }
    
    console.log('🎉 Configuração do bucket corrigida!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar correção
fixBucketConfiguration();