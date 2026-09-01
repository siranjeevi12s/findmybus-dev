import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 260;

const DashboardLayout = () => {
  const { school, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Buses', icon: <DirectionsBusIcon />, path: '/buses' },
    { text: 'Drivers', icon: <PersonIcon />, path: '/drivers' },
    { text: 'Assignments', icon: <SwapHorizIcon />, path: '/assignments' },
    { text: 'Students', icon: <PeopleIcon />, path: '/students' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Title */}
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <DirectionsBusIcon sx={{ color: 'secondary.main', mr: 1, fontSize: 30 }} />
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 800,
            letterSpacing: -0.5,
            color: 'primary.contrastText',
          }}
        >
          FindMyBus
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'primary.light', opacity: 0.1 }} />
      
      {/* Navigation List */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '10px',
                  bgcolor: isActive ? 'secondary.main' : 'transparent',
                  color: isActive ? 'secondary.contrastText' : 'primary.contrastText',
                  opacity: isActive ? 1 : 0.7,
                  '&:hover': {
                    bgcolor: isActive ? 'secondary.main' : 'rgba(255,255,255,0.08)',
                    opacity: 1,
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'secondary.contrastText' : 'primary.contrastText',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 500 }}>{item.text}</Typography>}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sidebar Footer Logout */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: 'primary.light', opacity: 0.1, mb: 2 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            color: '#ef4444', // red 500
            opacity: 0.8,
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              opacity: 1,
            },
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>Log Out</Typography>} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top Header App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Current Page Section Title */}
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Admin Module'}
          </Typography>

          {/* Profile Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {school?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {school?.email}
              </Typography>
            </Box>
            
            <Tooltip title="Account settings">
              <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', width: 40, height: 40, fontWeight: 700 }}>
                  {school?.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    mt: 1,
                    minWidth: 150,
                  },
                },
              }}
            >
              <MenuItem onClick={handleMenuClose} disabled>
                <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Log Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile View Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop View Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Page Content Body */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Spacer below header */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
