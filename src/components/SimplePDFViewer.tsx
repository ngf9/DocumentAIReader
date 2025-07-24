import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimplePDFViewerProps {
  pdfUrl: string;
}

export default function SimplePDFViewer({ pdfUrl }: SimplePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simple check to see if URL is accessible
    const checkPdfAccess = async () => {
      try {
        // Try a HEAD request to check if PDF is accessible
        const response = await fetch(pdfUrl, { 
          method: 'HEAD',
          mode: 'no-cors' // This will avoid CORS issues but won't give us response details
        });
        setIsLoading(false);
      } catch (error) {
        console.error('PDF access check failed:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      checkPdfAccess();
    }
  }, [pdfUrl]);

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

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white">PDF Document</h3>
          </div>
          <Button
            onClick={() => window.open(pdfUrl, '_blank')}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400">Loading PDF viewer...</p>
            </div>
          </div>
        )}
        
        {hasError ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Unable to Display PDF</h3>
              <p className="text-gray-400 mb-6">
                The PDF cannot be displayed directly due to browser security restrictions. 
                Click the button below to view it in a new tab.
              </p>
              <Button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PDF in New Tab
              </Button>
            </div>
          </div>
        ) : (
          // Use iframe as fallback - this might work for some PDFs
          <div className="h-full relative">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Document"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            >
              <div className="h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Your browser doesn't support PDF viewing.</p>
                  <Button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF in New Tab
                  </Button>
                </div>
              </div>
            </iframe>
            
            {/* Fallback overlay in case iframe fails */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-gray-800 opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ pointerEvents: hasError ? 'auto' : 'none' }}
            >
              <div className="text-center">
                <Button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open PDF in New Tab
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}