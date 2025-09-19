import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Search, Upload, Bookmark, UserCircle2, Newspaper } from 'lucide-react';
import AuthControl from '@/components/auth/AuthControl';

const navItemBase = 'flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-all border';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<any>; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `${navItemBase} ${isActive ? 'bg-yellow-300 border-black shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 p-4 gap-3 border-r bg-gray-50">
      <div className="flex items-center gap-3 mb-2 p-3 border rounded-lg bg-emerald-600 text-white shadow">
        <div className="h-10 w-10 rounded-full bg-emerald-700 flex items-center justify-center">
          <Newspaper className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm opacity-80">Intell Weave</div>
          <div className="text-lg font-extrabold leading-tight">AI News Aggregator</div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <NavItem to="/feed" icon={Home} label="Feed" />
        <NavItem to="/discover" icon={Compass} label="Discover" />
        <NavItem to="/search" icon={Search} label="Search" />
        <NavItem to="/upload" icon={Upload} label="Upload" />
        <NavItem to="/bookmarks" icon={Bookmark} label="Bookmarks" />
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">M</div>
          <div className="text-sm">
            <div className="font-semibold">Mohammad Zaid S.</div>
            <div className="text-gray-500">zaidshaikh9884@...</div>
          </div>
          <UserCircle2 className="ml-auto text-gray-500" />
        </div>
        <AuthControl />
      </div>
    </aside>
  );
}
