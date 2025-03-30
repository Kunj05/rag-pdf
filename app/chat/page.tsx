"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Send, Loader2 } from "lucide-react";
import axios from "axios";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [namespace, setNamespace] = useState("");
  const [pdfName, setPdfName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setNamespace(res.data.namespace);
        setPdfName(file.name);
        addMessage({
          id: Date.now().toString(),
          text: `PDF "${file.name}" uploaded successfully. You can now ask questions about it.`,
          sender: "ai",
          timestamp: new Date(),
        });
      } else {
        throw new Error(res.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      addMessage({
        id: Date.now().toString(),
        text: "Failed to upload PDF. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !namespace) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log("Sending message:", inputMessage, "to namespace:", namespace);
      const res = await axios.post("/api/query", {
        question: inputMessage,
        namespace,
      });

      // Add AI response to UI
      const aiMessage: Message = {
        id: Date.now().toString() + "-ai",
        text: res.data.answer,
        sender: "ai",
        timestamp: new Date(),
      };
      addMessage(aiMessage);
    } catch (error) {
      console.error("Query error:", error);
      addMessage({
        id: Date.now().toString() + "-error",
        text: "Sorry, I couldn't process your question. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex ">
      {/* PDF Upload/View Section */}
      <div className="w-1/3 border-r border-slate-200 p-6 flex flex-col shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Document Library</h2>
          {!namespace ? (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500  transition-all">
              <Upload className="w-12 h-12 text-slate-400 mb-2" />
              <span className="text-slate-600 font-medium">Upload PDF</span>
              <span className="text-slate-400 text-sm mt-1">Max size: 10MB</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-medium text-slate-700 truncate">{pdfName}</h3>
              <p className="text-sm text-slate-500 mt-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Ready for questions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-2/3 flex flex-col ">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className=" p-6 rounded-xl border border-slate-200 max-w-md">
                <p className="text-slate-600 mb-2">
                  {namespace
                    ? "Your PDF is ready! Ask any question about it."
                    : "Start by uploading a PDF document"}
                </p>
                <p className="text-slate-400 text-sm">
                  {namespace
                    ? "Try asking specific questions about the content"
                    : "Supported format: PDF up to 10MB"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3/4 rounded-lg p-4 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="p-4 border-t border-slate-200 ">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask a question about your PDF..."
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
              disabled={!namespace || isLoading}
            />
            <button
              className="px-4 py-2.5 bg-blue-600  rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
              disabled={!namespace || !inputMessage.trim() || isLoading}
              onClick={handleSendMessage}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
);
}