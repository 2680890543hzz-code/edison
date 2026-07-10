import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineDocumentPlus,
  HiOutlineClock,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';

const navItems = [
  { path: '/', label: '新建笔记', icon: HiOutlineDocumentPlus },
  { path: '/settings', label: '设置', icon: HiOutlineCog6Tooth },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-20 flex flex-col items-center py-6 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="mb-8 text-2xl">📝</div>

      {/* 导航 */}
      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                transition-colors duration-150 w-16
                ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
              `}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 底部版本 */}
      <div className="mt-auto text-[10px] text-gray-400">
        v1.0
      </div>
    </aside>
  );
}
