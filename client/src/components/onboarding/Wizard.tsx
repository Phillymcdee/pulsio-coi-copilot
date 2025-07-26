import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Building, 
  Clock, 
  Mail, 
  Send,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Activity
} from "lucide-react";

interface WizardProps {
  account: any;
  onCreateAccount: (data: { companyName: string }) => void;
  onCompleteOnboarding: () => void;
  isCreatingAccount: boolean;
  isCompletingOnboarding: boolean;
}

export function Wizard({ 
  account, 
  onCreateAccount, 
  onCompleteOnboarding,
  isCreatingAccount,
  isCompletingOnboarding 
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(account ? 2 : 1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      companyName: account?.companyName || '',
      reminderCadence: account?.reminderCadence || '0 9 * * *',
      emailTemplate: account?.emailTemplate || '',
      smsTemplate: account?.smsTemplate || '',
      sendTestReminder: false,
    }
  });

  // QuickBooks connection mutation
  const qboConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/qbo/auth-url");
      const data = await response.json();
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/account", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    },
  });

  const sendTestReminderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-reminders");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Sent!",
        description: "🎉 We just nudged your first vendor—docs incoming!",
      });
    },
  });

  const steps = [
    { number: 1, title: "Company Info", icon: Building },
    { number: 2, title: "Connect QuickBooks", icon: CheckCircle },
    { number: 3, title: "Reminder Settings", icon: Clock },
    { number: 4, title: "Templates & Launch", icon: Send },
  ];

  const handleNext = async (data?: any) => {
    if (currentStep === 1) {
      onCreateAccount({ companyName: data.companyName });
    } else if (currentStep === 3) {
      await updateAccountMutation.mutateAsync({
        reminderCadence: data.reminderCadence,
      });
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      await updateAccountMutation.mutateAsync({
        emailTemplate: data.emailTemplate,
        smsTemplate: data.smsTemplate,
      });
      
      if (data.sendTestReminder) {
        await sendTestReminderMutation.mutateAsync();
      }
      
      onCompleteOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Pulsio!</h2>
              <p className="text-gray-600">Let's get your company set up for automated document collection.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...register("companyName", { required: true })}
                  placeholder="Your Company LLC"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect QuickBooks</h2>
              <p className="text-gray-600">Sync your vendors and bills to start collecting documents.</p>
            </div>
            
            {account?.qboAccessToken ? (
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">QuickBooks Connected!</p>
                <p className="text-green-600 text-sm">Your vendors and bills are being synced.</p>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => qboConnectionMutation.mutate()}
                  disabled={qboConnectionMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                >
                  {qboConnectionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Connect to QuickBooks
                </Button>
                <p className="text-sm text-gray-500 mt-2">Safe & secure OAuth connection</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminder Cadence</h2>
              <p className="text-gray-600">How often should we remind vendors about missing documents?</p>
            </div>
            
            <RadioGroup 
              value={watch("reminderCadence")} 
              onValueChange={(value) => setValue("reminderCadence", value)}
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="0 9 * * *" id="daily" />
                <Label htmlFor="daily" className="flex-1 cursor-pointer">
                  <div className="font-medium">Daily (Recommended)</div>
                  <div className="text-sm text-gray-500">Every day at 9 AM</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="0 9 * * 1,3,5" id="mwf" />
                <Label htmlFor="mwf" className="flex-1 cursor-pointer">
                  <div className="font-medium">Monday, Wednesday, Friday</div>
                  <div className="text-sm text-gray-500">Three times per week at 9 AM</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="0 9 * * 1" id="weekly" />
                <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                  <div className="font-medium">Weekly</div>
                  <div className="text-sm text-gray-500">Every Monday at 9 AM</div>
                </Label>
              </div>
            </RadioGroup>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Pro Tip:</p>
                  <p className="text-sm text-blue-700">Faster reminders capture discounts before they expire.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Send className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email & SMS Templates</h2>
              <p className="text-gray-600">Customize your reminder messages (optional - we have great defaults).</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailTemplate">Email Template</Label>
                <Textarea
                  id="emailTemplate"
                  {...register("emailTemplate")}
                  placeholder="Leave blank to use our professional default template..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available merge tags: {'{{vendor_name}}'}, {'{{company_name}}'}, {'{{upload_link}}'}
                </p>
              </div>
              
              <div>
                <Label htmlFor="smsTemplate">SMS Template</Label>
                <Textarea
                  id="smsTemplate"
                  {...register("smsTemplate")}
                  placeholder="Leave blank to use our concise default template..."
                  rows={2}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keep it short - SMS has a 160 character limit
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-4 bg-amber-50 rounded-lg">
              <Checkbox 
                id="sendTest" 
                {...register("sendTestReminder")}
              />
              <Label htmlFor="sendTest" className="text-sm">
                Send test reminders to my vendors now (recommended)
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return watch("companyName")?.length > 0;
      case 2:
        return account?.qboAccessToken;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Setup Pulsio</h1>
          <p className="text-gray-600">Get automated document collection running in under 5 minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isComplete = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-2 ${
                    isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary text-white' : 
                      isComplete ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(handleNext)}>
              {renderStep()}
              
              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  type="submit"
                  disabled={
                    !canProceed() || 
                    isCreatingAccount || 
                    isCompletingOnboarding ||
                    updateAccountMutation.isPending ||
                    sendTestReminderMutation.isPending
                  }
                >
                  {isCreatingAccount || isCompletingOnboarding || updateAccountMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : currentStep === 4 ? (
                    <>
                      Start Collecting Docs
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
