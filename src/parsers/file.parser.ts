import * as format from "string-template";
import ZipHandler from "../helpers/ziphandler"
import { parseRelations } from "./relation.parser";

const convertToRelationPath = (path: string) => {
    if (!path.length) return;
    const lastSlashIndex = path.lastIndexOf("/");
    const lastFolder = path.slice(0, lastSlashIndex);
    const lastPathPart = path.slice(lastSlashIndex + 1, path.length);

    return `${lastFolder}/_rels/${lastPathPart}.rels`;
}
export const readSlideFile = async (
    slidePath: string,
) => {
    try {
        const slideRelationPath = convertToRelationPath(slidePath);
        const slideContent = await ZipHandler.parseSlideAttributes(slidePath);
        const slideRelationsContent = await ZipHandler.parseSlideAttributes(slideRelationPath);

        return {
            content: slideContent,
            relations: parseRelations(slideRelationsContent),
        };
    } catch (error) {
        console.error("Reading presentation file error:", error)
        return null;
    }
}