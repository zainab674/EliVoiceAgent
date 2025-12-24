import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Filter, Search, ChevronDown, Clock, User, Mail, Phone, Bot, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/layout/DashboardLayout';
import { ThemeContainer } from '@/components/theme';
import { useToast } from '@/hooks/use-toast';

interface Booking {
    _id: string;
    assistantId: {
        _id: string;
        name: string;
    };
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    startTime: string;
    endTime?: string;
    status: 'scheduled' | 'cancelled' | 'completed';
    duration?: number;
    timezone?: string;
    notes?: string;
    createdAt: string;
}

const Bookings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [assistantFilter, setAssistantFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, searchQuery, statusFilter, assistantFilter, activeTab]);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('/api/v1/bookings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const data = await response.json();
            setBookings(data);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load bookings',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Filter by upcoming/past
        const now = new Date();
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(b => new Date(b.startTime) >= now);
        } else {
            filtered = filtered.filter(b => new Date(b.startTime) < now);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        // Filter by assistant
        if (assistantFilter !== 'all') {
            filtered = filtered.filter(b => b.assistantId._id === assistantFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.clientName.toLowerCase().includes(query) ||
                b.clientEmail.toLowerCase().includes(query) ||
                b.clientPhone.includes(query) ||
                b.assistantId.name.toLowerCase().includes(query)
            );
        }

        // Sort by start time
        filtered.sort((a, b) => {
            const dateA = new Date(a.startTime).getTime();
            const dateB = new Date(b.startTime).getTime();
            return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
        });

        setFilteredBookings(filtered);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Clock className="h-4 w-4" />;
            case 'completed':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'completed':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    const uniqueAssistants = Array.from(
        new Set(bookings.map(b => JSON.stringify({ id: b.assistantId._id, name: b.assistantId.name })))
    ).map(str => JSON.parse(str));

    if (loading) {
        return (
            <DashboardLayout>
                <ThemeContainer variant="base" className="min-h-screen">
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading bookings...</p>
                        </div>
                    </div>
                </ThemeContainer>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage all your appointment bookings
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                                {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                            </Badge>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, email, phone, or assistant..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={assistantFilter} onValueChange={setAssistantFilter}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue placeholder="Assistant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Assistants</SelectItem>
                                        {uniqueAssistants.map((assistant: any) => (
                                            <SelectItem key={assistant.id} value={assistant.id}>
                                                {assistant.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')}>
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="upcoming">
                                Upcoming ({bookings.filter(b => new Date(b.startTime) >= new Date()).length})
                            </TabsTrigger>
                            <TabsTrigger value="past">
                                Past ({bookings.filter(b => new Date(b.startTime) < new Date()).length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredBookings.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                                        <p className="text-muted-foreground text-center max-w-md">
                                            {activeTab === 'upcoming'
                                                ? "You don't have any upcoming bookings. Bookings made through your assistants will appear here."
                                                : "You don't have any past bookings yet."}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredBookings.map((booking) => {
                                        const { date, time } = formatDateTime(booking.startTime);
                                        return (
                                            <Card key={booking._id} className="hover:border-primary/50 transition-colors">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1 space-y-3">
                                                            {/* Date and Time */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-medium">{date}</span>
                                                                    <span className="text-muted-foreground">at</span>
                                                                    <span className="font-medium">{time}</span>
                                                                </div>
                                                                <Badge className={`${getStatusColor(booking.status)} border`}>
                                                                    <span className="flex items-center gap-1">
                                                                        {getStatusIcon(booking.status)}
                                                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                                    </span>
                                                                </Badge>
                                                            </div>

                                                            {/* Client Info */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{booking.clientName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="truncate">{booking.clientEmail}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{booking.clientPhone}</span>
                                                                </div>
                                                            </div>

                                                            {/* Assistant */}
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Bot className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-muted-foreground">Booked via</span>
                                                                <span className="font-medium">{booking.assistantId.name}</span>
                                                            </div>

                                                            {/* Notes */}
                                                            {booking.notes && (
                                                                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                                                    <span className="font-medium">Notes:</span> {booking.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </ThemeContainer>
        </DashboardLayout>
    );
};

export default Bookings;
