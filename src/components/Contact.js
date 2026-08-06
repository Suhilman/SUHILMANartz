import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import emailjs from 'emailjs-com';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { FaUser, FaEnvelope, FaPaperPlane, FaWhatsapp, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Magnetic, RevealWords, Tilt } from './fx';

const ContactForm = ({ isDarkMode }) => {
    const [formData, setFormData] = useState({
        to_name: 'SUHILMANartz',
        from_name: '',
        message: '',
        from_mail: '',
    });
    const [alert, setAlert] = useState({ open: false, severity: 'success', message: '' });
    const [emailError, setEmailError] = useState('');
    const [sending, setSending] = useState(false);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        if (name === 'from_mail') setEmailError(!validateEmail(value) && value ? 'Invalid email format' : '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateEmail(formData.from_mail)) {
            setAlert({ open: true, severity: 'error', message: 'Please enter a valid email address.' });
            return;
        }
        setSending(true);
        emailjs.send('service_fvj904j', 'template_fquouhf', formData, '-gn7l2ECIImjQ5SS4')
            .then(() => {
                setAlert({ open: true, severity: 'success', message: 'Message sent successfully!' });
                setFormData({ to_name: 'SUHILMANartz', from_name: '', message: '', from_mail: '' });
            })
            .catch(() => setAlert({ open: true, severity: 'error', message: 'Failed to send message — please try again.' }))
            .finally(() => setSending(false));
    };

    return (
        <Page>
            <Header>
                <Eyebrow>{'// 06 — Contact'}</Eyebrow>
                <Title><RevealWords>Let's</RevealWords> <RevealWords as="span" className="grad" delay={0.18}>build</RevealWords> <RevealWords delay={0.35}>something together</RevealWords></Title>
                <Sub>Have a project, role, or idea in mind? Drop a message — I usually reply within a day.</Sub>
            </Header>

            <Grid>
                <Tilt max={6} scale={1.02}>
                <Info
                    as={motion.div}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <InfoTitle>Get in touch</InfoTitle>
                    <InfoText>
                        Available for full-time, contract, or short-term collaboration.
                        Based in Bogor, Indonesia — open to remote worldwide.
                    </InfoText>

                    <InfoRow href="https://wa.me/6285172335192" target="_blank" rel="noopener noreferrer">
                        <Bubble><FaWhatsapp /></Bubble>
                        <div>
                            <small>WhatsApp</small>
                            <strong>+62 8517-2335-192</strong>
                        </div>
                    </InfoRow>
                    <InfoRow href="mailto:Suhilman.sch@gmail.com">
                        <Bubble><FaEnvelope /></Bubble>
                        <div>
                            <small>Email</small>
                            <strong>Suhilman.sch@gmail.com</strong>
                        </div>
                    </InfoRow>
                    <InfoRow as="div">
                        <Bubble><FaPhone /></Bubble>
                        <div>
                            <small>Phone</small>
                            <strong>+62 8517-2335-192</strong>
                        </div>
                    </InfoRow>
                    <InfoRow as="div">
                        <Bubble><FaMapMarkerAlt /></Bubble>
                        <div>
                            <small>Location</small>
                            <strong>Ciawi, Bogor, Indonesia</strong>
                        </div>
                    </InfoRow>
                </Info>
                </Tilt>

                <FormCard
                    as={motion.form}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <Field>
                        <Icon><FaUser /></Icon>
                        <Input
                            type="text" name="from_name"
                            placeholder="Your full name"
                            value={formData.from_name}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    <Field>
                        <Icon><FaEnvelope /></Icon>
                        <Input
                            type="email" name="from_mail"
                            placeholder="Your email"
                            value={formData.from_mail}
                            onChange={handleChange}
                            required
                        />
                    </Field>
                    {emailError && <ErrorMsg>{emailError}</ErrorMsg>}
                    <Textarea
                        name="message"
                        placeholder="Tell me about your project, role, or idea…"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                    />
                    <Magnetic strength={0.25}>
                        <SubmitBtn type="submit" disabled={sending}>
                            <FaPaperPlane /> {sending ? 'Sending…' : 'Send Message'}
                        </SubmitBtn>
                    </Magnetic>
                </FormCard>
            </Grid>

            <Snackbar
                open={alert.open}
                autoHideDuration={5000}
                onClose={() => setAlert((a) => ({ ...a, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setAlert((a) => ({ ...a, open: false }))}
                    severity={alert.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Page>
    );
};

export default ContactForm;

const Page = styled.div`
  padding: 100px 6vw 80px;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 768px) { padding: 80px 5vw 60px; }
`;
const Header = styled.div` text-align: center; margin-bottom: 56px; `;
const Eyebrow = styled.div`
  font-family: var(--font-mono);
  font-size: 12px; letter-spacing: 0.2em;
  color: var(--tittle-color);
  margin-bottom: 12px;
  text-transform: uppercase;
`;
const Title = styled.h2`
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
  .grad, .grad * { background: var(--gradient-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
`;
const Sub = styled.p` color: var(--text-muted); margin-top: 12px; font-size: 16px; max-width: 600px; margin-left: auto; margin-right: auto; `;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: stretch;
  @media (max-width: 968px) { grid-template-columns: 1fr; }
`;

const baseCard = `
  background: var(--gradient-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  padding: 32px;
`;

const Info = styled.div`
  ${baseCard}
  height: 100%;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color 0.3s, box-shadow 0.3s;
  &:hover { border-color: var(--accent-1); box-shadow: 0 0 28px var(--accent-glow); }
`;
const InfoTitle = styled.h3`
  font-size: 24px; margin: 0;
  background: var(--gradient-text);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
`;
const InfoText = styled.p`
  color: var(--text-muted);
  line-height: 1.65;
  margin: 0 0 12px;
  font-size: 14px;
`;
const InfoRow = styled.a`
  display: flex; align-items: center; gap: 14px;
  padding: 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.25s;
  &:hover { border-color: var(--accent-1); transform: translateX(4px); }
  small  { display: block; font-size: 11px; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-mono); }
  strong { display: block; margin-top: 2px; font-size: 14px; font-weight: 600; }
`;
const Bubble = styled.div`
  width: 42px; height: 42px;
  border-radius: 12px;
  background: var(--gradient-primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 0 16px var(--accent-glow);
`;

const FormCard = styled.form`
  ${baseCard}
  display: flex; flex-direction: column; gap: 16px;
`;
const Field = styled.div`
  position: relative;
  display: flex; align-items: center;
`;
const Icon = styled.div`
  position: absolute;
  left: 16px;
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
`;
const Input = styled.input`
  width: 100%;
  padding: 14px 16px 14px 44px;
  font-size: 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-md);
  color: var(--text-color);
  font-family: var(--font-body);
  transition: all 0.25s;
  &::placeholder { color: var(--text-muted); }
  &:focus { outline: none; border-color: var(--accent-1); box-shadow: 0 0 0 3px var(--accent-glow); }
`;
const Textarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  background: var(--card-bg-color);
  border: 1px solid var(--glass-border-strong);
  border-radius: var(--radius-md);
  color: var(--text-color);
  font-family: var(--font-body);
  resize: vertical;
  min-height: 120px;
  transition: all 0.25s;
  &::placeholder { color: var(--text-muted); }
  &:focus { outline: none; border-color: var(--accent-1); box-shadow: 0 0 0 3px var(--accent-glow); }
`;
const ErrorMsg = styled.p`
  margin: -8px 0 0;
  font-size: 12px;
  color: #ef4444;
  font-family: var(--font-mono);
`;
const SubmitBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-neon);
  transition: all 0.25s;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 32px var(--accent-glow); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
