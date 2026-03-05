import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const ShieldLogo = ({ size = 120 }: { size?: number }) => {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer pulsing rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
          width: size * 1.5,
          height: size * 1.5,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          width: size * 1.3,
          height: size * 1.3,
        }}
        animate={{
          scale: [1.1, 1.3, 1.1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />

      {/* Shield icon with glow */}
      <motion.div
        className="relative glass-card p-6 rounded-3xl glow-purple"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Shield 
          size={size} 
          className="text-primary drop-shadow-2xl"
          strokeWidth={1.5}
        />
        
        {/* Inner glow effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  );
};
