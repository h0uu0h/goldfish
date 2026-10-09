# Goldfish system appearance

Open **系统样式** on the desktop, from the desktop context menu, or at `/settings`.
Settings apply immediately and persist in this browser. The panel is available in production too.

## Shared tokens

`designTokens.js` normalizes settings and generates CSS custom properties:

| Family | Tokens | Used by |
| --- | --- | --- |
| Color | `--os-accent`, `--os-accent-hover`, `--os-accent-soft`, `--os-on-accent` | Buttons, selection, focus, sliders, menus |
| Neutrals | `--os-ink`, `--os-muted`, `--os-paper`, `--os-line`, `--os-line-soft` | Text, fields, dividers |
| Typography | `--os-font`, `--os-font-size`, `--os-font-sm`, `--os-font-lg` | System UI and About |
| Spacing | `--os-space-{panel,group,row,control}-{x,y}` | Panels, groups, rows, control interiors |
| Shape | `--os-radius`, `--os-control-radius` | Windows, Dock, menus, controls |
| Dimensions | `--os-control-h`, `--os-titlebar-h` | Control and titlebar sizing |

Use the React components in `../Controls/Controls.jsx`: `Button`, `Input`, `Select`, `Slider`, `SegmentedControl`, `ColorPicker`, and `ColorSwatches`. Do not copy native-control markup and local styles into applications. Select uses the shared MenuSurface/MenuItem in a top-layer popover, with a Mac-style double-chevron trigger, selected checkmark, keyboard navigation, typeahead, and disabled options. Other input controls retain native keyboard behavior. Image controls and the window traffic lights retain their semantic shapes/colors. Editorial work-detail layouts retain their own scale.

## Wallpaper colors

`colors.js` samples the current wallpaper into a 64×64 canvas, quantizes pixels into RGB buckets, scores population with a saturation preference, and returns up to five separated representative colors. Near-black/near-white clusters are downweighted, not excluded. A monochrome image still produces a theme. Results are cached per image URL. Sampling stays in the browser; no image is sent to another service.

The first representative color drives automatic mode. Button backgrounds are darkened until white text reaches a 4.5:1 contrast ratio; tinted neutral and surface colors are generated from the source. `--os-accent-text` separately increases source chroma and darkens emphasis text to reach 7:1 against a light-gray paper reference (#e0e0e0); it preserves neutral sources and does not change the selected source color. These checks cover the generated opaque colors, not every possible translucent wallpaper composite.

An old asynchronous result cannot overwrite a newer wallpaper. Failed/CORS-blocked image reads use the manifest average color, then a neutral green fallback. Manual mode freezes a chosen source color. The color picker and palette swatches enter manual mode.

## Persistence and paper

`goldfish.design` stores system settings. `goldfish.paperlab` stores paper parameters. Invalid data is normalized; unavailable storage leaves the session usable. Customized older papers are preserved; the untouched previous default migrates to the new default.

`paperMaterial.js` owns the supplied default paper parameters, including formation 0.74 and seed 739 (SVG seed 705). In the material section, **恢复默认** restores the full supplied material. **复制样式** exports the combined theme and paper CSS. Reset affects only the selected section.

## Verification

From `frontend`: `npm run lint`, `node --test tests/design-system.test.mjs`, `npm run build`.
Browser QA covers wallpaper changes, manual mode, keyboard ranges, typography/radius updates, reload persistence, and narrow/wide layouts.

## Reusable settings layout

`SettingsPanel`, `SettingsGroup`, and `SettingsRow` in `../Settings/Settings.jsx` own navigation, scroll/footer layout, group boundaries, and accessible field labels. Applications provide only settings data and handlers. Example:

`SettingsRow` defaults to vertically centered labels for single-line controls. Use `labelAlign="start"` for image previews or multi-line content; this aligns the label with the top of the content without changing the alignment of actions inside it.

```jsx
<SettingsGroup title="布局">
  <SettingsRow label="字体">
    {id => <Select id={id} value={font} options={fonts} onValueChange={setFont} />}
  </SettingsRow>
</SettingsGroup>
```

System UI contains operational labels, current values, and necessary status only. Do not add uppercase eyebrow headings, slogans, explanatory paragraphs, duplicate page titles, demo cards, or disabled sample controls. Explanations and implementation details belong in developer documentation.

## Density and spacing hierarchy

Horizontal and vertical spacing select independent presets. Use `-x` for horizontal spacing and `-y` for vertical spacing. Horizontal spacing compresses the outer layers first; standard, compact, and relaxed presets all preserve 4px inside controls. The smallest preset explicitly uses 2px at every layer.

| Horizontal preset | Panel edge | Row inset / group gap | Control interior |
| --- | ---: | ---: | ---: |
| 宽松 | 12 | 8 | 4 |
| 标准 | 10 | 6 | 4 |
| 紧凑 | 8 | 6 | 4 |
| 极紧凑 | 2 | 2 | 2 |

Do not recompute horizontal spacing by repeatedly halving a base value. `horizontalSpacingScale` is the shared source of truth. Buttons, inputs, selects, and segments use the control interior token for text padding.

Vertical spacing retains `max(1, round(outer / 2 ** depth))` for panel, group, row, and control levels: 极紧凑 8/4/2/1, 紧凑 12/6/3/2, 标准 16/8/4/2, 宽松 24/12/6/3. Control heights derive from text line height, vertical padding and border, with a 24px minimum.

Persist `densityX` and `densityY`. Legacy `density` or `spacing` migrates to the vertical setting; horizontal starts at 宽松. Existing colors, font, and radius are retained. Changing horizontal density must not change vertical padding, control height or titlebar height. Reset layout restores 宽松 horizontally and 标准 vertically. Old unqualified `--os-space*` aliases remain for legacy vertical consumers.

## Nested radii and selection

Standalone controls use the configured radius. A directly nested shape derives its radius from the enclosing border box: `max(0px, outer radius - border width - padding)`. Do not copy the outer radius onto its inner shape or apply a percentage multiplier. Keep a single circular radius for all corners. If horizontal and vertical insets differ, subtract the larger inset; never use separate X/Y radii to stretch controls into ellipses.

- Segmented controls cap their outer radius at half the control height, then subtract their 1px border and 2px padding from each inner segment's radius.
- Controls in settings groups subtract the group border and the larger row padding, publishing a local `--os-control-radius` shared by buttons, inputs, selects, thumbnails, and nested segments.
- Top-bar dropdowns and context menus use `MenuSurface`, `MenuItem`, and `MenuSeparator` from `../Menu/Menu.jsx`. The surface uses the larger control padding on all four sides and caps its radius at half the control height. Items subtract that shared inset and the border from the actual outer radius. This keeps corners circular and prevents large radii on compact rows from collapsing into pills. Hover, press, and keyboard focus use the same item shape.
- Window contents subtract the frame border; maximized windows use zero radius.

These calculations stay in the owning component's CSS so changing spacing updates the inner shape automatically. `--os-border-width` and `--os-segment-padding` are the shared physical inset values.

Color samples and the native color input are always circular. Selected samples use a 2px outline with no gap and an inner highlight. Keyboard focus uses the same compact footprint with an ink-colored ring on swatches, so it remains distinct from selection. General focus outlines use `--os-focus-width` and `--os-focus-offset` (2px and 0px).
