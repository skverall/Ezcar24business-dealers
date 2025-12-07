import { useEffect, useRef, useCallback } from 'react';

const DRAFT_KEY = 'car_inspection_draft';
const DEBOUNCE_MS = 1000; // Save after 1 second of no changes

export interface DraftData {
    carInfo: any;
    overallCondition: string;
    summary: string;
    bodyParts: Record<string, string>;
    mechanicalStatus: any;
    tiresStatus: any;
    interiorStatus: any;
    serviceHistory: any[];
    inspectorName: string;
    contactEmail: string;
    contactPhone: string;
    savedAt: number;
}

export function useLocalDraft(reportId: string | undefined) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get the storage key - different for each report or 'new' for new reports
    const getStorageKey = useCallback(() => {
        return reportId ? `${DRAFT_KEY}_${reportId}` : `${DRAFT_KEY}_new`;
    }, [reportId]);

    // Load draft from localStorage
    const loadDraft = useCallback((): DraftData | null => {
        try {
            const key = getStorageKey();
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const data = JSON.parse(stored) as DraftData;

            // Check if draft is older than 7 days
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (data.savedAt < sevenDaysAgo) {
                localStorage.removeItem(key);
                return null;
            }

            return data;
        } catch (e) {
            console.error('Error loading draft:', e);
            return null;
        }
    }, [getStorageKey]);

    // Save draft to localStorage (debounced)
    const saveDraft = useCallback((data: Omit<DraftData, 'savedAt'>) => {
        // Clear any pending save
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            try {
                const key = getStorageKey();
                const draftData: DraftData = {
                    ...data,
                    savedAt: Date.now(),
                };
                localStorage.setItem(key, JSON.stringify(draftData));
                console.log('Draft auto-saved');
            } catch (e) {
                console.error('Error saving draft:', e);
            }
        }, DEBOUNCE_MS);
    }, [getStorageKey]);

    // Clear draft from localStorage
    const clearDraft = useCallback(() => {
        try {
            const key = getStorageKey();
            localStorage.removeItem(key);
            console.log('Draft cleared');
        } catch (e) {
            console.error('Error clearing draft:', e);
        }
    }, [getStorageKey]);

    // Clear the new report draft when switching to an existing report
    const clearNewReportDraft = useCallback(() => {
        try {
            localStorage.removeItem(`${DRAFT_KEY}_new`);
        } catch (e) {
            console.error('Error clearing new report draft:', e);
        }
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        loadDraft,
        saveDraft,
        clearDraft,
        clearNewReportDraft,
    };
}
