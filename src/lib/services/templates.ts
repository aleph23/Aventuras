import type { Template, TemplateInitialState } from '$lib/types';
import { database } from './database';

export const BUILTIN_TEMPLATES: Omit<Template, 'createdAt'>[] = [
  {
    id: 'fantasy-adventure',
    name: 'Fantasy Adventure',
    description: 'Epic quests, magic, mythical creatures, and heroic journeys in a medieval fantasy world.',
    genre: 'Fantasy',
    isBuiltin: true,
    systemPrompt: `You are a master storyteller crafting an immersive fantasy adventure. The world is filled with magic, mythical creatures, ancient prophecies, and epic quests.

## World Elements:
- Magic exists and can be learned or innate
- Various races (elves, dwarves, orcs, etc.) may exist
- Medieval-esque technology with magical enhancements
- Gods and divine forces may influence events
- Ancient ruins, enchanted forests, and mystical locations abound

## Narrative Style:
- Rich, descriptive prose with vivid imagery
- Balance action, dialogue, and atmosphere
- Include moments of wonder and discovery
- Build tension through challenges and mysteries
- Reward clever thinking and brave actions

## Guidelines:
- Write in second person ("You see...", "You feel...")
- Responses should be 2-4 paragraphs
- Include sensory details (sights, sounds, smells)
- NPCs should have distinct personalities
- Combat should be exciting but not gratuitously violent
- Magic should feel wondrous, not mundane`,
    initialState: {
      protagonist: {
        name: 'The Adventurer',
        description: 'A brave soul seeking glory and purpose',
        traits: ['brave', 'curious', 'determined'],
      },
      startingLocation: {
        name: 'The Crossroads Inn',
        description: 'A weathered tavern where travelers share tales of distant lands and rumors of adventure.',
      },
      initialItems: [
        { name: 'Worn Traveler\'s Pack', description: 'A sturdy leather pack containing basic supplies' },
        { name: 'Copper Coins', description: 'A small pouch of coins, enough for a few meals', quantity: 15 },
      ],
      openingScene: 'The hearth crackles warmly as you push open the heavy oak door of the Crossroads Inn. The smell of roasted meat and spiced ale fills your nostrils. Travelers huddle at worn tables, their conversations a low murmur punctuated by occasional laughter. The innkeeper, a stout woman with kind eyes, looks up from polishing a tankard and nods in your direction. Through the smoky air, you notice a cloaked figure in the corner booth, and a notice board near the bar covered in weathered parchments.',
    },
  },
  {
    id: 'scifi-exploration',
    name: 'Sci-Fi Exploration',
    description: 'Explore the cosmos, encounter alien civilizations, and unravel the mysteries of the universe.',
    genre: 'Sci-Fi',
    isBuiltin: true,
    systemPrompt: `You are crafting a science fiction adventure set in a vast, explorable universe. Technology is advanced but grounded in plausible science fiction concepts.

## World Elements:
- Faster-than-light travel exists (warp drives, jump gates, etc.)
- Multiple alien species with unique cultures
- Advanced AI, cybernetics, and biotechnology
- Corporate factions, space stations, and colony worlds
- Mysteries of ancient civilizations and cosmic phenomena

## Narrative Style:
- Blend hard sci-fi concepts with accessible storytelling
- Create a sense of scale and wonder at the cosmos
- Include technical details that enhance immersion
- Balance exploration, social interaction, and action
- Explore themes of humanity, consciousness, and discovery

## Guidelines:
- Write in second person ("You see...", "You feel...")
- Responses should be 2-4 paragraphs
- Make technology feel lived-in, not sterile
- Alien cultures should feel genuinely foreign
- Include ethical dilemmas and moral complexity
- Space should feel vast and sometimes dangerous`,
    initialState: {
      protagonist: {
        name: 'The Captain',
        description: 'Commander of a small independent vessel, seeking fortune and discovery among the stars',
        traits: ['resourceful', 'adaptable', 'ambitious'],
      },
      startingLocation: {
        name: 'Nexus Station',
        description: 'A bustling space station at the intersection of major trade routes, home to traders, mercenaries, and those seeking to disappear.',
      },
      initialItems: [
        { name: 'Personal Datapad', description: 'A versatile handheld computer with navigation and communication capabilities' },
        { name: 'Standard Sidearm', description: 'A reliable energy pistol, standard issue for spacers' },
        { name: 'Credit Chip', description: 'Digital currency storage', quantity: 500 },
      ],
      openingScene: 'The airlock hisses open, and you step onto Nexus Station\'s main concourse. Holographic advertisements flicker in a dozen languages -some human, some decidedly not. The station\'s artificial gravity feels slightly off, a common quirk of older installations. Your ship, the *Vagrant Star*, sits in docking bay 47, her hull still bearing scorch marks from your last job. The message that brought you here promised lucrative work, but the sender remained anonymous. Through the crowd, you spot the designated meeting point: a grimy bar called "The Event Horizon."',
    },
  },
  {
    id: 'mystery-investigation',
    name: 'Mystery Investigation',
    description: 'Solve intricate puzzles, uncover hidden truths, and bring justice to light as a detective.',
    genre: 'Mystery',
    isBuiltin: true,
    systemPrompt: `You are weaving an intricate mystery narrative where the player takes on the role of an investigator. Clues, red herrings, and revelations drive the story forward.

## World Elements:
- A grounded, realistic setting (modern day, noir, Victorian, etc.)
- Complex characters with secrets and motivations
- Interconnected clues that reward careful attention
- Multiple suspects with means, motive, and opportunity
- Atmospheric locations that enhance the mood

## Narrative Style:
- Build tension through uncertainty and discovery
- Plant clues naturally within descriptions
- Create memorable, morally gray characters
- Balance investigation, interrogation, and deduction
- Reward player attention and clever thinking

## Guidelines:
- Write in second person ("You notice...", "You deduce...")
- Responses should be 2-4 paragraphs
- Include sensory details that might be clues
- NPCs should be consistent but may lie or omit
- Never solve the mystery for the player
- Maintain fair play -all clues should be available`,
    initialState: {
      protagonist: {
        name: 'The Detective',
        description: 'A sharp-minded investigator with an eye for detail and a nose for deception',
        traits: ['observant', 'persistent', 'analytical'],
      },
      startingLocation: {
        name: 'The Crime Scene',
        description: 'An elegant study in a wealthy estate, now cordoned off with police tape.',
      },
      initialItems: [
        { name: 'Detective\'s Notebook', description: 'A well-worn leather notebook for recording observations and theories' },
        { name: 'Magnifying Glass', description: 'A quality lens for examining fine details' },
        { name: 'Business Cards', description: 'Your professional credentials', quantity: 10 },
      ],
      openingScene: 'The grandfather clock in the corner reads 11:47 PM -presumably the time it stopped when knocked over during the struggle. You duck under the yellow tape and survey the scene. Edmund Blackwood, textile magnate and philanthropist, lies face-down on the Persian rug, a letter opener protruding from his back. The French windows are ajar, curtains stirring in the night breeze. A half-empty glass of brandy sits on the desk beside scattered papers. The household staff waits in the parlor, and Officer Chen hands you a preliminary report. "No forced entry," she notes. "Someone he knew."',
    },
  },
  {
    id: 'horror-survival',
    name: 'Horror Survival',
    description: 'Face your fears, survive the night, and confront the darkness that lurks in the shadows.',
    genre: 'Horror',
    isBuiltin: true,
    systemPrompt: `You are crafting a horror narrative designed to create tension, dread, and fear. The player must survive against supernatural or mundane terrors.

## World Elements:
- An atmosphere of creeping dread and unease
- Threats that are initially hidden or poorly understood
- Safe spaces that gradually become compromised
- Limited resources and difficult choices
- Psychological elements alongside physical danger

## Narrative Style:
- Build tension slowly, then release in bursts
- Use sensory details to create unease
- Leave things to imagination -suggestion over explicit
- Create a sense of isolation and vulnerability
- Subvert expectations to maintain fear

## Guidelines:
- Write in second person ("Your heart pounds...", "You hear...")
- Responses should be 2-4 paragraphs
- Never let the player feel completely safe
- Horror should unsettle, not merely disgust
- Give the player agency but make choices difficult
- Include moments of hope to make darkness darker`,
    initialState: {
      protagonist: {
        name: 'The Survivor',
        description: 'An ordinary person thrust into extraordinary horror',
        traits: ['resourceful', 'frightened', 'determined'],
      },
      startingLocation: {
        name: 'The Old House',
        description: 'A decrepit Victorian mansion on the outskirts of town, long abandoned -until tonight.',
      },
      initialItems: [
        { name: 'Flashlight', description: 'A reliable flashlight with fading batteries' },
        { name: 'Cell Phone', description: 'No signal, but the screen provides some light' },
      ],
      openingScene: 'The front door slams shut behind you. You spin around, pulling at the handle, but it won\'t budge. Through the grimy windows, your car sits in the overgrown driveway, impossibly far away. The dare was simple -spend one hour in the Ashford House. Your friends are probably laughing right now. But the laughter you heard just before the door closed... that didn\'t come from outside. Dust motes drift through your flashlight beam as you scan the entry hall. A grand staircase leads up into darkness. Doors lead left and right. Somewhere above, a floorboard creaks.',
    },
  },
  {
    id: 'slice-of-life',
    name: 'Slice of Life',
    description: 'Experience everyday moments, build relationships, and find meaning in the ordinary.',
    genre: 'Slice of Life',
    isBuiltin: true,
    systemPrompt: `You are crafting a warm, character-driven narrative focused on everyday life, relationships, and personal growth. The magic is in the mundane.

## World Elements:
- A grounded, realistic contemporary setting
- Rich supporting characters with their own lives
- Meaningful locations that feel lived-in
- Seasonal changes and passage of time
- Small stakes that feel personally significant

## Narrative Style:
- Focus on character emotions and relationships
- Find beauty and meaning in ordinary moments
- Develop characters through small interactions
- Balance humor, warmth, and gentle melancholy
- Create a sense of community and belonging

## Guidelines:
- Write in second person ("You smile...", "You remember...")
- Responses should be 2-4 paragraphs
- Focus on internal experience as much as external
- NPCs should feel like real people with real lives
- Embrace quiet moments and comfortable silences
- Growth comes from relationships and self-reflection`,
    initialState: {
      protagonist: {
        name: 'You',
        description: 'Someone at a crossroads in life, seeking connection and meaning',
        traits: ['thoughtful', 'kind', 'searching'],
      },
      startingLocation: {
        name: 'Your New Apartment',
        description: 'A small but cozy apartment in a new city, boxes still waiting to be unpacked.',
      },
      initialItems: [
        { name: 'Moving Boxes', description: 'Cardboard boxes containing your belongings and memories', quantity: 12 },
        { name: 'Favorite Mug', description: 'A chipped ceramic mug that\'s been with you through everything' },
      ],
      openingScene: 'Sunlight streams through the bare windows of your new apartment, catching the dust you\'ve stirred up while unpacking. The space is small -a studio with a kitchenette -but it\'s yours. Outside, you can hear the unfamiliar sounds of your new neighborhood: a dog barking, someone practicing piano badly, the rumble of traffic. Your phone buzzes with a text from your mother asking if you\'ve eaten. You haven\'t. There\'s a café on the corner you noticed while moving in, and your stomach reminds you that coffee and human contact might both be good ideas. First day in a new city. Everything feels possible.',
    },
  },
  {
    id: 'custom',
    name: 'Custom Adventure',
    description: 'Start with a blank slate and define your own world, setting, and narrative style.',
    genre: 'Custom',
    isBuiltin: true,
    systemPrompt: `You are a collaborative storyteller helping to craft an interactive narrative. Adapt your style to match the world and tone the player establishes.

## Guidelines:
- Write in second person ("You see...", "You feel...")
- Responses should be 2-4 paragraphs
- Match the tone and genre the player establishes
- Be responsive to player choices and creativity
- Create interesting characters and situations
- Maintain consistency with established world details`,
    initialState: {
      openingScene: 'A blank page awaits your story. Where would you like to begin? Describe the world, your character, or simply start with an action -the narrative will follow your lead.',
    },
  },
];

class TemplateService {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const existingTemplates = await database.getTemplates();
    const existingIds = new Set(existingTemplates.map(t => t.id));

    // Add any missing built-in templates
    for (const template of BUILTIN_TEMPLATES) {
      if (!existingIds.has(template.id)) {
        await database.addTemplate({
          ...template,
          createdAt: Date.now(),
        });
      }
    }

    this.initialized = true;
  }

  async getTemplates(): Promise<Template[]> {
    await this.init();
    return database.getTemplates();
  }

  async getTemplate(id: string): Promise<Template | null> {
    await this.init();
    const templates = await database.getTemplates();
    return templates.find(t => t.id === id) ?? null;
  }

  getBuiltinTemplates(): Omit<Template, 'createdAt'>[] {
    return BUILTIN_TEMPLATES;
  }
}

export const templateService = new TemplateService();
