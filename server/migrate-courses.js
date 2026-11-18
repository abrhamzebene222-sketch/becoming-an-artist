import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category, Course } from './src/models/index.js';

// .env ፋይልን ማንበብ እንዲችል
dotenv.config();

async function migrateCoursesToSubgroups() {
  try {
    // ከ .env የሚመጣውን ወይም ቀጥተኛውን የ MongoDB URI መጠቀም
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/becoming-an-artist';
    
    console.log('🔄 ከዳታቤዝ ጋር እየተገናኘ ነው...');
    await mongoose.connect(mongoUri);
    console.log('✅ ከዳታቤዝ ጋር በተሳካ ሁኔታ ተገናኝቷል!');

    const courses = await Course.find({});
    console.log(`📦 በጠቅላላ ${courses.length} ኮርሶች ተገኝተዋል።`);

    if (courses.length === 0) {
      console.log('⚠️ ምንም ኮርሶች በዳታቤዝ ውስጥ አልተገኙም። እባክዎ ዳታቤዙ ትክክል መሆኑን ይፈትሹ።');
      process.exit(0);
    }

    for (const course of courses) {
      const groupSlug = `${course.slug}-group`;
      
      let subgroup = await Category.findOne({ slug: groupSlug });
      if (!subgroup) {
        subgroup = await Category.create({
          parent: course.category,
          title: course.title,
          titleAm: course.titleAm || course.title,
          slug: groupSlug,
          description: course.summary || '',
          descriptionAm: course.summaryAm || '',
          isFree: course.isFree,
          priceEtb: course.priceEtb,
        });
        console.log(`📁 አዲስ ሰብ-ግሩፕ ተፈጠረ: ${subgroup.title}`);
      }

      course.category = subgroup._id;
      await course.save();
      console.log(`✅ ኮርሱ [${course.title}] ወደ አዲሱ ሰብ-ግሩፕ ተጠቃለለ!`);
    }

    console.log('🎉 ሁሉም ኮርሶች በተሳካ ሁኔታ ወደየራሳቸው ሰብ-ግሩፖች ተዛውረዋል!');
    process.exit(0);
  } catch (error) {
    console.error('❌ በሂደት ላይ ስህተት ተፈጥሯል:', error);
    process.exit(1);
  }
}

migrateCoursesToSubgroups();