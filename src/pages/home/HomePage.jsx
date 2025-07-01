import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import illustration from '../../assets/physio-illustration.png';
import youngWomanDoctor from '../../assets/young-woman-doctor.jpg';
import youngWomanDoctor2 from '../../assets/2young-woman-doctor.jpg';
import youngWomanDoctor3 from '../../assets/3young-woman-doctor.jpg';
import tag1Image from '../../assets/tag1.jpg';
import tag3Image from '../../assets/tag3.jpg';
import asstImage from '../../assets/asstimages.jpeg';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const fullText = "Over 13 years, we've been a cornerstone of trusted physiotherapy care. Let our experienced professionals guide you towards recovery and lasting health through evidence-based treatments and compassionate support. We understand that every body and every injury is unique. That's why we take a personalized approach, combining thorough assessment with evidence-based techniques to create a treatment plan specifically designed for you. Our goal is not just to treat your symptoms, but to address the root cause of your pain and empower you with the knowledge and tools for long-term well-being.";

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
            </h1>            <p>Your trustworthy physiotherapy partner for better health</p>            <p className="description" style={{ whiteSpace: 'pre-wrap' }}>{fullText}</p>            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/verify-email')}
              >
                Make Appointment
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/view-profile')}
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
          </div>        </section>

        {/* Latest News Section */}
        <section className="latest-news">
          <div className="news-header">
            <h2>Latest News</h2>
            <p>Checkout for the latest news from Flexease Physiotherapy</p>
          </div>
          
          <div className="news-cards">            {/* News Card 1 */}            <div className="news-card">              <div className="news-image">
                <img src={youngWomanDoctor} alt="New medical equipment" />
              </div>
              <h3>New Advanced Rehabilitation Equipment</h3>
              <p>Flexease Physiotherapy introduces state-of-the-art rehabilitation equipment to enhance recovery experiences for our patients.</p>
            </div>
            
            {/* News Card 2 */}
            <div className="news-card">
              <div className="news-image">
                <img src={youngWomanDoctor2} alt="Lifestyle changes for better health" />
              </div>
              <h3>Simple Lifestyle Changes for Better Recovery</h3>
              <p>Learn about simple lifestyle adjustments that can significantly improve your rehabilitation journey and overall wellbeing.</p>
            </div>
            
            {/* News Card 3 */}
            <div className="news-card">
              <div className="news-image">
                <img src={youngWomanDoctor3} alt="New specialist joined" />
              </div>
              <h3>New Specialists Join Our Team</h3>
              <p>We're excited to welcome new specialists to our team, expanding our expertise in sports injuries and neurological rehabilitation.</p>            </div>
          </div>
        </section>

        {/* Our Services Section */}
        <section className="our-services">
          <div className="services-header">
            <h2>Our Specialized Services</h2>
            <p>Comprehensive physiotherapy services tailored to your unique needs</p>
          </div>
          
          <div className="service-cards">            {/* Service Card 1 */}
            <div className="service-card">
              <div className="service-image">
                <img src={tag1Image} alt="Sports Rehabilitation" />
              </div>
              <h3>Sports Rehabilitation</h3>
              <p>Specialized treatment programs designed to help athletes recover from injuries and return to peak performance quickly and safely.</p>
            </div>
            
            {/* Service Card 2 */}
            <div className="service-card">
              <div className="service-image">
                <img src={tag3Image} alt="Pain Management" />
              </div>
              <h3>Pain Management</h3>
              <p>Effective strategies and treatments to help manage chronic pain conditions and improve your quality of life without dependence on medications.</p>
            </div>
            
            {/* Service Card 3 */}
            <div className="service-card">
              <div className="service-image">
                <img src={asstImage} alt="Geriatric Physiotherapy" />
              </div>
              <h3>Geriatric Physiotherapy</h3>
              <p>Specialized care for older adults focusing on mobility, balance, strength, and overall physical wellness to maintain independence.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
