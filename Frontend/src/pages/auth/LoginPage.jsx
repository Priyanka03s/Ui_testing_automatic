import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Sparkles, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 text-center">
        {/* Brand */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white m-0">
            Sign in to DesignCheck AI
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="text-left border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-gray-800/80 space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
              Quick Demo Fill
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@designcheck.ai', 'AdminPass123!')}
                className="p-2 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-left transition"
              >
                <div className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">admin@designcheck.ai</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('priyanka@example.com', 'Priyanka123!')}
                className="p-2 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-left transition"
              >
                <div className="text-xs font-semibold text-blue-300 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Normal User</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">priyanka@example.com</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
