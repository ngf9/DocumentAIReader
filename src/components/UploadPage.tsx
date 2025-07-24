import { Upload, FileText } from "lucide-react";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfServiceUploadAndProcessPdf } from '@/lib/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Auto-generate title from filename if not set
      if (!title) {
        const filename = selectedFile.name.replace('.pdf', '');
        setTitle(filename);
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a PDF file and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting upload...', { fileName: file.name, title: title.trim() });
      
      const response = await pdfServiceUploadAndProcessPdf({
        body: {
          pdf_file: file,
          title: title.trim(),
        },
      });

      console.log('Upload response:', response);

      if (response.data?.id) {
        toast({
          title: "Upload successful",
          description: "Your PDF has been processed and is ready to chat with.",
        });
        navigate(`/doc/${response.data.id}`);
      } else {
        throw new Error('No document ID returned');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = "There was an error processing your PDF. Please try again.";
      
      // Try to extract more specific error information
      if (error?.response?.data) {
        console.error('Error response data:', error.response.data);
        errorMessage = `Upload failed: ${JSON.stringify(error.response.data)}`;
      } else if (error?.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Matching document viewer header */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-none mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-medium text-white">Document Analyzer</h1>
            </div>
            <div className="text-sm text-gray-400">
              AI-Powered Document Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Matching document viewer layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left side - Upload area (mimicking PDF viewer area) */}
        <div className="flex-1 bg-gray-800 overflow-hidden flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Upload card */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Your Document</h2>
                  <p className="text-gray-300">
                    Upload a PDF to start chatting with your document using AI
                  </p>
                </div>
              </div>

              {/* Card content */}
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-200 text-sm font-medium">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your document"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 py-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdf-upload" className="text-gray-200 text-sm font-medium">PDF File</Label>
                  <div className="relative">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="bg-gray-800 border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-purple-500 file:to-orange-500 file:text-white hover:file:from-purple-600 hover:file:to-orange-600 py-3"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center text-sm text-gray-300 mt-3 bg-gray-800 px-4 py-3 rounded-lg border border-gray-600">
                      <FileText className="w-4 h-4 mr-3 text-purple-400" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || !title.trim() || isUploading}
                  className="w-full bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white font-medium py-3 text-base"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-3" />
                      Analyze Document
                    </>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-400">
                    Your document will be processed with AI to enable intelligent conversations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Info panel (mimicking chat panel) */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Info header */}
          <div className="border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-medium text-white">How It Works</h2>
              </div>
            </div>
          </div>

          {/* Info content */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-medium">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Upload PDF</h3>
                    <p className="text-gray-400 text-sm">Select and upload your PDF document to get started.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-medium">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">AI Processing</h3>
                    <p className="text-gray-400 text-sm">Our AI analyzes and extracts key information from your document.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-medium">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Interactive Chat</h3>
                    <p className="text-gray-400 text-sm">Ask questions and get intelligent responses about your document.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Supported Features</h4>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Document summarization</li>
                  <li>• Question answering</li>
                  <li>• Key information extraction</li>
                  <li>• Context-aware responses</li>
                  <li>• Page references</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}