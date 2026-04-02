import { Routes, Route, NavLink } from 'react-router-dom';
import MeetingsPage from './pages/MeetingsPage';
import AgendaBuilderPage from './pages/AgendaBuilderPage';
import BylawsPage from './pages/BylawsPage';
import ResolutionsPage from './pages/ResolutionsPage';
import MinutesPage from './pages/MinutesPage';
import SearchPage from './pages/SearchPage';
import MeetingDetailPage from './pages/MeetingDetailPage';

const navItems = [
  { to: '/', label: 'Meetings' },
  { to: '/builder', label: 'Agenda Builder' },
  { to: '/bylaws', label: 'Bylaws' },
  { to: '/resolutions', label: 'Resolutions' },
  { to: '/minutes', label: 'Minutes' },
  { to: '/search', label: 'Search' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-2.5 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #475569, #64748b)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <span className="text-xs font-extrabold tracking-widest uppercase text-slate-600">AgendaFlow</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white/60 text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<MeetingsPage />} />
          <Route path="/builder" element={<AgendaBuilderPage />} />
          <Route path="/builder/:meetingId" element={<AgendaBuilderPage />} />
          <Route path="/meetings/:meetingId" element={<MeetingDetailPage />} />
          <Route path="/bylaws" element={<BylawsPage />} />
          <Route path="/resolutions" element={<ResolutionsPage />} />
          <Route path="/minutes" element={<MinutesPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}
