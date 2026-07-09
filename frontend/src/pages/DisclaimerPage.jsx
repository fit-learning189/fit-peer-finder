import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';

const DisclaimerPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>PeerFinder Disclaimer</h1>

        <p style={styles.p}>By using PeerFinder by ALX, you acknowledge and agree to the following:</p>

        <h2 style={styles.h2}>Hosting Platform – Render</h2>
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
        <p style={styles.p}>By continuing to use PeerFinder by ALX, you acknowledge the collection, processing, and use of your data including WhatsApp phone numbers by ALX for the purpose of the PeerFinder functionality. We cannot provide you the peers matching services without you providing your contact details.</p>
        <p style={styles.p}>For any related rights on your personal data, please check our Privacy Policy, <a href="https://www.alxafrica.com/privacy-policy/" target="_blank" rel="noreferrer" style={styles.highlightLink}>here</a>.</p>
        <p style={styles.p}>Also, the personal data detailed in this Disclaimer will be hosted by Render. Please read Render's <a href="https://render.com/privacy" target="_blank" rel="noreferrer" style={styles.highlightLink}>Privacy Policy</a> and <a href="https://render.com/terms" target="_blank" rel="noreferrer" style={styles.highlightLink}>Terms of Use</a> before you start using PeerFinder as Render will be an independent controller when processing your data for some of the purposes (e.g. Marketing, disclosing it to advertising parties or analysing user behavior, and predispositions).</p>

        <div style={styles.footer}>
            <p style={styles.highlightText}>Important: If you do not agree with the terms outlined above, please do not use this app or provide any personal information.</p>
            {/* Navigates back to home */}
            <button onClick={() => navigate('/register')} style={styles.backButton}>Close & Back to Form</button>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  body: { 
    fontFamily: fonts.main, 
    background: '#f4f4f4', 
    color: '#333', 
    lineHeight: '1.6', 
    minHeight: '100vh', 
    padding: '2rem 1rem', 
    boxSizing: 'border-box' 
  },
  container: { 
    maxWidth: '800px', 
    margin: '0 auto', 
    padding: '3rem', 
    background: colors.primary.white, 
    borderRadius: '12px', 
    boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
    borderTop: `6px solid ${colors.primary.berkeleyBlue}` // Brand Accent
  },
  h1: { color: colors.primary.berkeleyBlue, textAlign: 'center', marginBottom: '2rem' },
  h2: { color: colors.primary.iris, marginTop: '1.5rem', marginBottom: '0.8rem', fontSize: '1.2rem' },
  p: { marginBottom: '1rem', color: '#555' },
  highlightLink: { fontWeight: '600', color: colors.secondary.blueNCS, textDecoration: 'underline' },
  highlightText: { fontWeight: '600', color: colors.secondary.tomato },
  footer: { textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' },
  
  closeButton: { 
    display: 'inline-block', padding: '10px 30px', 
    background: colors.primary.berkeleyBlue, color: 'white', 
    border: 'none', borderRadius: '30px', fontWeight: 'bold', 
    marginTop: '1rem', cursor: 'pointer' 
  }
};

export default DisclaimerPage;