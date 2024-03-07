import {Layout} from "./layout";
import {StatBlock} from "../main";
import {renderTrait} from "./component/trait";

export default {
    renderStatBlock(block: StatBlock, container: HTMLElement) {
        console.log('render 1/3 2/3')

        const layout = container.createEl("div", {cls: "layout-one-third-two-thirds"})

        const header = layout.createEl("div", {cls: "header"})
        const left = layout.createEl("div", {cls: "left"})
        const right = layout.createEl("div", {cls: "right"})

        header.createEl("h2", {text: block.name});
        block.traits.forEach(({layoutRegion, ...trait}) => {
            if(layoutRegion === 'left') {
                renderTrait(trait, left)
            } else {
                renderTrait(trait, right)
            }
        });
    }
} satisfies Layout
