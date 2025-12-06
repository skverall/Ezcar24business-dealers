
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import CarInspectionReport from "@/components/CarInspectionReport";

const CarReports = () => {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const reportId = params.get('id') || undefined;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow pt-24 pb-12 px-4 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto mb-4 flex justify-end">
                    <a href="/my-reports" className="text-sm text-luxury hover:underline flex items-center gap-1">
                        View My Reports &rarr;
                    </a>
                </div>
                <CarInspectionReport reportId={reportId} />
            </main>
        </div>
    );
};

export default CarReports;
