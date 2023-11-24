import React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

const Contacts = () => {
  return (

    <>

      <div className="sidebar-header">
        <Avatar sx={{ bgcolor: "gray" }} style={{ width: "40px", height: "40px", marginRight: "10px" }} />
    
        <div className="header-icons">
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><ArchiveIcon /></IconButton>
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><PersonAddIcon /></IconButton>
          <IconButton style={{ color: '#3f6eb5', outline: 'none' }}><SettingsIcon /></IconButton>
        </div>
      </div>

    <div className="search-ph">
    <TextField
    className="search-box"
    variant="standard" 
    placeholder="Search..."
    InputProps={{
      disableUnderline: true,
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
  />

</div>
    <div className="assistant-list">
    <div className="assistant-tab active">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Pizzaa</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    <div className="assistant-tab">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Bezeq Support</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    <div className="assistant-tab">
    <div className="avatar"></div>
      <div>
        <span className="assistant-name">Panda Support</span>
        <div className="last-message">Last message...</div>
      </div>
    </div>
    
    {/* ... more assistant tabs ... */}
  </div>
  </>
  );
};

export default Contacts;
