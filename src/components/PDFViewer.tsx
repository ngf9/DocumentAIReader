import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Using minimal UI components for clean OpenAI-style layout
// CSS imports for react-pdf (optional styling)
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker with CORS configuration
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Configure PDF.js for CORS
if (typeof pdfjs !== 'undefined') {
  // Add CORS configuration
  pdfjs.GlobalWorkerOptions.withCredentials = false;
}

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL:', pdfUrl);
    
    // Provide more specific error messages
    if (error.message.includes('CORS')) {
      setError('CORS error: Unable to load PDF due to cross-origin restrictions');
    } else if (error.message.includes('403')) {
      setError('Access denied: PDF file is not accessible (403 error)');
    } else if (error.message.includes('404')) {
      setError('PDF file not found (404 error)');
    } else {
      setError(`Failed to load PDF: ${error.message}`);
    }
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(Math.max(1, pageNumber - 1));
  };

  const goToNextPage = () => {
    setPageNumber(Math.min(numPages, pageNumber + 1));
  };

  const zoomIn = () => {
    setScale(Math.min(3.0, scale + 0.25));
  };

  const zoomOut = () => {
    setScale(Math.max(0.5, scale - 0.25));
  };

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

  console.log('PDF URL:', pdfUrl);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Modern Controls Bar - Dark theme with gradients */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {numPages > 0 && (
              <>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-200 font-medium min-w-[100px] text-center bg-gray-700 px-3 py-1 rounded-md">
                    {pageNumber} / {numPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-200 font-medium min-w-[60px] text-center bg-gray-700 px-3 py-1 rounded-md">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Content - Dark theme presentation */}
      <div className="flex-1 overflow-auto bg-gray-800">
        <div className="flex justify-center py-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-400">Loading PDF...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">{error}</div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-600">
              <Document
                file={{
                  url: pdfUrl,
                  httpHeaders: {
                    'Access-Control-Allow-Origin': '*',
                  },
                  withCredentials: false
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                  disableWorker: false,
                  withCredentials: false
                }}
                loading={
                  <div className="p-8 text-gray-600 bg-gray-100 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading PDF...</span>
                    </div>
                  </div>
                }
                error={
                  <div className="p-8 text-red-600 bg-red-50 flex items-center justify-center border border-red-200">
                    <div className="text-center">
                      <p className="font-medium mb-2">Failed to load PDF</p>
                      <p className="text-sm text-gray-600">This may be due to CORS restrictions or an invalid PDF file.</p>
                      <div className="mt-4">
                        <a 
                          href={pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="p-8 text-gray-600 bg-gray-100 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading page...</span>
                      </div>
                    </div>
                  }
                  error={
                    <div className="p-8 text-red-600 bg-red-50 flex items-center justify-center border border-red-200">
                      <div className="text-center">
                        <p className="font-medium mb-2">Failed to load page</p>
                        <div className="mt-4">
                          <a 
                            href={pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Open PDF in New Tab
                          </a>
                        </div>
                      </div>
                    </div>
                  }
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}