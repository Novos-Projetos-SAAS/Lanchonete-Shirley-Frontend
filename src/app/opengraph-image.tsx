/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

export const runtime = "nodejs";
export const alt = "Lanchonete Shirley — peça seu lanche online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * WhatsApp costuma mostrar somente um recorte quadrado do centro da imagem.
 * O título, o lanche e o convite para pedir ficam integralmente na faixa
 * central de 630 px (x: 285 a 915), sem depender das laterais do banner.
 */
export default async function OpenGraphImage() {
  const photoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "produtos",
    "hamburguer-artesanal",
    "x-tudo.webp",
  );

  const photoBuffer = await readFile(photoPath);
  const photoPng = await sharp(photoBuffer)
    .resize(580, 400, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const photoSrc = "data:image/png;base64," + photoPng.toString("base64");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        alignItems: "center",
        flexDirection: "column",
        width: 1200,
        height: 630,
        backgroundColor: "#faf7f3",
        fontFamily: "sans-serif",
        color: "#27221f",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: -135,
          top: -235,
          width: 440,
          height: 440,
          borderRadius: "50%",
          backgroundColor: "#ad3226",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: -210,
          bottom: -270,
          width: 500,
          height: 500,
          borderRadius: "50%",
          backgroundColor: "#ad3226",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 20,
          left: 340,
          right: 340,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#ad3226",
            color: "#fff",
            fontSize: 31,
            fontWeight: 800,
          }}
        >
          S
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -0.8,
          }}
        >
          Lanchonete
        </div>
        <div
          style={{
            display: "flex",
            marginTop: -10,
            fontSize: 63,
            fontWeight: 800,
            letterSpacing: -2.4,
            color: "#ad3226",
          }}
        >
          Shirley
        </div>
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 195,
          left: 320,
          width: 560,
          height: 325,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(39,34,31,0.14)",
          border: "6px solid #fff",
        }}
      >
        <img
          src={photoSrc}
          width={560}
          height={325}
          alt="Hambúrguer X-Tudo da Lanchonete Shirley"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 363,
          bottom: 34,
          width: 474,
          height: 69,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 13,
          backgroundColor: "#ad3226",
          fontSize: 27,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        Peça seu lanche online
      </div>
    </div>,
    size,
  );
}
