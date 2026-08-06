# Spider Climb: GDD-Lite

## 1. Game Overview

### Working Title
Spider Climb

### Genre
Mobile endless climbing arcade game.

### Core Fantasy
The player controls a spider-like superhero who climbs endlessly upward between two parallel skyscrapers, jumping from wall to wall, dodging hazards, collecting rewards, and using web shots at key moments to survive longer and reach greater heights.

### High-Level Experience
The game should feel:

- Fast to understand.
- Skill-based rather than random.
- Tense as the player climbs higher.
- Visually rewarding as the city changes with altitude.
- Addictive through short runs, near misses, and clear improvement.

### Core Promise
Every run asks one simple question:

How high can the player climb before the city finally knocks them down?

## 2. Target Platform and Session Goals

### Platform
Mobile-first.

### Session Length
The game should support:

- Very short sessions of 30-60 seconds.
- Average runs of 2-5 minutes.
- Long high-score attempts of 5+ minutes for skilled players.

### Audience
Casual and mid-core mobile players who enjoy:

- Endless runners.
- Reflex games.
- Score chasing.
- Character upgrades.
- Simple controls with increasing mastery.

## 3. Core Gameplay Pillars

### 1. Two-Wall Decision Making
The two skyscrapers are the heart of the game. The player must constantly decide whether to keep climbing the current wall or jump to the opposite wall.

### 2. Simple Controls, High Mastery
Controls should be easy enough for a first-time player to understand quickly, but deep enough that timing, rhythm, and route choice matter.

### 3. Climb Higher, See More
Progress should be visible through changing backgrounds, building designs, weather, lighting, and obstacle patterns.

### 4. Fair Failure
When the player fails, they should understand why. Hazards must be readable, avoidable, and introduced clearly before becoming difficult.

### 5. One More Run
Runs should end quickly enough that restarting feels natural, while rewards and progression give each attempt value.

## 4. Core Gameplay Loop

1. The player starts near street level between two skyscrapers.
2. The hero automatically or continuously climbs upward while attached to one building wall.
3. The player jumps between the left and right buildings to avoid danger, collect rewards, and follow safer routes.
4. Obstacles, moving hazards, damaged wall sections, and changing building layouts force the player to make frequent decisions.
5. The player occasionally uses a web shot to destroy, disable, pull, or bypass specific threats.
6. Height, coins, combos, pickups, and destroyed obstacles increase the score.
7. If the player falls too far, loses all lives, or hits a fatal obstacle, the run ends.
8. The player receives rewards, sees progress, and can upgrade cosmetics or selected gameplay modifiers before starting again.

## 5. Player Character Requirements

### Character Role
The hero is an agile spider-like climber. The character should be clearly readable at small mobile screen sizes and should visually communicate:

- Wall climbing.
- Fast jumps.
- Web shooting.
- Heroic movement.

### Core Abilities
The player character must support these gameplay abilities:

- Climb while attached to a building wall.
- Jump from one building to the other.
- Recover from minor falls if a wall is reachable.
- Use a limited web shot ability.
- Collect items while moving upward.

### Failure States
The character may fail by:

- Falling too far below the camera or safe zone.
- Losing all allowed fall recoveries or lives.
- Hitting a fatal hazard.
- Being pushed into an unrecoverable fall.
- Remaining on unsafe wall surfaces too long.

## 6. Controls and Input Requirements

The control scheme should be simple and mobile-friendly.

### Required Input Goals
The player must be able to:

- Stay attached to a wall.
- Jump to the opposite wall.
- Control jump timing.
- Trigger web shot intentionally.
- Understand all available actions without a long tutorial.

### Recommended Control Feel
The controls should feel:

- Immediate.
- Forgiving at low heights.
- More demanding at higher heights.
- Responsive enough for quick corrections.

### Input Complexity Limit
The game should not require more than two active gameplay inputs at the same time. The default moment-to-moment experience should be playable with one hand.

## 7. Two-Skyscraper Layout Rules

### Core Layout
The play area contains two vertical skyscrapers:

- One on the left side.
- One on the right side.
- A vertical gap between them.
- The player climbs by staying on either wall and jumping across the gap.

### Building Distance
The distance between buildings may change over time, but changes must be readable and fair.

Distance types:

- Narrow gap: easy jumps, good for beginners.
- Standard gap: normal rhythm.
- Wide gap: requires better timing or stronger jump commitment.
- Variable gap: creates route planning and tension.

### Wall Safety
Not all wall sections are safe. Each building side may contain:

- Safe climbable wall.
- Damaged wall.
- Slippery glass.
- Electrified surface.
- Breakable surface.
- Blocked wall section.

### Route Design Rule
At any moment, at least one reasonable route should exist. The player may be forced to switch walls, but the requirement to switch must be visually telegraphed.

### No Unfair Traps
The level design should avoid:

- Hazards appearing with no reaction time.
- Forced jumps into unavoidable hazards.
- Obstacles hidden by UI.
- Patterns that require memorization in an endless mode.
- Random combinations that cannot be survived.

## 8. Camera and Vertical Progression

### Camera Goal
The camera should reinforce upward progress and tension.

### Camera Behavior Requirements
The camera should:

- Follow upward movement smoothly.
- Keep upcoming obstacles visible early enough.
- Make falling feel dangerous.
- Preserve readability of both building walls.

### Fall Pressure
The camera creates pressure by continuing upward or maintaining a lower danger threshold. If the player falls below the safe zone, they risk losing a life or ending the run.

## 9. Falling and Recovery Rules

### Fall Philosophy
Falling should be scary but not always instantly fatal.

### Recommended Failure Model
The game should allow a small number of recoveries before a full game over.

Example rule:

- Minor fall: recoverable if the player catches a wall quickly.
- Major fall: costs one life or recovery chance.
- No lives remaining: run ends.

### Lives and Recovery
The base game may use:

- Three fall chances per run.
- Revive option through reward ad, premium item, or earned resource.
- Hardcore mode with no recoveries.

### Restart Rule
When the player fully fails, the next run starts from the beginning unless a special mode or paid/earned continue is used.

## 10. Web Shot Ability

### Purpose
Web shot is a limited tactical tool, not a constant attack.

### Usage Goals
Web shot should allow the player to:

- Destroy small hazards.
- Disable drones or moving enemies.
- Pull away loose obstacles.
- Create a short survival opportunity.
- Collect nearby rewards in special cases.

### Limitations
Web shot should be restricted by at least one of these:

- Cooldown.
- Limited charges.
- Pickups.
- Energy meter.

### Balancing Requirement
Web shot should help the player escape danger, but it must not remove the need for jumping, timing, and route choice.

### Web Shot Targets
Valid target examples:

- Drone.
- Falling sign.
- Security camera.
- Loose air conditioner.
- Small flying enemy.
- Coin cluster.
- Temporary anchor point.

## 11. Obstacles and Hazards

### Obstacle Design Goals
Obstacles should create different decisions:

- Jump now.
- Stay and wait.
- Use web shot.
- Choose the safer wall.
- Risk a harder path for more rewards.

### Obstacle Categories

#### Static Obstacles
These block or punish a simple upward climb.

Examples:

- Air conditioners.
- Balconies.
- Billboards.
- Pipes.
- Window ledges.
- Construction barriers.
- Broken wall panels.

#### Unsafe Surfaces
These make certain wall sections dangerous.

Examples:

- Cracked glass.
- Slippery windows.
- Electrified cables.
- Hot vents.
- Wet wall sections.
- Unstable bricks.

#### Moving Obstacles
These require timing.

Examples:

- Drones.
- Birds.
- Cleaning platforms.
- Moving cranes.
- Swinging signs.
- Elevator window panels.
- Security lasers.

#### Environmental Hazards
These change the feel of climbing.

Examples:

- Wind gusts.
- Rain.
- Lightning.
- Steam vents.
- Falling debris.
- Helicopter searchlights.

#### Active Threats
These add chase or attack pressure in advanced stages.

Examples:

- Police drones.
- Rival climber.
- Robot sentry.
- Rooftop security systems.
- Flying mini-boss hazard.

### Hazard Telegraphing
Each hazard must have a clear warning before it becomes dangerous.

Examples:

- Drone shadow before it crosses.
- Flickering wire before electric shock.
- Cracked glass before it breaks.
- Wind particles before a gust.
- Laser charge-up before activation.

## 12. Pickups and Power-Ups

### Pickup Goals
Pickups should encourage risk-reward movement and route choice.

### Standard Pickups

- Coins: basic currency and score contribution.
- Gems: rarer currency for premium unlocks or continues.
- Web energy: restores web shot.
- Shield: protects from one hit or fall.
- Magnet: pulls nearby coins.
- Score multiplier: temporarily boosts points.
- Slow-time pickup: briefly makes obstacles easier to react to.

### Placement Rule
Pickups should often appear near riskier paths, but safe paths should still provide occasional rewards.

## 13. Scoring System

### Score Sources
The score should include:

- Height reached.
- Coins collected.
- Combo streaks.
- Near misses.
- Obstacles destroyed.
- Clean wall-to-wall jumps.
- Zone milestones reached.

### Height Score
Height is the primary score driver. The higher the player climbs, the faster their score potential increases.

### Combo Score
Combo may increase when the player:

- Jumps between buildings without falling.
- Collects coin chains.
- Avoids hazards closely.
- Destroys obstacles with web shot.
- Maintains upward momentum.

Combo should reset or reduce when the player:

- Falls.
- Gets hit.
- Stops climbing for too long.
- Misses a chain route.

### Score Multipliers
Score multipliers can increase by:

- Reaching altitude milestones.
- Maintaining combo.
- Collecting temporary multiplier items.
- Completing mission goals.

### Leaderboard Support
The game should support score competition through:

- Highest height.
- Highest score.
- Longest combo.
- Most obstacles destroyed in one run.
- Fastest climb to a milestone.

## 14. Progression Structure

### Run-Based Progression
Every run should reward the player with at least one of:

- Coins.
- Mission progress.
- Character experience.
- Cosmetic unlock progress.
- New altitude record.

### Milestone Progression
Altitude milestones should unlock new content and scenery.

Example milestone bands:

- 0-500m: street-level city.
- 500-1500m: dense skyscraper district.
- 1500-3000m: high-rise skyline and clouds.
- 3000-5000m: sunset construction zone.
- 5000-8000m: night city and storm hazards.
- 8000m+: surreal sky zone, aurora, aircraft, fantasy skyline.

### Mission System
The game should include short objectives such as:

- Reach 300m.
- Collect 100 coins in one run.
- Destroy 5 drones.
- Survive 3 wind gusts.
- Jump between buildings 30 times.
- Reach a new height without using revive.

### Long-Term Goals
The game should include progression goals such as:

- Unlock all suits.
- Reach new height tiers.
- Complete mission sets.
- Upgrade selected power-up effects.
- Unlock new background themes.

## 15. Difficulty Progression

### Difficulty Philosophy
Difficulty should increase through layered complexity, not sudden punishment.

### Difficulty Variables
As height increases, the game may adjust:

- Climb speed.
- Camera pressure.
- Obstacle density.
- Obstacle movement speed.
- Gap width variation.
- Frequency of unsafe wall sections.
- Number of simultaneous hazards.
- Duration of safe reaction windows.
- Reward placement risk.

### Introduction Rule
New obstacle types should first appear in a simple form before being combined with other hazards.

Example:

1. Drone crosses slowly with clear warning.
2. Drone crosses faster.
3. Drone appears with coin route temptation.
4. Drone appears while one wall has unsafe glass.
5. Drone appears during wind or camera pressure.

### Fairness Rule
Higher difficulty should demand better skill, but should not rely on unreadable randomness.

## 16. Level Design Rules for Endless Generation

### Pattern-Based Design
The endless climb should feel authored through reusable gameplay patterns.

Pattern examples:

- Safe climb section.
- Forced wall switch.
- Coin trail jump.
- Hazard timing gate.
- Web-shot opportunity.
- Narrow gap speed section.
- Wide gap precision section.
- Recovery section after intense hazards.

### Pattern Intensity
Each pattern should have an intensity rating:

- Low: tutorial, recovery, easy reward.
- Medium: standard challenge.
- High: fast decision or tight timing.
- Extreme: rare high-altitude challenge.

### Flow Rule
The game should alternate between:

- Challenge.
- Reward.
- Recovery.
- Escalation.

The player should not face maximum intensity continuously.

### Spawn Safety Rules
The game should guarantee:

- Clear path visibility.
- Enough reaction time.
- No impossible wall-to-wall transitions.
- No unavoidable damage chains.
- No reward placement that visually hides hazards.

## 17. Economy Requirements

### Currency Types
The game may include:

- Coins: common currency earned in runs.
- Gems: rare currency earned through milestones, missions, events, or optional monetization.

### Coin Uses
Coins may be used for:

- Cosmetic unlocks.
- Suit color variants.
- Basic upgrades.
- Power-up duration improvements.
- Mission refreshes.

### Gem Uses
Gems may be used for:

- Premium costumes.
- Revives.
- Special effects.
- Event entries.
- Rare unlocks.

### Economy Philosophy
The economy should support replay and customization without making success depend mainly on spending.

### Upgrade Boundaries
Gameplay upgrades must not remove skill from the game. Upgrades should improve forgiveness or variety, not make the player invincible.

Acceptable upgrade examples:

- Slightly longer shield duration.
- Faster web shot recharge.
- Larger coin magnet radius.
- One extra starting web charge.
- Higher mission reward bonus.

Avoid upgrades that:

- Permanently remove major obstacles.
- Make falls irrelevant.
- Allow unlimited web shots.
- Create an unfair leaderboard advantage unless separated into upgraded and non-upgraded categories.

## 18. Monetization Design Boundaries

### Acceptable Monetization
The game may include:

- Rewarded ads for optional revive.
- Rewarded ads for bonus coins.
- Cosmetic purchases.
- Battle pass or seasonal pass.
- Starter packs.
- Premium currency purchases.

### Required Player-Friendly Rules
Monetization should:

- Never interrupt a run unexpectedly.
- Never force ads after every failure.
- Clearly label optional rewarded ads.
- Avoid pay-to-win pressure in competitive scoring.
- Preserve a satisfying free player path.

## 19. Art Direction

### Visual Style
The game should use a bold, readable, mobile-friendly style. It may lean toward stylized comic-book action rather than realism.

### Character Style
The hero should have:

- Strong silhouette.
- Bright accent color.
- Clear wall-climb pose.
- Distinct jump animation.
- Satisfying web-shot animation.

### Environment Style
The two skyscrapers should feel tall, varied, and alive.

Required environment elements:

- Windows.
- Wall panels.
- Pipes.
- Signs.
- Air conditioners.
- Balconies.
- Rooftop details.
- City depth in the background.

### Altitude-Based Background Progression
Visuals should change meaningfully by height.

Suggested zones:

- Street morning: cars, sidewalks, small buildings.
- Business district: glass towers, LED signs, traffic far below.
- Cloudline: mist, birds, thinner skyline.
- Construction sunset: cranes, scaffolds, orange light.
- Night storm: rain, lightning, glowing windows.
- Sky fantasy: aurora, aircraft, surreal clouds, stars.

### Readability Requirements
Gameplay objects must be visually distinct:

- Hazards should not look like harmless decoration.
- Pickups should stand out from the wall.
- Web-shot targets should be recognizable.
- Dangerous states should use animation, color, or warning effects.
- The character must remain visible over all backgrounds.

## 20. Animation Requirements

### Required Character Animations

- Idle cling.
- Upward climb.
- Fast climb.
- Wall jump.
- Long jump.
- Fall.
- Wall catch.
- Web shot.
- Hit reaction.
- Recovery.
- Defeat.
- Victory or milestone celebration.

### Required Obstacle Animations

- Drone movement.
- Laser warning and activation.
- Broken glass crack and shatter.
- Electric cable flicker.
- Wind gust indication.
- Falling debris.
- Sign swing or collapse.

### Animation Feel
Animations should be snappy and readable. They should support gameplay clarity before visual flair.

## 21. Audio Direction

### Music
Music should support rising intensity. It may evolve by altitude:

- Lower city: energetic urban beat.
- High city: faster rhythm and brighter synths.
- Cloudline: airy tension.
- Storm/night: heavier percussion.
- Sky fantasy: epic and surreal tone.

### Sound Effects
Required sound categories:

- Wall climb.
- Jump.
- Wall catch.
- Web shot.
- Obstacle destroyed.
- Coin pickup.
- Power-up pickup.
- Shield impact.
- Fall warning.
- Life lost.
- New height record.
- Zone transition.

### Audio Readability
Important hazards should have recognizable warning sounds. Sound should help players react, not just decorate the action.

## 22. UX and Interface Goals

### HUD Requirements
The in-run HUD should show:

- Current height.
- Current score.
- Lives or recovery chances.
- Web shot availability.
- Coin count or run rewards.
- Active power-up status.

### HUD Design Goals
The HUD should be:

- Minimal.
- Clear at a glance.
- Away from main jump paths.
- Readable on small screens.
- Non-intrusive during intense movement.

### Menu Requirements
The game should include:

- Start run.
- Character/costume selection.
- Upgrade or power-up screen.
- Missions.
- Rewards summary.
- Settings.
- Leaderboards.

### Run-End Screen
After each run, the player should see:

- Height reached.
- Score earned.
- Coins collected.
- New records.
- Mission progress.
- Revive option when eligible.
- Quick restart.

### Tutorial Requirements
The first-time experience should teach:

- Climbing.
- Jumping between buildings.
- Avoiding obstacles.
- Using web shot.
- Recovering from a fall.
- Collecting rewards.

The tutorial should be interactive and short.

## 23. Game Modes

### Required Mode
Endless Climb:

- Main mode.
- Starts from the beginning.
- Runs until failure.
- Score and height drive replay.

### Optional Modes

Hardcore:

- No revives.
- Fewer safety pickups.
- Separate leaderboard.

Daily Climb:

- Same challenge pattern for all players each day.
- Rewards based on height or score tier.

Challenge Missions:

- Short objective-based runs.
- Specific obstacle themes or restrictions.

Event Mode:

- Temporary seasonal visuals.
- Unique rewards.
- Special obstacle variants.

## 24. Content Requirements

### Minimum Launch Content

- One playable hero.
- At least three costume variants.
- Six altitude zones.
- At least twelve obstacle types.
- At least six pickup or power-up types.
- At least thirty mission objectives.
- Basic leaderboard categories.
- Core economy with coins and optional rare currency.

### Obstacle Content Targets
At launch, the game should include:

- Four static obstacles.
- Three unsafe surfaces.
- Three moving obstacles.
- Two environmental hazards.
- At least one web-shot-specific target.

### Cosmetic Content Targets
Cosmetics may include:

- Hero suits.
- Web trail colors.
- Landing effects.
- Climb effects.
- UI frames.
- Background themes.

### Post-Launch Content Opportunities

- New city themes.
- New hero skins.
- Seasonal events.
- Special weather events.
- New obstacle families.
- Limited-time daily challenges.

## 25. Balancing Principles

### Early Game
The first 30 seconds should:

- Teach the core loop.
- Avoid heavy punishment.
- Give clear coin rewards.
- Let the player feel powerful.

### Mid Game
After the player understands the basics:

- Obstacles should combine.
- Wall switching should become more frequent.
- Rewards should tempt riskier paths.
- Web shot decisions should matter.

### Late Game
At high altitude:

- Reaction windows may shrink.
- Hazards may overlap.
- Gap changes may become more dramatic.
- Recovery opportunities become rarer.
- Score multipliers should make survival feel valuable.

### Failure Fairness
Most failures should be traceable to:

- Late jump.
- Wrong wall choice.
- Poor web shot timing.
- Greedy reward path.
- Ignored warning.

Avoid failures that feel caused by:

- Hidden hazards.
- Camera surprise.
- Visual clutter.
- Random impossible layouts.
- Controls not responding.

## 26. Risk-Reward Design

### Reward Paths
Coins and power-ups should often be placed along more dangerous routes.

### Safe Paths
Safe paths should usually allow survival but provide fewer rewards.

### Greed Moments
The game should regularly create moments where the player can choose:

- Safe climb with low reward.
- Risky jump with coin chain.
- Web-shot shortcut.
- Hard route with score multiplier.

### Player Agency
The player should feel responsible for choosing risk, not tricked into danger.

## 27. Zone Design Requirements

### Zone 1: Street-Level City

Theme:

- Morning city.
- Low-rise buildings.
- Cars and people far below.

Gameplay:

- Basic wall switching.
- Simple static obstacles.
- Coin trails.
- Introductory drones.

### Zone 2: Skyscraper District

Theme:

- Glass towers.
- LED signs.
- Dense urban depth.

Gameplay:

- Wider gaps.
- Air conditioners.
- Signs.
- Security lasers.

### Zone 3: Cloudline

Theme:

- Mist.
- High winds.
- Birds.
- Clouds passing behind buildings.

Gameplay:

- Wind gusts.
- Slippery surfaces.
- More timing-based jumps.

### Zone 4: Construction Sunset

Theme:

- Cranes.
- Scaffolding.
- Orange sky.

Gameplay:

- Falling debris.
- Moving platforms.
- Swinging construction objects.

### Zone 5: Night Storm

Theme:

- Rain.
- Lightning.
- Glowing windows.
- Helicopter lights.

Gameplay:

- Electric hazards.
- Reduced visibility moments.
- Faster moving threats.

### Zone 6: Sky Fantasy

Theme:

- Aurora.
- Stars.
- Aircraft.
- Surreal clouds.

Gameplay:

- Advanced obstacle combinations.
- Rare power-ups.
- High score multiplier opportunities.

## 28. Emotional Beats

The game should create these recurring feelings:

- Confidence at the start.
- Tension as hazards increase.
- Relief after a dangerous wall catch.
- Excitement from a perfect jump chain.
- Regret after greedy failure.
- Pride when passing a new height milestone.
- Curiosity when a new sky zone appears.

## 29. Accessibility and Comfort Goals

The game should support:

- Clear visual contrast.
- Adjustable sound and music levels.
- Optional reduced screen shake.
- Color choices that do not rely only on red/green distinction.
- Readable UI text on small screens.
- Short tutorial reminders.
- Pause support.

## 30. Design Constraints

### Must Have

- Two parallel skyscrapers.
- Endless upward climbing.
- Wall-to-wall jumping.
- Falling and recovery pressure.
- Limited web shot ability.
- Increasing difficulty by height.
- Changing scenery by altitude.
- Score based primarily on height.
- Obstacles that require route decisions.

### Should Have

- Missions.
- Coins and cosmetics.
- Power-ups.
- Leaderboards.
- Daily challenge.
- Multiple altitude zones.
- Optional revives.

### Should Avoid

- Complex multi-button controls.
- Long mandatory tutorials.
- Pay-to-win scoring.
- Unreadable visual clutter.
- Random impossible obstacle patterns.
- Web shot becoming the only important mechanic.
- Checkpoints that remove endless-run tension.

## 31. Success Criteria

The design is successful if:

- A new player understands the core action within the first run.
- Skilled players can clearly outperform beginners.
- Most failures feel fair.
- The player frequently wants to restart immediately.
- Reaching a new altitude feels meaningful.
- The two-building layout creates constant decisions.
- Web shot feels powerful but limited.
- Background changes make climbing higher visually exciting.
- The economy supports replay without overwhelming the core game.

## 32. Non-Goals

This document does not define:

- Game engine.
- Programming architecture.
- Physics implementation.
- Data structures.
- Backend services.
- Rendering techniques.
- Asset pipeline.
- Analytics implementation.
- Specific monetization SDKs.
- Platform-specific technical requirements.

All technical decisions should be handled separately by the AI developer or implementation team.
