import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const SearchBar = ({ isOpen, onToggle, onClose }: SearchBarProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (query.trim()) {
            const params = new URLSearchParams();
            params.set('query', query.trim());
            navigate(`/browse?${params.toString()}`);
            onClose();
            setQuery("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
            setQuery("");
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex hover:bg-luxury/10 hover:text-luxury transition-colors"
                onClick={onToggle}
                aria-label={t('nav.search')}
            >
                <Search className="h-5 w-5" />
            </Button>

            {/* Expandable Search Overlay */}
            <div
                className={cn(
                    "absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg z-40 transition-all duration-300 origin-top",
                    isOpen ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 xl:px-8 py-6">
                    <div className="flex items-center gap-4 max-w-3xl mx-auto">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-luxury transition-colors" />
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('search.placeholder')}
                                className="pl-12 h-14 text-lg bg-secondary/50 border-transparent focus:border-luxury/30 focus:bg-background transition-all rounded-xl shadow-inner"
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="h-14 px-8 rounded-xl bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {t('search.button')}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="icon"
                            className="h-14 w-14 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                    {query && (
                        <div className="mt-4 text-center text-sm text-muted-foreground animate-fade-in">
                            Press <kbd className="px-2 py-1 bg-secondary rounded text-xs mx-1">Enter</kbd> to search
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchBar;
