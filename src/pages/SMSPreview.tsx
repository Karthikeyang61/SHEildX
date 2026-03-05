import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Phone, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SMSPreview = () => {
  const navigate = useNavigate();
  const { emergencyContact, sosAlert, deviceStatus } = useDevice();

  const alertTime = sosAlert.timestamp || new Date();
  const message = `🚨 EMERGENCY ALERT 🚨

This is an automated SOS message from SHEild-X emergency system.

User requires immediate assistance!

Location: [GPS Coordinates would be here]
Time: ${format(alertTime, 'PPpp')}
Device Battery: ${deviceStatus.battery}%
GSM Status: ${deviceStatus.gsm ? 'Active' : 'Inactive'}

Please respond immediately or contact emergency services.

- SHEild-X Emergency Response System`;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">SMS Preview</h1>
          <p className="text-muted-foreground">
            Emergency message that will be sent via GSM
          </p>
        </motion.div>

        {/* Message Card */}
        <motion.div
          className="glass-card p-8 rounded-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Header Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-semibold text-lg">{emergencyContact}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span>{format(new Date(), 'HH:mm')}</span>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-background/50 p-6 rounded-lg mb-6 font-mono text-sm whitespace-pre-line">
            {message}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 bg-success rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <span className="text-sm text-success font-semibold">
                {sosAlert.active ? 'Ready to Send' : 'Sent Successfully'}
              </span>
            </div>

            {/* Flying paper plane animation */}
            <motion.div
              animate={{
                x: [0, 10, 0],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Send className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* GSM Status */}
        <motion.div
          className="glass-card p-6 rounded-xl mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold mb-4">GSM Module Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Signal Strength</p>
              <p className="text-2xl font-bold text-success">Excellent</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Network</p>
              <p className="text-2xl font-bold text-primary">4G LTE</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SMSPreview;
