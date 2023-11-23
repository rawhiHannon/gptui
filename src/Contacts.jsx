import React from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

const Contacts = () => {
  return (

    <>
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
