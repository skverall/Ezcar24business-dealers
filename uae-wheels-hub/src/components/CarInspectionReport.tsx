import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Check, AlertTriangle, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const CarInspectionReport = () => {
    const [carInfo, setCarInfo] = useState({
        brand: '',
        model: '',
        year: '',
        mileage: '',
        vin: '',
        date: new Date().toLocaleDateString('ru-RU')
    });

    const [ratings, setRatings] = useState<{
        engine: 'good' | 'warning' | 'bad' | null;
        gearbox: 'good' | 'warning' | 'bad' | null;
        suspension: 'good' | 'warning' | 'bad' | null;
        verdict: 'good' | 'warning' | 'bad' | null;
    }>({
        engine: null,
        gearbox: null,
        suspension: null,
        verdict: null
    });

    const [tyres, setTyres] = useState({
        year: '',
        condition: '',
        brand: ''
    });

    const [extras, setExtras] = useState({
        gcc: '',
        accident: '',
        keys: ''
    });

    const [comment, setComment] = useState('');

    const [bodyParts, setBodyParts] = useState<Record<string, 'original' | 'painted' | 'replaced' | 'putty'>>({
        hood: 'original',
        roof: 'original',
        trunk: 'original',
        frontBumper: 'original',
        rearBumper: 'original',
        frontLeftFender: 'original',
        frontRightFender: 'original',
        rearLeftFender: 'original',
        rearRightFender: 'original',
        frontLeftDoor: 'original',
        frontRightDoor: 'original',
        rearLeftDoor: 'original',
        rearRightDoor: 'original'
    });

    const paintColors: Record<string, string> = {
        original: '#2A2A2A',
        painted: '#FFB800',
        replaced: '#FF4444',
        putty: '#FF8C00'
    };

    const StatusButton = ({ value, current, onClick, label, icon: Icon }: { value: string, current: string | null, onClick: (v: any) => void, label: string, icon: any }) => (
        <Button
            variant={current === value ? "default" : "outline"}
            size="sm"
            onClick={() => onClick(value)}
            className={cn(
                "gap-2 transition-all duration-200",
                current === value && value === 'good' && "bg-emerald-600 hover:bg-emerald-700",
                current === value && value === 'warning' && "bg-amber-600 hover:bg-amber-700",
                current === value && value === 'bad' && "bg-red-600 hover:bg-red-700",
                current !== value && "hover:bg-accent"
            )}
        >
            <Icon className="w-4 h-4" />
            {label}
        </Button>
    );

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground print:bg-white print:text-black">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-luxury to-luxury/80 p-8 md:p-12 text-luxury-foreground shadow-2xl print:shadow-none print:border print:border-gray-300">
                    <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                                🚗
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                    CAR INSPECTION REPORT
                                </h1>
                                <p className="mt-2 text-luxury-foreground/80 font-mono text-sm">
                                    DATE: {carInfo.date}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handlePrint}
                            variant="secondary"
                            className="print:hidden shadow-lg hover:shadow-xl transition-all"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Report
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Car Info */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">Vehicle Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input
                                        placeholder="Toyota, BMW..."
                                        value={carInfo.brand}
                                        onChange={(e) => setCarInfo({ ...carInfo, brand: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Model</Label>
                                    <Input
                                        placeholder="Camry, X5..."
                                        value={carInfo.model}
                                        onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Year</Label>
                                        <Input
                                            placeholder="2023"
                                            value={carInfo.year}
                                            onChange={(e) => setCarInfo({ ...carInfo, year: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mileage (km)</Label>
                                        <Input
                                            placeholder="0"
                                            value={carInfo.mileage}
                                            onChange={(e) => setCarInfo({ ...carInfo, mileage: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>VIN</Label>
                                    <Input
                                        placeholder="Vehicle Identification Number"
                                        value={carInfo.vin}
                                        onChange={(e) => setCarInfo({ ...carInfo, vin: e.target.value })}
                                        className="bg-background/50 font-mono"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Body Paint Scheme */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">02 — Body Paint Scheme</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Car SVG */}
                                    <div className="relative w-full md:w-[240px] h-[480px] bg-background/50 rounded-2xl p-6 shadow-inner mx-auto md:mx-0">
                                        <svg viewBox="0 0 160 360" className="w-full h-full drop-shadow-xl">
                                            {/* Front Bumper */}
                                            <rect x="20" y="10" width="120" height="25" rx="8"
                                                fill={paintColors[bodyParts.frontBumper]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.frontBumper);
                                                    setBodyParts({ ...bodyParts, frontBumper: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Hood */}
                                            <rect x="25" y="40" width="110" height="60" rx="4"
                                                fill={paintColors[bodyParts.hood]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.hood);
                                                    setBodyParts({ ...bodyParts, hood: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Front Left Fender */}
                                            <rect x="10" y="40" width="12" height="70" rx="2"
                                                fill={paintColors[bodyParts.frontLeftFender]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.frontLeftFender);
                                                    setBodyParts({ ...bodyParts, frontLeftFender: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Front Right Fender */}
                                            <rect x="138" y="40" width="12" height="70" rx="2"
                                                fill={paintColors[bodyParts.frontRightFender]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.frontRightFender);
                                                    setBodyParts({ ...bodyParts, frontRightFender: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Roof */}
                                            <rect x="25" y="105" width="110" height="80" rx="4"
                                                fill={paintColors[bodyParts.roof]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.roof);
                                                    setBodyParts({ ...bodyParts, roof: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Front Left Door */}
                                            <rect x="10" y="115" width="12" height="55" rx="2"
                                                fill={paintColors[bodyParts.frontLeftDoor]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.frontLeftDoor);
                                                    setBodyParts({ ...bodyParts, frontLeftDoor: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Front Right Door */}
                                            <rect x="138" y="115" width="12" height="55" rx="2"
                                                fill={paintColors[bodyParts.frontRightDoor]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.frontRightDoor);
                                                    setBodyParts({ ...bodyParts, frontRightDoor: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Rear Left Door */}
                                            <rect x="10" y="175" width="12" height="55" rx="2"
                                                fill={paintColors[bodyParts.rearLeftDoor]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.rearLeftDoor);
                                                    setBodyParts({ ...bodyParts, rearLeftDoor: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Rear Right Door */}
                                            <rect x="138" y="175" width="12" height="55" rx="2"
                                                fill={paintColors[bodyParts.rearRightDoor]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.rearRightDoor);
                                                    setBodyParts({ ...bodyParts, rearRightDoor: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Trunk */}
                                            <rect x="25" y="190" width="110" height="80" rx="4"
                                                fill={paintColors[bodyParts.trunk]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.trunk);
                                                    setBodyParts({ ...bodyParts, trunk: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Rear Left Fender */}
                                            <rect x="10" y="235" width="12" height="70" rx="2"
                                                fill={paintColors[bodyParts.rearLeftFender]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.rearLeftFender);
                                                    setBodyParts({ ...bodyParts, rearLeftFender: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Rear Right Fender */}
                                            <rect x="138" y="235" width="12" height="70" rx="2"
                                                fill={paintColors[bodyParts.rearRightFender]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.rearRightFender);
                                                    setBodyParts({ ...bodyParts, rearRightFender: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Rear Bumper */}
                                            <rect x="20" y="275" width="120" height="25" rx="8"
                                                fill={paintColors[bodyParts.rearBumper]}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                    const currentIndex = states.indexOf(bodyParts.rearBumper);
                                                    setBodyParts({ ...bodyParts, rearBumper: states[(currentIndex + 1) % 4] });
                                                }}
                                            />

                                            {/* Wheels */}
                                            <circle cx="25" cy="55" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                            <circle cx="135" cy="55" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                            <circle cx="25" cy="260" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />
                                            <circle cx="135" cy="260" r="15" fill="#0A0A0A" stroke="#333" strokeWidth="2" />

                                            {/* Labels */}
                                            <text x="80" y="28" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600">FRONT</text>
                                            <text x="80" y="292" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600">REAR</text>
                                        </svg>
                                        <p className="text-center text-xs text-muted-foreground mt-4">
                                            Click parts to cycle status
                                        </p>
                                    </div>

                                    {/* Legend & Summary */}
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { color: '#2A2A2A', label: 'Original', key: 'original' },
                                                { color: '#FFB800', label: 'Painted', key: 'painted' },
                                                { color: '#FF4444', label: 'Replaced', key: 'replaced' },
                                                { color: '#FF8C00', label: 'Putty/Filler', key: 'putty' }
                                            ].map(item => (
                                                <div key={item.key} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                                                    <div
                                                        className="w-4 h-4 rounded-full shadow-sm"
                                                        style={{ background: item.color }}
                                                    />
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                                            <h4 className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-wider">
                                                Painted Parts Summary
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(bodyParts)
                                                    .filter(([_, status]) => status !== 'original')
                                                    .map(([part, status]) => (
                                                        <Badge
                                                            key={part}
                                                            variant="outline"
                                                            className="capitalize"
                                                            style={{
                                                                borderColor: paintColors[status],
                                                                color: paintColors[status]
                                                            }}
                                                        >
                                                            {part.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Badge>
                                                    ))
                                                }
                                                {Object.values(bodyParts).every(s => s === 'original') && (
                                                    <div className="flex items-center gap-2 text-emerald-500 font-medium">
                                                        <Check className="w-4 h-4" />
                                                        All parts are original
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Condition */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">03-05 — Technical Condition</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { key: 'engine', label: 'Engine', icon: '⚙️' },
                                    { key: 'gearbox', label: 'Gearbox', icon: '🔧' },
                                    { key: 'suspension', label: 'Suspension', icon: '🛞' }
                                ].map(item => (
                                    <div key={item.key} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50 gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{item.icon}</span>
                                            <span className="font-semibold tracking-wide">{item.label}</span>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <StatusButton
                                                value="good"
                                                current={ratings[item.key as keyof typeof ratings]}
                                                onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                                label="Good"
                                                icon={Check}
                                            />
                                            <StatusButton
                                                value="warning"
                                                current={ratings[item.key as keyof typeof ratings]}
                                                onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                                label="Issues"
                                                icon={AlertTriangle}
                                            />
                                            <StatusButton
                                                value="bad"
                                                current={ratings[item.key as keyof typeof ratings]}
                                                onClick={(v) => setRatings({ ...ratings, [item.key]: v })}
                                                label="Bad"
                                                icon={X}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Photos */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">01 — Photos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-[4/3] bg-background/50 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors group">
                                            <Camera className="w-8 h-8 text-muted-foreground group-hover:text-luxury transition-colors mb-2" />
                                            <span className="text-xs font-mono text-muted-foreground">Photo {i}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tyres */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">06 — Tyres</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input
                                        placeholder="Michelin..."
                                        value={tyres.brand}
                                        onChange={(e) => setTyres({ ...tyres, brand: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Year</Label>
                                        <Input
                                            placeholder="2022"
                                            value={tyres.year}
                                            onChange={(e) => setTyres({ ...tyres, year: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Condition</Label>
                                        <Input
                                            placeholder="80%"
                                            value={tyres.condition}
                                            onChange={(e) => setTyres({ ...tyres, condition: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Info */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">07 — Additional Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">GCC Specs</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={extras.gcc === 'yes' ? 'default' : 'outline'}
                                            onClick={() => setExtras({ ...extras, gcc: 'yes' })}
                                            className={cn("flex-1", extras.gcc === 'yes' && "bg-emerald-600 hover:bg-emerald-700")}
                                        >Yes</Button>
                                        <Button
                                            variant={extras.gcc === 'no' ? 'default' : 'outline'}
                                            onClick={() => setExtras({ ...extras, gcc: 'no' })}
                                            className={cn("flex-1", extras.gcc === 'no' && "bg-red-600 hover:bg-red-700")}
                                        >No</Button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Accident History</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={extras.accident === 'clean' ? 'default' : 'outline'}
                                            onClick={() => setExtras({ ...extras, accident: 'clean' })}
                                            className={cn("flex-1", extras.accident === 'clean' && "bg-emerald-600 hover:bg-emerald-700")}
                                        >Clean</Button>
                                        <Button
                                            variant={extras.accident === 'accident' ? 'default' : 'outline'}
                                            onClick={() => setExtras({ ...extras, accident: 'accident' })}
                                            className={cn("flex-1", extras.accident === 'accident' && "bg-red-600 hover:bg-red-700")}
                                        >Accident</Button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Keys</Label>
                                    <div className="flex gap-2">
                                        {['1', '2', '2+'].map(k => (
                                            <Button
                                                key={k}
                                                variant={extras.keys === k ? 'default' : 'outline'}
                                                onClick={() => setExtras({ ...extras, keys: k })}
                                                className={cn("flex-1", extras.keys === k && "bg-luxury hover:bg-luxury/90 text-luxury-foreground")}
                                            >{k}</Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>

                {/* Final Verdict */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-background to-secondary/20">
                        <CardTitle className="text-luxury text-sm font-mono tracking-widest uppercase">08 — Final Verdict</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'bad' })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                    ratings.verdict === 'bad'
                                        ? "border-red-500 bg-red-500/10"
                                        : "border-border bg-background/50 hover:border-red-500/50"
                                )}
                            >
                                <span className="text-4xl mb-3">❌</span>
                                <span className={cn("font-bold tracking-wide", ratings.verdict === 'bad' ? "text-red-500" : "text-muted-foreground")}>
                                    DON'T BUY
                                </span>
                            </button>

                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'warning' })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                    ratings.verdict === 'warning'
                                        ? "border-amber-500 bg-amber-500/10"
                                        : "border-border bg-background/50 hover:border-amber-500/50"
                                )}
                            >
                                <span className="text-4xl mb-3">⚠️</span>
                                <span className={cn("font-bold tracking-wide", ratings.verdict === 'warning' ? "text-amber-500" : "text-muted-foreground")}>
                                    CONDITIONAL
                                </span>
                            </button>

                            <button
                                onClick={() => setRatings({ ...ratings, verdict: 'good' })}
                                className={cn(
                                    "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                    ratings.verdict === 'good'
                                        ? "border-emerald-500 bg-emerald-500/10"
                                        : "border-border bg-background/50 hover:border-emerald-500/50"
                                )}
                            >
                                <span className="text-4xl mb-3">✅</span>
                                <span className={cn("font-bold tracking-wide", ratings.verdict === 'good' ? "text-emerald-500" : "text-muted-foreground")}>
                                    GOOD BUY
                                </span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <Label>Additional Comments</Label>
                            <Textarea
                                placeholder="Enter detailed notes, recommendations, or specific issues found..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[120px] bg-background/50 resize-y"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-8 border-t border-border">
                    <p>CAR INSPECTION REPORT v2.0</p>
                    <p>{carInfo.brand && carInfo.model ? `${carInfo.brand} ${carInfo.model}` : 'No car selected'}</p>
                </div>

            </div>
        </div>
    );
};

export default CarInspectionReport;
