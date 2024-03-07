import {MarkdownPostProcessorContext, Plugin, Vault} from "obsidian";
import {Schema, z, ZodType, ZodTypeDef} from "zod";
import {render} from "./layout/layout";

function rewriteSrc(block: StatBlock, el: HTMLElement, ctx: MarkdownPostProcessorContext, vault: Vault) {
    const file = vault.getFiles().find(f => {
        console.log({f, path: ctx.sourcePath})
        return f.path === ctx.sourcePath
    })
    if (!file) {
        console.error('no file at', ctx.sourcePath);
        return
    }
    const section = ctx.getSectionInfo(el);
    if (!section) {
        console.error('no section found');
        return;
    }

    vault.process(
        file,
        (data) => {
            const lines = data.split("\n")
            if (lines[section.lineStart] !== '```cortex' || lines[section.lineEnd] !== '```') {
                console.error('Invalid section found', {section, lines});
                return data
            }

            return [
                ...lines.slice(0, section.lineStart + 1),
                JSON.stringify(block, null, 2),
                ...lines.slice(section.lineEnd)
            ].join("\n")
        }
    ).then(console.log, console.error)
}

// noinspection JSUnusedGlobalSymbols -- used by Obsidian
export default class CortexSheetPlugin extends Plugin {
    async onload() {
        const {vault} = this.app;

        this.registerMarkdownCodeBlockProcessor("cortex", (source, el, ctx) => {
            try {
                let parsedInput = JSON.parse(source);
                if (typeof parsedInput.template === 'string') {
                    if (parsedInput.template === 'underworld') {
                        return this.writeUnderworld(el, ctx, vault);
                    }
                }
                const block = parseStatBlock(parsedInput);
                render(block, el);
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

    private writeUnderworld(el: HTMLElement, ctx: MarkdownPostProcessorContext, vault: Vault) {
        const template: StatBlock = {
            name: "Character Name",
            layout: "one-third-two-third",
            traits: [
                {
                    title: "Attributes",
                    layoutRegion: 'left',
                    ratings: {
                        "Might": 4,
                        "Wit": 4,
                        "Presence": 4,
                        "Reason": 4,
                        "Courage": 4,
                        "Grace": 4,
                    }
                },
                {
                    title: "Roles",
                    layoutRegion: 'left',
                    ratings: {
                        "Bruiser": 4,
                        "Face": 4,
                        "Driver": 4,
                        "Marksman": 4,
                        "Mastermind": 4,
                        "Hacker": 4,
                    }
                },
                {
                    title: "Stress",
                    layoutRegion: 'left',
                    ratings: {
                        "Afraid": null,
                        "Angry": null,
                        "Exhausted": null,
                        "Injured": null,
                        "Heat": null,
                        "Insecure": null,
                    }
                },
                {
                    title: "Distinctions",
                    sfx: {
                        "Hinder": "Step a distinction down to a [d4] for a roll to gain a [PP]"
                    },
                    ratings: {
                        "Why did you turn to the revolution?": 8,
                        "How did you fall through the cracks in society?": 8,
                        "Do you have a life contract with a Corp?": 8,
                    }
                },
                {
                    title: "Bonds",
                    ratings: {
                        "Character 1": 4,
                        "Character 2": 4,
                        "Character 3": 4,
                        "Character 4": 4,
                        "Character 5": 4,
                    }
                },
                {
                    title: "Specialties",
                    ratings: {
                        "Speciality 1": 6,
                        "Speciality 2": 6,
                    }
                },
                {
                    title: "Talents",
                    sfx: {
                        "Talent 1": "Rules description",
                        "Talent 2": "You can use [d4] - [D12], and [PP]",
                    },
                    ratings: {}
                }
            ]
        }

        rewriteSrc(template, el, ctx, vault);
    }
}

interface RatingSpec {
    dieRating: null | 4 | 6 | 8 | 10 | 12;
    description?: string;
}

type Rating = RatingSpec['dieRating'] | RatingSpec

export interface TraitSpec {
    title: string;
    layoutRegion?: string;
    sfx?: Record<string, string>
    ratings: Record<string, Rating>;
}

export interface StatBlock {
    name: string;
    layout?: string;
    traits: TraitSpec[];
}

const dieRatingSchema: Schema<RatingSpec["dieRating"]> = z.union(
    [
        z.null(),
        z.literal(4),
        z.literal(6),
        z.literal(8),
        z.literal(10),
        z.literal(12)
    ]
);

const ratingSchema: Schema<Rating> = z.union(
    [
        dieRatingSchema,
        z.object(
            {
                dieRating: dieRatingSchema,
                description: z.string().optional()
            }
        )
    ]
);

const looseRatingSchema: ZodType<Rating, ZodTypeDef, unknown> = z.preprocess(
    val => {
        if (typeof val === "string") {
            val = parseInt(val.replace(/^d/i, ""));
        }

        return val;
    },
    ratingSchema
)

function parseStatBlock(input: unknown): StatBlock {
    const schema: ZodType<StatBlock, ZodTypeDef, unknown> = z.object(
        {
            name: z.string(),
            layout: z.string().optional(),
            traits: z.array(
                z.object(
                    {
                        title: z.string(),
                        layoutRegion: z.string().optional(),
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
