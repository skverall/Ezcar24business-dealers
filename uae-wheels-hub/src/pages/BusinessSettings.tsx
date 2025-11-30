import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Menu, User, Bell, Shield, Palette, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { useDealerProfile } from '@/hooks/useDashboardData';
import { useCrmAuth } from '@/hooks/useCrmAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const BusinessSettings = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: profile } = useDealerProfile();
    const { signOut } = useCrmAuth();
    const [activeTab, setActiveTab] = useState("profile");

    // Placeholder states for form inputs
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Settings
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage your account preferences and business settings
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="profile" className="flex flex-col lg:flex-row gap-8" onValueChange={setActiveTab}>
                    <aside className="lg:w-64 flex-shrink-0">
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                            <TabsTrigger
                                value="profile"
                                className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-800 rounded-xl transition-all"
                            >
                                <User className="w-4 h-4 mr-3" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-800 rounded-xl transition-all"
                            >
                                <Bell className="w-4 h-4 mr-3" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger
                                value="appearance"
                                className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-800 rounded-xl transition-all"
                            >
                                <Palette className="w-4 h-4 mr-3" />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger
                                value="security"
                                className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 dark:data-[state=active]:border-slate-800 rounded-xl transition-all"
                            >
                                <Shield className="w-4 h-4 mr-3" />
                                Security
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    <div className="flex-1">
                        {/* Profile Tab */}
                        <TabsContent value="profile" className="space-y-6 mt-0">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your business profile details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-lg">
                                            <AvatarImage src={profile?.avatar_url} />
                                            <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                                                {profile?.name?.substring(0, 2).toUpperCase() || 'DE'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button variant="outline" size="sm">Change Avatar</Button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Business Name</Label>
                                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971..." />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-6 mt-0">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>Configure how you want to be notified.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Push Notifications</Label>
                                            <p className="text-sm text-slate-500">Receive notifications on your device.</p>
                                        </div>
                                        <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Marketing Emails</Label>
                                            <p className="text-sm text-slate-500">Receive emails about new features and offers.</p>
                                        </div>
                                        <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Appearance Tab */}
                        <TabsContent value="appearance" className="space-y-6 mt-0">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Customize the look and feel of the dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Dark Mode</Label>
                                            <p className="text-sm text-slate-500">Switch between light and dark themes.</p>
                                        </div>
                                        <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-6 mt-0">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Manage your password and account security.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input id="current-password" type="password" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input id="new-password" type="password" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                                            <Input id="confirm-password" type="password" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Update Password</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                                    <CardDescription className="text-red-600/70 dark:text-red-400/70">Irreversible actions for your account.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">Delete Account</p>
                                            <p className="text-sm text-slate-500">Permanently delete your account and all data.</p>
                                        </div>
                                        <Button variant="destructive">Delete Account</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default BusinessSettings;
