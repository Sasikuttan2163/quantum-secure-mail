// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Atom, Lock, Mail, Key, Server, Eye, EyeOff, 
  CheckCircle2, XCircle, AlertCircle, Loader2,
  ChevronDown, HelpCircle, Settings
} from 'lucide-react';
import useStore from '../store/useStore';

const LoginScreen = ({ onLoginSuccess }) => {
  const { login, connectToKM, isLoading } = useStore();
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Email config
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // KM config
  const [kmEndpoint, setKmEndpoint] = useState('');
  const [saeId, setSaeId] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Status
  const [emailStatus, setEmailStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [kmStatus, setKmStatus] = useState(null);
  const [error, setError] = useState('');

  const providers = [
    { value: 'gmail', label: 'Gmail', icon: '📧' },
    { value: 'outlook', label: 'Outlook', icon: '📨' },
    { value: 'yahoo', label: 'Yahoo', icon: '📩' },
    { value: 'imap', label: 'Custom IMAP', icon: '⚙️' },
  ];

  const handleTestEmail = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    setEmailStatus('testing');
    setError('');
    
    // Simulate testing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEmailStatus('success');
  };

  const handleTestKM = async () => {
    if (!kmEndpoint || !saeId || !apiKey) {
      setError('Please fill in all Key Manager fields');
      return;
    }
    
    setKmStatus('testing');
    setError('');
    
    // Simulate testing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setKmStatus('success');
  };

  const handleSignIn = async () => {
    setError('');
    
    // Validate email
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    // Login
    const result = await login({ email, password, provider: emailProvider });
    
    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }
    
    // Connect to KM if configured
    if (kmEndpoint && saeId && apiKey) {
      await connectToKM({ endpoint: kmEndpoint, saeId, apiKey });
    }
    
    onLoginSuccess();
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl"
          >
            <Atom className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">QuMail</h1>
          <p className="text-gray-400">Quantum Secure Email</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
        >
          {/* Email Configuration Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Email Service Configuration</h2>
            </div>
            
            {/* Provider dropdown */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Email Provider</label>
              <div className="relative">
                <select
                  value={emailProvider}
                  onChange={(e) => setEmailProvider(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {providers.map(p => (
                    <option key={p.value} value={p.value} className="bg-gray-800">
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Email input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {emailStatus === 'success' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
            </div>

            {/* Password input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-white/5 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">Remember Me</span>
            </label>

            {/* Test connection button */}
            <button
              onClick={handleTestEmail}
              disabled={emailStatus === 'testing' || !email || !password}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
            >
              {emailStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : emailStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Server className="w-4 h-4" />
              )}
              {emailStatus === 'success' ? 'Connection Verified' : 'Test Connection'}
            </button>
          </div>

          {/* Quantum Key Manager Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Quantum Key Manager Setup</h2>
              <span className="text-xs text-gray-500">(Optional)</span>
            </div>
            
            {/* KM Endpoint */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">KM Endpoint URL</label>
              <input
                type="text"
                value={kmEndpoint}
                onChange={(e) => setKmEndpoint(e.target.value)}
                placeholder="https://km.example.com/api/v1"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* SAE ID */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">SAE ID</label>
              <input
                type="text"
                value={saeId}
                onChange={(e) => setSaeId(e.target.value)}
                placeholder="SAE_12345"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Test KM connection */}
            <button
              onClick={handleTestKM}
              disabled={kmStatus === 'testing' || !kmEndpoint || !saeId || !apiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
            >
              {kmStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : kmStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {kmStatus === 'success' ? 'KM Connected' : 'Test Connection'}
            </button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-3 bg-red-500/10 border-b border-red-500/20"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="p-6">
            <div className="flex gap-3">
              <button
                onClick={() => window.close?.() || window.location.reload()}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignIn}
                disabled={isLoading || !email || !password}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <button className="text-gray-400 hover:text-white flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Advanced Settings
              </button>
              <span className="text-gray-600">|</span>
              <button className="text-gray-400 hover:text-white flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                Need Help?
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;