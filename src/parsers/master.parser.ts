import ZipHandler from "../helpers/ziphandler"
import { parseRelations } from "./relation.parser";

export const parseSlideMaster = async (slideRelations) => {
    const slideLayout = slideRelations.find(relation => relation.type.includes("relationships/slideLayout"));
    if (!slideLayout) return;

    const slideLayoutRelationPath = `${slideLayout.url.split("/").slice(0, 2).join("/")}/_rels/${slideLayout.url.split("/").pop()}.rels`;
    const slideLayoutRelationContent = await ZipHandler.parseSlideAttributes(slideLayoutRelationPath);

    const slideLayoutRelations = parseRelations(slideLayoutRelationContent);
    const slideMasterRelation = slideLayoutRelations.find(relation => relation.type.includes("relationships/slideMaster"));
    const slideMasterContent = await ZipHandler.parseSlideAttributes(slideMasterRelation.url);

    const slideMasterRelationsPath = `${slideMasterRelation.url.split("/").slice(0, 2).join("/")}/_rels/${slideMasterRelation.url.split("/").pop()}.rels`;
    const slideMasterRelationsContent = await ZipHandler.parseSlideAttributes(slideMasterRelationsPath);

    return {
        content: slideMasterContent,
        relations: parseRelations(slideMasterRelationsContent),
    };
}