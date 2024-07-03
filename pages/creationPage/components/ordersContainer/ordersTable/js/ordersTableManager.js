import OrdersTableRow from "../js/ordersTableRow.js";


export default class OrdersTableManager{
    constructor(
        container,
        headers,
        tableName,
        tableStyle = 'table',
    ) {
        this.tableName = tableName;
        this.container = container;
        this.tableStyle = tableStyle;
        this.headers = headers;
        this.headersSortingOrder = {};
        this.updateIntervalId = null;
        // Same, change it to some class for htmlElement.
        // And actions on it here.
        this.element = document.createElement('table');
        this.element.className = 'table';
        this.element.classList.add('table-hidden');
        // tableHead
        this.mainHeadRow = document.createElement('thead');
        this.mainHeadRow.id = this.tableName;
        this.element.appendChild(this.mainHeadRow);
        this.setNewHeaders(this.mainHeadRow, this.headers);
        // tableBody
        this.tableBody = document.createElement('tbody');
        this.element.appendChild(this.tableBody);
        // tableFooter <- if we need it
        // this.tableFooter = document.createElement('tfoot');
        // this.element.appendChild(this.tableFooter);
        // ---
        // Add rowStorage and use Object(OrderId) as an unique identifier.
        this.tableRows = {};
    }

    setNewHeaders(headRow, headers) {
        if (0 === headers.length) {
            return false;
        }
        headRow.innerHTML = '';
        for (const [headerName, header] of Object.entries(headers)) {
            const newHeader = document.createElement('th');
            newHeader.className = header['columnStyle'];
            newHeader.innerHTML = `<b>${header['columnName']}</b>`;
            newHeader.id = `${headerName}`;
            // Add Even on click for sorting.
            newHeader.addEventListener('click', () => {
                this.sortTable(newHeader.id);
            })
            // ---
            headRow.appendChild(newHeader);
            this.headers[headerName] = header;
        }
        return true;
    }

    addRow(rowData) {
        const newRow = new OrdersTableRow(this.headers);
        this.tableBody.appendChild(newRow.populateRow(rowData, this.tableName));
        return newRow;
    }
    
    deleteTableData() {
        this.element.innerHTML = '';
    }

    // unused <- moved this functionality to the `switch-buttons`, but leaving.
    showTable() {
        if (this.element.classList.contains('table-hidden')) {
            this.element.classList.remove('table-hidden');
            this.element.classList.add('table-visible');
        }
    }

    hideTable() {
        if (this.element.classList.contains('table-visible')) {
            this.element.classList.remove('table-visible');
            this.element.classList.add('table-hidden');
        }
    }

    // Fetch + updating
    async #fetchTableData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error(`There was a problem with the fetch operation: ${error}`);
            throw error;
        }
    }

    async updateTable(dataUrl) {
        if (this.element.classList.contains('table-hidden')) {
            return;
        }
        const newTableData = await this.#fetchTableData(dataUrl);
        for (const [ orderId, orderData ] of Object.entries(newTableData['data'])) {
            if (!this.tableRows[orderId]) {
                this.tableRows[orderId] = this.addRow(orderData);
            } else {
                this.tableRows[orderId].populateRow(orderData, this.tableName);
            }
        }
    }

    async setUpdating(frequency, dataUrl) {
        this.updateIntervalId = setInterval(() => this.updateTable(dataUrl), frequency);

    }

    async stopUpdating() {
        if (this.updateIntervalId !== null) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
    }
    // ---
    // sorting

    async markAscending(headerElement) {
        headerElement.classList.add('sort-asc');
    }

    async markDescending(headerElement) {
        headerElement.classList.add('sort-desc');
    }

    async unmarkAllHeaders(headersRow) {
        headersRow.childNodes.forEach(element => {
            element.classList.remove('sort-asc');
            element.classList.remove('sort-desc');
        })
    }

    async sortTable(chosenHeader) {
        const allRows = Array(...Object.values(this.tableRows));
        this.unmarkAllHeaders(this.mainHeadRow);
        const headerElement = this.mainHeadRow.querySelector(`#${chosenHeader}`)
        if (!this.headersSortingOrder[chosenHeader]) {
            this.headersSortingOrder[chosenHeader] = 'asc';
            await this.markAscending(headerElement);
        } else {
            if ('asc' === this.headersSortingOrder[chosenHeader]) {
                this.headersSortingOrder[chosenHeader] = 'desc';
                await this.markDescending(headerElement);
            } else {
                this.headersSortingOrder[chosenHeader] = 'asc';
                await this.markAscending(headerElement);
            }
        }
        allRows.sort((a, b) => {
            let valueA = a.rowData[chosenHeader];
            let valueB = b.rowData[chosenHeader];
            if ('source' === chosenHeader || 'destination' === chosenHeader) {
                valueA = valueA['identifier'];
                valueB = valueB['identifier'];
            }
            if ('asc' === this.headersSortingOrder[chosenHeader]) {
                return valueA.localeCompare(valueB);
            } else {
                return valueB.localeCompare(valueA);
            }
        })
        this.tableBody.innerHTML = '';
        allRows.forEach(row => this.tableBody.appendChild(row.element));
    }
    // ---
}