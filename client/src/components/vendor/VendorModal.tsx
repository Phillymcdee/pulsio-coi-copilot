import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Send,
  Ban,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit,
  Save
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VendorModalProps {
  vendor: any;
  onUpdateVendor: (data: { name?: string; email?: string; phone?: string; notes?: string; isExempt?: boolean }) => void;
  onSendReminder: (data: { type: 'W9' | 'COI'; channel: 'email' | 'sms' }) => void;
  isUpdating: boolean;
  isSendingReminder: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorModal({ 
  vendor, 
  onUpdateVendor, 
  onSendReminder, 
  isUpdating, 
  isSendingReminder,
  isOpen,
  onClose 
}: VendorModalProps) {
  const [notes, setNotes] = useState(vendor?.notes || '');
  const [lastSavedNotes, setLastSavedNotes] = useState(vendor?.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
  });

  if (!isOpen || !vendor) return null;

  // Update form when vendor changes
  useEffect(() => {
    setEditForm({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
    });
    setNotes(vendor.notes || '');
    setLastSavedNotes(vendor.notes || '');
    setIsEditing(false);
  }, [vendor]);

  const handleNotesBlur = () => {
    if (notes !== lastSavedNotes) {
      onUpdateVendor({ notes });
      setLastSavedNotes(notes);
    }
  };

  const handleDownloadDocument = async (docType: 'W9' | 'COI') => {
    try {
      console.log(`Download ${docType} button clicked for vendor:`, vendor.id);
      
      // Find the document for this vendor
      const response = await fetch(`/api/vendors/${vendor.id}/documents`);
      console.log('Documents response:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      const documents = await response.json();
      console.log('Fetched documents:', documents);
      
      const document = documents.find((doc: any) => doc.type === docType);
      console.log(`Found ${docType} document:`, document);
      
      if (!document) {
        console.error(`No ${docType} document found for vendor`);
        alert(`No ${docType} document found for this vendor`);
        return;
      }
      
      // Download the document using the pre-built URL or construct it
      const downloadUrl = document.url || `/api/documents/download/${encodeURIComponent(document.storageKey)}`;
      console.log('Download URL:', downloadUrl);
      
      // Try direct window.open first
      window.open(downloadUrl, '_blank');
      
      // Fallback to programmatic link click
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error downloading ${docType}:`, error);
      alert(`Error downloading ${docType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadCOI = () => handleDownloadDocument('COI');
  const handleDownloadW9 = () => handleDownloadDocument('W9');

  const handleSaveEdit = () => {
    onUpdateVendor({
      name: editForm.name,
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'MISSING':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'EXPIRED':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <CheckCircle className="w-3 h-3" />;
      case 'MISSING':
        return <AlertCircle className="w-3 h-3" />;
      case 'EXPIRED':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4 flex-1">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="vendor-name" className="text-sm font-medium">Company Name</Label>
                    <Input
                      id="vendor-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="vendor-email" className="text-sm font-medium">Email</Label>
                        {vendor.qboId && vendor.emailOverride && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Override active
                          </span>
                        )}
                      </div>
                      <Input
                        id="vendor-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="mt-1"
                      />
                      {vendor.qboId && vendor.qboEmail && vendor.qboEmail !== editForm.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          QuickBooks: {vendor.qboEmail}
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="vendor-phone" className="text-sm font-medium">Phone</Label>
                        {vendor.qboId && vendor.phoneOverride && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Override active
                          </span>
                        )}
                      </div>
                      <Input
                        id="vendor-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                      {vendor.qboId && vendor.qboPhone && vendor.qboPhone !== editForm.phone && (
                        <p className="text-xs text-gray-500 mt-1">
                          QuickBooks: {vendor.qboPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {vendor.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {!vendor.phone && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        No phone number - SMS unavailable
                      </span>
                    )}
                    {vendor.qboId && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center space-x-1">
                        <span>Synced from QuickBooks</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editForm.name}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* QB Sync Info Panel */}
        {vendor.qboId && isEditing && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">QuickBooks Sync Info</h4>
                <p className="text-sm text-blue-700 mb-2">
                  This vendor syncs from QuickBooks Online. When you edit these fields:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• Your changes will <strong>override</strong> QuickBooks data</li>
                  <li>• Future QB syncs won't update overridden fields</li>
                  <li>• You can revert to QB data anytime</li>
                </ul>
                {(vendor.nameOverride || vendor.emailOverride || vendor.phoneOverride) && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-700">Active overrides:</span>
                    {vendor.nameOverride && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Name</span>}
                    {vendor.emailOverride && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Email</span>}
                    {vendor.phoneOverride && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Phone</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* W-9 Status */}
              <Card className={getStatusColor(vendor.w9Status)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(vendor.w9Status)}
                      <span className="font-medium">W-9 Form</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(vendor.w9Status)}>
                      {vendor.w9Status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">Required for 1099 reporting</p>
                  {vendor.w9Status === 'MISSING' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSendReminder({ type: 'W9', channel: 'email' })}
                      disabled={isSendingReminder}
                    >
                      {isSendingReminder ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Send Reminder
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleDownloadW9}>
                      <Download className="w-4 h-4 mr-1" />
                      Download PDF
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* COI Status */}
              <Card className={getStatusColor(vendor.coiStatus)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(vendor.coiStatus)}
                      <span className="font-medium">Certificate of Insurance</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(vendor.coiStatus)}>
                      {vendor.coiStatus}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">
                    {vendor.coiExpiry 
                      ? `Expires: ${new Date(vendor.coiExpiry).toLocaleDateString('en-US', { timeZone: 'UTC' })}`
                      : 'Insurance coverage verification'
                    }
                  </p>
                  {vendor.coiStatus === 'MISSING' || vendor.coiStatus === 'EXPIRED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSendReminder({ type: 'COI', channel: 'email' })}
                      disabled={isSendingReminder}
                    >
                      {isSendingReminder ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      Send Reminder
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleDownloadCOI}>
                      <Download className="w-4 h-4 mr-1" />
                      Download PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Bills */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Recent Bills</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {vendor.bills && vendor.bills.length > 0 ? (
                    vendor.bills.slice(0, 5).map((bill: any, index: number) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {bill.billNumber || `Bill #${bill.id.slice(-6)}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              ${parseFloat(bill.amount).toLocaleString()}
                            </div>
                            {bill.balance && parseFloat(bill.balance) > 0 && (
                              <div className="text-sm text-gray-500">
                                Balance: ${parseFloat(bill.balance).toFixed(2)}
                              </div>
                            )}
                            {bill.balance && parseFloat(bill.balance) === 0 && (
                              <div className="text-sm text-green-600">
                                ✓ Paid
                              </div>
                            )}
                            {bill.discountAmount && parseFloat(bill.discountAmount) > 0 && !bill.discountCaptured && (
                              <div className="text-sm text-amber-600">
                                ${parseFloat(bill.discountAmount).toFixed(2)} discount available
                                {bill.discountDueDate && (
                                  <span className="text-xs text-gray-500 block">
                                    Until {new Date(bill.discountDueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {bill.discountCaptured && (
                              <div className="text-sm text-green-600">
                                ${parseFloat(bill.discountAmount).toFixed(2)} discount captured
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No bills found for this vendor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {vendor.w9Status === 'MISSING' && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-primary hover:bg-primary/5"
                        onClick={() => onSendReminder({ type: 'W9', channel: 'email' })}
                        disabled={isSendingReminder}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend W-9 Reminder (Email)
                      </Button>
                      {vendor.phone && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-green-600 hover:bg-green-50"
                          onClick={() => onSendReminder({ type: 'W9', channel: 'sms' })}
                          disabled={isSendingReminder}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Send W-9 Reminder (SMS)
                        </Button>
                      )}
                    </>
                  )}
                  
                  {(vendor.coiStatus === 'MISSING' || vendor.coiStatus === 'EXPIRED') && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-primary hover:bg-primary/5"
                        onClick={() => onSendReminder({ type: 'COI', channel: 'email' })}
                        disabled={isSendingReminder}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend COI Reminder (Email)
                      </Button>
                      {vendor.phone && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-green-600 hover:bg-green-50"
                          onClick={() => onSendReminder({ type: 'COI', channel: 'sms' })}
                          disabled={isSendingReminder}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Send COI Reminder (SMS)
                        </Button>
                      )}
                    </>
                  )}
                  
                  {vendor.phone && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:bg-gray-50"
                      onClick={() => window.open(`tel:${vendor.phone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Vendor
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:bg-gray-50"
                    onClick={() => onUpdateVendor({ isExempt: !vendor.isExempt })}
                    disabled={isUpdating}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {vendor.isExempt ? 'Remove Exemption' : 'Mark as Exempt'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reminder Log */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Reminder Log</h4>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                  {vendor.reminders && vendor.reminders.length > 0 ? (
                    vendor.reminders.map((reminder: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          reminder.channel === 'email' ? 'bg-primary' : 'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">
                            {reminder.channel === 'email' ? 'Email' : 'SMS'} sent for {reminder.type}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reminder.sentAt), { addSuffix: true })}
                          </div>
                          {reminder.status !== 'sent' && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {reminder.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Mail className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No reminders sent yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Internal Notes</h4>
                </div>
                <div className="p-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add notes about this vendor..."
                    className="resize-none"
                    rows={4}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {notes !== lastSavedNotes ? (
                      <span className="text-amber-600">Unsaved changes</span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Auto-saved
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
