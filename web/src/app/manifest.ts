import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promise Fertility",
    short_name: "Promise",
    description: "IVF hospital information management system",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f9",
    theme_color: "#14171c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
