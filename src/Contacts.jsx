import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

const drawerWidth = 300;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Contacts = ({ open, setOpen, agents, currentAgentId, setCurrentAgentId }) => {
  const theme = useTheme();
  // const [open, setOpen] = React.useState(true);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
        <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            variant="persistent"
            anchor="left"
            open={open}
          >

          <div className="drawer-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
                <Typography variant="h6" style={{ marginRight: "10px" }}>
                  Customer
                </Typography>
              </div>
              <div>
                <IconButton onClick={handleDrawerClose} style={{ outline: 'none', color: '#3f6eb5' }}>
                  {theme.direction === 'ltr' ? <MenuOpenIcon /> : <MenuOpenIcon />}
                </IconButton>
              </div>
            </div>
          </div>


          <div className="assistant-list">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className={`assistant-tab ${currentAgentId == agent.id ? 'active' : ''}`}
                onClick={() => setCurrentAgentId(agent.id)}
              >
                <Avatar className="contactAvatar" src={agent.profile_pic} style={{ marginRight: '10px' }} />
                <div>
                  <span className="assistant-name">{agent.name}</span>
                  <div className="last-message">{agent.last_message}</div>
                </div>
              </div>
            ))}
          </div>

          </Drawer>
      </Box>
  );
};

export default Contacts;
