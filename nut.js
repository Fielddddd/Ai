function validateFileType(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return fileExtension === 'csv';
}

async function generateForecast() {
    const monthInput = document.getElementById('monthInput').value;
    const vegetableSelect = document.getElementById('vegetableSelect').value;
    const fileInput = document.getElementById('fileInput').files[0];

    if (!monthInput) {
        alert('กรุณาเลือกเดือนและปี');
        return;
    }
    if (!vegetableSelect) {
        alert('กรุณาเลือกชื่อผัก');
        return;
    }
    if (!fileInput) {
        alert('กรุณาอัปโหลดไฟล์');
        return;
    }

    if (!validateFileType(fileInput)) {
        alert('ไฟล์ที่อัปโหลดต้องเป็นนามสกุล .csv เท่านั้น');
        return;
    }

    const formData = new FormData();
    formData.append('month', monthInput);
    formData.append('vegetable', vegetableSelect);
    formData.append('file', fileInput);

    try {
        const response = await fetch("http://localhost:8000/upload_csv", {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const forecastData = await response.json();
        console.log('Forecast data:', forecastData); // Logging the data from API for debugging
        calculatePlantingSchedule(forecastData, vegetableSelect); // Call function to calculate planting schedule
    } catch (error) {
        console.error('Error:', error);
    }
}

function getPlantsPerKg(vegetableType, month) {
    const plantsPerKg = {
        "Frillice": { may: 12, june: 10, default: 7 },
        "GreenOak": { may: 12, june: 10, default: 7 },
        "RedCoral": { may: 13, june: 11, default: 8 },
        "RedOak": { may: 13, june: 11, default: 8 }
    };

    if (month === 5) {
        return plantsPerKg[vegetableType].may; // May
    } else if (month === 6) {
        return plantsPerKg[vegetableType].june; // June
    } else {
        return plantsPerKg[vegetableType].default; // Other months
    }
}

function calculatePlantingSchedule(data, vegetable) {
    const growthTimes = {
        'RedOak': { seeding: 7, transplanting: 35, harvesting: 1 },
        'GreenOak': { seeding: 7, transplanting: 35, harvesting: 1 },
        'RedCoral': { seeding: 7, transplanting: 35, harvesting: 1 },
        'Frillice': { seeding: 7, transplanting: 35, harvesting: 1 }
    };

    const vegetableGrowth = growthTimes[vegetable];
    if (!vegetableGrowth) {
        console.error('Invalid vegetable selected');
        return;
    }

    const seedingTime = vegetableGrowth.seeding;
    const transplantingTime = vegetableGrowth.transplanting;
    const harvestingTime = vegetableGrowth.harvesting;

    const monthIndex = new Date(document.getElementById('monthInput').value).getMonth(); // Get month index (0-11)


    const predictedSales = data.predicted_sales[0][monthIndex];
    
    if (predictedSales == null) {
        console.error('No predicted sales data for the selected month');
        return;
    }

    const quantityForWeek = Math.ceil(predictedSales / 3);

    console.log("Month Index: ", monthIndex);
    const month = monthIndex + 1;
    console.log("Month: ", month);

    const plantsPerKg = getPlantsPerKg(vegetable, month);

    const totalRequiredPlants = Math.ceil(quantityForWeek * plantsPerKg); 

    const startDate = new Date(document.getElementById('monthInput').value + '-01');

    const plantingSchedule = [];

 for (let i = 0; i < 3; i++) {
    const roundStartDate = new Date(startDate);
    roundStartDate.setDate(roundStartDate.getDate() + i * 10); 

    const harvestDate = new Date(roundStartDate);
    harvestDate.setDate(harvestDate.getDate() - 42); 

    const transplantDate = new Date(roundStartDate); 
    transplantDate.setDate(transplantDate.getDate() - 35);


    plantingSchedule.push({
        week: i + 1,
        quantity: totalRequiredPlants, 
        startDate: roundStartDate,
        transplantDate: transplantDate,
        harvestDate: harvestDate
    });
}



    // แสดงตารางการปลูก
    displayForecast(plantingSchedule);
}


// Function to display forecast data in a table
function displayForecast(data) {
    document.getElementById('forecastResult').style.display = "flex"
    const tableContainer = document.getElementById('forecastResult');
    tableContainer.innerHTML = ''; // Clear previous data

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Create table header
    const headerRow = document.createElement('tr');
    const headers = ['รอบที่ปลูก', 'จำนวน', 'วันที่เริ่มเพาะเมล็ด', 'วันที่เริ่มลงแปลง', 'วันที่เริ่มเก็บ'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.style.border = '1px solid #000';
        th.style.padding = '10px';
        th.style.backgroundColor = '#f2f2f2';
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Populate table rows with data
    data.forEach(forecast => {
        const row = document.createElement('tr');
        const values = [forecast.week, forecast.quantity, forecast.harvestDate.toDateString(), forecast.transplantDate.toDateString(), forecast.startDate.toDateString()];
        values.forEach(value => {
            const td = document.createElement('td');
            td.style.border = '1px solid #000';
            td.style.padding = '10px';
            td.textContent = value;
            row.appendChild(td);
        });
        table.appendChild(row);
    });

    // Append table to the container
    tableContainer.appendChild(table);
}
