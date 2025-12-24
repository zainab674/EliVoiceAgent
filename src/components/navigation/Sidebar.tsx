
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Bot,
    MessageSquare,
    Users,
    Megaphone,
    Phone,
    Shield,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sparkles,
    Blocks,
    Calendar,
    Mail,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const { user, signOut } = useAuth();

    const isAdmin = user?.role === 'admin';

    const navItems = [
        { icon: <BarChart3 size={20} />, label: "Dashboard", to: "/dashboard" },
        { icon: <Bot size={20} />, label: "Assistants", to: "/assistants" },
        { icon: <Megaphone size={20} />, label: "Campaigns", to: "/campaigns" },
        { icon: <Phone size={20} />, label: "Calls", to: "/calls" },
        { icon: <Users size={20} />, label: "Contacts", to: "/contacts" },
        { icon: <Calendar size={20} />, label: "Bookings", to: "/bookings" },
        { icon: <Mail size={20} />, label: "Emails", to: "/emails" },
        { icon: <Send size={20} />, label: "Email Campaign", to: "/email-automation" },
        { icon: <MessageSquare size={20} />, label: "SMS Campaign", to: "/sms-campaign" },
        { icon: <Blocks size={20} />, label: "Integrations", to: "/settings?tab=integrations" },
    ];

    if (isAdmin) {
        navItems.push({ icon: <Shield size={20} />, label: "Admin", to: "/admin" });
    }

    return (
        <aside
            className={cn(
                "relative h-screen flex flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-all duration-300 z-50",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo/Brand Area */}
            <div className="h-16 flex items-center justify-center border-b border-border p-4">
                {collapsed ? (
                    <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-primary-foreground font-bold text-xl"></span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">

                        <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="h-4 w-4 text-primary-foreground" />
                        </div>

                        <span className="font-bold text-lg text-foreground tracking-tight">
                            Shmixi
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                <TooltipProvider delayDuration={0}>
                    {navItems.map((item) => {
                        const isActive = item.to.includes('?')
                            ? (location.pathname + location.search) === item.to
                            : location.pathname === item.to && (location.search === '' || location.search === '?tab=account');
                        return (
                            <div key={item.to} className="w-full">
                                {collapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={item.to}
                                                className={cn(
                                                    "flex items-center justify-center w-full h-12 rounded-xl transition-all duration-200 group relative",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                                )}
                                                {item.icon}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium bg-popover border-border text-popover-foreground">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Link
                                        to={item.to}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium border border-primary/10"
                                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />
                                        )}
                                        <span className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border space-y-2">
                <TooltipProvider delayDuration={0}>
                    {/* Settings Link */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    to="/settings"
                                    className="flex items-center justify-center w-full h-12 rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
                                >
                                    <Settings size={20} />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">Settings</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                    )}

                    {/* Sign Out */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center justify-center w-full h-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                    <LogOut size={20} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">Sign Out</TooltipContent>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-left"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    )}
                </TooltipProvider>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 bg-card border border-border text-muted-foreground p-1 rounded-full shadow-xl hover:text-foreground hover:border-primary transition-all z-50"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
