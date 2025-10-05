import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/profile-page.css';
import { 
  faInstagram, 
  faLinkedin, 
  faYoutube,
  faGithub
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import ArticleModal from '../layout/ArticleModal';

const ProfilePage = () => {
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [articleModalContent, setArticleModalContent] = useState('');
  const [articleModalTitle, setArticleModalTitle] = useState('');

  const showArticle = (filePath, title) => {
    setArticleModalContent(filePath);
    setArticleModalTitle(title);
    setArticleModalVisible(true);
  };

  const closeArticleModal = () => {
    setArticleModalVisible(false);
    setArticleModalContent('');
    setArticleModalTitle('');
  };

  return (
    <div className="profile-page">
      {/* Mission Statement Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="mission-statement">
            In a world with more systems than people, an effective facilitator leverages knowledge from multiple domains and delivers the best option.
          </h1>
          <nav className="hero-navigation">
            <a href="#resume" className="nav-link">Resume</a>
            <a href="#projects" className="nav-link">Projects</a>
            <a href="#availability" className="nav-link">Availability</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
        </div>
      </section>

      {/* Professional Services Bio Section */}
      <section id="bio" className="bio-section">
        <div className="section-container">
          <h2>Professional Services Bio</h2>
          
          {/* Information Technology Consulting */}
          <div className="bio-subsection">
            <h3>Information Technology Consulting</h3>
            <p className="bio-subtitle">(Automation, infrastructure, systems design)</p>
            <p>I have over ten years of experience with information technology management and administration including:</p>
            <ul>
              <li>End-to-end process automation for enterprise workflows</li>
              <li>Custom search implementations and data integrations</li>
              <li>Cloud optimization, monitoring, and DevOps architecture</li>
            </ul>
            <div className="bio-links">
              <h4>Related Links:</h4>
              <ul className="bio-links-list">
                <li>
                  <a href="https://github.com/codectified" target="_blank" rel="noopener noreferrer" className="bio-link">
                    GitHub portfolio
                  </a>
                </li>
                <li>
                  <button 
                    className="bio-link" 
                    style={{border: 'none', background: 'none', padding: 0, color: '#667eea', cursor: 'pointer'}}
                    onClick={() => showArticle('/theoption.life/articles/IT-strategy.md', 'General Guidelines and Strategy for IT & IS Implementations')}
                  >
                    Article: General Guidelines and Strategy for IT & IS Implentations
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Communications Strategy */}
          <div className="bio-subsection">
            <h3>Communications Strategy</h3>
            <p>I am experienced in digital transformation and design as well as community management and organization. Other skills and experience include:</p>
            <ul>
              <li>Content creation, copywriting, and podcast hosting</li>
              <li>Video/audio editing and publication workflows</li>
              <li>Self-published author bridging language, cognition, and design</li>
            </ul>
            <div className="bio-links">
              <h4>Check Out:</h4>
              <ul className="bio-links-list">
                <li>
                  <a href="https://www.instagram.com/omr.ib/" target="_blank" rel="noopener noreferrer" className="bio-link">
                    Personal Instagram
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@codectified" target="_blank" rel="noopener noreferrer" className="bio-link">
                    LisanLab YouTube
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@theyshoootin" target="_blank" rel="noopener noreferrer" className="bio-link">
                    Sunnah Sports YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Informative Science & Knowledge Architecture */}
          <div className="bio-subsection">
            <h3>Informative Science & Knowledge Architecture</h3>
            <p className="bio-subtitle">(Meaning, structure, intelligence)</p>
            <p>My specialty is cognitive science and optimizing systems and process control to deliver optimized solutions with:</p>
            <ul>
              <li>Ontology design and graph-based knowledge systems</li>
              <li>GraphRAG development and semantic retrieval pipelines</li>
              <li>Advanced search and contextual AI integration</li>
            </ul>
            <div className="bio-links">
              <h4>Related Links:</h4>
              <ul className="bio-links-list">
                <li>
                  <button 
                    className="bio-link" 
                    style={{border: 'none', background: 'none', padding: 0, color: '#667eea', cursor: 'pointer'}}
                    onClick={() => showArticle('/theoption.life/articles/whygraphs.md', 'Graph Technology as the "Natural" approach')}
                  >
                    Article: Graph Technology as the "Natural" approach
                  </button>
                </li>
                <li>
                  <a href="#projects" className="bio-link">
                    View Projects
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Section */}
      <section id="resume" className="resume-section">
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
      <section id="projects" className="projects-section">
        <div className="section-container">
          <h2>Projects</h2>
          <div className="project-card">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '30px 0' }}>
              <Link to="/mindroots" style={{ textDecoration: 'none' }}>
                <img 
                  src={`${process.env.PUBLIC_URL}/root-tree.jpeg`}
                  alt="MindRoots" 
                  style={{ width: '100px', height: '100px', borderRadius: '8px', cursor: 'pointer' }}
                />
              </Link>
              <a href="https://chatgpt.com/g/g-6837e9a3285081919820781cf0fb2292-mindroots" target="_blank" rel="noopener noreferrer">
                <img 
                  src={`${process.env.PUBLIC_URL}/MindrootsGPT.png`}
                  alt="MindRoots GPT" 
                  style={{ width: '100px', height: '100px', borderRadius: '8px', cursor: 'pointer' }}
                />
              </a>
              <a href="https://chatgpt.com/g/g-68c8fbd5dcf48191a399e8045059a8d4-quranroots" target="_blank" rel="noopener noreferrer">
                <img 
                  src={`${process.env.PUBLIC_URL}/qroots.png`}
                  alt="QuranRoots GPT" 
                  style={{ width: '100px', height: '100px', borderRadius: '8px', cursor: 'pointer' }}
                />
              </a>
            </div>

            <ul style={{ listStyle: 'disc', paddingLeft: '20px', fontSize: '0.95em', lineHeight: '1.6' }}>
              <li><strong>MindRoots:</strong> An advanced search and language exploration tool, connecting key texts and primary sources with graph technology and cognitive-linguistic ontologoy design</li>
              <li><strong>MindRoots GPT:</strong> An AI chatbot which can talk to Mindroots and summarize entries from Lane's Lexicon and other data sources</li>
              <li><strong>QuranRoots GPT (Beta):</strong> An AI chatbot with advanced search capability specifically for the quran</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section id="availability" className="calendar-section">
        <div className="section-container">
          <h2>Availability</h2>
          <div className="calendar-container">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FChicago&showPrint=0&mode=WEEK&src=b21hcmlicmFoaW0xMTMwQGdtYWlsLmNvbQ&color=%23039be5"
              style={{ border: "solid 1px #777", width: "100%", height: "600px" }}
              frameBorder="0"
              scrolling="no"
              title="Schedule Calendar"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Contact/Social Links Footer */}
      <footer id="contact" className="contact-footer">
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

      {/* Article Modal */}
      {articleModalVisible && (
        <ArticleModal
          filePath={articleModalContent}
          title={articleModalTitle}
          onClose={closeArticleModal}
        />
      )}
    </div>
  );
};

export default ProfilePage;