// Seeds the academic curriculum, default contact info, settings and the admin account.
// Safe to run more than once — it only inserts what is missing.
import bcrypt from 'bcryptjs';
import { db, getSetting, setSetting } from './db.js';
import { config } from './config.js';

// PLACEHOLDER price — change every course price in Admin › Courses & Pricing.
const DEFAULT_PRICE = 0;

const c = (criterion, weight) => ({ criterion, weight });

const CURRICULUM = [
  {
    title: 'Drawing Fundamentals', slug: 'drawing-fundamentals',
    description: 'The grammar of drawing: mark, structure, volume and light.',
    courses: [
      {
        title: 'Points & Lines', slug: 'points-and-lines',
        summary: 'Control the most basic marks: dots, straight, curved and expressive lines.',
        learning_outcomes: 'Draw confident straight and curved lines freehand, vary line weight intentionally and use line to describe contour and direction.',
        deliverables: '2 A4 sheets of line exercises (parallel, radiating, ellipses) + 1 contour drawing of a household object.',
        criteria: [c('Line confidence & continuity', 30), c('Control of line weight', 25), c('Accuracy of ellipses and curves', 25), c('Neatness and page layout', 20)],
      },
      {
        title: 'Formal Structures', slug: 'formal-structures',
        summary: 'Break complex objects into cubes, cylinders, spheres and cones.',
        learning_outcomes: 'Construct objects from primitive forms, draw through hidden edges and keep proportions consistent.',
        deliverables: '3 construction drawings of everyday objects showing all construction lines.',
        criteria: [c('Correct use of primitive forms', 35), c('Proportion & alignment', 30), c('Clarity of construction lines', 20), c('Overall presentation', 15)],
      },
      {
        title: 'Volume', slug: 'volume',
        summary: 'Make flat shapes feel three-dimensional with cross-contours and overlap.',
        learning_outcomes: 'Describe volume with cross-contour lines, overlap and foreshortening without relying on shading.',
        deliverables: 'A drawing of a draped cloth and 2 fruit studies using only cross-contour line.',
        criteria: [c('Convincing sense of volume', 40), c('Cross-contour accuracy', 30), c('Foreshortening', 15), c('Quality of linework', 15)],
      },
      {
        title: 'Chiaroscuro: Tone & Light/Shadow', slug: 'chiaroscuro',
        summary: 'Model form with light: value scales, the six zones of light and cast shadows.',
        learning_outcomes: 'Build a 9-step value scale, identify light, half-tone, core shadow, reflected light and cast shadow, and render convincing form.',
        deliverables: 'A3 graphite still life of three objects under a single light source + 9-step value scale.',
        criteria: [c('Value range & tonal contrast', 30), c('Accuracy of light zones', 30), c('Edge control (hard, soft, lost)', 20), c('Quality of linework & mark-making', 20)],
      },
    ],
  },
  {
    title: 'Color Theory', slug: 'color-theory',
    description: 'How color works — and how to make it work for you.',
    courses: [
      {
        title: 'The Color Wheel', slug: 'color-wheel',
        summary: 'Primaries, secondaries, tertiaries and mixing with a limited palette.',
        learning_outcomes: 'Mix a 12-step color wheel from three primaries and explain complementary and analogous relationships.',
        deliverables: 'Hand-mixed 12-part color wheel + complementary mixing chart.',
        criteria: [c('Mixing accuracy', 35), c('Clean, even paint application', 25), c('Correct color relationships', 25), c('Presentation', 15)],
      },
      {
        title: 'Value Relationships', slug: 'value-relationships',
        summary: 'Every color has a value — learn to see and control it.',
        learning_outcomes: 'Match the value of any hue to a grey scale and build color studies that read correctly in black and white.',
        deliverables: 'Value-matched color chart + one small still life with a greyscale photo of it.',
        criteria: [c('Value matching accuracy', 40), c('Readability in greyscale', 30), c('Paint handling', 15), c('Presentation', 15)],
      },
      {
        title: 'Temperature', slug: 'color-temperature',
        summary: 'Warm vs cool, and how temperature shifts between light and shadow.',
        learning_outcomes: 'Use warm/cool contrast to describe light and atmosphere and push forms forward or back.',
        deliverables: 'Two versions of the same study: warm light/cool shadow and cool light/warm shadow.',
        criteria: [c('Consistent temperature logic', 40), c('Sense of light', 30), c('Color mixing', 15), c('Presentation', 15)],
      },
      {
        title: 'Harmonization', slug: 'color-harmonization',
        summary: 'Build palettes that feel unified: analogous, complementary, triadic, split.',
        learning_outcomes: 'Choose and apply a harmony scheme deliberately and justify the choice for mood.',
        deliverables: '3 thumbnail paintings of one scene in three harmony schemes + short written rationale.',
        criteria: [c('Harmony applied correctly', 35), c('Mood & intent', 30), c('Color mixing', 20), c('Written rationale', 15)],
      },
    ],
  },
  {
    title: 'Composition & Perspective', slug: 'composition-perspective',
    description: 'Arranging space and guiding the viewer\'s eye.',
    courses: [
      {
        title: 'Linear Perspective', slug: 'linear-perspective',
        summary: 'One-, two- and three-point perspective from the horizon line up.',
        learning_outcomes: 'Set up horizon, vanishing points and measuring lines; draw boxes, interiors and streets in correct perspective.',
        deliverables: 'One interior (1-point) and one street scene (2-point) with all construction lines visible.',
        criteria: [c('Perspective accuracy', 40), c('Consistent eye level & scale', 25), c('Line quality', 20), c('Presentation', 15)],
      },
      {
        title: 'Focal Points', slug: 'focal-points',
        summary: 'Create a clear center of interest with contrast, detail and placement.',
        learning_outcomes: 'Lead the viewer to one focal point using value contrast, edge, detail and directional lines.',
        deliverables: '6 thumbnails + 1 finished composition with a clearly dominant focal point.',
        criteria: [c('Clarity of focal point', 40), c('Use of eye-leading devices', 25), c('Thumbnail exploration', 20), c('Finish', 15)],
      },
      {
        title: 'Spatial Tension', slug: 'spatial-tension',
        summary: 'Balance, asymmetry, negative space and the energy between shapes.',
        learning_outcomes: 'Use asymmetrical balance, tangents (and avoiding them) and negative space to create dynamic compositions.',
        deliverables: 'Abstract shape study + a still-life composition annotated with balance analysis.',
        criteria: [c('Dynamic balance', 35), c('Use of negative space', 30), c('Annotation & analysis', 20), c('Presentation', 15)],
      },
      {
        title: 'Framing', slug: 'framing',
        summary: 'Crop, format and frame-within-a-frame decisions.',
        learning_outcomes: 'Choose formats and crops deliberately and use framing devices within the picture.',
        deliverables: 'One subject drawn in 4 crops/formats + final framed piece.',
        criteria: [c('Strength of crop choices', 35), c('Frame-within-frame use', 25), c('Variety of exploration', 25), c('Finish', 15)],
      },
    ],
  },
  {
    title: 'Human Anatomy & Figure Drawing', slug: 'anatomy-figure',
    description: 'Drawing the human figure from structure to gesture.',
    courses: [
      {
        title: 'Proportions', slug: 'figure-proportions',
        summary: 'Head-unit canons for adults, children and different body types.',
        learning_outcomes: 'Measure and draw standing, seated and foreshortened figures in correct proportion.',
        deliverables: 'Proportion chart (front/side/back) + 3 figure studies from reference.',
        criteria: [c('Proportional accuracy', 40), c('Measuring method shown', 25), c('Line quality', 20), c('Presentation', 15)],
      },
      {
        title: 'Skeletal Structure', slug: 'skeletal-structure',
        summary: 'The skeleton as the scaffold of every pose.',
        learning_outcomes: 'Draw the major bones from memory and place the skeleton inside any pose.',
        deliverables: 'Skeleton drawn from memory (front & side) + 2 poses with skeleton overlay.',
        criteria: [c('Anatomical accuracy', 40), c('Correct placement in pose', 30), c('Clarity', 15), c('Presentation', 15)],
      },
      {
        title: 'Muscle Landmarks', slug: 'muscle-landmarks',
        summary: 'Key surface muscles and bony landmarks that shape the figure.',
        learning_outcomes: 'Identify and render major muscle groups and landmarks that affect the surface form.',
        deliverables: 'Écorché study of torso and limbs + one shaded figure with landmarks labelled.',
        criteria: [c('Landmark accuracy', 35), c('Muscle form & volume', 30), c('Tonal rendering', 20), c('Labelling', 15)],
      },
      {
        title: 'Gestural Sketching', slug: 'gesture',
        summary: 'Capture life and movement in 30-second to 5-minute poses.',
        learning_outcomes: 'Find the line of action and rhythm of a pose quickly and loosely.',
        deliverables: '40 timed gesture drawings (30s / 1min / 2min / 5min) on newsprint or A3.',
        criteria: [c('Line of action & rhythm', 40), c('Energy & economy of line', 30), c('Proportion within gesture', 15), c('Volume of work completed', 15)],
      },
    ],
  },
];

export function seed() {
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (title, slug, description, sort_order) VALUES (?,?,?,?)');
  const insertCourse = db.prepare(`INSERT OR IGNORE INTO courses
    (category_id, title, slug, summary, learning_outcomes, deliverables, evaluation_criteria, price_etb, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?)`);

  db.transaction(() => {
    CURRICULUM.forEach((cat, i) => {
      insertCat.run(cat.title, cat.slug, cat.description, i);
      const catId = db.prepare('SELECT id FROM categories WHERE slug = ?').get(cat.slug).id;
      cat.courses.forEach((co, j) =>
        insertCourse.run(catId, co.title, co.slug, co.summary, co.learning_outcomes, co.deliverables,
          JSON.stringify(co.criteria), DEFAULT_PRICE, j));
    });

    if (!db.prepare('SELECT 1 FROM contact_info').get()) {
      const ins = db.prepare('INSERT INTO contact_info (kind, label, value, sort_order) VALUES (?,?,?,?)');
      ins.run('email', 'Email', 'Artistabrham@gmail.com', 0);
      ins.run('phone', 'Phone', '+251913516032', 1);
      ins.run('telegram', 'Telegram', '@ArtistAbrham', 2);
    }
    if (!db.prepare('SELECT 1 FROM submission_links').get()) {
      const ins = db.prepare('INSERT INTO submission_links (kind, label, url, is_default) VALUES (?,?,?,?)');
      ins.run('telegram', 'Send on Telegram', 'https://t.me/ArtistAbrham', 1);
      ins.run('email', 'Send by email', 'mailto:Artistabrham@gmail.com', 0);
    }
    const defaults = {
      subscription_discount_percent: 40,
      subscription_fixed_price_etb: 0,
      session_price_online_etb: 0,
      session_price_in_person_etb: 0,
      cbe_account_name: '',
      cbe_account_number: '',
      telebirr_name: '',
      telebirr_number: '+251913516032',
    };
    for (const [k, v] of Object.entries(defaults)) if (getSetting(k) === null) setSetting(k, v);
  })();

  if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
    if (!config.admin.password || config.admin.password.startsWith('change-me')) {
      console.warn('⚠ Set ADMIN_PASSWORD in .env to create the admin account.');
    } else {
      db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?, 'admin')")
        .run(config.admin.name, config.admin.email, bcrypt.hashSync(config.admin.password, 12));
      console.log(`✔ Admin account created for ${config.admin.email}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  seed();
  console.log('✔ Seed complete');
}
