import React, { useState, useEffect, createContext, useContext } from 'react';
import { OrbBackground, GradientTitle, CTAButton, GlassCard } from './components/AnimatedBits';
import ScrambledText from './components/ScrambledText';
import ScrollVelocity from './components/ScrollVelocity';
import VariableProximity from './components/VariableProximity';
import AnimatedContent from './components/AnimatedContent';
import TargetCursor from './components/TargetCursor';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-gradient-1">
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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-gradient-2">
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
  const { user, logout } = useAuth();

  const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { path: 'process', label: 'Process', icon: '📚' },
    { path: 'translate', label: 'Translate', icon: '🌐' },
    { path: 'pronunciation', label: 'Pronunciation', icon: '🎤' },
    { path: 'review', label: 'Review', icon: '📖' },
    { path: 'difficulty', label: 'Difficulty', icon: '📊' }
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-brand-yellow/40 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button onClick={() => onNavigate('dashboard')} className="text-2xl font-black bg-gradient-to-r from-brand-yellow to-brand-orange bg-clip-text text-transparent">
              LinguaLearn
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
            <div className="flex items-center space-x-3 bg-brand-yellow/30 rounded-full px-4 py-2">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              <span className="text-brand-blue font-medium text-sm">{user.name}</span>
            </div>
            <button
              onClick={() => { logout(); onNavigate('login'); }}
              className="text-brand-pink hover:text-brand-blue px-4 py-2 rounded-lg hover:bg-brand-yellow/30 transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const stats = {
    wordsLearned: 47,
    translations: 32,
    pronunciations: 28,
    reviewsCompleted: 15
  };

  const statCards = [
    { title: 'Words Learned', value: stats.wordsLearned, icon: '📚', color: 'from-blue-500 to-cyan-500' },
    { title: 'Translations', value: stats.translations, icon: '🌐', color: 'from-green-500 to-emerald-500' },
    { title: 'Pronunciations', value: stats.pronunciations, icon: '🎤', color: 'from-purple-500 to-pink-500' },
    { title: 'Reviews', value: stats.reviewsCompleted, icon: '📖', color: 'from-orange-500 to-red-500' }
  ];

  const quickActions = [
    { path: 'process', title: 'Process New Word', desc: 'Learn definitions and examples', icon: '📚' },
    { path: 'translate', title: 'Translate Words', desc: 'Get instant translations', icon: '🌐' },
    { path: 'pronunciation', title: 'Check Pronunciation', desc: 'Practice with audio', icon: '🎤' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TargetCursor hideDefaultCursor={true} />
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

        <AnimatedContent direction="horizontal" distance={80} duration={0.9}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                  {card.icon}
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>
        </AnimatedContent>

        <ScrollVelocity
          texts={["Learn", "Translate", "Pronounce", "Review"]}
          velocity={120}
          className="px-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-brand-pink to-brand-blue"
        />
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
      </div>
    </div>
  );
};

const ProcessWordPage = ({ onNavigate }) => {
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
        body: JSON.stringify({ word: word.trim(), language })
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
  const [word, setWord] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translation, setTranslation] = useState('');
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
      const response = await fetch('http://localhost:5000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), target_language: targetLanguage })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Translation failed');
      
      setTranslation(data.translation);
      setToast({ message: 'Translation completed!', type: 'success' });
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
              <p className="text-gray-600">{languageNames[targetLanguage]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PronunciationPage = ({ onNavigate }) => {
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
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/review_words');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch words');
      
      setWords(data.words || []);
      setToast({ message: `Found ${data.words.length} words for review`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
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
          <button
            onClick={handleFetch}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl hover:from-orange-700 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg mb-8"
          >
            {loading ? 'Loading...' : '📖 Fetch Review Words'}
          </button>
          
          {words.length > 0 ? (
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">📚 Words Due for Review ({words.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">📖</span>
                      <span className="font-bold text-gray-800 text-lg">{word}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">No words available</h3>
              <p className="text-gray-500 text-lg">Start by processing some words to see them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DifficultyPage = ({ onNavigate }) => {
  const [difficulty, setDifficulty] = useState(3);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFetch = async () => {
    if (difficulty < 1 || difficulty > 5) {
      setToast({ message: 'Difficulty must be between 1 and 5', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/words_by_difficulty/${difficulty}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch words');
      
      setWords(data.words || []);
      setToast({ message: `Found ${data.words.length} words with difficulty ${difficulty}`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    1: 'from-green-50 to-green-100 border-green-300',
    2: 'from-blue-50 to-blue-100 border-blue-300',
    3: 'from-yellow-50 to-yellow-100 border-yellow-300',
    4: 'from-orange-50 to-orange-100 border-orange-300',
    5: 'from-red-50 to-red-100 border-red-300'
  };

  const difficultyLabels = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <Navigation currentPage="difficulty" onNavigate={onNavigate} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Words by Difficulty 📊</h1>
          <p className="text-gray-600 text-lg">Filter words by their difficulty level</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500 focus:ring-opacity-20 focus:border-teal-500 transition-all text-lg"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) || 1)}
              />
              <div className="flex justify-between mt-3 px-2">
                <span className="text-sm font-medium text-green-600">Easy</span>
                <span className="text-sm font-medium text-yellow-600">Medium</span>
                <span className="text-sm font-medium text-red-600">Hard</span>
              </div>
            </div>
            
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-2xl hover:from-teal-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Loading...' : '📊 Fetch Words'}
            </button>
          </div>
          
          {words.length > 0 ? (
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">📊 Words with Difficulty {difficulty} ({words.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className={`p-6 bg-gradient-to-r ${difficultyColors[difficulty]} rounded-xl border-2 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-lg">{word}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyLabels[difficulty]}`}>
                        Level {difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading && (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">No words found</h3>
              <p className="text-gray-500 text-lg">No words with difficulty {difficulty} available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('login');

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
        {currentPage === 'difficulty' && <DifficultyPage onNavigate={setCurrentPage} />}
      </div>
    </AuthProvider>
  );
};

export default App;