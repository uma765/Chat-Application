import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { Chat } from './types/supabase';
import { Moon, Sun } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Toaster position="top-right" />
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold dark:text-white">Real-Time Chat</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <ChatList
          userId={session.user.id}
          onSelectChat={setSelectedChat}
          selectedChat={selectedChat}
        />
        {selectedChat ? (
          <ChatWindow chat={selectedChat} userId={session.user.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              Select a chat to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;