import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Loader, CircleAlert, Users } from 'lucide-react';
import { shareServiceGetDocumentByShareToken, shareServiceCreateChatSession } from '@/lib/sdk';
import { Document, ChatSession } from '@/lib/sdk';
import EmbeddedPDFViewer from './EmbeddedPDFViewer';
import SharedChatWidget from './SharedChatWidget';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function SharedDocumentViewer() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSharedDocument = async () => {
      if (!shareToken) {
        setError('No share token provided');
        setLoading(false);
        return;
      }

      try {
        // Get the shared document
        const docResponse = await shareServiceGetDocumentByShareToken({
          body: { share_token: shareToken },
        });

        if (!docResponse.data) {
          throw new Error('Document not found or not publicly accessible');
        }

        setDocument(docResponse.data);

        // Create a new chat session for this visitor
        const sessionResponse = await shareServiceCreateChatSession({
          body: { document_id: docResponse.data.id! },
        });

        if (sessionResponse.data) {
          setChatSession(sessionResponse.data);
        }
      } catch (err) {
        console.error('Error loading shared document:', err);
        setError('Failed to load shared document. The link may be invalid or expired.');
        toast({
          title: "Error loading shared document",
          description: "The shared document could not be loaded. Please check the link and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeSharedDocument();
  }, [shareToken, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-gray-300">Loading shared document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 text-center">
            <CircleAlert className="w-12 h-12 text-red-500" />
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Document Not Available</h2>
              <p className="text-gray-300 mb-4">{error || 'Shared document not found'}</p>
              <p className="text-sm text-gray-400">
                This document may not be publicly shared or the link may have expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Indicates this is a shared document */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-none mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-medium text-white">{document.title}</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>Shared Document</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome banner for shared users */}
      <div className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 border-b border-gray-700">
        <div className="max-w-none mx-auto px-6 py-3">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-purple-400" />
            <p className="text-gray-300 text-sm">
              This document has been shared with you. You can view it and ask questions using AI chat.
            </p>
          </div>
        </div>
      </div>

      {/* Main content - Full screen layout with dark theme */}
      <div className="flex h-[calc(100vh-121px)]">
        {/* PDF Viewer - Takes up more space */}
        <div className="flex-1 bg-gray-800 overflow-hidden">
          <EmbeddedPDFViewer pdfUrl={document.pdf_url || ''} />
        </div>

        {/* Chat Panel - Fixed width sidebar with dark theme */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {chatSession ? (
            <SharedChatWidget 
              sessionToken={chatSession.session_token} 
              documentTitle={document.title}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Setting up chat session...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}