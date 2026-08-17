import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { SignUpRequestDto } from '../api/types';

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpRequestDto>({
    email: '',
    username: '',
    password: '',
    displayName: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /^(?=.*[a-zA-Z])(?=.*\d)/.test(password);
  };

  const errors: Record<string, string | null> = {
    email: touched.email
      ? !formData.email
        ? 'Email é obrigatório'
        : !validateEmail(formData.email)
          ? 'Email inválido'
          : null
      : null,
    username: touched.username
      ? !formData.username
        ? 'Usuário é obrigatório'
        : !validateUsername(formData.username)
          ? 'Usuário deve ter 3+ caracteres (letras, números, _, -)'
          : null
      : null,
    password: touched.password
      ? !formData.password
        ? 'Senha é obrigatória'
        : !validatePassword(formData.password)
          ? 'Senha deve ter 8+ caracteres (letras + números)'
          : null
      : null,
    confirmPassword: touched.confirmPassword
      ? !confirmPassword
        ? 'Confirme a senha'
        : confirmPassword !== formData.password
          ? 'Senhas não conferem'
          : null
      : null,
  };

  const isFormValid =
    formData.email &&
    formData.username &&
    formData.password &&
    confirmPassword &&
    validateEmail(formData.email) &&
    validateUsername(formData.username) &&
    validatePassword(formData.password) &&
    confirmPassword === formData.password &&
    !isLoading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    try {
      await authService.signup(formData);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no cadastro';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neon-500/10 border border-neon-500/20 flex items-center justify-center text-neon-400 text-2xl font-bold mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Criar conta</h1>
          <p className="text-sm text-gray-500">Comece a registrar suas aventuras de ciclismo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 bg-dark-800 border rounded-xl text-sm transition-all duration-200 ${
                errors.email
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-dark-700 hover:border-dark-600 focus:border-neon-700'
              } text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neon-500/20`}
              placeholder="seu@email.com"
              autoFocus
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 bg-dark-800 border rounded-xl text-sm transition-all duration-200 ${
                errors.username
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-dark-700 hover:border-dark-600 focus:border-neon-700'
              } text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neon-500/20`}
              placeholder="seu_usuario"
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
              Nome de exibição <span className="text-xs text-gray-600">(opcional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName || ''}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 hover:border-dark-600 focus:border-neon-700 rounded-xl text-sm text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neon-500/20 transition-all duration-200"
              placeholder="Seu Nome"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 bg-dark-800 border rounded-xl text-sm transition-all duration-200 ${
                errors.password
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-dark-700 hover:border-dark-600 focus:border-neon-700'
              } text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neon-500/20`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 bg-dark-800 border rounded-xl text-sm transition-all duration-200 ${
                errors.confirmPassword
                  ? 'border-red-800 bg-red-900/10'
                  : 'border-dark-700 hover:border-dark-600 focus:border-neon-700'
              } text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neon-500/20`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full px-4 py-2.5 bg-neon-500 hover:bg-neon-400 disabled:bg-dark-700 disabled:text-gray-600 text-black font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-500/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Criando conta...</span>
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="text-neon-400 hover:text-neon-300 hover:underline font-medium transition-colors"
            >
              Entrar
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700">
            Sua senha será criptografada e nunca compartilhada.
          </p>
        </div>
      </div>
    </div>
  );
}
