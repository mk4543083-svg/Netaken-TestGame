import { createFileRoute } from "@tanstack/react-router";
import Game from "../game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NETA-KEN: ABSOLUTE CINEMA" },
      { name: "description", content: "Retro PS1-style 3D political parody fighting game. Play in browser or on mobile." },
      { property: "og:title", content: "NETA-KEN: ABSOLUTE CINEMA" },
      { property: "og:description", content: "Retro PS1-style 3D political parody fighting game." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" },
    ],
  }),
  component: () => <Game />,
});
