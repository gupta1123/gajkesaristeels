'use client'
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
