import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon } from "lucide-react";

import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ResumeHub from "./components/ResumeHub";
import Applications from "./components/Applications";
import InterviewPrep from "./components/InterviewPrep";
import Analytics from "./components/Analytics";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.elements[0].value;
    localStorage.setItem("fb_token", `mock_${email}`);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen text-slate-300 flex flex-col font-sans selection:bg-amber-500/30 selection:text-white">
        <nav className="w-full border-b border-white/5 p-8 flex justify-between items-center bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Hexagon className="text-sky-400" size={24} />
            <span className="text-xl font-bold tracking-tighter text-white font-serif">
              Nexus
            </span>
          </div>
          <button className="text-[10px] tracking-widest uppercase text-[#888888] hover:text-white transition-colors">
            Contact Support
          </button>
        </nav>

        <main className="flex-1 w-full max-w-5xl mx-auto p-8 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md mx-auto my-auto mt-24"
            >
              <div className="mb-16">
                <h1 className="text-5xl font-serif text-white mb-4">
                  Authenticate
                </h1>
                <p className="text-[10px] tracking-widest uppercase text-[#888888]">
                  Secure Access Portal
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-[#888888] mb-2">
                      University Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-[#0A0A0A] border-b border-[#333333] py-4 text-white placeholder:text-[#444444] focus:outline-none focus:border-white transition-all rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-[#888888] mb-2">
                      Passkey
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full bg-[#0A0A0A] border-b border-[#333333] py-4 text-white placeholder:text-[#444444] focus:outline-none focus:border-white transition-all rounded-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black text-[10px] tracking-widest uppercase font-bold py-5 rounded-none hover:bg-gray-200 transition-colors"
                >
                  Sign In
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout onLogout={handleLogout} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="resumes" element={<ResumeHub />} />
        <Route path="applications" element={<Applications />} />
        <Route path="interview" element={<InterviewPrep />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
