# Mascot art

Drop the four chibi character PNGs here with these exact filenames. The app
renders a placeholder bubble until they exist, so nothing breaks in the meantime.

| File           | Pose from the source art                                  | Used for                                      |
| -------------- | --------------------------------------------------------- | --------------------------------------------- |
| `wave.png`     | Waving, holding the phone with the shopping list on screen | Welcome tips, empty list                      |
| `basket.png`   | Walking with the lilac shopping basket                     | Shopping tab, trip in progress                |
| `thinking.png` | Finger to chin, holding the notepad                        | Deals tab, prompts to set a price             |
| `thumbsup.png` | Thumbs up with the paper grocery bag                       | Trip complete, checkout, positive summaries   |

The pastel kitten background wash lives at `assets/bg-theme.png` — a seamless
tiling pattern, rendered opaque and repeating (not stretched) via
`resizeMode="repeat"` in `Screen` (`src/components/ui.tsx`).

Recommended for the character poses: trim to the character, transparent
background, ~512px on the long edge. The originals are square with a white
background; removing the background makes them sit properly on the pink wash.
