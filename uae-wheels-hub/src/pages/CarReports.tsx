
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CarReports = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                        Car Reports
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Soon you will see detailed car reports from Ezcar24.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CarReports;
