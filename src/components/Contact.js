import React, { useState } from 'react';
import styled from 'styled-components';
import emailjs from 'emailjs-com';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ContactForm = ({ isDarkMode }) => {
    const [formData, setFormData] = useState({
        to_name: 'SUHILMANartz',
        from_name: '',
        message: '',
        from_mail: ''
    });

    const [alert, setAlert] = useState({ open: false, severity: '', message: '' });
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email) => {
        // Check if email contains both "@" and "."
        return email.includes('@') && email.includes('.');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (name === 'from_mail') {
            if (!validateEmail(value)) {
                setEmailError('Invalid email format');
            } else {
                setEmailError(''); // Clear the error message if the email is valid
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateEmail(formData.from_mail)) {
            setAlert({ open: true, severity: 'error', message: 'Please enter a valid email address.' });
            return;
        }

        emailjs.send(
            "service_fvj904j", // Your service ID
            "template_fquouhf", // Your template ID
            {
                to_name: formData.to_name,
                from_name: formData.from_name,
                from_mail: formData.from_mail,
                message: formData.message,
            },
            "-gn7l2ECIImjQ5SS4" // Your public key (user ID)
        )
        .then((result) => {
            console.log('Email successfully sent:', result.text);
            setAlert({ open: true, severity: 'success', message: 'Message sent successfully!' });
            setFormData({ to_name: 'SUHILMANartz', from_name: '', message: '', from_mail: '' }); // Reset form data
        })
        .catch((error) => {
            console.error('Error sending email:', error.text);
            setAlert({ open: true, severity: 'error', message: 'Failed to send message, please try again.' });
        });
    };

    const handleClose = () => {
        setAlert({ ...alert, open: false });
    };

    const aiImage = isDarkMode 
        ? require('../assets/ai.png')
        : require('../assets/ams.gif');

    return (
        <ContactSection>
            <ImageContainer>
                <ContactImage src={aiImage} alt="Contact Illustration" />
            </ImageContainer>
            <FormContainer>
                <Title>Contact Us</Title>
                <Description>Feel free to contact us and we will get back to you as soon as possible</Description>
                <Form onSubmit={handleSubmit}>
                    <Input 
                        type="text" 
                        name="from_name"
                        placeholder="Your Name" 
                        value={formData.from_name}
                        onChange={handleChange}
                        required 
                    />
                    <Input 
                        type="email" 
                        name="from_mail"
                        placeholder="Your Email" 
                        value={formData.from_mail}
                        onChange={handleChange}
                        required 
                    />
                    {/* Only display ErrorMessage if emailError is not empty */}
                    {emailError && <ErrorMessage>{emailError}</ErrorMessage>}
                    <Textarea 
                         name="message"
                         placeholder="Your Message" 
                         value={formData.message}
                         onChange={handleChange}
                         required 
                    />
                    <SubmitButton type="submit">Send</SubmitButton>
                </Form>
            </FormContainer>

            {/* MUI Snackbar for Alerts */}
            <Snackbar 
                open={alert.open} 
                autoHideDuration={6000} 
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={alert.severity} sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </ContactSection>
    );
};

const ContactSection = styled.section`
    display: flex;
    justify-content: space-between;
    padding: 50px;
    @media (max-width: 768px) {
        flex-direction: column;
        padding: 20px;
    }
`;

const FormContainer = styled.div`
    flex: 1;
    max-width: 400px;
    background-color: var(--card-bg-color); 
    padding: 20px; 
    border-radius: 10px;
    box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.1);
    margin-top: 110px;
`;

const Title = styled.h2`
    font-size: 28px;
    color: var(--text-color);
    margin-bottom: 15px;
`;

const Description = styled.p`
    font-size: 16px;
    color: #7f8c8d;
    margin-bottom: 30px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    font-size: 16px;
    background-color: #f8f8f8;
`;

const Textarea = styled.textarea`
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    font-size: 16px;
    background-color: #f8f8f8;
    resize: none;
    height: 120px;
`;

const SubmitButton = styled.button`
    background-color: var(--button-background-color);
    color: var(--tittle-color);    
    padding: 15px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;

    &:hover {
        background-color: var(--button-background-color-hover);
    }
`;

const ErrorMessage = styled.p`
    color: red;
    font-size: 14px;
    margin: -10px 0 15px 0;
`;

const ImageContainer = styled.div`
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-right: 50px;
    margin-top: 150px;

    @media (max-width: 768px) {
        justify-content: center;
        padding-right: 0;
        margin-bottom: -40px;
    }
`;

const ContactImage = styled.img`
    width: 50%;
    max-width: 600px;
    height: auto;
    object-fit: cover;
    transform: scale(1.3);
    margin-left: -10%;
    
    @media (max-width: 1024px) {
        transform: scale(1.1); 
        margin-left: 0;
        width: 90%;
    }

    @media (max-width: 768px) {
        transform: scale(1); 
    }
`;

export default ContactForm;
