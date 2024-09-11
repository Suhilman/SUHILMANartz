import React, { useState } from 'react';
import './ArtWork.css';

const ColorPickerInput = ({ name, color, handleColorChange }) => {
  const [hexColor, setHexColor] = useState(color);

  const handleColorPickerChange = (e) => {
    const value = e.target.value;
    setHexColor(value);
    handleColorChange({ target: { name, value } });
  };

  return (
    <input
      type="color"
      value={hexColor}
      onChange={handleColorPickerChange}
      className="color-picker-circle"
      name={name}
    />
  );
};

const ArtWork = () => {
    const [colors, setColors] = useState({
        hat: '#fe0000',
        hatLip: '#000000',
        hatLogo: '#000000',
        face: '#efcf86',
        eye: '#fff',
        eyeBrow: '#000000',
        mustache: '#000000',
        mouth: '#000000',
        sideburn: '#000000',
        ear: '#efcf86',
        background: 'transparent'
    });

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        setColors((prevColors) => ({
            ...prevColors,
            [name]: value,
        }));
    };

    const elements = [
        { label: 'Hat Color', name: 'hat' },
        { label: 'Hat Lip Color', name: 'hatLip' },
        { label: 'Hat Logo Color', name: 'hatLogo' },
        { label: 'Face Color', name: 'face' },
        { label: 'Eye Color', name: 'eye' },
        { label: 'Eye Brow Color', name: 'eyeBrow' },
        { label: 'Mustache Color', name: 'mustache' },
        { label: 'Mouth Color', name: 'mouth' },
        { label: 'Sideburn Color', name: 'sideburn' },
        { label: 'Ear Color', name: 'ear' },
    ];

    return (
        <div className="container" style={{ backgroundColor: colors.background }}>
            <div className="character" >
                <div className="hat" style={{ backgroundColor: colors.hat }}></div>
                <div className="hat-lip" style={{ backgroundColor: colors.hatLip }}></div>
                <div className="hat-logo" style={{ backgroundColor: colors.hatLogo }}></div>
                <div className="face" style={{ backgroundColor: colors.face }}></div>
                <div className="eye-brow-right" style={{ backgroundColor: colors.eyeBrow }}></div>
                <div className="eye-right" style={{ backgroundColor: colors.eye }}></div>
                <div className="eye-brow-left" style={{ backgroundColor: colors.eyeBrow }}></div>
                <div className="eye-left" style={{ backgroundColor: colors.eye }}></div>
                <div className="eye-highlight"></div>
                <div className="nose"></div>
                <div className="mustache" style={{ backgroundColor: colors.mustache }}></div>
                <div className="mouth" style={{ backgroundColor: colors.mouth }}></div>
                <div className="sideburn" style={{ backgroundColor: colors.sideburn }}></div>
                <div className="ear" style={{ backgroundColor: colors.ear }}></div>
            </div>

            <div className="controls">
                {elements.map((element, index) => (
                    <div className="color-row" key={index}>
                        <label>{element.label}</label>
                        <ColorPickerInput
                            name={element.name}
                            color={colors[element.name]}
                            handleColorChange={handleColorChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtWork;
