// Script to manage the Daily Stock Review functionality

// Elements
const form = document.getElementById('candlestick-form');
const recordList = document.getElementById('record-list');
const graphContainer = document.getElementById('candlestick-graph');

// Data Storage
const records = [];
const graphData = [];

// Backend API URL
const apiUrl = 'https://stockreviewweb-backend.onrender.com/api/stocks'

// Function to check if date is a weekend
function isWeekend(date) {
    // Convert string date to Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);
    // Adjust for UTC timezone
    const utcDay = dateObj.getUTCDay();
    return utcDay === 6 || utcDay === 0; // 6 is Saturday, 0 is Sunday
}

// Function to fetch data from the backend
function fetchData() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data);
            graphData.length = 0;
            records.length = 0;
            recordList.innerHTML = '';

            // Filter out weekends
            data.filter(record => !isWeekend(record.date)).forEach(record => {
                records.push(record);
                graphData.push({
                    x: new Date(record.date).getTime(),
                    y: [
                        parseFloat(record.open),
                        parseFloat(record.high),
                        parseFloat(record.low),
                        parseFloat(record.close)
                    ]
                });
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
            graphData.push({
                x: new Date(savedRecord.date).getTime(),
                y: [
                    parseFloat(savedRecord.open),
                    parseFloat(savedRecord.high),
                    parseFloat(savedRecord.low),
                    parseFloat(savedRecord.close)
                ]
            });
            renderRecord(savedRecord);
            updateGraph();
        })
        .catch(error => console.error('Error saving record:', error));
}

// Function to render a record in the list
function renderRecord(record) {
    const link = document.createElement('a');
    const formattedDate = record.date.split('T')[0];
    link.textContent = `${formattedDate} 复盘`;
    link.href = '#';
    link.classList.add('record-link');
    link.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`Review for ${formattedDate}\nOpen: ${record.open}\nClose: ${record.close}\nHigh: ${record.high}\nLow: ${record.low}`);
    });

    recordList.appendChild(link);
}

// Function to update the graph
function updateGraph() {
    console.log('Updating graph with data:', graphData);

    const options = {
        series: [{
            data: graphData
        }],
        chart: {
            type: 'candlestick',
            height: 350,
            width: '100%'
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#ef5350',   // Red for rise
                    downward: '#26a69a'  // Green for fall
                }
            }
        },
        title: {
            text: 'Stock Candlestick Chart',
            align: 'left'
        },
        xaxis: {
            type: 'datetime',
            labels: {
                formatter: function(val) {
                    const date = new Date(val);
                    if (isWeekend(date)) {
                        return ''; // Hide weekend dates
                    }
                    return date.toLocaleDateString();
                }
            },
            tickAmount: 'dataPoints',
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            }
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        }
    };

    document.querySelector('#candlestick-graph').innerHTML = '';
    const chart = new ApexCharts(document.querySelector('#candlestick-graph'), options);
    chart.render();
}

// Form Submission
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = form.date.value;
    
    // Check if selected date is a weekend
    if (isWeekend(date)) {
        alert('Weekend data cannot be added. Stock market is closed on weekends.');
        return;
    }

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
