// species.ts
// Canonical source for the alien species — typed data, with `satisfies`
// preserving literal id inference.

export type SpeciesId =
  | 'grays'
  | 'nordics'
  | 'reptilians'
  | 'mantids'
  | 'tall-grays'
  | 'hybrids'
  | 'tall-whites'
  | 'pleiadians'
  | 'arcturians'
  | 'sirians'
  | 'andromedans'
  | 'blue-avians';

export interface Species {
  id: SpeciesId;
  name: string;
  tagline: string;
  description: string; // prose; may contain limited inline markdown (`*emphasis*`)
  traits: string[];
  accent: string; // CSS color for per-species theming
}

export const species = [
  {
    id: 'grays',
    name: 'Grays',
    tagline: 'Small, silent, and always on shift.',
    description:
      'The most-reported visitors by a wide margin, and the face the word "alien" conjures: short and thin, with an oversized hairless head and large wraparound black eyes. Grays are the quiet workers of the phenomenon — present, precise, and endlessly task-focused, but never the ones in charge. They get the job done without a word and without apparent feeling.',
    traits: ['methodical', 'detached', 'dutiful', 'unsettlingly calm'],
    accent: '#7C8290',
  },
  {
    id: 'nordics',
    name: 'Nordics',
    tagline: 'Tall, calm, and suspiciously reassuring.',
    description:
      'Tall, fair, and strikingly human — the type least likely to frighten anyone, which is exactly why skeptics find them suspicious. Nordics are cast as serene observers: watching, occasionally supervising, sometimes voicing ethical concern, but rarely intervening. They carry themselves like beings who have already seen how the story ends.',
    traits: ['serene', 'principled', 'watchful', 'reassuring'],
    accent: '#A9C7E0',
  },
  {
    id: 'reptilians',
    name: 'Reptilians',
    tagline: 'Always three moves ahead, always in charge.',
    description:
      'Roughly human height but scaled and muscular, with vertical pupils and sometimes a tail. Reptilians are the adversarial archetype — territorial, calculating, and drawn to control. More than any other type, they sit at the center of conspiracy lore about hidden hands steering human institutions. Whether or not you trust them, you will not out-maneuver them easily.',
    traits: ['controlling', 'strategic', 'territorial', 'commanding'],
    accent: '#2F5E3A',
  },
  {
    id: 'mantids',
    name: 'Mantids',
    tagline: 'Running the procedure, not assisting it.',
    description:
      'Tall and thin with unmistakable praying-mantis morphology — elongated head, large angled eyes, long deliberate limbs. In abduction accounts the Mantids are the supervisors and surgeons: the senior intellect overseeing the work while the Grays carry it out. Cool, exacting, and hierarchically dominant, they radiate the authority of someone who has done this a thousand times.',
    traits: ['cerebral', 'authoritative', 'clinical', 'precise'],
    accent: '#6B7A35',
  },
  {
    id: 'tall-grays',
    name: 'Tall Grays',
    tagline: 'The voice the smaller ones answer to.',
    description:
      'Same morphology as the common Grays, but taller and unmistakably in command — often described as directing the smaller workers and, in many accounts, the one who actually speaks. If the short Grays are the crew, the Tall Gray is the foreman: composed, deliberate, and clearly several rungs up the ladder.',
    traits: ['directive', 'composed', 'the spokesperson', 'in charge'],
    accent: '#5E6B7A',
  },
  {
    id: 'hybrids',
    name: 'Hybrids',
    tagline: 'Almost human — and that is the point.',
    description:
      'Human–Gray crosses, central to the abduction research of Budd Hopkins and David Jacobs, who framed the entire phenomenon as a long breeding program. Hybrids pass as human until something subtle reads as *off*, and they are sometimes presented to abductees as their own offspring. They live in the uncanny seam between two worlds, fully at home in neither.',
    traits: ['liminal', 'adaptive', 'uncanny', 'between worlds'],
    accent: '#C2A8A0',
  },
  {
    id: 'tall-whites',
    name: 'Tall Whites',
    tagline: 'Pale, proud, and quick to take offense.',
    description:
      'Drawn from Charles Hall\'s accounts of beings allegedly housed near Nellis Air Force Base: very tall, pale, fragile-looking, and blue-eyed. Distinct from the placid Nordics in temperament — described as volatile, easily affronted, and not to be crossed. A self-contained lore resting almost entirely on a single source, which only adds to their air of guarded exclusivity.',
    traits: ['aloof', 'volatile', 'exacting', 'easily affronted'],
    accent: '#DCDCE2',
  },
  {
    id: 'pleiadians',
    name: 'Pleiadians',
    tagline: 'Here with a message and a lot of hope.',
    description:
      'A Nordic-type lineage tied specifically to the Billy Meier contactee case: human-looking beings said to hail from the Pleiades. They sit on the boundary between the recovery accounts and the channeled tier — described less as examiners and more as benevolent guides, arriving with warnings, wisdom, and an almost evangelical optimism about humanity\'s potential.',
    traits: ['idealistic', 'warm', 'evolved', 'hopeful'],
    accent: '#8E9BD4',
  },
  {
    id: 'arcturians',
    name: 'Arcturians',
    tagline: 'Less a body, more a frequency.',
    description:
      'A "higher-density" civilization known through visionary contact rather than physical sightings, which is why their form is described so inconsistently — they are felt more than seen. Cast as healers and spiritual guides operating beyond ordinary matter, Arcturians are the most ethereal of the group: serene, transcendent, and largely uninterested in the physical drama the other types are tangled in.',
    traits: ['ethereal', 'healing', 'transcendent', 'beyond the physical'],
    accent: '#6A6FD0',
  },
  {
    id: 'sirians',
    name: 'Sirians',
    tagline: 'Keeper of older knowledge than yours.',
    description:
      'Said to originate from Sirius, and linked in popular lore to Robert Temple\'s reading of Dogon mythology and its amphibious "Nommo" beings. Sirians are framed as ancient knowledge-keepers — teachers tied to deep myth and the origins of civilization itself. Where others observe or examine, the Sirian instructs, carrying the weight of stories far older than ours.',
    traits: ['ancient', 'knowledge-keeper', 'mythic', 'teacherly'],
    accent: '#2E8B9E',
  },
  {
    id: 'andromedans',
    name: 'Andromedans',
    tagline: 'Thinking in galaxies, not days.',
    description:
      'Central to Alex Collier\'s 1990s contactee material, the Andromedans are framed as a galactic-council type — diplomats and statesfolk of the cosmos, concerned with balance, governance, and the long arc of civilizations. They reason at scales that make planetary politics look parochial, weighing decisions by their consequences centuries out.',
    traits: ['diplomatic', 'big-picture', 'principled', 'council-minded'],
    accent: '#4C5B8C',
  },
  {
    id: 'blue-avians',
    name: 'Blue Avians',
    tagline: 'A cosmic message wrapped in feathers.',
    description:
      'The newest and most fringe of the lot, from Corey Goode\'s "Secret Space Program" claims of the mid-2010s: tall, blue, bird-like beings who arrive bearing spiritual messages of love and forgiveness. Widely rejected even within disclosure circles, they remain the purest expression of the channeled tier — otherworldly, devotional, and serenely indifferent to whether you believe them.',
    traits: ['visionary', 'devotional', 'serenely cryptic', 'otherworldly'],
    accent: '#3A8FD6',
  },
] satisfies Species[];

// v1 roster: a trimmed "classic abduction lore" set. The other authored species
// stay above, ready to re-enable by adding their ids here. Order is significant —
// scoring ties break by position in this list (see lib/scoring.ts).
export const ACTIVE_SPECIES_IDS = [
  'grays',
  'nordics',
  'reptilians',
  'mantids',
  'hybrids',
] as const satisfies readonly SpeciesId[];

export type ActiveSpeciesId = (typeof ACTIVE_SPECIES_IDS)[number];

const activeIdSet = new Set<SpeciesId>(ACTIVE_SPECIES_IDS);

// Via getSpecies so an unauthored roster id fails loudly at module load.
export const activeSpecies: Species[] = ACTIVE_SPECIES_IDS.map((id) => getSpecies(id));

export function getSpecies(id: SpeciesId): Species {
  const found = species.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown species id: ${id}`);
  return found;
}

export function isActiveSpecies(id: SpeciesId): id is ActiveSpeciesId {
  return activeIdSet.has(id);
}
