'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Loader2, User, Bot, Filter } from 'lucide-react';
import { createIconWrapper } from '@/lib/icon-wrapper';
import { getConversations, getConversation } from '@/shared/api/conversations';
import PaginationUniversal from '@/components/PaginationUniversal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const MessageSquareIcon = createIconWrapper(MessageSquare);
const Loader2Icon = createIconWrapper(Loader2);
const UserIcon = createIconWrapper(User);
const BotIcon = createIconWrapper(Bot);
const FilterIcon = createIconWrapper(Filter);

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [navigationMode, setNavigationMode] = useState<'pagination' | 'loadMore'>('pagination');
  const chatsPerPage = 15;

  // Filter state
  const [filterStage, setFilterStage] = useState<string>("");
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState<boolean>(false);
  
  // Calculate total pages based on total count
  const totalPages = Math.ceil(totalCount / chatsPerPage);

  // Fetch available stages for filter dropdown
  const fetchStages = async () => {
    try {
      setIsLoadingStages(true);
      // For now, we'll use a simple approach - extract stages from existing conversations
      const uniqueStages = Array.from(new Set(
        conversations
          .map(conv => conv.stage)
          .filter(stage => stage !== null && stage !== undefined)
      ));
      setAvailableStages(uniqueStages);
    } catch (err) {
      console.error('Error fetching stages:', err);
    } finally {
      setIsLoadingStages(false);
    }
  };

  // Fetch stages on component mount
  useEffect(() => {
    fetchStages();
  }, [conversations]);

  const fetchConversations = async (page: number, mode: 'pagination' | 'loadMore' = 'pagination') => {
    try {
      // Set loading states
      setIsLoading(mode === 'pagination');
      setIsLoadingMore(mode === 'loadMore');
      
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
      setIsLoadingMore(false);
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
        senderName
      };
    });
  };

  const handleChatClick = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation);
      setLoadingMessages(true);
      
      const response = await getConversation(conversation.conversation_id.toString(), conversation.project);
      
      if (response.data) {
        const data = response.data as ChatResponse;
        const formattedMessages = convertToDialogMessages(data.messages);
        
        // Sort messages chronologically for enhanced chat (oldest first)
        formattedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setConversationMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      // Fallback to last message if we can't get the full conversation
      setConversationMessages([{
        id: '1',
        content: conversation.last_message,
        timestamp: conversation.last_created_at,
        isBot: true,
        senderName: conversation.bot_alias
      }]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-teal-100 text-teal-800 hover:bg-teal-200';
      case 'seller':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStageBadgeStyles = (stage: string | null | undefined) => {
    if (!stage) return 'bg-gray-100 text-gray-800';
    
    if (stage.includes('отправка')) {
      return 'bg-blue-100 text-blue-800';
    } else if (stage.includes('убеждение')) {
        return 'bg-orange-100 text-orange-800';
    } else {
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormattedStage = (stage: string | null | undefined): string => {
    if (!stage) return 'Нет стадии';
    return stage;
  };

  const getRoleFromBotAlias = (botAlias: string): 'manager' | 'seller' => {
    return botAlias.includes('Leadbee') ? 'manager' : 'seller';
  };

  // Reset filter
  const resetFilter = () => {
    console.log("Resetting filter");
    setFilterStage('');
    setIsFilterActive(false);
    setCurrentPage(1);
    setNavigationMode('pagination');
    // Force refetch
    fetchConversations(1, 'pagination');
  };

  // Apply stage filter
  const applyStageFilter = (stage: string) => {
    console.log(`Applying stage filter: ${stage}`);
    setConversations([]);
    
    // Check if applying the same filter again
    if (filterStage === stage) {
      // Force a refetch with the same filter
      setCurrentPage(1);
      setNavigationMode('pagination');
      fetchConversations(1, 'pagination');
    } else {
      // Normal filter change
      setFilterStage(stage);
      setIsFilterActive(!!stage);
      setCurrentPage(1);
      setNavigationMode('pagination');
    }
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
                          className={getStageBadgeStyles(conversation.stage ?? null)}>
                          {getFormattedStage(conversation.stage ?? null)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {conversation.project}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{conversation.conversation_id}</TableCell>
                  <TableCell className="text-muted-foreground">
                        {formatDate(conversation.last_created_at)}
                  </TableCell>
                </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {isLoadingMore && (
        <div className="flex justify-center my-4">
          <Loader2Icon className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      {totalCount > 0 && (
        <div className="mt-4 flex-shrink-0">
          <PaginationUniversal 
            currentPage={currentPage} 
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLoadMore={handleLoadMore}
            showLoadMore={
              !isLoadingMore && (
                !filterStage 
                ? currentPage < totalPages 
                : conversations.length < totalCount
              )
            }
          />
        </div>
      )}
    </div>
  );
}
