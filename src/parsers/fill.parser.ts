import { queryElement } from "../helpers/checkobj";
import { emusToPoints } from "../helpers/ooxmlConverter";
import { FillType } from "../types";
import { getThemeColor } from "./theme.parser";

export const parseSolidFill = (solidFill) => {
    if (!solidFill) return null;

    if (solidFill["a:srgbClr"]) {
        let opacity = 1;
        if (solidFill["a:srgbClr"][0]["a:alpha"]) {
            opacity = solidFill["a:srgbClr"][0]["a:alpha"][0]["$"].val / 100000;
        }

        return {
            type: FillType.SOLID,
            value: `#${solidFill["a:srgbClr"]["0"].$.val}`,
            opacity,
        };
    }

    if (solidFill["a:schemeClr"]) {
        return getThemeColor(solidFill["a:schemeClr"][0]["$"].val);
    }
}

export const parseGradientFill = (gradFill) => {
    if (!gradFill) return null;

    let type = "Gradient";

    if (gradFill["a:lin"]) {
        type = "GradientLinear";
    } else if (gradFill["a:path"]) {
        type = "GradientPath";
    } else {
        throw new Error("Unexpected gradient type");
    }

    const data: any = {
        type: FillType.GRADIENT,
        value: {
            points: gradFill["a:gsLst"][0]["a:gs"].map((g: any) => {
                const position = Number(g.$.pos) / 100_000;
                const fill = parseSolidFill(g);
                return {
                    position,
                    fill,
                }
            }),
        },
        opacity: 1,
    };

    if (type === "GradientLinear") {
        data.value.angle = gradFill["a:lin"][0]["$"]["ang"] / 60000;
    }

    if (type === "GradientPath") {
        const gradientPath = gradFill["a:path"][0];

        data.value.path = gradientPath["$"]["path"];

        const fillToRect = gradientPath["a:fillToRect"][0]["$"];
        if (fillToRect) {
            data.value.fillToRect = {
                left: fillToRect.l / 1000,
                top: fillToRect.t / 1000,
                right: fillToRect.r / 1000,
                bottom: fillToRect.b / 1000,
            };
        }
    }

    data.value.gradientType = type;

    return data;
}

export const parseBlipFill = (blipFill) => {
    if (!blipFill) return null;

    const blip = blipFill["a:blip"][0];
    const stretch = blipFill["a:stretch"][0];
    const stretchFill = stretch["a:fillRect"] || stretch.$?.["a:fillRect"];

    return {
        type: FillType.BLIP,
        value: {
            id: blip.$["r:embed"],
            stretch: stretch ? {
                type: stretchFill ? "fillRect" : "fill",
                fillRect: stretchFill && !Array.isArray(stretchFill) ? {
                    x: emusToPoints(stretchFill["a:x"]),
                    y: emusToPoints(stretchFill["a:y"]),
                    cx: emusToPoints(stretchFill["a:cx"]),
                    cy: emusToPoints(stretchFill["a:cy"]),
                } : null,
            } : null,
        },
        opacity: 1,
    }
}

export const parseGroupFill = (groupFill) => {
    if (!groupFill) return null;
    return { type: FillType.GROUP, opacity: 1 };
}

export const parsePatternFill = (patternFill) => {
    if (!patternFill) return null;
    const patt = patternFill["a:patt"][0];
    return { type: FillType.PATTERN, opacity: 1, };
}