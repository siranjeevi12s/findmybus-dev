import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E293B', // Slate 800 - professional dark navy
      light: '#475569', // Slate 600
      dark: '#0F172A', // Slate 900
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B', // Amber 500 - School bus yellow
      light: '#FBBF24', // Amber 400
      dark: '#D97706', // Amber 600
      contrastText: '#0F172A',
    },
    background: {
      default: '#F8FAFC', // Slate 50 - clean off-white background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#475569', // Slate 600
    },
    divider: '#E2E8F0', // Slate 200
  },
  typography: {
    fontFamily: ['"Inter"', '"Outfit"', '"Roboto"', 'sans-serif'].join(','),
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#0F172A',
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      color: '#0F172A',
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#0F172A',
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#0F172A',
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#0F172A',
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      color: '#0F172A',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.925rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
            },
          },
        },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          padding: '8px',
        },
      },
    },
  },
});

export default theme;
