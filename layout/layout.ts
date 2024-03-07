import type {StatBlock} from "../main";
import OneThirdTwoThird from "./one-third-two-third";
import Default from "./default";

export interface Layout {
    renderStatBlock(statBlock: StatBlock, container: HTMLElement): void
}

export function render(statBlock: StatBlock, container: HTMLElement) {
    console.log(statBlock.layout)
    switch (statBlock.layout) {
        case 'one-third-two-third':
            return OneThirdTwoThird.renderStatBlock(statBlock, container);

        default:
            return Default.renderStatBlock(statBlock, container);
    }
}
