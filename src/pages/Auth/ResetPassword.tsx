import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há sessão de "recovery" após abrir link do email
    const checkRecoverySession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Erro ao obter usuário na recuperação:', error.message);
        }
        // Se houver usuário, podemos prosseguir com a atualização de senha
        setReady(!!user);
        if (!user) {
          setError('Link inválido ou expirado. Solicite novamente a recuperação de senha.');
        }
      } catch (err) {
        setError('Não foi possível validar sua sessão de recuperação.');
        setReady(false);
      }
    };
    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.updatePassword({ password, confirmPassword });
      if (result.success) {
        setMessage('Senha atualizada com sucesso. Você já pode fazer login.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(result.error || 'Não foi possível atualizar a senha.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Definir nova senha</h2>
          <p className="mt-2 text-sm text-gray-600">Crie sua nova senha para acessar sua conta.</p>
        </div>
        <div className="card p-6">
          {!ready ? (
            <div className="text-sm text-gray-700">
              {error || 'Validando seu link de recuperação...'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {message && <div className="text-green-600 text-sm">{message}</div>}
              {error && <div className="text-red-600 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')} className="text-primary-600 hover:text-primary-700 text-sm">
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;