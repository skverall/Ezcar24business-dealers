
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const VinCheck = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        whatsapp: "",
        vin: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('vin_checks')
                .insert([formData]);

            if (error) throw error;

            toast({
                title: "Request Sent",
                description: "We will get back to you shortly with the report.",
            });
            setFormData({ name: "", whatsapp: "", vin: "" });
        } catch (error) {
            console.error('Error submitting VIN check:', error);
            toast({
                title: "Error",
                description: "Failed to send request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">VIN Check</h1>
                        <p className="text-muted-foreground mt-2">Enter your details to get a detailed car report.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl shadow-sm border">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                            <Input
                                id="whatsapp"
                                required
                                value={formData.whatsapp}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                placeholder="+971 50 000 0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vin">VIN</Label>
                            <Input
                                id="vin"
                                required
                                value={formData.vin}
                                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                                placeholder="Vehicle Identification Number"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-luxury hover:bg-luxury/90 text-luxury-foreground" disabled={loading}>
                            {loading ? "Sending..." : "Send Request"}
                        </Button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VinCheck;
