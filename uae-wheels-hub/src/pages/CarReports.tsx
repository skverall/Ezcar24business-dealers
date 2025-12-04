
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarInspectionReport from "@/components/CarInspectionReport";

const CarReports = () => {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const reportId = params.get('id') || undefined;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow pt-24 pb-12 px-4 bg-[#0A0A0A]">
                <CarInspectionReport reportId={reportId} />
            </main>
            <Footer />
        </div>
    );
};

export default CarReports;
