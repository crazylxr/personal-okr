import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Button } from './ui/button';
import {
  HomeIcon,
  CheckIcon,
  TargetIcon,
  ClockIcon,
  FileTextIcon,
  GearIcon,
  SunIcon,
  MoonIcon
} from '@radix-ui/react-icons';
import { ThemeToggle } from './theme-toggle';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    window.electronAPI.window.startDrag();
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      window.electronAPI.window.stopDrag();
    }
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        window.electronAPI.window.stopDrag();
      }
    };
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Trigger a small delay to ensure smooth dragging
        requestAnimationFrame(() => {
          // This helps maintain the drag state during rapid mouse movements
        });
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  const menuItems = [
    {
      key: '/',
      icon: HomeIcon,
      label: '仪表板',
    },
    {
      key: '/todos',
      icon: CheckIcon,
      label: '待办事项',
    },
    {
      key: '/okrs',
      icon: TargetIcon,
      label: 'OKR管理',
    },
    {
      key: '/tasks',
      icon: ClockIcon,
      label: '任务管理',
    },
    {
      key: '/notes',
      icon: FileTextIcon,
      label: '笔记',
    },
    {
      key: '/settings',
      icon: GearIcon,
      label: '设置',
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Window Drag Area with Controls */}
      <div 
        className="drag-region fixed top-0 left-0 right-0 z-50 bg-blue-200 border-b-2 border-blue-400 flex items-center cursor-move"
        style={{
          height: '40px',
          backgroundColor: '#dbeafe',
          borderBottom: '2px solid #60a5fa'
        } as React.CSSProperties}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Window Controls */}
        <div 
          className="flex items-center space-x-2 ml-4 no-drag-region"
        >
          <button 
            className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            onClick={() => window.electronAPI?.app?.close()}
            onMouseDown={(e) => e.stopPropagation()}
            title="关闭"
          />
          <button 
            className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors"
            onClick={() => window.electronAPI?.app?.minimize()}
            onMouseDown={(e) => e.stopPropagation()}
            title="最小化"
          />
          <button 
            className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
            onClick={() => window.electronAPI?.app?.maximize()}
            onMouseDown={(e) => e.stopPropagation()}
            title="最大化"
          />
        </div>
        {/* Drag indicator */}
        <div className="flex-1 text-center text-xs text-gray-500 pointer-events-none">
          Personal OKR Manager
        </div>
      </div>
      
      {/* Window Controls Spacer */}
      <div className="fixed top-2 left-2 w-20 h-8 z-60 pointer-events-none" />
       
      {/* Sidebar */}
      <div className="w-64 bg-card shadow-lg border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 px-6 pb-6 border-b border-border no-drag-region">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TargetIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground">OKR Manager</h1>
          </div>
          <ThemeToggle />
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.key;
              
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-primary/10 text-primary border-r-2 border-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background no-drag-region">
        <main className="pt-12 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;