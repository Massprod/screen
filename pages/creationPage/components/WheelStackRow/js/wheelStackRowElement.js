import WheelStackElement from "../../WheelStack/js/WheelStackElement.js";
import { CLASS_NAMES } from "../../constants.js";
import { BACK_URLS } from "../../constants.js";
import WheelStackRowData from "./wheelStackRowData.js";


export default class WheelStackRowElement {
    constructor(
        rowIdentifier,
        columnsOrder,
        columns,
        container,
    ) {
        this.wheelStacksUrl = BACK_URLS.GET_WHEELSTACK_DATA_URl;
        // Element creation
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = CLASS_NAMES.WHEEL_STACK_ELEMENT.WHEEL_STACK_ROW;
        this.container.appendChild(this.element);
        // All related rowData.
        this.wheelStackRowData = new WheelStackRowData(
            rowIdentifier,
            columnsOrder,
            columns,
        );
        // { column: WheelStackElement }
        this.allWheelstacks = {};
        this.#createRow();
    }

    async #fetchWheelStackData(wheelStackId, url) {
        const wheelStackUrl = `${url}${wheelStackId}`; // Example URL, change as needed
        try {
            const response = await fetch(wheelStackUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            const wheelStackData = await response.json();
            return wheelStackData;
        } catch (error) {
            console.error('Error fetching wheel stack data:', error);
            throw error;
        }
    }


    async #createRow() {
        const columnsOrdering = this.wheelStackRowData.columnsOrder;
        const columns = this.wheelStackRowData.columns;
        for (const column of columnsOrdering) {
            const wheelStackInfo = columns[column];
            const wheelStackElement = new WheelStackElement(this.element);
            this.allWheelstacks[column] = wheelStackElement;
            // Empty element !== whiteSpace
            if (true == wheelStackInfo['whiteSpace']) {
                wheelStackElement.setAsWhiteSpace();
                continue;
            }
            // We always create it as empty element.
            if (null == wheelStackInfo['wheelStack']) {
                continue;
            }
            const wheelStackId = wheelStackInfo['wheelStack'];
            const wheelStackReq = await this.#fetchWheelStackData(
                wheelStackId,
                this.wheelStacksUrl,
            );
            const wheelStackData = wheelStackReq['data'];
            wheelStackElement.setAsWheelStack(wheelStackData);
        }
    }

    async updateRowData(newRowData) {
        const columnsOrdering = newRowData.columnsOrder;
        const columns = newRowData.columns;
        for (const column of columnsOrdering) {
            const wheelStackInfo = columns[column];
            if (true == wheelStackInfo['whiteSpace']) {
                continue;
            }
            const storedWheelStack = this.allWheelstacks[column];
            const newWheelStackId = wheelStackInfo['wheelStack'];
            if (null == newWheelStackId) {
                storedWheelStack.resetElement();
                continue;
            }
            const newWheelStackReq = await this.#fetchWheelStackData(
                newWheelStackId,
                this.wheelStacksUrl,
            )
            const newWheelStackData = newWheelStackReq['data'];
            storedWheelStack.setAsWheelStack(newWheelStackData);
        }
    }
}
