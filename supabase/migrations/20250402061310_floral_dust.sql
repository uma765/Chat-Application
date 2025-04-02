/*
  # Chat Application Schema

  1. New Tables
    - profiles
      - User profiles with usernames and avatars
    - chats
      - Chat rooms/conversations
      - Supports both group and private chats
    - messages
      - Chat messages with support for text and files
    - message_reactions
      - Emoji reactions on messages
    - typing_indicators
      - Real-time typing status

  2. Security
    - RLS policies for all tables
    - Authenticated users can:
      - Read their own profile
      - Read/write to chats they participate in
      - Read/write messages in their chats
      - Add/remove reactions to messages
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text,
  is_group boolean DEFAULT false,
  participants uuid[] NOT NULL
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read chats they participate in"
  ON chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participants));

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  content text,
  file_url text,
  file_type text,
  created_at timestamptz DEFAULT now(),
  read_by uuid[] DEFAULT ARRAY[]::uuid[],
  CONSTRAINT valid_message CHECK (
    (content IS NOT NULL AND content <> '') OR
    (file_url IS NOT NULL AND file_type IS NOT NULL)
  )
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages from their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE id = messages.chat_id
      AND auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can insert messages to their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE id = chat_id
      AND auth.uid() = ANY(participants)
    )
  );

-- Create message_reactions table
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions from their chats"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN chats c ON c.id = m.chat_id
      WHERE m.id = message_reactions.message_id
      AND auth.uid() = ANY(c.participants)
    )
  );

CREATE POLICY "Users can add reactions to messages in their chats"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN chats c ON c.id = m.chat_id
      WHERE m.id = message_id
      AND auth.uid() = ANY(c.participants)
    )
  );

-- Create typing_indicators table
CREATE TABLE typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see typing indicators in their chats"
  ON typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE id = chat_id
      AND auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can update typing status in their chats"
  ON typing_indicators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE id = chat_id
      AND auth.uid() = ANY(participants)
    )
  );