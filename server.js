const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const TIMEOUT_MS = 500;

let numberWindow = [];

// Mapping IDs to test server endpoints
const idMap = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
};

const TEST_SERVER_URL = 'http://20.244.56.144/evaluation-service'; 

// Utility to fetch numbers from test server
async function fetchNumbersFromServer(type) {
    const url = `${TEST_SERVER_URL}/${type}`;

    try {
        const response = await axios.get(url, {
            timeout: TIMEOUT_MS,
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY_HERE' 
            }
        });

        if (response.data && Array.isArray(response.data.numbers)) {
            return response.data.numbers;
        }
    } catch (error) {
        console.error(`Error fetching from ${type}:`, error.message);
    }

    return [];
}

// Ensure unique entries in window
function updateWindow(newNumbers) {
    for (let num of newNumbers) {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= WINDOW_SIZE) {
                numberWindow.shift(); 
            }
            numberWindow.push(num); 
        }
    }
}

// Calculate average of current window
function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
}

// Route: /numbers/:numberid
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    if (!idMap[numberid]) {
        return res.status(400).json({ error: "Invalid number ID" });
    }

    const prevWindow = [...numberWindow];

    const newNumbers = await fetchNumbersFromServer(idMap[numberid]);

    updateWindow(newNumbers);

    const avg = calculateAverage(numberWindow);

    return res.json({
        windowPrevState: prevWindow,
        windowCurrentState: numberWindow,
        average: avg
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
