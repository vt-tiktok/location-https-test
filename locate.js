
// Configuration
// const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxEA5mPcwetsiBQ--UEGka1INVKtFRqgQd7ccTOhHVSmif7Fmoh8w9srU29uVG_39n/exec';

// Replace with your deployed Google Apps Script URL

// const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxEA5mPcwetsiBQ--UEGka1INVKtFRqgQd7ccTOhHVSmif7Fmoh8w9srU29uVG_39n/exec';

(function() {
    // Configuration - Change this to your deployed Google Apps Script URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxEA5mPcwetsiBQ--UEGka1INVKtFRqgQd7ccTOhHVSmif7Fmoh8w9srU29uVG_39n/exec';
    
    // Check if the script URL is properly set
    if (SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_DEPLOYMENT_URL_HERE')) {
        console.error('❌ Please update SCRIPT_URL with your actual Google Apps Script deployment URL');
        showError('Configuration error: Please contact administrator');
        return;
    }
    
    // Auto-execute when script loads
    document.addEventListener('DOMContentLoaded', function() {
        // Add a small delay to ensure page is fully loaded
        setTimeout(initiateLocationCapture, 500);
    });

    function initiateLocationCapture() {
        console.log('📍 Starting automatic location capture...');
        
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your browser');
            return;
        }
        
        // Check if we're running on HTTPS (required for geolocation in production)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            showError('Geolocation requires HTTPS. This page is not secure.');
            return;
        }

        // Show loading state
        showStatus('Requesting location access...', 'loading');

        // Get precise location
        navigator.geolocation.getCurrentPosition(
            function(position) {
                handleLocationSuccess(position);
            },
            function(error) {
                handleLocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }

    function handleLocationSuccess(position) {
        showStatus('Location acquired. Saving to drive...', 'loading');
        
        // Prepare the complete JSON data
        const jsonData = {
            location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
            },
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: {
                    width: screen.width,
                    height: screen.height
                }
            },
            timestamp: new Date().toISOString(),
            pageInfo: {
                url: window.location.href,
                title: document.title,
                referrer: document.referrer
            },
            captureType: 'automatic_browser_capture'
        };

        // Send to Google Apps Script
        sendToGoogleDrive(jsonData);
    }

    function handleLocationError(error) {
        let errorMessage;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please allow location access to use this feature.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your connection.';
                break;
            case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
            default:
                errorMessage = 'Unable to retrieve your location.';
        }
        showError(errorMessage);
    }

    async function sendToGoogleDrive(data) {
        try {
            showStatus('Sending data to Google Drive...', 'loading');
            
            // Use a try-catch with a fallback for fetch errors
            let response;
            try {
                response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error('Network error. Please check your connection and try again.');
            }

            // Check if response is OK
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', response.status, errorText);
                throw new Error(`Server error: ${response.status}. Please try again later.`);
            }

            const result = await response.json();
            
            if (result.success) {
                showSuccess('Location data saved successfully!');
                console.log('✅ File created:', result.fileUrl);
            } else {
                throw new Error(result.error || 'Failed to save data');
            }
        } catch (error) {
            console.error('❌ Error sending data:', error);
            
            // More specific error messages
            if (error.message.includes('Network error')) {
                showError('Network error. Please check your internet connection.');
            } else if (error.message.includes('Server error')) {
                showError('Server error. Please try again later.');
            } else if (error.message.includes('Failed to fetch')) {
                showError('Connection failed. Please check if the server URL is correct.');
            } else {
                showError('Failed to save location data: ' + error.message);
            }
        }
    }

    function showStatus(message, type = 'loading') {
        console.log('📋 Status:', message);
        
        // Create or update status element in HTML
        let statusEl = document.getElementById('locationStatus');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'locationStatus';
            statusEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                max-width: 300px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(statusEl);
        }

        statusEl.textContent = message;
        
        switch (type) {
            case 'loading':
                statusEl.style.background = '#e3f2fd';
                statusEl.style.color = '#0d47a1';
                statusEl.style.border = '1px solid #bbdefb';
                break;
            case 'success':
                statusEl.style.background = '#e8f5e8';
                statusEl.style.color = '#2e7d32';
                statusEl.style.border = '1px solid #c8e6c9';
                break;
            case 'error':
                statusEl.style.background = '#ffebee';
                statusEl.style.color = '#c62828';
                statusEl.style.border = '1px solid #ffcdd2';
                break;
        }

        // Auto-hide after 5 seconds for success, 8 for errors
        const hideTime = type === 'success' ? 5000 : 8000;
        setTimeout(() => {
            if (statusEl && document.body.contains(statusEl)) {
                statusEl.style.opacity = '0';
                statusEl.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (statusEl && document.body.contains(statusEl)) {
                        document.body.removeChild(statusEl);
                    }
                }, 500);
            }
        }, hideTime);
    }

    function showSuccess(message) {
        showStatus('✅ ' + message, 'success');
    }

    function showError(message) {
        showStatus('❌ ' + message, 'error');
    }

    // Add some basic styles for better visibility
    const style = document.createElement('style');
    style.textContent = `
        #locationStatus {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    console.log('📍 Location capture script loaded successfully');
})();






















// // DOM Elements
// const statusElement = document.getElementById('status');
// const captureBtn = document.getElementById('captureBtn');
// const locationDataElement = document.getElementById('locationData');
// const latitudeElement = document.getElementById('latitude');
// const longitudeElement = document.getElementById('longitude');
// const accuracyElement = document.getElementById('accuracy');
// const mapsLinkElement = document.getElementById('mapsLink');
// const timestampElement = document.getElementById('timestamp');

// // Capture location function
// async function captureLocation() {
//     statusElement.textContent = 'Requesting location access...';
//     captureBtn.disabled = true;
    
//     if (!navigator.geolocation) {   
//         statusElement.textContent = 'Geolocation is not supported by this browser.';
//         captureBtn.disabled = false;
//         return;
//     }
    
//     try {
//         const position = await new Promise((resolve, reject) => {
//             navigator.geolocation.getCurrentPosition(resolve, reject, {
//                 enableHighAccuracy: true,
//                 timeout: 10000,
//                 maximumAge: 0
//             });
//         });
        
//         // Extract location data
//         const latitude = position.coords.latitude;
//         const longitude = position.coords.longitude;
//         const accuracy = position.coords.accuracy;
//         const timestamp = new Date(position.timestamp);
        
//         // Format date for filename (GMT+7)
//         const gmt7Time = new Date(timestamp.getTime() + (7 * 60 * 60 * 1000));
//         const dateString = gmt7Time.toISOString().slice(0, 19).replace(/:/g, '-');
        
//         // Display location data
//         latitudeElement.textContent = latitude;
//         longitudeElement.textContent = longitude;
//         accuracyElement.textContent = `${accuracy} meters`;
//         mapsLinkElement.href = `https://www.google.com/maps/place/${latitude},${longitude}`;
//         timestampElement.textContent = timestamp.toLocaleString();
//         locationDataElement.style.display = 'block';
        
//         statusElement.textContent = 'Location captured! Sending to Google Drive...';
        
//         // Create text content for the file
//         const fileContent = 
//             `Location captured\n` +
//             `Latitude: ${latitude}\n` +
//             `Longitude: ${longitude}\n` +
//             `Accuracy: ${accuracy} meters\n` +
//             `Google Maps: https://www.google.com/maps/place/${latitude},${longitude}\n` +
//             `Date: ${timestamp.toLocaleString()}\n` +
//             `Timestamp: ${timestamp.getTime()}\n` +
//             `User Agent: ${navigator.userAgent}\n`;
        
//         // Create filename
//         const filename = `location_${dateString}.txt`;
        
//         // Send to Google Apps Script
//         await sendToGoogleDrive(filename, fileContent, latitude, longitude, accuracy);
        
//         statusElement.textContent = 'Location data saved to Google Drive successfully!';
        
//     } catch (error) {
//         console.error('Error getting location:', error);
//         statusElement.textContent = `Error: ${error.message}`;
//         captureBtn.disabled = false;
//     }
// }

// // Send data to Google Apps Script
// async function sendToGoogleDrive(filename, content, lat, lon, acc) {
//     try {
//         const formData = new FormData();
//         formData.append('filename', filename);
//         formData.append('content', content);
//         formData.append('latitude', lat);
//         formData.append('longitude', lon);
//         formData.append('accuracy', acc);
//         formData.append('type', 'location');
        
//         const response = await fetch(GOOGLE_SCRIPT_URL, {
//             method: 'POST',
//             body: formData
//         });
        
//         const result = await response.text();
//         console.log('Google Apps Script response:', result);
        
//     } catch (error) {
//         console.error('Error sending to Google Drive:', error);
//         throw new Error('Failed to save location data to Google Drive');
//     }
// }

// // Event listener
// captureBtn.addEventListener('click', captureLocation);
