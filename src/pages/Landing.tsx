import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldLogo } from '@/components/ShieldLogo';
import { Shield, Zap, Bell } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Shield, title: 'Advanced Protection', description: 'ESP32-powered emergency response system' },
    { icon: Zap, title: 'Instant Alerts', description: 'Real-time SOS notifications via GSM' },
    { icon: Bell, title: 'Smart Detection', description: 'Multi-press button logic for precise control' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl"
      >
        {/* Logo */}
        <div className="mb-8">
          <ShieldLogo size={140} />
        </div>

        {/* Title */}
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-6 gradient-text"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          SHEild-X
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-2xl md:text-3xl text-foreground/80 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Smart Safety. Instant Response.
        </motion.p>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass-card p-6 rounded-xl hover:glow-purple transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <feature.icon className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-cyber hover:opacity-90 glow-purple"
          >
            Enter Dashboard
          </Button>
        </motion.div>

        {/* Sub links */}
        <motion.div
          className="mt-8 flex gap-6 justify-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <button onClick={() => navigate('/bluetooth')} className="hover:text-primary transition-colors">
            Bluetooth Scanner
          </button>
          <button onClick={() => navigate('/settings')} className="hover:text-primary transition-colors">
            Settings
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
