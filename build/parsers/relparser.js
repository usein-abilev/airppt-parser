import { CheckValidObject } from "../helpers/checkobj";
import { LinkType } from "airppt-models/pptelement";
/**
 * Parse everything that deals with relations such as hyperlinks and local images
 */
export default class SlideRelationsParser {
    /**
     *
     * @param theme Parsed XML with theme colors
     */
    static setSlideRelations(rels) {
        this.slideRels = rels;
    }
    static resolveShapeHyperlinks(element) {
        let relID = CheckValidObject(element, '["p:nvSpPr"][0]["p:cNvPr"][0]["a:hlinkClick"][0]["$"]["r:id"]');
        relID = CheckValidObject(element, '["p:blipFill"][0]["a:blip"][0]["$"]["r:embed"]');
        if (!relID) {
            return null;
        }
        let linkDetails = this.getRelationDetails(relID);
        return linkDetails;
    }
    static getRelationDetails(relID) {
        let relations = this.slideRels["Relationships"]["Relationship"];
        for (var relation of relations) {
            let relationDetails = relation["$"];
            if (relationDetails["Id"] == relID) {
                let linkType = LinkType.Asset;
                if (relationDetails["TargetMode"] && relationDetails["TargetMode"] === "External") {
                    linkType = LinkType.External;
                }
                else {
                    linkType = LinkType.Asset;
                }
                let relElement = {
                    type: linkType,
                    url: relationDetails["Target"].replace("..", "ppt") //update any relative paths
                };
                return relElement;
            }
        }
        return null;
    }
}
