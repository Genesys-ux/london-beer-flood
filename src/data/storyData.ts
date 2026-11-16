export type EyeState =
  | 'normal'
  | 'blink'
  | 'wide_shock'
  | 'squint_skeptical'
  | 'happy_arc'
  | 'wink';

export type MouthState =
  | 'neutral'
  | 'talk_open'
  | 'talk_wide'
  | 'chewing'
  | 'greedy_grin'
  | 'nervous_teeth';

export type CharacterRole =
  | 'owner_meux'
  | 'foreman_crick'
  | 'townsperson'
  | 'judge';

export type CharacterAction =
  | 'idle'
  | 'talking'
  | 'inspect_glass'
  | 'pointing'
  | 'writing'
  | 'panic_run'
  | 'gavel_slam'
  | 'cheer_gold';

export interface CharacterPlacement {
  id: string;
  role: CharacterRole;
  position: [number, number, number];
  scale?: number;
  flipX?: boolean;
  eyeState: EyeState;
  mouthState: MouthState;
  browAngle: number; // -30 to +30 degrees
  action: CharacterAction;
}

export interface ShotSpec {
  id: number;
  name: string;
  startFrame: number;
  endFrame: number; // Every shot is 90 to 150 frames (1.5s - 2.5s)
  environment: 'interior_brewery' | 'exterior_street';
  storyPhase:
    | 'hook_wave'
    | 'brewery_intro'
    | 'giant_vat'
    | 'inspection'
    | 'hoop_snap'
    | 'explosion'
    | 'wall_breach'
    | 'street_flood'
    | 'court_verdict';
  cameraMode: 'push_in' | 'pull_back' | 'whip_pan' | 'macro_inspect';
  camStart: [number, number, number];
  camEnd: [number, number, number];
  lookStart: [number, number, number];
  lookEnd: [number, number, number];
  fov: number;
  impactAtOffset?: number; // Frame offset inside shot for exponential decay impact shake
  impactAmp?: number;
  macroDof?: boolean; // Animates bokehScale 0 -> 4 and focalLength for macro shots
  characters: CharacterPlacement[];
}

export interface SfxTrigger {
  frame: number;
  src: string;
  volume: number;
  label: string;
}

// 30 shots * 120 frames average = 3600 frames (all strictly between 90 and 150 frames)
export const SHOTS: ShotSpec[] = [
  // SEGMENT 1 (0 - 390): Hook - 1814 London Beer Tsunami
  {
    id: 1,
    name: 'Hook_Street_Tsunami_Push',
    startFrame: 0,
    endFrame: 120,
    environment: 'exterior_street',
    storyPhase: 'hook_wave',
    cameraMode: 'push_in',
    camStart: [0, 2.1, 8.2],
    camEnd: [0, 1.7, 5.4],
    lookStart: [0, 1.8, 0],
    lookEnd: [0, 1.5, 0],
    fov: 46,
    impactAtOffset: 30,
    impactAmp: 0.22,
    characters: [
      {
        id: 'town_1',
        role: 'townsperson',
        position: [-0.9, 0, 2.2],
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 26,
        action: 'panic_run',
      },
      {
        id: 'foreman_hook',
        role: 'foreman_crick',
        position: [0.95, 0, 2.5],
        flipX: true,
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 24,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 2,
    name: 'Hook_Wave_Crest_Whip',
    startFrame: 120,
    endFrame: 255,
    environment: 'exterior_street',
    storyPhase: 'hook_wave',
    cameraMode: 'whip_pan',
    camStart: [-2.4, 2.6, 6.8],
    camEnd: [1.8, 1.9, 4.9],
    lookStart: [-0.8, 2.5, -1.0],
    lookEnd: [0.5, 1.4, 1.0],
    fov: 48,
    impactAtOffset: 45,
    impactAmp: 0.18,
    characters: [
      {
        id: 'town_2',
        role: 'townsperson',
        position: [0.3, 0, 1.8],
        eyeState: 'wide_shock',
        mouthState: 'talk_open',
        browAngle: 28,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 3,
    name: 'Hook_Floating_Barrels_Pull',
    startFrame: 255,
    endFrame: 390,
    environment: 'exterior_street',
    storyPhase: 'hook_wave',
    cameraMode: 'pull_back',
    camStart: [0.4, 1.4, 4.4],
    camEnd: [0, 2.3, 7.6],
    lookStart: [0, 1.3, 0],
    lookEnd: [0, 1.6, -1.0],
    fov: 44,
    characters: [
      {
        id: 'town_3',
        role: 'townsperson',
        position: [-0.6, 0, 2.0],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 22,
        action: 'pointing',
      },
    ],
  },

  // SEGMENT 2 (390 - 690): Horse Shoe Brewery Tottenham Court Road
  {
    id: 4,
    name: 'Brewery_Exterior_Sign_Push',
    startFrame: 390,
    endFrame: 540,
    environment: 'exterior_street',
    storyPhase: 'brewery_intro',
    cameraMode: 'push_in',
    camStart: [0, 2.5, 8.8],
    camEnd: [0, 1.9, 5.6],
    lookStart: [0, 2.2, -2.0],
    lookEnd: [0, 1.6, -1.0],
    fov: 42,
    characters: [
      {
        id: 'meux_ext',
        role: 'owner_meux',
        position: [0, 0, 1.8],
        eyeState: 'happy_arc',
        mouthState: 'greedy_grin',
        browAngle: -15,
        action: 'cheer_gold',
      },
    ],
  },
  {
    id: 5,
    name: 'Brewery_Interior_Reveal',
    startFrame: 540,
    endFrame: 690,
    environment: 'interior_brewery',
    storyPhase: 'brewery_intro',
    cameraMode: 'push_in',
    camStart: [-1.8, 2.2, 7.8],
    camEnd: [-0.5, 1.6, 5.2],
    lookStart: [0, 2.0, -1.5],
    lookEnd: [0, 1.8, -1.5],
    fov: 45,
    characters: [
      {
        id: 'meux_int1',
        role: 'owner_meux',
        position: [-0.8, 0, 1.4],
        eyeState: 'wink',
        mouthState: 'talk_open',
        browAngle: -12,
        action: 'talking',
      },
      {
        id: 'crick_int1',
        role: 'foreman_crick',
        position: [1.1, 0, 1.6],
        flipX: true,
        eyeState: 'normal',
        mouthState: 'neutral',
        browAngle: 5,
        action: 'idle',
      },
    ],
  },

  // SEGMENT 3 (690 - 1050): Wealthy Owners & 3-Story Oak Vat
  {
    id: 6,
    name: 'Owner_Greedy_Closeup',
    startFrame: 690,
    endFrame: 810,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'push_in',
    camStart: [-0.7, 1.55, 4.3],
    camEnd: [-0.7, 1.5, 3.1],
    lookStart: [-0.7, 1.45, 1.2],
    lookEnd: [-0.7, 1.5, 1.2],
    fov: 40,
    macroDof: true,
    characters: [
      {
        id: 'meux_cu',
        role: 'owner_meux',
        position: [-0.7, 0, 1.2],
        eyeState: 'happy_arc',
        mouthState: 'greedy_grin',
        browAngle: -22,
        action: 'cheer_gold',
      },
    ],
  },
  {
    id: 7,
    name: 'Colossal_Vat_Tilt_Up',
    startFrame: 810,
    endFrame: 930,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'pull_back',
    camStart: [0, 1.1, 4.8],
    camEnd: [0, 3.2, 7.9],
    lookStart: [0, 1.2, -2.2],
    lookEnd: [0, 3.6, -2.2],
    fov: 48,
    characters: [
      {
        id: 'meux_vat',
        role: 'owner_meux',
        position: [-1.3, 0, 1.2],
        eyeState: 'normal',
        mouthState: 'talk_wide',
        browAngle: -10,
        action: 'pointing',
      },
      {
        id: 'crick_vat',
        role: 'foreman_crick',
        position: [1.3, 0, 1.2],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'neutral',
        browAngle: 15,
        action: 'idle',
      },
    ],
  },
  {
    id: 8,
    name: 'Golden_Hoops_Shine_Whip',
    startFrame: 930,
    endFrame: 1050,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'whip_pan',
    camStart: [-2.2, 2.4, 5.6],
    camEnd: [1.9, 2.0, 5.2],
    lookStart: [-0.5, 2.4, -2.0],
    lookEnd: [0.5, 2.1, -2.0],
    fov: 44,
    characters: [
      {
        id: 'meux_brag',
        role: 'owner_meux',
        position: [0.8, 0, 1.5],
        eyeState: 'wink',
        mouthState: 'greedy_grin',
        browAngle: -18,
        action: 'talking',
      },
    ],
  },

  // SEGMENT 4 (1050 - 1440): 1.4 Million Liters Pressurized Porter
  {
    id: 9,
    name: 'Pressure_Gauge_Macro_DOF',
    startFrame: 1050,
    endFrame: 1170,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'macro_inspect',
    camStart: [0.6, 2.1, 3.6],
    camEnd: [0.2, 2.0, 2.3],
    lookStart: [0, 2.0, -1.5],
    lookEnd: [0, 2.0, -1.8],
    fov: 36,
    macroDof: true,
    impactAtOffset: 60,
    impactAmp: 0.08,
    characters: [
      {
        id: 'crick_gauge',
        role: 'foreman_crick',
        position: [0.85, 0, 0.8],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'nervous_teeth',
        browAngle: 18,
        action: 'inspect_glass',
      },
    ],
  },
  {
    id: 10,
    name: 'Vat_Bulging_Rumble',
    startFrame: 1170,
    endFrame: 1305,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'push_in',
    camStart: [0, 1.8, 6.8],
    camEnd: [0, 1.7, 4.9],
    lookStart: [0, 2.1, -2.0],
    lookEnd: [0, 2.1, -2.0],
    fov: 45,
    impactAtOffset: 40,
    impactAmp: 0.11,
    characters: [
      {
        id: 'crick_worry',
        role: 'foreman_crick',
        position: [-0.9, 0, 1.4],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 22,
        action: 'pointing',
      },
    ],
  },
  {
    id: 11,
    name: 'Boiling_Foam_Top_Vent',
    startFrame: 1305,
    endFrame: 1440,
    environment: 'interior_brewery',
    storyPhase: 'giant_vat',
    cameraMode: 'pull_back',
    camStart: [0.3, 3.3, 4.2],
    camEnd: [-0.4, 2.2, 6.5],
    lookStart: [0, 3.5, -2.0],
    lookEnd: [0, 2.2, -2.0],
    fov: 46,
    characters: [
      {
        id: 'crick_look_up',
        role: 'foreman_crick',
        position: [0.6, 0, 1.3],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'talk_open',
        browAngle: 20,
        action: 'pointing',
      },
    ],
  },

  // SEGMENT 5 (1440 - 1860): Oct 17 Afternoon - George Crick Inspects 700kg Iron Hoop
  {
    id: 12,
    name: 'Wall_Calendar_Oct17_Push',
    startFrame: 1440,
    endFrame: 1575,
    environment: 'interior_brewery',
    storyPhase: 'inspection',
    cameraMode: 'push_in',
    camStart: [-1.4, 1.9, 5.8],
    camEnd: [-0.8, 1.7, 3.8],
    lookStart: [-1.2, 1.9, -1.5],
    lookEnd: [-0.6, 1.7, -1.2],
    fov: 42,
    characters: [
      {
        id: 'crick_cal',
        role: 'foreman_crick',
        position: [-0.4, 0, 1.2],
        eyeState: 'normal',
        mouthState: 'talk_open',
        browAngle: 8,
        action: 'talking',
      },
    ],
  },
  {
    id: 13,
    name: 'Crick_Magnifying_Glass_Macro',
    startFrame: 1575,
    endFrame: 1710,
    environment: 'interior_brewery',
    storyPhase: 'inspection',
    cameraMode: 'macro_inspect',
    camStart: [0.5, 1.65, 3.5],
    camEnd: [0.15, 1.55, 2.2],
    lookStart: [0, 1.6, -1.2],
    lookEnd: [0, 1.55, -1.6],
    fov: 35,
    macroDof: true,
    characters: [
      {
        id: 'crick_macro',
        role: 'foreman_crick',
        position: [0.55, 0, 0.7],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'nervous_teeth',
        browAngle: 25,
        action: 'inspect_glass',
      },
    ],
  },
  {
    id: 14,
    name: 'Iron_Hoop_Crack_Strain',
    startFrame: 1710,
    endFrame: 1860,
    environment: 'interior_brewery',
    storyPhase: 'inspection',
    cameraMode: 'push_in',
    camStart: [-0.6, 1.8, 4.9],
    camEnd: [-0.1, 1.75, 3.2],
    lookStart: [0, 1.8, -1.8],
    lookEnd: [0, 1.8, -1.8],
    fov: 40,
    macroDof: true,
    impactAtOffset: 75,
    impactAmp: 0.12,
    characters: [
      {
        id: 'crick_strain',
        role: 'foreman_crick',
        position: [-0.85, 0, 1.0],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 28,
        action: 'inspect_glass',
      },
    ],
  },

  // SEGMENT 6 (1860 - 2250): Giant Hoop Snaps Like a Cannon! Boss Writes a Casual Note
  {
    id: 15,
    name: 'Hoop_Snap_Whip_Projectile',
    startFrame: 1860,
    endFrame: 1990,
    environment: 'interior_brewery',
    storyPhase: 'hoop_snap',
    cameraMode: 'whip_pan',
    camStart: [0, 1.8, 4.5],
    camEnd: [1.6, 1.5, 5.4],
    lookStart: [0, 1.8, -1.8],
    lookEnd: [1.2, 1.3, 0.5],
    fov: 46,
    impactAtOffset: 15,
    impactAmp: 0.28,
    characters: [
      {
        id: 'crick_jump',
        role: 'foreman_crick',
        position: [0.9, 0, 1.3],
        flipX: true,
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 30,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 16,
    name: 'Crick_Warns_Boss_Urgent',
    startFrame: 1990,
    endFrame: 2120,
    environment: 'interior_brewery',
    storyPhase: 'hoop_snap',
    cameraMode: 'push_in',
    camStart: [0, 1.6, 5.8],
    camEnd: [0, 1.5, 4.1],
    lookStart: [0, 1.4, 1.0],
    lookEnd: [0, 1.4, 1.0],
    fov: 42,
    characters: [
      {
        id: 'crick_warn',
        role: 'foreman_crick',
        position: [-0.85, 0, 1.2],
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 26,
        action: 'pointing',
      },
      {
        id: 'meux_shrug',
        role: 'owner_meux',
        position: [0.85, 0, 1.2],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'chewing',
        browAngle: -14,
        action: 'writing',
      },
    ],
  },
  {
    id: 17,
    name: 'Boss_Writes_Letter_Calmly',
    startFrame: 2120,
    endFrame: 2250,
    environment: 'interior_brewery',
    storyPhase: 'hoop_snap',
    cameraMode: 'macro_inspect',
    camStart: [0.85, 1.55, 3.6],
    camEnd: [0.85, 1.5, 2.6],
    lookStart: [0.85, 1.4, 1.0],
    lookEnd: [0.85, 1.4, 1.0],
    fov: 38,
    macroDof: true,
    characters: [
      {
        id: 'meux_letter',
        role: 'owner_meux',
        position: [0.85, 0, 1.1],
        flipX: true,
        eyeState: 'wink',
        mouthState: 'greedy_grin',
        browAngle: -18,
        action: 'writing',
      },
    ],
  },

  // SEGMENT 7 (2250 - 2650): One Hour Later - Vat Explodes & Domino Chain Reaction
  {
    id: 18,
    name: 'Clock_Tick_Before_Blast',
    startFrame: 2250,
    endFrame: 2370,
    environment: 'interior_brewery',
    storyPhase: 'explosion',
    cameraMode: 'push_in',
    camStart: [0, 2.0, 6.4],
    camEnd: [0, 1.8, 3.9],
    lookStart: [0, 2.0, -2.0],
    lookEnd: [0, 2.0, -2.0],
    fov: 45,
    impactAtOffset: 25,
    impactAmp: 0.35,
    characters: [
      {
        id: 'crick_blast1',
        role: 'foreman_crick',
        position: [-1.1, 0, 1.4],
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 30,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 19,
    name: 'Colossal_Vat_Detonation_Shake',
    startFrame: 2370,
    endFrame: 2510,
    environment: 'interior_brewery',
    storyPhase: 'explosion',
    cameraMode: 'pull_back',
    camStart: [0, 1.7, 4.2],
    camEnd: [0, 2.5, 7.8],
    lookStart: [0, 2.0, -1.8],
    lookEnd: [0, 1.8, -1.0],
    fov: 50,
    impactAtOffset: 10,
    impactAmp: 0.38,
    characters: [
      {
        id: 'crick_blast2',
        role: 'foreman_crick',
        position: [-1.3, 0, 1.8],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 30,
        action: 'panic_run',
      },
      {
        id: 'meux_blast2',
        role: 'owner_meux',
        position: [1.2, 0, 1.9],
        flipX: true,
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 28,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 20,
    name: 'Neighboring_Vats_Domino_Whip',
    startFrame: 2510,
    endFrame: 2650,
    environment: 'interior_brewery',
    storyPhase: 'explosion',
    cameraMode: 'whip_pan',
    camStart: [-2.5, 2.2, 6.2],
    camEnd: [2.4, 1.8, 5.8],
    lookStart: [-1.0, 1.8, -1.5],
    lookEnd: [1.0, 1.6, -1.0],
    fov: 48,
    impactAtOffset: 30,
    impactAmp: 0.3,
    characters: [
      {
        id: 'meux_domino',
        role: 'owner_meux',
        position: [0.4, 0, 1.6],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 29,
        action: 'panic_run',
      },
    ],
  },

  // SEGMENT 8 (2650 - 3060): Brick Wall Collapses & St Giles Street Tsunami
  {
    id: 21,
    name: 'Brick_Wall_Breach_Impact',
    startFrame: 2650,
    endFrame: 2785,
    environment: 'exterior_street',
    storyPhase: 'wall_breach',
    cameraMode: 'push_in',
    camStart: [0, 2.4, 8.4],
    camEnd: [0, 1.8, 5.2],
    lookStart: [0, 2.0, -2.0],
    lookEnd: [0, 1.6, -1.0],
    fov: 48,
    impactAtOffset: 15,
    impactAmp: 0.34,
    characters: [
      {
        id: 'town_breach1',
        role: 'townsperson',
        position: [-1.0, 0, 2.0],
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 30,
        action: 'panic_run',
      },
    ],
  },
  {
    id: 22,
    name: 'Porter_Tsunami_Street_Sweep',
    startFrame: 2785,
    endFrame: 2920,
    environment: 'exterior_street',
    storyPhase: 'street_flood',
    cameraMode: 'whip_pan',
    camStart: [-2.6, 2.1, 6.6],
    camEnd: [2.2, 1.7, 5.0],
    lookStart: [-0.8, 1.6, 0],
    lookEnd: [0.8, 1.4, 0.8],
    fov: 46,
    impactAtOffset: 35,
    impactAmp: 0.22,
    characters: [
      {
        id: 'town_flood1',
        role: 'townsperson',
        position: [-0.5, 0, 1.9],
        eyeState: 'wide_shock',
        mouthState: 'nervous_teeth',
        browAngle: 28,
        action: 'panic_run',
      },
      {
        id: 'crick_flood1',
        role: 'foreman_crick',
        position: [0.9, 0, 2.1],
        flipX: true,
        eyeState: 'wide_shock',
        mouthState: 'talk_open',
        browAngle: 26,
        action: 'pointing',
      },
    ],
  },
  {
    id: 23,
    name: 'St_Giles_Alley_Submerged_Pull',
    startFrame: 2920,
    endFrame: 3060,
    environment: 'exterior_street',
    storyPhase: 'street_flood',
    cameraMode: 'pull_back',
    camStart: [0, 1.5, 4.3],
    camEnd: [0, 2.6, 8.0],
    lookStart: [0, 1.3, 0.5],
    lookEnd: [0, 1.7, -1.0],
    fov: 45,
    characters: [
      {
        id: 'town_sub1',
        role: 'townsperson',
        position: [0, 0, 1.8],
        eyeState: 'wide_shock',
        mouthState: 'talk_wide',
        browAngle: 25,
        action: 'panic_run',
      },
    ],
  },

  // SEGMENT 9 (3060 - 3600): "Act of God" Verdict & Wooden Vats Banned Forever
  {
    id: 24,
    name: 'Judge_Gavel_Slam_Act_Of_God',
    startFrame: 3060,
    endFrame: 3195,
    environment: 'interior_brewery',
    storyPhase: 'court_verdict',
    cameraMode: 'push_in',
    camStart: [0, 1.8, 6.0],
    camEnd: [0, 1.55, 3.8],
    lookStart: [0, 1.5, 1.0],
    lookEnd: [0, 1.5, 1.0],
    fov: 42,
    impactAtOffset: 40,
    impactAmp: 0.19,
    characters: [
      {
        id: 'judge_1',
        role: 'judge',
        position: [0, 0, 1.1],
        eyeState: 'squint_skeptical',
        mouthState: 'talk_wide',
        browAngle: -20,
        action: 'gavel_slam',
      },
    ],
  },
  {
    id: 25,
    name: 'Owner_Relieved_Tax_Refund_Macro',
    startFrame: 3195,
    endFrame: 3330,
    environment: 'interior_brewery',
    storyPhase: 'court_verdict',
    cameraMode: 'macro_inspect',
    camStart: [-0.8, 1.6, 3.8],
    camEnd: [-0.8, 1.5, 2.7],
    lookStart: [-0.8, 1.45, 1.1],
    lookEnd: [-0.8, 1.45, 1.1],
    fov: 38,
    macroDof: true,
    characters: [
      {
        id: 'meux_free',
        role: 'owner_meux',
        position: [-0.8, 0, 1.1],
        eyeState: 'wink',
        mouthState: 'greedy_grin',
        browAngle: -16,
        action: 'cheer_gold',
      },
      {
        id: 'crick_skeptic',
        role: 'foreman_crick',
        position: [0.8, 0, 1.3],
        flipX: true,
        eyeState: 'squint_skeptical',
        mouthState: 'nervous_teeth',
        browAngle: 20,
        action: 'idle',
      },
    ],
  },
  {
    id: 26,
    name: 'Wooden_Vats_Banned_Forever',
    startFrame: 3330,
    endFrame: 3465,
    environment: 'interior_brewery',
    storyPhase: 'court_verdict',
    cameraMode: 'pull_back',
    camStart: [0, 1.6, 4.4],
    camEnd: [0, 2.3, 7.2],
    lookStart: [0, 1.8, -1.5],
    lookEnd: [0, 1.8, -1.5],
    fov: 45,
    impactAtOffset: 30,
    impactAmp: 0.15,
    characters: [
      {
        id: 'judge_ban',
        role: 'judge',
        position: [-0.9, 0, 1.3],
        eyeState: 'normal',
        mouthState: 'talk_open',
        browAngle: -15,
        action: 'pointing',
      },
      {
        id: 'crick_ban',
        role: 'foreman_crick',
        position: [0.9, 0, 1.3],
        flipX: true,
        eyeState: 'happy_arc',
        mouthState: 'talk_open',
        browAngle: -8,
        action: 'talking',
      },
    ],
  },
  {
    id: 27,
    name: 'Finale_London_Beer_Flood_Legacy',
    startFrame: 3465,
    endFrame: 3600,
    environment: 'exterior_street',
    storyPhase: 'court_verdict',
    cameraMode: 'push_in',
    camStart: [0, 2.2, 7.5],
    camEnd: [0, 1.6, 4.6],
    lookStart: [0, 1.5, 0],
    lookEnd: [0, 1.4, 1.0],
    fov: 44,
    characters: [
      {
        id: 'crick_end',
        role: 'foreman_crick',
        position: [-0.85, 0, 1.5],
        eyeState: 'wink',
        mouthState: 'happy_arc' as unknown as MouthState,
        browAngle: -10,
        action: 'pointing',
      },
      {
        id: 'meux_end',
        role: 'owner_meux',
        position: [0.85, 0, 1.5],
        flipX: true,
        eyeState: 'happy_arc',
        mouthState: 'greedy_grin',
        browAngle: -14,
        action: 'cheer_gold',
      },
    ],
  },
];

// Frame-accurate Sound Design Triggers matching Section 7 rules
export const SFX_TRIGGERS: SfxTrigger[] = [
  // Camera transition whooshes
  { frame: 118, src: 'audio/sfx_whoosh.wav', volume: 0.45, label: 'Whip pan whoosh' },
  { frame: 388, src: 'audio/sfx_whoosh.wav', volume: 0.42, label: 'Scene cut whoosh' },
  { frame: 538, src: 'audio/sfx_whoosh.wav', volume: 0.42, label: 'Interior transition whoosh' },
  { frame: 928, src: 'audio/sfx_whoosh.wav', volume: 0.48, label: 'Whip pan golden hoops' },
  { frame: 1438, src: 'audio/sfx_whoosh.wav', volume: 0.40, label: 'Inspection cut whoosh' },
  { frame: 1858, src: 'audio/sfx_whoosh.wav', volume: 0.52, label: 'Snap whip pan whoosh' },
  { frame: 2508, src: 'audio/sfx_whoosh.wav', volume: 0.50, label: 'Domino whip pan whoosh' },
  { frame: 2783, src: 'audio/sfx_whoosh.wav', volume: 0.48, label: 'Street whip pan whoosh' },
  { frame: 3058, src: 'audio/sfx_whoosh.wav', volume: 0.42, label: 'Courtroom transition whoosh' },

  // Metal clinks & iron hoop strain
  { frame: 710, src: 'audio/sfx_clink.wav', volume: 0.55, label: 'Gold coin clink' },
  { frame: 1110, src: 'audio/sfx_clink.wav', volume: 0.65, label: 'Pressure gauge metal ping' },
  { frame: 1620, src: 'audio/sfx_clink.wav', volume: 0.60, label: 'Foreman wrench tap on iron hoop' },
  { frame: 1785, src: 'audio/sfx_clink.wav', volume: 0.75, label: '700kg iron hoop cracking' },

  // Heavy Blast + Cave Reverb (Iron hoop cannon snap & vat explosions)
  { frame: 28, src: 'audio/sfx_blast.wav', volume: 0.70, label: 'Opening tsunami impact blast' },
  { frame: 1875, src: 'audio/sfx_blast.wav', volume: 0.85, label: '700kg iron hoop cannon snap' },
  { frame: 2275, src: 'audio/sfx_blast.wav', volume: 0.90, label: 'Primary fermentation vat burst' },
  { frame: 2380, src: 'audio/sfx_blast.wav', volume: 0.95, label: 'Colossal oak vat detonation + cave reverb' },
  { frame: 2665, src: 'audio/sfx_blast.wav', volume: 0.88, label: 'Brick brewery wall breach explosion' },

  // Wood thuds / barrel collisions / gavel slam
  { frame: 165, src: 'audio/sfx_thud.wav', volume: 0.70, label: 'Floating oak barrel collision' },
  { frame: 1210, src: 'audio/sfx_thud.wav', volume: 0.65, label: 'Oak timber groaning thud' },
  { frame: 2540, src: 'audio/sfx_thud.wav', volume: 0.85, label: 'Domino vat crash thud' },
  { frame: 3100, src: 'audio/sfx_thud.wav', volume: 0.80, label: 'Judge gavel slam on wood block' },
  { frame: 3360, src: 'audio/sfx_thud.wav', volume: 0.75, label: 'Banned stamp wood thud' },

  // Foaming beer tsunami wave rush
  { frame: 10, src: 'audio/sfx_wave.wav', volume: 0.60, label: 'Opening tsunami surge' },
  { frame: 2680, src: 'audio/sfx_wave.wav', volume: 0.78, label: 'St Giles street beer flood roar' },
];
