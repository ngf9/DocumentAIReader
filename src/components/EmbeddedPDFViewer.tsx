import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbeddedPDFViewerProps {
  pdfUrl: string;
}

export default function EmbeddedPDFViewer({ pdfUrl }: EmbeddedPDFViewerProps) {
  if (!pdfUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-400">No PDF URL provided</p>
        </div>
      </div>
    );
  }

  // Create a Google Docs viewer URL as fallback
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header with controls */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white">PDF Document</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => window.open(pdfUrl, '_blank')}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Direct Link
            </Button>
            <Button
              onClick={() => window.open(googleViewerUrl, '_blank')}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Viewer
            </Button>
          </div>
        </div>
      </div>

      {/* Embedded viewer */}
      <div className="flex-1 bg-gray-800 p-4">
        <div className="h-full bg-white rounded-lg overflow-hidden shadow-2xl border border-gray-600">
          <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title="PDF Document Viewer"
          >
            {/* Fallback content for browsers that don't support iframes */}
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Viewer Not Available</h3>
                <p className="text-gray-600 mb-6">
                  Your browser doesn't support embedded PDF viewing.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF Directly
                  </Button>
                  <Button
                    onClick={() => window.open(googleViewerUrl, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Google Viewer
                  </Button>
                </div>
              </div>
            </div>
          </iframe>
        </div>
      </div>
    </div>
  );
}