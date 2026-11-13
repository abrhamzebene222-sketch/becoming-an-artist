// Seeds the academic curriculum, default contacts, settings and the admin account.
// Safe to run on every start — it only inserts what is missing and never overwrites your edits.
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { Category, Course, ContactInfo, SubmissionLink, Setting, User } from './models/index.js';
import { config } from './config.js';

const c = (criterion, weight) => ({ criterion, weight });

// Prices start at 0 with isFree=false → shown as "Price coming soon" until you set them in Admin › Courses.
const CURRICULUM = [
  {
    title: 'Drawing Fundamentals', titleAm: 'የስዕል መሠረታዊ ትምህርቶች', slug: 'drawing-fundamentals',
    description: 'The grammar of drawing: mark, structure, volume and light.',
    descriptionAm: 'የስዕል ሰዋስው፦ መስመር፣ መዋቅር፣ ይዘት እና ብርሃን።',
    courses: [
      { title: 'Points & Lines', titleAm: 'ነጥቦች እና መስመሮች', slug: 'points-and-lines',
        summary: 'Control the most basic marks: dots, straight, curved and expressive lines.',
        summaryAm: 'መሠረታዊ ምልክቶችን መቆጣጠር፦ ነጥቦች፣ ቀጥ ያሉ፣ ጠማማ እና ስሜት ገላጭ መስመሮች።',
        learningOutcomes: 'Draw confident straight and curved lines freehand, vary line weight intentionally and use line to describe contour and direction.',
        deliverables: '2 A4 sheets of line exercises (parallel, radiating, ellipses) + 1 contour drawing of a household object.',
        evaluationCriteria: [c('Line confidence & continuity', 30), c('Control of line weight', 25), c('Accuracy of ellipses and curves', 25), c('Neatness and page layout', 20)] },
      { title: 'Formal Structures', titleAm: 'ቅርጻዊ መዋቅሮች', slug: 'formal-structures',
        summary: 'Break complex objects into cubes, cylinders, spheres and cones.',
        summaryAm: 'ውስብስብ ነገሮችን ወደ ኩብ፣ ሲሊንደር፣ ሉል እና ኮን መከፋፈል።',
        learningOutcomes: 'Construct objects from primitive forms, draw through hidden edges and keep proportions consistent.',
        deliverables: '3 construction drawings of everyday objects showing all construction lines.',
        evaluationCriteria: [c('Correct use of primitive forms', 35), c('Proportion & alignment', 30), c('Clarity of construction lines', 20), c('Overall presentation', 15)] },
      { title: 'Volume', titleAm: 'ይዘት (ቮልዩም)', slug: 'volume',
        summary: 'Make flat shapes feel three-dimensional with cross-contours and overlap.',
        summaryAm: 'ጠፍጣፋ ቅርጾችን በመስቀለኛ መስመሮች እና በመደራረብ ባለ ሦስት አቅጣጫ ማድረግ።',
        learningOutcomes: 'Describe volume with cross-contour lines, overlap and foreshortening without relying on shading.',
        deliverables: 'A drawing of a draped cloth and 2 fruit studies using only cross-contour line.',
        evaluationCriteria: [c('Convincing sense of volume', 40), c('Cross-contour accuracy', 30), c('Foreshortening', 15), c('Quality of linework', 15)] },
      { title: 'Chiaroscuro: Tone & Light/Shadow', titleAm: 'ኪያሮስኩሮ፦ ቶን፣ ብርሃን እና ጥላ', slug: 'chiaroscuro',
        summary: 'Model form with light: value scales, the six zones of light and cast shadows.',
        summaryAm: 'ቅርጽን በብርሃን መግለጽ፦ የቶን ደረጃዎች፣ ስድስቱ የብርሃን ክፍሎች እና የሚወድቅ ጥላ።',
        learningOutcomes: 'Build a 9-step value scale, identify light, half-tone, core shadow, reflected light and cast shadow, and render convincing form.',
        deliverables: 'A3 graphite still life of three objects under a single light source + 9-step value scale.',
        evaluationCriteria: [c('Value range & tonal contrast', 30), c('Accuracy of light zones', 30), c('Edge control (hard, soft, lost)', 20), c('Quality of linework & mark-making', 20)] },
    ],
  },
  {
    title: 'Color Theory', titleAm: 'የቀለም ጥናት', slug: 'color-theory',
    description: 'How color works — and how to make it work for you.',
    descriptionAm: 'ቀለም እንዴት እንደሚሠራ እና እንዴት እንደሚጠቀሙበት።',
    courses: [
      { title: 'The Color Wheel', titleAm: 'የቀለም ክብ', slug: 'color-wheel',
        summary: 'Primaries, secondaries, tertiaries and mixing with a limited palette.',
        summaryAm: 'ዋና፣ ሁለተኛ እና ሦስተኛ ደረጃ ቀለሞች እና በጥቂት ቀለሞች ማደባለቅ።',
        learningOutcomes: 'Mix a 12-step color wheel from three primaries and explain complementary and analogous relationships.',
        deliverables: 'Hand-mixed 12-part color wheel + complementary mixing chart.',
        evaluationCriteria: [c('Mixing accuracy', 35), c('Clean, even paint application', 25), c('Correct color relationships', 25), c('Presentation', 15)] },
      { title: 'Value Relationships', titleAm: 'የብሩህነት ግንኙነቶች', slug: 'value-relationships',
        summary: 'Every color has a value — learn to see and control it.',
        summaryAm: 'እያንዳንዱ ቀለም የራሱ ብሩህነት አለው — ማየት እና መቆጣጠር ይማሩ።',
        learningOutcomes: 'Match the value of any hue to a grey scale and build color studies that read correctly in black and white.',
        deliverables: 'Value-matched color chart + one small still life with a greyscale photo of it.',
        evaluationCriteria: [c('Value matching accuracy', 40), c('Readability in greyscale', 30), c('Paint handling', 15), c('Presentation', 15)] },
      { title: 'Temperature', titleAm: 'የቀለም ሙቀት', slug: 'color-temperature',
        summary: 'Warm vs cool, and how temperature shifts between light and shadow.',
        summaryAm: 'ሞቃት እና ቀዝቃዛ ቀለሞች፤ በብርሃን እና በጥላ መካከል ያለው የሙቀት ለውጥ።',
        learningOutcomes: 'Use warm/cool contrast to describe light and atmosphere and push forms forward or back.',
        deliverables: 'Two versions of the same study: warm light/cool shadow and cool light/warm shadow.',
        evaluationCriteria: [c('Consistent temperature logic', 40), c('Sense of light', 30), c('Color mixing', 15), c('Presentation', 15)] },
      { title: 'Harmonization', titleAm: 'የቀለም ስምምነት', slug: 'color-harmonization',
        summary: 'Build palettes that feel unified: analogous, complementary, triadic, split.',
        summaryAm: 'የተዋሃዱ የቀለም ምርጫዎችን መገንባት፦ ተመሳሳይ፣ ተቃራኒ፣ ሦስትዮሽ።',
        learningOutcomes: 'Choose and apply a harmony scheme deliberately and justify the choice for mood.',
        deliverables: '3 thumbnail paintings of one scene in three harmony schemes + short written rationale.',
        evaluationCriteria: [c('Harmony applied correctly', 35), c('Mood & intent', 30), c('Color mixing', 20), c('Written rationale', 15)] },
    ],
  },
  {
    title: 'Composition & Perspective', titleAm: 'ቅንብር እና ፐርስፔክቲቭ', slug: 'composition-perspective',
    description: "Arranging space and guiding the viewer's eye.",
    descriptionAm: 'ቦታን ማደራጀት እና የተመልካቹን ዓይን መምራት።',
    courses: [
      { title: 'Linear Perspective', titleAm: 'መስመራዊ ፐርስፔክቲቭ', slug: 'linear-perspective',
        summary: 'One-, two- and three-point perspective from the horizon line up.',
        summaryAm: 'ባለ አንድ፣ ሁለት እና ሦስት ነጥብ ፐርስፔክቲቭ ከአድማስ መስመር ጀምሮ።',
        learningOutcomes: 'Set up horizon, vanishing points and measuring lines; draw boxes, interiors and streets in correct perspective.',
        deliverables: 'One interior (1-point) and one street scene (2-point) with all construction lines visible.',
        evaluationCriteria: [c('Perspective accuracy', 40), c('Consistent eye level & scale', 25), c('Line quality', 20), c('Presentation', 15)] },
      { title: 'Focal Points', titleAm: 'የትኩረት ነጥቦች', slug: 'focal-points',
        summary: 'Create a clear center of interest with contrast, detail and placement.',
        summaryAm: 'በንፅፅር፣ በዝርዝር እና በአቀማመጥ ግልጽ የትኩረት ማዕከል መፍጠር።',
        learningOutcomes: 'Lead the viewer to one focal point using value contrast, edge, detail and directional lines.',
        deliverables: '6 thumbnails + 1 finished composition with a clearly dominant focal point.',
        evaluationCriteria: [c('Clarity of focal point', 40), c('Use of eye-leading devices', 25), c('Thumbnail exploration', 20), c('Finish', 15)] },
      { title: 'Spatial Tension', titleAm: 'የቦታ ውጥረት', slug: 'spatial-tension',
        summary: 'Balance, asymmetry, negative space and the energy between shapes.',
        summaryAm: 'ሚዛን፣ ያልተመጣጠነ አቀማመጥ፣ ባዶ ቦታ እና በቅርጾች መካከል ያለው ኃይል።',
        learningOutcomes: 'Use asymmetrical balance, tangents (and avoiding them) and negative space to create dynamic compositions.',
        deliverables: 'Abstract shape study + a still-life composition annotated with balance analysis.',
        evaluationCriteria: [c('Dynamic balance', 35), c('Use of negative space', 30), c('Annotation & analysis', 20), c('Presentation', 15)] },
      { title: 'Framing', titleAm: 'የምስል አቀራረጽ', slug: 'framing',
        summary: 'Crop, format and frame-within-a-frame decisions.',
        summaryAm: 'የመቁረጥ፣ የቅርጸት እና በፍሬም ውስጥ ፍሬም ውሳኔዎች።',
        learningOutcomes: 'Choose formats and crops deliberately and use framing devices within the picture.',
        deliverables: 'One subject drawn in 4 crops/formats + final framed piece.',
        evaluationCriteria: [c('Strength of crop choices', 35), c('Frame-within-frame use', 25), c('Variety of exploration', 25), c('Finish', 15)] },
    ],
  },
  {
    title: 'Human Anatomy & Figure Drawing', titleAm: 'የሰውነት አናቶሚ እና የሰው ምስል ስዕል', slug: 'anatomy-figure',
    description: 'Drawing the human figure from structure to gesture.',
    descriptionAm: 'የሰውን ምስል ከመዋቅር እስከ እንቅስቃሴ መሳል።',
    courses: [
      { title: 'Proportions', titleAm: 'የሰውነት ተመጣጣኝነት', slug: 'figure-proportions',
        summary: 'Head-unit canons for adults, children and different body types.',
        summaryAm: 'ለአዋቂዎች፣ ለልጆች እና ለተለያዩ የሰውነት ዓይነቶች በጭንቅላት መለኪያ የተመሠረቱ ሕጎች።',
        learningOutcomes: 'Measure and draw standing, seated and foreshortened figures in correct proportion.',
        deliverables: 'Proportion chart (front/side/back) + 3 figure studies from reference.',
        evaluationCriteria: [c('Proportional accuracy', 40), c('Measuring method shown', 25), c('Line quality', 20), c('Presentation', 15)] },
      { title: 'Skeletal Structure', titleAm: 'የአጽም አወቃቀር', slug: 'skeletal-structure',
        summary: 'The skeleton as the scaffold of every pose.',
        summaryAm: 'አጽም — የእያንዳንዱ አቋም መሠረት።',
        learningOutcomes: 'Draw the major bones from memory and place the skeleton inside any pose.',
        deliverables: 'Skeleton drawn from memory (front & side) + 2 poses with skeleton overlay.',
        evaluationCriteria: [c('Anatomical accuracy', 40), c('Correct placement in pose', 30), c('Clarity', 15), c('Presentation', 15)] },
      { title: 'Muscle Landmarks', titleAm: 'የጡንቻ መለያ ምልክቶች', slug: 'muscle-landmarks',
        summary: 'Key surface muscles and bony landmarks that shape the figure.',
        summaryAm: 'የሰውነትን ቅርጽ የሚወስኑ ዋና ዋና ጡንቻዎች እና የአጥንት ምልክቶች።',
        learningOutcomes: 'Identify and render major muscle groups and landmarks that affect the surface form.',
        deliverables: 'Écorché study of torso and limbs + one shaded figure with landmarks labelled.',
        evaluationCriteria: [c('Landmark accuracy', 35), c('Muscle form & volume', 30), c('Tonal rendering', 20), c('Labelling', 15)] },
      { title: 'Gestural Sketching', titleAm: 'የእንቅስቃሴ ንድፍ (ጄስቸር)', slug: 'gesture',
        summary: 'Capture life and movement in 30-second to 5-minute poses.',
        summaryAm: 'ከ30 ሰከንድ እስከ 5 ደቂቃ በሚቆዩ አቋሞች ሕይወትን እና እንቅስቃሴን መያዝ።',
        learningOutcomes: 'Find the line of action and rhythm of a pose quickly and loosely.',
        deliverables: '40 timed gesture drawings (30s / 1min / 2min / 5min) on newsprint or A3.',
        evaluationCriteria: [c('Line of action & rhythm', 40), c('Energy & economy of line', 30), c('Proportion within gesture', 15), c('Volume of work completed', 15)] },
    ],
  },
];

const DEFAULT_SETTINGS = {
  subscriptionDiscountPercent: 40,
  subscriptionFixedPriceEtb: 0,
  sessionPriceOnlineEtb: 0,
  sessionPriceInPersonEtb: 0,
  cbeAccountName: '',
  cbeAccountNumber: '',
  telebirrName: '',
  telebirrNumber: '+251913516032',
};

export async function seed() {
  for (const [i, cat] of CURRICULUM.entries()) {
    const { courses, ...catData } = cat;
    let category = await Category.findOne({ slug: cat.slug });
    if (!category) category = await Category.create({ ...catData, sortOrder: i });
    for (const [j, course] of courses.entries()) {
      await Course.updateOne({ slug: course.slug }, { $setOnInsert: { ...course, category: category._id, sortOrder: j, priceEtb: 0, isFree: false, isPublished: true } }, { upsert: true });
    }
  }

  if (!(await ContactInfo.exists({}))) {
    await ContactInfo.insertMany([
      { kind: 'email', label: 'Email', value: 'Artistabrham@gmail.com', sortOrder: 0 },
      { kind: 'phone', label: 'Phone', value: '+251913516032', sortOrder: 1 },
      { kind: 'telegram', label: 'Telegram', value: '@ArtistAbrham', sortOrder: 2 },
    ]);
  }
  if (!(await SubmissionLink.exists({}))) {
    await SubmissionLink.insertMany([
      { kind: 'telegram', label: 'Telegram', url: 'https://t.me/ArtistAbrham', isDefault: true },
      { kind: 'email', label: 'Email', url: 'mailto:Artistabrham@gmail.com', isDefault: false },
    ]);
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  }

  // First admin account (from ADMIN_EMAIL / ADMIN_PASSWORD). More admins: set role "admin" in Atlas.
  if (!(await User.exists({ role: /^admin$/i }))) {
    if (!config.admin.password || config.admin.password.length < 8) {
      console.warn('⚠ Set ADMIN_PASSWORD (8+ characters) to create the admin account.');
    } else {
      const existing = await User.findOne({ email: config.admin.email });
      if (existing) await User.updateOne({ _id: existing._id }, { role: 'admin' });
      else await User.create({ name: config.admin.name, email: config.admin.email, role: 'admin', passwordHash: await bcrypt.hash(config.admin.password, 12) });
      console.log(`✔ Admin account ready for ${config.admin.email}`);
    }
  }
}

// `npm run seed` runs this file directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB } = await import('./db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  await seed();
  console.log('✔ Seed complete');
  await mongoose.disconnect();
}
