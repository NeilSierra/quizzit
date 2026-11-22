import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quizzit — Import, Practice & Master",
    short_name: "Quizzit",
    description:
      "Bring your own question files, customize your quiz, and celebrate every milestone.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#225577",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
