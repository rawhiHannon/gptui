import React, { useState, useRef, useEffect } from 'react';
import { FormGroup, Label, Input } from 'reactstrap';
import { FaEdit } from 'react-icons/fa';

const ColorPicker = ({ name, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorPickerRef = useRef(null);

  const handleColorChange = (e) => {
    onChange(e.target.value, name);
  };

  const handleColorPickerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (e) => {
    if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <FormGroup>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{ width: '20px', height: '20px', marginRight: '10px', borderRadius: '3px' }}
          onClick={handleColorPickerClick}
        ></div>
        
          <div ref={colorPickerRef}>
            <input type="color" value={value} onChange={handleColorChange} />
          </div>
      </div>
    </FormGroup>
  );
};

export default ColorPicker;