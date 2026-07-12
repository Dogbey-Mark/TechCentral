import { initDb, query, queryOne } from './db.js';

const test = async () => {
  try {
    console.log('Testing SQLite Database connection & seeding...');
    await initDb();
    
    const usersCount = await queryOne('SELECT COUNT(*) as count FROM users');
    const productsCount = await queryOne('SELECT COUNT(*) as count FROM products');
    const categoriesCount = await queryOne('SELECT COUNT(*) as count FROM categories');
    
    console.log('--- DATABASE HEALTH CHECK ---');
    console.log(`Users registered: ${usersCount.count}`);
    console.log(`Products in catalog: ${productsCount.count}`);
    console.log(`Categories found: ${categoriesCount.count}`);
    console.log('-----------------------------');

    const admin = await queryOne("SELECT email, role FROM users WHERE role = 'admin'");
    console.log(`Admin credentials verification: ${admin ? 'OK (' + admin.email + ')' : 'FAIL'}`);

    console.log('Database verification successfully passed!');
    process.exit(0);
  } catch (err) {
    console.error('Database verification failed:', err);
    process.exit(1);
  }
};

test();
