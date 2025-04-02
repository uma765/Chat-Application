export type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  chat_id: string;
  file_url?: string;
  file_type?: string;
  reactions?: MessageReaction[];
  read_by?: string[];
};

export type Chat = {
  id: string;
  created_at: string;
  name?: string;
  is_group: boolean;
  participants: string[];
};

export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};

export type Profile = {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

export type TypingIndicator = {
  user_id: string;
  chat_id: string;
  timestamp: number;
};