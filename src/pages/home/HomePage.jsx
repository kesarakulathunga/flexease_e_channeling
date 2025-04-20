import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import illustration from '../../assets/physio-illustration.png';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const fullText = "Over 13 years, we've been a cornerstone of trusted physiotherapy care. Let our experienced professionals guide you towards recovery and lasting health through evidence-based treatments and compassionate support. We understand that every body and every injury is unique. That's why we take a personalized approach, combining thorough assessment with evidence-based techniques to create a treatment plan specifically designed for you. Our goal is not just to treat your symptoms, but to address the root cause of your pain and empower you with the knowledge and tools for long-term well-being.";
  const [animatedText, setAnimatedText] = useState('');

  useEffect(() => {
    let index = 0;
    setAnimatedText(''); // Reset on component mount/re-render
    const intervalId = setInterval(() => {
      // Check for double newline first
      if (fullText.substring(index, index + 2) === '\n\n') {
        setAnimatedText((prev) => prev + '\n\n');
        index += 2;
      // Check for single newline
      } else if (fullText.charAt(index) === '\n') {
        setAnimatedText((prev) => prev + '\n');
        index++;
      // Add regular character
      } else {
        setAnimatedText((prev) => prev + fullText.charAt(index));
        index++;
      }

      if (index >= fullText.length) {
        clearInterval(intervalId);
      }
    }, 30); // Typing speed

    return () => clearInterval(intervalId); // Cleanup
  }, [fullText]);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <section className="hero">
          {/* Left column: Text + Buttons */}
          <div className="hero-text">
            <h1>
              Flexease 
              Physiotherapy<br />
              Health Care
            </h1>
            <p>Your trustworthy physiotherapy partner for better health</p>
            <p className="animated-description" style={{ whiteSpace: 'pre-wrap' }}>{animatedText}</p>
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/verify')}
              >
                Make Appointment
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                View Your Profile
              </button>
            </div>
          </div>

          {/* Right column: Illustration */}
          <div className="hero-image">
            <img
              src={illustration}
              alt="Physiotherapist greeting a patient illustration"
            />
          </div>
        </section>
      </div>
    </>
  );
}
