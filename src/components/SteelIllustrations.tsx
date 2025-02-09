import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './SteelIllustrations.css';

const SteelIllustrations: React.FC = () => {
  const [graphData] = useState([65, 80, 45, 90, 75, 85, 70]);
  
  return (
    <div className="steel-illustrations">
      {/* Ambient Background */}
      <div className="ambient-layer">
        {[...Array(20)].map((_, index) => (
          <motion.div
            key={`ambient-${index}`}
            className="ambient-circle"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: index * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Dynamic Graph */}
      <div className="graph-container">
        <div className="graph-grid">
          {[...Array(5)].map((_, index) => (
            <div key={`grid-${index}`} className="grid-line" />
          ))}
        </div>
        <div className="graph-bars">
          {graphData.map((value, index) => (
            <motion.div
              key={`bar-${index}`}
              className="graph-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${value}%`,
                opacity: 1,
                boxShadow: [
                  '0 0 20px rgba(220, 0, 0, 0.3)',
                  '0 0 40px rgba(220, 0, 0, 0.5)',
                  '0 0 20px rgba(220, 0, 0, 0.3)'
                ]
              }}
              transition={{
                duration: 1,
                delay: index * 0.2,
                ease: "easeOut",
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <motion.div 
                className="bar-highlight"
                animate={{
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="value-label"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
              >
                {value}%
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Text Elements */}
      <div className="floating-elements">
        {[
          { text: 'Sales Growth', color: '#4CAF50', delay: 0 },
          { text: 'Market Share', color: '#2196F3', delay: 0.2 },
          { text: 'Customer Success', color: '#dc0000', delay: 0.4 }
        ].map((item, index) => (
          <motion.div
            key={`float-${index}`}
            className="floating-text"
            style={{ '--float-color': item.color } as React.CSSProperties}
            initial={{ opacity: 0, x: -50 }}
            animate={{
              opacity: [0.8, 1, 0.8],
              x: 0,
              y: [0, -10, 0]
            }}
            transition={{
              opacity: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              delay: item.delay
            }}
          >
            {item.text}
          </motion.div>
        ))}
      </div>

      {/* Decorative Lines */}
      <div className="decorative-lines">
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={`line-${index}`}
            className="deco-line"
            style={{
              '--line-angle': `${index * 90}deg`,
              '--line-delay': index * 0.3
            } as React.CSSProperties}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              delay: index * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SteelIllustrations; 