// Comprehensive curriculum for "Becoming an Artist" — bilingual (English / Amharic).
//
// Structure (each level is a Category in MongoDB except the last):
//   Chapter          -> Category with parent = null      (9 chapters)
//   Unit             -> Category (first level under a chapter)
//   Section          -> Category (second level under a chapter)
//   Studio           -> Category (third level — Young Artists Club only)
//   Course           -> Course document (has `lessons`)
//   Lesson           -> Lesson document (title only, no content yet)
//
// Node kinds are detected by shape:
//   { title, titleAm, slug, children: [...] }   -> a group (Category)
//   { title, titleAm, slug, lessons: [Ellipsis] }  -> a course (Course + empty Lessons)
//
// Every lesson is seeded EMPTY on purpose (kind: 'blocks', blocks: []), so the full
// syllabus exists immediately and lesson content is written later in
// Admin > Curriculum — and exported lesson by lesson to PDF.
//
// Do not rename `slug` values after students have enrolled: slugs are the stable key
// used by seeding, export filenames and the tree cache. Titles are free to edit.
//
// Generated from: Art_Curriculum_Table_of_Contents.pdf, Young_Artists_Club_Kids_Course.pdf
// Counts: 9 chapters / 164 groups / 126 courses / 485 lessons

export const CURRICULUM = [
  {
    "title": "Drawing Fundamentals",
    "titleAm": "የስዕል መሠረታዊ ክህሎቶች",
    "slug": "drawing-fundamentals",
    "children": [
      {
        "title": "Looking & Critique",
        "titleAm": "መመልከት እና ግምገማ",
        "slug": "drawing-fundamentals--looking-and-critique",
        "children": [
          {
            "title": "Learning to See",
            "titleAm": "መመልከትን መማር",
            "slug": "drawing-fundamentals--looking-and-critique--learning-to-see",
            "children": [
              {
                "title": "Looking & Critique: Analyzing a Drawing",
                "titleAm": "መመልከት እና ግምገማ: መተንተን ስዕል",
                "slug": "drawing-fundamentals--looking-and-critique--learning-to-see--looking-and-critique-analyzing-a-drawing",
                "lessons": [
                  {
                    "title": "The Four-Step Critique: Describe, Analyze, Interpret, Judge",
                    "titleAm": "አራት-ደረጃ ግምገማ: መግለጽ, መተንተን, መተርጎም, መፍረድ"
                  },
                  {
                    "title": "Comparing Master Drawings: What Makes a Drawing \"Work\"",
                    "titleAm": "ማነጻጸር የዋና አርቲስቶች ስዕሎች: ምን የሚያደርገው ስዕል \"ሥራ\""
                  },
                  {
                    "title": "Giving and Receiving Constructive Criticism in the Studio",
                    "titleAm": "መስጠት እና መቀበል ገንቢ ትችት ስቱዲዮ"
                  },
                  {
                    "title": "Self-Critique Rituals: The Daily 10-Minute Review",
                    "titleAm": "ራስን መግምገም ልማዶች: የዕለቱ የ10 ደቂቃ ግምገማ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Perception & Observation",
            "titleAm": "ማስተዋል እና ምልከታ",
            "slug": "drawing-fundamentals--looking-and-critique--perception-and-observation",
            "children": [
              {
                "title": "Seeing Like an Artist",
                "titleAm": "እንደ አርቲስት ማየት",
                "slug": "drawing-fundamentals--looking-and-critique--perception-and-observation--seeing-like-an-artist",
                "lessons": [
                  {
                    "title": "Overcoming Symbol Drawing: Drawing What You See, Not What You Know",
                    "titleAm": "Overcoming የምልክት ስዕል: ስዕል ምን You ማየት, ያል ምን You Know"
                  },
                  {
                    "title": "Negative Space Awareness Exercises",
                    "titleAm": "አሉታዊ ቦታ የማስተዋል ልምምዶች"
                  },
                  {
                    "title": "Upside-Down and Mirrored Copying Drills",
                    "titleAm": "ተገላቢጦሽ እና በመስታወት መቅዳት Drills"
                  },
                  {
                    "title": "Measuring with the Pencil: Sighting Angles and Proportions",
                    "titleAm": "መለካት ከ እርሳስ: የማዕዘን መለካት እና ተመጣጣኝነት"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Languages of Drawing",
        "titleAm": "የስዕል ቋንቋዎች",
        "slug": "drawing-fundamentals--languages-of-drawing",
        "children": [
          {
            "title": "The Element of Line",
            "titleAm": "የመስመር አካል",
            "slug": "drawing-fundamentals--languages-of-drawing--the-element-of-line",
            "children": [
              {
                "title": "Points & Lines",
                "titleAm": "Points & መስመሮች",
                "slug": "drawing-fundamentals--languages-of-drawing--the-element-of-line--points-and-lines",
                "lessons": [
                  {
                    "title": "The Point as Beginning: Dot, Stipple, and Texture",
                    "titleAm": "Point እንደ Beginning: ነጥብ, ነጥብ ስዕል, እና ገጽታ"
                  },
                  {
                    "title": "Line Quality: Weight, Speed, Pressure, and Character",
                    "titleAm": "የመስመር ጥራት: ውፍረት, ፍጥነት, ግፊት, እና ባህሪ"
                  },
                  {
                    "title": "Contour, Cross-Contour, and Blind Contour Studies",
                    "titleAm": "ኮንቱር, Cross-ኮንቱር, እና ዓይን ሳይጠቀሙ ኮንቱር ጥናቶች"
                  },
                  {
                    "title": "Line as Emotion: Expressive and Descriptive Line",
                    "titleAm": "መስመር እንደ ስሜት: ስሜት ገላጭ እና ገላጭ መስመር"
                  },
                  {
                    "title": "Hatching, Cross-Hatching, and Scribble Hatching Systems",
                    "titleAm": "ሃቺንግ, መስቀለኛ ሃቺንግ, እና Scribble ሃቺንግ Systems"
                  }
                ]
              }
            ]
          },
          {
            "title": "Structure & Shape",
            "titleAm": "መዋቅር እና ቅርጽ",
            "slug": "drawing-fundamentals--languages-of-drawing--structure-and-shape",
            "children": [
              {
                "title": "Formal Structures",
                "titleAm": "ቅርጽal መዋቅርs",
                "slug": "drawing-fundamentals--languages-of-drawing--structure-and-shape--formal-structures",
                "lessons": [
                  {
                    "title": "Shape, Form, and the Silhouette First Principle",
                    "titleAm": "ቅርጽ, ቅርጽ, እና ጥላ ቅርጽ የመጀመሪያ Principle"
                  },
                  {
                    "title": "Basic Forms: Sphere, Cube, Cylinder, Cone, Pyramid",
                    "titleAm": "Basic ቅርጽs: ሉል, ኩብ, ሲሊንደር, ኮን, ፒራሚድ"
                  },
                  {
                    "title": "Combining Forms: Constructing Complex Objects",
                    "titleAm": "ቅርጾችን ማዋሃድ: ውስብስብ ነገሮችን መገንባት"
                  },
                  {
                    "title": "Symmetry, Asymmetry, Rhythm, and Repetition",
                    "titleAm": "ሲሜትሪ, አሲሜትሪ, ሪዝም, እና ድግግሞሽ"
                  }
                ]
              }
            ]
          },
          {
            "title": "The Illusion of Space & Light",
            "titleAm": "የቦታ እና የብርሃን ምናባዊ ገጽታ",
            "slug": "drawing-fundamentals--languages-of-drawing--the-illusion-of-space-and-light",
            "children": [
              {
                "title": "Volume",
                "titleAm": "ይዘት (ቮልዩም)",
                "slug": "drawing-fundamentals--languages-of-drawing--the-illusion-of-space-and-light--volume",
                "lessons": [
                  {
                    "title": "Turning Form: The Five Elements of Shading",
                    "titleAm": "ቅርጽ መቀየር: አምስቱ የጥላ አካላት"
                  },
                  {
                    "title": "Modeling Basic Forms in Graphite",
                    "titleAm": "ቅርጽ መቅረጽ Basic ቅርጽs ግራፋይት"
                  },
                  {
                    "title": "Cast Shadows, Core Shadows, and Reflected Light",
                    "titleAm": "የሚወድቅ ጥላ, የዋና ጥላ, እና የተንጸባረቀ ብርሃን"
                  },
                  {
                    "title": "Drawing Simple Still Lifes with Full Volume",
                    "titleAm": "ስዕል ቀላል የማይንቀሳቀሱ ነገሮች ከ Full ይዘት (ቮልዩም)"
                  }
                ]
              },
              {
                "title": "Chiaroscuro: Tone & Light/Shadow",
                "titleAm": "ኪያሮስኩሮ: ቶን & ብርሃን/ጥላ",
                "slug": "drawing-fundamentals--languages-of-drawing--the-illusion-of-space-and-light--chiaroscuro-tone-and-light-shadow",
                "lessons": [
                  {
                    "title": "History of Chiaroscuro: Leonardo, Caravaggio, Rembrandt",
                    "titleAm": "የ... ታሪክ ኪያሮስኩሮ: Leonardo, Caravaggio, Rembrandt"
                  },
                  {
                    "title": "Building a Value Scale: 9-Step Full Range of Tone",
                    "titleAm": "የብሩህነት ደረጃ መገንባት: 9-ደረጃ Full Range ቶን"
                  },
                  {
                    "title": "Single-Source Lighting Setups",
                    "titleAm": "አንድ-ምንጭ የብርሃን ዝግጅቶች"
                  },
                  {
                    "title": "Extreme Light and Dark: Tenebrism Studies",
                    "titleAm": "ከፍተኛ ብርሃን እና ጨለማ: ጨለማዊ ብርሃን ጥናቶች"
                  },
                  {
                    "title": "Notan: Two-Value Design as the Foundation of Tone",
                    "titleAm": "ኖታን: የሁለት-ብሩህነት ንድፍ እንደ Foundation ቶን"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Academic & Atelier Drawing (Classical Training Track)",
        "titleAm": "አካዳሚክ እና አትሊየር ስዕል (የጥንታዊ ሥልጠና መንገድ)",
        "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track",
        "children": [
          {
            "title": "The Bargue & Cast Tradition",
            "titleAm": "የባርግ እና የጂፕሰም ትውፊት",
            "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track--the-bargue-and-cast-tradition",
            "children": [
              {
                "title": "Bargue Plate Drawing",
                "titleAm": "የባርግ ሰሌዳ ስዕል",
                "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track--the-bargue-and-cast-tradition--bargue-plate-drawing",
                "lessons": [
                  {
                    "title": "Setting Up: Sight-Size Measuring and the Plumb Line",
                    "titleAm": "Setting Up: የእይታ መጠን መለካት እና ቀጥታ መስመር"
                  },
                  {
                    "title": "The Block-In: Line Drawing with Absolute Accuracy",
                    "titleAm": "መጀመሪያ መግለጽ: መስመር ስዕል ከ ፍጹም ትክክለኛነት"
                  },
                  {
                    "title": "The First Shadow Shapes: Trapping Darks",
                    "titleAm": "የመጀመሪያ የጥላ ቅርጾች: ጨለማዎችን መያዝ"
                  },
                  {
                    "title": "Turning the Form with Gradated Tone",
                    "titleAm": "Turning ቅርጽ ከ ደረጃ በደረጃ ቶን"
                  },
                  {
                    "title": "Completing a Full Bargue Plate from Start to Finish",
                    "titleAm": "ማጠናቀቅ Full Bargue Plate ከ Start Finish"
                  }
                ]
              },
              {
                "title": "Cast Drawing in Charcoal & Graphite",
                "titleAm": "Cast ስዕል ከሰል & ግራፋይት",
                "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track--the-bargue-and-cast-tradition--cast-drawing-in-charcoal-and-graphite",
                "lessons": [
                  {
                    "title": "Choosing and Lighting a Plaster Cast",
                    "titleAm": "መምረጥ እና ማብራት የጂፕሰም ቅርጽ"
                  },
                  {
                    "title": "Long-Pose Discipline: Multi-Week Cast Study",
                    "titleAm": "የረጅም አቀማመጥ ልምምድ: የብዙ ሳምንት የጂፕሰም ጥናት"
                  },
                  {
                    "title": "Rendering Halftones without Losing the Light",
                    "titleAm": "ግማሽ ቶን መሳል without Losing ብርሃን"
                  },
                  {
                    "title": "Finishing: Edges, Accents, and Atmosphere",
                    "titleAm": "ማጠናቀቅ: ጠርዞች, አጽንዖቶች, እና ከባቢ አየር"
                  }
                ]
              }
            ]
          },
          {
            "title": "Constructive Drawing",
            "titleAm": "ገንቢ ስዕል",
            "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track--constructive-drawing",
            "children": [
              {
                "title": "Drawing Through the Form",
                "titleAm": "በቅርጹ ውስጥ ማለፍ",
                "slug": "drawing-fundamentals--academic-and-atelier-drawing-classical-training-track--constructive-drawing--drawing-through-the-form",
                "lessons": [
                  {
                    "title": "Construction Lines and the Envelope Method",
                    "titleAm": "የግንባታ መስመሮች እና የግንባታ ዘዴ"
                  },
                  {
                    "title": "Drawing Objects \"X-Ray Style\": Transparent Construction",
                    "titleAm": "ስዕል Objects \"የኤክስሬይ ዘይቤ\": ግልጽ ግንባታ"
                  },
                  {
                    "title": "Perspective within Still Life: Ellipses and Boxes in Space",
                    "titleAm": "ፐርስፔክቲቭ within ማይንቀሳቀስ ሕይወት: ኤሊፕሶች እና በቦታ ውስጥ ሳጥኖች"
                  },
                  {
                    "title": "Inventing Objects from Imagination Using Construction",
                    "titleAm": "ነገሮችን መፍጠር ከ ምናብ Using Construction"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Sketchbook & Observational Practice",
        "titleAm": "የስኬች ደብተር እና የመመልከት ልምምድ",
        "slug": "drawing-fundamentals--sketchbook-and-observational-practice",
        "children": [
          {
            "title": "Daily Drawing Habits",
            "titleAm": "የዕለት ተዕለት የስዕል ልምዶች",
            "slug": "drawing-fundamentals--sketchbook-and-observational-practice--daily-drawing-habits",
            "children": [
              {
                "title": "The Artist's Sketchbook",
                "titleAm": "Artist's ስኬች ደብተር",
                "slug": "drawing-fundamentals--sketchbook-and-observational-practice--daily-drawing-habits--the-artist-s-sketchbook",
                "lessons": [
                  {
                    "title": "Setting Up a Sketchbook Practice: Materials and Rituals",
                    "titleAm": "Setting Up ስኬች ደብተር ልምምድ: ቁሳቁሶች እና ልማዶች"
                  },
                  {
                    "title": "Sketching on Location: Cafés, Markets, and Streets",
                    "titleAm": "በቦታው ላይ መሳል: ካፌዎች, ገበያዎች, እና መንገዶች"
                  },
                  {
                    "title": "Thumbnailing and Idea Capture",
                    "titleAm": "ትንሽ ንድፍ መስራት እና ሀሳብ መያዝ"
                  },
                  {
                    "title": "The 30-Day Drawing Challenge Design",
                    "titleAm": "የ30 ቀን የስዕል ውድድር ንድፍ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Still Life & Interiors",
            "titleAm": "የማይንቀሳቀስ ነገር ስዕል እና የውስጥ ቦታዎች",
            "slug": "drawing-fundamentals--sketchbook-and-observational-practice--still-life-and-interiors",
            "children": [
              {
                "title": "Still Life Drawing",
                "titleAm": "ማይንቀሳቀስ ሕይወት ስዕል",
                "slug": "drawing-fundamentals--sketchbook-and-observational-practice--still-life-and-interiors--still-life-drawing",
                "lessons": [
                  {
                    "title": "Arranging a Still Life: Composition from the Start",
                    "titleAm": "የማይንቀሳቀስ ነገር ማዘጋጀት: ከመጀመሪያው ቅንብር"
                  },
                  {
                    "title": "Textures: Glass, Metal, Wood, Fabric, and Ceramics",
                    "titleAm": "ገጽታዎች: ብርጭቆ, ብረት, እንጨት, ጨርቅ, እና ሸክላ"
                  },
                  {
                    "title": "Drapery Studies: Folds and Fabric Behavior",
                    "titleAm": "የጨርቅ ጥናቶች: እጥፋቶች እና የጨርቅ ባህሪ"
                  },
                  {
                    "title": "Finished Tonal Still Life Project",
                    "titleAm": "የተጠናቀቀ የቶን ስዕል ፕሮጀክት"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Color Theory",
    "titleAm": "የቀለም ጽንሰ-ሐሳብ",
    "slug": "color-theory",
    "children": [
      {
        "title": "Looking & Critique",
        "titleAm": "መመልከት እና ግምገማ",
        "slug": "color-theory--looking-and-critique",
        "children": [
          {
            "title": "Analyzing Color in Art",
            "titleAm": "በጥበብ ውስጥ ቀለምን መተንተን",
            "slug": "color-theory--looking-and-critique--analyzing-color-in-art",
            "children": [
              {
                "title": "Looking & Critique: Analyzing Color",
                "titleAm": "መመልከት እና ግምገማ: መተንተን ቀለም",
                "slug": "color-theory--looking-and-critique--analyzing-color-in-art--looking-and-critique-analyzing-color",
                "lessons": [
                  {
                    "title": "Reading a Painting's Palette: The Color Inventory Exercise",
                    "titleAm": "የስዕል ቀለም ማንበብ: የቀለም ዝርዝር ልምምድ"
                  },
                  {
                    "title": "How Masters Control Mood with Color: Vermeer to Rothko",
                    "titleAm": "ዋና አርቲስቶች ስሜትን እንዴት እንደሚቆጣጠሩ ከ ቀለም: Vermeer Rothko"
                  },
                  {
                    "title": "Critiquing Color Harmony in Student and Master Work",
                    "titleAm": "Critiquing የቀለም ስምምነት የተማሪ እና የዋና አርቲስት ስራ"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Foundations of Color",
        "titleAm": "የቀለም መሠረቶች",
        "slug": "color-theory--foundations-of-color",
        "children": [
          {
            "title": "Color Systems & Wheels",
            "titleAm": "የቀለም ሥርዓቶች እና ክቦች",
            "slug": "color-theory--foundations-of-color--color-systems-and-wheels",
            "children": [
              {
                "title": "The Color Wheel",
                "titleAm": "የቀለም ክብ",
                "slug": "color-theory--foundations-of-color--color-systems-and-wheels--the-color-wheel",
                "lessons": [
                  {
                    "title": "The 12-Hue Wheel: Mixing a Personal Color Wheel",
                    "titleAm": "የ12-ቀለም ክብ: መቀላቀል የግል የቀለም ክብ"
                  },
                  {
                    "title": "Primary, Secondary, Tertiary: RYB, RGB, and CMYK Systems",
                    "titleAm": "መሠረታዊ, ሁለተኛ, ሦስተኛ: RYB, RGB, እና CMYK Systems"
                  },
                  {
                    "title": "Hue, Saturation, and Brightness: The Three Dimensions of Color",
                    "titleAm": "የቀለም ዓይነት, ሙሌት, እና ብሩህነት: የቀለም ሦስት ገጽታዎች"
                  },
                  {
                    "title": "Munsell and Other Scientific Color Spaces",
                    "titleAm": "መንሴል እና Other ሳይንሳዊ የቀለም ክፍተቶች"
                  }
                ]
              },
              {
                "title": "Value Relationships",
                "titleAm": "የብሩህነት ግንኙነቶች",
                "slug": "color-theory--foundations-of-color--color-systems-and-wheels--value-relationships",
                "lessons": [
                  {
                    "title": "Value Before Color: Grayscale Studies of Paintings",
                    "titleAm": "ከቀለም በፊት ብሩህነት: ግራጫ ደረጃ ጥናቶች ስዕል በቀለምs"
                  },
                  {
                    "title": "Squinting and Value Grouping",
                    "titleAm": "ዓይን ማጥበብ እና የብሩህነት ስብስብ"
                  },
                  {
                    "title": "The Value Structure of Successful Compositions",
                    "titleAm": "የብሩህነት መዋቅር ስኬታማ ቅንብሮች"
                  },
                  {
                    "title": "Painting the Same Scene in Three Value Schemes",
                    "titleAm": "ተመሳሳይ ቦታ መሳል ሦስት የብሩህነት እቅዶች"
                  }
                ]
              }
            ]
          },
          {
            "title": "Color Behavior",
            "titleAm": "የቀለም ባህሪ",
            "slug": "color-theory--foundations-of-color--color-behavior",
            "children": [
              {
                "title": "Temperature",
                "titleAm": "የቀለም ሙቀት",
                "slug": "color-theory--foundations-of-color--color-behavior--temperature",
                "lessons": [
                  {
                    "title": "Warm vs. Cool: The Perceptual Basics",
                    "titleAm": "ሞቅ እና ቀዝቃዛ: የማስተዋል መሠረታዊ ነገሮች"
                  },
                  {
                    "title": "Temperature Shifts in Light and Shadow",
                    "titleAm": "የሙቀት ለውጦች ብርሃን እና ጥላ"
                  },
                  {
                    "title": "Relative Temperature: Making One Color Feel Warm or Cool",
                    "titleAm": "አንጻራዊ ሙቀት: ማድረግ አንድ ቀለም Feel Warm ወይም Cool"
                  },
                  {
                    "title": "Temperature in Landscape: Depth and Atmosphere",
                    "titleAm": "የቀለም ሙቀት የመሬት ገጽታ: ጥልቀት እና ከባቢ አየር"
                  }
                ]
              },
              {
                "title": "Harmonization",
                "titleAm": "ስምምነት",
                "slug": "color-theory--foundations-of-color--color-behavior--harmonization",
                "lessons": [
                  {
                    "title": "Monochromatic, Analogous, and Complementary Schemes",
                    "titleAm": "አንድ-ቀለም, ተመሳሳይ-ቀለም, እና ተጨማሪ-ቀለም Schemes"
                  },
                  {
                    "title": "Split-Complementary, Triadic, and Tetradic Harmonies",
                    "titleAm": "የተከፈለ-ተጨማሪ, ሦስት-ቀለም, እና አራት-ቀለም ስምምነቶች"
                  },
                  {
                    "title": "Dominant Color and the 80/20 Rule",
                    "titleAm": "ዋና ቀለም እና የ80/20 ደንብ"
                  },
                  {
                    "title": "Mixing a Unified Palette for a Finished Painting",
                    "titleAm": "መቀላቀል አንድ የቀለም ስብስብ ለ የተጠናቀቀ ስዕል"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Advanced Color Studies (Bauhaus & Modern Lineage)",
        "titleAm": "የላቀ የቀለም ጥናት (ባውሃውስ እና ዘመናዊው ዝርያ)",
        "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage",
        "children": [
          {
            "title": "The Interaction of Color",
            "titleAm": "የቀለማት መስተጋብር",
            "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--the-interaction-of-color",
            "children": [
              {
                "title": "Albers Studies: Color in Action",
                "titleAm": "የአልበርስ ጥናቶች: ቀለም በተግባር",
                "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--the-interaction-of-color--albers-studies-color-in-action",
                "lessons": [
                  {
                    "title": "Simultaneous Contrast: Making One Color Look Like Two",
                    "titleAm": "በአንድ ጊዜ ንጽጽር: ማድረግ አንድ ቀለም መመልከት Like ሁለት"
                  },
                  {
                    "title": "Color Vibration and Afterimages",
                    "titleAm": "የቀለም ንዝረት እና ከድምጽ በኋላ ምስሎች"
                  },
                  {
                    "title": "Transparence Illusion: Imaginary Color Mixtures",
                    "titleAm": "የግልጽነት ምናብ: ምናባዊ የቀለም ውህዶች"
                  },
                  {
                    "title": "The \"Middle Mixture\" Exercise",
                    "titleAm": "\"መካከለኛ ውህድ\" ልምምድ"
                  },
                  {
                    "title": "Bezold Effect and Color Reversal",
                    "titleAm": "የቤዞልድ ተጽዕኖ እና የቀለም መገላበጥ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Pigment, Mixing & Practice",
            "titleAm": "ቀለም፣ ቅብል እና ልምምድ",
            "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--pigment-mixing-and-practice",
            "children": [
              {
                "title": "Practical Color Mixing for Painters",
                "titleAm": "Practical ቀለም መቀላቀል ለ Painters",
                "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--pigment-mixing-and-practice--practical-color-mixing-for-painters",
                "lessons": [
                  {
                    "title": "Pigment Personalities: Staining, Opaque, Granulating, Fugitive",
                    "titleAm": "የቀለም ባህሪያት: የሚቀባ, የማይታይ, የሚለያይ, የሚጠፋ"
                  },
                  {
                    "title": "Mixing Clean Darkens and Neutrals without Mud",
                    "titleAm": "መቀላቀል ንጹህ ጨለማዎች እና ገለልተኛ ቀለሞች without ጭቃ"
                  },
                  {
                    "title": "Limited Palettes: Zorn, Earth-Tone, and Split-Primary",
                    "titleAm": "የተገደቡ ቀለም ስብስቦች: ዞርን, የመሬት ቀለም, እና የተከፈለ-መሠረታዊ"
                  },
                  {
                    "title": "Matching Any Color: The Systematic Approach",
                    "titleAm": "ማንኛውንም ቀለም ማዛመድ: ስርዓታዊ አቀራረብ"
                  },
                  {
                    "title": "Color Charts: Building Reference Charts for Your Palette",
                    "titleAm": "የቀለም ሠንጠረዦች: Building የማጣቀሻ ሠንጠረዦች ለ የእርስዎ ቀለም ሰሌዳ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Color Psychology & Symbolism",
            "titleAm": "የቀለም ሥነ-ልቦና እና ምሳሌነት",
            "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--color-psychology-and-symbolism",
            "children": [
              {
                "title": "Color Meaning Across Cultures",
                "titleAm": "የቀለም ትርጉም በባህሎች መካከል",
                "slug": "color-theory--advanced-color-studies-bauhaus-and-modern-lineage--color-psychology-and-symbolism--color-meaning-across-cultures",
                "lessons": [
                  {
                    "title": "Color and Emotion: Warm Palettes vs. Cool Palettes",
                    "titleAm": "ቀለም እና ስሜት: ሞቅ ቀለሞች እና. ቀዝቃዛ ቀለሞች"
                  },
                  {
                    "title": "Color Symbolism in Ethiopian Religious Art",
                    "titleAm": "የቀለም ምሳሌነት የኢትዮጵያ ሃይማኖታዊ ጥበብ"
                  },
                  {
                    "title": "Liturgical Color and Iconographic Conventions",
                    "titleAm": "የሥርዓተ አምልኮ ቀለም እና የቅዱስ ሥዕል ልማዶች"
                  },
                  {
                    "title": "Color in Design and Contemporary Culture",
                    "titleAm": "ቀለም ንድፍ እና ዘመናዊ ባህል"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Composition & Perspective",
    "titleAm": "ቅንብር እና ፐርስፔክቲቭ",
    "slug": "composition-and-perspective",
    "children": [
      {
        "title": "Perspective Systems",
        "titleAm": "የፐርስፔክቲቭ ሥርዓቶች",
        "slug": "composition-and-perspective--perspective-systems",
        "children": [
          {
            "title": "Linear Perspective",
            "titleAm": "መስመራዊ ፐርስፔክቲቭ",
            "slug": "composition-and-perspective--perspective-systems--linear-perspective",
            "children": [
              {
                "title": "Linear Perspective I: One-Point",
                "titleAm": "መስመራዊ ፐርስፔክቲቭ I: አንድ-ነጥብ",
                "slug": "composition-and-perspective--perspective-systems--linear-perspective--linear-perspective-i-one-point",
                "lessons": [
                  {
                    "title": "Horizon Line, Eye Level, and Vanishing Points",
                    "titleAm": "የ horizon መስመር, የዓይን ደረጃ, እና የመጥፋት ነጥቦች"
                  },
                  {
                    "title": "One-Point Interior: The Room in Perspective",
                    "titleAm": "አንድ-ነጥብ የውስጥ ቦታ: ክፍሉ በፐርስፔክቲቭ"
                  },
                  {
                    "title": "Measuring Depth and Placing Figures in Space",
                    "titleAm": "ጥልቀት መለካት እና ምስሎችን በቦታ ማስቀመጥ"
                  }
                ]
              },
              {
                "title": "Linear Perspective II: Two- and Three-Point",
                "titleAm": "መስመራዊ ፐርስፔክቲቭ II: ሁለት እና ሦስት-ነጥብ",
                "slug": "composition-and-perspective--perspective-systems--linear-perspective--linear-perspective-ii-two-and-three-point",
                "lessons": [
                  {
                    "title": "Two-Point Exteriors: Buildings and Streets",
                    "titleAm": "ሁለት-ነጥብ የውጭ ቦታዎች: ሕንጻዎች እና መንገዶች"
                  },
                  {
                    "title": "Three-Point: Bird's-Eye and Worm's-Eye Views",
                    "titleAm": "ሦስት-ነጥብ: ከወፍ እይታ እና ከመሬት እይታ Views"
                  },
                  {
                    "title": "Inclined Planes, Stairs, and Roofs",
                    "titleAm": "ዘንበል ያሉ ጠፍጣፋዎች, ደረጃዎች, እና ጣራዎች"
                  }
                ]
              },
              {
                "title": "Advanced Perspective Systems",
                "titleAm": "Advanced የፐርስፔክቲቭ ሥርዓቶች",
                "slug": "composition-and-perspective--perspective-systems--linear-perspective--advanced-perspective-systems",
                "lessons": [
                  {
                    "title": "Ellipses, Cylinders, and Wheels in Perspective",
                    "titleAm": "ኤሊፕሶች, ሲሊንደርs, እና ጎማዎች ፐርስፔክቲቭ"
                  },
                  {
                    "title": "Curvilinear and Five-Point Perspective",
                    "titleAm": "ጠማማ-መስመር እና አምስት-ነጥብ ፐርስፔክቲቭ"
                  },
                  {
                    "title": "Reflections and Shadows in Perspective",
                    "titleAm": "ነጸብራቆች እና ጥላዎች ፐርስፔክቲቭ"
                  },
                  {
                    "title": "Aerial (Atmospheric) Perspective: Overlap, Value, and Detail Fading",
                    "titleAm": "የአየር (ከባቢ አየር) ፐርስፔክቲቭ: መደራረብ, ብሩህነት, እና ዝርዝር መጥፋት"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Compositional Design",
        "titleAm": "የቅንብር ንድፍ",
        "slug": "composition-and-perspective--compositional-design",
        "children": [
          {
            "title": "Structural Devices",
            "titleAm": "መዋቅራዊ ዘዴዎች",
            "slug": "composition-and-perspective--compositional-design--structural-devices",
            "children": [
              {
                "title": "Focal Points",
                "titleAm": "የትኩረት ነጥቦች",
                "slug": "composition-and-perspective--compositional-design--structural-devices--focal-points",
                "lessons": [
                  {
                    "title": "The Center of Interest: Where the Eye Lands First",
                    "titleAm": "የፍላጎት ማዕከል: ዓይን በመጀመሪያ የሚያርፍበት"
                  },
                  {
                    "title": "Contrast, Isolation, and Directional Lines as Emphasis Tools",
                    "titleAm": "ንጽጽር, መነጠል, እና አቅጣጫ መስመሮች እንደ የአጽንዖት መሣሪያዎች"
                  },
                  {
                    "title": "Multiple Focal Points and Eye-Path Planning",
                    "titleAm": "በርካታ የትኩረት ነጥቦች እና የዓይን መንገድ እቅድ"
                  }
                ]
              },
              {
                "title": "Spatial Tension",
                "titleAm": "የቦታ ውጥረት",
                "slug": "composition-and-perspective--compositional-design--structural-devices--spatial-tension",
                "lessons": [
                  {
                    "title": "Balance: Symmetrical, Asymmetrical, and Radial",
                    "titleAm": "ሚዛን: ሲሜትራዊ, አሲሜትራዊ, እና ራዲያል"
                  },
                  {
                    "title": "Positive and Negative Space Interplay",
                    "titleAm": "አዎንታዊ እና አሉታዊ ቦታ መስተጋብር"
                  },
                  {
                    "title": "Scale Relationships and Figure-Ground Reversal",
                    "titleAm": "የመጠን ግንኙነቶች እና የምስል-ዳራ መገላበጥ"
                  },
                  {
                    "title": "Visual Weight and Rhythm Across the Picture Plane",
                    "titleAm": "የእይታ ክብደት እና ሪዝም Across የስዕል ጠፍጣፋ"
                  }
                ]
              },
              {
                "title": "Framing",
                "titleAm": "አቀራረጽ",
                "slug": "composition-and-perspective--compositional-design--structural-devices--framing",
                "lessons": [
                  {
                    "title": "The Viewfinder: Cropping and Selecting a Composition",
                    "titleAm": "መመልከቻ: መቁረጥ እና ቅንብር መምረጥ"
                  },
                  {
                    "title": "Format Choices: Square, Panoramic, Portrait, Landscape",
                    "titleAm": "የቅርጸት ምርጫዎች: ካሬ, ፓኖራማዊ, ፖርትሬት, የመሬት ገጽታ"
                  },
                  {
                    "title": "Foreground Framing Devices and Internal Frames",
                    "titleAm": "የፊት አቀራረጽ ዘዴዎች እና የውስጥ ክፈፎች"
                  },
                  {
                    "title": "Edges and Corners: Anchoring the Picture Plane",
                    "titleAm": "ጠርዞች እና ማዕዘኖች: ማስቀመጥ የስዕል ጠፍጣፋ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Compositional Schemata",
            "titleAm": "የቅንብር አብነቶች",
            "slug": "composition-and-perspective--compositional-design--compositional-schemata",
            "children": [
              {
                "title": "Master Compositional Structures",
                "titleAm": "ዋና የቅንብር መዋቅሮች",
                "slug": "composition-and-perspective--compositional-design--compositional-schemata--master-compositional-structures",
                "lessons": [
                  {
                    "title": "The Golden Ratio, Rule of Thirds, and Dynamic Symmetry",
                    "titleAm": "ወርቃማ መጠን, የሦስት ሕግ, እና ተለዋዋጭ ሲሜትሪ"
                  },
                  {
                    "title": "Classical Schemata: Pyramidal, S-Curve, Cruciform, Arched",
                    "titleAm": "ጥንታዊ አብነቶች: ፒራሚዳዊ, ኤስ-መስመር, መስቀላዊ, ቅስት ያለው"
                  },
                  {
                    "title": "Analyzing 100 Master Paintings: The Composition Atlas Exercise",
                    "titleAm": "100 የዋና ስዕሎችን መተንተን: የቅንብር አትላስ ልምምድ"
                  },
                  {
                    "title": "Thumbnail Design: 30 Variations of One Subject",
                    "titleAm": "የትንሽ ንድፍ አዲስ: 30 የአንድ ርዕስ ልዩነቶች"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Narrative & Conceptual Composition",
        "titleAm": "ትረካዊ እና ጽንሰ-ሐሳባዊ ቅንብር",
        "slug": "composition-and-perspective--narrative-and-conceptual-composition",
        "children": [
          {
            "title": "Storytelling in Images",
            "titleAm": "በምስል ትረካ",
            "slug": "composition-and-perspective--narrative-and-conceptual-composition--storytelling-in-images",
            "children": [
              {
                "title": "Narrative Composition",
                "titleAm": "ትረካ ቅንብር",
                "slug": "composition-and-perspective--narrative-and-conceptual-composition--storytelling-in-images--narrative-composition",
                "lessons": [
                  {
                    "title": "Single-Image Storytelling: Moment, Action, and Staging",
                    "titleAm": "በአንድ ምስል ትረካ: ቅጽበት, ድርጊት, እና ማዘጋጀት"
                  },
                  {
                    "title": "Sequential Composition: Storyboards and Comic Panels",
                    "titleAm": "ተከታታይ ቅንብር: Storyboards እና የኮሚክ ክፍሎች"
                  },
                  {
                    "title": "Symbolism and Visual Metaphor in Composition",
                    "titleAm": "ምሳሌነት እና የእይታ ዘይቤ ቅንብር"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Human Anatomy & Figure",
    "titleAm": "የሰው ሰውነት አናቶሚ እና ምስል",
    "slug": "human-anatomy-and-figure",
    "children": [
      {
        "title": "Proportional Systems",
        "titleAm": "የተመጣጣኝነት ሥርዓቶች",
        "slug": "human-anatomy-and-figure--proportional-systems",
        "children": [
          {
            "title": "Body Measurement Canons",
            "titleAm": "የሰውነት መለኪያ ቀኖናዎች",
            "slug": "human-anatomy-and-figure--proportional-systems--body-measurement-canons",
            "children": [
              {
                "title": "Proportions",
                "titleAm": "ተመጣጣኝነት",
                "slug": "human-anatomy-and-figure--proportional-systems--body-measurement-canons--proportions",
                "lessons": [
                  {
                    "title": "The 7.5- and 8-Head Canons: Classical Figure Proportions",
                    "titleAm": "የ7.5 እና 8-ጭንቅላት ቀኖናዎች: ጥንታዊ የሰው ምስል ተመጣጣኝነት"
                  },
                  {
                    "title": "Age and Body-Type Variation: Child, Adult, Elder Proportions",
                    "titleAm": "የዕድሜ እና የሰውነት ዓይነት ልዩነት: ልጅ, አዋቂ, ሽማግሌ ተመጣጣኝነት"
                  },
                  {
                    "title": "Comparative Measuring and Anatomical Landmarks",
                    "titleAm": "ንጽጽራዊ መለካት እና የአናቶሚ መለያ ምልክቶች"
                  },
                  {
                    "title": "Ethiopian Canonical Proportions vs. Western Canons (Cross-Cultural Study)",
                    "titleAm": "የኢትዮጵያ ቀኖናዊ ተመጣጣኝነት እና. የምዕራብ ቀኖናዎች (ንጽጽራዊ ባህላዊ ጥናት)"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Structural Anatomy",
        "titleAm": "መዋቅራዊ አናቶሚ",
        "slug": "human-anatomy-and-figure--structural-anatomy",
        "children": [
          {
            "title": "The Skeleton",
            "titleAm": "የአጽም አወቃቀር",
            "slug": "human-anatomy-and-figure--structural-anatomy--the-skeleton",
            "children": [
              {
                "title": "Skeletal Structure",
                "titleAm": "የአጽም አወቃቀር",
                "slug": "human-anatomy-and-figure--structural-anatomy--the-skeleton--skeletal-structure",
                "lessons": [
                  {
                    "title": "The Skull: Planes, Landmarks, and the Cranial Mass",
                    "titleAm": "የራስ ቅል: ጠፍጣፋዎች, Landmarks, እና የራስ ቅል ክብደት"
                  },
                  {
                    "title": "Ribcage, Pelvis, and Spine: The Three Masses of the Torso",
                    "titleAm": "የደረት አጥንት, የዳሌ አጥንት, እና የጀርባ አጥንት: ሦስቱ የሰውነት ክፍሎች"
                  },
                  {
                    "title": "Arm and Leg Bones: Long-Bone Rhythm and the Asymmetry of Joints",
                    "titleAm": "የእጅ እና የእግር አጥንቶች: የረጅም አጥንት ሪዝም እና የመገጣጠሚያ አሲሜትሪ"
                  },
                  {
                    "title": "Hands and Feet: Bone Structure Beneath the Surface",
                    "titleAm": "እጆች እና እግሮች: ከቆዳ በታች ያለው የአጽም አወቃቀር"
                  },
                  {
                    "title": "The Skeleton in Motion: Drawing from Bone Landmarks",
                    "titleAm": "በእንቅስቃሴ ላይ ያለ አጽም: ስዕል ከ Bone Landmarks"
                  }
                ]
              }
            ]
          },
          {
            "title": "Muscles & Surface Form",
            "titleAm": "ጡንቻዎች እና የውጭ ቅርጽ",
            "slug": "human-anatomy-and-figure--structural-anatomy--muscles-and-surface-form",
            "children": [
              {
                "title": "Muscle Landmarks",
                "titleAm": "የጡንቻ መለያ ምልክቶች",
                "slug": "human-anatomy-and-figure--structural-anatomy--muscles-and-surface-form--muscle-landmarks",
                "lessons": [
                  {
                    "title": "Major Muscle Groups of the Torso: Pectorals, Abs, Lats, Obliques",
                    "titleAm": "ዋና የጡንቻ ቡድኖች Torso: የደረት ጡንቻዎች, የሆድ ጡንቻዎች, የጀርባ ጡንቻዎች, የጎን ጡንቻዎች"
                  },
                  {
                    "title": "Muscles of the Arm and Shoulder: Deltoid, Biceps, Triceps, Forearm Masses",
                    "titleAm": "Muscles Arm እና Shoulder: የትከሻ ጡንቻ, የእጅ ጡንቻ, የኋላ እጅ ጡንቻ, የክርን ጡንቻዎች"
                  },
                  {
                    "title": "Muscles of the Leg: Quadriceps, Hamstrings, Adductors, Calves",
                    "titleAm": "Muscles Leg: የፊት እግር ጡንቻ, የኋላ እግር ጡንቻ, የውስጥ እግር ጡንቻ, የተጓዳ ጡንቻ"
                  },
                  {
                    "title": "The Neck and Head: Sternocleidomastoid, Trapezius, Facial Muscles",
                    "titleAm": "አንገት እና ጭንቅላት: Sternocleidomastoid, Trapezius, የፊት ጡንቻዎች"
                  },
                  {
                    "title": "Surface Anatomy: Landmarks Visible on the Living Model",
                    "titleAm": "የውጭ አናቶሚ: Landmarks Visible ሕያው ሞዴል"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Figure Drawing Practice",
        "titleAm": "የሰው ምስል ስዕል ልምምድ",
        "slug": "human-anatomy-and-figure--figure-drawing-practice",
        "children": [
          {
            "title": "Gesture & Movement",
            "titleAm": "እንቅስቃሴ እና ምልክት",
            "slug": "human-anatomy-and-figure--figure-drawing-practice--gesture-and-movement",
            "children": [
              {
                "title": "Gestural Sketching",
                "titleAm": "Gestural ስኬች ማድረግ",
                "slug": "human-anatomy-and-figure--figure-drawing-practice--gesture-and-movement--gestural-sketching",
                "lessons": [
                  {
                    "title": "Gesture Basics: 30-Second, 1-Minute, and 5-Minute Poses",
                    "titleAm": "የእንቅስቃሴ መሠረታዊ ነገሮች: 30 ሰከንድ, 1 ደቂቃ, እና የ5 ደቂቃ አቀማመጦች"
                  },
                  {
                    "title": "Line of Action and Rhythmic Flow Through the Figure",
                    "titleAm": "የድርጊት መስመር እና ሪዝማዊ ፍሰት Through ምስል"
                  },
                  {
                    "title": "Gesture with Volume: Combining Flow and Form",
                    "titleAm": "በይዘት እንቅስቃሴ: ፍሰትን እና ቅርጽን ማዋሃድ"
                  },
                  {
                    "title": "Movement and Balance: Contrapposto, Weight, and Tilt",
                    "titleAm": "እንቅስቃሴ እና ሚዛን: ኮንትራፖስቶ, ውፍረት, እና Tilt"
                  }
                ]
              }
            ]
          },
          {
            "title": "Long-Pose Figure Work",
            "titleAm": "የረጅም አቀማመጥ የሰው ምስል ስራ",
            "slug": "human-anatomy-and-figure--figure-drawing-practice--long-pose-figure-work",
            "children": [
              {
                "title": "The Academic Figure",
                "titleAm": "አካዳሚክ ምስል",
                "slug": "human-anatomy-and-figure--figure-drawing-practice--long-pose-figure-work--the-academic-figure",
                "lessons": [
                  {
                    "title": "Block-In for the Figure: Gesture to Envelope to Contour",
                    "titleAm": "ለምስሉ የመጀመሪያ ግለጽ: እንቅስቃሴ ከግንባታ ወደ ኮንቱር"
                  },
                  {
                    "title": "Shadow Mapping on the Figure",
                    "titleAm": "የጥላ ካርታ ምስል"
                  },
                  {
                    "title": "Modeling the Form: Rendering the Long Pose (Multi-Session)",
                    "titleAm": "ቅርጽ መቅረጽ ቅርጽ: Rendering Long Pose (በበርካታ ክፍለ ጊዜዎች)"
                  },
                  {
                    "title": "The Figure in Environment: Adding Context and Cast Shadows",
                    "titleAm": "ምስል በአካባቢ: Adding አውድ እና የሚወድቅ ጥላ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Constructive Figure Methods",
            "titleAm": "ገንቢ የሰው ምስል ዘዴዎች",
            "slug": "human-anatomy-and-figure--figure-drawing-practice--constructive-figure-methods",
            "children": [
              {
                "title": "Loomis & Construction Systems",
                "titleAm": "ሉሚስ & የግንባታ ሥርዓቶች",
                "slug": "human-anatomy-and-figure--figure-drawing-practice--constructive-figure-methods--loomis-and-construction-systems",
                "lessons": [
                  {
                    "title": "The Loomis Manikin: Building Figures from Simple Forms",
                    "titleAm": "ሉሚስ ማኒኪን: Building ምስልs ከ ቀላል ቅርጾች"
                  },
                  {
                    "title": "Drawing Figures from Imagination in Any Pose",
                    "titleAm": "ስዕል ምስልs ከ ምናብ ማንኛውም አቀማመጥ"
                  },
                  {
                    "title": "Foreshortening: Overlap, Tapering, and Perspective on the Body",
                    "titleAm": "በአቅጣጫ ማሳጠር: መደራረብ, ማጥበብ, እና ፐርስፔክቲቭ ሰውነት"
                  },
                  {
                    "title": "Clothing the Figure: Drapery Folds — Pipe, Zigzag, Spiral, Drop, Diaper",
                    "titleAm": "ምስሉን ማልበስ: Drapery እጥፋቶች — ቱቦ, ዚግዛግ, ሽቦ, የሚወርድ, የአልጋ እጥፋት"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Portrait & Head Drawing",
        "titleAm": "የፖርትሬት እና የጭንቅላት ስዕል",
        "slug": "human-anatomy-and-figure--portrait-and-head-drawing",
        "children": [
          {
            "title": "The Head Constructed",
            "titleAm": "የተገነባ ጭንቅላት",
            "slug": "human-anatomy-and-figure--portrait-and-head-drawing--the-head-constructed",
            "children": [
              {
                "title": "Portrait Drawing I: Structure",
                "titleAm": "የፖርትሬት ስዕል I: መዋቅር",
                "slug": "human-anatomy-and-figure--portrait-and-head-drawing--the-head-constructed--portrait-drawing-i-structure",
                "lessons": [
                  {
                    "title": "The Loomis Head: Ball and Plane Construction",
                    "titleAm": "የሉሚስ ጭንቅላት: የኳስ እና ጠፍጣፋ ግንባታ"
                  },
                  {
                    "title": "The Head in All Angles: Tilts, Turns, and Up/Down Views",
                    "titleAm": "ጭንቅላት በሁሉም ማዕዘኖች: ዘንበሎች, ማዞሪያዎች, እና የላይ/የታች እይታዎች"
                  },
                  {
                    "title": "Feature by Feature: Eyes, Nose, Lips, Ears as Forms",
                    "titleAm": "አንድ በአንድ: ዓይኖች, አፍንጫ, ከንፈሮች, ጆሮዎች እንደ ቅርጽs"
                  },
                  {
                    "title": "Hair as Mass: Shape and Value of Hair",
                    "titleAm": "ፀጉር እንደ ክብደት: ቅርጽ እና ብሩህነት ፀጉር"
                  }
                ]
              },
              {
                "title": "Portrait Drawing II: Likeness & Light",
                "titleAm": "የፖርትሬት ስዕል II: መመሳሰል & ብርሃን",
                "slug": "human-anatomy-and-figure--portrait-and-head-drawing--the-head-constructed--portrait-drawing-ii-likeness-and-light",
                "lessons": [
                  {
                    "title": "Capturing Likeness: Proportion Tweaks and Character Traits",
                    "titleAm": "Capturing መመሳሰል: የተመጣጣኝነት ማስተካከያ እና የባህሪ ምልክቶች"
                  },
                  {
                    "title": "Lighting the Portrait: Form, Cast, and Core Shadows on the Face",
                    "titleAm": "ፖርትሬቱን ማብራት: ቅርጽ, Cast, እና የዋና ጥላ ፊት"
                  },
                  {
                    "title": "Long-Pose Portrait Study in Graphite and Charcoal",
                    "titleAm": "የረጅም አቀማመጥ ፖርትሬት ጥናት ግራፋይት እና ከሰል"
                  },
                  {
                    "title": "Portrait Expression and Emotion",
                    "titleAm": "የፖርትሬት ስሜት እና ስሜት"
                  }
                ]
              }
            ]
          },
          {
            "title": "Portrait Painting",
            "titleAm": "የፖርትሬት ስዕል",
            "slug": "human-anatomy-and-figure--portrait-and-head-drawing--portrait-painting",
            "children": [
              {
                "title": "Portrait Painting Fundamentals",
                "titleAm": "የፖርትሬት ስዕል መሠረቶች",
                "slug": "human-anatomy-and-figure--portrait-and-head-drawing--portrait-painting--portrait-painting-fundamentals",
                "lessons": [
                  {
                    "title": "Flesh Tone Mixing Across Skin Tones",
                    "titleAm": "የቆዳ ቀለም መቀላቀል Across የቆዳ ቀለሞች"
                  },
                  {
                    "title": "Blocking In the Portrait in Oil or Acrylic",
                    "titleAm": "መጀመሪያ መግለጽ ፖርትሬት Oil ወይም Acrylic"
                  },
                  {
                    "title": "Features in Paint: Wet-into-Wet Rendering",
                    "titleAm": "Features ቀለም: እርጥብ በእርጥብ Rendering"
                  },
                  {
                    "title": "The Finished Portrait: Edges, Background, and Presence",
                    "titleAm": "የተጠናቀቀ ፖርትሬት: ጠርዞች, ዳራ, እና መገኘት"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Ethiopian Orthodox",
    "titleAm": "የኢትዮጵያ ኦርቶዶክስ ትውፊት",
    "slug": "ethiopian-orthodox",
    "children": [
      {
        "title": "Theological and Historical Foundations",
        "titleAm": "የሥነ-መለኮት እና የታሪክ መሠረቶች",
        "slug": "ethiopian-orthodox--theological-and-historical-foundations",
        "children": [
          {
            "title": "What Is a Sacred Image",
            "titleAm": "ቅዱስ ሥዕል ምንድን ነው",
            "slug": "ethiopian-orthodox--theological-and-historical-foundations--what-is-a-sacred-image",
            "children": [
              {
                "title": "Introduction to Ethiopian Orthodox Iconography",
                "titleAm": "Introduction የኢትዮጵያ Orthodox ሥዕል ጥበብ",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--what-is-a-sacred-image--introduction-to-ethiopian-orthodox-iconography",
                "lessons": [
                  {
                    "title": "The Role of the Icon in Ethiopian Orthodox Tewahedo Worship",
                    "titleAm": "የቅዱስ ሥዕል ሚና የኢትዮጵያ Orthodox Tewahedo አምልኮ"
                  },
                  {
                    "title": "A Philosophy of Sacred Art: The Eight Pillars",
                    "titleAm": "የቅዱስ ሥዕል ፍልስፍና: ስምንቱ ምሰሶዎች"
                  },
                  {
                    "title": "Defining Qəddusat Sə'əlat: Etymology, Nature, and Function",
                    "titleAm": "መተርጎም Qəddusat Sə'əlat: የቃላት ሥር, ተፈጥሮ, እና ተግባር"
                  },
                  {
                    "title": "The First Icon: Genesis, the Imago Dei, and God the First Artist",
                    "titleAm": "የመጀመሪያው ቅዱስ ሥዕል: ዘፍጥረት, የእግዚአብሔር ምስል, እና እግዚአብሔር የመጀመሪያው አርቲስት"
                  },
                  {
                    "title": "The Icon Painter as Devotional: Workshop Lineage and Spiritual Discipline",
                    "titleAm": "ቅዱስ ሥዕል ሣሪ እንደ አምላካዊ: የወርክሾፕ ዝርያ እና መንፈሳዊ ሥርዓት"
                  },
                  {
                    "title": "Church Murals, Manuscript Illumination, and Panel Icons: Three Streams of Tradition",
                    "titleAm": "የቤተክርስቲያን ግድግዳ ሥዕሎች, የፅሁፍ ማስዋብ, እና የሰሌዳ ቅዱሳት ሥዕላት: ሦስቱ የትውፊት ወራጆች"
                  }
                ]
              }
            ]
          },
          {
            "title": "Biblical and Patristic Foundations",
            "titleAm": "የመጽሐፍ ቅዱስ እና የአባቶች መሠረቶች",
            "slug": "ethiopian-orthodox--theological-and-historical-foundations--biblical-and-patristic-foundations",
            "children": [
              {
                "title": "Scripture and the Fathers on Sacred Images",
                "titleAm": "መጽሐፍ ቅዱስ እና አባቶች ቅዱሳት ምስሎች",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--biblical-and-patristic-foundations--scripture-and-the-fathers-on-sacred-images",
                "lessons": [
                  {
                    "title": "Old Testament Precedents: The Cherubim of the Ark, the Bronze Serpent, the Temple of Solomon",
                    "titleAm": "የብሉይ ኪዳን ቅድመ ምሳሌዎች: የታቦቱ ኪሩቤል, የናሱ እባብ, የሰሎሞን ቤተመቅደስ"
                  },
                  {
                    "title": "The Line Between Idol and Image: The Second Commandment",
                    "titleAm": "በጣዖት እና በምስል መካከል ያለው መስመር: ሁለተኛው ትእዛዝ"
                  },
                  {
                    "title": "New Testament Witness: The Incarnation as Ground of the Image",
                    "titleAm": "የአዲስ ኪዳን ምስክርነት: ሥጋ መልበስ የምስሉ መሠረት"
                  },
                  {
                    "title": "Patristic Teaching: Basil, Cyril of Alexandria, Gregory of Nyssa, John of Damascus",
                    "titleAm": "የአባቶች ትምህርት: Basil, Cyril Alexandria, Gregory Nyssa, John Damascus"
                  },
                  {
                    "title": "The Conciliar Question: Nicaea II — and Why the EOTC Does Not Depend on It",
                    "titleAm": "የጉባኤ ጥያቄ: Nicaea II — እና ለምን EOTC Does ያል Depend እሱ"
                  },
                  {
                    "title": "Tradition Outside Scripture: Luke the Painter, the Image \"Not Made by Hands,\" and the Mälkə'a Sə'əl",
                    "titleAm": "ከመጽሐፍ ቅዱስ ውጭ ያለ ትውፊት: ሉቃስ ሣሪው, ምስል \"በእጅ ያልተሰራ,\" እና Mälkə' Sə'əl"
                  }
                ]
              }
            ]
          },
          {
            "title": "Historical Development",
            "titleAm": "የታሪክ እድገት",
            "slug": "ethiopian-orthodox--theological-and-historical-foundations--historical-development",
            "children": [
              {
                "title": "Historical Development of the Ethiopian Tradition",
                "titleAm": "የታሪክ እድገት የኢትዮጵያ Tradition",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--historical-development--historical-development-of-the-ethiopian-tradition",
                "lessons": [
                  {
                    "title": "Pre-Christian Foundations; Aksum and the Conversion of Ezana",
                    "titleAm": "የቅድመ-ክርስትና መሠረቶች; አክሱም እና የኢዛና ለውጥ"
                  },
                  {
                    "title": "The Garima Gospels and Early Manuscript Illumination",
                    "titleAm": "የጋሪማ ወንጌላት እና የጥንት የፅሁፍ ማስዋብ"
                  },
                  {
                    "title": "The Zagwe Rock Churches and the Art of Lalibela",
                    "titleAm": "የዛግዌ የዓለት አብያተ ክርስቲያናት እና የላሊበላ ጥበብ"
                  },
                  {
                    "title": "The Solomonic Restoration and Fre Seyon",
                    "titleAm": "የሰሎሞናዊው ሥርወ መንግሥት መመለስ እና ፍሬ ሰይዞን"
                  },
                  {
                    "title": "The Gondarine Schools: First and Second Gondarine Styles",
                    "titleAm": "የጎንደር ትምህርት ቤቶች: የመጀመሪያ እና Second የጎንደር ቅጦች"
                  },
                  {
                    "title": "The Modern Period and Contemporary Practice",
                    "titleAm": "ዘመናዊው ዘመን እና ዘመናዊ ልምምድ"
                  }
                ]
              },
              {
                "title": "Regional Styles and Schools",
                "titleAm": "የክልል ቅጦች እና ትምህርት ቤቶች",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--historical-development--regional-styles-and-schools",
                "lessons": [
                  {
                    "title": "Tigray and Aksum",
                    "titleAm": "ትግራይ እና አክሱም"
                  },
                  {
                    "title": "Gondar",
                    "titleAm": "ጎንደር"
                  },
                  {
                    "title": "Lake Tana Island Monasteries",
                    "titleAm": "ጣና ሐይቅ Island Monasteries"
                  },
                  {
                    "title": "Gojjam and Shewa",
                    "titleAm": "ጎጃም እና ሸዋ"
                  },
                  {
                    "title": "The South and the Diaspora",
                    "titleAm": "ደቡብ እና ዲያስፖራ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Dogma, Canon, and the Language of the Icon",
            "titleAm": "ዶግማ፣ ቀኖና እና የቅዱስ ሥዕል ቋንቋ",
            "slug": "ethiopian-orthodox--theological-and-historical-foundations--dogma-canon-and-the-language-of-the-icon",
            "children": [
              {
                "title": "Theology and Symbolism of the Icon",
                "titleAm": "ሥነ-መለኮት እና ምሳሌነት ቅዱስ ሥዕል",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--dogma-canon-and-the-language-of-the-icon--theology-and-symbolism-of-the-icon",
                "lessons": [
                  {
                    "title": "Icons as Windows: Veneration (Səgdät) and the Communion of Saints",
                    "titleAm": "ቅዱሳት ሥዕላት እንደ መስኮቶች: ስግደት (Səgdät) እና የቅዱሳን ሕብረት"
                  },
                  {
                    "title": "Canonical Rules for Icon Creation: Qualifications of the Painter, Fasting and Prayer, Inscriptions, Blessing",
                    "titleAm": "ቀኖናዊ ሕጎች ለ ቅዱስ ሥዕል Creation: የሣሪው ብቃት, ጾም እና ጸሎት, ጽሑፎች, በረከት"
                  },
                  {
                    "title": "The Hierarchy of Subjects and Forbidden Subjects",
                    "titleAm": "የርዕሶች ተዋረድ እና የተከለከሉ ርዕሶች"
                  },
                  {
                    "title": "The Symbolic Language: Inverse Perspective, Flatness, the Enlarged Eye, Frontality and Profile",
                    "titleAm": "ምሳሌያዊ ቋንቋ: ተገላቢጦሽ ፐርስፔክቲቭ, ጠፍጣፋነት, የሰፋ ዓይን, ፊት ቀጥ ብሎ እና የጎን ገጽታ"
                  },
                  {
                    "title": "Gesture, Attributes, Drapery, and the Absence of Shadow",
                    "titleAm": "እንቅስቃሴ, ባህሪያት, Drapery, እና ጥላ አለመኖር"
                  },
                  {
                    "title": "Color Symbolism and Theological Meaning",
                    "titleAm": "የቀለም ምሳሌነት እና ሥነ-መለኮታዊ ትርጉም"
                  }
                ]
              }
            ]
          },
          {
            "title": "Comparative Orthodox Iconography",
            "titleAm": "ንጽጽራዊ የኦርቶዶክስ ሥዕል ጥበብ",
            "slug": "ethiopian-orthodox--theological-and-historical-foundations--comparative-orthodox-iconography",
            "children": [
              {
                "title": "The Orthodox Family of Sacred Images",
                "titleAm": "የኦርቶዶክስ ቤተሰብ ቅዱሳት ምስሎች",
                "slug": "ethiopian-orthodox--theological-and-historical-foundations--comparative-orthodox-iconography--the-orthodox-family-of-sacred-images",
                "lessons": [
                  {
                    "title": "Ethiopian and Byzantine Icons Compared",
                    "titleAm": "የኢትዮጵያ እና ብያንዛንታይን ቅዱሳት ሥዕላት አወዳድርd"
                  },
                  {
                    "title": "Coptic Iconography: From Fayyum Portraits to the Neo-Coptic Revival of Isaac Fanous",
                    "titleAm": "ቅብጢ ሥዕል ጥበብ: ከ የፋዩም ፖርትሬቶች አዲሱ የቅብጢ ህዳሴ Isaac Fanous"
                  },
                  {
                    "title": "Syriac Iconography: The Rabbula Gospels and the Modern Revival Movement",
                    "titleAm": "ሶሪያክ ሥዕል ጥበብ: የራቡላ ወንጌላት እና Modern የህዳሴ ንቅናቄ"
                  },
                  {
                    "title": "Armenian Miniature Painting and the Oriental Orthodox Continuum",
                    "titleAm": "የአርመን ጥቃቅን ስዕል እና የምሥራቅ ኦርቶዶክስ ቤተሰብ"
                  },
                  {
                    "title": "Malankara (Indian) Murals: The St Thomas Christians, Persian Roots, and European Currents",
                    "titleAm": "የማላንካራ (ህንድ) ግድግዳ ሥዕሎች: የቅዱስ ቶማስ ክርስቲያኖች, የፋርስ ሥር, እና የአውሮፓ ወራጆች"
                  },
                  {
                    "title": "Russian Icons: The Moscow School and the Prosopon Method",
                    "titleAm": "የሩሲያ ቅዱሳት ሥዕላት: የሞስኮ ትምህርት ቤት እና የፕሮሶፖን ዘዴ"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Canonical Subjects and Sacred Symbolism",
        "titleAm": "ቀኖናዊ ርዕሶች እና ቅዱስ ምሳሌነት",
        "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism",
        "children": [
          {
            "title": "The Principal Subjects",
            "titleAm": "ዋና ርዕሶች",
            "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--the-principal-subjects",
            "children": [
              {
                "title": "Major Iconographic Subjects I: Trinity, Christ, and Theotokos",
                "titleAm": "ዋና የቅዱስ ሥዕል ርዕሶች I: ሥላሴ, ክርስቶስ, እና ድንግል ማርያም",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--the-principal-subjects--major-iconographic-subjects-i-trinity-christ-and-theotokos",
                "lessons": [
                  {
                    "title": "The Holy Trinity (ቅድስት ሥላሴ)",
                    "titleAm": "Holy ሥላሴ (ቅድስት ሥላሴ)"
                  },
                  {
                    "title": "Christ: The Enthroned Lord, the Teacher, the Passion, and the Resurrection",
                    "titleAm": "ክርስቶስ: በዙፋን ላይ ያለው ጌታ, አስተማሪ, ስቃይ, እና ትንሣኤ"
                  },
                  {
                    "title": "The Theotokos (ቅድስት ድንግል ማርያም) and Ethiopian Marian Typology",
                    "titleAm": "ድንግል ማርያም (ቅድስት ድንግል ማርያም) እና የኢትዮጵያ የማርያም ምሳሌነት"
                  }
                ]
              },
              {
                "title": "Major Iconographic Subjects II: Angels, Saints, and Apostles",
                "titleAm": "ዋና የቅዱስ ሥዕል ርዕሶች II: መላእክት, ቅዱሳን, እና ሐዋርያት",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--the-principal-subjects--major-iconographic-subjects-ii-angels-saints-and-apostles",
                "lessons": [
                  {
                    "title": "Archangels and the Angelic Orders",
                    "titleAm": "ሊቀ መላእክት እና የመላእክት ስርዓት"
                  },
                  {
                    "title": "Ethiopian Saints: Monastics, Royal Saints, Holy Women, and Martyrs",
                    "titleAm": "የኢትዮጵያ ቅዱሳን: መነኮሳት, ነገሥታዊ ቅዱሳን, ቅድስታት, እና ሰማዕታት"
                  },
                  {
                    "title": "Apostles and Evangelists",
                    "titleAm": "ሐዋርያት እና ወንጌላውያን"
                  },
                  {
                    "title": "Equestrian and Military Saints",
                    "titleAm": "ፈረሰኛ እና ተዋጊ ቅዱሳን"
                  }
                ]
              },
              {
                "title": "Feast Icons and Narrative Cycles",
                "titleAm": "የበዓል ቅዱሳት ሥዕላት እና ተከታታይ ትረካዎች",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--the-principal-subjects--feast-icons-and-narrative-cycles",
                "lessons": [
                  {
                    "title": "Reading Narrative Registers in Panel and Wall Paintings",
                    "titleAm": "Reading የትረካ ረድፎች Panel እና የግድግዳ ሥዕሎች"
                  },
                  {
                    "title": "The Feasts of the Ethiopian Calendar and Their Icons",
                    "titleAm": "የኢትዮጵያ የቀን መቁጠሪያ በዓላት እና የ ቅዱሳት ሥዕላት"
                  },
                  {
                    "title": "The Painted Programme of the Mäqdäs Walls",
                    "titleAm": "የተሳለ ፕሮግራም የመቅደስ ግድግዳዎች"
                  }
                ]
              },
              {
                "title": "Canonical Depiction of Saints & Angels (Studio Application)",
                "titleAm": "ቀኖናical Depiction ቅዱሳን & መላእክት (የስቱዲዮ ትግበራ)",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--the-principal-subjects--canonical-depiction-of-saints-and-angels-studio-application",
                "lessons": [
                  {
                    "title": "Iconographic Attributes: How Saints Are Recognized",
                    "titleAm": "የቅዱስ ሥዕል ምልክቶች: እንዴት ቅዱሳን ናቸው Recognized"
                  },
                  {
                    "title": "Angels and Archangels: Wings, Lances, and Swirling Robes",
                    "titleAm": "መላእክት እና ሊቀ መላእክት: ክንፎች, ጦሮች, እና የሚዞሩ ልብሶች"
                  },
                  {
                    "title": "Depicting Christ: Pantocrator and Narrative Scenes",
                    "titleAm": "Depicting ክርስቶስ: ፓንቶክራተር እና ትረካ Scenes"
                  },
                  {
                    "title": "Demons, Guardians, and Magic Scroll Imagery",
                    "titleAm": "አጋንንት, ጠባቂዎች, እና የመስተር ጥቅልል ምስሎች"
                  }
                ]
              }
            ]
          },
          {
            "title": "Geometry, Ornament, and the Written Word",
            "titleAm": "ጂዮሜትሪ፣ ማስዋቢያ እና ጽሑፍ",
            "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--geometry-ornament-and-the-written-word",
            "children": [
              {
                "title": "The Mäsqäl: Cross Forms, Interlace, and Ornament",
                "titleAm": "Mäsqäl: የመስቀል ቅርጾች, ሽሮ, እና ማስዋቢያ",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--geometry-ornament-and-the-written-word--the-masqal-cross-forms-interlace-and-ornament",
                "lessons": [
                  {
                    "title": "Equal-Armed and Flared Crosses: Forms and Meanings",
                    "titleAm": "እኩል ክንድ እና የተከፈቱ መስቀሎች: ቅርጾች እና ትርጉሞች"
                  },
                  {
                    "title": "Interlace Bands and the Over-and-Under Weaving Discipline",
                    "titleAm": "የሽሮ ማሰሪያዎች እና ከላይ ከታች ሽመና Discipline"
                  },
                  {
                    "title": "Ḥäräg: The Pattern and Ornament Vocabulary of the Tradition",
                    "titleAm": "Ḥäräg: የስርዓተ-ጥለት እና ማስዋቢያ ቃላት Tradition"
                  },
                  {
                    "title": "Mäsqäl in Liturgical Procession and Church Decoration",
                    "titleAm": "Mäsqäl የሥርዓተ አምልኮ ሰልፍ እና የቤተክርስቲያን ማስዋብ"
                  }
                ]
              },
              {
                "title": "Sacred Geometry & Proportional Canons",
                "titleAm": "ቅዱስ ጂዮሜትሪ & የተመጣጣኝነት ቀኖናዎች",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--geometry-ornament-and-the-written-word--sacred-geometry-and-proportional-canons",
                "lessons": [
                  {
                    "title": "Grid Systems and the Canon of the Icon Body",
                    "titleAm": "የፍርግርግ ሥርዓቶች እና የቅዱስ ሥዕል ሰውነት ቀኖና"
                  },
                  {
                    "title": "Halo Construction: Geometric Methods with Compass and Straightedge",
                    "titleAm": "የሃሎ ግንባታ: ጂዮሜትሪክ ዘዴዎች ከ ኮምፓስ እና ቀጥታ መስመር"
                  },
                  {
                    "title": "Geometric Ground Plans of Ethiopian Churches as Image Space",
                    "titleAm": "ጂዮሜትሪክ ዕቅዶች የኢትዮጵያ አብያተ ክርስቲያናት እንደ የምስል ቦታ"
                  },
                  {
                    "title": "Reading Ethiopian Manuscripts: The Garima Gospels as Geometric Model",
                    "titleAm": "የኢትዮጵያ ጥንታዊ ፅሁፎችን ማንበብ: የጋሪማ ወንጌላት እንደ ጂዮሜትሪክ ሞዴል"
                  }
                ]
              },
              {
                "title": "Traditional Margin Borders & Ge'ez Calligraphy",
                "titleAm": "የጥንት ጠርዝ ህዳጎች & የግዕዝ የእጅ ጽሕፈት",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--geometry-ornament-and-the-written-word--traditional-margin-borders-and-ge-ez-calligraphy",
                "lessons": [
                  {
                    "title": "Ge'ez Script Basics for Artists: Letterforms and Rhythm",
                    "titleAm": "የግዕዝ ፊደል መሠረታዊ ነገሮች ለ አርቲስቶች: የፊደል ቅርጾች እና ሪዝም"
                  },
                  {
                    "title": "Manuscript Layout: Text Columns, Incipits, and Canon Tables",
                    "titleAm": "የፅሁፍ አቀራረብ: የጽሑፍ አምዶች, የመጀመሪያ ገጾች, እና ቀኖና ሠንጠረዦች"
                  },
                  {
                    "title": "Margin Border Patterns: Interlace, Bands, and Symbolic Motifs",
                    "titleAm": "የጠርዝ ስርዓተ-ጥለቶች: ሽሮ, Bands, እና ምሳሌያዊ ምልክቶች"
                  },
                  {
                    "title": "Illuminated Letters and Decorated Incipit Pages",
                    "titleAm": "ያጌጡ ፊደላት እና ያጌጡ የመጀመሪያ ገጾች"
                  }
                ]
              }
            ]
          },
          {
            "title": "Capstone Project",
            "titleAm": "የመጨረሻ ፕሮጀክት",
            "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--capstone-project",
            "children": [
              {
                "title": "The Complete Icon Project (Capstone)",
                "titleAm": "Complete ቅዱስ ሥዕል ፕሮጀክት (Capstone)",
                "slug": "ethiopian-orthodox--canonical-subjects-and-sacred-symbolism--capstone-project--the-complete-icon-project-capstone",
                "lessons": [
                  {
                    "title": "Spiritual Preparation of the Painter; Preparing the Place and the Support",
                    "titleAm": "መንፈሳዊ ዝግጅት Painter; ቦታውን እና ደጋፊውን ማዘጋጀት"
                  },
                  {
                    "title": "Composing a Full Icon: Models, Reference, and the Preliminary Drawing",
                    "titleAm": "ሙሉ ቅዱስ ሥዕል ማዘጋጀት: ሞዴሎች, ማጣቀሻ, እና የመጀመሪያ ስዕል"
                  },
                  {
                    "title": "Painting in Sequence: Ground Colors, Garments, Ornament and Contour (Ṭəräza), the Face Painted Last",
                    "titleAm": "በቅደም ተከተል መሳል: የመሠረት ቀለሞች, ልብሶች, ማስዋቢያ እና ኮንቱር (Ṭəräza), ፊት መጨረሻ ይሳላል"
                  },
                  {
                    "title": "The Inscription, Blessing, Thanksgiving, and Presentation to the Community",
                    "titleAm": "ጽሑፍ, በረከት, አመስጋኝነት, እና ለማህበረሰቡ ማቅረብ"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Practical Studio Curriculum — Secular Craft in the Service of the Canon",
        "titleAm": "ተግባራዊ የስቱዲዮ ሥርዓተ-ትምህርት — ሰብአዊ ጥበብ ለቀኖና አገልግሎት",
        "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon",
        "children": [
          {
            "title": "Drawing for the Icon",
            "titleAm": "ለቅዱስ ሥዕል መሳል",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--drawing-for-the-icon",
            "children": [
              {
                "title": "The Iconographer's Line: Contour Discipline",
                "titleAm": "Iconographer's መስመር: ኮንቱር Discipline",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--drawing-for-the-icon--the-iconographer-s-line-contour-discipline",
                "lessons": [
                  {
                    "title": "Secular skill: contour, blind-contour, and line-weight control → EOTC application: the continuous mäsmär contour at icon scale — stroke sheets of straight lines, curves, ovals, and almond shapes in single, unhesitating movements → Compare: Coptic Neo-Coptic bold dark outlines (Isaac Fanous) versus the Ethiopian fine unbroken line",
                    "titleAm": "ሰብአዊ ክህሎት: ኮንቱር፣ ዓይን ሳይጠቀሙ ኮንቱር እና የመስመር ውፍረት ቁጥጥር → EOTC ትግበራ: በቅዱስ ሥዕል መጠን ያለው ተከታታይ መስመር — የቀጥታ መስመሮች፣ ጠማማዎች፣ ሞላላዎች እና የለውዝ ቅርጾች ልምምድ ገጾች በአንድ ያልተጠራጠረ እንቅስቃሴ → አወዳድር: ቅብጢ Neo-ቅብጢ bold ጨለማ outlines (Isaac Fanous) versus የኢትዮጵያ fine unbroken መስመር"
                  },
                  {
                    "title": "Secular skill: silhouette reduction and shape design → EOTC application: reducing master icons to silhouettes and geometric scaffolding → Compare: the flat field in Byzantine icons and what the silhouette carries in each",
                    "titleAm": "ሰብአዊ ክህሎት: የጥላ ቅርጽ መቀነስ እና ቅርጽ ንድፍ → EOTC ትግበራ: ዋና ቅዱሳት ሥዕላትን ወደ ጥላ ቅርጽ እና ጂዮሜትሪክ መዋቅር መቀነስ → አወዳድር: flat field ብያንዛንታይን ቅዱሳት ሥዕላት እና what silhouette carries each"
                  },
                  {
                    "title": "Secular skill: inking and brush-line discipline → EOTC application: inking the icon contour with a fine traditional brush → Compare: line work in the Syriac Rabbula Gospel miniatures",
                    "titleAm": "ሰብአዊ ክህሎት: ቀለም መቀባት እና የብሩሽ መስመር ሥርዓት → EOTC ትግበራ: inking ቅዱስ ሥዕል contour ከ fine traditional ብሩሽ → አወዳድር: መስመር work ሶሪያክ Rabbula Gospel miniatures"
                  },
                  {
                    "title": "Secular skill: master-copy practice as training method → EOTC application: fidelity copying of Gondarine faces with named sources and period identification → Compare: copying discipline in Russian icon- painting workshops",
                    "titleAm": "ሰብአዊ ክህሎት: ዋና ስራዎችን መቅዳት እንደ ሥልጠና ዘዴ → EOTC ትግበራ: fidelity copying ጎንደርine ፊቶች ከ named sources እና period identification → አወዳድር: copying discipline Russian icon- painting workshops"
                  }
                ]
              },
              {
                "title": "Sacred Geometry in Practice",
                "titleAm": "ቅዱስ ጂዮሜትሪ ልምምድ",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--drawing-for-the-icon--sacred-geometry-in-practice",
                "lessons": [
                  {
                    "title": "Secular skill: ruler-and-compass geometric construction → EOTC application: nimbus circles, axes, divisions, and the canonical grid of the standing saint (≈6½-head student canon) → Compare: halo and mandorla geometry in Byzantine icons",
                    "titleAm": "ሰብአዊ ክህሎት: በሊኒያል እና ኮምፓስ ጂዮሜትሪክ ግንባታ → EOTC ትግበራ: nimbus circles, axes, divisions, እና canonical grid standing ቅዱስ (≈6½-ጭንቅላት student canon) → አወዳድር: halo እና mandorla geometry ብያንዛንታይን ቅዱሳት ሥዕላት"
                  },
                  {
                    "title": "Secular skill: measuring and proportion systems → EOTC application: measuring icons of different periods; the Ethiopian canon beside the 8-head Western canon → Compare: proportional canons of Coptic figures with enlarged heads",
                    "titleAm": "ሰብአዊ ክህሎት: የመለኪያ እና ተመጣጣኝነት ሥርዓቶች → EOTC ትግበራ: measuring ቅዱሳት ሥዕላት different periods; የኢትዮጵያ canon beside 8-ጭንቅላት Western canon → አወዳድር: proportional canons ቅብጢ ምስሎች ከ enlarged heads"
                  },
                  {
                    "title": "Secular skill: pattern design and tessellation → EOTC application: constructing the equal-armed cross in a circle and two-strand interlace bands → Compare: Armenian cross-forms and khachkar interlace carving",
                    "titleAm": "ሰብአዊ ክህሎት: ስርዓተ-ጥለት ንድፍ እና ማያያዝ → EOTC ትግበራ: constructing equal-armed መስቀል circle እና two-strand interlace bands → አወዳድር: Armenian cross-forms እና khachkar interlace carving"
                  },
                  {
                    "title": "Secular skill: symmetry and balance analysis → EOTC application: axial symmetry and hierarchical scale in icon composition → Compare: compositional symmetry in Malankara Kerala church murals",
                    "titleAm": "ሰብአዊ ክህሎት: የሲሜትሪ እና ሚዛን ትንተና → EOTC ትግበራ: axial ሲሜትሪ እና hierarchical scale ቅዱስ ሥዕል ቅንብር → አወዳድር: compositional ሲሜትሪ Malankara Kerala ቤተክርስቲያን murals"
                  }
                ]
              }
            ]
          },
          {
            "title": "Tone and Light",
            "titleAm": "ቶን እና ብርሃን",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--tone-and-light",
            "children": [
              {
                "title": "Value and the Luminous Face: Light Without Shadow",
                "titleAm": "ብሩህነት እና Luminous ፊት: ብርሃን Without ጥላ",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--tone-and-light--value-and-the-luminous-face-light-without-shadow",
                "lessons": [
                  {
                    "title": "Secular skill: the seven-step value scale and tonal analysis → EOTC application: value without cast shadow — \"light from within\" and the half-closed-eye reading of three icons → Compare: the Byzantine prosopon method of translucent small-circle highlights",
                    "titleAm": "ሰብአዊ ክህሎት: የሰባት-ደረጃ ብሩህነት እና የቶን ትንተና → EOTC ትግበራ: ብሩህነት without cast ጥላ — \"ብርሃን ከ within\" እና half-closed-eye reading three ቅዱሳት ሥዕላት → አወዳድር: ብያንዛንታይን prosopon method translucent small-circle highlights"
                  },
                  {
                    "title": "Secular skill: grisaille and monochrome painting → EOTC application: monochrome line-and- value copy of a standing saint → Compare: the Russian sankir underpainting tradition",
                    "titleAm": "ሰብአዊ ክህሎት: ግሪዛይል እና አንድ-ቀለም ስዕል → EOTC ትግበራ: monochrome line-and- ብሩህነት copy standing ቅዱስ → አወዳድር: Russian sankir underpainting tradition"
                  },
                  {
                    "title": "Secular skill: notan and two-value design → EOTC application: value grouping in first and second Gondarine faces → Compare: Coptic flattened color versus tonal modeling",
                    "titleAm": "ሰብአዊ ክህሎት: ኖታን እና ሁለት-ብሩህነት ንድፍ → EOTC ትግበራ: ብሩህነት grouping first እና second ጎንደርine ፊቶች → አወዳድር: ቅብጢ flattened ቀለም versus tonal modeling"
                  },
                  {
                    "title": "Secular skill: transforming observation into design → EOTC application: redrawing a Western naturalistic print into Ethiopian icon space — no perspective, no cast shadow → Compare: inverse perspective in Byzantium and its modern critics",
                    "titleAm": "ሰብአዊ ክህሎት: ምልከታን ወደ ንድፍ መለወጥ → EOTC ትግበራ: redrawing Western naturalistic print ወደ የኢትዮጵያ ቅዱስ ሥዕል ቦታ — no ፐርስፔክቲቭ, no cast ጥላ → አወዳድር: inverse ፐርስፔክቲቭ Byzantium እና የ modern critics"
                  }
                ]
              }
            ]
          },
          {
            "title": "The Canonical Figure",
            "titleAm": "ቀኖናዊ ምስል",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--the-canonical-figure",
            "children": [
              {
                "title": "Drawing the Canonical Face, Hands, and Figure",
                "titleAm": "ስዕል ቀኖናical ፊት, እጆች, እና ምስል",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--the-canonical-figure--drawing-the-canonical-face-hands-and-figure",
                "lessons": [
                  {
                    "title": "Secular skill: portrait construction (ball-and-plane head) → EOTC application: constructing the canonical frontal face — almond eyes, continuous brow-and-nose line, closed mouth → Compare: Coptic enlarged eyes, ears, and small mouth as spiritual sight made visible",
                    "titleAm": "ሰብአዊ ክህሎት: የፖርትሬት ግንባታ (የኳስ እና ጠፍጣፋ ጭንቅላት) → EOTC ትግበራ: constructing canonical frontal ፊት — almond eyes, continuous brow-and-nose መስመር, closed mouth → አወዳድር: ቅብጢ enlarged eyes, ears, እና small mouth እንደ spiritual sight made visible"
                  },
                  {
                    "title": "Secular skill: facial types and likeness → EOTC application: the six canonical facial types — Christ, Virgin, Angel, Young Saint, Apostle, Elder → Compare: the Byzantine Pantocrator type against the Ethiopian enthroned Lord",
                    "titleAm": "ሰብአዊ ክህሎት: የፊት ዓይነቶች እና መመሳሰል → EOTC ትግበራ: six canonical facial types — ክርስቶስ, Virgin, መልአክ, ወጣት ቅዱስ, Apostle, ሽማግሌ → አወዳድር: ብያንዛንታይን ፓንቶክራተር type against የኢትዮጵያ enthroned Lord"
                  },
                  {
                    "title": "Secular skill: the head in multiple angles and foreshortening → EOTC application: three-quarter faces with both eyes visible; the profile face reserved for the wicked (Judas, persecutors) — spiritual exclusion, not complexion → Compare: profile conventions in Syriac and Western Last Supper images",
                    "titleAm": "ሰብአዊ ክህሎት: ጭንቅላት በተለያዩ ማዕዘኖች እና በአቅጣጫ ማሳጠር → EOTC ትግበራ: three-quarter ፊቶች ከ both eyes visible; profile ፊት reserved ለ wicked (Judas, persecutors) — spiritual exclusion, ያል complexion → አወዳድር: profile conventions ሶሪያክ እና Western Last Supper ምስሎች"
                  },
                  {
                    "title": "Secular skill: hand and foot anatomy from life → EOTC application: the grammar of gesture — canonical hands holding book, cross, and scroll; feet standing, seated, kneeling → Compare: gesture vocabulary in Byzantine Deësis panels",
                    "titleAm": "ሰብአዊ ክህሎት: የእጅ እና የእግር አናቶሚ ከሕያው ሞዴል → EOTC ትግበራ: grammar እንቅስቃሴ — canonical እጆች holding book, መስቀል, እና scroll; እግሮች standing, seated, kneeling → አወዳድር: እንቅስቃሴ vocabulary ብያንዛንታይን Deësis panels"
                  },
                  {
                    "title": "Secular skill: figure integration from gesture drawing → EOTC application: the body beneath drapery — angels, horses, and equestrian saints → Compare: mounted warrior saints such as St George in Coptic and Byzantine icons",
                    "titleAm": "ሰብአዊ ክህሎት: ምስልን ከእንቅስቃሴ ስዕል ማዋሃድ → EOTC ትግበራ: body beneath drapery — መላእክት, horses, እና equestrian ቅዱሳን → አወዳድር: mounted warrior ቅዱሳን such እንደ St George ቅብጢ እና ብያንዛንታይን ቅዱሳት ሥዕላት"
                  }
                ]
              }
            ]
          },
          {
            "title": "Color and Materials",
            "titleAm": "ቀለም እና ቁሳቁሶች",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--color-and-materials",
            "children": [
              {
                "title": "The Traditional Palette: Pigment and Color Practice",
                "titleAm": "Traditional ቀለም ሰሌዳ: Pigment እና ቀለም ልምምድ",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--color-and-materials--the-traditional-palette-pigment-and-color-practice",
                "lessons": [
                  {
                    "title": "Secular skill: color wheel and systematic mixing → EOTC application: the traditional palette — mineral, earth, and plant pigments, their sources and behavior → Compare: period palettes — Aksumite–Zagwe against the first and second Gondarine",
                    "titleAm": "ሰብአዊ ክህሎት: የቀለም ክብ እና ስርዓታዊ ቅብል → EOTC ትግበራ: traditional ቀለም ሰሌዳ — mineral, earth, እና plant pigments, የ sources እና behavior → አወዳድር: period palettes — አክሱምite–Zagwe against first እና second ጎንደርine"
                  },
                  {
                    "title": "Secular skill: limited-palette painting → EOTC application: the symbolic hierarchy of color and background bands → Compare: color coding in Coptic icons versus Ethiopian liturgical color",
                    "titleAm": "ሰብአዊ ክህሎት: በተገደበ ቀለም መሳል → EOTC ትግበራ: symbolic hierarchy ቀለም እና background bands → አወዳድር: ቀለም coding ቅብጢ ቅዱሳት ሥዕላት versus የኢትዮጵያ liturgical ቀለም"
                  },
                  {
                    "title": "Secular skill: flesh-tone mixing across skin tones → EOTC application: flesh tones and the luminous face of the Gondarine masters → Compare: Malankara Kerala mural flesh tones and their Persian and European currents",
                    "titleAm": "ሰብአዊ ክህሎት: የቆዳ ቀለም በተለያዩ የቆዳ ዓይነቶች → EOTC ትግበራ: flesh tones እና luminous ፊት ጎንደርine ዋና አርቲስቶች → አወዳድር: Malankara Kerala mural flesh tones እና የ Persian እና European currents"
                  },
                  {
                    "title": "Secular skill: color harmonization schemes → EOTC application: color in feast and liturgical icons; harmonizing garments and grounds → Compare: Russian icon color harmony as in Rublev's Trinity",
                    "titleAm": "ሰብአዊ ክህሎት: የቀለም ስምምነት እቅዶች → EOTC ትግበራ: ቀለም feast እና liturgical ቅዱሳት ሥዕላት; harmonizing garments እና grounds → አወዳድር: Russian ቅዱስ ሥዕል ቀለም harmony እንደ Rublev's ሥላሴ"
                  }
                ]
              },
              {
                "title": "Supports, Grounds, and Tempera: Materials Craft",
                "titleAm": "Supports, Grounds, እና Tempera: ቁሳቁሶች Craft",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--color-and-materials--supports-grounds-and-tempera-materials-craft",
                "lessons": [
                  {
                    "title": "Secular skill: surface and panel preparation craft → EOTC application: supports — wall, cloth-on- wall, panel (sälaḍa), and parchment (bərana); chalk-and-glue gesso → Compare: the gilded panel-gesso tradition of Byzantine workshops",
                    "titleAm": "ሰብአዊ ክህሎት: የገጽ እና የሰሌዳ ዝግጅት ጥበብ → EOTC ትግበራ: supports — wall, cloth-on- wall, panel (sälaḍ), እና parchment (bərana); chalk-and-glue gesso → አወዳድር: gilded panel-gesso tradition ብያንዛንታይን workshops"
                  },
                  {
                    "title": "Secular skill: binders and handmade paint → EOTC application: egg and plant-gum binders; grinding and storing pigments; the blessing and care of materials → Compare: egg-tempera practice in Russian workshop rules",
                    "titleAm": "ሰብአዊ ክህሎት: አስማሚዎች እና በእጅ የተሰራ ቀለም → EOTC ትግበራ: egg እና plant-gum binders; grinding እና storing pigments; blessing እና care ቁሳቁሶች → አወዳድር: egg-tempera ልምምድ Russian workshop rules"
                  },
                  {
                    "title": "Secular skill: brush making and tool maintenance → EOTC application: traditional brushes and tool discipline in the Ethiopian workshop → Compare: brushwork tools of Coptic and Byzantine practitioners",
                    "titleAm": "ሰብአዊ ክህሎት: ብሩሽ መስራት እና መሣሪያ ጥገና → EOTC ትግበራ: traditional ብሩሾች እና tool discipline የኢትዮጵያ workshop → አወዳድር: brushwork tools ቅብጢ እና ብያንዛንታይን practitioners"
                  },
                  {
                    "title": "Secular skill: studio safety and archival practice → EOTC application: reverent handling, covering, and storage of sacred materials → Compare: workshop rules across the Oriental Orthodox schools",
                    "titleAm": "ሰብአዊ ክህሎት: የስቱዲዮ ደህንነት እና የማህደር ልምምድ → EOTC ትግበራ: reverent handling, covering, እና storage sacred ቁሳቁሶች → አወዳድር: workshop rules across Oriental Orthodox schools"
                  }
                ]
              }
            ]
          },
          {
            "title": "Composition for Sacred Space",
            "titleAm": "ለቅዱስ ቦታ ቅንብር",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--composition-for-sacred-space",
            "children": [
              {
                "title": "Composition for Sacred Space",
                "titleAm": "ለቅዱስ ቦታ ቅንብር",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--composition-for-sacred-space--composition-for-sacred-space",
                "lessons": [
                  {
                    "title": "Secular skill: focal points and eye-path design → EOTC application: hierarchy and scale — Christ largest, saints above donors → Compare: hieratic composition in Byzantine church programmes",
                    "titleAm": "ሰብአዊ ክህሎት: የትኩረት ነጥቦች እና የዓይን መንገድ ንድፍ → EOTC ትግበራ: hierarchy እና scale — ክርስቶስ largest, ቅዱሳን above donors → አወዳድር: hieratic ቅንብር ብያንዛንታይን ቤተክርስቲያን programmes"
                  },
                  {
                    "title": "Secular skill: narrative sequencing and storyboards → EOTC application: registers, sequence, and feast-cycle narrative walls → Compare: narrative registers in Malankara Kerala murals",
                    "titleAm": "ሰብአዊ ክህሎት: ተከታታይ ትረካ እና ስታጅቦርዶች → EOTC ትግበራ: registers, sequence, እና feast-cycle narrative walls → አወዳድር: narrative registers Malankara Kerala murals"
                  },
                  {
                    "title": "Secular skill: framing and border design → EOTC application: borders, frames, and inscriptions — ṭəräza and margin systems → Compare: Syriac manuscript canon tables and margin ornament",
                    "titleAm": "ሰብአዊ ክህሎት: አቀራረጽ እና የጠርዝ ንድፍ → EOTC ትግበራ: ጠርዞች, frames, እና inscriptions — ṭəräza እና margin systems → አወዳድር: ሶሪያክ ጥንታዊ ጽሑፍ canon tables እና margin ornament"
                  },
                  {
                    "title": "Secular skill: spatial illusion versus flatness → EOTC application: two-dimensionality (hulätt awtar) and the moral grammar of frontality and profile → Compare: inverse perspective in Byzantine theory and the modern debate over it",
                    "titleAm": "ሰብአዊ ክህሎት: የቦታ ምናብ እና ጠፍጣፋነት → EOTC ትግበራ: two-dimensionality (hulätt awtar) እና moral grammar frontality እና profile → አወዳድር: inverse ፐርስፔክቲቭ ብያንዛንታይን theory እና modern debate over እሱ"
                  }
                ]
              }
            ]
          },
          {
            "title": "Painting the Icon",
            "titleAm": "ቅዱስ ሥዕልን መሳል",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--painting-the-icon",
            "children": [
              {
                "title": "The Icon Painting Sequence: From Ground to Blessing",
                "titleAm": "ቅዱስ ሥዕል ስዕል በቀለም Sequence: ከ Ground በረከት",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--painting-the-icon--the-icon-painting-sequence-from-ground-to-blessing",
                "lessons": [
                  {
                    "title": "Secular skill: layered painting workflow and drying discipline → EOTC application: the working sequence — ground colors, garments, ornament, contour, the face painted last → Compare: the Byzantine prosopon layer order from sankir to highlights",
                    "titleAm": "ሰብአዊ ክህሎት: የአንድ በአንድ ቀለም አቀራረብ እና የማድረቅ ሥርዓት → EOTC ትግበራ: working sequence — ground ቀለሞች, garments, ornament, contour, ፊት painted last → አወዳድር: ብያንዛንታይን prosopon layer order ከ sankir highlights"
                  },
                  {
                    "title": "Secular skill: detail rendering and edge finishing → EOTC application: patterned hair and beards, never naturalistic; first and second Gondarine faces side by side → Compare: stylistic finishing in Coptic and Russian faces",
                    "titleAm": "ሰብአዊ ክህሎት: ዝርዝር መሳል እና ጠርዝ ማጠናቀቅ → EOTC ትግበራ: patterned hair እና beards, never naturalistic; first እና second ጎንደርine ፊቶች side side → አወዳድር: stylistic finishing ቅብጢ እና Russian ፊቶች"
                  },
                  {
                    "title": "Secular skill: calligraphic lettering within artwork → EOTC application: the inscription — Ge'ez naming of the sacred subject → Compare: Greek and Syriac icon inscriptions and their placement",
                    "titleAm": "ሰብአዊ ክህሎት: በስዕሉ ውስጥ የእጅ ጽሕፈት → EOTC ትግበራ: inscription — Ge'ez naming sacred subject → አወዳድር: Greek እና ሶሪያክ ቅዱስ ሥዕል inscriptions እና የ placement"
                  },
                  {
                    "title": "Secular skill: presentation and documentation of finished work → EOTC application: blessing, thanksgiving, prostration; the temptations of the painter and their remedies → Compare: ecclesiastical review standards across the Orthodox churches",
                    "titleAm": "ሰብአዊ ክህሎት: የተጠናቀቀ ስራን ማቅረብ እና መረጃ መያዝ → EOTC ትግበራ: blessing, thanksgiving, prostration; temptations painter እና የ remedies → አወዳድር: ecclesiastical review standards across Orthodox አብያተ ክርስቲያናት"
                  }
                ]
              }
            ]
          },
          {
            "title": "Standards and the Living Tradition",
            "titleAm": "መስፈርቶች እና ሕያው ትውፊት",
            "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--standards-and-the-living-tradition",
            "children": [
              {
                "title": "Assessment, Exhibition, and the Living Tradition",
                "titleAm": "Assessment, Exhibition, እና Living Tradition",
                "slug": "ethiopian-orthodox--practical-studio-curriculum-secular-craft-in-the-service-of-the-canon--standards-and-the-living-tradition--assessment-exhibition-and-the-living-tradition",
                "lessons": [
                  {
                    "title": "Assessment framework: technical, canonical, and theological criteria; portfolio review",
                    "titleAm": "የግምገማ ማዕቀፍ: ቴክኒካዊ፣ ቀኖናዊ እና ሥነ-መለኮታዊ መስፈርቶች; የስራ ስብስብ ግምገማ"
                  },
                  {
                    "title": "Exhibition and portfolio standards: documentation, ecclesiastical review, and the ethics of exhibiting sacred images",
                    "titleAm": "የኤግዚቢሽን እና የስራ ስብስብ መስፈርቶች: መረጃ ማዘጋጀት, ecclesiastical review, እና ethics exhibiting sacred ምስሎች"
                  },
                  {
                    "title": "Contemporary challenges: careless restoration, digital theft, and Western prints — remedies through schools, registries, canonical printing, and a guild of church artists",
                    "titleAm": "Contemporary challenges: careless restoration, ዲጂታል theft, እና Western prints — remedies through schools, registries, canonical printing, እና guild ቤተክርስቲያን አርቲስቶች"
                  },
                  {
                    "title": "Teaching methodology: the master–apprentice inheritance, demonstration and critique, integrating theology into the studio",
                    "titleAm": "Teaching methodology: ዋና አርቲስት–apprentice inheritance, demonstration እና ግምገማ, integrating theology ወደ studio"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "History of Art",
    "titleAm": "የጥበብ ታሪክ",
    "slug": "history-of-art",
    "children": [
      {
        "title": "Ancient & Medieval Art",
        "titleAm": "Ancient & Medieval ጥበብ",
        "slug": "history-of-art--ancient-and-medieval-art",
        "children": [
          {
            "title": "The Ancient World",
            "titleAm": "",
            "slug": "history-of-art--ancient-and-medieval-art--the-ancient-world",
            "children": [
              {
                "title": "From Cave Painting to the Gothic Cathedral",
                "titleAm": "ከ Cave ስዕል በቀለም Gothic Cathedral",
                "slug": "history-of-art--ancient-and-medieval-art--the-ancient-world--from-cave-painting-to-the-gothic-cathedral",
                "lessons": [
                  {
                    "title": "Prehistoric Mark-Making: Lascaux, Altamira, and African Rock Art",
                    "titleAm": "Prehistoric Mark-ማድረግ: Lascaux, Altamira, እና African Rock ጥበብ"
                  },
                  {
                    "title": "Egyptian, Nubian, and Aksumite Visual Systems",
                    "titleAm": "ግብጽian, Nubian, እና አክሱምite Visual Systems"
                  },
                  {
                    "title": "Classical Greece and Rome: Ideal Form and Narrative Relief",
                    "titleAm": "Classical ግሪክ እና ሮም: Ideal ቅርጽ እና ትረካ Relief"
                  },
                  {
                    "title": "Byzantine Icons and Mosaics",
                    "titleAm": "ብያንዛንታይን ቅዱሳት ሥዕላት እና Mosaics"
                  },
                  {
                    "title": "Romanesque to Gothic: The Cathedral as Total Artwork",
                    "titleAm": "Romanesque Gothic: Cathedral እንደ Total Artwork"
                  }
                ]
              }
            ]
          },
          {
            "title": "African & Ethiopian Antiquity",
            "titleAm": "African & የኢትዮጵያ Antiquity",
            "slug": "history-of-art--ancient-and-medieval-art--african-and-ethiopian-antiquity",
            "children": [
              {
                "title": "African Art Before Colonialism",
                "titleAm": "African ጥበብ Before Colonialism",
                "slug": "history-of-art--ancient-and-medieval-art--african-and-ethiopian-antiquity--african-art-before-colonialism",
                "lessons": [
                  {
                    "title": "Rock Art of the Horn of Africa",
                    "titleAm": "Rock ጥበብ Horn Africa"
                  },
                  {
                    "title": "Great Zimbabwe, Benin Bronzes, and West African Traditions",
                    "titleAm": "Great Zimbabwe, Benin Bronzes, እና West African Traditions"
                  },
                  {
                    "title": "Aksumite Stelae and Lalibela Rock-Hewn Churches",
                    "titleAm": "አክሱምite Stelae እና Lalibela Rock-Hewn አብያተ ክርስቲያናት"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Renaissance to Modern Art",
        "titleAm": "Renaissance Modern ጥበብ",
        "slug": "history-of-art--renaissance-to-modern-art",
        "children": [
          {
            "title": "The Early Modern Arc",
            "titleAm": "",
            "slug": "history-of-art--renaissance-to-modern-art--the-early-modern-arc",
            "children": [
              {
                "title": "Renaissance, Baroque and Modernism",
                "titleAm": "Renaissance, Baroque እና Modernism",
                "slug": "history-of-art--renaissance-to-modern-art--the-early-modern-arc--renaissance-baroque-and-modernism",
                "lessons": [
                  {
                    "title": "The Renaissance Revolution: Perspective, Anatomy, and the Artist's Status",
                    "titleAm": "Renaissance Revolution: ፐርስፔክቲቭ, አናቶሚ, እና Artist's Status"
                  },
                  {
                    "title": "Baroque Drama: Caravaggio, Rubens, and Bernini",
                    "titleAm": "Baroque Drama: Caravaggio, Rubens, እና Bernini"
                  },
                  {
                    "title": "Neoclassicism and Romanticism",
                    "titleAm": "Neoclassicism እና Romanticism"
                  },
                  {
                    "title": "Impressionism and Post-Impressionism: Light and Color Liberated",
                    "titleAm": "Impressionism እና Post-Impressionism: ብርሃን እና ቀለም Liberated"
                  },
                  {
                    "title": "Modernism's Shattered Mirror: Cubism, Expressionism, Abstraction",
                    "titleAm": "Modernism's Shattered Mirror: Cubism, Expressionism, የሆድ ጡንቻዎችtraction"
                  },
                  {
                    "title": "Contemporary Currents: Globalization, Media, and Installation",
                    "titleAm": "Contemporary Currents: Globalization, Media, እና Installation"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Ethiopian & African Art",
        "titleAm": "የኢትዮጵያ & African ጥበብ",
        "slug": "history-of-art--ethiopian-and-african-art",
        "children": [
          {
            "title": "Deep History to Present",
            "titleAm": "Deep ታሪክ Present",
            "slug": "history-of-art--ethiopian-and-african-art--deep-history-to-present",
            "children": [
              {
                "title": "Ethiopian Art Through the Centuries",
                "titleAm": "የኢትዮጵያ ጥበብ Through Centuries",
                "slug": "history-of-art--ethiopian-and-african-art--deep-history-to-present--ethiopian-art-through-the-centuries",
                "lessons": [
                  {
                    "title": "Aksumite and Zagwe Eras: Crosses, Churches, and Illuminated Manuscripts",
                    "titleAm": "አክሱምite እና Zagwe Eras: መስቀሎች, አብያተ ክርስቲያናት, እና Illuminated ጥንታዊ ጽሑፎች"
                  },
                  {
                    "title": "The Gondarine Workshop and Its Legacy",
                    "titleAm": "ጎንደርine Workshop እና የ Legacy"
                  },
                  {
                    "title": "Twentieth-Century Modernism in Ethiopia: Addis Ababa Fine Arts School",
                    "titleAm": ""
                  },
                  {
                    "title": "Contemporary Ethiopian Artists and the Global Scene",
                    "titleAm": "Contemporary የኢትዮጵያ አርቲስቶች እና Global Scene"
                  }
                ]
              },
              {
                "title": "African Art in the World",
                "titleAm": "African ጥበብ World",
                "slug": "history-of-art--ethiopian-and-african-art--deep-history-to-present--african-art-in-the-world",
                "lessons": [
                  {
                    "title": "Modern African Art Movements and the Politics of Exhibition",
                    "titleAm": "Modern African ጥበብ Movements እና Politics Exhibition"
                  },
                  {
                    "title": "Diaspora and Identity in Contemporary African Art",
                    "titleAm": "ዲያስፖራ እና Identity Contemporary African ጥበብ"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Looking at Art",
        "titleAm": "ጥበብን መመልከት",
        "slug": "history-of-art--looking-at-art",
        "children": [
          {
            "title": "Visual Literacy & Criticism",
            "titleAm": "",
            "slug": "history-of-art--looking-at-art--visual-literacy-and-criticism",
            "children": [
              {
                "title": "Reading Art: Visual Analysis and Criticism",
                "titleAm": "Reading ጥበብ: Visual ትንተና እና Criticism",
                "slug": "history-of-art--looking-at-art--visual-literacy-and-criticism--reading-art-visual-analysis-and-criticism",
                "lessons": [
                  {
                    "title": "Formal Analysis: Line, Shape, Color, Space, Texture in Any Artwork",
                    "titleAm": "ቅርጽal ትንተና: መስመር, ቅርጽ, ቀለም, ቦታ, ገጽታ Any Artwork"
                  },
                  {
                    "title": "Iconography: Identifying Subjects and Symbols",
                    "titleAm": "ሥዕል ጥበብ: Identifying Subjects እና Symbols"
                  },
                  {
                    "title": "Contextual Method: Patronage, Politics, and Audience",
                    "titleAm": "አውድual Method: Patronage, Politics, እና Audience"
                  },
                  {
                    "title": "Writing About Art: Description to Argument",
                    "titleAm": "Writing About ጥበብ: Description Argument"
                  },
                  {
                    "title": "Museum and Church Visit Protocol: Looking In Person",
                    "titleAm": "ሙዚየም እና ቤተክርስቲያን Visit Protocol: መመልከት Person"
                  }
                ]
              }
            ]
          },
          {
            "title": "Aesthetics & Theory",
            "titleAm": "",
            "slug": "history-of-art--looking-at-art--aesthetics-and-theory",
            "children": [
              {
                "title": "Introduction to Aesthetics",
                "titleAm": "",
                "slug": "history-of-art--looking-at-art--aesthetics-and-theory--introduction-to-aesthetics",
                "lessons": [
                  {
                    "title": "What Is Beauty? Classical to Modern Debates",
                    "titleAm": "ምን ነው Beauty? Classical Modern Debates"
                  },
                  {
                    "title": "Art and Meaning: Formalism, Expression Theory, Institutional Theory",
                    "titleAm": "ጥበብ እና Meaning: ቅርጽalism, ስሜት መግለጽ Theory, Institutional Theory"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Media, Materials &",
    "titleAm": "MEDIA, ቁሳቁሶች &",
    "slug": "media-materials-and",
    "children": [
      {
        "title": "Artistry & Creative Practice",
        "titleAm": "Artistry & Creative ልምምድ",
        "slug": "media-materials-and--artistry-and-creative-practice",
        "children": [
          {
            "title": "Building a Sustainable Practice",
            "titleAm": "Building Sustainable ልምምድ",
            "slug": "media-materials-and--artistry-and-creative-practice--building-a-sustainable-practice",
            "children": [
              {
                "title": "Developing a Creative Practice",
                "titleAm": "Developing Creative ልምምድ",
                "slug": "media-materials-and--artistry-and-creative-practice--building-a-sustainable-practice--developing-a-creative-practice",
                "lessons": [
                  {
                    "title": "The Studio Habit: Space, Schedule, and Ritual",
                    "titleAm": "ስቱዲዮ Habit: ቦታ, Schedule, እና Ritual"
                  },
                  {
                    "title": "Idea Generation: Sketchbooks, Lists, and Creative Constraints",
                    "titleAm": "Idea Generation: ስኬች ደብተርs, Lists, እና Creative Constraints"
                  },
                  {
                    "title": "The Artist's Journal: Reflection and Growth Tracking",
                    "titleAm": "Artist's Journal: Reflection እና Growth Tracking"
                  },
                  {
                    "title": "Finishing Work: Knowing When a Piece Is Done",
                    "titleAm": "ማጠናቀቅ ሥራ: Knowing በሚሆንበት Piece ነው Done"
                  }
                ]
              },
              {
                "title": "Professional Skills for Artists",
                "titleAm": "Professional Skills ለ አርቲስቶች",
                "slug": "media-materials-and--artistry-and-creative-practice--building-a-sustainable-practice--professional-skills-for-artists",
                "lessons": [
                  {
                    "title": "Photographing and Documenting Artwork",
                    "titleAm": "Photographing እና Documenting Artwork"
                  },
                  {
                    "title": "Building a Portfolio: Physical and Digital",
                    "titleAm": "Building የስራ ስብስብ: Physical እና ዲጂታል"
                  },
                  {
                    "title": "Pricing, Commissions, and Exhibitions",
                    "titleAm": "Pricing, Commissions, እና Exhibitions"
                  },
                  {
                    "title": "Artist Statements and Bios",
                    "titleAm": "አርቲስት Statements እና Bios"
                  }
                ]
              }
            ]
          },
          {
            "title": "Experimental & Mixed Media",
            "titleAm": "",
            "slug": "media-materials-and--artistry-and-creative-practice--experimental-and-mixed-media",
            "children": [
              {
                "title": "Mixed Media & Collage",
                "titleAm": "",
                "slug": "media-materials-and--artistry-and-creative-practice--experimental-and-mixed-media--mixed-media-and-collage",
                "lessons": [
                  {
                    "title": "Adhesives, Grounds, and Layering Systems",
                    "titleAm": "Adhesives, Grounds, እና Layering Systems"
                  },
                  {
                    "title": "Collage: Paper, Found Image, and Fabric Integration",
                    "titleAm": "Collage: ወረቀት, Found ምስል, እና ጨርቅ Integration"
                  },
                  {
                    "title": "Combining Drawing, Paint, and Print in One Work",
                    "titleAm": "Combining ስዕል, ቀለም, እና Print አንድ ሥራ"
                  },
                  {
                    "title": "Unconventional Supports and Found Materials",
                    "titleAm": "Unconventional Supports እና Found ቁሳቁሶች"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Painting Media",
        "titleAm": "ስዕል በቀለም Media",
        "slug": "media-materials-and--painting-media",
        "children": [
          {
            "title": "Foundations of Painting",
            "titleAm": "Foundations ስዕል በቀለም",
            "slug": "media-materials-and--painting-media--foundations-of-painting",
            "children": [
              {
                "title": "Introduction to Painting Media",
                "titleAm": "Introduction ስዕል በቀለም Media",
                "slug": "media-materials-and--painting-media--foundations-of-painting--introduction-to-painting-media",
                "lessons": [
                  {
                    "title": "Surfaces and Grounds: Canvas, Panel, Paper — Sizing and Priming",
                    "titleAm": "Surfaces እና Grounds: ሸራ, Panel, ወረቀት — Sizing እና Priming"
                  },
                  {
                    "title": "Brushes, Knives, and Application Tools",
                    "titleAm": "ብሩሾች, Knives, እና Application Tools"
                  },
                  {
                    "title": "Comparing the Media: Watercolor, Acrylic, Oil, Gouache, Tempera",
                    "titleAm": "ማነጻጸር Media: የውሃ ቀለም, Acrylic, Oil, ጉዋሽ, Tempera"
                  }
                ]
              },
              {
                "title": "Watercolor & Gouache",
                "titleAm": "የውሃ ቀለም & ጉዋሽ",
                "slug": "media-materials-and--painting-media--foundations-of-painting--watercolor-and-gouache",
                "lessons": [
                  {
                    "title": "Transparency, Washes, and Wet-on-Wet Technique",
                    "titleAm": "Transparency, Washes, እና Wet-on-Wet ቴክኒክ"
                  },
                  {
                    "title": "Dry Brush, Lifting, and Reserving Whites",
                    "titleAm": "Dry ብሩሽ, Lifting, እና Reserving Whites"
                  },
                  {
                    "title": "Gouache: Opaque Miniature and Design Work",
                    "titleAm": "ጉዋሽ: የማይታይ Miniature እና ንድፍ ሥራ"
                  }
                ]
              },
              {
                "title": "Acrylic & Oil Painting",
                "titleAm": "Acrylic & Oil ስዕል በቀለም",
                "slug": "media-materials-and--painting-media--foundations-of-painting--acrylic-and-oil-painting",
                "lessons": [
                  {
                    "title": "Acrylic: Fast Layering, Glazing, and Textural Techniques",
                    "titleAm": "Acrylic: Fast Layering, Glazing, እና Textural ቴክኒኮች"
                  },
                  {
                    "title": "Oil: Fat over Lean, Underpainting, and Grisaille",
                    "titleAm": "Oil: Fat over Lean, Underpainting, እና Grisaille"
                  },
                  {
                    "title": "Alla Prima and Layered Glazing Approaches",
                    "titleAm": "Alla Prima እና Layered Glazing Approaches"
                  },
                  {
                    "title": "Varnishing, Care, and Longevity of Paintings",
                    "titleAm": "Varnishing, Care, እና Longevity ስዕል በቀለምs"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Drawing Media & Illustration",
        "titleAm": "የስዕል መሣሪያዎች እና ምስል አዘጋገጃ",
        "slug": "media-materials-and--drawing-media-and-illustration",
        "children": [
          {
            "title": "Dry Media Mastery",
            "titleAm": "የደረቅ መሣሪያ ብቃት",
            "slug": "media-materials-and--drawing-media-and-illustration--dry-media-mastery",
            "children": [
              {
                "title": "Drawing Materials and Illustration Basics",
                "titleAm": "የስዕል ቁሳቁሶች እና Illustration መሠረታዊ ነገሮች",
                "slug": "media-materials-and--drawing-media-and-illustration--dry-media-mastery--drawing-materials-and-illustration-basics",
                "lessons": [
                  {
                    "title": "Graphite Grades and Pencil Control",
                    "titleAm": "ግራፋይት Grades እና እርሳስ Control"
                  },
                  {
                    "title": "Charcoal, Conté, and Chalk: Expressive Value Media",
                    "titleAm": "ከሰል, Conté, እና Chalk: ስሜት ገላጭ ብሩህነት Media"
                  },
                  {
                    "title": "Pen & Ink: Dip Pen, Nib Work, and Wash",
                    "titleAm": "Pen & ቀለም: Dip Pen, Nib ሥራ, እና Wash"
                  },
                  {
                    "title": "Colored Pencil and Pastel Layering",
                    "titleAm": "Colored እርሳስ እና Pastel Layering"
                  },
                  {
                    "title": "Illustration Workflow: Brief, Thumbnails, Roughs, Finish",
                    "titleAm": "Illustration Workflow: Brief, ትንሽ ንድፎች, Roughs, Finish"
                  }
                ]
              }
            ]
          },
          {
            "title": "Applied Illustration",
            "titleAm": "ተግባራዊ ምስል አዘጋገጃ",
            "slug": "media-materials-and--drawing-media-and-illustration--applied-illustration",
            "children": [
              {
                "title": "Illustration Genres",
                "titleAm": "",
                "slug": "media-materials-and--drawing-media-and-illustration--applied-illustration--illustration-genres",
                "lessons": [
                  {
                    "title": "Editorial Illustration: Concept and Metaphor",
                    "titleAm": "Editorial Illustration: Concept እና Metaphor"
                  },
                  {
                    "title": "Children's Book Illustration: Character and Sequence",
                    "titleAm": "ልጅren's መጽሐፍ Illustration: ባህሪ እና Sequence"
                  },
                  {
                    "title": "Scientific and Natural History Illustration",
                    "titleAm": "Scientific እና Natural ታሪክ Illustration"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Printmaking",
        "titleAm": "የሕትመት ጥበብ",
        "slug": "media-materials-and--printmaking",
        "children": [
          {
            "title": "Relief & Intaglio",
            "titleAm": "ሪሊፍ እና ኢንታሊዮ",
            "slug": "media-materials-and--printmaking--relief-and-intaglio",
            "children": [
              {
                "title": "Relief Printing Basics",
                "titleAm": "Relief Printing መሠረታዊ ነገሮች",
                "slug": "media-materials-and--printmaking--relief-and-intaglio--relief-printing-basics",
                "lessons": [
                  {
                    "title": "Relief Principles: Cutting Safety and Tool Handling",
                    "titleAm": "Relief Principles: Cutting Safety እና Tool Handling"
                  },
                  {
                    "title": "Linocut: Design, Carving, and Proofing",
                    "titleAm": "Linocut: ንድፍ, Carving, እና Proofing"
                  },
                  {
                    "title": "Woodblock Printing Traditions, Including East African parallels",
                    "titleAm": "እንጨትblock Printing Traditions, Including East African parallels"
                  },
                  {
                    "title": "Registration and Multi-Block Color Printing",
                    "titleAm": "Registration እና Multi-Block ቀለም Printing"
                  }
                ]
              },
              {
                "title": "Monotype, Intaglio & Screen Print",
                "titleAm": "",
                "slug": "media-materials-and--printmaking--relief-and-intaglio--monotype-intaglio-and-screen-print",
                "lessons": [
                  {
                    "title": "Monotype and Monoprint: The Painterly Print",
                    "titleAm": "Monotype እና Monoprint: Painterly Print"
                  },
                  {
                    "title": "Drypoint and Collagraph Introductions",
                    "titleAm": "Drypoint እና Collagraph Introductions"
                  },
                  {
                    "title": "Screen Printing: Stencils, Exposure, and Editioning",
                    "titleAm": "Screen Printing: Stencils, Exposure, እና Editioning"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Sculpture & 3D",
        "titleAm": "ቅርጻቅርጽ እና ሦስት-አቅጣጫዊ ጥበብ",
        "slug": "media-materials-and--sculpture-and-3d",
        "children": [
          {
            "title": "Additive & Subtractive Methods",
            "titleAm": "መደመር እና መቀነስ ዘዴዎች",
            "slug": "media-materials-and--sculpture-and-3d--additive-and-subtractive-methods",
            "children": [
              {
                "title": "Modeling Basics",
                "titleAm": "ቅርጽ መቅረጽ መሠረታዊ ነገሮች",
                "slug": "media-materials-and--sculpture-and-3d--additive-and-subtractive-methods--modeling-basics",
                "lessons": [
                  {
                    "title": "Clay Handling: Pinch, Coil, and Slab Methods",
                    "titleAm": "ሸክላ Handling: Pinch, Coil, እና Slab Methods"
                  },
                  {
                    "title": "Modeling a Small Figure or Relief in Clay",
                    "titleAm": "ቅርጽ መቅረጽ ትንሽ ምስል ወይም Relief ሸክላ"
                  },
                  {
                    "title": "Armatures: Building the Internal Skeleton",
                    "titleAm": ""
                  },
                  {
                    "title": "Simple Mold Making and Casting in Plaster",
                    "titleAm": "ቀላል Mold ማድረግ እና Casting Plaster"
                  }
                ]
              },
              {
                "title": "Construction & Carving",
                "titleAm": "",
                "slug": "media-materials-and--sculpture-and-3d--additive-and-subtractive-methods--construction-and-carving",
                "lessons": [
                  {
                    "title": "Assemblage and Constructed Sculpture",
                    "titleAm": "Assemblage እና Constructed ቅርጻቅርጽ"
                  },
                  {
                    "title": "Subtractive Carving: Soapstone, Wood, and Plaster Blocks",
                    "titleAm": "Subtractive Carving: Soapstone, እንጨት, እና Plaster Blocks"
                  },
                  {
                    "title": "Spatial Dynamics: Sculpture as Occupied Space (Foundation Studies Approach)",
                    "titleAm": "Spatial Dynamics: ቅርጻቅርጽ እንደ Occupied ቦታ (Foundation ጥናቶች Approach)"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Digital Art",
        "titleAm": "ዲጂታል ጥበብ",
        "slug": "media-materials-and--digital-art",
        "children": [
          {
            "title": "Digital Foundations",
            "titleAm": "ዲጂታል መሠረቶች",
            "slug": "media-materials-and--digital-art--digital-foundations",
            "children": [
              {
                "title": "Digital Drawing Foundations",
                "titleAm": "ዲጂታል ስዕል Foundations",
                "slug": "media-materials-and--digital-art--digital-foundations--digital-drawing-foundations",
                "lessons": [
                  {
                    "title": "Tablets, Software, and Workspace Setup",
                    "titleAm": "Tablets, Software, እና Workspace Setup"
                  },
                  {
                    "title": "Brushes, Layers, and Non-Destructive Workflows",
                    "titleAm": "ብሩሾች, Layers, እና Non-Destructive Workflows"
                  },
                  {
                    "title": "Digital Value and Color Studies from Traditional Sketches",
                    "titleAm": "ዲጂታል ብሩህነት እና ቀለም ጥናቶች ከ Traditional Sketches"
                  },
                  {
                    "title": "Line Art, Flatting, and Digital Painting Basics",
                    "titleAm": "መስመር ጥበብ, Flatting, እና ዲጂታል ስዕል በቀለም መሠረታዊ ነገሮች"
                  }
                ]
              },
              {
                "title": "Digital Practice & Output",
                "titleAm": "ዲጂታል ልምምድ & Output",
                "slug": "media-materials-and--digital-art--digital-foundations--digital-practice-and-output",
                "lessons": [
                  {
                    "title": "Photo Editing for Artists: Reference and Cleanup",
                    "titleAm": "Photo Editing ለ አርቲስቶች: ማጣቀሻ እና Cleanup"
                  },
                  {
                    "title": "Vector Basics for Design and Signage",
                    "titleAm": "Vector መሠረታዊ ነገሮች ለ ንድፍ እና Signage"
                  },
                  {
                    "title": "File Formats, Resolution, and Print vs. Screen Output",
                    "titleAm": "File ቅርጽats, Resolution, እና Print እና. Screen Output"
                  },
                  {
                    "title": "Online Presence: Sharing, Copyright, and Digital Portfolios",
                    "titleAm": "Online መገኘት: Sharing, Copyright, እና ዲጂታል የስራ ስብስብs"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Program Capstones",
    "titleAm": "የፕሮግራሙ የመጨረሻ ፕሮጀክቶች",
    "slug": "program-capstones",
    "children": [
      {
        "title": "Capstone Programs",
        "titleAm": "የመጨረሻ ፕሮጀክት ፕሮግራሞች",
        "slug": "program-capstones--capstone-programs",
        "children": [
          {
            "title": "Foundation Year Capstone (Parts I–III)",
            "titleAm": "የመሠረት ዓመት የመጨረሻ ፕሮጀክት (ክፍሎች I–III)",
            "slug": "program-capstones--capstone-programs--program-capstones--foundation-year-capstone-parts-i-iii",
            "lessons": [
              {
                "title": "Final Portfolio Review: 15 Finished Works Across Drawing, Color, and Composition",
                "titleAm": "የመጨረሻ የስራ ስብስብ ግምገማ: 15 በስዕል፣ በቀለም እና በቅንብር የተጠናቀቁ ስራዎች"
              }
            ]
          },
          {
            "title": "Figure Capstone (Part IV)",
            "titleAm": "የሰው ምስል የመጨረሻ ፕሮጀክት (Part IV)",
            "slug": "program-capstones--capstone-programs--program-capstones--figure-capstone-part-iv",
            "lessons": [
              {
                "title": "The Long-Pose Figure Marathon: 24-Hour Cumulative Pose Study",
                "titleAm": "የረጅም አቀማመጥ የሰው ምስል ማራቶን: 24-ሰዓት የተከማቸ አቀማመጥ ጥናት"
              }
            ]
          },
          {
            "title": "Heritage Capstone (Part V)",
            "titleAm": "የቅርስ የመጨረሻ ፕሮጀክት (Part V)",
            "slug": "program-capstones--capstone-programs--program-capstones--heritage-capstone-part-v",
            "lessons": [
              {
                "title": "The Complete Traditional Icon: From Panel Preparation to Consecration",
                "titleAm": "ሙሉ ባህላዊ ቅዱስ ሥዕል: ከሰሌዳ ዝግጅት እስከ ማስቀደስ"
              }
            ]
          },
          {
            "title": "Graduation Exhibition (All Parts)",
            "titleAm": "የምረቃ ኤግዚቢሽን (ሁሉም ክፍሎች)",
            "slug": "program-capstones--capstone-programs--program-capstones--graduation-exhibition-all-parts",
            "lessons": [
              {
                "title": "Curating, Hanging, and Presenting a Solo Exhibition with Artist Talk",
                "titleAm": "ማደራጀት፣ መስቀል እና ማቅረብ Solo Exhibition ከ አርቲስት Talk"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Young Artists Club",
    "titleAm": "የወጣት አርቲስቶች ክለብ",
    "slug": "young-artists-club",
    "children": [
      {
        "title": "Learning to See and Draw",
        "titleAm": "መመልከትንና መሳልን መማር",
        "slug": "young-artists-club--learning-to-see-and-draw",
        "children": [
          {
            "title": "Looking & Talking About Art",
            "titleAm": "ስለ ጥበብ መመልከት እና መነጋገር",
            "slug": "young-artists-club--learning-to-see-and-draw--looking-and-talking-about-art",
            "children": [
              {
                "title": "Learning to See",
                "titleAm": "መመልከትን መማር",
                "slug": "young-artists-club--learning-to-see-and-draw--looking-and-talking-about-art--learning-to-see",
                "children": [
                  {
                    "title": "Looking & Talking About Drawings",
                    "titleAm": "መመልከት & መነጋገር About ሥዕሎች",
                    "slug": "young-artists-club--learning-to-see-and-draw--looking-and-talking-about-art--learning-to-see--looking-and-talking-about-drawings",
                    "lessons": [
                      {
                        "title": "The Four Magic Questions: What Do I See? What Is Happening? How Does It Feel? Do I Like It?",
                        "titleAm": "አራት አስማታዊ ጥያቄዎች: ምን አየሁ? ምን እየተሰራ ነው? እንዴት ይሰማል? ወደድኩት?"
                      },
                      {
                        "title": "Comparing Two Pictures: Same and Different Game",
                        "titleAm": "ሁለት ስዕሎችን ማነጻጸር: ተመሳሳይ እና የተለየ ጨዋታ"
                      },
                      {
                        "title": "Kind Words About Friends' Art: Giving Gentle Feedback",
                        "titleAm": "መልካም ቃላት ስለ ጓደኞች ጥበብ: ለስላሳ አስተያየት መስጠት"
                      },
                      {
                        "title": "My Daily Look: Reviewing My Own Drawing for Two Minutes",
                        "titleAm": "የዕለቱ እይታዬ: የራሴን ስዕል መገምገም ለ ሁለት ደቂቃዎች"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Seeing Like an Artist",
                "titleAm": "እንደ አርቲስት ማየት",
                "slug": "young-artists-club--learning-to-see-and-draw--looking-and-talking-about-art--seeing-like-an-artist",
                "children": [
                  {
                    "title": "Seeing Like an Artist",
                    "titleAm": "እንደ አርቲስት ማየት",
                    "slug": "young-artists-club--learning-to-see-and-draw--looking-and-talking-about-art--seeing-like-an-artist--seeing-like-an-artist",
                    "lessons": [
                      {
                        "title": "Drawing What I See, Not What I Think I See (The Symbol Game)",
                        "titleAm": "የማየውን መሳል, የማስበውን አይደለም ( የምልክት ጨዋታ)"
                      },
                      {
                        "title": "Finding the Empty Spaces Around Things",
                        "titleAm": "በነገሮች ዙሪያ ያሉ ባዶ ቦታዎችን ማግኘት"
                      },
                      {
                        "title": "Upside-Down Drawing: A Tricky Brain Game",
                        "titleAm": "ተገላቢጦሽ ስዕል: አስቸጋሪ የአንጎል ጨዋታ"
                      },
                      {
                        "title": "My Pencil Is a Measuring Stick: Simple Sighting",
                        "titleAm": "እርሳሴ መለኪያ ነው: ቀላል መለካት"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "The Building Blocks of Drawing",
            "titleAm": "የስዕል ግንባታ ብሎኮች",
            "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing",
            "children": [
              {
                "title": "Dots, Lines, and Shapes",
                "titleAm": "ነጥቦች፣ መስመሮች እና ቅርጾች",
                "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--dots-lines-and-shapes",
                "children": [
                  {
                    "title": "Dots & Lines",
                    "titleAm": "ነጥብs & መስመሮች",
                    "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--dots-lines-and-shapes--dots-and-lines",
                    "lessons": [
                      {
                        "title": "A Million Dots: Making Pictures from Points",
                        "titleAm": "ሚሊዮን ነጥቦች: ከነጥቦች ስዕል መስራት"
                      },
                      {
                        "title": "Lines Have Feelings: Zigzag, Wavy, Soft, and Bold",
                        "titleAm": "መስመሮች ስሜት አላቸው: ዚግዛግ, Wavy, Soft, እና Bold"
                      },
                      {
                        "title": "Drawing My Shoe Without Looking: Blind Contour Fun",
                        "titleAm": "ዓይኔን ሳልጠቀም ጫማዬን መሳል: ዓይን ሳይጠቀሙ ኮንቱር ደስታ"
                      },
                      {
                        "title": "Fill It with Lines: Hatching like the Old Masters",
                        "titleAm": "በመስመሮች ሙላው: እንደ ጥንት ዋና አርቲስቶች ሃቺንግ"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Forms and Structures",
                "titleAm": "ቅርጾች እና መዋቅሮች",
                "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--forms-and-structures",
                "children": [
                  {
                    "title": "Shapes Into Forms",
                    "titleAm": "ቅርጽs ወደ ቅርጽs",
                    "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--forms-and-structures--shapes-into-forms",
                    "lessons": [
                      {
                        "title": "Flat Shapes to Puffy Forms: Ball, Box, Can, Cone",
                        "titleAm": "ከጠፍጣፋ ቅርጾች ወደ ድምብር ቅርጾች: ኳስ፣ ሳጥን፣ ጣሳ፣ ኮን"
                      },
                      {
                        "title": "Building Robots and Houses from Simple Forms",
                        "titleAm": "ሮቦቶች እና ቤቶች መስራት ከ ቀላል ቅርጾች"
                      },
                      {
                        "title": "Patterns All Around: Symmetry, Repeats, and Rhythm",
                        "titleAm": "በዙሪያው ያሉ ስርዓተ-ጥለቶች: ሲሜትሪ፣ ድግግሞሽ እና ሪዝም"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Light and Shadow",
                "titleAm": "ብርሃን እና ጥላ",
                "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--light-and-shadow",
                "children": [
                  {
                    "title": "Making Things Look 3D",
                    "titleAm": "",
                    "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--light-and-shadow--making-things-look-3d",
                    "lessons": [
                      {
                        "title": "Where Does the Light Come From? The Five Shading Spots",
                        "titleAm": "ብርሃን ከየት ይመጣል? አምስቱ የጥላ ቦታዎች"
                      },
                      {
                        "title": "Shading My Toy: Sphere, Cube, Cylinder",
                        "titleAm": "መጫወቻዬን ጥላ መስጠት: ሉል, ኩብ, ሲሊንደር"
                      },
                      {
                        "title": "Drawing My Own Shadow: Cast Shadows",
                        "titleAm": "የራሴን ጥላ መሳል: የሚወድቅ ጥላ"
                      }
                    ]
                  },
                  {
                    "title": "Light and Dark: The Magic of Tone",
                    "titleAm": "ብርሃን እና ጨለማ: የቶን አስማት",
                    "slug": "young-artists-club--learning-to-see-and-draw--the-building-blocks-of-drawing--light-and-shadow--light-and-dark-the-magic-of-tone",
                    "lessons": [
                      {
                        "title": "Making My Own Value Scale from Light to Dark",
                        "titleAm": "የራሴን የብሩህነት ደረጃ መስራት ከ ብርሃን ጨለማ"
                      },
                      {
                        "title": "One Lamp, Big Shadows: Drawing a Still Life by a Window",
                        "titleAm": "አንድ መብራት፣ ትልቅ ጥላ: በመስኮት አጠገብ የማይንቀሳቀስ ነገር መሳል"
                      },
                      {
                        "title": "Just Two Colors: The Notan Black-and-White Game",
                        "titleAm": "ሁለት ቀለሞች ብቻ: ኖታን ጥቁር-ነጭ ጨዋታ"
                      },
                      {
                        "title": "Dracula and Caravaggio: Super Dark and Dramatic Pictures",
                        "titleAm": "Dracula እና Caravaggio: በጣም ጨለማ እና አስደናቂ ስዕሎች"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Drawing Practice Every Day",
            "titleAm": "በየቀኑ የስዕል ልምምድ",
            "slug": "young-artists-club--learning-to-see-and-draw--drawing-practice-every-day",
            "children": [
              {
                "title": "My Sketchbook",
                "titleAm": "የእኔ ስኬች ደብተር",
                "slug": "young-artists-club--learning-to-see-and-draw--drawing-practice-every-day--my-sketchbook",
                "children": [
                  {
                    "title": "My Sketchbook Adventure",
                    "titleAm": "የስኬች ደብተሬ ጀብዱ",
                    "slug": "young-artists-club--learning-to-see-and-draw--drawing-practice-every-day--my-sketchbook--my-sketchbook-adventure",
                    "lessons": [
                      {
                        "title": "Making My Sketchbook Special: Cover Art and Drawing Ritual",
                        "titleAm": "ስኬች ደብተሬን ልዩ ማድረግ: የሽፋን ጥበብ እና የስዕል ልማድ"
                      },
                      {
                        "title": "Drawing at the Market: Sketching People and Fruit Stalls",
                        "titleAm": "በገበያ መሳል: ሰዎችን እና የፍራፍሬ ገበያዎችን መሳል"
                      },
                      {
                        "title": "Tiny Pictures, Big Ideas: Thumbnails",
                        "titleAm": "ትንሽ ስዕሎች፣ ትልቅ ሀሳቦች: ትንሽ ንድፎች"
                      },
                      {
                        "title": "My 30-Day Drawing Challenge Design",
                        "titleAm": "የ30 ቀን የስዕል ውድድሬ ንድፍ"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Still Life Fun",
                "titleAm": "የማይንቀሳቀስ ነገር ስዕል ደስታ",
                "slug": "young-artists-club--learning-to-see-and-draw--drawing-practice-every-day--still-life-fun",
                "children": [
                  {
                    "title": "Drawing Things on a Table",
                    "titleAm": "በጠረጴዛ ላይ ያሉ ነገሮችን መሳል",
                    "slug": "young-artists-club--learning-to-see-and-draw--drawing-practice-every-day--still-life-fun--drawing-things-on-a-table",
                    "lessons": [
                      {
                        "title": "Making a Still Life Look Nice: Arranging My Toys",
                        "titleAm": "የማይንቀሳቀስ ነገር ውብ ማድረግ: መጫወቻዎቼን ማዘጋጀት"
                      },
                      {
                        "title": "Shiny, Rough, Fuzzy: Drawing Different Textures",
                        "titleAm": "የሚያብረቀርቅ፣ ሸካራ፣ ለስላሳ: የተለያዩ ገጽታዎችን መሳል"
                      },
                      {
                        "title": "Cloth and Blankets: Drawing Folds",
                        "titleAm": "ጨርቅ እና ብርድ ልብስ: እጥፋቶችን መሳል"
                      },
                      {
                        "title": "My Big Finished Still Life Picture",
                        "titleAm": "የተጠናቀቀ ትልቅ ስዕሌ"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Color Magic",
        "titleAm": "የቀለም አስማት",
        "slug": "young-artists-club--color-magic",
        "children": [
          {
            "title": "Color Basics",
            "titleAm": "የቀለም መሠረታዊ ነገሮች",
            "slug": "young-artists-club--color-magic--color-basics",
            "children": [
              {
                "title": "The Color Wheel",
                "titleAm": "የቀለም ክብ",
                "slug": "young-artists-club--color-magic--color-basics--the-color-wheel",
                "children": [
                  {
                    "title": "My Color Wheel",
                    "titleAm": "የእኔ የቀለም ክብ",
                    "slug": "young-artists-club--color-magic--color-basics--the-color-wheel--my-color-wheel",
                    "lessons": [
                      {
                        "title": "Mixing My Own 12-Color Wheel",
                        "titleAm": "የራሴን 12-ቀለም ክብ መቀላቀል"
                      },
                      {
                        "title": "Primary Colors Are Bosses: Red, Yellow, Blue",
                        "titleAm": "መሠረታዊ ቀለሞች አለቆች ናቸው: ቀይ፣ ቢጫ፣ ሰማያዊ"
                      },
                      {
                        "title": "Color Has Three Secrets: Name, Brightness, Lightness",
                        "titleAm": "ቀለም ሦስት ምስጢሮች አሉት: ስም፣ ብሩህነት፣ ቀላልነት"
                      },
                      {
                        "title": "Dark and Light First: Grayscale Pictures Before Color",
                        "titleAm": "ጨለማ እና ብርሃን መጀመሪያ: ከቀለም በፊት ግራጫ ስዕሎች"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Color Feelings",
                "titleAm": "የቀለም ስሜቶች",
                "slug": "young-artists-club--color-magic--color-basics--color-feelings",
                "children": [
                  {
                    "title": "Warm and Cool Colors",
                    "titleAm": "ሞቅ እና ቀዝቃዛ ቀለሞች",
                    "slug": "young-artists-club--color-magic--color-basics--color-feelings--warm-and-cool-colors",
                    "lessons": [
                      {
                        "title": "Fire Colors and Ice Colors",
                        "titleAm": "የእሳት ቀለሞች እና የበረዶ ቀለሞች"
                      },
                      {
                        "title": "Sunny Side, Shady Side: Warm and Cool in Real Life",
                        "titleAm": "የፀሐይ ጎን፣ የጥላ ጎን: ሞቅ እና ቀዝቃዛ በእውነተኛ ሕይወት"
                      },
                      {
                        "title": "One Color, Two Jobs: Making the Same Color Feel Warm or Cool",
                        "titleAm": "አንድ ቀለም፣ ሁለት ስራዎች: ተመሳሳይ ቀለም ሞቅ ወይም ቀዝቃዛ እንዲሰማ ማድረግ"
                      }
                    ]
                  },
                  {
                    "title": "Colors That Are Friends",
                    "titleAm": "��ጎች የሆኑ ቀለሞች",
                    "slug": "young-artists-club--color-magic--color-basics--color-feelings--colors-that-are-friends",
                    "lessons": [
                      {
                        "title": "Best-Friend Colors and Opposite Colors",
                        "titleAm": "የቅርብ ጓደኛ ቀለሞች እና ተቃራኒ ቀለሞች"
                      },
                      {
                        "title": "One Boss Color and Its Helpers: The 80/20 Rule",
                        "titleAm": "አንድ ዋና ቀለም እና ረዳቶቹ: የ80/20 ደንብ"
                      },
                      {
                        "title": "Mixing Colors Without Making Mud",
                        "titleAm": "ጭቃ ሳይሆን ቀለም መቀላቀል"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Color Trickery and Science",
            "titleAm": "የቀለም ማታለያ እና ሳይንስ",
            "slug": "young-artists-club--color-magic--color-trickery-and-science",
            "children": [
              {
                "title": "Color Games (Albers Style)",
                "titleAm": "የቀለም ጨዋታዎች (የአልበርስ ዘይቤ)",
                "slug": "young-artists-club--color-magic--color-trickery-and-science--color-games-albers-style",
                "children": [
                  {
                    "title": "Color Optical Illusions",
                    "titleAm": "ቀለም Optical Illusions",
                    "slug": "young-artists-club--color-magic--color-trickery-and-science--color-games-albers-style--color-optical-illusions",
                    "lessons": [
                      {
                        "title": "One Color Looks Like Two: The Magic of Neighbors",
                        "titleAm": "አንድ ቀለም እንደ ሁለት ይመስላል: የጎረቤቶች አስማት"
                      },
                      {
                        "title": "Colors That Buzz: Afterimages",
                        "titleAm": "የሚንዘረዘሩ ቀለሞች: ከድምጽ በኋላ ምስሎች"
                      },
                      {
                        "title": "Fake Transparent Colors: Layering Trick",
                        "titleAm": "የሐሰት ግልጽ ቀለሞች: የሽፋን ዘዴ"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Colors in Pictures",
            "titleAm": "በስዕሎች ውስጥ ያሉ ቀለሞች",
            "slug": "young-artists-club--color-magic--colors-in-pictures",
            "children": [
              {
                "title": "Reading Color in Art",
                "titleAm": "በጥበብ ውስጥ ቀለምን ማንበብ",
                "slug": "young-artists-club--color-magic--colors-in-pictures--reading-color-in-art",
                "children": [
                  {
                    "title": "Reading Color in Famous Paintings",
                    "titleAm": "በታዋቂ ስዕሎች ውስጥ ቀለም ማንበብ",
                    "slug": "young-artists-club--color-magic--colors-in-pictures--reading-color-in-art--reading-color-in-famous-paintings",
                    "lessons": [
                      {
                        "title": "Colors and Feelings: Happy Palette, Sad Palette",
                        "titleAm": "ቀለሞች እና ስሜቶች: ደስተኛ ቀለሞች፣ አሳዛኝ ቀለሞች"
                      },
                      {
                        "title": "Colors in Ethiopian Church Paintings and Their Meanings",
                        "titleAm": "በኢትዮጵያ የቤተክርስቲያን ሥዕሎች ውስጥ ቀለሞች እና ትርጉሞቻቸው"
                      },
                      {
                        "title": "Finding the Quiet Color and the Loud Color in a Painting",
                        "titleAm": "ጸጥ ያለውን እና ጩኸት ያለውን ቀለም ማግኘት ስዕል በቀለም"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Making Pictures Fit",
        "titleAm": "ስዕሎችን ማስተካከል",
        "slug": "young-artists-club--making-pictures-fit",
        "children": [
          {
            "title": "Making Things Look Far Away",
            "titleAm": "ነገሮችን የሩቅ እንዲመስሉ ማድረግ",
            "slug": "young-artists-club--making-pictures-fit--making-things-look-far-away",
            "children": [
              {
                "title": "Perspective for Kids",
                "titleAm": "ለልጆች ፐርስፔክቲቭ",
                "slug": "young-artists-club--making-pictures-fit--making-things-look-far-away--perspective-for-kids",
                "children": [
                  {
                    "title": "The Road Gets Small: One-Point Perspective",
                    "titleAm": "Road Gets ትንሽ: አንድ-ነጥብ ፐርስፔክቲቭ",
                    "slug": "young-artists-club--making-pictures-fit--making-things-look-far-away--perspective-for-kids--the-road-gets-small-one-point-perspective",
                    "lessons": [
                      {
                        "title": "The Horizon Line: Where the Sky Meets the Ground",
                        "titleAm": "የሰድ መስመር: ሰማይ ከመሬት የሚገናኝበት"
                      },
                      {
                        "title": "My Dream Bedroom in Perspective",
                        "titleAm": "የህልሜ መኝታ ክፍል በፐርስፔክቲቭ"
                      },
                      {
                        "title": "Two-Point Perspective: Drawing a Street Corner",
                        "titleAm": "ሁለት-Point ፐርስፔክቲቭ: የመንገድ ማዕዘን መሳል"
                      },
                      {
                        "title": "Drawing Wheels and Cups: Ellipse Circles",
                        "titleAm": "ጎማዎችን እና ኩባያዎችን መሳል: ኤሊፕስ ክቦች"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Making Pictures Look Good",
            "titleAm": "ስዕሎችን ውብ ማድረግ",
            "slug": "young-artists-club--making-pictures-fit--making-pictures-look-good",
            "children": [
              {
                "title": "Composition Games",
                "titleAm": "የቅንብር ጨዋታዎች",
                "slug": "young-artists-club--making-pictures-fit--making-pictures-look-good--composition-games",
                "children": [
                  {
                    "title": "Where Should It Go?",
                    "titleAm": "የት መሆን አለበት?",
                    "slug": "young-artists-club--making-pictures-fit--making-pictures-look-good--composition-games--where-should-it-go",
                    "lessons": [
                      {
                        "title": "The Star of My Picture: Focal Points",
                        "titleAm": "የስዕሌ ኮከብ: የትኩረት ነጥቦች"
                      },
                      {
                        "title": "The Rule of Thirds: The Tic-Tac-Toe Trick",
                        "titleAm": "የሦስት ሕግ: የቲክ-ታክ-ቶ ዘዴ"
                      },
                      {
                        "title": "Balance Like a Seesaw: Heavy and Light Sides",
                        "titleAm": "እንደ ማወዛወዣ ሚዛን: ከባድ እና ቀላል ጎኖች"
                      },
                      {
                        "title": "Making a Picture Frame Inside My Picture",
                        "titleAm": "በስዕሌ ውስጥ ክፈፍ መስራት"
                      },
                      {
                        "title": "Ten Tiny Thumbnails: Trying Lots of Ideas Fast",
                        "titleAm": "አስር ትንሽ ንድፎች: ብዙ ሀሳቦችን በፍጥነት መሞከር"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Pictures That Tell Stories",
            "titleAm": "ታሪክ የሚናገሩ ስዕሎች",
            "slug": "young-artists-club--making-pictures-fit--pictures-that-tell-stories",
            "children": [
              {
                "title": "Story Pictures",
                "titleAm": "የታሪክ ስዕሎች",
                "slug": "young-artists-club--making-pictures-fit--pictures-that-tell-stories--story-pictures",
                "children": [
                  {
                    "title": "Telling a Story in One Picture",
                    "titleAm": "በአንድ ስዕል ታሪክ መናገር",
                    "slug": "young-artists-club--making-pictures-fit--pictures-that-tell-stories--story-pictures--telling-a-story-in-one-picture",
                    "lessons": [
                      {
                        "title": "What Happened Just Before and After? The Story Moment",
                        "titleAm": "ከዚህ በፊት እና በኋላ ምን ሆነ? የታሪኩ ቅጽበት"
                      },
                      {
                        "title": "My First Comic Strip: Three Boxes",
                        "titleAm": "የመጀመሪያዬ ኮሚክ ስትሪፕ: ሦስት ሳጥኖች"
                      },
                      {
                        "title": "Drawing Symbols: A Picture That Means Something More",
                        "titleAm": "ምልክቶችን መሳል: ከዚህ በላይ ትርጉም ያለው ስዕል"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "People and Animals",
        "titleAm": "ሰዎችና እንስሳት",
        "slug": "young-artists-club--people-and-animals",
        "children": [
          {
            "title": "Drawing People",
            "titleAm": "ሰዎችን መሳል",
            "slug": "young-artists-club--people-and-animals--drawing-people",
            "children": [
              {
                "title": "Body Basics",
                "titleAm": "የሰውነት መሠረታዊ ነገሮች",
                "slug": "young-artists-club--people-and-animals--drawing-people--body-basics",
                "children": [
                  {
                    "title": "How Tall Am I in Heads?",
                    "titleAm": "በጭንቅላት ስንት ነኝ?",
                    "slug": "young-artists-club--people-and-animals--drawing-people--body-basics--how-tall-am-i-in-heads",
                    "lessons": [
                      {
                        "title": "My Body Is About Seven Heads Tall: Kid Proportions",
                        "titleAm": "ሰውነቴ ወደ ሰባት ጭንቅላት ነው: የልጆች ተመጣጣኝነት"
                      },
                      {
                        "title": "Babies Are Different: Drawing Little Kids and Grown-Ups",
                        "titleAm": "ሕፃናት የተለያዩ ናቸው: ትንንሽ ልጆችን እና አዋቂዎችን መሳል"
                      },
                      {
                        "title": "Me and My Skeleton: Bones Hold Us Up",
                        "titleAm": "እኔ እና አጽሜ: አጥንቶች ይደግፉናል"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Faces",
                "titleAm": "ፊቶች",
                "slug": "young-artists-club--people-and-animals--drawing-people--faces",
                "children": [
                  {
                    "title": "Drawing Faces",
                    "titleAm": "ስዕል ፊቶች",
                    "slug": "young-artists-club--people-and-animals--drawing-people--faces--drawing-faces",
                    "lessons": [
                      {
                        "title": "Where Do the Eyes Go? Building My Face",
                        "titleAm": "ዓይኖች የት ይሄዳሉ? ፊቴን መገንባት"
                      },
                      {
                        "title": "Happy, Sad, Surprised: Drawing Feelings",
                        "titleAm": "ደስተኛ፣ አሳዛኝ፣ የተገረመ: ስሜቶችን መሳል"
                      },
                      {
                        "title": "Drawing My Friend: Getting a Likeness",
                        "titleAm": "ጓደኛዬን መሳል: መመሳሰል ማግኘት"
                      },
                      {
                        "title": "Drawing Hair as a Big Shape",
                        "titleAm": "ፀጉርን እንደ ትልቅ ቅርጽ መሳል"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Moving People",
                "titleAm": "የሚንቀሳቀሱ ሰዎች",
                "slug": "young-artists-club--people-and-animals--drawing-people--moving-people",
                "children": [
                  {
                    "title": "Quick People Sketches",
                    "titleAm": "",
                    "slug": "young-artists-club--people-and-animals--drawing-people--moving-people--quick-people-sketches",
                    "lessons": [
                      {
                        "title": "The Running Stick Figure: One-Line Action",
                        "titleAm": "የሚሮጥ ዘንግ ሰው: የአንድ መስመር ድርጊት"
                      },
                      {
                        "title": "Dancing, Jumping, Sitting: Quick Sketch Games",
                        "titleAm": "መጨፈር፣ መዝለል፣ መቀመጥ: ፈጣን የስኬች ጨዋታዎች"
                      },
                      {
                        "title": "Drawing Clothes That Move: Simple Folds",
                        "titleAm": "የሚንቀሳቀሱ ልብሶችን መሳል: ቀላል እጥፋቶች"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Hands and Gestures",
            "titleAm": "እጆች እና ምልክቶች",
            "slug": "young-artists-club--people-and-animals--hands-and-gestures",
            "children": [
              {
                "title": "Tricky Hands",
                "titleAm": "አስቸጋሪ እጆች",
                "slug": "young-artists-club--people-and-animals--hands-and-gestures--tricky-hands",
                "children": [
                  {
                    "title": "Drawing Hands and Feet",
                    "titleAm": "እጆችን እና እግሮችን መሳል",
                    "slug": "young-artists-club--people-and-animals--hands-and-gestures--tricky-hands--drawing-hands-and-feet",
                    "lessons": [
                      {
                        "title": "My Hand Is Like a Fan: Simple Hand Shapes",
                        "titleAm": "እጄ እንደ ማራገቢያ ነው: ቀላል የእጅ ቅርጾች"
                      },
                      {
                        "title": "Hands That Hold Things: Book, Cup, Pencil",
                        "titleAm": "ነገሮችን የሚይዙ እጆች: መጽሐፍ፣ ኩባያ፣ እርሳስ"
                      },
                      {
                        "title": "Feet and Shoes: Drawing Them Standing and Walking",
                        "titleAm": "እግሮች እና ጫማዎች: ቆመው እና ተራምደው መሳል"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Portrait Painting",
            "titleAm": "የፖርትሬት ስዕል",
            "slug": "young-artists-club--people-and-animals--portrait-painting",
            "children": [
              {
                "title": "Painting Faces",
                "titleAm": "ፊቶችን መሳል",
                "slug": "young-artists-club--people-and-animals--portrait-painting--painting-faces",
                "children": [
                  {
                    "title": "My First Portrait Painting",
                    "titleAm": "የመጀመሪያዬ የፖርትሬት ስዕል",
                    "slug": "young-artists-club--people-and-animals--portrait-painting--painting-faces--my-first-portrait-painting",
                    "lessons": [
                      {
                        "title": "Mixing Skin Colors: Every Skin Is Different and Beautiful",
                        "titleAm": "የቆዳ ቀለሞችን መቀላቀል: እያንዳንዱ ቆዳ የተለየ እና ውብ ነው"
                      },
                      {
                        "title": "Painting My Big Face: Block In First",
                        "titleAm": "ትልቁን ፊቴን መሳል: መጀመሪያ ግለጽ"
                      },
                      {
                        "title": "Eyes, Nose, Mouth in Paint",
                        "titleAm": "ዓይኖች፣ አፍንጫ፣ አፍ በቀለም"
                      },
                      {
                        "title": "Finishing My Portrait: Background and Details",
                        "titleAm": "ፖርትሬቴን ማጠናቀቅ: ዳራ እና ዝርዝሮች"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Ethiopian Icons and Sacred",
        "titleAm": "የኢትዮጵያ ቅዱሳት ሥዕላት",
        "slug": "young-artists-club--ethiopian-icons-and-sacred",
        "children": [
          {
            "title": "What Is an Icon?",
            "titleAm": "ቅዱስ ሥዕል ምንድን ነው?",
            "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon",
            "children": [
              {
                "title": "Pictures That Tell About God",
                "titleAm": "ስለ እግዚአብሔር የሚናገሩ ስዕሎች",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--pictures-that-tell-about-god",
                "children": [
                  {
                    "title": "Introduction to Ethiopian Icons",
                    "titleAm": "Introduction የኢትዮጵያ ቅዱሳት ሥዕላት",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--pictures-that-tell-about-god--introduction-to-ethiopian-icons",
                    "lessons": [
                      {
                        "title": "What Is an Icon? A Holy Picture with a Special Job",
                        "titleAm": "ቅዱስ ሥዕል ምንድን ነው? ልዩ ስራ ያለው ቅዱስ ስዕል"
                      },
                      {
                        "title": "Why Big Eyes and Bright Colors? The Language of Icons",
                        "titleAm": "ለምን ትልቅ ዓይን እና ብሩህ ቀለም? የቅዱሳት ሥዕላት ቋንቋ"
                      },
                      {
                        "title": "The First Artist: Making Pictures to Honor God",
                        "titleAm": "የመጀመሪያው አርቲስት: እግዚአብሔርን ለማክበር ስዕል መስራት"
                      },
                      {
                        "title": "Where Icons Live: Churches, Walls, and Old Books",
                        "titleAm": "ቅዱሳት ሥዕላት የሚኖሩበት: አብያተ ክርስቲያናት፣ ግድግዳዎች እና ጥንታዊ መጻሕፍት"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Stories Behind the Pictures",
                "titleAm": "ከስዕሎቹ በስተጀርባ ያሉ ታሪኮች",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--stories-behind-the-pictures",
                "children": [
                  {
                    "title": "Bible Stories Artists Paint",
                    "titleAm": "አርቲስቶች የሚሳሉት የመጽሐፍ ቅዱስ ታሪኮች",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--stories-behind-the-pictures--bible-stories-artists-paint",
                    "lessons": [
                      {
                        "title": "Angels on the Ark and the Bronze Snake: Very Old Pictures' Stories",
                        "titleAm": "መላእክት በታቦቱ ላይ እና የናሱ እባብ: የጥንታዊ ስዕሎች ታሪኮች"
                      },
                      {
                        "title": "Why We Paint Jesus: The Incarnation Made Simple",
                        "titleAm": "ለምን ኢየሱስን እንሳላለን: ሥጋ መልበስ በቀላል አቀራረብ"
                      },
                      {
                        "title": "Saint Luke the Painter and His Famous Hymn",
                        "titleAm": "ቅዱስ ሉቃስ ሣሪው እና ታዋቂው መዝሙሩ"
                      },
                      {
                        "title": "Icons Are Not Idols: Honor vs. Worship Made Simple",
                        "titleAm": "ቅዱሳት ሥዕላት ጣዖታት አይደሉም: ክብር እና አምልኮ በቀላል አቀራረብ"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Ethiopian Art Through Time",
                "titleAm": "የኢትዮጵያ ጥበብ በዘመናት ሁሉ",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--ethiopian-art-through-time",
                "children": [
                  {
                    "title": "A Journey Through Ethiopian Art",
                    "titleAm": "በኢትዮጵያ ጥበብ ውስጥ ጉዞ",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--what-is-an-icon--ethiopian-art-through-time--a-journey-through-ethiopian-art",
                    "lessons": [
                      {
                        "title": "Aksum and King Ezana: Where It Began",
                        "titleAm": "አክሱም እና King Ezana: የጀመረበት"
                      },
                      {
                        "title": "The Oldest Gospel Book: The Garima Gospels",
                        "titleAm": "በጣም ጥንታዊው የወንጌል መጽሐፍ: የጋሪማ ወንጌላት"
                      },
                      {
                        "title": "Churches Carved from Rock: Lalibela",
                        "titleAm": "ከዓለት የተፈለፈሉ አብያተ ክርስቲያናት: Lalibela"
                      },
                      {
                        "title": "The Gondar Painters: First and Second Styles",
                        "titleAm": "የጎንደር ሣሪዎች: የመጀመሪያው እና ሁለተኛው ቅጥ"
                      },
                      {
                        "title": "Different Places, Different Styles: Tigray, Gondar, Lake Tana, Shewa",
                        "titleAm": "የተለያዩ ቦታዎች፣ የተለያዩ ቅጦች: ትግራይ፣ ጎንደር፣ ጣና ሐይቅ፣ ሸዋ"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "The Secrets of Icon Pictures",
            "titleAm": "የቅዱሳት ሥዕላት ምስጢሮች",
            "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures",
            "children": [
              {
                "title": "Learning to Read an Icon",
                "titleAm": "ቅዱስ ሥዕልን ማንበብ መማር",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--learning-to-read-an-icon",
                "children": [
                  {
                    "title": "Reading Icons Like a Book",
                    "titleAm": "ቅዱሳት ሥዕላትን እንደ መጽሐፍ ማንበብ",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--learning-to-read-an-icon--reading-icons-like-a-book",
                    "lessons": [
                      {
                        "title": "Flat on Purpose: Icons Don't Try to Trick the Eye",
                        "titleAm": "በሆን ተንትኖ ጠፍጣፋ: ቅዱሳት ሥዕላት ዓይንን ለማታለል አይሞክሩም"
                      },
                      {
                        "title": "Who Is Biggest? Size Shows Importance",
                        "titleAm": "ማን ይበልጣል? መጠን አስፈላጊነትን ያሳያል"
                      },
                      {
                        "title": "Front Face, Side Face: Saints Face Us, Bad Guys Turn Away",
                        "titleAm": "የፊት ገጽታ፣ የጎን ገጽታ: ቅዱሳን ወደ እኛ ይመለከታሉ፣ ክፉዎች ይመለሳሉ"
                      },
                      {
                        "title": "What Are They Holding? Books, Crosses, and Scrolls",
                        "titleAm": "ምን ይዘዋል? መጻሕፍት፣ መስቀሎች እና ጥቅልሎች"
                      },
                      {
                        "title": "Colors with Meanings: Gold, Red, Blue, and Green",
                        "titleAm": "ትርጉም ያላቸው ቀለሞች: ወርቅ፣ ቀይ፣ ሰማያዊ እና አረንጓዴ"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Holy People We Paint",
                "titleAm": "የምንሳል ቅዱሳን ሰዎች",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--holy-people-we-paint",
                "children": [
                  {
                    "title": "Who Is Who in an Icon",
                    "titleAm": "በቅዱስ ሥዕል ውስጥ ማን ማን ነው",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--holy-people-we-paint--who-is-who-in-an-icon",
                    "lessons": [
                      {
                        "title": "Jesus in Icons: The Teacher and the Judge",
                        "titleAm": "ኢየሱስ በቅዱሳት ሥዕላት: አስተማሪው እና ፈራጁ"
                      },
                      {
                        "title": "Mary, Our Lady: The Virgin and Child",
                        "titleAm": "ማርያም እመቤታችን: ድንግል እና ሕፃኑ"
                      },
                      {
                        "title": "Angels with Wings and Swirling Robes",
                        "titleAm": "ክንፍ ያላቸው መላእክት እና የሚዞሩ ልብሶች"
                      },
                      {
                        "title": "Saints and Their Symbols: How to Recognize Them",
                        "titleAm": "ቅዱሳን እና ምልክቶቻቸው: እንዴት መለየት እንደሚቻል"
                      },
                      {
                        "title": "Horse Riders and Warrior Saints: St George and St Mercurius",
                        "titleAm": "ፈረሰኞች እና ተዋጊ ቅዱሳን: St George እና St Mercurius"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Crosses, Borders, and Letters",
                "titleAm": "መስቀሎች፣ ጠርዞች እና ፊደላት",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--crosses-borders-and-letters",
                "children": [
                  {
                    "title": "Drawing Crosses and Beautiful Letters",
                    "titleAm": "መስቀሎችን እና ውብ ፊደላትን መሳል",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--crosses-borders-and-letters--drawing-crosses-and-beautiful-letters",
                    "lessons": [
                      {
                        "title": "The Ethiopian Cross: Drawing It with Ruler and Compass",
                        "titleAm": "የኢትዮጵያ መስቀል: በሊኒያል እና ኮምፓስ መሳል"
                      },
                      {
                        "title": "Weaving Lines: Simple Interlace Patterns",
                        "titleAm": "መስመሮችን መሸመን: ቀላል የሽሮ ስርዓተ-ጥለቶች"
                      },
                      {
                        "title": "Ge'ez Letters Are Pictures Too: Calligraphy for Kids",
                        "titleAm": "የግዕዝ ፊደላትም ስዕሎች ናቸው: የእጅ ጽሕፈት ለልጆች"
                      },
                      {
                        "title": "Decorated Borders for My Own Manuscript Page",
                        "titleAm": "ለራሴ የፅሁፍ ገጽ ያጌጡ ጠርዞች"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Family Traditions Around the World",
                "titleAm": "በዓለም ዙሪያ ያሉ የቤተሰብ ትውፊቶች",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--family-traditions-around-the-world",
                "children": [
                  {
                    "title": "Icons Around the Orthodox World",
                    "titleAm": "ቅዱሳት ሥዕላት Around Orthodox World",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--the-secrets-of-icon-pictures--family-traditions-around-the-world--icons-around-the-orthodox-world",
                    "lessons": [
                      {
                        "title": "Egypt: Coptic Icons with Big Loving Eyes",
                        "titleAm": "ግብጽ: ትልቅ ፈቃደኛ ዓይን ያላቸው የቅብጢ ቅዱሳት ሥዕላት"
                      },
                      {
                        "title": "Greece, Turkey, Russia: Byzantine and Russian Gold Icons",
                        "titleAm": "ግሪክ፣ ቱርክ፣ ሩሲያ: የብያንዛንታይን እና የሩሲያ የወርቅ ቅዱሳት ሥዕላት"
                      },
                      {
                        "title": "India: Beautiful Kerala Church Paintings",
                        "titleAm": "ህንድ: ውብ የኬራላ የቤተክርስቲያን ሥዕሎች"
                      },
                      {
                        "title": "Same Faith, Different Styles: A Friendly Comparison",
                        "titleAm": "አንድ እምነት፣ የተለያዩ ቅጦች: ወዳጃዊ ንጽጽር"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Junior Icon Studio — Try It Yourself!",
            "titleAm": "የወጣት ቅዱስ ሥዕል ስቱዲዮ — ራስዎ ይሞክሩት!",
            "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself",
            "children": [
              {
                "title": "Drawing Like an Icon Painter",
                "titleAm": "እንደ ቅዱስ ሥዕል ሣሪ መሳል",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--drawing-like-an-icon-painter",
                "children": [
                  {
                    "title": "The Strong Line",
                    "titleAm": "Strong መስመር",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--drawing-like-an-icon-painter--the-strong-line",
                    "lessons": [
                      {
                        "title": "Regular skill: drawing one confident line without stopping → Icon activity: drawing a long, careful outline of a saint → Look and Compare: Coptic painters use thick bold lines, Ethiopian painters use thin smooth lines",
                        "titleAm": "መደበኛ ክህሎት: ሳታቆሙ አንድ በራስ መተማመን የተሳለ መስመር መሳል → የቅዱስ ሥዕል ተግባር: ስዕል long, careful outline ቅዱስ → ተመልከት እና አወዳድር: ቅብጢ painters use thick bold መስመሮች, የኢትዮጵያ painters use thin smooth መስመሮች"
                      },
                      {
                        "title": "Regular skill: finding shapes inside pictures → Icon activity: finding circles and triangles hiding in an icon → Look and Compare: Russian icons use circles for halos too",
                        "titleAm": "መደበኛ ክህሎት: በስዕሎች ውስጥ ቅርጾችን ማግኘት → የቅዱስ ሥዕል ተግባር: finding circles እና triangles hiding ቅዱስ ሥዕል → ተመልከት እና አወዳድር: Russian ቅዱሳት ሥዕላት use circles ለ halos too"
                      },
                      {
                        "title": "Regular skill: careful copying to learn → Icon activity: copying a simple saint drawing the traditional way → Look and Compare: icon painters have always learned by copying masters",
                        "titleAm": "መደበኛ ክህሎት: ለመማር በጥንቃቄ መቅዳት → የቅዱስ ሥዕል ተግባር: copying simple ቅዱስ ስዕል traditional way → ተመልከት እና አወዳድር: ቅዱስ ሥዕል painters have always learned copying ዋና አርቲስቶች"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Light Without Shadows",
                "titleAm": "ያለ ጥላ ብርሃን",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--light-without-shadows",
                "children": [
                  {
                    "title": "Icons Glow from Inside",
                    "titleAm": "ቅዱሳት ሥዕላት Glow ከ Inside",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--light-without-shadows--icons-glow-from-inside",
                    "lessons": [
                      {
                        "title": "Regular skill: my three-step value scale → Icon activity: coloring a saint with no shadows — light that comes from within → Look and Compare: Russian painters add white highlight dots to faces",
                        "titleAm": "መደበኛ ክህሎት: የሦስት-ደረጃ የብሩህነት ደረጃዬ → የቅዱስ ሥዕል ተግባር: coloring ቅዱስ ከ no ጥላዎች — ብርሃን ያ comes ከ within → ተመልከት እና አወዳድር: Russian painters add white highlight dots ፊቶች"
                      },
                      {
                        "title": "Regular skill: one color, many pressures → Icon activity: an earth-toned face in gentle layers → Look and Compare: how Gondarine faces glow with warm reds",
                        "titleAm": "መደበኛ ክህሎት: አንድ ቀለም፣ ብዙ ግፊቶች → የቅዱስ ሥዕል ተግባር: earth-toned ፊት gentle layers → ተመልከት እና አወዳድር: how ጎንደርine ፊቶች glow ከ warm reds"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "The Icon Face",
                "titleAm": "የቅዱስ ሥዕል ፊት",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--the-icon-face",
                "children": [
                  {
                    "title": "Drawing the Icon Face",
                    "titleAm": "ስዕል ቅዱስ ሥዕል ፊት",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--the-icon-face--drawing-the-icon-face",
                    "lessons": [
                      {
                        "title": "Regular skill: drawing a front-facing face → Icon activity: big almond eyes, long nose line, small closed mouth → Look and Compare: Coptic icons also have big eyes — both show watching for God",
                        "titleAm": "መደበኛ ክህሎት: ፊት ቀጥ ብሎ ያለ ፊት መሳል → የቅዱስ ሥዕል ተግባር: big almond eyes, long nose መስመር, small closed mouth → ተመልከት እና አወዳድር: ቅብጢ ቅዱሳት ሥዕላት also have big eyes — both show watching ለ God"
                      },
                      {
                        "title": "Regular skill: drawing six different friends' faces → Icon activity: six icon face types — Christ, Mary, Angel, Young Saint, Old Saint → Look and Compare: every tradition paints Jesus a little differently",
                        "titleAm": "መደበኛ ክህሎት: የስድስት የተለያዩ ጓደኞች ፊቶችን መሳል → የቅዱስ ሥዕል ተግባር: six ቅዱስ ሥዕል ፊት types — ክርስቶስ, Mary, መልአክ, ወጣት ቅዱስ, Old ቅዱስ → ተመልከት እና አወዳድር: every tradition paints Jesus little differently"
                      },
                      {
                        "title": "Regular skill: drawing kind hands → Icon activity: a hand making a blessing and holding a cross → Look and Compare: hand signs in Byzantine icons",
                        "titleAm": "መደበኛ ክህሎት: ደግ እጆችን መሳል → የቅዱስ ሥዕል ተግባር: እጅ making blessing እና holding መስቀል → ተመልከት እና አወዳድር: እጅ signs ብያንዛንታይን ቅዱሳት ሥዕላት"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "Colors and Materials",
                "titleAm": "ቀለሞች እና ቁሳቁሶች",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--colors-and-materials",
                "children": [
                  {
                    "title": "Natural Colors from the Earth",
                    "titleAm": "Natural ቀለሞች ከ Earth",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--colors-and-materials--natural-colors-from-the-earth",
                    "lessons": [
                      {
                        "title": "Regular skill: mixing my own paints → Icon activity: earth colors from soil and rocks, like the old masters → Look and Compare: Indian painters used ground minerals too",
                        "titleAm": "መደበኛ ክህሎት: የራሴን ቀለም መቀላቀል → የቅዱስ ሥዕል ተግባር: earth ቀለሞች ከ soil እና rocks, like old ዋና አርቲስቶች → ተመልከት እና አወዳድር: ህንድn painters used ground minerals too"
                      },
                      {
                        "title": "Regular skill: making egg tempera → Icon activity: painting with egg yolk paint like real icon painters → Look and Compare: Byzantine and Russian painters also used egg tempera",
                        "titleAm": "መደበኛ ክህሎት: የእንቁላል ቀለም መስራት → የቅዱስ ሥዕል ተግባር: painting ከ egg yolk paint like real ቅዱስ ሥዕል painters → ተመልከት እና አወዳድር: ብያንዛንታይን እና Russian painters also used egg tempera"
                      },
                      {
                        "title": "Regular skill: choosing a small set of colors → Icon activity: coloring an icon where every color has a meaning → Look and Compare: gold means heaven in Russian and Byzantine icons",
                        "titleAm": "መደበኛ ክህሎት: ትንሽ የቀለም ስብስብ መምረጥ → የቅዱስ ሥዕል ተግባር: coloring ቅዱስ ሥዕል where every ቀለም has meaning → ተመልከት እና አወዳድር: gold means heaven Russian እና ብያንዛንታይን ቅዱሳት ሥዕላት"
                      }
                    ]
                  }
                ]
              },
              {
                "title": "My First Icon",
                "titleAm": "የመጀመሪያዬ ቅዱስ ሥዕል",
                "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--my-first-icon",
                "children": [
                  {
                    "title": "My First Icon Project (Mini Capstone)",
                    "titleAm": "የመጀመሪያዬ ቅዱስ ሥዕል ፕሮጀክት (Mini Capstone)",
                    "slug": "young-artists-club--ethiopian-icons-and-sacred--junior-icon-studio-try-it-yourself--my-first-icon--my-first-icon-project-mini-capstone",
                    "lessons": [
                      {
                        "title": "Getting Ready: Choosing My Saint and Saying a Quiet Thank-You",
                        "titleAm": "መዘጋጀት: ቅዱሴን መምረጥ እና በጸጥታ ማመስገን"
                      },
                      {
                        "title": "Drawing the Design: Careful Lines and a Border",
                        "titleAm": "ንድፉን መሳል: ጥንቃቂ መስመሮች እና ጠርዝ"
                      },
                      {
                        "title": "Painting the Colors in Order: Clothes First, Face Last",
                        "titleAm": "ቀለሞችን በቅደም ተከተል መሳል: ልብስ መጀመሪያ፣ ፊት መጨረሻ"
                      },
                      {
                        "title": "Writing the Name and Showing My Icon to My Family",
                        "titleAm": "ስሙን መጻፍ እና ቅዱስ ሥዕሌን ለቤተሰቤ ማሳየት"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Art Time Travel",
        "titleAm": "በጥበብ ዘመን ጉዞ",
        "slug": "young-artists-club--art-time-travel",
        "children": [
          {
            "title": "Long, Long Ago",
            "titleAm": "ከረጅም ዘመን በፊት",
            "slug": "young-artists-club--art-time-travel--long-long-ago",
            "children": [
              {
                "title": "Cave to Castle",
                "titleAm": "ከዋሻ እስከ ቤተመንግስት",
                "slug": "young-artists-club--art-time-travel--long-long-ago--cave-to-castle",
                "children": [
                  {
                    "title": "From Caves to Cathedrals",
                    "titleAm": "ከ Caves Cathedrals",
                    "slug": "young-artists-club--art-time-travel--long-long-ago--cave-to-castle--from-caves-to-cathedrals",
                    "lessons": [
                      {
                        "title": "Painters in Caves: Animals on Stone Walls",
                        "titleAm": "ሣሪዎች በዋሻ ውስጥ: እንስሳት በዓለት ግድግዳዎች ላይ"
                      },
                      {
                        "title": "Pyramids and Ancient Kings: Egypt, Nubia, Aksum",
                        "titleAm": "ፒራሚዶች እና ጥንታዊ ነገሥታት: ግብጽ፣ ኑቢያ፣ አክሱም"
                      },
                      {
                        "title": "Greece and Rome: Statues and Vases",
                        "titleAm": "ግሪክ እና ሮም: ሐውልቶች እና የዕቃ ማስቀመጫዎች"
                      },
                      {
                        "title": "Castles and Cathedrals: Stained Glass Stories",
                        "titleAm": "ቤተመንግሥቶች እና የቤተክርስቲያን ሕንጻዎች: በብርጭቆ የተሳሉ ታሪኮች"
                      },
                      {
                        "title": "Rock Churches of Africa: Lalibela and Great Zimbabwe",
                        "titleAm": "የአፍሪካ የዓለት አብያተ ክርስቲያናት: ላሊበላ እና ታላቁ ዚምባብዌ"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Then Came Change",
            "titleAm": "ከዚያም ለውጥ መጣ",
            "slug": "young-artists-club--art-time-travel--then-came-change",
            "children": [
              {
                "title": "Renaissance to Now",
                "titleAm": "ከህዳሴ እስከ አሁን",
                "slug": "young-artists-club--art-time-travel--then-came-change--renaissance-to-now",
                "children": [
                  {
                    "title": "Artists Who Changed Everything",
                    "titleAm": "አርቲስቶች ማን Changed Everything",
                    "slug": "young-artists-club--art-time-travel--then-came-change--renaissance-to-now--artists-who-changed-everything",
                    "lessons": [
                      {
                        "title": "Leonardo and Michelangelo: The Superstar Artists",
                        "titleAm": "ሊዮናርዶ እና ሚካኤልአንጀሎ: ኮከብ አርቲስቶቹ"
                      },
                      {
                        "title": "Caravaggio: The Master of Drama and Shadows",
                        "titleAm": "Caravaggio: የድራማ እና የጥላ ጌታ"
                      },
                      {
                        "title": "Monet: Painting Sunlight",
                        "titleAm": "Monet: የፀሐይ ብርሃን መሳል"
                      },
                      {
                        "title": "Picasso: Breaking Faces into Pieces",
                        "titleAm": "Picasso: ፊቶችን ወደ ክፍሎች መስበር"
                      },
                      {
                        "title": "Art Today: From Addis Ababa to the Whole World",
                        "titleAm": "የዛሬ ጥበብ: ከአዲስ አበባ ወደ መላው ዓለም"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Ethiopian and African Art",
            "titleAm": "የኢትዮጵያ እና የአፍሪካ ጥበብ",
            "slug": "young-artists-club--art-time-travel--ethiopian-and-african-art",
            "children": [
              {
                "title": "Our Heritage",
                "titleAm": "የእኛ ቅርስ",
                "slug": "young-artists-club--art-time-travel--ethiopian-and-african-art--our-heritage",
                "children": [
                  {
                    "title": "Ethiopian Art Through the Centuries (Junior)",
                    "titleAm": "የኢትዮጵያ ጥበብ Through Centuries (Junior)",
                    "slug": "young-artists-club--art-time-travel--ethiopian-and-african-art--our-heritage--ethiopian-art-through-the-centuries-junior",
                    "lessons": [
                      {
                        "title": "Crosses, Crowns, and Illuminated Books",
                        "titleAm": "መስቀሎች፣ ዘውዶች እና ያጌጡ መጻሕፍት"
                      },
                      {
                        "title": "The Gondar Workshop: Painting Families",
                        "titleAm": "የጎንደር ወርክሾፕ: የሣሪዎች ቤተሰቦች"
                      },
                      {
                        "title": "Modern Ethiopian Artists: Painting Today",
                        "titleAm": "ዘመናዊ የኢትዮጵያ አርቲስቶች: የዛሬ ስዕል"
                      },
                      {
                        "title": "Looking at Art: My Museum Adventure Checklist",
                        "titleAm": "ጥበብን መመልከት: የሙዚየም ጀብዴ ዝርዝር"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "title": "Try Everything!",
        "titleAm": "ሁሉንም ይሞክሩ!",
        "slug": "young-artists-club--try-everything",
        "children": [
          {
            "title": "Painting",
            "titleAm": "ስዕል በቀለም",
            "slug": "young-artists-club--try-everything--painting",
            "children": [
              {
                "title": "Painting Fun",
                "titleAm": "የመሳል ደስታ",
                "slug": "young-artists-club--try-everything--painting--painting-fun",
                "children": [
                  {
                    "title": "First Painting Studio",
                    "titleAm": "የመጀመሪያ ስዕል በቀለም ስቱዲዮ",
                    "slug": "young-artists-club--try-everything--painting--painting-fun--first-painting-studio",
                    "lessons": [
                      {
                        "title": "Watercolor Magic: Wet Paper, Wet Paint",
                        "titleAm": "የውሃ ቀለም አስማት: እርጥብ ወረቀት፣ እርጥብ ቀለም"
                      },
                      {
                        "title": "Acrylics Dry Fast: Layering Colors",
                        "titleAm": "አክሬሊክ በፍጥነት ይደርቃል: ቀለሞችን መደራረብ"
                      },
                      {
                        "title": "Painting Big: My First Canvas",
                        "titleAm": "በትልቅ መሳል: የመጀመሪያዬ ሸራ"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Drawing and More",
            "titleAm": "ስዕል እና ሌሎችም",
            "slug": "young-artists-club--try-everything--drawing-and-more",
            "children": [
              {
                "title": "Drawing Materials",
                "titleAm": "የስዕል ቁሳቁሶች",
                "slug": "young-artists-club--try-everything--drawing-and-more--drawing-materials",
                "children": [
                  {
                    "title": "Pencils, Chalk, and Ink",
                    "titleAm": "እርሳሶች፣ ኖራ እና ቀለም",
                    "slug": "young-artists-club--try-everything--drawing-and-more--drawing-materials--pencils-chalk-and-ink",
                    "lessons": [
                      {
                        "title": "My Pencil Set: From Light H to Dark B",
                        "titleAm": "የእርሳስ ስብስቤ: ከቀላል H እስከ ጨለማ B"
                      },
                      {
                        "title": "Charcoal Is Messy Fun: Drawing with Sticks",
                        "titleAm": "ከሰል ቆሽሾ ደስታ ነው: በዘንጎች መሳል"
                      },
                      {
                        "title": "Pen and Ink: Drawing with Dots and Lines",
                        "titleAm": "ብዕር እና ቀለም: በነጥቦች እና መስመሮች መሳል"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Printmaking",
            "titleAm": "የሕትመት ጥበብ",
            "slug": "young-artists-club--try-everything--printmaking",
            "children": [
              {
                "title": "Printing Pictures",
                "titleAm": "ስዕሎችን ማተም",
                "slug": "young-artists-club--try-everything--printmaking--printing-pictures",
                "children": [
                  {
                    "title": "Make Many Copies!",
                    "titleAm": "ብዙ ቅጂዎች ስራ!",
                    "slug": "young-artists-club--try-everything--printmaking--printing-pictures--make-many-copies",
                    "lessons": [
                      {
                        "title": "Potato and Foam Printing: My First Stamp",
                        "titleAm": "ድንች እና ስፖንጅ ህትመት: የመጀመሪያዬ ማህተም"
                      },
                      {
                        "title": "Card Printing: Carving a Simple Design",
                        "titleAm": "በካርድ ህትመት: ቀላል ንድፍ መቅረጽ"
                      },
                      {
                        "title": "Printing Two Colors: My Limited Edition",
                        "titleAm": "ሁለት ቀለም ማተም: የእኔ የተወሰነ እትም"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Sculpture and 3D",
            "titleAm": "ቅርጻቅርጽ እና ሦስት-አቅጣጫዊ",
            "slug": "young-artists-club--try-everything--sculpture-and-3d",
            "children": [
              {
                "title": "Making Things You Can Hold",
                "titleAm": "የሚይዙትን ነገሮች መስራት",
                "slug": "young-artists-club--try-everything--sculpture-and-3d--making-things-you-can-hold",
                "children": [
                  {
                    "title": "Clay and Dough Studio",
                    "titleAm": "የሸክላ እና የዱቄት ስቱዲዮ",
                    "slug": "young-artists-club--try-everything--sculpture-and-3d--making-things-you-can-hold--clay-and-dough-studio",
                    "lessons": [
                      {
                        "title": "Pinch Pots and Snake Coils",
                        "titleAm": "የተነከሱ ሸክላዎች እና የእባብ ጥቅሎች"
                      },
                      {
                        "title": "Making a Small Clay Animal",
                        "titleAm": "ትንሽ የሸክላ እንስሳ መስራት"
                      },
                      {
                        "title": "Building Tall: Cardboard and Paper Sculpture",
                        "titleAm": "ከፍ ብሎ መገንባት: የካርድቦርድ እና የወረቀት ቅርጻቅርጽ"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Digital Art",
            "titleAm": "ዲጂታል ጥበብ",
            "slug": "young-artists-club--try-everything--digital-art",
            "children": [
              {
                "title": "Art on Screens",
                "titleAm": "በስክሪን ላይ ጥበብ",
                "slug": "young-artists-club--try-everything--digital-art--art-on-screens",
                "children": [
                  {
                    "title": "Drawing on Tablets",
                    "titleAm": "በታብሌት መሳል",
                    "slug": "young-artists-club--try-everything--digital-art--art-on-screens--drawing-on-tablets",
                    "lessons": [
                      {
                        "title": "My First Digital Drawing: Layers Are Magic Sheets",
                        "titleAm": "የመጀመሪያዬ ዲጂታል ስዕል: ሽፋኖች አስማታዊ ገጾች ናቸው"
                      },
                      {
                        "title": "Undo Is My Friend: Trying Without Fear",
                        "titleAm": "መመለስ ጓደኛዬ ነው: ያለ ፍርሃት መሞከር"
                      },
                      {
                        "title": "Making a Digital Birthday Card for Someone",
                        "titleAm": "ለአንድ ሰው ዲጂታል የልደት ካርድ መስራት"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "title": "Being a Young Artist",
            "titleAm": "ወጣት አርቲስት መሆን",
            "slug": "young-artists-club--try-everything--being-a-young-artist",
            "children": [
              {
                "title": "My Art Habits",
                "titleAm": "የእኔ የጥበብ ልምዶች",
                "slug": "young-artists-club--try-everything--being-a-young-artist--my-art-habits",
                "children": [
                  {
                    "title": "Growing As a Young Artist",
                    "titleAm": "Growing እንደ ወጣት አርቲስት",
                    "slug": "young-artists-club--try-everything--being-a-young-artist--my-art-habits--growing-as-a-young-artist",
                    "lessons": [
                      {
                        "title": "My Art Corner: Making a Little Studio at Home",
                        "titleAm": "የጥበቤ ማዕዘን: በቤት ውስጥ ትንሽ ስቱዲዮ መስራት"
                      },
                      {
                        "title": "Finishing What I Start: Knowing When It's Done",
                        "titleAm": "የጀመርኩትን ማጠናቀቅ: ሞቶ መቼ እንደሆነ ማወቅ"
                      },
                      {
                        "title": "Sharing My Art: Taking Photos and Making a Mini Portfolio",
                        "titleAm": "ጥበቤን ማጋራት: ፎቶ ማንሳት እና ትንሽ ስብስብ መስራት"
                      },
                      {
                        "title": "My Art Story: Talking About My Favorite Picture and hold a family gallery night. it means. period. print, tablet — at the club celebration.",
                        "titleAm": "የጥበቤ ታሪክ: ስለምወደው ስዕል ማውራት እና የቤተሰብ ጋለሪ ምሽት ማድረግ. እሱ means. period. print, tablet — በክለቡ በዓል ላይ."
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export default CURRICULUM;
