import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// profile-page.css → moved to index.css
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
            In a world with more systems than people, you need someone who knows <em>both</em>.
          </h1>
          {/* CSS class covers layout; inline was redundant */}
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
          <h2>Professional Services</h2>

          {/* Bio Section Index */}
          <nav className="mb-[30px] flex justify-center w-full">
            <div className="flex flex-wrap justify-center items-center gap-[15px] px-5 py-[10px] bg-surface rounded-lg text-[0.9em]">
              <a href="#it-consulting" className="text-[#667eea] no-underline font-medium whitespace-nowrap">Technical Consulting</a>
              <span className="text-[#ccc]">•</span>
              <a href="#communications" className="text-[#667eea] no-underline font-medium whitespace-nowrap">Communications</a>
              <span className="text-[#ccc]">•</span>
              <a href="#knowledge-architecture" className="text-[#667eea] no-underline font-medium whitespace-nowrap">Knowledge Management</a>
            </div>
          </nav>

          {/* About Me Section */}
          <div className="bg-surface rounded-xl px-[30px] py-[25px] mb-[40px] border border-[#e9ecef] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <p className="text-[1.1rem] leading-[1.7] text-[#495057] mb-[15px] text-center italic">
              I build intelligent systems that translate complexity into clarity, enabling effective knowledge transfer and knowledge management.
            </p>
            <div className="text-center">
              <button
                className="bio-link border-none bg-transparent p-0 cursor-pointer text-[0.95em] font-inherit"
                onClick={() => showArticle('/theoption.life/articles/about-my-work.md', 'About My Work and Motivations')}
              >
                More about my work and motivations →
              </button>
            </div>
          </div>

          {/* Information Technology Consulting */}
          <div id="it-consulting" className="bio-subsection">
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
                  {/* bio-link class covers color/decoration/weight; inline was redundant */}
                  <button
                    className="bio-link border-none bg-transparent p-0 cursor-pointer text-[inherit] font-inherit font-normal"
                    onClick={() => showArticle('/theoption.life/articles/IT-strategy.md', 'General Guidelines and Strategy for IT & IS Implementations')}
                  >
                    Article: General Guidelines and Strategy for IT & IS Implentations
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Communications Strategy */}
          <div id="communications" className="bio-subsection">
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
          <div id="knowledge-architecture" className="bio-subsection">
            <h3>Informative Science & Knowledge Architecture</h3>
            <p className="bio-subtitle">(Meaning, structure, intelligence)</p>
            <p>I specialize systems optimizaiton, process control and automation.  Leveraging my background in Linguistics and Cognitive Science, I can deliver:</p>
            <ul>
              <li>Ontology design and graph-based knowledge systems</li>
              <li>GraphRAG development and semantic information retrieval pipelines</li>
              <li>Advanced automation and AI integration</li>
            </ul>
            <div className="bio-links">
              <h4>Related Links:</h4>
              <ul className="bio-links-list">
                <li>
                  <button
                    className="bio-link border-none bg-transparent p-0 cursor-pointer text-[inherit] font-inherit font-normal"
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
            <p>View my professional experience and qualifications.</p>
            <div className="flex gap-[15px] flex-wrap">
              <a
                href={`${process.env.PUBLIC_URL}/OI_resume.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button no-underline inline-block"
              >
                View PDF Resume
              </a>
              <button className="cta-button" disabled>
                View Graph Résumé
                <span className="coming-soon">(Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects-section">
        <div className="section-container">
          <h2>Projects</h2>
          <div className="project-card">
            <div className="flex flex-col gap-[30px] my-[30px]">

              {/* MindRoots */}
              <div className="flex items-start gap-5">
                <Link to="/mindroots" className="no-underline flex-shrink-0">
                  <img
                    src={`${process.env.PUBLIC_URL}/root-tree.jpeg`}
                    alt="MindRoots"
                    className="w-20 h-20 rounded-lg cursor-pointer"
                  />
                </Link>
                <div className="flex-1">
                  <p className="m-0 text-[0.95em] leading-[1.6]">
                    <strong>MindRoots:</strong> An advanced search and language exploration tool, connecting key texts and primary sources with graph technology and cognitive-linguistic ontology design
                  </p>
                </div>
              </div>

              {/* MindRoots GPT */}
              <div className="flex items-start gap-5">
                <a href="https://chatgpt.com/g/g-6837e9a3285081919820781cf0fb2292-mindroots" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img
                    src={`${process.env.PUBLIC_URL}/MindrootsGPT.png`}
                    alt="MindRoots GPT"
                    className="w-20 h-20 rounded-lg cursor-pointer"
                  />
                </a>
                <div className="flex-1">
                  <p className="m-0 text-[0.95em] leading-[1.6]">
                    <strong>MindRoots GPT:</strong> An AI chatbot which can talk to Mindroots and summarize entries from Lane's Lexicon and other data sources
                  </p>
                </div>
              </div>

              {/* QuranRoots GPT */}
              <div className="flex items-start gap-5">
                <a href="https://chatgpt.com/g/g-68c8fbd5dcf48191a399e8045059a8d4-quranroots" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img
                    src={`${process.env.PUBLIC_URL}/qroots.png`}
                    alt="QuranRoots GPT"
                    className="w-20 h-20 rounded-lg cursor-pointer"
                  />
                </a>
                <div className="flex-1">
                  <p className="m-0 text-[0.95em] leading-[1.6]">
                    <strong>QuranRoots GPT (Beta):</strong> An AI chatbot with advanced search capability specifically for the quran
                  </p>
                </div>
              </div>

            </div>
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
