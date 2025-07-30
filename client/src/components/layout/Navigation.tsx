import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Bell, 
  ChevronDown,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location.startsWith(path);
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      href: "/vendors",
      label: "Vendors", 
      icon: Users,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Pulsio</span>
              </div>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <span className={`${
                      isActive(item.href)
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors cursor-pointer`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImageUrl} alt={(user as any)?.firstName || "User"} />
                    <AvatarFallback>
                      {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-gray-700 font-medium">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</p>
                  <p className="text-xs text-gray-500">{(user as any)?.email}</p>
                  {account && (account as any)?.companyName && (
                    <p className="text-xs text-gray-500">{(account as any).companyName}</p>
                  )}
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <span className="flex items-center w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscribe">
                    <span className="flex items-center w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Billing & Plans
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
