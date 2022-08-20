declare class PresentationDrawer {
    presentation: any;
    constructor(presentation: any);
    drawSlide(canvas: HTMLCanvasElement, slideIndex: number): Promise<void>;
    private drawSlideBackground;
    private renderSlideLayer;
    private renderCustom;
    private renderRect;
    private renderText;
    private renderEllipse;
    private splitTextByLines;
}
export default PresentationDrawer;
