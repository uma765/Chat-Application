import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message, Chat, Profile, TypingIndicator } from '../types/supabase';
import { Smile, Paperclip, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';

interface ChatWindowProps {
  chat: Chat;
  userId: string;
}

export default function ChatWindow({ chat, userId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Fetch profiles for message authors
      const userIds = new Set(data?.map((msg) => msg.user_id) || []);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));

      if (profilesData) {
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        setProfiles(profilesMap);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert([
      {
        content: newMessage,
        chat_id: chat.id,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${chat.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    await supabase.from('messages').insert([
      {
        chat_id: chat.id,
        user_id: userId,
        content: file.name,
        file_url: publicUrl,
        file_type: file.type,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.user_id === userId ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                message.user_id === userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              } rounded-lg p-3`}
            >
              <div className="text-sm font-medium mb-1">
                {profiles[message.user_id]?.username || 'Unknown User'}
              </div>
              {message.file_url ? (
                message.file_type?.startsWith('image/') ? (
                  <img
                    src={message.file_url}
                    alt="Shared image"
                    className="max-w-xs rounded-lg"
                  />
                ) : (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {message.content}
                  </a>
                )
              ) : (
                <p>{message.content}</p>
              )}
              <div className="text-xs opacity-75 mt-1">
                {format(new Date(message.created_at), 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <Smile className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          <label className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer">
            <Paperclip className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4">
            <EmojiPicker
              onEmojiClick={(emoji) => {
                setNewMessage((prev) => prev + emoji.emoji);
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}