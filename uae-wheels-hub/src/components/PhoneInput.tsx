import React from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

const COUNTRY_CODES = [
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'KSA' },
    { code: '+973', country: 'BH' },
    { code: '+965', country: 'KW' },
    { code: '+968', country: 'OM' },
    { code: '+974', country: 'QA' },
];

export default function PhoneInput({ value, onChange, className, placeholder = "50 123 4567" }: PhoneInputProps) {
    // Split value into code and number if possible, default to UAE
    const [countryCode, setCountryCode] = React.useState('+971');
    const [phoneNumber, setPhoneNumber] = React.useState('');

    React.useEffect(() => {
        if (!value) {
            setPhoneNumber('');
            return;
        }

        // Try to find matching country code
        const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code));
        if (matchedCode) {
            setCountryCode(matchedCode.code);
            setPhoneNumber(value.slice(matchedCode.code.length).trim());
        } else {
            // If no match (or just a number), assume it belongs to current countryCode or is raw
            // If it starts with 05... it's likely UAE local format without code
            if (value.startsWith('05')) {
                setCountryCode('+971');
                setPhoneNumber(value.substring(1)); // remove leading 0
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value]);

    const handleCodeChange = (newCode: string) => {
        setCountryCode(newCode);
        triggerChange(newCode, phoneNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d\s]/g, '');
        setPhoneNumber(raw);
        triggerChange(countryCode, raw);
    };

    const triggerChange = (code: string, number: string) => {
        // Clean the number for storage
        const cleanNumber = number.replace(/\s/g, '');
        if (!cleanNumber) {
            onChange('');
            return;
        }
        onChange(`${code}${cleanNumber}`);
    };

    return (
        <div className={cn("flex gap-2", className)}>
            <Select value={countryCode} onValueChange={handleCodeChange}>
                <SelectTrigger className="w-[100px] bg-background font-medium">
                    <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                    {COUNTRY_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                            <span className="flex items-center gap-2">
                                <span className="font-bold text-xs w-8">{item.country}</span>
                                <span className="text-muted-foreground">{item.code}</span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                value={phoneNumber}
                onChange={handleNumberChange}
                placeholder={placeholder}
                className="flex-1 bg-background font-mono"
            />
        </div>
    );
}
