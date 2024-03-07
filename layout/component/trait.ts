import {DisplaySize, insertDie} from "../../dice";
import {TraitSpec} from "../../main";

export function renderTrait(trait: TraitSpec, el: HTMLElement) {
    el.createEl("h3", {text: trait.title});

    if (trait.sfx) {
        Object.entries(trait.sfx).forEach(([label, description]) => {
            el.appendChild(paragraphWithSymbols(label, description));
        });
    }
    const ratingsEl = el.createEl("div", {cls: "cortex-ratings"});

    Object.entries(trait.ratings).forEach(([label, spec]) => {
        const containerEl = ratingsEl.createEl("div", {cls: "cortex-rating"});
        containerEl.createEl("div", {text: label, cls: "label"});
        const dd = containerEl.createEl("div", {cls: "die"});
        const sides = spec && typeof spec === "object" ? spec.dieRating : spec
        insertDie(dd, {sides});
    });
}

export function paragraphWithSymbols(label: string, text: string): HTMLElement {
    const paragraphEl = document.createElement("p");
    paragraphEl.createEl("strong", {text: label + ": "});

    text.split(/(\[(?:d4|d6|d8|d10|d12|pp)])/i).forEach((part) => {
        const spanEl = paragraphEl.createEl("span");

        switch (part.toLowerCase()) {
            case "[d4]":
                insertDie(spanEl, {sides: 4, displaySize: DisplaySize.SMALL});
                break;
            case "[d6]":
                insertDie(spanEl, {sides: 6, displaySize: DisplaySize.SMALL});
                break;
            case "[d8]":
                insertDie(spanEl, {sides: 8, displaySize: DisplaySize.SMALL});
                break;
            case "[d10]":
                insertDie(spanEl, {sides: 10, displaySize: DisplaySize.SMALL});
                break;
            case "[d12]":
                insertDie(spanEl, {sides: 12, displaySize: DisplaySize.SMALL});
                break;
            case "[pp]":
                insertDie(spanEl, {sides: "PP", displaySize: DisplaySize.SMALL});
                break;
            default:
                spanEl.textContent = part;
        }
    });

    return paragraphEl;
}
