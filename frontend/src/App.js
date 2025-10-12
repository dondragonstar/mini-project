import React, { useState, useEffect, createContext, useContext } from 'react';
import { OrbBackground, GradientTitle, CTAButton, GlassCard } from './components/AnimatedBits';
import ScrambledText from './components/ScrambledText';
import VariableProximity from './components/VariableProximity';
import AnimatedContent from './components/AnimatedContent';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  const updateUser = (userData) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white font-semibold`}>
      {message}
    </div>
  );
};

const SkeletonLoader = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded h-4 mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-3/4"></div>
  </div>
);

const WordSkeleton = () => (
  <div className="p-4 bg-gray-100 rounded-xl animate-pulse">
    <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
    <div className="h-6 bg-gray-200 rounded w-20"></div>
  </div>
);

const UserProfileModal = ({ isOpen, onClose, user, onUserUpdate, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setNewName(user.name);
    }
  }, [isOpen, user]);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/update_user_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, new_name: newName })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update name');
      
      // Update user data with new avatar
      const updatedUserData = { ...data, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=667eea&color=fff` };
      onUserUpdate(updatedUserData);
      setToast({ message: 'Name updated successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/delete_user_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete data');
      
      setToast({ message: 'All learning data deleted successfully!', type: 'success' });
      setShowConfirmDelete(false);
      // Refresh the page to show updated stats
      window.location.reload();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/delete_account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete account');
      
      setToast({ message: 'Account deleted successfully!', type: 'success' });
      setShowConfirmDeleteAccount(false);
      onLogout();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-gray-900">👤 Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center space-x-4">
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Change Name */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Change Name</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all"
                  placeholder="Enter new name"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading || !newName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? '...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Delete Data */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Danger Zone</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all text-left"
                >
                  🗑️ Delete All Learning Data
                </button>
                <button
                  onClick={() => setShowConfirmDeleteAccount(true)}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-left"
                >
                  🚨 Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full p-2 transition-colors w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Delete Learning Data</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all your learning data? This will remove all your words, progress, and statistics. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 transition-all"
              >
                {loading ? 'Deleting...' : 'Delete Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowConfirmDeleteAccount(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full p-2 transition-colors w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">🚨 Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This will permanently remove your account and all associated data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDeleteAccount(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProcessWordModal = ({ isOpen, onClose, word, result, onProcessWord }) => {
  const [loading, setLoading] = useState(false);
  const [wordResult, setWordResult] = useState(null);

  useEffect(() => {
    if (isOpen && word) {
      // Reset word result when word changes
      setWordResult(null);
      handleProcessWord();
    }
  }, [isOpen, word]);

  const handleProcessWord = async () => {
    if (!word) return;
    
    setLoading(true);
    try {
      // Check if this is a translated word by looking at the context
      const isTranslation = word.includes('(') && word.includes(')');
      const language = isTranslation ? 'en' : 'en'; // Default to English for now
      
      const response = await fetch('http://localhost:5000/process_word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word, language: language, user_id: 1 })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process word');
      
      setWordResult(data);
    } catch (error) {
      console.error('Error processing word:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-gray-900">Word Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-gray-100 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-lg text-gray-600">Processing word...</p>
            </div>
          ) : wordResult ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-4xl font-black text-brand-blue mb-2">{word}</h3>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  wordResult.difficulty > 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  Level {wordResult.difficulty}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-gray-700 text-lg">Definition:</span>
                  <p className="text-gray-600 mt-2 text-lg">{wordResult.definition}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 text-lg">Example:</span>
                  <p className="text-gray-600 mt-2 italic text-lg">{wordResult.sentence}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 text-lg">Memory Aid:</span>
                  <p className="text-gray-600 mt-2 text-lg">{wordResult.mnemonic}</p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => onProcessWord && onProcessWord(word)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-xl"
                >
                  📚 Learn This Word
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 bg-gray-500 text-white font-bold rounded-2xl hover:bg-gray-600 transform hover:scale-105 transition-all duration-200 shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-lg text-gray-600">Failed to load word details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BackgroundOrbs = () => <OrbBackground />;

const LoginPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      const name = data.name || (email.split('@')[0]);
      const userData = { ...data, name, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff` };
      login(userData);
      setToast({ message: 'Welcome back!', type: 'success' });
      setTimeout(() => onNavigate('dashboard'), 500);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-brand-blue to-brand-sand">
      <BackgroundOrbs />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="relative z-10 w-full max-w-md">
        <GlassCard>
          <div className="text-center mb-8 space-y-2">
            <div className="text-6xl mb-2 animate-bounce">🎓</div>
            <GradientTitle title="Welcome Back" subtitle="Sign in to continue learning" />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <CTAButton>
              Sign In
            </CTAButton>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-white text-opacity-80">
              Don't have an account? <button onClick={() => onNavigate('register')} className="text-white font-bold hover:underline">Sign up</button>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const RegisterPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [toast, setToast] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      const name = data.name || formData.name;
      const userData = { ...data, name, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff` };
      login(userData);
      setToast({ message: 'Account created!', type: 'success' });
      setTimeout(() => onNavigate('dashboard'), 500);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-brand-blue to-brand-sand">
      <BackgroundOrbs />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="relative z-10 w-full max-w-md">
        <GlassCard>
          <div className="text-center mb-8 space-y-2">
            <div className="text-6xl mb-2 animate-bounce">✨</div>
            <GradientTitle title="Create Account" subtitle="Join us and start learning" />
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white text-opacity-90 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
                placeholder="confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
            
            <CTAButton color="lime">Create Account</CTAButton>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-white text-opacity-80">
              Already have an account? <button onClick={() => onNavigate('login')} className="text-white font-bold hover:underline">Sign in</button>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const Navigation = ({ currentPage, onNavigate }) => {
  const { user, logout, updateUser } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { path: 'process', label: 'Process', icon: '📚' },
    { path: 'translate', label: 'Translate', icon: '🌐' },
    { path: 'pronunciation', label: 'Pronunciation', icon: '🎤' },
    { path: 'review', label: 'Review', icon: '📖' },
    { path: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-brand-yellow/40 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button onClick={() => onNavigate('dashboard')} className="text-2xl font-black bg-gradient-to-r from-brand-yellow to-brand-orange bg-clip-text text-transparent">
              Smart Vocab
            </button>
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === item.path
                      ? 'bg-gradient-to-r from-brand-blue to-brand-pink text-white shadow-lg'
                      : 'text-brand-blue hover:text-brand-pink hover:bg-brand-yellow/20'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center space-x-3 bg-brand-yellow/30 rounded-full px-4 py-2 hover:bg-brand-yellow/50 transition-all duration-200 cursor-pointer"
            >
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              <span className="text-brand-blue font-medium text-sm">{user.name}</span>
            </button>
            <button
              onClick={() => { logout(); onNavigate('login'); }}
              className="text-brand-pink hover:text-brand-blue px-4 py-2 rounded-lg hover:bg-brand-yellow/30 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onUserUpdate={updateUser}
        onLogout={() => { logout(); onNavigate('login'); }}
      />
    </nav>
  );
};

const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ wordsLearned: 0, translations: 0, pronunciations: 0, reviewsCompleted: 0 });
  const [toast, setToast] = useState(null);
  const [relatedWords, setRelatedWords] = useState([]);
  const [wordOfDay, setWordOfDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [relatedWordsLoading, setRelatedWordsLoading] = useState(false);
  const [relatedWordsLoaded, setRelatedWordsLoaded] = useState(false);
  const [wordOfDayLoading, setWordOfDayLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/stats?user_id=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load stats');
        setStats(data);
      } catch (e) {
        setToast({ message: e.message, type: 'error' });
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    // Load word of day immediately (it's cached on server)
    const loadWordOfDay = async () => {
      setWordOfDayLoading(true);
      try {
        const res = await fetch('http://localhost:5000/word_of_day');
        const data = await res.json();
        if (res.ok) {
          setWordOfDay(data);
        }
      } catch (e) {
        console.error('Failed to load word of day:', e);
      } finally {
        setWordOfDayLoading(false);
      }
    };

    loadWordOfDay();
  }, [user]);

  const loadRelatedWords = async () => {
    setRelatedWordsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/related_words?user_id=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setRelatedWords(data.related_words || []);
        setRelatedWordsLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load related words:', e);
      setToast({ message: 'Failed to load related words', type: 'error' });
    } finally {
      setRelatedWordsLoading(false);
    }
  };

  const refreshRelatedWords = async () => {
    setRelatedWordsLoaded(false);
    setRelatedWords([]);
    // Force refresh by adding timestamp to prevent caching
    const timestamp = Date.now();
    setRelatedWordsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/related_words?user_id=${user.id}&t=${timestamp}`);
      const data = await res.json();
      if (res.ok) {
        setRelatedWords(data.related_words || []);
        setRelatedWordsLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load related words:', e);
      setToast({ message: 'Failed to load related words', type: 'error' });
    } finally {
      setRelatedWordsLoading(false);
    }
  };

  // Auto-load related words when user changes
  useEffect(() => {
    if (user && !relatedWordsLoaded) {
      loadRelatedWords();
    }
  }, [user]);

  const handleWordClick = (word) => {
    setSelectedWord(word);
    setModalOpen(true);
  };

  const handleProcessWord = (word) => {
    setModalOpen(false);
    onNavigate('process');
    // You could also pre-fill the process word form here
  };

  const statCards = [
    { title: 'Words Learned', value: stats.wordsLearned, icon: '📚', color: 'from-blue-500 to-cyan-500', clickable: true, action: 'review' },
    { title: 'Translations', value: stats.translations, icon: '🌐', color: 'from-green-500 to-emerald-500', clickable: true, action: 'translate' },
    { title: 'Pronunciations', value: stats.pronunciations, icon: '🎤', color: 'from-purple-500 to-pink-500', clickable: false },
    { title: 'Reviews', value: stats.reviewsCompleted, icon: '📖', color: 'from-orange-500 to-red-500', clickable: false }
  ];

  const quickActions = [
    { path: 'process', title: 'Process New Word', desc: 'Learn definitions and examples', icon: '📚' },
    { path: 'translate', title: 'Translate Words', desc: 'Get instant translations', icon: '🌐' },
    { path: 'pronunciation', title: 'Check Pronunciation', desc: 'Practice with audio', icon: '🎤' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="dashboard" onNavigate={onNavigate} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <VariableProximity
            label={`Welcome back, ${user.name}!`}
            className={'text-4xl md:text-6xl font-black text-brand-blue'}
            fromFontVariationSettings="'wght' 500, 'opsz' 12"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            radius={120}
          />
          <p className="text-brand-blue/70 text-lg mt-2">Continue your language learning journey</p>
        </div>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <AnimatedContent direction="horizontal" distance={80} duration={0.9}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card) => (
              card.clickable ? (
                <button
                  key={card.title}
                  onClick={() => onNavigate(card.action)}
                  className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-left w-full group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-black text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-2 group-hover:text-blue-600 transition-colors">Click to view →</p>
                </button>
              ) : (
                <div key={card.title} className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                    {card.icon}
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-black text-gray-900">{card.value}</p>
                </div>
              )
            ))}
          </div>
        </AnimatedContent>

        {/* Word of the Day */}
        <AnimatedContent direction="horizontal" distance={80} duration={0.9}>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 mb-8 border-2 border-yellow-200">
            <div className="text-center">
              <h2 className="text-3xl font-black text-gray-900 mb-4">🌟 Word of the Day</h2>
              {wordOfDayLoading ? (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <SkeletonLoader className="h-8 w-32 mx-auto mb-4" />
                  <SkeletonLoader className="h-4 w-24 mx-auto mb-4" />
                  <SkeletonLoader className="h-4 w-64 mx-auto mb-4" />
                  <div className="h-12 bg-gray-200 rounded-xl w-48 mx-auto"></div>
                </div>
              ) : wordOfDay ? (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-4xl font-black text-brand-blue mb-2">{wordOfDay.word}</h3>
                  <div className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 mb-4">
                    Level {wordOfDay.difficulty}
                  </div>
                  <p className="text-gray-600 mb-4">Expand your vocabulary with today's featured word!</p>
                  <button
                    onClick={() => handleWordClick(wordOfDay.word)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    📚 Learn This Word
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-gray-600">Failed to load word of the day</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedContent>

        {/* Related Words */}
        <AnimatedContent direction="horizontal" distance={80} duration={0.9}>
          <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-gray-900">🔗 Related Words</h2>
              <button
                onClick={refreshRelatedWords}
                disabled={relatedWordsLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {relatedWordsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    🔄 Refresh
                  </>
                )}
              </button>
            </div>
            
            {relatedWordsLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                  <WordSkeleton key={index} />
                ))}
              </div>
            )}

            {relatedWordsLoaded && relatedWords.length > 0 && (
              <>
                <p className="text-gray-600 text-center mb-6">Based on your learning progress, here are some words you might want to explore:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedWords.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => handleWordClick(word)}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-left group"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📖</div>
                      <span className="font-bold text-gray-800 text-lg">{word}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {relatedWordsLoaded && relatedWords.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-600 text-lg">Learn more words to see related suggestions!</p>
              </div>
            )}
          </div>
        </AnimatedContent>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => onNavigate(action.path)}
              className="cursor-target bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-left group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{action.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Process Word Modal */}
        <ProcessWordModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          word={selectedWord}
          onProcessWord={handleProcessWord}
        />
      </div>
    </div>
  );
};

const ProcessWordPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim()) {
      setToast({ message: 'Please enter a word', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/process_word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), language, user_id: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process word');
      
      setResult(data);
      setToast({ message: 'Word processed successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation currentPage="process" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Process Word 📚</h1>
          <p className="text-gray-600 text-lg">Get definitions, examples, and learning aids</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Word</label>
              <input
                type="text"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all text-lg"
                placeholder="Enter a word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
              <select
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all text-lg"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Processing...' : '📚 Process Word'}
            </button>
          </form>
          
          {result && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <h3 className="text-2xl font-black text-gray-900 mb-6">✨ Results</h3>
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-gray-700">Definition:</span>
                  <p className="text-gray-600 mt-1 text-lg">{result.definition}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Example:</span>
                  <p className="text-gray-600 mt-1 italic text-lg">{result.sentence}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Memory Aid:</span>
                  <p className="text-gray-600 mt-1 text-lg">{result.mnemonic}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-700">Difficulty:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${result.difficulty > 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Level {result.difficulty}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TranslatePage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [word, setWord] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [translatedWords, setTranslatedWords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);

  useEffect(() => {
    const loadTranslatedWords = async () => {
      try {
        const res = await fetch(`http://localhost:5000/translated_words?user_id=${user.id}`);
        const data = await res.json();
        if (res.ok) {
          setTranslatedWords(data.translated_words || []);
        }
      } catch (e) {
        console.error('Failed to load translated words:', e);
      }
    };
    loadTranslatedWords();
  }, [user]);

  const handleWordClick = (word) => {
    setSelectedWord(word);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim()) {
      setToast({ message: 'Please enter a word', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), target_language: targetLanguage, user_id: user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Translation failed');
      
      setTranslation(data.translation);
      setToast({ message: 'Translation completed!', type: 'success' });
      
      // Refresh translated words list
      const res = await fetch(`http://localhost:5000/translated_words?user_id=${user.id}`);
      const wordsData = await res.json();
      if (res.ok) {
        setTranslatedWords(wordsData.translated_words || []);
      }
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const languageNames = { es: 'Spanish', fr: 'French', de: 'German', it: 'Italian' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Navigation currentPage="translate" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Translate Word 🌐</h1>
          <p className="text-gray-600 text-lg">Get instant translations between languages</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Word</label>
              <input
                type="text"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500 focus:ring-opacity-20 focus:border-green-500 transition-all text-lg"
                placeholder="Enter a word to translate"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Language</label>
              <select
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500 focus:ring-opacity-20 focus:border-green-500 transition-all text-lg"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Translating...' : '🌐 Translate'}
            </button>
          </form>
          
          {translation && (
            <div className="mt-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 text-center">
              <h3 className="text-2xl font-black text-gray-900 mb-4">🌐 Translation</h3>
              <p className="text-4xl font-black text-gray-800 mb-2">{translation}</p>
              <p className="text-gray-600 mb-6">{languageNames[targetLanguage]}</p>
              <button
                onClick={() => handleWordClick(translation)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                📚 Learn This Translation
              </button>
            </div>
          )}

          {/* Translated Words List */}
          {translatedWords.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-black text-gray-900 mb-6">📚 Your Translated Words ({translatedWords.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {translatedWords.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleWordClick(item.word)}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🌐</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'completed' ? 'Learned' : 'Learning'}
                      </span>
                    </div>
                    <div className="font-bold text-gray-800 text-lg mb-1">{item.word}</div>
                    <div className="text-sm text-gray-600 capitalize">{item.language}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Process Word Modal */}
          <ProcessWordModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            word={selectedWord}
          />
        </div>
      </div>
    </div>
  );
};

const PronunciationPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [word, setWord] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || !file) {
      setToast({ message: 'Please enter a word and select an audio file', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('word', word.trim());
      formData.append('audio', file);
      formData.append('user_id', user.id);
      
      const response = await fetch('http://localhost:5000/check_pronunciation', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pronunciation check failed');
      
      setResult(data.correct);
      setToast({ message: 'Pronunciation checked!', type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <Navigation currentPage="pronunciation" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Check Pronunciation 🎤</h1>
          <p className="text-gray-600 text-lg">Upload audio and get instant feedback</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Word</label>
              <input
                type="text"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 transition-all text-lg"
                placeholder="Enter a word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Audio File (WAV format)</label>
              <input
                type="file"
                accept=".wav"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:ring-opacity-20 focus:border-purple-500 transition-all text-lg"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <p className="text-sm text-gray-500 mt-2">Please upload a WAV file</p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Checking...' : '🎤 Check Pronunciation'}
            </button>
          </form>
          
          {result !== null && (
            <div className="mt-8 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 text-center">
              <h3 className="text-2xl font-black text-gray-900 mb-6">🎤 Result</h3>
              <div className={`inline-flex items-center px-8 py-4 rounded-full text-xl font-bold ${result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {result ? '✅ Correct Pronunciation' : '❌ Incorrect Pronunciation'}
              </div>
              <p className="text-gray-600 mt-4 text-lg">
                {result ? 'Great job! Your pronunciation is accurate.' : 'Keep practicing! Try recording again.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [under, setUnder] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [quiz, setQuiz] = useState(null); // {word, question, options, correctIndex}
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/review_items?user_id=${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch review items');
      setUnder(data.under_review || []);
      setCompleted(data.completed || []);
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (w) => {
    try {
      const res = await fetch('http://localhost:5000/review_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load question');
      setQuiz({ word: w, ...data });
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const submitAnswer = async (idx) => {
    if (!quiz) return;
    try {
      const res = await fetch('http://localhost:5000/review_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, word: quiz.word, selectedIndex: idx, correctIndex: quiz.correctIndex })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
      setToast({ message: data.correct ? 'Correct! 👍' : 'Incorrect. Try again!', type: data.correct ? 'success' : 'error' });
      setQuiz(null);
      await loadItems();
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleWordClick = (word) => {
    setSelectedWord(word);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Navigation currentPage="review" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Review Words 📖</h1>
          <p className="text-gray-600 text-lg">Practice with spaced repetition for better retention</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <CTAButton onClick={loadItems} color="orange">{loading ? 'Loading...' : '📖 Refresh Review Items'}</CTAButton>
          </div>

          {quiz ? (
            <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{quiz.word}</h3>
              <p className="text-gray-800 mb-4">{quiz.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quiz.options.map((opt, i) => (
                  <button key={i} onClick={() => submitAnswer(i)} className="px-4 py-3 rounded-xl bg-white border hover:border-brand-pink hover:text-brand-pink transition">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Under Review ({under.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {under.map((w, i) => (
                    <button key={i} onClick={() => startQuiz(w)} className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-left">
                      <span className="text-3xl mr-2">📝</span>
                      <span className="font-bold text-gray-800 text-lg">{w}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Completed ({completed.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completed.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => handleWordClick(w)}
                      className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-left group"
                    >
                      <span className="text-3xl mr-2 group-hover:scale-110 transition-transform duration-300">✅</span>
                      <span className="font-bold text-gray-800 text-lg">{w}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Process Word Modal */}
        <ProcessWordModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          word={selectedWord}
        />
      </div>
    </div>
  );
};

const AnalyticsPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    wordsByDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get user stats
      const statsRes = await fetch(`http://localhost:5000/stats?user_id=${user.id}`);
      const stats = await statsRes.json();
      
      // Calculate analytics
      const totalWords = stats.wordsLearned || 0;
      
      // Simulate difficulty distribution (in a real app, you'd get this from the database)
      const difficultyDistribution = {
        1: Math.floor(totalWords * 0.3),
        2: Math.floor(totalWords * 0.25),
        3: Math.floor(totalWords * 0.2),
        4: Math.floor(totalWords * 0.15),
        5: Math.floor(totalWords * 0.1)
      };
      
      setAnalytics({
        wordsByDifficulty: difficultyDistribution
      });
      
    } catch (error) {
      setToast({ message: 'Failed to load analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    1: '#10B981', // green
    2: '#3B82F6', // blue
    3: '#F59E0B', // yellow
    4: '#F97316', // orange
    5: '#EF4444'  // red
  };

  const difficultyLabels = {
    1: 'Beginner',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Expert'
  };

  // Calculate pie chart data
  const totalWords = Object.values(analytics.wordsByDifficulty).reduce((sum, count) => sum + count, 0);
  const pieData = Object.entries(analytics.wordsByDifficulty).map(([level, count]) => ({
    level: parseInt(level),
    count,
    percentage: totalWords > 0 ? (count / totalWords) * 100 : 0,
    color: difficultyColors[level],
    label: difficultyLabels[level]
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <Navigation currentPage="analytics" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">📊 Learning Analytics</h1>
          <p className="text-gray-600 text-lg">Track your vocabulary learning progress and insights</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Difficulty Distribution Pie Chart */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">📊 Words by Difficulty</h2>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Pie Chart */}
                <div className="relative w-80 h-80">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {pieData.map((item, index) => {
                      const startAngle = pieData.slice(0, index).reduce((sum, prev) => sum + (prev.percentage / 100) * 360, 0);
                      const endAngle = startAngle + (item.percentage / 100) * 360;
                      const radius = 40;
                      const centerX = 50;
                      const centerY = 50;
                      
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      
                      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      
                      return (
                        <path
                          key={item.level}
                          d={pathData}
                          fill={item.color}
                          stroke="white"
                          strokeWidth="2"
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-black text-gray-900">{totalWords}</div>
                      <div className="text-sm text-gray-600">Total Words</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="space-y-4">
                  {pieData.map((item) => (
                    <div key={item.level} className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.count} words ({item.percentage.toFixed(1)}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Tips */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
              <h2 className="text-2xl font-black mb-4">💡 Learning Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">🎯 Focus Areas</h3>
                  <p className="text-indigo-100">Based on your progress, try learning more Level 4-5 words to challenge yourself!</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">🔄 Consistency</h3>
                  <p className="text-indigo-100">Keep practicing daily! Consistent learning is key to vocabulary retention.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('login');

  // Preload word of the day when app starts
  useEffect(() => {
    const preloadWordOfDay = async () => {
      try {
        await fetch('http://localhost:5000/preload_word_of_day');
      } catch (e) {
        console.log('Preloading word of day failed:', e);
      }
    };
    preloadWordOfDay();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen">
        {currentPage === 'login' && <LoginPage onNavigate={setCurrentPage} />}
        {currentPage === 'register' && <RegisterPage onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
        {currentPage === 'process' && <ProcessWordPage onNavigate={setCurrentPage} />}
        {currentPage === 'translate' && <TranslatePage onNavigate={setCurrentPage} />}
        {currentPage === 'pronunciation' && <PronunciationPage onNavigate={setCurrentPage} />}
        {currentPage === 'review' && <ReviewPage onNavigate={setCurrentPage} />}
        {currentPage === 'analytics' && <AnalyticsPage onNavigate={setCurrentPage} />}
      </div>
    </AuthProvider>
  );
};

export default App;