import React, { useState } from "react";

// The base URL for the car image with dynamic color
const baseURL =
  "https://ddools.imgix.net/cars/base.png?w=600&mark-align=center,middle&mark=https%3A%2F%2Fddools.imgix.net%2Fcars%2Fpaint.png%3Fw%3D600%26bri%3D-18%26con%3D26%26monochrome%3D";

const CarColorPicker = () => {
  // Initial state for the car color
  const [hex, setHex] = useState("000000"); // Default to black

  // Function to change the color when a predefined color is clicked
  const changeColor = (newHex) => {
    if (newHex === "none") {
      setHex(""); // Reset to default
    } else {
      setHex(newHex); // Set selected color
    }
  };

  // Log the final image URL to debug
  const imageUrl = `${baseURL}${hex}`;
  console.log("Constructed Image URL:", imageUrl);

  return (
    <div className="container">
      {/* Column 1: Product Image */}
      <div className="car-column">
        <img
          id="productImage"
          src={imageUrl} // Use the constructed URL
          alt="Customizable Car"
          className="responsive-car-image" // Apply class for responsive styling
        />
      </div>

      {/* Column 2: Color Picker */}
      <div className="color-column">
        <div className="colors">
          <div
            className="color"
            style={{ backgroundColor: "#000000" }}
            onClick={() => changeColor("000000")}
          />
          <div
            className="color"
            style={{ backgroundColor: "#0d4671" }}
            onClick={() => changeColor("0d4671")}
          />
          <div
            className="color"
            style={{ backgroundColor: "#63803a" }}
            onClick={() => changeColor("63803a")}
          />
          <div
            className="color"
            style={{ backgroundColor: "#841210" }}
            onClick={() => changeColor("841210")}
          />
          <div
            className="color"
            style={{ backgroundColor: "#a09e9f" }}
            onClick={() => changeColor("none")}
          />
        </div>
      </div>

      {/* Styles for color picker and layout */}
      <style jsx>{`
        .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .car-column {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .color-column {
          flex: 0.3;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .colors {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .color {
          height: 36px;
          width: 36px;
          border-radius: 18px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
          border: 2px solid #aaa;
          cursor: pointer;
        }

        .responsive-car-image {
          width: 120vh; /* Default width for large screens */
          height: auto;
        }

        @media (max-width: 768px) {
          .container {
            flex-direction: column; /* Stacks car image and color picker in a column */
            gap: 30px;
          }

          .color-column {
            order: 2; /* Moves color column below car column */
          }

          .colors {
            flex-direction: row; /* Arrange color options in a row */
            justify-content: space-around;
            align-items: center;
            width: 100%; /* Makes color picker take full width */
          }

          .responsive-car-image {
            width: 100%; /* Make image full width in mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default CarColorPicker;
