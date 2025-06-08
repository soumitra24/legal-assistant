"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ChatMessages } from "./components/Chat/ChatMessages";
import { ChatInput } from "./components/Chat/ChatInput";
import { useFileUpload } from "./hooks/useFileUpload";
import { useTheme } from "../contexts/ThemeContext";
import { Message } from "./types/chat";

const Chat = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Hello! I'm your Legal AI Assistant. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const { uploadedFiles, handleFileUpload, removeFile } = useFileUpload({
    onSuccess: () => {},
    onError: () => {}
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !session?.user?.id) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          uploaded_files: uploadedFiles.map(file => ({ name: file.name, size: file.size })),
          user_id: session.user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get AI response');

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
        isAnimating: true
      }]);

    } catch (error: any) {
      console.error("Error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-error-${Date.now()}`,
        role: "bot",
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString(),
        isAnimating: true
      }]);
    }
  };

  const handleAnimationComplete = (messageId: string | number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isAnimating: false } : msg
    ));
  };

  const handleCharacterAdded = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const bgClass = `min-h-screen flex flex-col ${theme === 'light' 
    ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50' 
    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`;

  const spinnerClass = `w-8 h-8 border-2 rounded-full animate-spin ${theme === 'light' 
    ? 'border-orange-300 border-t-orange-600' 
    : 'border-slate-600 border-t-orange-500'}`;

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass.split('flex-col')[1]}`}>
        <div className={spinnerClass} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className={bgClass}>
        <Header />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className={`text-lg mb-4 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Redirecting to sign in...
            </p>
            <div className={`${spinnerClass} mx-auto`} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className={bgClass}>
      <Header isChat={true} />
      
      <div className="flex-1 container mx-auto px-4 py-3 max-w-5xl">
        {theme === 'light' ? (
          <div className="rounded-xl shadow-lg flex flex-col h-[600px] chat-scrollbar-minimal bg-white border border-orange-100">
            <ChatMessages ref={chatContainerRef} messages={messages} isTyping={isTyping} onAnimationComplete={handleAnimationComplete} onCharacterAdded={handleCharacterAdded} />
            <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} onRemoveFile={removeFile} isTyping={isTyping} />
          </div>
        ) : (
          <div className="flex flex-col h-[600px] space-y-4 chat-scrollbar-minimal">
            <ChatMessages ref={chatContainerRef} messages={messages} isTyping={isTyping} onAnimationComplete={handleAnimationComplete} onCharacterAdded={handleCharacterAdded} />
            <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} onRemoveFile={removeFile} isTyping={isTyping} />
          </div>
        )}
        
        <div className={`mt-6 p-4 rounded-lg ${theme === 'light' ? 'bg-amber-50 border border-amber-200' : 'bg-orange-900/20 border border-orange-700/30 backdrop-blur-sm'}`}>
          <p className={`text-sm ${theme === 'light' ? 'text-amber-800' : 'text-orange-200'}`}>
            <strong>Disclaimer:</strong> This AI assistant provides general information only and should not be considered as legal advice. For specific legal matters, please consult with a qualified attorney.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Chat;