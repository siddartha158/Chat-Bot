import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight">
          Build Powerful AI Chatbots
        </h1>
        <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
          Create, deploy, and manage intelligent chatbots with custom personalities and seamless integrations. Perfect for businesses and developers.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started Free
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Conversations</h3>
            <p className="text-muted-foreground">AI-powered chatbots with natural language understanding and contextual responses.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-User Support</h3>
            <p className="text-muted-foreground">Support multiple users and projects concurrently with robust scalability.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">Low-latency responses and real-time chat experiences powered by modern infrastructure.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-muted-foreground">Enterprise-grade security with protected user data and authentication flows.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of developers and businesses building amazing chatbot experiences.
        </p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Create Your First Chatbot
        </Button>
      </section>
    </div>
  );
};

export default Index;
