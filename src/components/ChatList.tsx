import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Chat, Profile } from '../types/supabase';
import { Users, MessageSquare } from 'lucide-react';

interface ChatListProps {
  userId: string;
  onSelectChat: (chat: Chat) => void;
  selectedChat?: Chat;
}

export default function ChatList({ userId, onSelectChat, selectedChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [userId]);

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChats(data);

      // Fetch profiles for all participants
      const participantIds = new Set(
        data.flatMap((chat) => chat.participants).filter((id) => id !== userId)
      );

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(participantIds));

      if (profilesData) {
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        setProfiles(profilesMap);
      }
    };

    fetchChats();

    const subscription = supabase
      .channel('chat-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (!chat.is_group) {
      const otherParticipantId = chat.participants.find((id) => id !== userId);
      return profiles[otherParticipantId]?.username || 'Unknown User';
    }
    return 'Group Chat';
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Chats</h2>
      <div className="space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
              selectedChat?.id === chat.id
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {chat.is_group ? (
              <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            ) : (
              <MessageSquare className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium truncate dark:text-white">
              {getChatName(chat)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}