import { FileText, Loader, CircleAlert, Share2 } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pdfServiceGetDocument } from '@/lib/sdk';
import PDFViewer from './PDFViewer';
import EmbeddedPDFViewer from './EmbeddedPDFViewer';
import ChatWidget from './ChatWidget';
import ShareModal from './ShareModal';
import { Document } from '@/lib/sdk';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setError('No document ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await pdfServiceGetDocument({
          body: { document_id: id },
        });

        if (response.data) {
          setDocument(response.data);
        } else {
          throw new Error('No document data received');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
        toast({
          title: "Error loading document",
          description: "The document could not be loaded. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-gray-300">Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center space-y-4">
            <CircleAlert className="w-8 h-8 text-red-500" />
            <p className="text-gray-300">{error || 'Document not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Modern dark theme with gradient accent */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-none mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-medium text-white">{document.title}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowShareModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <div className="text-sm text-gray-400">
                PDF Document
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Full screen layout with dark theme */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* PDF Viewer - Takes up more space */}
        <div className="flex-1 bg-gray-800 overflow-hidden">
          <EmbeddedPDFViewer pdfUrl={document.pdf_url || ''} />
        </div>

        {/* Chat Panel - Fixed width sidebar with dark theme */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          <ChatWidget documentId={id!} documentTitle={document.title} />
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={id || ''}
        documentTitle={document?.title || 'Document'}
      />
    </div>
  );
}