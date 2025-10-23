import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  MessageSquare, 
  Copy, 
  Target,
  TrendingUp,
  Users
} from "lucide-react";

const emailSequences = [
  {
    id: "email-1",
    title: "Pain + ROI Hook",
    subject: "{{FirstName}}, you're leaving money on the table",
    body: `Hi {{FirstName}},

If even 2 vendors miss a W-9 or let their COI expire, it's not just a compliance headache—you could be losing $1,300+/month in missed early-payment discounts and penalty risk.

Pulsio automates W-9 and COI collection inside QuickBooks, so you stay compliant and capture the cash impact.

Worth 15 minutes to see your "money at risk" in real time?

[Book a Demo]

— Phil McDonald
Founder, Pulsio`,
    timing: "Day 1"
  },
  {
    id: "email-2", 
    title: "Social Proof + Urgency",
    subject: "How {{ContractorName}} hit 100% vendor compliance",
    body: `Hi {{FirstName}},

{{ContractorName}}, a GC in {{Region}}, went from 62% to 100% vendor compliance in 30 days with Pulsio—without sending a single follow-up email.

They now have:
• All W-9s & COIs in one place
• Auto-reminders for renewals
• 100% visibility on money at risk vs. saved

Want me to run your numbers? I can show you the exact ROI before you decide.

— Phil`,
    timing: "Day 4"
  }
];

const linkedInSequences = [
  {
    id: "linkedin-connection",
    title: "Connection Request",
    content: `Hi {{FirstName}}, saw you manage AP/vendor compliance for {{Company}}. I help GCs using QuickBooks hit 100% vendor compliance while unlocking early-payment discounts. Let's connect.`,
    timing: "Day 1"
  },
  {
    id: "linkedin-followup",
    title: "Follow-up Message",
    content: `Hi {{FirstName}}, curious—how do you track W-9s and COIs today? I've built a QuickBooks-integrated tool that automates this and ties it directly to the cash impact. Happy to share a quick ROI snapshot.`,
    timing: "Day 2"
  }
];

const objectionHandling = [
  {
    objection: "We already use email/Sheets",
    response: "I understand—most of our customers started with spreadsheets too. The challenge is that method costs about 2-3 hours per week in manual follow-ups, plus you can't see the financial impact of missing documents. Pulsio shows you exactly how much money is at risk and automates the entire process. Would you like to see a 5-minute comparison?"
  },
  {
    objection: "Our ProAdvisor handles it",
    response: "That's great that you have that support! Many ProAdvisors actually recommend Pulsio because it gives them and their clients real-time visibility into compliance status and financial impact. It makes their job easier and your business more profitable. Would it be worth a quick call to show how this could complement your existing relationship?"
  },
  {
    objection: "We're on ServiceTitan/Buildertrend",
    response: "Perfect! Those are excellent field management tools. Pulsio integrates with QuickBooks to handle the back-office compliance piece—W-9s, COIs, and payment discount tracking. It's designed to work alongside your existing field management system. Most customers see this as filling a gap rather than replacing anything."
  },
  {
    objection: "We only collect W-9 once",
    response: "You're right about W-9s, but COIs need annual renewal, and tracking early-payment discount eligibility changes with every bill. Plus, you'd be surprised how many W-9s get lost or become outdated when vendors change their business structure. Pulsio ensures you have everything current and tracks the financial impact. Want to see what's actually at risk in your current setup?"
  }
];

export function OutboundSequences() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Outbound Sales Sequences
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Ready-to-use email and LinkedIn sequences targeting AP/Office Managers 
          at SMB contractors using QuickBooks Online.
        </p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Sequences
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="objections" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Objection Handling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emailSequences.map((email) => (
              <Card key={email.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      {email.title}
                    </CardTitle>
                    <Badge variant="outline">{email.timing}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject Line:</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                      {email.subject}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Body:</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-line">
                      {email.body}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="linkedin" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {linkedInSequences.map((sequence) => (
              <Card key={sequence.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      {sequence.title}
                    </CardTitle>
                    <Badge variant="outline">{sequence.timing}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {sequence.content}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(sequence.content)}
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="objections" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {objectionHandling.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Target className="w-5 h-5" />
                    "{item.objection}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">{item.response}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(item.response)}
                    className="mt-4"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Response
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Target Persona Reminder */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="w-5 h-5" />
            Target Persona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Who:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Office Manager / AP Clerk</li>
                <li>• Small-mid general contractors</li>
                <li>• 10-100 vendors</li>
                <li>• Using QuickBooks Online Plus/Advanced</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Pain Points:</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Spreadsheet chaos</li>
                <li>• Email chasing vendors</li>
                <li>• Missed early-payment discounts</li>
                <li>• IRS/1099 exposure risk</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Personalization Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Basic Variables:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• {"{{FirstName}}"}</li>
                <li>• {"{{Company}}"}</li>
                <li>• {"{{ContractorName}}"}</li>
                <li>• {"{{Region}}"}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">ROI Variables:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• {"{{VendorCount}}"}</li>
                <li>• {"{{MoneyAtRisk}}"}</li>
                <li>• {"{{CompliancePercentage}}"}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Pain Point Variables:</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• {"{{MissingDocsCount}}"}</li>
                <li>• {"{{TimeSpentMonthly}}"}</li>
                <li>• {"{{LastAuditIssue}}"}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}