import type { Syllabus, SyllabusSubject, SyllabusChapter } from '../lib/store/types'

function ch(name: string, topics: string[]): SyllabusChapter {
  return { id: crypto.randomUUID(), name, topics: topics.map(t => ({ id: crypto.randomUUID(), name: t, completed: false })) }
}

function subj(name: string, chapters: SyllabusChapter[]): SyllabusSubject {
  return { id: crypto.randomUUID(), name, chapters }
}

function makeJEE(): Syllabus {
  return {
    id: crypto.randomUUID(), name: 'JEE Main 2026-27', examType: 'jee',
    createdAt: new Date(), subjects: [
      subj('Physics', [
        ch('Unit 1: Mechanics', [
          'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane',
          'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion',
          'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids',
          'Thermal Properties of Matter',
        ]),
        ch('Unit 2: Thermodynamics', [
          'Thermodynamics', 'Kinetic Theory',
        ]),
        ch('Unit 3: Oscillations and Waves', [
          'Oscillations', 'Waves',
        ]),
        ch('Unit 4: Electromagnetism', [
          'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
          'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter',
          'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
        ]),
        ch('Unit 5: Optics', [
          'Ray Optics and Optical Instruments', 'Wave Optics',
        ]),
        ch('Unit 6: Modern Physics', [
          'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics',
        ]),
        ch('Unit 7: Experimental Physics', [
          'Units and Measurements Lab', 'Vernier Caliper', 'Screw Gauge',
          'Simple Pendulum', 'Meter Bridge', 'Potentiometer',
        ]),
      ]),
      subj('Chemistry', [
        ch('Physical Chemistry', [
          'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements and Periodicity',
          'Chemical Bonding and Molecular Structure', 'States of Matter', 'Thermodynamics',
          'Equilibrium', 'Redox Reactions', 'Electrochemistry', 'Chemical Kinetics',
          'Surface Chemistry', 'Solid State', 'Solutions', 'p-Block Elements (Group 15-18)',
        ]),
        ch('Inorganic Chemistry', [
          'Hydrogen', 's-Block Elements', 'p-Block Elements (Group 13-14)',
          'd and f Block Elements', 'Coordination Compounds', 'Environmental Chemistry',
          'General Principles and Processes of Isolation of Elements',
        ]),
        ch('Organic Chemistry', [
          'Organic Chemistry - Some Basic Principles and Techniques', 'Hydrocarbons',
          'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers',
          'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
          'Polymers', 'Chemistry in Everyday Life', 'GOC and Isomerism',
          'Named Reactions and Reagents',
        ]),
      ]),
      subj('Mathematics', [
        ch('Algebra', [
          'Sets, Relations and Functions', 'Complex Numbers and Quadratic Equations',
          'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem',
          'Sequences and Series', 'Matrices', 'Determinants',
        ]),
        ch('Trigonometry', [
          'Trigonometric Functions', 'Trigonometric Equations', 'Inverse Trigonometric Functions',
        ]),
        ch('Coordinate Geometry', [
          'Straight Lines', 'Conic Sections', 'Introduction to 3D Geometry',
        ]),
        ch('Calculus', [
          'Limits and Derivatives', 'Application of Derivatives', 'Integrals',
          'Application of Integrals', 'Differential Equations',
        ]),
        ch('Vectors and 3D Geometry', [
          'Vectors', 'Three Dimensional Geometry',
        ]),
        ch('Statistics and Probability', [
          'Statistics', 'Probability',
        ]),
        ch('Mathematical Reasoning', [
          'Mathematical Reasoning',
        ]),
      ]),
    ],
  }
}

function makeNEET(): Syllabus {
  return {
    id: crypto.randomUUID(), name: 'NEET 2026-27', examType: 'neet',
    createdAt: new Date(), subjects: [
      subj('Physics', [
        ch('Unit 1: Mechanics', [
          'Physical World and Measurement', 'Kinematics', 'Laws of Motion',
          'Work, Energy and Power', 'System of Particles and Rotational Motion',
          'Gravitation',
        ]),
        ch('Unit 2: Properties of Matter', [
          'Properties of Solids and Liquids',
        ]),
        ch('Unit 3: Thermodynamics', [
          'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory of Gases',
        ]),
        ch('Unit 4: Oscillations and Waves', [
          'Oscillations', 'Waves',
        ]),
        ch('Unit 5: Electrostatics', [
          'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
        ]),
        ch('Unit 6: Current Electricity', [
          'Current Electricity',
        ]),
        ch('Unit 7: Magnetism', [
          'Moving Charges and Magnetism', 'Magnetism and Matter',
        ]),
        ch('Unit 8: EMI and AC', [
          'Electromagnetic Induction', 'Alternating Current',
        ]),
        ch('Unit 9: Electromagnetic Waves', [
          'Electromagnetic Waves',
        ]),
        ch('Unit 10: Optics', [
          'Ray Optics and Optical Instruments', 'Wave Optics',
        ]),
        ch('Unit 11: Dual Nature of Matter', [
          'Dual Nature of Radiation and Matter',
        ]),
        ch('Unit 12: Atoms and Nuclei', [
          'Atoms', 'Nuclei',
        ]),
        ch('Unit 13: Electronics', [
          'Semiconductor Electronics',
        ]),
        ch('Unit 14: Experimental Physics', [
          'Experimental Physics (Practical)',
        ]),
      ]),
      subj('Chemistry', [
        ch('Physical Chemistry', [
          'Some Basic Concepts of Chemistry', 'Structure of Atom',
          'Classification of Elements and Periodicity', 'Chemical Bonding and Molecular Structure',
          'States of Matter', 'Thermodynamics', 'Equilibrium',
          'Redox Reactions', 'Electrochemistry', 'Chemical Kinetics',
          'Surface Chemistry', 'Solid State', 'Solutions',
        ]),
        ch('Inorganic Chemistry', [
          'Hydrogen', 's-Block Elements', 'p-Block Elements (Group 13-14)',
          'p-Block Elements (Group 15-18)', 'd and f Block Elements',
          'Coordination Compounds', 'Environmental Chemistry',
          'General Principles of Isolation of Elements',
        ]),
        ch('Organic Chemistry', [
          'Organic Chemistry - Basic Principles', 'Hydrocarbons',
          'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers',
          'Aldehydes, Ketones and Carboxylic Acids', 'Amines',
          'Biomolecules', 'Polymers', 'Chemistry in Everyday Life',
        ]),
      ]),
      subj('Botany', [
        ch('Diversity in Living World', [
          'The Living World', 'Biological Classification', 'Plant Kingdom',
        ]),
        ch('Structural Organisation in Plants', [
          'Morphology of Flowering Plants', 'Anatomy of Flowering Plants',
          'Structural Organisation in Animals',
        ]),
        ch('Plant Physiology', [
          'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis',
          'Respiration in Plants', 'Plant Growth and Development',
        ]),
        ch('Reproduction', [
          'Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants',
        ]),
        ch('Genetics and Evolution', [
          'Molecular Basis of Inheritance', 'Evolution',
        ]),
        ch('Biology in Human Welfare', [
          'Human Health and Disease', 'Strategies for Enhancement in Food Production',
          'Microbes in Human Welfare',
        ]),
        ch('Biotechnology', [
          'Biotechnology - Principles and Processes', 'Biotechnology and Its Applications',
        ]),
        ch('Ecology', [
          'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation',
        ]),
      ]),
      subj('Zoology', [
        ch('Diversity in Living World', [
          'Animal Kingdom',
        ]),
        ch('Structural Organisation', [
          'Tissues', 'Morphology and Anatomy of Cockroach',
        ]),
        ch('Human Physiology', [
          'Digestion and Absorption', 'Breathing and Exchange of Gases',
          'Body Fluids and Circulation', 'Excretory Products and their Elimination',
          'Locomotion and Movement', 'Neural Control and Coordination',
          'Chemical Coordination and Integration',
        ]),
        ch('Reproduction', [
          'Reproductive Organisation', 'Human Reproduction',
          'Reproductive Health',
        ]),
        ch('Genetics and Evolution', [
          'Heredity and Evolution',
        ]),
        ch('Biology in Human Welfare', [
          'Human Health and Disease (Zoology)', 'Evolution',
        ]),
        ch('Biotechnology', [
          'Biotechnology and Its Applications (Zoology)',
        ]),
        ch('Ecology', [
          'Ecosystem (Zoology)', 'Biodiversity and Conservation',
        ]),
      ]),
    ],
  }
}

function makeClass10(): Syllabus {
  return {
    id: crypto.randomUUID(), name: 'CBSE Class 10', examType: 'class10',
    createdAt: new Date(), subjects: [
      subj('Science', [
        ch('Chemical Substances - Nature and Behaviour', [
          'Chemical Reactions and Equations', 'Acids, Bases and Salts',
          'Metals and Non-metals', 'Carbon and its Compounds',
        ]),
        ch('World of Living', [
          'Life Processes', 'Control and Coordination',
          'How do Organisms Reproduce', 'Heredity and Evolution',
        ]),
        ch('Natural Phenomena', [
          'Reflection of Light', 'Refraction of Light',
        ]),
        ch('Effects of Current', [
          'Electricity', 'Magnetic Effects of Electric Current',
        ]),
        ch('Natural Resources', [
          'Our Environment', 'Sustainable Management of Natural Resources',
        ]),
      ]),
      subj('Mathematics', [
        ch('Number Systems', [
          'Real Numbers',
        ]),
        ch('Algebra', [
          'Polynomials', 'Pair of Linear Equations in Two Variables',
          'Quadratic Equations', 'Arithmetic Progressions',
        ]),
        ch('Coordinate Geometry', [
          'Coordinate Geometry',
        ]),
        ch('Geometry', [
          'Triangles', 'Circles', 'Constructions',
        ]),
        ch('Trigonometry', [
          'Introduction to Trigonometry', 'Some Applications of Trigonometry',
        ]),
        ch('Mensuration', [
          'Areas Related to Circles', 'Surface Areas and Volumes',
        ]),
        ch('Statistics and Probability', [
          'Statistics', 'Probability',
        ]),
      ]),
      subj('Social Science - History', [
        ch('The Rise of Nationalism in Europe', [
          'The Rise of Nationalism in Europe',
        ]),
        ch('Nationalism in India', [
          'Nationalism in India',
        ]),
        ch('The Making of a Global World', [
          'The Making of a Global World',
        ]),
        ch('The Age of Industrialisation', [
          'The Age of Industrialisation',
        ]),
        ch('Print Culture and the Modern World', [
          'Print Culture and the Modern World',
        ]),
      ]),
      subj('Social Science - Geography', [
        ch('Resources and Development', [
          'Resources and Development', 'Forest and Wildlife Resources',
          'Water Resources', 'Agriculture', 'Minerals and Energy Resources',
          'Manufacturing Industries', 'Lifelines of National Economy',
        ]),
      ]),
      subj('Social Science - Political Science', [
        ch('Power Sharing', [
          'Power Sharing', 'Federalism', 'Democracy and Diversity',
          'Gender, Religion and Caste', 'Political Parties', 'Outcomes of Democracy',
        ]),
      ]),
      subj('Social Science - Economics', [
        ch('Development', [
          'Development', 'Sectors of the Indian Economy',
          'Money and Credit', 'Globalisation and the Indian Economy',
          'Consumer Rights',
        ]),
      ]),
      subj('English', [
        ch('Prose', [
          'A Letter to God', 'Nelson Mandela: Long Walk to Freedom',
          'Two Stories about Flying', 'From the Diary of Anne Frank',
          'The Hundred Dresses I', 'Glimpses of India',
          'Mijbil the Otter', 'Madam Rides the Bus',
          'The Sermon at Benares', 'The Proposal',
        ]),
        ch('Poetry', [
          'Dust of Snow', 'Fire and Ice', 'A Tiger in the Zoo',
          'How to Tell Wild Animals', 'The Ball Poem', 'Amanda',
          'Animals', 'The Trees', 'Fog', 'The Tale of Custard the Dragon',
          'For Anne Gregory',
        ]),
        ch('Supplementary Reader', [
          'A Triumph of Surgery', 'The Thief\'s Story', 'Footprints without Feet',
          'The Making of a Scientist', 'The Necklace', 'Bholi',
          'The Book That Saved the Earth',
        ]),
        ch('Writing and Grammar', [
          'Letter Writing', 'Analytical Paragraph', 'Subject-Verb Concord',
          'Determiners', 'Tenses', 'Modals', 'Clauses',
          'Active and Passive Voice', 'Reported Speech',
        ]),
      ]),
    ],
  }
}

function makeClass12(): Syllabus {
  return {
    id: crypto.randomUUID(), name: 'CBSE Class 12', examType: 'class12',
    createdAt: new Date(), subjects: [
      subj('Physics', [
        ch('Electrostatics', [
          'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
        ]),
        ch('Current Electricity', [
          'Current Electricity',
        ]),
        ch('Magnetic Effects of Current and Magnetism', [
          'Moving Charges and Magnetism', 'Magnetism and Matter',
        ]),
        ch('Electromagnetic Induction and Alternating Current', [
          'Electromagnetic Induction', 'Alternating Current',
        ]),
        ch('Electromagnetic Waves', [
          'Electromagnetic Waves',
        ]),
        ch('Optics', [
          'Ray Optics and Optical Instruments', 'Wave Optics',
        ]),
        ch('Dual Nature of Radiation and Matter', [
          'Dual Nature of Radiation and Matter',
        ]),
        ch('Atoms and Nuclei', [
          'Atoms', 'Nuclei',
        ]),
        ch('Semiconductor Electronics', [
          'Semiconductor Electronics: Materials, Devices and Simple Circuits',
        ]),
        ch('Communication Systems', [
          'Communication Systems',
        ]),
      ]),
      subj('Chemistry', [
        ch('Solutions', [
          'Solutions',
        ]),
        ch('Electrochemistry', [
          'Electrochemistry',
        ]),
        ch('Chemical Kinetics', [
          'Chemical Kinetics',
        ]),
        ch('Surface Chemistry', [
          'Surface Chemistry',
        ]),
        ch('General Principles and Processes of Isolation of Elements', [
          'General Principles and Processes of Isolation of Elements',
        ]),
        ch('p-Block Elements', [
          'Group 15 Elements', 'Group 16 Elements', 'Group 17 Elements', 'Group 18 Elements',
        ]),
        ch('d and f Block Elements', [
          'd-Block Elements', 'f-Block Elements', 'Coordination Compounds',
        ]),
        ch('Haloalkanes and Haloarenes', [
          'Haloalkanes', 'Haloarenes',
        ]),
        ch('Alcohols, Phenols and Ethers', [
          'Alcohols', 'Phenols', 'Ethers',
        ]),
        ch('Aldehydes, Ketones and Carboxylic Acids', [
          'Aldehydes', 'Ketones', 'Carboxylic Acids',
        ]),
        ch('Amines', [
          'Amines',
        ]),
        ch('Biomolecules', [
          'Carbohydrates', 'Proteins', 'Nucleic Acids',
        ]),
        ch('Polymers', [
          'Polymers',
        ]),
        ch('Chemistry in Everyday Life', [
          'Chemicals in Medicines', 'Chemicals in Food', 'Cleansing Agents',
        ]),
      ]),
      subj('Mathematics', [
        ch('Relations and Functions', [
          'Relations and Functions', 'Inverse Trigonometric Functions',
        ]),
        ch('Algebra', [
          'Matrices', 'Determinants',
        ]),
        ch('Calculus', [
          'Continuity and Differentiability', 'Application of Derivatives',
          'Integrals', 'Application of Integrals', 'Differential Equations',
        ]),
        ch('Vectors and Three Dimensional Geometry', [
          'Vectors', 'Three Dimensional Geometry',
        ]),
        ch('Linear Programming', [
          'Linear Programming',
        ]),
        ch('Probability', [
          'Probability',
        ]),
      ]),
      subj('Biology', [
        ch('Reproduction', [
          'Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants',
          'Human Reproduction', 'Reproductive Health',
        ]),
        ch('Genetics and Evolution', [
          'Heredity and Evolution', 'Molecular Basis of Inheritance',
        ]),
        ch('Biology and Human Welfare', [
          'Human Health and Disease', 'Strategies for Enhancement in Food Production',
          'Microbes in Human Welfare',
        ]),
        ch('Biotechnology and Its Applications', [
          'Biotechnology - Principles and Processes', 'Biotechnology and Its Applications',
        ]),
        ch('Ecology and Environment', [
          'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation',
          'Environmental Issues',
        ]),
      ]),
      subj('English', [
        ch('Flamingo - Prose', [
          'The Last Lesson', 'Lost Spring', 'Deep Water',
          'The Rattrap', 'Indigo', 'Poets and Pancakes',
          'The Interview', 'Going Places',
        ]),
        ch('Flamingo - Poetry', [
          'My Mother at Sixty-Six', 'Keeping Quiet', 'A Thing of Beauty',
          'A Roadside Stand', 'Aunt Jennifer\'s Tigers',
        ]),
        ch('Vistas - Supplementary', [
          'The Third Level', 'The Tiger King', 'Journey to the End of the Earth',
          'The Enemy', 'On the Face of It', 'Memories of Childhood',
        ]),
        ch('Writing Skills', [
          'Letter Writing', 'Advertisement', 'Notice',
          'Report Writing', 'Analytical Paragraph',
        ]),
      ]),
    ],
  }
}

const PRESETS: Record<string, () => Syllabus> = {
  jee: makeJEE,
  neet: makeNEET,
  class10: makeClass10,
  class12: makeClass12,
}

export function getPresetSyllabus(type: string): Syllabus | null {
  const factory = PRESETS[type]
  return factory ? factory() : null
}

export const PRESET_TYPES = [
  { value: 'jee', label: 'JEE Main 2026-27' },
  { value: 'neet', label: 'NEET 2026-27' },
  { value: 'class10', label: 'CBSE Class 10' },
  { value: 'class12', label: 'CBSE Class 12' },
] as const
