import { motion } from 'framer-motion';

export const RadarScanner = () => {
  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Radar circles */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          style={{
            width: `${i * 25}%`,
            height: `${i * 25}%`,
            margin: 'auto',
            inset: 0,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Scanning beam */}
      <motion.div
        className="absolute inset-0 m-auto w-full h-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(168, 85, 247, 0.8) 10%, transparent 20%)',
          borderRadius: '50%',
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Center dot */}
      <div className="absolute inset-0 m-auto w-4 h-4 bg-primary rounded-full glow-purple" />

      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute inset-0 m-auto rounded-full border-2 border-primary"
          animate={{
            scale: [0, 2],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
          }}
        />
      ))}
    </div>
  );
};
