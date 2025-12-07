import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

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
    const [open, setOpen] = React.useState(false);
    const [countryCode, setCountryCode] = React.useState('+971');
    const [phoneNumber, setPhoneNumber] = React.useState('');

    React.useEffect(() => {
        if (!value) {
            setPhoneNumber('');
            return;
        }

        const matchedCode = COUNTRY_CODES.find(c => value.startsWith(c.code));
        if (matchedCode) {
            setCountryCode(matchedCode.code);
            setPhoneNumber(value.slice(matchedCode.code.length).trim());
        } else {
            if (value.startsWith('05')) {
                setCountryCode('+971');
                setPhoneNumber(value.substring(1));
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value]);

    const handleCodeSelect = (newCode: string) => {
        setCountryCode(newCode);
        setOpen(false);
        triggerChange(newCode, phoneNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d\s]/g, '');
        setPhoneNumber(raw);
        triggerChange(countryCode, raw);
    };

    const triggerChange = (code: string, number: string) => {
        const cleanNumber = number.replace(/\s/g, '');
        if (!cleanNumber) {
            onChange('');
            return;
        }
        onChange(`${code}${cleanNumber}`);
    };

    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

    return (
        <div className={cn("flex gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        type="button"
                        className="w-[140px] justify-between bg-background font-medium px-3"
                    >
                        {selectedCountry ? (
                            <span className="flex items-center gap-2 truncate">
                                <span className="font-bold text-xs">{selectedCountry.country}</span>
                                <span className="text-muted-foreground">{selectedCountry.code}</span>
                            </span>
                        ) : (
                            "Code"
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[140px] p-0" align="start">
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                {COUNTRY_CODES.map((item) => (
                                    <CommandItem
                                        key={item.code}
                                        value={item.code + " " + item.country} // Searchable value
                                        onSelect={() => handleCodeSelect(item.code)}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-1 h-3 w-3",
                                                countryCode === item.code ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="font-bold text-xs w-8">{item.country}</span>
                                        <span className="text-muted-foreground">{item.code}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
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
