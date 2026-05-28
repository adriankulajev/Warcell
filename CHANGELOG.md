# Warcell Changelog

## v0.0.3 — Unit Control & UI Overhaul — 2026-05-28

Development update focused on RTS-style unit controls, frontline orders and a major interface redesign.

### Added
- Unit multi-selection system.
- Selection box for selecting multiple units.
- Group move orders with right mouse button.
- Formation line orders with Shift + left mouse drag.
- Frontline orders with Shift + right mouse button.
- Unit split command with Q.
- Automatic friendly unit merging when units overlap.
- Unit status system: idle, moving, pinned and retreating.
- Right-click retreat system for pinned units.
- Selected units information panel.
- Selected unit path preview.
- HTML-based in-game HUD.
- Top HUD bar with player info, money, bots alive, FPS, match time, speed and status.
- HTML leaderboard panel.
- Event feed panel.
- Actions panel for common commands.
- Redesigned main menu with left-aligned strategy-game layout.
- Redesigned lobby with match configuration, player slots and map preview panels.
- Redesigned pause and end screens using the new tactical UI style.
- New WARCELL logo concept and in-menu logo mark.

### Changed
- Replaced most canvas-drawn HUD text with HTML/CSS interface elements.
- Improved overall UI direction toward a darker tactical strategy-game style.
- Main menu now uses a left-side command layout instead of a centered floating card.
- Lobby now uses a wider multi-panel layout prepared for future map selection, player slots and multiplayer.
- Bot and warmup settings remain as sliders, but are now styled as part of the new lobby UI.
- Map preview now has a darker framed/shadowed tactical display style.
- Unit control flow is now closer to classic RTS controls.
- Speed control was integrated into the new HUD layout.
- Canvas rendering is now focused more on gameplay visuals, while UI is handled by HTML/CSS.

### Fixed
- Fixed retreating units staying permanently in retreat state.
- Fixed retreating units not moving correctly after retreat order.
- Fixed retreating units being immediately pinned again during battle resolution.
- Fixed UI errors caused by missing pause border and menu element references during the UI refactor.
- Fixed duplicated/old canvas HUD elements conflicting with the new HTML HUD.

## v0.0.2 — Prototype Territory Systems - 2026-05-23

Update focused on territory ownership, city fields, occupation logic and early-game expansion.

### Added
- Player name input in the main menu.
- Player color picker in the main menu.
- Saved player name, color, bot count and warmup settings using localStorage.
- Player and bot elimination system.
- Territory collapse after a bot loses all cities.
- Passive city expansion into neutral land.
- Faster neutral land claiming by units.
- City field ownership system.
- Internal city field borders.
- City capture now transfers the captured city's field.
- Occupied territory tint for captured enemy land.
- Liberation logic for recapturing original territory.
- AI priority for expanding into neutral land before attacking enemies.

### Changed
- Player identity is no longer visually hardcoded as Redland.
- New cities now create their own city field instead of only claiming a simple circle.
- Neutral territory expansion is now more gradual and city-based.
- Unit capture now assigns captured land to the nearest owned city field.
- AI early-game behavior now focuses more on expansion before direct war.
- City field borders are thinner and more subtle.
- Capturing a city now affects its wider controlled field instead of only the city point.

### Fixed
- Eliminated bots can no longer revive by building new cities from leftover territory.
- New cities no longer claim enemy territory when built.
- Occupied territory no longer stays occupied after the original owner recaptures it.
- Occupation tint is cleared when the previous owner is eliminated.
- Reduced internal city-field border gore during neutral expansion.

## v0.0.1 — Early Prototype - 2026-05-22

Initial prototype version of Warcell.

### Added
- Basic HTML Canvas game prototype.
- Dynamic cell-based territory system.
- Procedural island test map.
- Red player and multiple bot players.
- Main menu.
- Singleplayer lobby.
- Bot count slider.
- Warmup time setting.
- Warmup phase with spawn selection.
- Random bot spawn selection with minimum distance rules.
- Multi-bot matches.
- Cities and basic city capture.
- Troop buying from cities.
- Unit movement and pathfinding.
- Unit-vs-unit pinned combat.
- Basic AI expansion, troop buying and attacking.
- Land percentage leaderboard.
- Real match timer instead of day counter.
- Game speed controls: x0.5, x1, x2, x4.
- Speed popup UI and keyboard shortcuts.
- Pause/resume system.
- Pause menu.
- Red glowing pause border effect.
- Win/loss detection for multi-bot matches.
- Match end screen with basic statistics.
- Play again, back to lobby and main menu flow.
- Central game state reset system.
- Cached map rendering for better performance.
- FPS counter.