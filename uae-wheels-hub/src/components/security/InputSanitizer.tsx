import DOMPurify from 'dompurify';

interface InputSanitizerProps {
  children: string;
  allowedTags?: string[];
}

export const InputSanitizer = ({ children, allowedTags = [] }: InputSanitizerProps) => {
  const sanitized = DOMPurify.sanitize(children, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: []
  });

  return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  },
  
  phone: (phone: string): boolean => {
    // Remove all spaces and non-numeric characters except +
    const cleaned = phone.replace(/\s/g, '');

    // UAE phone number formats:
    // +971XXXXXXXXX (9 digits after +971)
    // 971XXXXXXXXX (9 digits after 971)
    // 05XXXXXXXX (8 digits after 05)
    // 5XXXXXXXX (8 digits after 5)

    // Check for +971 format (should have 9 digits after +971)
    if (cleaned.startsWith('+971')) {
      const digits = cleaned.slice(4);
      return /^[0-9]{9}$/.test(digits);
    }

    // Check for 971 format (should have 9 digits after 971)
    if (cleaned.startsWith('971')) {
      const digits = cleaned.slice(3);
      return /^[0-9]{9}$/.test(digits);
    }

    // Check for 05 format (should have 8 digits after 05)
    if (cleaned.startsWith('05')) {
      const digits = cleaned.slice(2);
      return /^[0-9]{8}$/.test(digits);
    }

    // Check for 5 format (should have 8 digits after 5)
    if (cleaned.startsWith('5')) {
      const digits = cleaned.slice(1);
      return /^[0-9]{8}$/.test(digits);
    }

    // For international numbers, use a more flexible regex
    const internationalRegex = /^\+?[1-9]\d{7,14}$/;
    return internationalRegex.test(cleaned);
  },
  
  name: (name: string): boolean => {
    return name.length >= 2 && name.length <= 100;
  },
  
  title: (title: string): boolean => {
    return title.length >= 3 && title.length <= 100;
  },
  
  price: (price: number): boolean => {
    return price > 0 && price < 10000000;
  },
  
  year: (year: number): boolean => {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 1;
  }
};