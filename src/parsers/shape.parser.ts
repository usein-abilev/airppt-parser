import { queryElement } from "../helpers/checkobj";
import { emusToPoints } from "../helpers/ooxmlConverter";
import { BorderType, FillType, FontStyle, TextAlignment, TextType, TextVerticalAlignment } from "../types";
import { getThemeColor } from "./theme.parser";

export const parseSlideShapes = (shapeTree, props) => {
    const shapes = shapeTree["p:sp"] || [];
    const pictures = shapeTree["p:pic"] || [];

    return [...shapes, ...pictures].map((shape) => parseSlideShape(shape, props));
}

const parseSlideShape = (shape, props) => {
    const shapeNonVisual = shape["p:nvSpPr"] || shape["xdr:nvSpPr"];
    const shapeProperties = shape["p:spPr"] || shape["xdr:spPr"];
    const shapeText = shape["p:txBody"] || shape["xdr:txBody"];

    const element: any = {
        needPreload: Boolean(shape["p:nvPicPr"]),
        raw: shape,
        style: {},
    }

    if (shapeNonVisual) {
        element.id = shapeNonVisual[0]["p:cNvPr"][0]["$"].id;
        element.name = shapeNonVisual[0]["p:cNvPr"][0]["$"].name;
    }

    if (shapeProperties) {
        element.boundingBox = parseBoundingBox(shapeProperties[0]);
        const geometry = parseShapeGeometry(shapeProperties[0]);
        const border = parseShapeStrokeLine(shapeProperties[0], props);
        const shapeRootFillStyle = parseShapeFill(shape, props);
        const shapeFillStyle = parseShapeFill(shapeProperties[0], props);

        if (geometry) element.geometry = geometry;
        if (border) element.style.border = border;

        if (shapeRootFillStyle.type !== FillType.NO_FILL) {
            element.style.fill = shapeRootFillStyle;
            element.style.opacity = shapeFillStyle.opacity;
        } else {
            element.style.fill = shapeFillStyle;
            element.style.opacity = shapeFillStyle.opacity;
        }
    }

    if (shapeText && !props.disableText) {
        const bodyProps = shapeText[0]["a:bodyPr"];
        const paragraphs = shapeText[0]["a:p"].map(paragraph => parseTextBody(paragraph, props));
        const textBody: any = {
            paragraphs,
        };

        if (bodyProps) {
            const bodyProperties = bodyProps[0]["$"];
            textBody.style = {
                marginLeft: bodyProperties.lIns ? (bodyProperties.lIns / 45720) * 72 : 0,
                marginRight: bodyProperties.rIns ? (bodyProperties.rIns / 45720) * 72 : 0,
                marginTop: bodyProperties.tIns ? (bodyProperties.tIns / 45720) * 72 : 0,
                marginBottom: bodyProperties.bIns ? (bodyProperties.bIns / 45720) * 72 : 0,
                verticalAlign: bodyProperties.anchor ? parseTextVerticalAlignment(bodyProperties.anchor) : TextVerticalAlignment.TOP,
            }
        }

        element.text = textBody;
    }

    return element;
}

export const parseTextBody = (textBody, props) => {
    const paragraphs = textBody["a:r"] || [];
    const paragraphProperties = textBody["a:pPr"] || [];
    const text = paragraphs.reduce((acc, paragraph) => {
        const text = paragraph["a:t"];
        const textProperties = paragraph["a:rPr"][0];
        return { value: [...(acc.value || []), text], properties: { ...textProperties, ...acc.properties } };
    }, {});

    const style: any = {
        attributes: [],
        fontSize: 14,
        fontFamily: "Arial",
        color: "black",
        marginLeft: 0,
        indent: 0,
        alignment: TextAlignment.LEFT,
        spaceBefore: 0,
        spaceAfter: 0,
        lineSpacing: 1,
    };

    if (paragraphProperties[0]) {
        const properties = paragraphProperties[0];

        if (properties.$) {
            const alignment = properties["$"]["algn"];

            style.alignment = alignment ? parseTextAlignment(alignment) : TextAlignment.LEFT;

            if (properties.$.indent) {
                style.indent = emusToPoints(properties.$.indent);
            }

            if (properties.$.marL) {
                style.marginLeft = emusToPoints(properties.$.marL);
            }
        }

        if (properties["a:spcBef"]) {
            const spaceBefore = properties["a:spcBef"][0]["a:spcPts"][0].$.val;
            style.spaceBefore = spaceBefore / 72;
        }

        if (properties["a:spcAft"]) {
            const spaceAfter = properties["a:spcAft"][0]["a:spcPts"][0].$.val;
            style.spaceAfter = spaceAfter / 72;
        }

        if (properties["a:lnSpc"]) {
            const lineSpacing = properties["a:lnSpc"][0]["a:spcPct"][0].$.val;
            style.lineSpacing = lineSpacing / 100000;
        }

    }

    if (text.properties) {
        if (text.properties["$"].b) style.attributes.push(FontStyle.BOLD);
        if (text.properties["$"].i) style.attributes.push(FontStyle.ITALIC);
        if (text.properties["$"].u) style.attributes.push(FontStyle.UNDERLINE);
        if (text.properties["$"].strike) style.attributes.push(FontStyle.STRIKE);
        if (text.properties["$"].sz) style.fontSize = (text.properties["$"].sz || 1200) / 96;
        if (text.properties["a:latin"][0].$.typeface) style.fontFamily = text.properties["a:latin"][0].$.typeface;

        const color = parseShapeFill(text.properties, props);

        if (color.type !== FillType.NO_FILL) {
            style.color = color.value;
            style.opacity = color.opacity;
        } else {
            style.color = "#000";
            style.opacity = 1;
        }
    }

    if (textBody["a:fld"]) {
        const field = textBody["a:fld"][0];

        return {
            type: TextType.SYSTEM_FIELD,
            style,
        }
    } else {
        return {
            type: TextType.PARAGRAPH,
            text: text.value.join(" "),
            style,
        }
    }
}

const parseTextVerticalAlignment = (alignment) => {
    switch (alignment) {
        case "t": return TextVerticalAlignment.TOP;
        case "ctr": return TextVerticalAlignment.CENTER;
        case "b": return TextVerticalAlignment.BOTTOM;
        default: return TextVerticalAlignment.TOP;
    }
}

const parseTextAlignment = (alignment) => {
    switch (alignment) {
        case "ctr":
            return TextAlignment.CENTER;
        case "l":
            return TextAlignment.LEFT;
        case "r":
            return TextAlignment.RIGHT;
        case "j":
            return TextAlignment.JUSTIFY;
    }

    return TextAlignment.LEFT;
}

export const parseBoundingBox = (element) => {
    const elementPosition = element["a:xfrm"][0]["a:off"][0]["$"];
    const elementSize = element["a:xfrm"][0]["a:ext"][0]["$"];

    return {
        x: emusToPoints(elementPosition.x),
        y: emusToPoints(elementPosition.y),
        width: emusToPoints(elementSize.cx),
        height: emusToPoints(elementSize.cy),
    }
}

export const parseShapeGeometry = (shapeProperties) => {
    if (shapeProperties["a:prstGeom"]) {
        return {
            type: shapeProperties["a:prstGeom"][0]["$"].prst,
        };
    }

    if (shapeProperties["a:custGeom"]) {
        return {
            type: "custom",
            path: getGeometryPath(shapeProperties["a:custGeom"][0]),
        }
    }

    return null;
}

export const parseShapeFill = (shape, props): { type: FillType; value?: any; opacity: number; } => {
    if (!shape) return { type: FillType.NO_FILL, opacity: 1, };

    if (shape["a:blipFill"] || shape["p:blipFill"]) {
        const blipFill = queryElement(shape, "blipFill")[0];
        const blip = blipFill["a:blip"][0];
        const stretch = blipFill["a:stretch"][0];
        return {
            type: FillType.BLIP,
            value: {
                id: blip.$["r:embed"],
                stretch: stretch ? {
                    type: stretch.$["a:fillRect"] ? "fillRect" : "fill",
                    fillRect: stretch.$["a:fillRect"] ? {
                        x: emusToPoints(stretch.$["a:x"]),
                        y: emusToPoints(stretch.$["a:y"]),
                        cx: emusToPoints(stretch.$["a:cx"]),
                        cy: emusToPoints(stretch.$["a:cy"]),
                    } : null,
                } : null,
            },
            opacity: 1,
        }
    }

    if (shape["a:gradFill"]) {
        const gradFill = shape["a:gradFill"][0];

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
                points: gradFill["a:gsLst"][0]["a:gs"].map((g: any) => ({
                    position: Number(g["$"]["pos"]) / 100000,
                    color: `#${g["a:srgbClr"][0]["$"]["val"]}`,
                    opacity: g["a:srgbClr"][0]["a:alpha"] ? Number(g["a:srgbClr"][0]["a:alpha"][0]["$"]["val"]) / 90196 : 1,
                })),
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

    if (shape["a:grpFill"]) {
        const grpFill = shape["a:grpFill"][0];
        return { type: FillType.GROUP, opacity: 1, };
    }

    if (shape["a:noFill"]) {
        return { type: FillType.NO_FILL, opacity: 0, };
    }

    if (shape["a:pattFill"]) {
        const pattFill = shape["a:pattFill"][0];
        const patt = pattFill["a:patt"][0];
        return { type: FillType.PATTERN, opacity: 1, };
    }

    if (shape["a:solidFill"]) {
        const solidFill = shape["a:solidFill"][0];
        if (solidFill["a:srgbClr"]) {
            let opacity = 1;
            if (solidFill["a:srgbClr"][0]["a:alpha"]) {
                opacity = solidFill["a:srgbClr"][0]["a:alpha"][0]["$"].val / 100000;
            }

            return {
                type: FillType.SOLID,
                value: `#${solidFill["a:srgbClr"]["0"]["$"]["val"]}`,
                opacity,
            };
        }

        if (solidFill["a:schemeClr"]) {
            const themeColor = getThemeColor(props.theme, solidFill["a:schemeClr"][0]["$"].val);
            return {
                type: FillType.SOLID,
                value: themeColor,
                opacity: 1,
            };
        };
    }

    return { type: FillType.NO_FILL, opacity: 1, };
}

const getGeometryPath = (geometry) => {
    const path = geometry["a:pathLst"][0]["a:path"];
    // TODO: Add another geometry type (cubicBezier, quadBezier, etc.)

    return {
        size: {
            width: emusToPoints(path[0]["$"].w),
            height: emusToPoints(path[0]["$"].h),
        },
        points: path[0]["a:lnTo"].map(parsePathPoint),
        moveTo: parsePathPoint(path[0]["a:moveTo"][0]),
    };
}

const parsePathPoint = (point) => {
    const pointTag = point["a:pt"][0]["$"];

    return {
        x: emusToPoints(pointTag.x),
        y: emusToPoints(pointTag.y),
    }
}

const parseShapeStrokeLine = (shapeProperties, props) => {
    if (shapeProperties["a:ln"] && !shapeProperties["a:ln"][0]["a:noFill"]) {
        const line = shapeProperties["a:ln"][0];
        const lineWidth = line["$"]["w"] || 12500;
        const lineStyle = parseShapeFill(line, props)
        const borderType = parseBorderType(line);

        return {
            type: borderType,
            fill: lineStyle,
            thickness: lineWidth / 12500, // pt to px
        }
    }

    return null;
}

const parseBorderType = (line) => {
    if (line["a:noFill"]) {
        return null;
    }

    if (line["a:prstDash"]) {
        const borderType = line["a:prstDash"][0]["$"]["val"] || "default";

        switch (borderType) {
            case "solid":
                return BorderType.SOLID;
            case "dot":
                return BorderType.DOTTED;
            case "dash":
                return BorderType.DASHED;
            default:
                return BorderType.SOLID;
        }
    }

    return BorderType.SOLID;
}