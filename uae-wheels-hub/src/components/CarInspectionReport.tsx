import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Printer,
    Check,
    AlertTriangle,
    X,
    Camera,
    Car,
    Calendar,
    Gauge,
    FileText,
    Info,
    Wrench,
    Cog,
    Disc
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        original: 'transparent', // Changed to transparent for better look on SVG
        painted: '#F59E0B', // Amber
        replaced: '#EF4444', // Red
        putty: '#F97316' // Orange
    };

    const StatusButton = ({ value, current, onClick, label, icon: Icon }: { value: string, current: string | null, onClick: (v: any) => void, label: string, icon: any }) => (
        <Button
            variant={current === value ? "default" : "outline"}
            size="sm"
            onClick={() => onClick(value)}
            className={cn(
                "gap-2 transition-all duration-200 flex-1",
                current === value && value === 'good' && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600",
                current === value && value === 'warning' && "bg-amber-600 hover:bg-amber-700 border-amber-600",
                current === value && value === 'bad' && "bg-red-600 hover:bg-red-700 border-red-600",
                current !== value && "hover:bg-accent hover:text-accent-foreground"
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
        <TooltipProvider>
            <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground print:bg-white print:text-black">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-10 shadow-xl print:shadow-none print:border print:border-gray-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-luxury/10 rounded-2xl flex items-center justify-center text-luxury shadow-sm border border-luxury/20">
                                    <Car className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                        Vehicle Inspection Report
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2 text-muted-foreground font-mono text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{carInfo.date}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="print:hidden gap-2 hover:bg-luxury hover:text-luxury-foreground transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print Report
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Main Content Column */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Car Info */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Info className="w-5 h-5 text-luxury" />
                                        Vehicle Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input
                                            placeholder="e.g. Toyota"
                                            value={carInfo.brand}
                                            onChange={(e) => setCarInfo({ ...carInfo, brand: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Input
                                            placeholder="e.g. Camry"
                                            value={carInfo.model}
                                            onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Year</Label>
                                            <Input
                                                placeholder="e.g. 2023"
                                                value={carInfo.year}
                                                onChange={(e) => setCarInfo({ ...carInfo, year: e.target.value })}
                                                className="bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mileage (km)</Label>
                                            <Input
                                                placeholder="e.g. 50,000"
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
                                            className="bg-background/50 font-mono uppercase"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Body Paint Scheme */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                            <Car className="w-5 h-5 text-luxury" />
                                            Body Condition
                                        </CardTitle>
                                        <Badge variant="outline" className="font-normal text-muted-foreground">
                                            Click parts to update status
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col xl:flex-row gap-8 items-center xl:items-start justify-center">
                                        {/* Improved Car SVG */}
                                        <div className="relative w-[280px] h-[500px] bg-background/30 rounded-3xl p-6 border border-border/30 shadow-inner flex-shrink-0">
                                            <svg viewBox="0 0 280 500" className="w-full h-full drop-shadow-lg">
                                                <defs>
                                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                    </filter>
                                                </defs>

                                                {/* Car Silhouette Outline for context */}
                                                <path d="M70,20 Q140,10 210,20 L230,80 L230,420 L210,480 Q140,490 70,480 L50,420 L50,80 Z"
                                                    fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />

                                                {/* Front Bumper */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M60,40 Q140,25 220,40 L225,70 Q140,80 55,70 Z"
                                                            fill={bodyParts.frontBumper === 'original' ? 'currentColor' : paintColors[bodyParts.frontBumper]}
                                                            fillOpacity={bodyParts.frontBumper === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.frontBumper);
                                                                setBodyParts({ ...bodyParts, frontBumper: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Front Bumper: {bodyParts.frontBumper}</TooltipContent>
                                                </Tooltip>

                                                {/* Hood */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M65,75 Q140,85 215,75 L210,160 Q140,150 70,160 Z"
                                                            fill={bodyParts.hood === 'original' ? 'currentColor' : paintColors[bodyParts.hood]}
                                                            fillOpacity={bodyParts.hood === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.hood);
                                                                setBodyParts({ ...bodyParts, hood: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Hood: {bodyParts.hood}</TooltipContent>
                                                </Tooltip>

                                                {/* Front Left Fender */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M50,75 L60,75 L65,160 L50,160 Z"
                                                            fill={bodyParts.frontLeftFender === 'original' ? 'currentColor' : paintColors[bodyParts.frontLeftFender]}
                                                            fillOpacity={bodyParts.frontLeftFender === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.frontLeftFender);
                                                                setBodyParts({ ...bodyParts, frontLeftFender: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Front Left Fender: {bodyParts.frontLeftFender}</TooltipContent>
                                                </Tooltip>

                                                {/* Front Right Fender */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M230,75 L220,75 L215,160 L230,160 Z"
                                                            fill={bodyParts.frontRightFender === 'original' ? 'currentColor' : paintColors[bodyParts.frontRightFender]}
                                                            fillOpacity={bodyParts.frontRightFender === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.frontRightFender);
                                                                setBodyParts({ ...bodyParts, frontRightFender: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Front Right Fender: {bodyParts.frontRightFender}</TooltipContent>
                                                </Tooltip>

                                                {/* Roof */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M75,170 Q140,165 205,170 L205,280 Q140,285 75,280 Z"
                                                            fill={bodyParts.roof === 'original' ? 'currentColor' : paintColors[bodyParts.roof]}
                                                            fillOpacity={bodyParts.roof === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.roof);
                                                                setBodyParts({ ...bodyParts, roof: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Roof: {bodyParts.roof}</TooltipContent>
                                                </Tooltip>

                                                {/* Front Left Door */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M50,165 L70,165 L70,275 L50,275 Z"
                                                            fill={bodyParts.frontLeftDoor === 'original' ? 'currentColor' : paintColors[bodyParts.frontLeftDoor]}
                                                            fillOpacity={bodyParts.frontLeftDoor === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.frontLeftDoor);
                                                                setBodyParts({ ...bodyParts, frontLeftDoor: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Front Left Door: {bodyParts.frontLeftDoor}</TooltipContent>
                                                </Tooltip>

                                                {/* Front Right Door */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M230,165 L210,165 L210,275 L230,275 Z"
                                                            fill={bodyParts.frontRightDoor === 'original' ? 'currentColor' : paintColors[bodyParts.frontRightDoor]}
                                                            fillOpacity={bodyParts.frontRightDoor === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.frontRightDoor);
                                                                setBodyParts({ ...bodyParts, frontRightDoor: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Front Right Door: {bodyParts.frontRightDoor}</TooltipContent>
                                                </Tooltip>

                                                {/* Rear Left Door */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M50,280 L70,280 L70,360 L50,360 Z"
                                                            fill={bodyParts.rearLeftDoor === 'original' ? 'currentColor' : paintColors[bodyParts.rearLeftDoor]}
                                                            fillOpacity={bodyParts.rearLeftDoor === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearLeftDoor);
                                                                setBodyParts({ ...bodyParts, rearLeftDoor: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Rear Left Door: {bodyParts.rearLeftDoor}</TooltipContent>
                                                </Tooltip>

                                                {/* Rear Right Door */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M230,280 L210,280 L210,360 L230,360 Z"
                                                            fill={bodyParts.rearRightDoor === 'original' ? 'currentColor' : paintColors[bodyParts.rearRightDoor]}
                                                            fillOpacity={bodyParts.rearRightDoor === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearRightDoor);
                                                                setBodyParts({ ...bodyParts, rearRightDoor: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Rear Right Door: {bodyParts.rearRightDoor}</TooltipContent>
                                                </Tooltip>

                                                {/* Trunk */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M70,290 Q140,285 210,290 L210,400 Q140,410 70,400 Z"
                                                            fill={bodyParts.trunk === 'original' ? 'currentColor' : paintColors[bodyParts.trunk]}
                                                            fillOpacity={bodyParts.trunk === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.trunk);
                                                                setBodyParts({ ...bodyParts, trunk: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Trunk: {bodyParts.trunk}</TooltipContent>
                                                </Tooltip>

                                                {/* Rear Left Fender */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M50,365 L70,365 L65,420 L55,420 Z"
                                                            fill={bodyParts.rearLeftFender === 'original' ? 'currentColor' : paintColors[bodyParts.rearLeftFender]}
                                                            fillOpacity={bodyParts.rearLeftFender === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearLeftFender);
                                                                setBodyParts({ ...bodyParts, rearLeftFender: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Rear Left Fender: {bodyParts.rearLeftFender}</TooltipContent>
                                                </Tooltip>

                                                {/* Rear Right Fender */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M230,365 L210,365 L215,420 L225,420 Z"
                                                            fill={bodyParts.rearRightFender === 'original' ? 'currentColor' : paintColors[bodyParts.rearRightFender]}
                                                            fillOpacity={bodyParts.rearRightFender === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearRightFender);
                                                                setBodyParts({ ...bodyParts, rearRightFender: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Rear Right Fender: {bodyParts.rearRightFender}</TooltipContent>
                                                </Tooltip>

                                                {/* Rear Bumper */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M55,425 Q140,435 225,425 L220,455 Q140,465 60,455 Z"
                                                            fill={bodyParts.rearBumper === 'original' ? 'currentColor' : paintColors[bodyParts.rearBumper]}
                                                            fillOpacity={bodyParts.rearBumper === 'original' ? 0.05 : 0.8}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearBumper);
                                                                setBodyParts({ ...bodyParts, rearBumper: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>Rear Bumper: {bodyParts.rearBumper}</TooltipContent>
                                                </Tooltip>

                                                {/* Wheels */}
                                                <rect x="35" y="80" width="15" height="30" rx="4" fill="currentColor" fillOpacity="0.8" />
                                                <rect x="230" y="80" width="15" height="30" rx="4" fill="currentColor" fillOpacity="0.8" />
                                                <rect x="35" y="350" width="15" height="30" rx="4" fill="currentColor" fillOpacity="0.8" />
                                                <rect x="230" y="350" width="15" height="30" rx="4" fill="currentColor" fillOpacity="0.8" />

                                                {/* Labels */}
                                                <text x="140" y="30" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" letterSpacing="2">FRONT</text>
                                                <text x="140" y="480" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600" letterSpacing="2">REAR</text>
                                            </svg>
                                            <p className="text-center text-xs text-muted-foreground mt-2 font-medium">
                                                Interactive Diagram
                                            </p>
                                        </div>

                                        {/* Legend & Summary */}
                                        <div className="flex-1 space-y-6 w-full">
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { color: 'transparent', border: 'currentColor', label: 'Original', key: 'original' },
                                                    { color: '#F59E0B', border: '#F59E0B', label: 'Painted', key: 'painted' },
                                                    { color: '#EF4444', border: '#EF4444', label: 'Replaced', key: 'replaced' },
                                                    { color: '#F97316', border: '#F97316', label: 'Putty/Filler', key: 'putty' }
                                                ].map(item => (
                                                    <div key={item.key} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                                                        <div
                                                            className="w-4 h-4 rounded-full shadow-sm border"
                                                            style={{
                                                                background: item.color,
                                                                borderColor: item.border === 'currentColor' ? 'rgba(128,128,128,0.5)' : item.border
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium text-foreground/80">
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="bg-background/50 rounded-xl p-6 border border-border/50 shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Summary
                                                    </h4>
                                                    {Object.values(bodyParts).every(s => s === 'original') && (
                                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                                                            <Check className="w-3 h-3 mr-1" />
                                                            Clean Title
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2 min-h-[60px] content-start">
                                                    {Object.entries(bodyParts)
                                                        .filter(([_, status]) => status !== 'original')
                                                        .map(([part, status]) => (
                                                            <Badge
                                                                key={part}
                                                                variant="outline"
                                                                className="capitalize pl-2 pr-3 py-1"
                                                                style={{
                                                                    borderColor: paintColors[status],
                                                                    color: paintColors[status],
                                                                    backgroundColor: `${paintColors[status]}10`
                                                                }}
                                                            >
                                                                <span className="w-2 h-2 rounded-full mr-2" style={{ background: paintColors[status] }} />
                                                                {part.replace(/([A-Z])/g, ' $1').trim()}
                                                            </Badge>
                                                        ))
                                                    }
                                                    {Object.values(bodyParts).every(s => s === 'original') && (
                                                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground/50 text-sm italic">
                                                            No issues reported
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Technical Condition */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Gauge className="w-5 h-5 text-luxury" />
                                        Technical Condition
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { key: 'engine', label: 'Engine', icon: Cog },
                                        { key: 'gearbox', label: 'Gearbox', icon: Wrench },
                                        { key: 'suspension', label: 'Suspension', icon: Disc }
                                    ].map(item => (
                                        <div key={item.key} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50 gap-4 hover:border-luxury/30 transition-colors">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="p-2 bg-secondary rounded-lg">
                                                    <item.icon className="w-5 h-5 text-foreground" />
                                                </div>
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
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Camera className="w-5 h-5 text-luxury" />
                                        Photos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="aspect-[4/3] bg-background/50 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 hover:border-luxury/50 transition-all group">
                                                <Camera className="w-6 h-6 text-muted-foreground group-hover:text-luxury transition-colors mb-2" />
                                                <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">Photo {i}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tyres */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Disc className="w-5 h-5 text-luxury" />
                                        Tyres & Wheels
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input
                                            placeholder="e.g. Michelin"
                                            value={tyres.brand}
                                            onChange={(e) => setTyres({ ...tyres, brand: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Year</Label>
                                            <Input
                                                placeholder="e.g. 2022"
                                                value={tyres.year}
                                                onChange={(e) => setTyres({ ...tyres, year: e.target.value })}
                                                className="bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Condition</Label>
                                            <Input
                                                placeholder="e.g. 80%"
                                                value={tyres.condition}
                                                onChange={(e) => setTyres({ ...tyres, condition: e.target.value })}
                                                className="bg-background/50"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Info */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <FileText className="w-5 h-5 text-luxury" />
                                        Additional Info
                                    </CardTitle>
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
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-background to-secondary/20 border-b border-border/50">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Check className="w-5 h-5 text-luxury" />
                                Final Verdict
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setRatings({ ...ratings, verdict: 'bad' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] group",
                                        ratings.verdict === 'bad'
                                            ? "border-red-500 bg-red-500/10"
                                            : "border-border bg-background/50 hover:border-red-500/50"
                                    )}
                                >
                                    <X className={cn("w-10 h-10 mb-3 transition-colors", ratings.verdict === 'bad' ? "text-red-500" : "text-muted-foreground group-hover:text-red-500")} />
                                    <span className={cn("font-bold tracking-wide", ratings.verdict === 'bad' ? "text-red-500" : "text-muted-foreground")}>
                                        DON'T BUY
                                    </span>
                                </button>

                                <button
                                    onClick={() => setRatings({ ...ratings, verdict: 'warning' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] group",
                                        ratings.verdict === 'warning'
                                            ? "border-amber-500 bg-amber-500/10"
                                            : "border-border bg-background/50 hover:border-amber-500/50"
                                    )}
                                >
                                    <AlertTriangle className={cn("w-10 h-10 mb-3 transition-colors", ratings.verdict === 'warning' ? "text-amber-500" : "text-muted-foreground group-hover:text-amber-500")} />
                                    <span className={cn("font-bold tracking-wide", ratings.verdict === 'warning' ? "text-amber-500" : "text-muted-foreground")}>
                                        CONDITIONAL
                                    </span>
                                </button>

                                <button
                                    onClick={() => setRatings({ ...ratings, verdict: 'good' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] group",
                                        ratings.verdict === 'good'
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-border bg-background/50 hover:border-emerald-500/50"
                                    )}
                                >
                                    <Check className={cn("w-10 h-10 mb-3 transition-colors", ratings.verdict === 'good' ? "text-emerald-500" : "text-muted-foreground group-hover:text-emerald-500")} />
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
                        <p>CAR INSPECTION REPORT v2.1</p>
                        <p>{carInfo.brand && carInfo.model ? `${carInfo.brand} ${carInfo.model}` : 'No car selected'}</p>
                    </div>

                </div>
            </div>
        </TooltipProvider>
    );
};

export default CarInspectionReport;
