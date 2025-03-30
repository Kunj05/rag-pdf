import { ArrowRight, FileText, MessageSquare, Upload } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-6xl font-bold gradient-text">
          Chat with your PDFs
        </h1>
        
        <p className="text-xl text-gray-400">
          Upload your PDF documents and start an intelligent conversation about their contents.
          Get instant answers and insights from your documents.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link 
            href="/chat"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
            <Upload className="w-8 h-8 mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Upload PDF</h3>
            <p className="text-gray-400">Simply upload your PDF document to get started</p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
            <FileText className="w-8 h-8 mb-4 text-purple-400" />
            <h3 className="text-xl font-semibold mb-2">Process Content</h3>
            <p className="text-gray-400">Our AI analyzes your document instantly</p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
            <MessageSquare className="w-8 h-8 mb-4 text-green-400" />
            <h3 className="text-xl font-semibold mb-2">Start Chatting</h3>
            <p className="text-gray-400">Ask questions and get accurate answers</p>
          </div>
        </div>
      </div>
    </main>
  );
}