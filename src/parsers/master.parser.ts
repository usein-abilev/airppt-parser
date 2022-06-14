import ZipHandler from "../helpers/ziphandler"
import { parseRelations } from "./relation.parser";

export const parseSlideMaster = async (slideId) => {
    try {
        const slideMasterPath = `ppt/slideMasters/slideMaster${slideId}.xml`;
        const slideMasterRelationPath = `ppt/slideMasters/_rels/slideMaster${slideId}.xml.rels`;

        const slideMasterContent = await ZipHandler.parseSlideAttributes(slideMasterPath);
        const slideMasterRelationsContent = await ZipHandler.parseSlideAttributes(slideMasterRelationPath);

        return {
            content: slideMasterContent,
            relations: parseRelations(slideMasterRelationsContent),
        };
    } catch (error) {
        return null;
    }
}