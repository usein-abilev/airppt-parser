import ZipHandler from "../helpers/ziphandler"
import * as format from "string-template";
import { parseSlideMaster } from "./master.parser";
import { parseRelations } from "./relation.parser";
import { parseThemeStyles } from "./theme.parser";
import { parseShapeFill, parseSlideShapes } from "./shape.parser";
import { FillType } from "../types";

export const parseSlide = async (slideId) => {
    const slideDocument = await ZipHandler.parseSlideAttributes(format("ppt/slides/slide{0}.xml", slideId));
    const slideRelationsDocument = await ZipHandler.parseSlideAttributes(format("ppt/slides/_rels/slide{0}.xml.rels", slideId));

    // Parse master slide and relations
    const slideRelations = await parseRelations(slideRelationsDocument);
    const slideMaster = await parseSlideMaster(slideRelations);

    // Parse slide theme styles
    const slideThemePath = slideMaster.relations.find(relation => relation.type.includes("relationships/theme"));
    const slideTheme = await ZipHandler.parseSlideAttributes(slideThemePath.url);
    const slideThemeStyles = await parseThemeStyles(slideTheme);

    const props = {
        theme: slideThemeStyles,
        slideRelations: slideRelations,
        slideMasterRelations: slideMaster.relations,
    }

    const slideBackgrounds = await Promise.all([
        parseSlideBackground(slideMaster.content["p:sldMaster"]["p:cSld"][0], props, slideMaster.relations),
        parseSlideBackground(slideDocument["p:sld"]["p:cSld"][0], props, slideRelations),
    ]);

    const layers = await Promise.all([
        resolveRelations(parseSlideShapes(slideMaster.content["p:sldMaster"]["p:cSld"][0]["p:spTree"][0], props), slideMaster.relations),
        resolveRelations(parseSlideShapes(slideDocument["p:sld"]["p:cSld"][0]["p:spTree"][0], props), slideRelations),
    ]);

    return {
        backgrounds: slideBackgrounds.filter(a => a),
        layers,
        theme: slideThemeStyles,
    }
}


const resolveRelations = (shapes, relations) => {
    return Promise.all(
        shapes.map(async shape => {
            if (shape.needPreload) {
                if (shape.style.fill.type === FillType.BLIP) {
                    const blipRelation = relations.find(relation => relation.id === shape.style.fill.value.id);
                    if (blipRelation) {
                        shape.style.fill.value.binary = await ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
                    }
                }
            }

            Reflect.deleteProperty(shape, "needPreload");

            return shape;
        })
    );
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

    if (background["p:bgRef"]) {
        console.log("Background reference not supported!");
    }

    return null;
}