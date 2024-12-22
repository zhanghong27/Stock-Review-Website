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
const apiUrl = 'https://stockreviewweb-backend.onrender.com/api/stocks'

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
    // Transform data for candlestick chart
    const chartData = graphData.map(record => ({
        x: record.date, // Date
        y: [record.open, record.high, record.low, record.close] // Candlestick values
    }));

    // Configure the candlestick chart
    const options = {
        series: [{
            name: 'Stock Data',
            data: chartData
        }],
        chart: {
            type: 'candlestick',
            height: 350
        },
        title: {
            text: 'Stock Candlestick Chart',
            align: 'left'
        },
        xaxis: {
            type: 'datetime',
            title: {
                text: 'Date'
            }
        },
        yaxis: {
            tooltip: {
                enabled: true
            },
            title: {
                text: 'Price'
            }
        }
    };

    // Clear the existing chart and render the new one
    const chartContainer = document.querySelector('#candlestick-graph');
    chartContainer.innerHTML = ''; // Clear previous chart
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
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
