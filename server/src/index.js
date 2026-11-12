import mongoose from 'mongoose';

// አርቲስት አብርሃምን አድሚን ለማድረግ የሚረዳ ጊዜያዊ ስክሪፕት
setTimeout(async () => {
  try {
    const db = mongoose.connection;
    if (db && db.readyState === 1) {
      const result = await db.collection('users').updateOne(
        { email: 'artistabraham@gmail.com' },
        { $set: { role: 'admin' } }
      );
      if (result.matchedCount > 0) {
        console.log('✔ User role successfully updated to admin for: artistabraham@gmail.com');
      } else {
        console.log('ℹ User with email artistabraham@gmail.com not found yet in database.');
      }
    }
  } catch (err) {
    console.error('Error auto-updating user role to admin:', err);
  }
}, 3000);