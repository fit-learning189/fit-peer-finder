import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, ui } from '../theme';

const DisclaimerPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <span style={styles.eyebrow}>Frontier Institute of Technology</span>
        <h1 style={styles.h1}>PeerFinder Disclaimer</h1>

        <p style={styles.p}>By using FIT PeerFinder, you acknowledge and agree to the following:</p>

        <h2 style={styles.h2}>Hosting Platform &mdash; Render</h2>
        <p style={styles.p}>This web app is hosted on Render. By accessing or using this app, you understand that your information including your WhatsApp phone number may be collected, processed, and disclosed in accordance with Render's Privacy Policy and Terms of Use.</p>

        <h2 style={styles.h2}>Data Collected</h2>
        <p style={styles.p}>Render may collect data such as:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Your contact details (e.g., phone number, name, email)</li>
          <li style={styles.li}>Device and browser information</li>
          <li style={styles.li}>IP address and geolocation data</li>
          <li style={styles.li}>Usage activity, including clicks, navigation, and time spent on the app</li>
        </ul>

        <h2 style={styles.h2}>How Your Data May Be Used</h2>
        <p style={styles.p}>Your data may be used for:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Improving the hosting service and application performance</li>
          <li style={styles.li}>Providing support and personalised experiences</li>
          <li style={styles.li}>Marketing and advertising purposes</li>
          <li style={styles.li}>Compliance with legal requirements, fraud prevention, and security</li>
        </ul>

        <h2 style={styles.h2}>Third-Party Sharing</h2>
        <p style={styles.p}>Render may share data with:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Service providers such as analytics tools and customer support platforms</li>
          <li style={styles.li}>Advertising and marketing partners</li>
          <li style={styles.li}>Legal or regulatory authorities as required by law</li>
        </ul>

        <h2 style={styles.h2}>Data Privacy</h2>
        <p style={styles.p}>By continuing to use FIT PeerFinder, you acknowledge the collection, processing, and use of your data including WhatsApp phone numbers by Frontier Institute of Technology for the purpose of the PeerFinder functionality. We cannot provide peer matching services without you providing your contact details.</p>
        <p style={styles.p}>The personal data detailed in this Disclaimer will be hosted by Render. Please read Render's <a href="https://render.com/privacy" target="_blank" rel="noreferrer" style={styles.link}>Privacy Policy</a>and <a href="https://render.com/terms" target="_blank" rel="noreferrer" style={styles.link}>Terms of Use</a>before you start using PeerFinder, as Render will be an independent controller when processing your data for some purposes (for example marketing, disclosing it to advertising parties, or analysing user behaviour).</p>

        <div style={styles.footer}>
          <p style={styles.warning}>
            Important: if you do not agree with the terms outlined above, please do not use this app or provide any personal information.
          </p>
          <button onClick={() =>navigate('/register')} style={styles.backButton}>
            Close and return to the form
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  body: {
    ...ui.page,
    lineHeight: 1.65,
    padding: '3rem 1rem',
  },
  container: {
    ...ui.card,
    maxWidth: '820px',
    margin: '0 auto',
    padding: '3rem',
    borderTop: `3px solid ${colors.accent.azure}`,
  },
  eyebrow: {
    display: 'block',
    textAlign: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colors.accent.azureHi,
    marginBottom: '10px',
  },
  h1: {
    color: colors.text.hi,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: '2rem',
    fontSize: '1.9rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    color: colors.accent.limeHi,
    marginTop: '2rem',
    marginBottom: '0.6rem',
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
  p: { marginBottom: '1rem', color: colors.text.lo },
  ul: { marginBottom: '1rem', paddingLeft: '1.2rem', color: colors.text.lo },
  li: { marginBottom: '0.4rem' },
  link: { color: colors.accent.azureHi, fontWeight: 600, textDecoration: 'underline' },
  footer: {
    textAlign: 'center',
    marginTop: '3rem',
    paddingTop: '1.75rem',
    borderTop: `1px solid ${colors.line.soft}`,
  },
  warning: {
    fontWeight: 600,
    color: colors.accent.roseHi,
    marginBottom: '1.5rem',
  },
  // Previously this key was named `closeButton` while the JSX referenced
  // `styles.backButton`, leaving the button completely unstyled.
  backButton: {
    ...ui.btnPrimary,
    padding: '12px 30px',
  },
};

export default DisclaimerPage;
