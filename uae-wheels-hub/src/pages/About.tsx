import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Shield, Star, Users, Phone, Mail, MapPin, Search, MessageSquare, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

const About = () => {
  const advantages = [
    {
      icon: Shield,
      title: "Verified Dealers",
      description: "All our dealers are thoroughly vetted and certified to ensure quality and reliability."
    },
    {
      icon: Star,
      title: "Best Prices",
      description: "Competitive pricing across all vehicle categories with transparent no-hidden-fees policy."
    },
    {
      icon: Check,
      title: "GCC Cars",
      description: "Specializing in Gulf Cooperation Council vehicles with verified documentation and history."
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Dedicated customer support team to guide you through every step of your car buying journey."
    }
  ];

  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-luxury rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              About <span className="gradient-text">EZCAR24</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
              Your trusted partner in finding the perfect car across the UAE. We connect verified dealers with car buyers through our innovative platform.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-luxury to-luxury/50 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-foreground mb-8">
              Our <span className="text-luxury">Mission</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              At EZCAR24, we revolutionize the car buying experience by providing a seamless, transparent, and reliable platform that connects buyers with verified dealers across the UAE. Our mission is to make car shopping effortless, ensuring every customer finds their perfect vehicle with confidence and peace of mind.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe in transparency, quality, and exceptional customer service. Every dealer on our platform is carefully vetted, every car listing is verified, and every transaction is supported by our dedicated team.
            </p>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Why Choose <span className="text-luxury">EZCAR24</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We provide unmatched value and service in the UAE automotive market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {advantages.map((advantage, index) => (
              <Card key={index} className="glass-effect border-luxury/10 hover:border-luxury/30 transition-all duration-300 hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-luxury/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <advantage.icon className="h-8 w-8 text-luxury" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {advantage.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to get you into your next car with confidence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[{
                icon: Search,
                title: 'Browse',
                desc: 'Explore thousands of verified listings from trusted dealers across the UAE.'
              }, {
                icon: MessageSquare,
                title: 'Connect',
                desc: 'Chat or call dealers directly to ask questions and negotiate.'
              }, {
                icon: CheckCircle,
                title: 'Buy',
                desc: 'Seal the deal with confidence—transparent listings and dedicated support.'
              }].map((step, i) => (
                <Card key={i} className="glass-effect border-luxury/10 hover:border-luxury/30 transition-all duration-300 hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-luxury/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <step.icon className="h-7 w-7 text-luxury" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "500+", label: "Verified Dealers" },
              { number: "10,000+", label: "Cars Available" },
              { number: "50,000+", label: "Happy Customers" },
              { number: "7", label: "Emirates Covered" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-luxury mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              Get in <span className="text-luxury">Touch</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions? We're here to help you find your perfect car
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {[
              {
                icon: Phone,
                title: "Call Us",
                content: "+971545293233",
                description: "Available 24/7 for support",
                href: "tel:+971545293233"
              },
              {
                icon: Mail,
                title: "Email Us",
                content: "info@ezcar24.com",
                description: "We'll respond within 2 hours",
                href: "mailto:info@ezcar24.com"
              },
              {
                icon: MapPin,
                title: "Visit Us",
                content: "Dubai, UAE",
                description: "Multiple locations across UAE"
              }
            ].map((contact, index) => (
              <Card key={index} className="glass-effect border-luxury/10 hover:border-luxury/30 transition-all duration-300 hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-luxury/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <contact.icon className="h-8 w-8 text-luxury" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {contact.title}
                  </h3>
                  <p className="text-luxury font-semibold mb-2">
                    {contact.href ? (
                      <a href={contact.href} className="hover:underline focus:outline-none focus:ring-2 focus:ring-luxury/50 rounded">
                        {contact.content}
                      </a>
                    ) : contact.content}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contact.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link to="/browse">
              <Button variant="luxury" size="lg" className="hover-lift px-12 py-4 text-lg">
                Browse Our Cars
                <div className="ml-2 w-6 h-6 bg-luxury-foreground/20 rounded-full flex items-center justify-center">
                  →
                </div>
              </Button>
            </Link>
          </div>

          {/* Floating Contact Dropdown */}
          <div className="fixed bottom-6 right-6 z-50 md:bottom-10 md:right-10">
            <div className={`transition-all duration-300 ${contactOpen ? 'mb-3 opacity-100 translate-y-0' : 'mb-0 opacity-0 translate-y-2 pointer-events-none'}`}>
              <div className="flex flex-col gap-3 items-end">
                <a href="tel:+971545293233" className="glass-effect backdrop-blur-md bg-background/60 border border-luxury/20 shadow-lg hover-lift rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-luxury" />
                  <span className="font-medium">Call</span>
                </a>
                <a href="mailto:info@ezcar24.com" className="glass-effect backdrop-blur-md bg-background/60 border border-luxury/20 shadow-lg hover-lift rounded-full px-4 py-2 flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-luxury" />
                  <span className="font-medium">Message</span>
                </a>
              </div>
            </div>
            <button type="button"
              aria-label="Contact options"
              className={`glass-effect backdrop-blur-md bg-background/60 border border-luxury/30 shadow-xl rounded-full w-14 h-14 flex items-center justify-center hover-lift focus:outline-none focus:ring-2 focus:ring-luxury/40 ${contactOpen ? 'rotate-45' : ''} transition-transform`}
              onClick={() => setContactOpen((o) => !o)}
            >
              <Phone className="w-6 h-6 text-luxury" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;