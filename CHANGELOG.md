# Warcell Changelog

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