// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   isMobile,
//   isTablet,
//   isBrowser,
//   osName,
//   osVersion,
//   browserName,
//   browserVersion,
//   engineName,
//   engineVersion,
//   deviceType,
//   mobileModel,
//   mobileVendor,
//   isChrome,
//   isFirefox,
//   isSafari,
//   isEdge,
//   isIE,
//   isMacOs,
//   isWindows,
//   isAndroid,
//   isIOS,
// } from 'react-device-detect';

// const GeolocationDemo = () => {
//   const [latitude, setLatitude] = useState(null);
//   const [longitude, setLongitude] = useState(null);
//   const [deviceInfo, setDeviceInfo] = useState({});
//   const [ispInfo, setIspInfo] = useState(null);
//   const [error, setError] = useState(null);
//   const [additionalInfo, setAdditionalInfo] = useState({});

//   const handleFindLocationAndDeviceInfo = () => {
//     if (!navigator.geolocation) {
//       setError("Geolocation is not supported by your browser.");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setLatitude(position.coords.latitude.toFixed(6));
//         setLongitude(position.coords.longitude.toFixed(6));
//         setError(null);

//         const deviceData = {
//           userAgent: navigator.userAgent,
//           platform: navigator.platform,
//           language: navigator.language,
//           screenResolution: `${window.screen.width}x${window.screen.height}`,
//           windowSize: `${window.innerWidth}x${window.innerHeight}`,
//           connection: navigator.connection ? navigator.connection.effectiveType : "Not available",
//           hardwareConcurrency: navigator.hardwareConcurrency || "Not available",
//           isMobile: isMobile,
//           isTablet: isTablet,
//           isBrowser: isBrowser,
//           osName: osName,
//           osVersion: osVersion,
//           browserName: browserName,
//           browserVersion: browserVersion,
//           engineName: engineName,
//           engineVersion: engineVersion,
//           deviceType: deviceType || "Unknown",
//           mobileModel: mobileModel || "Unknown",
//           mobileVendor: mobileVendor || "Unknown",
//           isChrome: isChrome,
//           isFirefox: isFirefox,
//           isSafari: isSafari,
//           isEdge: isEdge,
//           isIE: isIE,
//           isMacOs: isMacOs,
//           isWindows: isWindows,
//           isAndroid: isAndroid,
//           isIOS: isIOS,
//         };
//         setDeviceInfo(deviceData);

//         fetch(`https://ipinfo.io/json`) // Replace with your API key
//           .then((response) => response.json())
//           .then((data) => setIspInfo(data))
//           .catch((err) => setError("Failed to retrieve ISP information."));
//       },
//       (error) => {
//         setError("Failed to retrieve location.");
//       }
//     );
//   };

//   useEffect(() => {
//     if (navigator.getBattery) {
//       navigator.getBattery().then((battery) => {
//         setAdditionalInfo((prevState) => ({
//           ...prevState,
//           batteryLevel: (battery.level * 100) + "%",
//           charging: battery.charging ? "Yes" : "No",
//         }));
//       });
//     }
//   }, []);

//   return (
//     <div className="container">
//       <h1>Extended Device and Geolocation Info</h1>
//       <button onClick={handleFindLocationAndDeviceInfo}>Find Location and Device Info</button>
//       {latitude && longitude && (
//         <div>
//           <p>Latitude: {latitude}</p>
//           <p>Longitude: {longitude}</p>
//         </div>
//       )}
//       {deviceInfo.userAgent && (
//         <div>
//           <h2>Device Information</h2>
//           <p>User Agent: {deviceInfo.userAgent}</p>
//           <p>Platform: {deviceInfo.platform}</p>
//           <p>Language: {deviceInfo.language}</p>
//           <p>Screen Resolution: {deviceInfo.screenResolution}</p>
//           <p>Window Size: {deviceInfo.windowSize}</p>
//           <p>Connection Type: {deviceInfo.connection}</p>
//           <p>Logical Processors: {deviceInfo.hardwareConcurrency}</p>
//           <p>Is Mobile: {deviceInfo.isMobile ? "Yes" : "No"}</p>
//           <p>Is Tablet: {deviceInfo.isTablet ? "Yes" : "No"}</p>
//           <p>Is Browser: {deviceInfo.isBrowser ? "Yes" : "No"}</p>
//           <p>Operating System: {deviceInfo.osName} {deviceInfo.osVersion}</p>
//           <p>Browser: {deviceInfo.browserName} {deviceInfo.browserVersion}</p>
//           <p>Browser Engine: {deviceInfo.engineName} {deviceInfo.engineVersion}</p>
//           <p>Device Type: {deviceInfo.deviceType}</p>
//           <p>Mobile Model: {deviceInfo.mobileModel}</p>
//           <p>Mobile Vendor: {deviceInfo.mobileVendor}</p>
//           <p>Is Chrome: {deviceInfo.isChrome ? "Yes" : "No"}</p>
//           <p>Is Firefox: {deviceInfo.isFirefox ? "Yes" : "No"}</p>
//           <p>Is Safari: {deviceInfo.isSafari ? "Yes" : "No"}</p>
//           <p>Is Edge: {deviceInfo.isEdge ? "Yes" : "No"}</p>
//           <p>Is IE: {deviceInfo.isIE ? "Yes" : "No"}</p>
//           <p>Is MacOS: {deviceInfo.isMacOs ? "Yes" : "No"}</p>
//           <p>Is Windows: {deviceInfo.isWindows ? "Yes" : "No"}</p>
//           <p>Is Android: {deviceInfo.isAndroid ? "Yes" : "No"}</p>
//           <p>Is iOS: {deviceInfo.isIOS ? "Yes" : "No"}</p>
//         </div>
//       )}
//       {ispInfo && (
//         <div>
//           <h2>ISP Information</h2>
//           <p>IP: {ispInfo.ip}</p>
//           <p>ISP: {ispInfo.org}</p>
//           <p>City: {ispInfo.city}</p>
//           <p>Region: {ispInfo.region}</p>
//           <p>Country: {ispInfo.country}</p>
//         </div>
//       )}
//       {additionalInfo.batteryLevel && (
//         <div>
//           <h2>Battery Information</h2>
//           <p>Battery Level: {additionalInfo.batteryLevel}</p>
//           <p>Charging: {additionalInfo.charging}</p>
//         </div>
//       )}
//       {error && <p>{error}</p>}
//     </div>
//   );
// };

// export default GeolocationDemo;
