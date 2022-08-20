import React from "react";
import { createRoot } from "react-dom/client";
import PresentationDrawer from "./demo.render";
import { AirParser } from "./main";
function App() {
    const [presentation, setPresentation] = React.useState(null);
    const erroredPresentation = "https://test.cabinet24.com.ua/api/file/fdda5859a0a3cf2284f192ca11c67c6a.pptx";
    const okPresentation = "https://test.cabinet24.com.ua/api/file/5a328a74383e59b794258925c93c46cb.pptx";
    React.useEffect(() => {
        fetch("https://test.cabinet24.com.ua/api/file/c696442042d45daf1aa007b20d01a6da.pptx").then(res => res.blob()).then(response => {
            var reader = new FileReader();
            reader.onload = function () {
                const parser = new AirParser(this.result);
                parser.parse().then(result => setPresentation(result));
            };
            reader.readAsDataURL(response);
        });
    }, []);
    React.useEffect(() => {
        if (!presentation)
            return;
        const drawer = new PresentationDrawer(presentation);
        console.log("Presentation:", presentation);
        presentation.slides.forEach(async (slide, slideIndex) => {
            const canvas = document.getElementById(`canvas#${slideIndex + 1}`);
            canvas.width = presentation.size.width;
            canvas.height = presentation.size.height;
            drawer.drawSlide(canvas, slideIndex);
        });
    }, [presentation]);
    return React.createElement("div", { style: {
            display: "flex",
            width: "fit-content",
            margin: "20px",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
        } }, presentation && presentation.slides.map((item, index) => React.createElement("canvas", { style: { background: "rgba(0, 0, 0, .8)" }, key: index + 1, id: `canvas#${index + 1}`, width: presentation.size.width, height: presentation.size.height })));
}
const container = document.getElementById("root");
const root = createRoot(container);
root.render(React.createElement(App, null));
