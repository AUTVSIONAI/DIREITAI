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

async function setupStoragePolicies() {
  try {
    console.log('🔐 Configurando políticas de acesso do Supabase Storage...');
    
    // Política para permitir upload de arquivos para usuários autenticados
    const uploadPolicy = {
      name: 'Allow authenticated users to upload images',
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      command: 'INSERT'
    };
    
    // Política para permitir leitura pública de arquivos
    const readPolicy = {
      name: 'Allow public read access to images',
      definition: 'true',
      check: null,
      command: 'SELECT'
    };
    
    // Política para permitir atualização de arquivos para usuários autenticados
    const updatePolicy = {
      name: 'Allow authenticated users to update images',
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      command: 'UPDATE'
    };
    
    // Política para permitir exclusão de arquivos para usuários autenticados
    const deletePolicy = {
      name: 'Allow authenticated users to delete images',
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      command: 'DELETE'
    };
    
    console.log('📝 Criando políticas de acesso...');
    
    // Executar SQL para criar as políticas
    const policies = [
      `
      -- Política para upload (INSERT)
      CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'images');
      `,
      `
      -- Política para leitura pública (SELECT)
      CREATE POLICY "Allow public read access to images" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'images');
      `,
      `
      -- Política para atualização (UPDATE)
      CREATE POLICY "Allow authenticated users to update images" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'images')
      WITH CHECK (bucket_id = 'images');
      `,
      `
      -- Política para exclusão (DELETE)
      CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'images');
      `
    ];
    
    for (const policy of policies) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.log('⚠️  Política pode já existir:', error.message);
        } else {
          console.log('✅ Política criada com sucesso');
        }
      } catch (err) {
        console.log('⚠️  Erro ao criar política (pode já existir):', err.message);
      }
    }
    
    // Testar upload novamente
    console.log('🧪 Testando upload com políticas configuradas...');
    
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
        contentType: 'image/png'
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
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('images')
        .remove([`test/${testFileName}`]);
      
      console.log('🧹 Arquivo de teste removido');
    }
    
    console.log('🎉 Configuração das políticas concluída!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar configuração
setupStoragePolicies();