import React from 'react';
import { motion } from 'framer-motion';

const SalesIllustrations = () => {
  return (
    <div className="sales-illustrations">
      <motion.div
        className="illustration-container"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Sales Team Illustration */}
        <svg
          width="400"
          height="300"
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="sales-team-illustration"
        >
          {/* Background Circle */}
          <circle cx="200" cy="150" r="120" fill="#fff5f5" />
          
          {/* Gajkesari Logo Elements */}
          <g transform="translate(140, 90) scale(0.8)">
            {/* Circle */}
            <circle cx="75" cy="75" r="75" fill="#dc0000" />
            {/* Arrow */}
            <path
              d="M100 75 L60 45 L60 105 Z"
              fill="#000000"
              transform="translate(-10, 0)"
            />
          </g>
          
          {/* Decorative Elements */}
          <circle cx="50" cy="50" r="8" fill="#dc0000" opacity="0.2" />
          <circle cx="350" cy="250" r="12" fill="#dc0000" opacity="0.2" />
          <circle cx="320" cy="70" r="10" fill="#dc0000" opacity="0.2" />
          
          {/* Abstract Lines */}
          <path
            d="M30 120 Q 60 150 90 120 T 150 120"
            stroke="#dc0000"
            strokeWidth="2"
            opacity="0.3"
            fill="none"
          />
          <path
            d="M250 180 Q 280 210 310 180 T 370 180"
            stroke="#dc0000"
            strokeWidth="2"
            opacity="0.3"
            fill="none"
          />
        </svg>
      </motion.div>
      
      {/* Welcome Text */}
      <motion.div
        className="illustration-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h2>Gajkesari Steel</h2>
        <p>Sales Management System</p>
      </motion.div>

      <style jsx>{`
        .sales-illustrations {
          position: fixed;
          top: 0;
          left: 0;
          width: 50%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ffffff 0%, #fff5f5 100%);
          padding: 2rem;
        }

        .illustration-container {
          margin-bottom: 2rem;
        }

        .sales-team-illustration {
          width: 100%;
          max-width: 400px;
          height: auto;
        }

        .illustration-text {
          text-align: center;
          color: #1a1a1a;
        }

        .illustration-text h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #dc0000, #ff1a1a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .illustration-text p {
          font-size: 1.2rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .sales-illustrations {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SalesIllustrations; 