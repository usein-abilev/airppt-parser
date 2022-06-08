import React from "react";
import { createRoot } from "react-dom/client";
import { AirParser } from "./main";

function App() {
    const [presentation, setPresentation] = React.useState(null);

    React.useEffect(() => {
        const parser = new AirParser("https://test.cabinet24.com.ua/api/file/c29bb85495298111f3e0a8a2e4b37cc4.pptx");
        parser.parse().then(result => setPresentation(result));
    }, []);

    React.useEffect(() => {
        if (!presentation) return;
        console.log("presentation:", presentation);
        presentation.slides.forEach((slide, slideIndex) => {
            const canvas = document.getElementById(`canvas#${slideIndex + 1}`);
            const context = canvas.getContext('2d');

            slide.elements.forEach((element) => {
                if (element.shapeType === "rect") {
                    context.beginPath();
                    context.fillStyle = element.shape.fill ? `#${element.shape.fill.color}0` : "transparent";
                    context.rect(element.position.x, element.position.y, element.offsetPosition.x, element.offsetPosition.y);
                    context.closePath();

                    if (element.paragraph) {
                        const fontSize = element.paragraph.textCharacterProperties.size / 72;
                        context.fillStyle = `#${element.paragraph.textCharacterProperties.fillColor}`;
                        context.textAlign = element.paragraph.paragraphProperties.alignment || "left";
                        context.font = `${fontSize}px ${element.paragraph.textCharacterProperties.font}`;

                        const measureText = context.measureText(element.paragraph.text);
                        const lines = Math.floor(measureText.width / (measureText.actualBoundingBoxRight));

                        console.log("Text:", element.paragraph.text, lines);
                        context.fillText(element.paragraph.text, element.position.x + (context.textAlign === "center" ? element.offsetPosition.x / 2 : 0), element.position.y + fontSize);
                    }

                    if (element.specialtyType === "Image") {
                        console.log("element", element);
                        const blob = new Blob([element.imageBuffer], { type: "image/png" });
                        const img = new Image();
                        img.src = URL.createObjectURL(blob);
                        img.onload = () => {
                            context.drawImage(img, element.position.x, element.position.y, element.offsetPosition.x, element.offsetPosition.y);
                        }
                    }
                }
            })

        });
    }, [presentation]);

    return <div style={{
        display: "flex",
        width: "fit-content",
        margin: "20px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    }}>{presentation && presentation.slides.map((item, index) => <canvas style={{ background: "rgba(0, 0, 0, .8)" }} key={index + 1} id={`canvas#${index + 1}`} width={presentation.size.width} height={presentation.size.height} />)}</div>
}


const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);