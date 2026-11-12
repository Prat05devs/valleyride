# Home page hero photos

The home page hero cycles through one photo per kind of ride (`apps/web/components/layout/hero-slideshow.tsx`,
slides listed in `apps/web/app/(public)/page.tsx` → `HERO_SLIDES`). The same photos are used, one or two per page, by
Valley Ride Capital (weekend + touring, cross-fading), the login page (city), the scooty page (city), places to visit
(touring) and routes (off-road): `apps/web/lib/photos.ts`.

The current set was generated with Google Gemini (November 2026) from the prompts below. Gemini stamps a sparkle in
the bottom-right corner; it was removed by cropping each 2752 × 1536 original to x 0–2560, y 48–1488 (16:9). They
are stored as `apps/web/public/images/hero/<name>-1280.webp`, `-1920.webp` and `-2560.webp`.

| Name | Ride | Bikes in the photo |
|---|---|---|
| `hero-city` | City rides | Honda Activa 125, Royal Enfield Hunter 350 |
| `hero-weekend` | Weekend hill rides | Royal Enfield Scram 440, Triumph Scrambler 400 X |
| `hero-touring` | Long tours | Royal Enfield Himalayan 450, Suzuki V-Strom SX 250 |
| `hero-offroad` | Off-road and high mountains | KTM 390 Adventure X, Hero XPulse 210 |

## Requirements for every photo

- 16:9, at least 1920 × 1080. Saved as JPEG, quality ~80, under ~350 KB.
- Bikes in the **right half** of the frame. The left 40% holds the headline and the search bar, so keep it calm
  (sky, road, soft background). The bottom 25% sits under the search bar.
- Bikes parked, no rider (or a rider standing beside them, face not visible), no text, no watermarks, no number plates
  readable.
- Each bike must look like the real model: attach its cut-out from `apps/web/public/images/cut-<slug>.png` as a
  reference image. Reject any result where a bike is visibly wrong (wrong tank shape, wrong wheels, garbled logo).
- Real Uttarakhand look: deodar and pine forest, terraced hills, Garhwal peaks; not the Alps.

## Prompts

Attach the two reference cut-outs for that photo, paste the prompt, then the composition rules below it.

**hero-city.jpg**
> Doon after dark. A Honda Activa 125 and a Royal Enfield Hunter 350 parked side by side on a rain-washed street in Mussoorie's Mall Road just after sunset, wet cobbles reflecting warm café windows, string lights and old colonial shopfronts, a faint blue dusk sky over pine-covered hills behind. Low camera angle at headlight height, 35 mm lens, f/2.8, glossy reflections on the tank and mirrors, cinematic teal-and-amber grade, shot on Sony A7R V, crisp detail.

**hero-weekend.jpg**
> Above the clouds. A Royal Enfield Scram 440 and a Triumph Scrambler 400 X parked at a hairpin bend on the Mussoorie–Dhanaulti road at sunrise, a sea of clouds filling the valley below, deodar silhouettes on the ridge, first golden light rim-lighting the tanks and spokes, dew on the tarmac. Three-quarter front view, 24 mm lens, f/5.6, volumetric morning haze, rich warm highlights and cool shadows, magazine-cover adventure photography.

**hero-touring.jpg**
> Road to the snow. A Royal Enfield Himalayan 450 and a Suzuki V-Strom SX 250 loaded with soft saddlebags and a duffel, parked on a pull-out of the Uttarkashi–Harsil highway above the turquoise Bhagirathi river, snow-capped Garhwal peaks glowing pink and gold in late-afternoon light, prayer flags fluttering on a rock, long shadows across the road, fine dust in the sunbeams. 35 mm lens, f/8, epic sense of scale, natural vivid colours, travel-documentary look.

**hero-offroad.jpg**
> Dirt and water. A KTM 390 Adventure X and a Hero XPulse 210, splashed with fresh mud, parked on a rocky gravel trail at the edge of a shallow mountain stream near Chakrata, sunbeams cutting through a dense deodar forest, water droplets sparkling, wet stones in the foreground. Low dramatic angle from just above the water, 24 mm lens, f/4, high-contrast morning light, punchy but natural colours, rally-poster energy.

**Composition rules (paste after every prompt)**
> Composition: ultra-wide 16:9 cinematic frame, bikes parked in the RIGHT half of the frame, the left 40% calm and uncluttered (sky, mist or soft background) for website headline text, bottom quarter simple road or ground. Both bikes must match the attached reference photos exactly: same model, shape, colours, wheels and badges. Photorealistic, not CGI, no riders, no people, no text, no watermark, no readable number plates.

## Adding or replacing a photo

1. Crop to 16:9 (remove any generator watermark by cropping, not by painting over it) and export WebP at 1280, 1920
   and 2560 px wide into `apps/web/public/images/hero/` (quality ~75; each under ~650 KB).
2. Home page: add it to `HERO_SLIDES` with a descriptive `alt` (read by search engines and screen readers), the
   kicker, title and bike names, `href` to the most relevant page, and `position` to frame the bikes on phones (for
   example `'30% center'` when the main bike is on the left). Other pages: add it to `HERO_PHOTOS` in `lib/photos.ts`.
3. Check it on a phone (390 px wide) and on a 1440 px screen.
