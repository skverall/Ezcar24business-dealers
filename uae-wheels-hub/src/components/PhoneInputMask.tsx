import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputMaskProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function PhoneInputMask({ value, onChange, ...rest }: PhoneInputMaskProps) {
  const format = (val: string) => {
    // Remove all non-numeric characters except +
    const cleaned = val.replace(/[^\d+]/g, '');

    // If starts with +971, format as +971 XX XXX XXXX
    if (cleaned.startsWith('+971')) {
      const number = cleaned.slice(4);
      if (number.length === 0) return '+971 ';
      if (number.length <= 2) return `+971 ${number}`;
      if (number.length <= 5) return `+971 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    }

    // If starts with 971, format as +971 XX XXX XXXX (auto-add +)
    if (cleaned.startsWith('971')) {
      const number = cleaned.slice(3);
      if (number.length === 0) return '+971 ';
      if (number.length <= 2) return `+971 ${number}`;
      if (number.length <= 5) return `+971 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    }

    // If starts with 05 or 5, format as 05X XXX XXXX
    if (cleaned.startsWith('05') || cleaned.startsWith('5')) {
      const number = cleaned.startsWith('05') ? cleaned : '0' + cleaned;
      if (number.length <= 3) return number;
      if (number.length <= 6) return `${number.slice(0, 3)} ${number.slice(3)}`;
      return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 10)}`;
    }

    // If user starts typing digits (not starting with 0), assume UAE format and add +971
    if (cleaned.length > 0 && !cleaned.startsWith('+') && !cleaned.startsWith('0') && !cleaned.startsWith('971')) {
      return format('+971' + cleaned);
    }

    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(format(raw));
  };

  return <Input {...rest} value={value} onChange={handleChange} placeholder="+971 5x xxx xxxx" />;
}

