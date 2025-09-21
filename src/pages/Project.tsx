import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Plus, MessageSquare, Upload } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchChats();
    }
  }, [projectId]);

  useEffect(() => {
    if (currentChat) {
      fetchMessages();
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
      
      if (data && data.length > 0 && !currentChat) {
        setCurrentChat(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!currentChat) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          project_id: projectId,
          user_id: user?.id,
          title: 'New Chat'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setChats([data, ...chats]);
      setCurrentChat(data);
      setMessages([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChat || sending) return;

    setSending(true);
    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Add user message to database
      const { data: userMsg, error: userError } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChat.id,
          role: 'user',
          content: userMessage
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Update messages list
      setMessages(prev => [...prev, userMsg as Message]);

      // Call AI function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          chatId: currentChat.id,
          projectId: projectId,
          systemPrompt: project?.system_prompt
        }
      });

      if (aiError) throw aiError;

      // Add AI response to database
      const { data: aiMsg, error: aiMsgError } = await supabase
        .from('messages')
        .insert([{
          chat_id: currentChat.id,
          role: 'assistant',
          content: aiResponse.content
        }])
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      setMessages(prev => [...prev, aiMsg as Message]);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="font-semibold text-lg">{project?.name}</h2>
          <p className="text-sm text-muted-foreground">{project?.description}</p>
        </div>
        
        <div className="p-4">
          <Button onClick={createNewChat} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {chats.map((chat) => (
                <Card
                  key={chat.id}
                  className={`cursor-pointer transition-colors ${
                    currentChat?.id === chat.id ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setCurrentChat(chat)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-semibold">{currentChat.title}</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground mb-4">Create a new chat to get started</p>
              <Button onClick={createNewChat}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;