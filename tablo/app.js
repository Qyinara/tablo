document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "tableData";
    const tableParams = [
        "Jeoloji",
        "Arazi Kullanımı",
        "Yükseklik",
        "AKK",
        "Erozyon",
        "Eğim",
        "Bakı",
        "Su Mesafe"
    ];

    const alternatives = ["419", "463", "414", "378", "311", "363", "308", "310"];
    const n = alternatives.length;
    const RI = 1.41;

    let tableData = loadTableData();

    const tableContainer = document.getElementById("table-container");

    function renderTables() {
        tableContainer.innerHTML = "";

        tableParams.forEach(param => {
            const section = document.createElement("section");
            const title = document.createElement("h2");
            title.textContent = param;
            section.appendChild(title);

            const table = createTable(param);
            section.appendChild(table);

            tableContainer.appendChild(section);
        });

        renderSummaryTable();
    }

    function createTable(param) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        const headerRow = document.createElement("tr");
        const thEmpty = document.createElement("th");
        thEmpty.textContent = "Alternatif Sahalar";
        headerRow.appendChild(thEmpty);

        alternatives.forEach(alt => {
            const th = document.createElement("th");
            th.textContent = alt;
            headerRow.appendChild(th);
        });

        ["Normalleştirilmiş Matris", "Özvektör", "Özdeğer", "λmax", "CI", "RI", "CI/RI"].forEach((header, index) => {
            const th = document.createElement("th");
            th.textContent = header;
            if (header === "Normalleştirilmiş Matris") {
                th.classList.add("normalized-matrix-header"); // Bu başlığa özel sınıf ekliyoruz
            }
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        tableData[param].forEach((row, rowIndex) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.textContent = alternatives[rowIndex];
            tr.appendChild(th);

            row.forEach((cell, colIndex) => {
                const td = document.createElement("td");
                td.textContent = cell.toFixed(2);
                td.contentEditable = true;

                td.addEventListener("blur", () => {
                    const sanitizedValue = sanitizeInput(td.textContent);
                    td.textContent = sanitizedValue.toFixed(2);
                    tableData[param][rowIndex][colIndex] = sanitizedValue;
                    saveTableData();
                    updateTable(param, table);
                });

                tr.appendChild(td);
            });

            const normalizedCell = document.createElement("td");
            normalizedCell.classList.add("normalized-matrix");
            tr.appendChild(normalizedCell);

            const eigenvectorCell = document.createElement("td");
            eigenvectorCell.classList.add("eigenvector");
            tr.appendChild(eigenvectorCell);

            const eigenvalueCell = document.createElement("td");
            eigenvalueCell.classList.add("eigenvalue");
            tr.appendChild(eigenvalueCell);

            const lambdaMaxCell = document.createElement("td");
            lambdaMaxCell.classList.add("lambda-max");
            tr.appendChild(lambdaMaxCell);

            tbody.appendChild(tr);
        });

        const totalRow = document.createElement("tr");
        const totalLabelCell = document.createElement("th");
        totalLabelCell.textContent = "TOPLAM";
        totalRow.appendChild(totalLabelCell);

        alternatives.forEach(() => {
            const td = document.createElement("td");
            td.classList.add("total-cell");
            td.textContent = "0.00";
            totalRow.appendChild(td);
        });

        const normalizedTotalCell = document.createElement("td");
        normalizedTotalCell.textContent = "-";
        totalRow.appendChild(normalizedTotalCell);

        const eigenvectorTotalCell = document.createElement("td");
        eigenvectorTotalCell.textContent = "-";
        totalRow.appendChild(eigenvectorTotalCell);

        const eigenvalueTotalCell = document.createElement("td");
        eigenvalueTotalCell.textContent = "TOPLAM";
        totalRow.appendChild(eigenvalueTotalCell);

        const lambdaMaxCell = document.createElement("td");
        lambdaMaxCell.classList.add("lambda-max");
        totalRow.appendChild(lambdaMaxCell);

        const ciCell = document.createElement("td");
        ciCell.classList.add("ci");
        totalRow.appendChild(ciCell);

        const riCell = document.createElement("td");
        riCell.textContent = RI.toFixed(2);
        riCell.classList.add("ri");
        totalRow.appendChild(riCell);

        const ciRiCell = document.createElement("td");
        ciRiCell.classList.add("ci-ri");
        totalRow.appendChild(ciRiCell);

        tbody.appendChild(totalRow);
        table.appendChild(tbody);

        updateTable(param, table);
        return table;
    }

    function updateTable(param, table) {
        const tbody = table.querySelector("tbody");
        const rows = tableData[param];
        const columnSums = Array(n).fill(0);
        let lambdaMaxSum = 0;

        // Column sums hesaplama
        rows.forEach(row => {
            row.forEach((value, colIndex) => {
                columnSums[colIndex] += value;
            });
        });

        const eigenvectors = rows.map(row =>
            row.map((value, colIndex) => value / columnSums[colIndex])
        );

        const averageEigenvector = eigenvectors.map(row =>
            row.reduce((sum, value) => sum + value, 0) / n
        );

        rows.forEach((row, rowIndex) => {
            const eigenvalue = row.reduce((sum, cellValue, colIndex) =>
                sum + cellValue * averageEigenvector[colIndex], 0
            );
            let lambdaMax = eigenvalue / averageEigenvector[rowIndex];

            // lambdaMax'ı sayıya dönüştür ve toFixed(2) ile formatla
            lambdaMax = parseFloat(lambdaMax).toFixed(2);

            // lambdaMax'ı toplama ekleyelim
            lambdaMaxSum += parseFloat(lambdaMax);

            const normalizedCell = tbody.rows[rowIndex].querySelector(".normalized-matrix");
            normalizedCell.textContent = eigenvectors[rowIndex].map(v => v.toFixed(2)).join(", ");

            const eigenvectorCell = tbody.rows[rowIndex].querySelector(".eigenvector");
            eigenvectorCell.textContent = averageEigenvector[rowIndex].toFixed(2);

            const eigenvalueCell = tbody.rows[rowIndex].querySelector(".eigenvalue");
            eigenvalueCell.textContent = eigenvalue.toFixed(2);

            const lambdaMaxCell = tbody.rows[rowIndex].querySelector(".lambda-max");
            lambdaMaxCell.textContent = lambdaMax;  // Özdeğer/Özvektör 
        });

        // λmax değerlerinin toplamını alıp 8'e bölüyoruz
        const lambdaMaxAverage = lambdaMaxSum / 8;

        const ci = (lambdaMaxAverage - n) / (n - 1);
        const ciRi = ci / RI;

        const totalRow = tbody.lastChild;
        totalRow.querySelectorAll(".total-cell").forEach((cell, index) => {
            cell.textContent = columnSums[index].toFixed(2);
        });

        // λmax ortalaması, CI ve CI/RI son satıra yazılıyor
        totalRow.querySelector(".lambda-max").textContent = lambdaMaxAverage.toFixed(2);
        totalRow.querySelector(".ci").textContent = ci.toFixed(2);
        totalRow.querySelector(".ci-ri").textContent = ciRi.toFixed(2);
    }

    function renderSummaryTable() {
        const summarySection = document.createElement("section");
        const title = document.createElement("h2");
        title.textContent = "Sonuç Tablosu";
        summarySection.appendChild(title);

        const summaryTable = document.createElement("table");
        summaryTable.setAttribute("border", "1");
        summaryTable.style.width = "100%";
        summaryTable.style.marginTop = "20px";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        ["Alternatif Sahalar", ...tableParams, "Özvektör (W)", "Toplam Ağırlık Değerleri", "Potansiyel Ağaçlandırılacak Saha"].forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        summaryTable.appendChild(thead);

        const tbody = document.createElement("tbody");
        let maxWeight = -Infinity;

        const totalWeights = alternatives.map((alt, altIndex) => {
            return tableParams.reduce((sum, param) => {
                const paramSum = tableData[param][altIndex].reduce((a, b) => a + b, 0);
                return sum + paramSum;
            }, 0);
        });

        totalWeights.forEach((totalWeight, index) => {
            if (totalWeight > maxWeight) {
                maxWeight = totalWeight;
            }
        });

        alternatives.forEach((alt, index) => {
            const row = document.createElement("tr");

            const altCell = document.createElement("td");
            altCell.textContent = alt;
            row.appendChild(altCell);

            tableParams.forEach(param => {
                const td = document.createElement("td");
                const paramSum = tableData[param][index].reduce((a, b) => a + b, 0).toFixed(2);
                td.textContent = paramSum;
                row.appendChild(td);
            });

            const eigenvectorCell = document.createElement("td");
            eigenvectorCell.textContent = (totalWeights[index] / tableParams.length).toFixed(2);
            row.appendChild(eigenvectorCell);

            const weightCell = document.createElement("td");
            weightCell.textContent = totalWeights[index].toFixed(2);
            row.appendChild(weightCell);

            const potentialCell = document.createElement("td");
            if (totalWeights[index] === maxWeight) {
                potentialCell.style.backgroundColor = "lightgreen";
                potentialCell.textContent = alt;
            } else {
                potentialCell.textContent = alt;
            }
            row.appendChild(potentialCell);

            tbody.appendChild(row);
        });

        summaryTable.appendChild(tbody);
        summarySection.appendChild(summaryTable);
        tableContainer.appendChild(summarySection);

        renderChart(alternatives, totalWeights);
    }

    function renderChart(labels, totalWeights) {
        const chartContainer = document.createElement("div");
        chartContainer.innerHTML = `<canvas id="summaryChart" width="400" height="200"></canvas>`;
        tableContainer.appendChild(chartContainer);

        const ctx = document.getElementById("summaryChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Toplam Ağırlık Değerleri",
                    data: totalWeights,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function saveTableData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData));
    }

    function loadTableData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            return JSON.parse(savedData);
        }

        const initialData = {};
        tableParams.forEach(param => {
            initialData[param] = Array.from({ length: n }, () => Array(n).fill(0));
        });
        return initialData;
    }

    function sanitizeInput(input) {
        const value = parseFloat(input);
        return isNaN(value) ? 0 : value;
    }

    renderTables();
});
