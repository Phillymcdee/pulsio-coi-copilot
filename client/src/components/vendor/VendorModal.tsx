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

  const handleSaveEdit = () => {
    onUpdateVendor({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
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
                      <Label htmlFor="vendor-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="vendor-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendor-phone" className="text-sm font-medium">Phone</Label>
                      <Input
                        id="vendor-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
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
                  disabled={isUpdating || !editForm.name || !editForm.email}
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
                    <Button size="sm" variant="outline">
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
                      ? `Expires: ${new Date(vendor.coiExpiry).toLocaleDateString()}`
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
                    <Button size="sm" variant="outline">
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
                            {bill.discountAmount && parseFloat(bill.discountAmount) > 0 && !bill.discountCaptured && (
                              <div className="text-sm text-amber-600">
                                ${parseFloat(bill.discountAmount).toFixed(2)} discount available
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
