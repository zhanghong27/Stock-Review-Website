// Script to manage the Daily Stock Review functionality

// Elements
const form = document.getElementById('candlestick-form');
const recordList = document.getElementById('record-list');
const graphCanvas = document.getElementById('candlestick-graph');
const ctx = graphCanvas.getContext('2d');

// Data Storage
const records = [];
const graphData = [];

// Backend API URL
const apiUrl = 'https://<your-backend-url>/api/stocks'; // Replace with your backend URL

// Function to fetch data from the backend
function fetchData() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Debugging log
            graphData.length = 0; // Clear existing graph data
            records.length = 0; // Clear existing records

            data.forEach(record => {
                records.push(record);
                graphData.push(record);
                renderRecord(record);
            });

            updateGraph();
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to add a record
function addRecord(date, open, close, high, low) {
    const record = {
        date,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low)
    };

    // Save record to backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save record');
            }
            return response.json();
        })
        .then(savedRecord => {
            console.log('Record saved:', savedRecord); // Debugging log
            records.push(savedRecord);
            graphData.push(savedRecord);
            renderRecord(savedRecord);
            updateGraph();
        })
        .catch(error => console.error('Error saving record:', error));
}

// Function to render a record in the list
function renderRecord(record) {
    const link = document.createElement('a');
    link.textContent = `${record.date} 复盘`;
    link.href = '#';
    link.classList.add('record-link');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`Review for ${record.date}\nOpen: ${record.open}\nClose: ${record.close}\nHigh: ${record.high}\nLow: ${record.low}`);
    });

    recordList.appendChild(link);
}

// Function to update the graph
function updateGraph() {
    const labels = graphData.map(record => record.date);
    const datasets = [
        {
            label: 'Open',
            data: graphData.map(record => record.open),
            borderColor: 'blue',
            fill: false
        },
        {
            label: 'Close',
            data: graphData.map(record => record.close),
            borderColor: 'green',
            fill: false
        },
        {
            label: 'High',
            data: graphData.map(record => record.high),
            borderColor: 'red',
            fill: false
        },
        {
            label: 'Low',
            data: graphData.map(record => record.low),
            borderColor: 'orange',
            fill: false
        }
    ];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

// Form Submission
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = new Date().toISOString().split('T')[0];
    const open = form.open.value;
    const close = form.close.value;
    const high = form.high.value;
    const low = form.low.value;

    addRecord(date, open, close, high, low);
    console.log(records);
    form.reset();
});

// Fetch and render data on page load
fetchData();
