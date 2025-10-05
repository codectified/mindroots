import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles/profile-page.css';
import { 
  faInstagram, 
  faLinkedin, 
  faYoutube,
  faGithub
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const ProfilePage = () => {
  return (
    <div className="profile-page">
      {/* Mission Statement Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="mission-statement">
            In a world with more systems than people, an effective facilitator uses your knowledge to provide the best options.
          </h1>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="calendar-section">
        <div className="section-container">
          <h2>Availability</h2>
          <div className="calendar-container">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FChicago&showPrint=0&src=b21hcmlicmFoaW0xMTMwQGdtYWlsLmNvbQ&color=%23039be5"
              style={{ border: "solid 1px #777", width: "100%", height: "600px" }}
              frameBorder="0"
              scrolling="no"
              title="Schedule Calendar"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Resume Section */}
      <section className="resume-section">
        <div className="section-container">
          <h2>Résumé</h2>
          <div className="resume-card">
            <h3>Graph Résumé</h3>
            <p>Explore my professional experience through an interactive visualization.</p>
            <button className="cta-button" disabled>
              View Graph Résumé
              <span className="coming-soon">(Coming Soon)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="projects-section">
        <div className="section-container">
          <h2>Projects</h2>
          <div className="project-card">
            <h3>Mindroots</h3>
            <p>Arabic morphology visualization tool for exploring linguistic relationships through interactive graph networks.</p>
            <Link to="/mindroots" className="mindroots-image-link">
              <img
                src={`${process.env.PUBLIC_URL}/root-tree.jpeg`}
                alt="Explore Mindroots"
                className="mindroots-image-button"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact/Social Links Footer */}
      <footer className="contact-footer">
        <div className="section-container">
          <h2>Connect</h2>
          <div className="social-links">
            <a href="mailto:omaribrahim1130@gmail.com" className="social-link">
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Email</span>
            </a>
            <a href="https://www.linkedin.com/in/ibomar/" target="_blank" rel="noopener noreferrer" className="social-link">
              <FontAwesomeIcon icon={faLinkedin} />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/codectified/mindroots" target="_blank" rel="noopener noreferrer" className="social-link">
              <FontAwesomeIcon icon={faGithub} />
              <span>GitHub</span>
            </a>
            <a href="https://www.instagram.com/omr.ib/" target="_blank" rel="noopener noreferrer" className="social-link">
              <FontAwesomeIcon icon={faInstagram} />
              <span>Instagram</span>
            </a>
            <a href="https://www.youtube.com/@codectified" target="_blank" rel="noopener noreferrer" className="social-link">
              <FontAwesomeIcon icon={faYoutube} />
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;