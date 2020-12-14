export class Component {
    constructor(templateID, hostElementID, insertAtStart, newElementID) {
        this.templateEl = document.getElementById(templateID);
        this.hostEl = document.getElementById(hostElementID);
        const importedNode = document.importNode(this.templateEl.content, true);
        this.element = importedNode.firstElementChild;
        if (newElementID)
            this.element.id = newElementID;
        this.attach(insertAtStart);
    }
    attach(insertAtStart) {
        this.hostEl.insertAdjacentElement(insertAtStart ? "afterbegin" : "beforeend", this.element);
    }
}
//# sourceMappingURL=base-component.js.map