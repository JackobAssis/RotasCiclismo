import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { SignInRequestDto } from '../api/types';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInRequestDto>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const errors: Record<string, string | null> = {
    email: touched.email
      ? !formData.email
        ? 'Email é obrigatório'
        : !validateEmail(formData.email)
          ? 'Email inválido'
          : null
      : null,
    password: touched.password
      ? !formData.password
        ? 'Senha é obrigatória'
        : formData.password.length < 6
          ? 'Senha deve ter pelo menos 6 caracteres'
          : null
      : null,
  };

  const isFormValid =
    formData.email &&
    formData.password &&
    validateEmail(formData.email) &&
    formData.password.length >= 6 &&
    !isLoading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);
    try {
      await authService.signin(formData);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no login';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neon-500/10 border border-neon-500/20 flex items-center justify-center text-neon-400 text-2xl font-bold mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500">Entre para continuar suas pedaladas</p>
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
              placeholder="••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
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
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Não tem conta?{' '}
            <Link
              to="/signup"
              className="text-neon-400 hover:text-neon-300 hover:underline font-medium transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700">Seus dados são criptografados e seguros.</p>
        </div>
      </div>
    </div>
  );
}
