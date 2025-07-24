import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, ExternalLink, Users } from 'lucide-react';
import { shareServiceCreateShareableLink } from '@/lib/sdk';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export default function ShareModal({ isOpen, onClose, documentId, documentTitle }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await shareServiceCreateShareableLink({
        body: { document_id: documentId }
      });

      if (response.data?.share_url) {
        const fullUrl = `${window.location.origin}${response.data.share_url}`;
        setShareUrl(fullUrl);
        toast({
          title: "Share link created",
          description: "Your document is now publicly accessible via the share link."
        });
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const openInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  React.useEffect(() => {
    if (isOpen && !shareUrl) {
      generateShareLink();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setShareUrl('');
      setCopied(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <span>Share Document</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document info */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-medium text-white">{documentTitle}</h3>
                <p className="text-sm text-gray-400">Anyone with the link can view and chat with this document</p>
              </div>
            </div>
          </div>

          {/* Share link generation */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-300">Generating share link...</span>
              </div>
            </div>
          ) : shareUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200 text-sm font-medium">Shareable Link</Label>
                <div className="flex space-x-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-gray-800 border-gray-600 text-white flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white px-3"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={openInNewTab}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Button
                onClick={generateShareLink}
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 border-0 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          )}

          {/* Info section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Share Features</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Public access - no login required</li>
              <li>• Independent chat sessions for each visitor</li>
              <li>• Full document viewing and AI chat capabilities</li>
              <li>• Original document remains private to you</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}