import {Plugin} from "obsidian";
import {Schema, z, ZodType, ZodTypeDef} from "zod";
import {DisplaySize, insertDie} from "./dice";

function renderTrait(trait: TraitSpec, el: HTMLElement) {
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
        insertDie(dd, {sides: spec.dieRating});
    });
}

function paragraphWithSymbols(label: string, text: string): HTMLElement {
    const paragraphEl = document.createElement("p");
    paragraphEl.createEl("strong", {text: label + ": "});

    text.split(/(\[(?:d4|d6|d8|d10|d12|pp)])/i).forEach((part) => {
        const spanEl = paragraphEl.createEl("span");

        switch (part.toLowerCase()) {
            case "[d4]": insertDie(spanEl, {sides: 4, displaySize: DisplaySize.SMALL}); break;
            case "[d6]": insertDie(spanEl, {sides: 6, displaySize: DisplaySize.SMALL}); break;
            case "[d8]": insertDie(spanEl, {sides: 8, displaySize: DisplaySize.SMALL}); break;
            case "[d10]": insertDie(spanEl, {sides: 10, displaySize: DisplaySize.SMALL}); break;
            case "[d12]": insertDie(spanEl, {sides: 12, displaySize: DisplaySize.SMALL}); break;
            case "[pp]": insertDie(spanEl, {sides: "PP", displaySize: DisplaySize.SMALL}); break;
            default: spanEl.textContent = part;
        }
    });

    return paragraphEl;
}

// noinspection JSUnusedGlobalSymbols -- used by Obsidian
export default class CortexSheetPlugin extends Plugin {
    async onload() {
        this.registerMarkdownCodeBlockProcessor("cortex", (source, el) => {

            try {
                const block = parseStatBlock(JSON.parse(source));
                el.createEl("h2", {text: block.name});
                block.traits.forEach((trait) => renderTrait(trait, el));
            }
            catch (err) {
                let errMsg = "Error parsing cortex stat block";
                if (err instanceof Error) {
                    errMsg = errMsg + ": " + err.message;
                }
                if (typeof err === "string") {
                    errMsg = errMsg + ": " + err;
                }

                el.createEl("div", {text: errMsg, cls: "cortex-error"});
            }
        });
    }
}

interface RatingSpec {
    dieRating: 4 | 6 | 8 | 10 | 12;
    description?: string;
}

interface TraitSpec {
    title: string;
    sfx?: Record<string, string>
    ratings: Record<string, RatingSpec>;
}

interface StatBlock {
    name: string;
    traits: TraitSpec[];
}

const dieRatingSchema: Schema<RatingSpec["dieRating"]> = z.union(
    [
        z.literal(4),
        z.literal(6),
        z.literal(8),
        z.literal(10),
        z.literal(12)
    ]
);

const ratingSchema: Schema<RatingSpec> = z.object(
    {
        dieRating: dieRatingSchema,
        description: z.string().optional()
    }
)

const looseRatingSchema: ZodType<RatingSpec, ZodTypeDef, unknown> = z.preprocess(
    val => {
        if (typeof val === "string") {
            val = parseInt(val.replace(/^d/i, ""));
        }
        if (typeof val === "number") {
            return {dieRating: val};
        }
        return val;
    },
    ratingSchema
)

function parseStatBlock(input: unknown): StatBlock {
    const schema: ZodType<StatBlock, ZodTypeDef, unknown> = z.object(
        {
            name: z.string(),
            traits: z.array(
                z.object(
                    {
                        title: z.string(),
                        sfx: z.record(z.string()).optional(),
                        ratings: z.record(
                            z.string(),
                            looseRatingSchema
                        )
                    }
                )
            )
        }
    )

    return schema.parse(input);
}
