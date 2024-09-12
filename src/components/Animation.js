import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Select, MenuItem, IconButton } from '@mui/material';
import BasicGlobe from './Animation/Globe';
import CarColorPicker from './Animation/Car';
import Car360Viewer from './Animation/360';
import ArtWork from './Animation/Artwork';
import MenuIcon from '@mui/icons-material/Menu';

// Define tab data with icon and name
const tabs = [
  { key: 'carPicker', label: 'Car Color Picker', icon: <img src="https://pngimg.com/uploads/volkswagen/volkswagen_PNG1777.png" alt="Car" style={{ width: '50px', height: '30px' }} /> },
  { key: 'shoes360', label: 'Shoes 360 Viewer', icon: <img src="https://ir.ebaystatic.com/pictures/aw/pics/sneakers/58_c513b4495f.png" alt="Shoes" style={{ width: '50px', height: '30px' }} /> },
  { key: 'globe', label: 'Globe', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Earth_Western_Hemisphere_transparent_background.png" alt="Globe" style={{ width: '30px', height: '30px', marginLeft: '10px' }} /> },
  { key: 'artwork', label: 'Art Work', icon: <img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/e68661bc-4ef3-4c17-8f56-2e06183279b3/d8q8eqc-d4be5479-bd0c-4be4-9ee7-7cf2906f947e.png/v1/fill/w_894,h_894/mario_head_by_esmasrico_d8q8eqc-pre.png" alt="Art Work" style={{ width: '50px', height: '50px' }} /> }, // Make sure the URL is correct
];

const Animation = () => {
  const [selectedTab, setSelectedTab] = useState('carPicker');

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'globe':
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              overflow: 'hidden', // Prevent content from overflowing
            }}
          >
            <BasicGlobe
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: '600px', // Adjust size to fit well
                height: '600px',
              }}
            />
          </Box>
        );
      case 'carPicker':
        return <CarColorPicker />;
      case 'shoes360':
        return <Car360Viewer />;
      case 'artwork':
        return <ArtWork />;
      default:
        return null;
    }
  };

  return (
    <Box
      p={3}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh', // 100vh should be enough for full screen height
        backgroundColor: 'var(--background-color)',
      }}
    >
      {/* Main Card */}
      <Card
        sx={{
          backgroundColor: 'var(--card-bg-color)',
          width: '100%',
          boxShadow: '1px 0px 10px rgba(0,0,0,0.1)', // Shadow around the card
          height: 'auto', // Let the card height adjust dynamically
        }}
      >
        <Box p={3} sx={{display: { xs: 'flex', md: 'none' }}}>
            <Typography
                variant="h2"
                sx={{
                fontSize: { xs: '24px', md: '36px' }, // Smaller font size for mobile
                color: 'var(--text-color)',
                fontWeight: 'bold',
                }}
            >
                Animation
            </Typography>
        </Box>
        {/* Box for two columns: sidebar (left) and content (right) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, // Column layout for mobile (xs), row layout for larger screens (md)
            position: 'relative',
          }}
        >
          {/* Sidebar (Column 1) visible on larger screens */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' }, // Hide sidebar in mobile, show on larger screens
              width: { xs: '100%', md: '20%' }, // Full width for mobile, 20% for larger screens
              backgroundColor: 'var(--card-bg-color)',
              padding: '20px',
              borderRight: { md: '1px solid var(--border-color)' }, // Border only on larger screens
              boxShadow: { md: '2px 0 5px rgba(0,0,0,0.1)' }, // Shadow only for larger screens
              zIndex: 10,
              position: 'relative',
              mb: { xs: 2, md: 0 }, // Margin bottom for mobile to separate sidebar from content
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '24px', md: '36px' }, // Smaller font size for mobile
                color: 'var(--text-color)',
                fontWeight: 'bold',
                marginBottom:'10px',
                display: { xs: 'none', md: 'flex' }
              }}
            >
              Animation
            </Typography>
            <List>
              {tabs.map((tab) => (
                <ListItem
                  key={tab.key}
                  button
                  onClick={() => handleTabChange(tab.key)}
                  sx={{
                    backgroundColor: selectedTab === tab.key ? 'var(--active-tab-bg-color)' : 'inherit',
                    boxShadow: selectedTab === tab.key ? '0px 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    color:'var(--text-color)'
                  }}
                >
                  <ListItemIcon>{tab.icon}</ListItemIcon>
                  <ListItemText primary={tab.label} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Mobile dropdown (visible on mobile) */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' }, // Show only on mobile
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
            }}
          >
           <Select
            value={selectedTab}
            onChange={(e) => handleTabChange(e.target.value)}
            fullWidth
            sx={{
                backgroundColor: 'var(--card-bg-color)',
                borderRadius: '8px',
                color:' var(--text-color)',
                border: '1px solid var(--text-color)'
            }}
            displayEmpty
            >
            {tabs.map((tab) => (
                <MenuItem 
                key={tab.key} 
                value={tab.key} 
                sx={{ display: 'flex', alignItems: 'center', gap: '10px' }} // Ensure icon and text are in the same row with spacing
                >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}> {/* Ensure alignment inside the box */}
                    <img 
                    src={tab.icon.props.src} 
                    alt={tab.label} 
                    style={{ width: '30px', height: '30px' }} // Custom icon size 
                    />
                    <Typography variant="body1">{tab.label}</Typography> {/* Text next to the icon */}
                </Box>
                </MenuItem>
            ))}
            </Select>
          </Box>

          {/* Main Content (Column 2) */}
          <Box
            sx={{
              width: { xs: '100%', md: '80%' }, // Full width for mobile, 80% for larger screens
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '10px',
                width: '100%',
              }}
            >
              {renderContent()}
            </CardContent>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Animation;
