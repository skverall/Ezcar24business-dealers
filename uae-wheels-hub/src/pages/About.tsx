import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Shield, Star, Users, Phone, Mail, MapPin, Search, MessageSquare, CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

const About = () => {
  const [contactOpen, setContactOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const advantages = [
    {
      icon: Shield,
      title: "Verified Dealers",
      description: "Every dealer is rigorously vetted to guarantee authenticity and peace of mind."
    },
    {
      icon: Star,
      title: "Premium Selection",
      description: "Curated inventory of high-quality vehicles at competitive, transparent prices."
    },
    {
      icon: Check,
      title: "GCC Specs",
      description: "Specialized focus on GCC-compliant vehicles with verified service history."
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Dedicated automotive experts to support you through every step of the process."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-luxury/20">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-luxury/10 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxury/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-luxury/5 border border-luxury/10 text-luxury text-sm font-medium animate-fade-in">
              <Star className="w-4 h-4 fill-luxury" />
              <span>The UAE's Premier Car Marketplace</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              Redefining the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury via-luxury/80 to-primary animate-gradient">
                Car Buying Experience
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We connect discerning buyers with trusted dealers, making your journey to the perfect car effortless, transparent, and secure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/browse">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/25 transition-all hover:scale-105">
                  Browse Inventory
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50 transition-all hover:scale-105">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground/50">
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { number: "500+", label: "Verified Dealers" },
              { number: "10k+", label: "Premium Cars" },
              { number: "50k+", label: "Happy Clients" },
              { number: "7", label: "Emirates Covered" }
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 group-hover:text-luxury transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-sm md:text-base text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Driven by Trust, <br />
                <span className="text-luxury">Fueled by Passion</span>
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  At EZCAR24, we're not just a marketplace; we're your partner in the automotive journey. We recognized a gap in the market for a platform that prioritizes transparency and quality above all else.
                </p>
                <p>
                  Our mission is simple yet ambitious: to revolutionize how people buy cars in the UAE. By strictly vetting every dealer and verifying every listing, we eliminate the uncertainty, leaving you with only the excitement of finding your dream car.
                </p>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Join thousands</p>
                    <p className="text-sm text-muted-foreground">of satisfied car owners</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-luxury/5 to-primary/5 border border-white/10 shadow-2xl relative group">
                <img
                  src="/images/trust-shield.png"
                  alt="Trust and Verification"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Decorative elements */}
                <div className="absolute top-10 right-10 p-6 bg-background/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 animate-float">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="font-semibold text-foreground">100% Verified</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All dealers vetted</p>
                </div>

                <div className="absolute bottom-10 left-10 p-6 bg-background/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 animate-float [animation-delay:2s]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-luxury/10 rounded-full">
                      <Star className="w-5 h-5 text-luxury" />
                    </div>
                    <span className="font-semibold text-foreground">Top Rated</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Customer favorite</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose EZCAR24?</h2>
            <p className="text-lg text-muted-foreground">
              We've built a platform that puts your needs first, offering unmatched value and security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, index) => (
              <Card key={index} className="group relative overflow-hidden border-none bg-background/50 hover:bg-background transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-luxury/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-luxury/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <advantage.icon className="w-7 h-7 text-luxury" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{advantage.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Seamless Experience</h2>
            <p className="text-muted-foreground">Your path to the perfect car in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-luxury/20 to-transparent" />

            {[
              { icon: Search, title: 'Discover', desc: 'Browse thousands of verified listings.' },
              { icon: MessageSquare, title: 'Connect', desc: 'Chat directly with trusted dealers.' },
              { icon: CheckCircle, title: 'Drive', desc: 'Secure your dream car with confidence.' }
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-24 h-24 mx-auto bg-background rounded-full border-4 border-muted group-hover:border-luxury/30 transition-colors duration-300 flex items-center justify-center mb-6 relative z-10 shadow-lg">
                  <step.icon className="w-10 h-10 text-luxury" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-luxury text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Find Your Dream Car?</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
            Join thousands of satisfied customers who found their perfect vehicle through EZCAR24.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button size="lg" className="h-14 px-10 bg-white text-luxury hover:bg-white/90 text-lg rounded-full shadow-xl hover:scale-105 transition-transform">
                Start Browsing
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="h-14 px-10 border-2 border-white text-white hover:bg-white hover:text-luxury text-lg rounded-full hover:scale-105 transition-transform bg-transparent backdrop-blur-sm">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Contact Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className={`flex flex-col gap-3 items-end transition-all duration-300 ${contactOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <a href="tel:+971545293233" className="flex items-center gap-3 px-5 py-3 bg-background/90 backdrop-blur border border-border rounded-full shadow-lg hover:bg-muted transition-colors">
            <span className="font-medium text-sm">Call Support</span>
            <div className="w-8 h-8 rounded-full bg-luxury/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-luxury" />
            </div>
          </a>
          <a href="mailto:info@ezcar24.com" className="flex items-center gap-3 px-5 py-3 bg-background/90 backdrop-blur border border-border rounded-full shadow-lg hover:bg-muted transition-colors">
            <span className="font-medium text-sm">Email Us</span>
            <div className="w-8 h-8 rounded-full bg-luxury/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-luxury" />
            </div>
          </a>
        </div>

        <button
          onClick={() => setContactOpen(!contactOpen)}
          className={`mt-4 w-16 h-16 rounded-full bg-luxury text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${contactOpen ? 'rotate-45' : ''}`}
        >
          {contactOpen ? <Check className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default About;