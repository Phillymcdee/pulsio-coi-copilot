import { useState } from 'react';
import { useRoute } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, CheckCircle, Shield, Edit } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface Vendor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  coiStatus: string;
}

interface ParsedCOIData {
  effectiveDate?: string;
  expiryDate?: string;
  glCoverage?: number;
  autoCoverage?: number;
  additionalInsured?: boolean;
  waiverOfSubrogation?: boolean;
}

interface UploadedDocument {
  id: string;
  parsedData?: ParsedCOIData;
  violations?: string[];
}

export default function UploadPage() {
  const [match, params] = useRoute('/upload/:vendorId');
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [parsedFields, setParsedFields] = useState<ParsedCOIData>({});

  const vendorId = params?.vendorId;

  // Fetch vendor information (public endpoint, no auth required)
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ['/api/vendors', vendorId, 'public'],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/public`);
      if (!response.ok) {
        throw new Error('Vendor not found');
      }
      return response.json();
    },
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
    onSuccess: (data) => {
      if (data.document?.parsedData) {
        // Show confirmation screen for COI with parsed data
        setUploadedDocument(data.document);
        setParsedFields(data.document.parsedData);
        setShowConfirmation(true);
      } else {
        // COI without parsed data, show success immediately
        toast({
          title: "Document uploaded successfully!",
          description: "Your Certificate of Insurance has been received. Thank you!",
        });
        setSelectedFile(null);
      }
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

    uploadMutation.mutate({ file: selectedFile, type: 'COI' });
  };

  // Mutation to update document with corrected data
  const updateDocumentMutation = useMutation({
    mutationFn: async (correctedData: ParsedCOIData) => {
      const response = await fetch(`/api/documents/${uploadedDocument?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData: correctedData }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "COI submitted successfully!",
        description: "Thank you for providing your Certificate of Insurance.",
      });
      // Reset state
      setShowConfirmation(false);
      setSelectedFile(null);
      setUploadedDocument(null);
      setParsedFields({});
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save corrections",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmCOI = () => {
    updateDocumentMutation.mutate(parsedFields);
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

  const isCOIComplete = vendor.coiStatus === 'RECEIVED';

  // Show confirmation screen if COI was uploaded with parsed data
  if (showConfirmation && uploadedDocument) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Review COI Information
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please review the extracted information and make any necessary corrections
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Extracted Certificate Details</span>
              </CardTitle>
              <CardDescription>
                Our system automatically extracted these fields. Please verify accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={parsedFields.effectiveDate || ''}
                    onChange={(e) => setParsedFields({ ...parsedFields, effectiveDate: e.target.value })}
                    className="mt-1"
                    data-testid="input-effective-date"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={parsedFields.expiryDate || ''}
                    onChange={(e) => setParsedFields({ ...parsedFields, expiryDate: e.target.value })}
                    className="mt-1"
                    data-testid="input-expiry-date"
                  />
                </div>
              </div>

              {/* Coverage Amounts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="glCoverage">General Liability Coverage</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="glCoverage"
                      type="number"
                      value={parsedFields.glCoverage || ''}
                      onChange={(e) => setParsedFields({ ...parsedFields, glCoverage: parseInt(e.target.value) || 0 })}
                      className="pl-7"
                      placeholder="1000000"
                      data-testid="input-gl-coverage"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Typically $1,000,000 ($1M)
                  </p>
                </div>
                <div>
                  <Label htmlFor="autoCoverage">Auto Liability Coverage</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="autoCoverage"
                      type="number"
                      value={parsedFields.autoCoverage || ''}
                      onChange={(e) => setParsedFields({ ...parsedFields, autoCoverage: parseInt(e.target.value) || 0 })}
                      className="pl-7"
                      placeholder="1000000"
                      data-testid="input-auto-coverage"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Typically $1,000,000 ($1M)
                  </p>
                </div>
              </div>

              {/* Endorsements */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="text-base font-medium">Endorsements</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="additionalInsured"
                      checked={parsedFields.additionalInsured || false}
                      onCheckedChange={(checked) => setParsedFields({ ...parsedFields, additionalInsured: checked as boolean })}
                      data-testid="checkbox-additional-insured"
                    />
                    <Label htmlFor="additionalInsured" className="text-sm font-normal cursor-pointer">
                      Additional Insured
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="waiverOfSubrogation"
                      checked={parsedFields.waiverOfSubrogation || false}
                      onCheckedChange={(checked) => setParsedFields({ ...parsedFields, waiverOfSubrogation: checked as boolean })}
                      data-testid="checkbox-waiver-of-subrogation"
                    />
                    <Label htmlFor="waiverOfSubrogation" className="text-sm font-normal cursor-pointer">
                      Waiver of Subrogation
                    </Label>
                  </div>
                </div>
              </div>

              {/* Violations Display */}
              {uploadedDocument.violations && uploadedDocument.violations.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Compliance Issues Detected
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                    {uploadedDocument.violations.map((violation, idx) => (
                      <li key={idx}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-back"
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleConfirmCOI}
                  disabled={updateDocumentMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-coi"
                >
                  {updateDocumentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm & Submit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Certificate of Insurance Upload
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload your Certificate of Insurance for <strong>{vendor.companyName}</strong>
          </p>
        </div>

        {/* Status Display */}
        <div className="flex justify-center mb-8">
          <Card className={`border-2 max-w-md w-full ${isCOIComplete ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
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