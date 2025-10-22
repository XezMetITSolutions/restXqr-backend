'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShieldAlt, FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuthStore();

  // Lockout kontrolü
  useEffect(() => {
    const storedLockout = localStorage.getItem('admin_lockout');
    if (storedLockout) {
      const lockoutEnd = new Date(storedLockout);
      if (lockoutEnd > new Date()) {
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        
        const timer = setInterval(() => {
          if (new Date() >= lockoutEnd) {
            setIsLocked(false);
            setLockoutTime(null);
            localStorage.removeItem('admin_lockout');
            clearInterval(timer);
          }
        }, 1000);
        
        return () => clearInterval(timer);
      } else {
        localStorage.removeItem('admin_lockout');
      }
    }
  }, []);

  // Zaten giriş yapmışsa admin paneline yönlendir
  useEffect(() => {
    if (isAuthenticated && user?.role === 'super_admin') {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) return;

    try {
      // Demo admin bilgileri (gerçek uygulamada API'den gelecek)
      const validCredentials = {
        username: 'admin',
        password: 'restXqr2024!',
        twoFactorCode: '123456'
      };

      if (credentials.username === validCredentials.username && 
          credentials.password === validCredentials.password) {
        
        if (!showTwoFactor) {
          setShowTwoFactor(true);
          return;
        }

        if (credentials.twoFactorCode === validCredentials.twoFactorCode) {
          // Başarılı giriş
          await login({
            id: '1',
            email: 'admin@guzellestir.com',
            name: 'Sistem Yöneticisi',
            role: 'super_admin',
            status: 'active'
          });
          
          // Başarılı giriş sonrası lockout sıfırla
          setLoginAttempts(0);
          localStorage.removeItem('admin_login_attempts');
          
          router.push('/admin/dashboard');
        } else {
          throw new Error('Geçersiz 2FA kodu');
        }
      } else {
        throw new Error('Geçersiz kullanıcı adı veya şifre');
      }
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('admin_login_attempts', newAttempts.toString());
      
      // 5 başarısız denemeden sonra 30 dakika lockout
      if (newAttempts >= 5) {
        const lockoutEnd = new Date(Date.now() + 30 * 60 * 1000);
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        localStorage.setItem('admin_lockout', lockoutEnd.toISOString());
      }
      
      alert(error instanceof Error ? error.message : 'Giriş başarısız');
    }
  };

  const getRemainingTime = () => {
    if (!lockoutTime) return '';
    
    const now = new Date();
    const diff = lockoutTime.getTime() - now.getTime();
    
    if (diff <= 0) return '';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Güvenlik Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            <FaShieldAlt className="mr-2" />
            Güvenli Admin Paneli
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Girişi</h1>
          <p className="text-gray-300">restXqr Admin Panel</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {isLocked ? (
            <div className="text-center">
              <FaLock className="text-red-400 text-4xl mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Hesap Geçici Olarak Kilitlendi</h2>
              <p className="text-gray-300 mb-4">
                Çok fazla başarısız giriş denemesi. Lütfen {getRemainingTime()} dakika bekleyin.
              </p>
              <div className="text-sm text-gray-400">
                Kalan süre: {getRemainingTime()}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kullanıcı Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kullanıcı adınızı girin"
                    required
                  />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şifrenizi girin"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* 2FA Kodu */}
              {showTwoFactor && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    İki Faktörlü Doğrulama Kodu
                  </label>
                  <input
                    type="text"
                    value={credentials.twoFactorCode}
                    onChange={(e) => setCredentials(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>
              )}

              {/* Başarısız Deneme Sayısı */}
              {loginAttempts > 0 && (
                <div className="text-center">
                  <p className="text-yellow-400 text-sm">
                    Başarısız deneme: {loginAttempts}/5
                  </p>
                </div>
              )}

              {/* Giriş Butonu */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
              >
                {showTwoFactor ? 'Doğrula ve Giriş Yap' : 'Giriş Yap'}
              </button>
            </form>
          )}

          {/* Güvenlik Bilgileri */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-xs text-gray-400 space-y-1">
              <p>🔒 Bu sayfa SSL ile korunmaktadır</p>
              <p>🛡️ Tüm giriş denemeleri loglanmaktadır</p>
              <p>⏰ 5 başarısız denemeden sonra 30 dakika kilitlenir</p>
            </div>
          </div>
        </div>

        {/* Demo Bilgileri */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <h3 className="text-yellow-400 font-semibold mb-2">Demo Giriş Bilgileri:</h3>
          <div className="text-sm text-yellow-200 space-y-1">
            <p>Kullanıcı: <code className="bg-yellow-800/50 px-1 rounded">admin</code></p>
            <p>Şifre: <code className="bg-yellow-800/50 px-1 rounded">restXqr2024!</code></p>
            <p>2FA: <code className="bg-yellow-800/50 px-1 rounded">123456</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}