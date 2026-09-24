import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

export const DashboardLayout = ({ children, title = 'Dashboard', subtitle = '', action = null }) => {
  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} action={action} />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
};
