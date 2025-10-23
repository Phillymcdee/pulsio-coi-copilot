import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { 
  Settings as SettingsIcon, 
  Mail, 
  MessageSquare, 
  Clock, 
  CreditCard,
  Save,
  Loader2,
  CheckCircle,
  ExternalLink,
  Shield
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const isJobberMode = import.meta.env.VITE_FEATURE_JOBBER === 'true';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/account"],
    enabled: isAuthenticated,
  });

  const { data: pricing } = useQuery({
    queryKey: ["/api/pricing"],
  });

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      companyName: '',
      reminderCadence: '0 9 * * *',
      emailTemplate: '',
      smsTemplate: '',
      minGL: 1000000,
      minAuto: 1000000,
      requireAdditionalInsured: true,
      requireWaiver: true,
      expiryWarningDays: '30,14,7',
    }
  });

  // Reset form when account data loads
  useEffect(() => {
    if (account) {
      const coiRules = (account as any).coiRules || {};
      reset({
        companyName: (account as any).companyName || '',
        reminderCadence: (account as any).reminderCadence || '0 9 * * *',
        emailTemplate: (account as any).emailTemplate || '',
        smsTemplate: (account as any).smsTemplate || '',
        minGL: coiRules.minGL || 1000000,
        minAuto: coiRules.minAuto || 1000000,
        requireAdditionalInsured: coiRules.requireAdditionalInsured !== undefined ? coiRules.requireAdditionalInsured : true,
        requireWaiver: coiRules.requireWaiver !== undefined ? coiRules.requireWaiver : true,
        expiryWarningDays: coiRules.expiryWarningDays ? coiRules.expiryWarningDays.join(',') : '30,14,7',
      });
    }
  }, [account, reset]);

  const updateAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/account", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({
        title: "Settings Updated",
        description: "Your account settings have been saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-portal-session");
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const manualSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sync");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: isJobberMode 
          ? "Jobber sync has been initiated. Check the dashboard for updates."
          : "QuickBooks sync has been initiated. Check the dashboard for updates.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start sync. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Extract COI rules fields to avoid sending them at top level
    const { minGL, minAuto, requireAdditionalInsured, requireWaiver, expiryWarningDays, ...otherFields } = data;
    
    // Transform COI rules data before sending
    const payload = {
      ...otherFields,
      coiRules: {
        minGL: parseInt(minGL) || 1000000,
        minAuto: parseInt(minAuto) || 1000000,
        requireAdditionalInsured,
        requireWaiver,
        expiryWarningDays: expiryWarningDays
          .split(',')
          .map((d: string) => parseInt(d.trim()))
          .filter((d: number) => !isNaN(d)),
      },
    };
    updateAccountMutation.mutate(payload);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
          <p className="text-gray-600">Manage your Pulsio account preferences and integrations.</p>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    {...register("companyName", { required: true })}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                  >
                    {updateAccountMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Reminder Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Reminder Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Reminder Frequency</Label>
                  <p className="text-sm text-gray-600 mb-4">How often should we send reminders for missing documents?</p>
                  
                  <RadioGroup 
                    value={watch("reminderCadence")} 
                    onValueChange={(value) => setValue("reminderCadence", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="0 9 * * *" id="daily" />
                      <Label htmlFor="daily" className="flex-1 cursor-pointer">
                        <div className="font-medium">Daily (Recommended)</div>
                        <div className="text-sm text-gray-500">Every day at 9 AM</div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="0 9 * * 1,3,5" id="mwf" />
                      <Label htmlFor="mwf" className="flex-1 cursor-pointer">
                        <div className="font-medium">Monday, Wednesday, Friday</div>
                        <div className="text-sm text-gray-500">Three times per week at 9 AM</div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="0 9 * * 1" id="weekly" />
                      <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                        <div className="font-medium">Weekly</div>
                        <div className="text-sm text-gray-500">Every Monday at 9 AM</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                  >
                    {updateAccountMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Email & SMS Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Message Templates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="emailTemplate">Email Template</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Customize your email reminder template. Leave blank to use our professional default shown below.
                  </p>
                  
                  {/* Default Email Template Preview */}
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="font-medium text-gray-700 mb-2">Default Email Template:</p>
                    <div className="bg-white p-3 rounded border text-sm space-y-2">
                      <p><strong>Subject:</strong> W-9 Form Required - {'{{company_name}}'}</p>
                      <div className="border-t pt-2 space-y-2 text-gray-700">
                        <h3 className="text-lg font-semibold text-blue-600">W-9 Form Required</h3>
                        <p>Hello <span className="bg-yellow-100 px-1 rounded">{'{{vendor_name}}'}</span>,</p>
                        <p>We need your completed W-9 form for our records. This is required for tax reporting purposes.</p>
                        <div className="my-4">
                          <span className="bg-blue-600 text-white px-4 py-2 rounded inline-block text-sm">
                            Upload W-9 Form
                          </span>
                        </div>
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <p>Best regards,<br/><span className="bg-yellow-100 px-1 rounded">{'{{company_name}}'}</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <Textarea
                    id="emailTemplate"
                    {...register("emailTemplate")}
                    placeholder="Leave blank to use the default template above, or enter your custom HTML template..."
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available merge tags: {'{{vendor_name}}'}, {'{{company_name}}'}, {'{{upload_link}}'}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="smsTemplate">SMS Template</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Short message for SMS reminders. Leave blank to use our default shown below.
                  </p>
                  
                  {/* Default SMS Template Preview */}
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="font-medium text-gray-700 mb-2">Default SMS Template:</p>
                    <div className="bg-white p-3 rounded border text-sm font-mono">
                      Hi <span className="bg-yellow-100 px-1 rounded">{'{{vendor_name}}'}</span>, we need your W-9 form for tax reporting. Please upload it here: <span className="bg-yellow-100 px-1 rounded">{'{{upload_link}}'}</span> - <span className="bg-yellow-100 px-1 rounded">{'{{company_name}}'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">156 characters (within 160 SMS limit)</p>
                  </div>
                  
                  <Textarea
                    id="smsTemplate"
                    {...register("smsTemplate")}
                    placeholder="Leave blank to use the default template above, or enter your custom SMS template..."
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Character count: {watch("smsTemplate")?.length || 0}/160
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                  >
                    {updateAccountMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Templates
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* COI Rules Configuration */}
          <Card data-testid="card-coi-rules">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>COI Compliance Rules</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Coverage Minimums</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Set minimum required coverage amounts for General Liability and Auto Liability insurance.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minGL">General Liability Minimum</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="minGL"
                            type="number"
                            {...register("minGL")}
                            className="pl-7"
                            placeholder="1000000"
                            data-testid="input-min-gl"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Default: $1,000,000 ($1M)
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="minAuto">Auto Liability Minimum</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="minAuto"
                            type="number"
                            {...register("minAuto")}
                            className="pl-7"
                            placeholder="1000000"
                            data-testid="input-min-auto"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Default: $1,000,000 ($1M)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Required Endorsements</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Specify which endorsements must be present on COI documents.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireAdditionalInsured"
                          checked={watch("requireAdditionalInsured")}
                          onCheckedChange={(checked) => setValue("requireAdditionalInsured", checked as boolean)}
                          data-testid="checkbox-require-additional-insured"
                        />
                        <Label htmlFor="requireAdditionalInsured" className="text-sm font-normal cursor-pointer">
                          Require Additional Insured endorsement
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireWaiver"
                          checked={watch("requireWaiver")}
                          onCheckedChange={(checked) => setValue("requireWaiver", checked as boolean)}
                          data-testid="checkbox-require-waiver"
                        />
                        <Label htmlFor="requireWaiver" className="text-sm font-normal cursor-pointer">
                          Require Waiver of Subrogation endorsement
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="expiryWarningDays" className="text-base font-medium">
                      Expiry Reminder Schedule
                    </Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Days before expiry to send reminders (comma-separated). For example: 30,14,7
                    </p>
                    <Input
                      id="expiryWarningDays"
                      {...register("expiryWarningDays")}
                      placeholder="30,14,7"
                      className="mt-1"
                      data-testid="input-expiry-warning-days"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Reminders will be sent at {watch("expiryWarningDays") || '30,14,7'} days before COI expiration
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                    data-testid="button-save-coi-rules"
                  >
                    {updateAccountMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Rules
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* QuickBooks Integration - Hide in Jobber mode */}
          {!isJobberMode && (
            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Connection Status</div>
                    <div className="text-sm text-gray-600">
                      {(account as any)?.qboAccessToken ? 'Connected and syncing' : 'Not connected'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(account as any)?.qboAccessToken ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-red-700 bg-red-50">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
                
                {(account as any)?.qboAccessToken && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => manualSyncMutation.mutate()}
                      disabled={manualSyncMutation.isPending}
                    >
                      {manualSyncMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Sync Now
                    </Button>
                    <p className="text-sm text-gray-500">
                      Last sync: {(account as any)?.updatedAt ? formatDistanceToNow(new Date((account as any).updatedAt), { addSuffix: true }) : 'Never'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Jobber Integration - Show in Jobber mode */}
          {isJobberMode && (
            <Card>
              <CardHeader>
                <CardTitle>Jobber Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Connection Status</div>
                    <div className="text-sm text-gray-600">
                      {(account as any)?.jobberAccessToken ? 'Connected and syncing' : 'Not connected'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(account as any)?.jobberAccessToken ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-red-700 bg-red-50">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
                
                {(account as any)?.jobberAccessToken && (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">
                      Syncing clients and jobs automatically via webhooks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing & Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Billing & Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Current Plan</div>
                  <div className="text-sm text-gray-600">
                    {(account as any)?.plan || 'Free Trial'} Plan
                  </div>
                </div>
                <Badge variant="secondary">
                  {(account as any)?.plan || 'Trial'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Manage Billing</div>
                  <div className="text-sm text-gray-600">
                    Update payment method, view invoices, and manage your subscription
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => createPortalSessionMutation.mutate()}
                  disabled={createPortalSessionMutation.isPending}
                >
                  {createPortalSessionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Billing Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
