const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const uri = 'mongodb://joabniguise_db_user:Ic5KDzHhY1idSpF5@ac-uqc5avk-shard-00-00.7ysqznl.mongodb.net:27017,ac-uqc5avk-shard-00-01.7ysqznl.mongodb.net:27017,ac-uqc5avk-shard-00-02.7ysqznl.mongodb.net:27017/?ssl=true&replicaSet=atlas-ripqo4-shard-0&authSource=admin&appName=Cluster0';
const emails = ['joabnigusie@gmail.com', 'yoni@gmail.com', 'eyoab@gmail.com', 'saub@gmail.com'];
const password = '123456';

(async () => {
  try {
    await mongoose.connect(uri, { dbName: 'educonnect' });
    const hashed = await bcrypt.hash(password, 10);

    for (const email of emails) {
      const name = email.split('@')[0];
      let user = await User.findOne({ email });
      if (user) {
        user.name = user.name || name;
        user.role = 'teacher';
        user.password = hashed;
        await user.save();
        console.log(`Updated ${email}`);
      } else {
        user = new User({ name, email, password, role: 'teacher' });
        await user.save();
        console.log(`Created ${email}`);
      }
    }

    const all = await User.find({ email: { $in: emails } }).select('email role name');
    console.log('Users:', JSON.stringify(all, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
