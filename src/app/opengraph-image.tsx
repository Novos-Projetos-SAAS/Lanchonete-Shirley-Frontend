/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

export const runtime = "nodejs";

export const alt =
  "Lanchonete Shirley — hambúrgueres, cachorro-quente, porções e bebidas. Peça online.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
    .resize(520, 520, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  const photoSrc = "data:image/png;base64," + photoPng.toString("base64");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#fafaf9",
        color: "#27221f",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          backgroundColor: "#ad3226",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 688,
          padding: "64px 0 54px 66px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: "#ad3226",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 15,
              fontSize: 23,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            LANCHONETE SHIRLEY
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 83,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: -2.5,
            lineHeight: 1.07,
          }}
        >
          <div>Seu lanche favorito,</div>
          <div style={{ color: "#ad3226" }}>feito na hora.</div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 27,
            maxWidth: 560,
            fontSize: 22,
            lineHeight: 1.42,
            color: "#615c59",
          }}
        >
          Hambúrgueres, cachorro-quente, porções e bebidas. Escolha e peça online.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 47,
              padding: "0 20px",
              borderRadius: 8,
              backgroundColor: "#ad3226",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.4,
              color: "#fff",
            }}
          >
            CONFIRA O CARDÁPIO
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 18,
              color: "#615c59",
              fontSize: 17,
            }}
          >
            Faça seu pedido pelo site
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 0,
          top: 10,
          bottom: 0,
          width: 470,
          backgroundColor: "#27221f",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 70,
          right: 47,
          width: 430,
          height: 490,
          borderRadius: 24,
          overflow: "hidden",
          border: "7px solid #fff",
        }}
      >
        <img
          src={photoSrc}
          alt="Hambúrguer X-Tudo do cardápio"
          width={430}
          height={490}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>,
    size,
  );
}
