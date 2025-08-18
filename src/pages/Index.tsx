import { useNavigate } from "react-router-dom"
import Navigation from "@/components/Navigation"
import Dashboard from "@/components/Dashboard"
import { HeroButton } from "@/components/ui/hero-button"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Leaf, BarChart3, TrendingDown, Users } from "lucide-react"
import heroImage from "@/assets/hero-agriculture.jpg"

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-earth">
      <Navigation />
      
      {/* Main Content */}
      <div className="md:pl-64">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="absolute inset-0 bg-black/20" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Smart Agriculture for
                <span className="block text-accent">Sustainable Farming</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Monitor crop health, optimize fertilizer usage, and make data-driven decisions 
                to boost yields while reducing environmental impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <HeroButton size="lg" onClick={() => navigate('/fields')}>
                    Go to Dashboard
                  </HeroButton>
                ) : (
                  <>
                    <HeroButton size="lg" onClick={() => navigate('/auth')}>
                      Get Started
                    </HeroButton>
                    <HeroButton variant="outline" size="lg" onClick={() => navigate('/auth')}>
                      Sign In
                    </HeroButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Why Choose AgriTech?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform combines cutting-edge technology with agricultural expertise 
                to deliver actionable insights for modern farming.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                {
                  icon: Leaf,
                  title: "Crop Health Monitoring",
                  description: "Real-time analysis of plant health using satellite imagery and IoT sensors."
                },
                {
                  icon: BarChart3,
                  title: "Data Analytics",
                  description: "Advanced analytics to identify trends and predict optimal farming strategies."
                },
                {
                  icon: TrendingDown,
                  title: "Fertilizer Optimization",
                  description: "Reduce costs and environmental impact with precise fertilizer recommendations."
                },
                {
                  icon: Users,
                  title: "Expert Support",
                  description: "Access to agronomist expertise and community knowledge sharing."
                }
              ].map((feature, index) => (
                <Card key={index} className="shadow-medium hover:shadow-strong transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  Dashboard Overview
                </h2>
                <p className="text-muted-foreground">
                  Monitor all your fields from a single, intuitive dashboard
                </p>
              </div>
              <Dashboard />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
