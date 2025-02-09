import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SteelIllustrations from './SteelIllustrations';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onFinished?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinished, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinished?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinished]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles['splash-screen']}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className={styles['splash-content']}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles['illustration-container']}>
              <SteelIllustrations />
            </div>
            
            <motion.div 
              className={styles['company-name']}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1>Steel Sales Analytics</h1>
              <div className={styles['loading-indicator']}>
                <motion.div 
                  className={styles['loading-bar']}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen; 