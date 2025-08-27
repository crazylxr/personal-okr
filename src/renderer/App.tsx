import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Todos from './pages/Todos';
import OKRs from './pages/OKRs';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import { Toaster } from './components/ui/toaster';
import './index.css';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="okr-manager-theme">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/okrs" element={<OKRs />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;