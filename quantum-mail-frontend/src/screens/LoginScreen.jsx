// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Atom, Lock, AlertCircle, Loader2, Shield, ArrowRight, CheckCircle2
} from 'lucide-react';
import useStore from '../store/useStore';

const LoginScreen = ({ onLoginSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    // Simulate connection check to backend
    try {
      // In a real implementation, you might want to ping the backend
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Wait a bit to show success, then proceed
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
      
    } catch (err) {
      setError('Unable to connect to backend. Please ensure the backend server is running on port 8001.');
      setIsConnecting(false);
    }
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
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl"
          >
            <Atom className="w-14 h-14 text-white" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-3">QuMail</h1>
          <p className="text-xl text-gray-300 mb-2">Quantum Secure Email</p>
          <p className="text-sm text-gray-400">End-to-end encryption powered by quantum keys</p>
        </div>

        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
        >
          {/* Features */}
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Quantum Key Distribution</div>
                  <div className="text-sm text-gray-400">ETSI GS QKD 014 compatible</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Multi-Level Security</div>
                  <div className="text-sm text-gray-400">OTP, AES-CFB, Kyber-512</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Gmail Compatible</div>
                  <div className="text-sm text-gray-400">Works with existing email</div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-1">Backend Configuration Required</p>
                  <p>Email credentials and QKD settings are configured in the backend's <code className="text-blue-300 bg-white/10 px-1 rounded">.env</code> file.</p>
                  <p className="mt-2">Ensure the backend is running on <code className="text-blue-300 bg-white/10 px-1 rounded">http://localhost:8001</code></p>
                </div>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={isConnecting || success}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting to Backend...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Connected Successfully
                </>
              ) : (
                <>
                  Launch QuMail
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>Quantum Email Client v1.0.0</p>
              <p className="mt-1">Educational & Research Use</p>
            </div>
          </div>
        </motion.div>

        {/* Status Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Frontend Ready</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Awaiting Backend</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;