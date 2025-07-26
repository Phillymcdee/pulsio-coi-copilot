import { useState } from 'react';
import { useRoute } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface Vendor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  w9Status: string;
  coiStatus: string;
}

export default function UploadPage() {
  const [match, params] = useRoute('/upload/:vendorId');
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'W9' | 'COI'>('W9');
  const [isDragOver, setIsDragOver] = useState(false);

  const vendorId = params?.vendorId;

  // Fetch vendor information
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ['/api/vendors', vendorId],
    enabled: !!vendorId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);

      const response = await fetch(`/api/upload/${vendorId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully!",
        description: `Your ${documentType} has been received. Thank you!`,
      });
      setSelectedFile(null);
      setDocumentType('W9');
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPEG, PNG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, type: documentType });
  };

  if (!match) {
    return null;
  }

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Vendor Not Found</CardTitle>
            <CardDescription>
              The upload link you're using is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isW9Complete = vendor.w9Status === 'RECEIVED';
  const isCOIComplete = vendor.coiStatus === 'RECEIVED';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Document Upload
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload your W-9 or Certificate of Insurance for <strong>{vendor.companyName}</strong>
          </p>
        </div>

        {/* Status Display */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className={`border-2 ${isW9Complete ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
            <CardContent className="p-4 flex items-center space-x-3">
              {isW9Complete ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold">W-9 Form</h3>
                <p className={`text-sm ${isW9Complete ? 'text-green-600' : 'text-gray-500'}`}>
                  {isW9Complete ? 'Received ✓' : 'Pending'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${isCOIComplete ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
            <CardContent className="p-4 flex items-center space-x-3">
              {isCOIComplete ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold">Certificate of Insurance</h3>
                <p className={`text-sm ${isCOIComplete ? 'text-green-600' : 'text-gray-500'}`}>
                  {isCOIComplete ? 'Received ✓' : 'Pending'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Select the document type and upload your file. Accepted formats: PDF, JPEG, PNG (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={(value: 'W9' | 'COI') => setDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="W9">W-9 Tax Form</SelectItem>
                  <SelectItem value="COI">Certificate of Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-green-600 font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Drag and drop your file here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        browse to select
                        <Input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-400">
                      PDF, JPEG, PNG files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
              size="lg"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {documentType}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Questions? Contact support or reply to the email that sent you this link.
          </p>
        </div>
      </div>
    </div>
  );
}