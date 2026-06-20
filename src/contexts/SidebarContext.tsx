import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('cm-sidebar-collapsed');
    return saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cm-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed(c => !c);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
