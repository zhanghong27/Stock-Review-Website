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
    const utcOffset = 8; // Offset for China Standard Time (CST) in hours
    const chineseDate = new Date(dateObj.getTime() + utcOffset * 60 * 60 * 1000);
    
    // Get the day in Chinese timezone (0 = Sunday, 6 = Saturday)
    const day = chineseDate.getUTCDay();
    return day === 0 || day === 6; // Sunday or Saturday in Chinese timezone
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

            // Sort data by date first
            const sortedData = data.sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Filter out weekends and process data
            sortedData
                .filter(record => !isWeekend(record.date))
                .forEach(record => {
                    records.push(record);
                    // Adjust the date for China timezone
                    const date = new Date(record.date);
                    const utcOffset = 8; // CST offset
                    const localDate = new Date(date.getTime() + utcOffset * 60 * 60 * 1000);
                    
                    graphData.push({
                        x: localDate,
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
            console.log('Record saved:', savedRecord);
            records.push(savedRecord);
            
            // Adjust the date for China timezone
            const date = new Date(savedRecord.date);
            const utcOffset = 8; // CST offset
            const localDate = new Date(date.getTime() + utcOffset * 60 * 60 * 1000);
            
            graphData.push({
                x: localDate.getTime(),
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
                    downward: '#00ab6b'  // Green for fall
                }
            }
        },
        title: {
            text: 'Stock Candlestick Chart',
            align: 'left'
        },
        xaxis: {
            type: 'category',
            labels: {
                formatter: function(val) {
                    return dayjs(val).format('YYYY-MM-DD');
                }
            },
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
