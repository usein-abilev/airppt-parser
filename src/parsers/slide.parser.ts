import ZipHandler from "../helpers/ziphandler";
import { readSlideFile } from "./file.parser";
import { getThemeColor, parseThemeStyles } from "./theme.parser";
import { parseListStyle, parseShapeFill, parseSlideShapes } from "./shape.parser";
import { FillType, TextAlignment } from "../types";

interface ISlideParseResult {
    theme: any;
    layers: any[];
    background: any;
    properties: any;
};

export const parseSlide = async (slideId, presentation: any): Promise<ISlideParseResult> => {
    const slide = {
        theme: null,
    };

    const slideDocument = await parseSlideComponent(`ppt/slides/slide${slideId}.xml`, {
        root: "p:sld",
    });

    const slideLayout = await parseSlideComponent(
        slideDocument.relations.find(relation => relation.type.includes("relationships/slideLayout")).url,
        { root: "p:sldLayout", relations: slideDocument.relations }
    );

    const slideMaster = await parseSlideComponent(
        slideLayout.relations.find(relation => relation.type.includes("relationships/slideMaster")).url,
        { root: "p:sldMaster", relations: slideLayout.relations }
    );

    const slideThemeFile = slideMaster.relations.find(relation => relation.type.includes("relationships/theme"));

    if (slideThemeFile) {
        const slideTheme = await ZipHandler.parseSlideAttributes(slideThemeFile.url);
        const slideThemeStyles = await parseThemeStyles(slideTheme)

        slide.theme = {
            ...slideThemeStyles,
            colorSchemeMap: {
                ...slideThemeStyles.colorSchemeMap,
                ...slideMaster.colorMap,
            }
        };
    }

    const slideDocumentLayer = slideDocument.shapes.map(slideShape => {
        if (slideShape.expired) return;
        slideShape.expired = true;

        const layoutPart = slideLayout.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, slideShape.placeholder))
        const masterPart = slideMaster.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, slideShape.placeholder));
        let merged = slideShape;

        if (layoutPart) {
            merged = mergeShapeLayers(layoutPart, slideShape);
            layoutPart.expired = true;
        }

        if (masterPart) {
            merged = mergeShapeLayers(masterPart, merged);
            masterPart.expired = true;
        }

        return merged;
    }).filter(item => item);

    const slideLayoutLayer = slideLayout.shapes.map(layoutShape => {
        if (layoutShape.expired) return;
        layoutShape.expired = true;
        const masterPart = slideMaster.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, layoutShape.placeholder));

        if (masterPart) {
            masterPart.expired = true;
            return mergeShapeLayers(masterPart, layoutShape);
        } else {
            return layoutShape;
        }
    }).filter(item => item);

    const slideMasterLayer = slideMaster.shapes.map(master => {
        if (master.expired) return;
        master.expired = true;

        return {
            master: true,
            ...master
        };
    }).filter(item => item);

    const slideDocumentLayerChanged = applyThemeToShapes(
        slide.theme,
        slideMaster.textStyles
            ? applyTextStylesToLayer(slideMaster.textStyles, slideDocumentLayer)
            : slideDocumentLayer
    );

    return {
        ...slide,
        properties: {
            ...slideMaster.properties,
            ...slideLayout.properties,
            ...slideDocument.properties,
        },
        background: resolveBackground(slideDocument.background || slideLayout.background || slideMaster.background, slide.theme),
        layers: [
            slideMasterLayer,
            slideLayoutLayer,
            slideDocumentLayerChanged,
        ].filter(item => item.length),
    };
}

const applyTextStylesToLayer = (textStyles: any, shapes) => {
    const titleTypes = ["title", "ctrTitle"];
    const bodyTypes = ["body", "subTitle"];

    return shapes.map(shape => {
        if (titleTypes.includes(shape.placeholder.type)) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.title);

            const defaultLevelName = shape.text.levelStyle.levels?.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];

            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);
        } else if (bodyTypes.includes(shape.placeholder.type)) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.body);

            const defaultLevelName = shape.text.levelStyle.levels?.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];

            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);

        } else if (shape.text) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.other);

            const defaultLevelName = shape.text.levelStyle.levels?.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];

            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);
        }

        return shape;
    })
}

const applyTextStylesToParagraphs = (paragraphs, textStyles, defaultLevel) => {
    return paragraphs.map(paragraph => {
        const clone = { ...paragraph };
        const level = clone.properties.level;

        if (level) {
            const levelKey = Object.keys(textStyles).find(item => item.includes(String(Number(level) + 1)));
            const currentStyle = textStyles[levelKey];

            clone.properties = {
                ...currentStyle,
                ...clone.properties,
                fill: clone.properties.fill.type === FillType.NO_FILL
                    ? currentStyle.fill
                    : clone.properties.fill,
            }
        }

        if (defaultLevel) {
            clone.properties = {
                ...defaultLevel,
                ...clone.properties,
                fill: clone.properties.fill.type === FillType.NO_FILL
                    ? defaultLevel.fill
                    : clone.properties.fill,
            }
        }

        return clone;
    });
}

const applyThemeToShapes = (theme, shapes) => {
    return shapes.map(shape => {
        const copy = { ...shape };
        if (shape.containerStyle.fill?.type === FillType.VARIABLE) {
            copy.containerStyle.fill = getThemeColor(shape.containerStyle.fill.value, theme);
        }

        if (shape.text?.paragraphs?.length) {
            copy.text.paragraphs = shape.text.paragraphs.map(paragraph => {
                if (paragraph.properties.fontFamily && theme?.fontScheme?.fonts) {
                    const { fontFamily } = paragraph.properties;
                    switch (fontFamily) {
                        case "+mn-lt": {
                            paragraph.properties.fontFamily = theme.fontScheme.fonts.minor.latin;
                            break;
                        }

                        case "+mj-lt": {
                            paragraph.properties.fontFamily = theme.fontScheme.fonts.major.latin;
                            break;
                        }
                    }
                }

                if (paragraph.properties.fill?.type === FillType.VARIABLE) {
                    paragraph.properties = {
                        ...paragraph.properties,
                        fill: getThemeColor(paragraph.properties.fill.value, theme)
                    };
                }

                return {
                    ...paragraph,
                    properties: {
                        spaceAfter: 0,
                        spaceBefore: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        lineSpacing: 0,
                        alignment: TextAlignment.LEFT,
                        ...paragraph.properties,
                    }
                };
            })
        }

        return copy;
    });
}

const mergeShapeTextStyles = (shapeLevelStyles, textStyles) => {
    const result = {};

    textStyles.levels?.forEach(level => {
        result[level] = shapeLevelStyles?.[level] ? {
            ...textStyles[level],
            ...shapeLevelStyles[level],
        } : textStyles[level]
    });

    return result;
}

const mergeShapeLayers = (target, source) => {
    const text = (source.text || target.text) && {
        ...target.text,
        ...source.text,
        levelStyle: {
            ...target.text?.levelStyle,
            ...source.text?.levelStyle,
        },
        paragraphs: source.text?.paragraphs?.map((item, index) => {
            const a = target.text?.paragraphs?.[index];

            return ({
                ...a,
                ...item,
                properties: {
                    ...a?.properties,
                    ...item?.properties,
                }
            })
        }) || [],
        style: {
            ...target.text?.style,
            ...source.text?.style,
        }
    };

    return {
        ...target,
        ...source,
        box: {
            ...target.box,
            ...source.box,
        },
        placeholder: {
            type: target.placeholder.type || source.placeholder.type,
            id: target.placeholder.id || source.placeholder.id,
        },
        geometry: source.geometry || target.geometry,
        text,
    }
}

const shapePlaceholderAreEqual = (placeholderA, placeholderB) => {
    if (!placeholderA.type && !placeholderA.id) return false;
    if (!placeholderA.type && !placeholderB.type) return placeholderA.id === placeholderB.id;
    if (!placeholderA.type || !placeholderB.type) {
        return placeholderA.id === placeholderB.id;
    }

    return placeholderA.type === placeholderB.type && placeholderA.id === placeholderB.id;
}

const parseSlideComponent = async (path: string, options: any = {}) => {
    const document = await readSlideFile(
        path
    );

    const slide: any = {
        properties: {},
        colorMap: null,
        textStyles: null,
        shapes: [],
        background: null,
        relations: document.relations,
        raw: document.content,
    };

    const documentRoot = document.content[options.root];

    if (documentRoot.$.type) slide.properties.type = documentRoot.$.type;

    if (documentRoot["p:cSld"][0]) {
        const slideContent = documentRoot["p:cSld"][0];
        const slideBackground = await parseSlideBackground(slideContent, {}, document.relations);
        const documentShapes = await resolveRelations(
            parseSlideShapes(slideContent["p:spTree"][0], options),
            document.relations
        );
        slide.shapes = documentShapes;
        slide.background = slideBackground;
    }

    if (documentRoot["p:clrMap"]) {
        slide.colorMap = documentRoot["p:clrMap"][0].$;
    }

    if (documentRoot["p:clrMapOvr"]) {
        // TODO: Parse color map override
    }

    if (documentRoot["p:txStyles"]) {
        const textStylesElement = documentRoot["p:txStyles"][0];
        slide.textStyles = {
            title: parseListStyle(textStylesElement["p:titleStyle"]?.[0]),
            body: parseListStyle(textStylesElement["p:bodyStyle"]?.[0]),
            other: parseListStyle(textStylesElement["p:otherStyle"]?.[0]),
        }
    }

    return slide;
}

const resolveRelations = (shapes, relations) => {
    return Promise.all(
        shapes.filter(shape => shape).map(async shape => {
            if (shape.needPreload) {
                if (shape.containerStyle.fill.type === FillType.BLIP) {
                    const blipRelation = relations.find(relation => relation.id === shape.containerStyle.fill.value.id);
                    if (blipRelation) {
                        shape.containerStyle.fill.value.binary = await ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
                    }
                }
            }

            Reflect.deleteProperty(shape, "needPreload");

            return shape;
        })
    );
}

const resolveBackground = (background, theme) => {
    if (!background) return null;
    if (background.type === FillType.VARIABLE) {
        return getThemeColor(background.value, theme);
    }

    return background;
}

const parseSlideBackground = async (slideCommonData, props, relations) => {
    const background = slideCommonData?.["p:bg"]?.[0];
    if (!background) return null;

    if (background["p:bgPr"]) {
        const fill = parseShapeFill(background["p:bgPr"][0], props);

        if (fill.type === FillType.BLIP) {
            if (!fill.value?.id) return null;

            const blipRelation = relations.find(relation => relation.id === fill.value.id);
            if (blipRelation) {
                fill.value.binary = await ZipHandler.getFileInZip(blipRelation.url, "arraybuffer")
            }
        }

        return fill;
    }

    if (background["p:bgRef"]?.[0]) {
        // http://officeopenxml.com/prSlide-background.php
        const backgroundReference = background["p:bgRef"]?.[0];

        if (!backgroundReference?.$?.idx || backgroundReference?.$?.idx === "0" || background?.$?.idx === "1000") return null;

        const referenceId = Number(backgroundReference.$.idx);

        return {
            referenceId,
            ...getThemeColor(backgroundReference["a:schemeClr"][0]["$"].val, props.theme)
        }
    }

    return null;
}