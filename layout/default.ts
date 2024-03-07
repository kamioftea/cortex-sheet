import {Layout} from "./layout";
import {StatBlock} from "../main";
import {renderTrait} from "./component/trait";

export default {
    renderStatBlock(block: StatBlock, container: HTMLElement) {
        console.log('render default')
        container.createEl("h2", {text: block.name});
        block.traits.forEach((trait) => renderTrait(trait, container));
    }
} satisfies Layout
