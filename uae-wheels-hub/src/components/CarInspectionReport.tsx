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
        original: 'transparent',
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
                                    <div className="flex flex-col xl:flex-row gap-12 items-center xl:items-start justify-center">
                                        {/* Detailed Car SVG */}
                                        <div className="relative w-[300px] h-[580px] bg-background/30 rounded-3xl p-6 border border-border/30 shadow-inner flex-shrink-0">
                                            <svg viewBox="0 0 300 580" className="w-full h-full drop-shadow-lg">
                                                <defs>
                                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                    </filter>
                                                </defs>

                                                {/* Wheels (Visual Context) */}
                                                <rect x="20" y="100" width="20" height="40" rx="4" fill="#333" />
                                                <rect x="260" y="100" width="20" height="40" rx="4" fill="#333" />
                                                <rect x="20" y="420" width="20" height="40" rx="4" fill="#333" />
                                                <rect x="260" y="420" width="20" height="40" rx="4" fill="#333" />

                                                {/* Front Bumper */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M50,40 Q150,20 250,40 L255,70 Q150,80 45,70 Z"
                                                            fill={bodyParts.frontBumper === 'original' ? 'transparent' : paintColors[bodyParts.frontBumper]}
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
                                                        <path d="M55,75 L245,75 L240,180 Q150,170 60,180 Z"
                                                            fill={bodyParts.hood === 'original' ? 'transparent' : paintColors[bodyParts.hood]}
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
                                                        <path d="M40,75 L50,75 L55,180 L40,180 Z"
                                                            fill={bodyParts.frontLeftFender === 'original' ? 'transparent' : paintColors[bodyParts.frontLeftFender]}
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
                                                        <path d="M260,75 L250,75 L245,180 L260,180 Z"
                                                            fill={bodyParts.frontRightFender === 'original' ? 'transparent' : paintColors[bodyParts.frontRightFender]}
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

                                                {/* Windshield (Visual Only) */}
                                                <path d="M65,185 Q150,175 235,185 L230,220 Q150,215 70,220 Z"
                                                    fill="#87CEEB" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />

                                                {/* Roof */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M70,225 L230,225 L230,340 L70,340 Z"
                                                            fill={bodyParts.roof === 'original' ? 'transparent' : paintColors[bodyParts.roof]}
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

                                                {/* Rear Window (Visual Only) */}
                                                <path d="M70,345 L230,345 L225,380 Q150,390 75,380 Z"
                                                    fill="#87CEEB" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />

                                                {/* Front Left Door */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <path d="M40,185 L60,185 L60,280 L40,280 Z"
                                                            fill={bodyParts.frontLeftDoor === 'original' ? 'transparent' : paintColors[bodyParts.frontLeftDoor]}
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
                                                        <path d="M260,185 L240,185 L240,280 L260,280 Z"
                                                            fill={bodyParts.frontRightDoor === 'original' ? 'transparent' : paintColors[bodyParts.frontRightDoor]}
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
                                                        <path d="M40,285 L60,285 L60,380 L40,380 Z"
                                                            fill={bodyParts.rearLeftDoor === 'original' ? 'transparent' : paintColors[bodyParts.rearLeftDoor]}
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
                                                        <path d="M260,285 L240,285 L240,380 L260,380 Z"
                                                            fill={bodyParts.rearRightDoor === 'original' ? 'transparent' : paintColors[bodyParts.rearRightDoor]}
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
                                                        <path d="M65,385 Q150,395 235,385 L240,480 Q150,490 60,480 Z"
                                                            fill={bodyParts.trunk === 'original' ? 'transparent' : paintColors[bodyParts.trunk]}
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
                                                        <path d="M40,385 L60,385 L55,480 L45,480 Z"
                                                            fill={bodyParts.rearLeftFender === 'original' ? 'transparent' : paintColors[bodyParts.rearLeftFender]}
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
                                                        <path d="M260,385 L240,385 L245,480 L255,480 Z"
                                                            fill={bodyParts.rearRightFender === 'original' ? 'transparent' : paintColors[bodyParts.rearRightFender]}
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
                                                        <path d="M50,485 Q150,495 250,485 L245,515 Q150,525 55,515 Z"
                                                            fill={bodyParts.rearBumper === 'original' ? 'transparent' : paintColors[bodyParts.rearBumper]}
                                                            stroke="currentColor" strokeWidth="1.5"
                                                            className="cursor-pointer hover:fill-luxury/20 transition-all"
                                                            onClick={() => {
                                                                const states: ('original' | 'painted' | 'replaced' | 'putty')[] = ['original', 'painted', 'replaced', 'putty'];
                                                                const currentIndex = states.indexOf(bodyParts.rearBumper);
                                                                setBodyParts({ ...bodyParts, rearBumper: states[(currentIndex + 1) % 4] });
                                                            }}
                                                        />
                                                        <TooltipContent>Rear Bumper: {bodyParts.rearBumper}</TooltipContent>
                                                </Tooltip>

                                                {/* Headlights (Front) */}
                                                <path d="M45,55 Q55,65 65,55 L60,45 Q50,40 45,55 Z" fill="#FCD34D" fillOpacity="0.9" stroke="#F59E0B" strokeWidth="1" />
                                                <path d="M255,55 Q245,65 235,55 L240,45 Q250,40 255,55 Z" fill="#FCD34D" fillOpacity="0.9" stroke="#F59E0B" strokeWidth="1" />

                                                {/* Taillights (Rear) */}
                                                <path d="M50,495 Q60,485 70,495 L65,505 Q55,510 50,495 Z" fill="#EF4444" fillOpacity="0.9" stroke="#B91C1C" strokeWidth="1" />
                                                <path d="M250,495 Q240,485 230,495 L235,505 Q245,510 250,495 Z" fill="#EF4444" fillOpacity="0.9" stroke="#B91C1C" strokeWidth="1" />

                                                {/* Labels */}
                                                <text x="150" y="30" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600" letterSpacing="2">FRONT</text>
                                                <text x="150" y="550" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600" letterSpacing="2">REAR</text>
                                            </svg>
                                            <p className="text-center text-xs text-muted-foreground mt-2 font-medium">
                                                Interactive Diagram
                                            </p>
                                        </div>

                                        {/* Legend & Summary */}
                                        <div className="flex-1 space-y-8 w-full">
                                            {/* Legend */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { color: 'transparent', border: 'currentColor', label: 'Original', key: 'original' },
                                                    { color: '#F59E0B', border: '#F59E0B', label: 'Painted', key: 'painted' },
                                                    { color: '#EF4444', border: '#EF4444', label: 'Replaced', key: 'replaced' },
                                                    { color: '#F97316', border: '#F97316', label: 'Putty/Filler', key: 'putty' }
                                                ].map(item => (
                                                    <div key={item.key} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                                                        <div
                                                            className="w-5 h-5 rounded-full shadow-sm border-2"
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

                                            {/* Structured Summary */}
                                            <div className="bg-background/50 rounded-xl p-6 border border-border/50 shadow-sm space-y-6">
                                                <h4 className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                                                    <FileText className="w-4 h-4" />
                                                    Condition Summary
                                                </h4>

                                                {Object.values(bodyParts).every(s => s === 'original') ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                            <Check className="w-6 h-6 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-emerald-500">Clean Title</p>
                                                            <p className="text-sm text-muted-foreground">All body parts are original</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Replaced Parts Group */}
                                                        {Object.entries(bodyParts).some(([_, status]) => status === 'replaced') && (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Replaced Parts</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(bodyParts)
                                                                        .filter(([_, status]) => status === 'replaced')
                                                                        .map(([part, _]) => (
                                                                            <Badge key={part} variant="outline" className="border-red-500 text-red-500 bg-red-500/5">
                                                                                {part.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </Badge>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Painted Parts Group */}
                                                        {Object.entries(bodyParts).some(([_, status]) => status === 'painted') && (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Painted Parts</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(bodyParts)
                                                                        .filter(([_, status]) => status === 'painted')
                                                                        .map(([part, _]) => (
                                                                            <Badge key={part} variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/5">
                                                                                {part.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </Badge>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Putty Parts Group */}
                                                        {Object.entries(bodyParts).some(([_, status]) => status === 'putty') && (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Putty/Filler</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(bodyParts)
                                                                        .filter(([_, status]) => status === 'putty')
                                                                        .map(([part, _]) => (
                                                                            <Badge key={part} variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/5">
                                                                                {part.replace(/([A-Z])/g, ' $1').trim()}
                                                                            </Badge>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                        <p>CAR INSPECTION REPORT v2.2</p>
                        <p>{carInfo.brand && carInfo.model ? `${carInfo.brand} ${carInfo.model}` : 'No car selected'}</p>
                    </div>

                </div>
            </div>
        </TooltipProvider>
    );
};

export default CarInspectionReport;
