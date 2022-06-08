import { LinkType } from "airppt-models/pptelement";
/**
 * Parse everything that deals with relations such as hyperlinks and local images
 */
export default class SlideRelationsParser {
    static slideRels: any;
    /**
     *
     * @param theme Parsed XML with theme colors
     */
    static setSlideRelations(rels: any): void;
    static resolveShapeHyperlinks(element: any): {
        type: LinkType;
        url: any;
    };
    static getRelationDetails(relID: any): {
        type: LinkType;
        url: any;
    };
}
