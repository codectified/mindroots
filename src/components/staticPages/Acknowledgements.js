import { useState } from 'react';

const Acknowledgements = () => {
  const [licenseNoticesExpanded, setLicenseNoticesExpanded] = useState(false);

  const toggleLicenseNotices = () => {
    setLicenseNoticesExpanded(!licenseNoticesExpanded);
  };

  return (
    <div className="about-page">

      <h1>Acknowledgements</h1>

      <section>
        <h2>Lane's Arabic–English Lexicon</h2>
        <p>
          We reference the online edition of{' '}
          <a href="https://lexicon.quranic-research.net/index.html" target="_blank" rel="noopener noreferrer">
            Lane's Arabic–English Lexicon
          </a>
          . Original XML files for Lane's Lexicon were provided by the Tufts University Perseus Project (Arabic collection) and are undergoing manual and automated verification processes.
        </p>
      </section>

      <section>
        <h2>Kais Dukes — Quranic Arabic Corpus</h2>
        <p>
          The{' '}
          <a href="https://corpus.quran.com/" target="_blank" rel="noopener noreferrer">
            Quranic Arabic Corpus
          </a>{' '}
          (morphology and syntax) has been foundational to this project.
        </p>
        <p style={{ fontStyle: 'italic' }}>
          In memoriam: Dr. Kais Dukes — may his work continue to benefit learners and researchers.
        </p>
      </section>

      <section>
        <h2>Amer Abbas — Qur'an Foundation</h2>
        <p>
          Special acknowledgement to Amr Abbas and the{' '}
          <a href="https://quran.com/" target="_blank" rel="noopener noreferrer">
            Qur'an Foundation
          </a>{' '}
          team for their ongoing stewardship of Quran.com and related projects, continuing vital work after the passing of Kais Dukes.
        </p>
      </section>

      <section>
        <h2>Glenn Stevens — Semitic Roots</h2>
        <p>
          Acknowledgement to Glenn Stevens for comparative Semitic resources informing our non-Arabic data, available at{' '}
          <a href="http://www.semiticroots.net/index.php/language" target="_blank" rel="noopener noreferrer">
            Semitic Roots
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Tufts University — Perseus Project</h2>
        <p>
          Original Lane's Lexicon XML (Arabic collection) provided by the{' '}
          <a href="https://www.perseus.tufts.edu/" target="_blank" rel="noopener noreferrer">
            Perseus Project at Tufts University
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Hans Wehr — A Dictionary of Modern Written Arabic</h2>
        <p>
          Referenced as a standard modern Arabic lexicographic resource. More information available on{' '}
          <a href="https://en.wikipedia.org/wiki/Hans_Wehr_dictionary" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Turath.io</h2>
        <p>
          Thanks to{' '}
          <a href="https://app.turath.io/" target="_blank" rel="noopener noreferrer">
            Turath.io
          </a>{' '}
          for generously sharing Arabic source data; we look forward to deeper collaboration.
        </p>
        <p>
          [Inference] Turath.io is likely the most comprehensive and effective search tool for Arabic texts.
        </p>
      </section>

      <section>
        <h2>Joshua Beneventi — Mashraba Community</h2>
        <p>
          Acknowledgement to Joshua Beneventi, founder of the Mashraba community. Support from the Mashraba community has been invaluable.
        </p>
      </section>

      <section>
        <h3>Special Mentions</h3>
        <p>
          <strong>Lisa White & Dr. Mohamed Shaltout — Rooted in the Body:</strong> Authors of Rooted in the Body, a helpful resource on Arabic morphology that informed aspects of this work.
        </p>
        <p>
          <strong>Suzanne Pinckney Stetkevich:</strong> Scholar of Arabic literature and poetics whose works helped shape the theoretical background for Mindroots.
        </p>
      </section>

      <section>
        <h3>
          <button 
            onClick={toggleLicenseNotices}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              color: 'inherit',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {licenseNoticesExpanded ? '▼' : '▶'} License Notices
          </button>
        </h3>
        
        {licenseNoticesExpanded && (
          <div style={{ marginTop: '20px' }}>
            <h4>Quranic Arabic Corpus</h4>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px', 
              fontSize: '12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
{`PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK
#====================================================================
#
#  Quranic Arabic Corpus (morphology, version 0.4)
#  Copyright (C) 2011 Kais Dukes
#  License: GNU General Public License
#
#  The Quranic Arabic Corpus includes syntactic and morphological
#  annotation of the Quran, and builds on the verified Arabic text
#  distributed by the Tanzil project.
#
#  TERMS OF USE:
#
#  - Permission is granted to copy and distribute verbatim copies
#    of this file, but CHANGING IT IS NOT ALLOWED.
#
#  - This annotation can be used in any website or application,
#    provided its source (the Quranic Arabic Corpus) is clearly
#    indicated, and a link is made to http://corpus.quran.com to enable
#    users to keep track of changes.
#
#  - This copyright notice shall be included in all verbatim copies
#    of the text, and shall be reproduced appropriately in all works
#    derived from or containing substantial portion of this file.
#
#  Please check updates at: http://corpus.quran.com/download`}
            </pre>

            <h4 style={{ marginTop: '30px' }}>Tanzil Quran Text</h4>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px', 
              fontSize: '12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
{`PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK
#====================================================================
#
#  Tanzil Quran Text (Uthmani, version 1.0.2)
#  Copyright (C) 2008-2009 Tanzil.info
#  License: Creative Commons BY-ND 3.0 Unported
#
#  This copy of quran text is carefully produced, highly
#  verified and continuously monitored by a group of specialists
#  at Tanzil project.
#
#  TERMS OF USE:
#
#  - Permission is granted to copy and distribute verbatim copies
#    of this text, but CHANGING IT IS NOT ALLOWED.
#
#  - This quran text can be used in any website or application,
#    provided its source (Tanzil.info) is clearly indicated, and
#    a link is made to http://tanzil.info to enable users to keep
#    track of changes.
#
#  - This copyright notice shall be included in all verbatim copies
#    of the text, and shall be reproduced appropriately in all files
#    derived from or containing substantial portion of this text.
#
#  Please check updates at: http://tanzil.info/updates/
#
#====================================================================`}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
};

export default Acknowledgements;