"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Loader2, User, Bot } from 'lucide-react';
import { createIconWrapper } from '@/lib/icon-wrapper';
import { getConversations, getConversation } from '@/shared/api/conversations';
import PaginationUniversal from '@/components/PaginationUniversal';

const MessageSquareIcon = createIconWrapper(MessageSquare);
const Loader2Icon = createIconWrapper(Loader2);
const UserIcon = createIconWrapper(User);
const BotIcon = createIconWrapper(Bot);

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isBot: boolean;
  senderName: string;
}

interface Conversation {
  conversation_id: number;
  last_message: string;
  username: string | null;
  bot_alias: string;
  last_created_at: string;
  project: string;
  stage?: string | null;
}

interface ConversationMessage {
  is_user_message: boolean;
  is_bot_message: boolean;
  created_at: string;
  text: string;
  username: string;
  bot_alias: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  total_count: number;
}

interface ChatResponse {
  messages: ConversationMessage[];
}

// Unified chat message display
const EnhancedChatDialog = ({ messages, botName, userName }: { 
  messages: ChatMessage[], 
  botName: string, 
  userName: string 
}) => {
  return (
    <div className="flex flex-col h-[70vh] relative">
      {/* Chat header with user info - fixed at top */}
      <div className="flex justify-between items-center py-3 px-4 border-b sticky top-0 bg-white z-20 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 p-1 rounded-full">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-medium text-blue-800">{userName || 'Клиент'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-teal-800">{botName}</span>
          <div className="bg-teal-100 p-1 rounded-full">
            <BotIcon className="h-5 w-5 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Message list - scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[75%] p-3 rounded-lg shadow-sm ${message.isBot 
              ? 'bg-gray-100 text-gray-800 border-l-4 border-blue-400 mr-auto' 
              : 'bg-teal-50 text-teal-800 border-r-4 border-teal-400 ml-auto'}`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {new Date(message.timestamp).toLocaleString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DialogsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [navigationMode, setNavigationMode] = useState<'pagination' | 'loadMore'>('pagination');
  const chatsPerPage = 15;

  // Calculate total pages based on total count
  const totalPages = Math.ceil(totalCount / chatsPerPage);

  const fetchConversations = async (page: number, mode: 'pagination' | 'loadMore' = 'pagination') => {
    try {
      // Set loading states
      setIsLoading(mode === 'pagination');
      
      const offset = (page - 1) * chatsPerPage;
      
      console.log(`Fetching conversations from API - page: ${page}, mode: ${mode}, offset: ${offset}`);
      
      const response = await getConversations(chatsPerPage, offset);
      
      if (response.data) {
        const data = response.data as ConversationsResponse;
        console.log(`Received ${data.conversations.length} conversations, total: ${data.total_count}`);
        
        if (mode === 'pagination') {
          setConversations(data.conversations);
        } else {
          // In load more mode, append new conversations to existing ones
          setConversations(prev => {
            const newConversations = data.conversations.filter(
              (conversation) => !prev.some(existing => existing.conversation_id === conversation.conversation_id)
            );
            console.log(`Adding ${newConversations.length} new conversations to existing ${prev.length}`);
            return [...prev, ...newConversations];
          });
        }
        
        setTotalCount(data.total_count);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(currentPage, navigationMode);
  }, [currentPage, navigationMode]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setNavigationMode('pagination');
    setCurrentPage(page);
  };

  // Handle "Load More" button click
  const handleLoadMore = () => {
    setNavigationMode('loadMore');
    setCurrentPage(prev => prev + 1);
  };

  // Convert API messages to chat display format
  const convertToDialogMessages = (messages: ConversationMessage[]): ChatMessage[] => {
    return messages.map((message, index) => {
      const senderName = message.is_bot_message 
        ? message.bot_alias
        : message.username || 'Неизвестно';
        
      return {
        id: index.toString(),
        content: message.text,
        timestamp: message.created_at,
        isBot: message.is_bot_message, // true = bot message (left), false = user message (right)
        senderName: senderName
      };
    });
  };

  const handleChatClick = async (conversation: Conversation) => {
    try {
      setLoadingMessages(true);
      setSelectedConversation(conversation);
      
      console.log(`Fetching messages for conversation ${conversation.conversation_id}, project: ${conversation.project}`);
      
      const response = await getConversation(conversation.conversation_id.toString(), conversation.project);
      
      if (response.data) {
        const data = response.data as ChatResponse;
        console.log(`Received ${data.messages.length} messages`);
        
        const convertedMessages = convertToDialogMessages(data.messages);
        setConversationMessages(convertedMessages);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      setError('Failed to load conversation messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeStyles = (role: string) => {
    return role === 'manager' 
      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
      : 'bg-green-100 text-green-800 hover:bg-green-200';
  };

  const getStageBadgeStyles = (stage: string | null | undefined) => {
    if (!stage) return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('lead') || stageLower.includes('лид')) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    if (stageLower.includes('deal') || stageLower.includes('сделка')) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (stageLower.includes('lost') || stageLower.includes('потерян')) return 'bg-red-100 text-red-800 hover:bg-red-200';
    
    return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  };

  const getFormattedStage = (stage: string | null | undefined): string => {
    return stage || 'Не указана';
  };

  const getRoleFromBotAlias = (botAlias: string): 'manager' | 'seller' => {
    return botAlias.includes('Leadbee') ? 'manager' : 'seller';
  };

  if (isLoading && navigationMode === 'pagination') return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2Icon className="animate-spin h-10 w-10 text-muted-foreground" />
    </div>
  );
  
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Переписка</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Бот</TableHead>
                <TableHead>Стадия</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>ID беседы</TableHead>
                <TableHead>Время</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {conversations.map((conversation) => {
                  const role = getRoleFromBotAlias(conversation.bot_alias);
                  
                  return (
                <TableRow
                      key={conversation.conversation_id}
                  className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="w-[80px]"
                              onClick={() => handleChatClick(conversation)}
                            >
                          <MessageSquareIcon className="h-4 w-4 mr-2" />
                          Чат
                        </Button>
                      </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[800px] w-full p-4">
                              <DialogHeader>
                                <DialogTitle>
                                  Переписка с {selectedConversation?.username || 'Клиентом'}
                                </DialogTitle>
                              </DialogHeader>
                              {loadingMessages ? (
                                <div className="flex h-96 items-center justify-center">
                                  <Loader2Icon className="animate-spin h-8 w-8 text-muted-foreground" />
                                </div>
                              ) : (
                                <EnhancedChatDialog 
                                  messages={conversationMessages}
                                  botName={selectedConversation?.bot_alias || 'Бот'}
                                  userName={selectedConversation?.username || 'Клиент'}
                                />
                              )}
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                          className={getRoleBadgeStyles(role)}>
                          {role === 'manager' ? 'Менеджер' : 'Продавец'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                        {conversation.username ? (
                    <span className="text-blue-600 hover:text-blue-800">
                            {conversation.username}
                    </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {conversation.bot_alias}
                        </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getStageBadgeStyles(conversation.stage)}>
                      {getFormattedStage(conversation.stage)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {conversation.project}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {conversation.conversation_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatDate(conversation.last_created_at)}
                    </span>
                  </TableCell>
                </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex-shrink-0 p-4 border-t">
        <PaginationUniversal
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onLoadMore={handleLoadMore}
          showLoadMore={currentPage < totalPages}
        />
      </div>
    </div>
  );
}
