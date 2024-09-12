import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Stack, FormControl, InputAdornment, InputLabel, OutlinedInput, Link, IconButton } from '@mui/material';
import { techStack, getSocialLinks, circleBackgrounds, cogIcons, platforms } from './data'; // Import data for tech stack, social links, circle backgrounds, and cogs
import profile from "../assets/profile.png"; // Ensure this path is correct
import Kemi from "./tittle"; 
import Bdi from '../assets/bdi.png'; 
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'; // Import the double arrow icon
import { Link as ScrollLink } from 'react-scroll';
import { motion } from 'framer-motion'; // Import framer-motion

const Hero = ({ isDarkMode }) => {
  const socialLinks = getSocialLinks(isDarkMode);
  const fullText = 'PT. Bis Data Indonesia'; // Full text to display
  const [displayedText, setDisplayedText] = useState(''); // Text that is being typed
  const [index, setIndex] = useState(0); // Track current index for typing
  const [reset, setReset] = useState(true); // Toggle animation reset based on scroll

  // Typing effect for company name
  useEffect(() => {
    let timeout;

    if (index < fullText.length) {
      timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 100); // Adjust typing speed here (100ms per character)
    } else {
      timeout = setTimeout(() => {
        setDisplayedText('');
        setIndex(0);
      }, 1000); // Adjust delay here before restarting the typing effect
    }

    return () => clearTimeout(timeout);
  }, [index, fullText]);

  // Add scroll event listener to reset animations when scrollY > 500
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = window.innerWidth <= 768 ? 1400 : 500; // Set threshold based on screen size
      if (window.scrollY > scrollThreshold) {
        setReset(false); // Reset animations
      } else {
        setReset(true); // Re-animate when scrolling back up
      }
    };
  
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup function to remove the event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  

  // Common animation properties
  const commonVariants = {
    hidden: { opacity: 0, y: 20 }, // Off-screen and invisible
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeInOut' } },
  };

  // Staggered animation for tech stack items and social links
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Delay of 0.2s between each child
      },
    },
  };

  const staggeredItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate={reset ? 'visible' : 'hidden'} // Toggle animation based on scroll
      variants={commonVariants}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'var(--card-bg-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Render all circle backgrounds */}
      {circleBackgrounds.map((circle, index) => {
        const Component = circle.component;
        return (
          <Component
            key={index}
            custom={index} // Pass the index to control animation delay
            initial="hidden"
            animate={reset ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.6, ease: 'easeOut', delay: index * 0.3 },
              },
            }}
          />
        );
      })}

      {/* Render all cog icons */}
      {cogIcons.map((cog, index) => {
        const Component = cog.component;
        return (
          <Component
            key={index}
            initial="hidden"
            animate={reset ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0, rotate: 0 },
              visible: {
                opacity: 1,
                rotate: 360,
                transition: { duration: 2, ease: 'easeInOut', delay: index * 0.3 },
              },
            }}
            style={{
              top: cog.top,
              left: cog.left,
              width: cog.size,
              height: cog.size,
            }}
          />
        );
      })}

      <Box sx={{ position: 'relative', marginTop: '150px' }}>
        {/* Company Chip in the top-right corner */}
        <motion.div variants={commonVariants} initial="hidden" animate={reset ? 'visible' : 'hidden'}>
          <FormControl
            sx={{
              position: 'absolute',
              top: '-100px',
              right: { xs: 'unset', md: '16px' },
              left: { xs: '50%', md: 'unset' },
              transform: { xs: 'translateX(-50%)', md: 'none' },
              fontWeight: 'bold',
              minWidth: '190px',
            }}
          >
            <InputLabel
              htmlFor="outlined-adornment-amount"
              sx={{
                fontSize: '0.8rem',
                color: 'var(--text-color)',
              }}
            >
              Active
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-amount"
              value={displayedText}
              startAdornment={
                <InputAdornment position="start">
                  <img
                    src={Bdi}
                    style={{ width: '20px', marginLeft: '10px' }}
                    alt="PT. Bis Data Indonesia"
                  />
                </InputAdornment>
              }
              label="Active"
              sx={{
                fontSize: '0.8rem',
                padding: '0',
                height: '32px',
                color: 'var(--text-color)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--text-color)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--text-color)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--text-color)',
                },
              }}
              inputProps={{
                readOnly: true,
              }}
            />
          </FormControl>
        </motion.div>

        {/* Title Section */}
        <Grid container spacing={2} sx={{ marginBottom: '40px' }}>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <motion.div variants={commonVariants} initial="hidden" animate={reset ? 'visible' : 'hidden'}>
              <Box
                sx={{
                  marginLeft: { xs: '0%', md: '-10%' },
                  marginBottom: { xs: '30%', md: '0px' },
                  marginTop: { xs: '-55%', md: '-100px' },
                }}
              >
                <Kemi />
              </Box>
            </motion.div>

            <motion.div variants={commonVariants} initial="hidden" animate={reset ? 'visible' : 'hidden'}>
              <Typography
                variant="h4"  // Keep a fixed variant
                sx={{
                  color: 'var(--tittle-color)',
                  fontWeight: 'bold', // Set to bold
                  fontSize: { xs: '1.25rem', md: '2.125rem' }, // Responsive font size (h6 for xs, h4 for md)
                  marginTop: { xs: '55%', md: '30%' }, // Responsive margin-top
                }}
              >
                PROGRAMMER
              </Typography>
            </motion.div>


            <motion.div variants={commonVariants} initial="hidden" animate={reset ? 'visible' : 'hidden'}>
              <Typography variant="h6" sx={{ my: 2, color: 'var(--text-color)', mt: 10 }}>
                {platforms.map((platform, index) => (
                  <span key={index} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <motion.span
                      whileHover={{ scale: 1.2 }} // Apply hover effect to scale up
                      transition={{ type: 'spring', stiffness: 300 }} // Smooth spring-like transition
                      style={{ cursor: 'pointer', marginRight: '8px' }} // Add margin and pointer
                    >
                      {platform}
                    </motion.span>
                    {index < platforms.length - 1 && <span style={{ marginRight: '8px' }}>|</span>} {/* Add '|' between platforms */}
                  </span>
                ))}
              </Typography>
            </motion.div>

            {/* Tech Stack Icons */}
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              component={motion.div}
              variants={staggerContainer}
              initial="hidden"
              animate={reset ? 'visible' : 'hidden'}
            >
              {techStack.map((tech, index) => (
                <motion.div
                  key={index}
                  variants={staggeredItem} // Apply individual item animation
                  whileHover={{ scale: 1.2 }} // Add hover effect to make the item grow
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                    }}
                  >
                    <span style={{ marginRight: '10px', marginLeft: '10px' }}>
                      {tech.icon}
                    </span>
                    <Typography variant="h6">{tech.name}</Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>

            {/* Social Links Icons */}
            <Typography
              variant="h6"
              sx={{ my: 2, color: 'var(--text-color)', mt: 2 }}
            >
              Social
            </Typography>
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              component={motion.div}
              variants={staggerContainer}
              initial="hidden"
              animate={reset ? 'visible' : 'hidden'}
            >
              {socialLinks.map((tech, index) => (
                <motion.div
                  key={index}
                  variants={staggeredItem} // Apply individual item animation
                  whileHover={{ scale: 1.2 }} // Add hover effect to make the item grow
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                   <a
                    href={tech.href} // Ensure correct link is used
                    target="_blank" // Open link in new tab
                    rel="noopener noreferrer" // Security measure for external links
                    style={{ textDecoration: 'none', color: 'inherit' }} // Style for no underline and inherited color
                  >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                    }}
                  >
                    <span style={{ marginRight: '10px', marginLeft: '10px' }}>
                      {tech.icon}
                    </span>
                    <Typography variant="h6">{tech.name}</Typography>
                  </Box>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Box>
      
      {/* Right Section: Profile Image */}
      <Box
        component={motion.div}
        initial="hidden"
        animate={reset ? 'visible' : 'hidden'}
        variants={commonVariants}
        transition={{ duration: 1, ease: 'easeInOut', delay: 2 }}
        sx={{
          position: { xs: 'static', md: 'absolute' },
          bottom: { xs: 'unset', md: -40 },
          right: { xs: 'unset', md: 0 },
          padding: { xs: '0', md: '20px' },
          mt: { xs: 4, md: 0 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          component="img"
          src={profile}
          alt="Programmer"
          sx={{
            width: '500px',
            height: 'auto',
            marginBottom: { xs: '-100px', md: 'unset' },
            zIndex: '99',
            animation: 'float 4s ease-in-out infinite',
            '&:hover': {
              width: '510px',  // Increase width on hover
            },
            '@keyframes float': {
              '0%': {
                transform: 'translateY(0px)',
              },
              '50%': {
                transform: 'translateY(-10px)',
              },
              '100%': {
                transform: 'translateY(0px)',
              },
            },
          }}
        />
      </Box>

      {/* Scroll Button */}
      <ScrollLink
        to="about"
        smooth={true}
        duration={500}
        spy={true}
        activeClass="active"
      >
        <motion.div
          initial="hidden"
          animate={reset ? 'visible' : 'hidden'}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.5, delay: 0.3 } },
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              boxShadow: '3px 5px 5px rgba(0, 0, 0, 0.2)',
              backgroundColor: 'var(--button-background-color)',
              transition: 'background-color 0.3s ease, transform 0.3s ease',
              '&:hover': {
                backgroundColor: 'var(--button-background-color-hover)',
                transform: 'translateX(-50%) scale(1.1)',
              },
              '@media (max-width: 768px)': {
                backgroundColor: 'var(--button-background-color-mobile)',
                '&:hover': {
                  backgroundColor: 'var(--button-background-color-hover-mobile)',
                  transform: 'translateX(-50%) scale(1.1)',
                },
              },
            }}
          >
            <KeyboardDoubleArrowDownIcon fontSize="large" sx={{ color: 'var(--tittle-color)' }} />
          </IconButton>
        </motion.div>
      </ScrollLink>
    </Box>
  );
};

export default Hero;
