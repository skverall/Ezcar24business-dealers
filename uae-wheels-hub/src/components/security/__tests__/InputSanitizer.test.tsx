import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InputSanitizer, sanitizeText, validateInput } from '../InputSanitizer';

describe('InputSanitizer Component', () => {
  it('renders sanitized text', () => {
    render(<InputSanitizer>Hello World</InputSanitizer>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('removes script tags from text', () => {
    const maliciousContent = '<script>alert("xss")</script>Hello';
    render(<InputSanitizer>{maliciousContent}</InputSanitizer>);

    // Script tag should be removed
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('removes dangerous HTML attributes', () => {
    const maliciousContent = '<img src="x" onerror="alert(1)">Text';
    const { container } = render(<InputSanitizer>{maliciousContent}</InputSanitizer>);

    // Should not have onerror attribute (undefined means attribute doesn't exist)
    const img = container.querySelector('img');
    expect(img?.getAttribute('onerror')).toBeFalsy();
  });

  it('respects allowedTags prop', () => {
    const content = '<b>Bold</b> <script>alert(1)</script>';
    const { container } = render(
      <InputSanitizer allowedTags={['b']}>{content}</InputSanitizer>
    );

    // Bold tag should be preserved
    expect(container.querySelector('b')).toBeInTheDocument();
    // Script tag should be removed
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });
});

describe('sanitizeText', () => {
  it('returns plain text without HTML', () => {
    const result = sanitizeText('Hello World');
    expect(result).toBe('Hello World');
  });

  it('removes all HTML tags', () => {
    const result = sanitizeText('<b>Bold</b> <i>Italic</i> Text');
    expect(result).toBe('Bold Italic Text');
  });

  it('removes script tags', () => {
    const result = sanitizeText('<script>alert("xss")</script>Safe text');
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toBe('Safe text');
  });

  it('removes dangerous HTML', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const result = sanitizeText(malicious);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('handles empty string', () => {
    const result = sanitizeText('');
    expect(result).toBe('');
  });

  it('handles special characters', () => {
    const result = sanitizeText('Test & <test> "quotes"');
    expect(result).toContain('Test');
    expect(result).toContain('&');
    expect(result).toContain('"quotes"');
  });
});

describe('validateInput.email', () => {
  it('validates correct email addresses', () => {
    expect(validateInput.email('user@example.com')).toBe(true);
    expect(validateInput.email('test.user@domain.co')).toBe(true);
    expect(validateInput.email('user+tag@example.org')).toBe(true);
    expect(validateInput.email('user123@test-domain.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateInput.email('invalid')).toBe(false);
    expect(validateInput.email('no@domain')).toBe(false);
    expect(validateInput.email('@nodomain.com')).toBe(false);
    expect(validateInput.email('user@')).toBe(false);
    expect(validateInput.email('user@.com')).toBe(false);
    expect(validateInput.email('')).toBe(false);
    expect(validateInput.email('user name@example.com')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(validateInput.email('a@b.co')).toBe(true);
    expect(validateInput.email('user@sub.domain.com')).toBe(true);
  });
});

describe('validateInput.phone', () => {
  describe('UAE phone formats', () => {
    it('validates +971 format', () => {
      expect(validateInput.phone('+971501234567')).toBe(true);
      expect(validateInput.phone('+971521234567')).toBe(true);
    });

    it('validates 971 format without plus', () => {
      expect(validateInput.phone('971501234567')).toBe(true);
    });

    it('validates 05 format', () => {
      expect(validateInput.phone('0501234567')).toBe(true);
      expect(validateInput.phone('0521234567')).toBe(true);
    });

    it('validates 5 format', () => {
      expect(validateInput.phone('501234567')).toBe(true);
    });

    it('handles phone numbers with spaces', () => {
      expect(validateInput.phone('+971 50 123 4567')).toBe(true);
      expect(validateInput.phone('050 123 4567')).toBe(true);
    });
  });

  describe('International formats', () => {
    it('validates international phone numbers', () => {
      expect(validateInput.phone('+12125551234')).toBe(true); // US
      expect(validateInput.phone('+442071234567')).toBe(true); // UK
    });
  });

  describe('Invalid phone numbers', () => {
    it('rejects too short numbers', () => {
      expect(validateInput.phone('123')).toBe(false);
      expect(validateInput.phone('+97150')).toBe(false);
    });

    it('rejects too long numbers', () => {
      expect(validateInput.phone('+971501234567890')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateInput.phone('')).toBe(false);
    });

    it('rejects alphabetic characters', () => {
      expect(validateInput.phone('abc123')).toBe(false);
    });
  });
});

describe('validateInput.name', () => {
  it('validates correct names', () => {
    expect(validateInput.name('John')).toBe(true);
    expect(validateInput.name('John Doe')).toBe(true);
    expect(validateInput.name('Mary-Jane')).toBe(true);
    expect(validateInput.name('Al')).toBe(true); // Minimum 2 chars
  });

  it('rejects names that are too short', () => {
    expect(validateInput.name('A')).toBe(false);
    expect(validateInput.name('')).toBe(false);
  });

  it('rejects names that are too long', () => {
    const longName = 'A'.repeat(101);
    expect(validateInput.name(longName)).toBe(false);
  });

  it('validates names at boundary limits', () => {
    expect(validateInput.name('Ab')).toBe(true); // Exactly 2 chars
    expect(validateInput.name('A'.repeat(100))).toBe(true); // Exactly 100 chars
  });
});

describe('validateInput.title', () => {
  it('validates correct titles', () => {
    expect(validateInput.title('Car')).toBe(true);
    expect(validateInput.title('2020 Toyota Camry')).toBe(true);
    expect(validateInput.title('BMW X5 M Sport')).toBe(true);
  });

  it('rejects titles that are too short', () => {
    expect(validateInput.title('AB')).toBe(false);
    expect(validateInput.title('A')).toBe(false);
    expect(validateInput.title('')).toBe(false);
  });

  it('rejects titles that are too long', () => {
    const longTitle = 'A'.repeat(101);
    expect(validateInput.title(longTitle)).toBe(false);
  });

  it('validates titles at boundary limits', () => {
    expect(validateInput.title('ABC')).toBe(true); // Exactly 3 chars
    expect(validateInput.title('A'.repeat(100))).toBe(true); // Exactly 100 chars
  });
});

describe('validateInput.price', () => {
  it('validates correct prices', () => {
    expect(validateInput.price(50000)).toBe(true);
    expect(validateInput.price(1)).toBe(true);
    expect(validateInput.price(9999999)).toBe(true);
  });

  it('rejects negative prices', () => {
    expect(validateInput.price(-1)).toBe(false);
    expect(validateInput.price(-1000)).toBe(false);
  });

  it('rejects zero price', () => {
    expect(validateInput.price(0)).toBe(false);
  });

  it('rejects prices over limit', () => {
    expect(validateInput.price(10000000)).toBe(false);
    expect(validateInput.price(20000000)).toBe(false);
  });

  it('validates prices at boundary limits', () => {
    expect(validateInput.price(1)).toBe(true); // Minimum
    expect(validateInput.price(9999999)).toBe(true); // Maximum
  });

  it('handles decimal prices', () => {
    expect(validateInput.price(50000.50)).toBe(true);
    expect(validateInput.price(0.5)).toBe(true);
  });
});

describe('validateInput.year', () => {
  const currentYear = new Date().getFullYear();

  it('validates current year', () => {
    expect(validateInput.year(currentYear)).toBe(true);
  });

  it('validates next year (for pre-orders)', () => {
    expect(validateInput.year(currentYear + 1)).toBe(true);
  });

  it('validates past years', () => {
    expect(validateInput.year(2020)).toBe(true);
    expect(validateInput.year(2000)).toBe(true);
    expect(validateInput.year(1990)).toBe(true);
    expect(validateInput.year(1900)).toBe(true);
  });

  it('rejects years too far in future', () => {
    expect(validateInput.year(currentYear + 2)).toBe(false);
    expect(validateInput.year(currentYear + 10)).toBe(false);
  });

  it('rejects years before 1900', () => {
    expect(validateInput.year(1899)).toBe(false);
    expect(validateInput.year(1800)).toBe(false);
  });

  it('validates years at boundary limits', () => {
    expect(validateInput.year(1900)).toBe(true); // Minimum
    expect(validateInput.year(currentYear + 1)).toBe(true); // Maximum
  });
});
