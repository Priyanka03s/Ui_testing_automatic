import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { ROLES, ALL_PERMISSIONS } from '../config/constants.js';

async function seedSuperAdmin() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    const email = (ENV.SUPER_ADMIN_EMAIL || 'admin@designcheck.ai').toLowerCase().trim();
    const name = ENV.SUPER_ADMIN_NAME || 'Super Admin';
    const password = ENV.SUPER_ADMIN_PASSWORD;

    if (!password) {
      console.error('[Seed Error] SUPER_ADMIN_PASSWORD environment variable is not defined.');
      process.exit(1);
    }

    const existingAdmin = await User.findOne({
      $or: [{ email }, { role: ROLES.SUPER_ADMIN }],
    });

    if (existingAdmin) {
      console.log(`[Seed Info] Super Admin already exists: (${existingAdmin.email}) - ensuring role and permissions are up-to-date.`);
      existingAdmin.role = ROLES.SUPER_ADMIN;
      existingAdmin.permissions = ALL_PERMISSIONS;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('[Seed Success] Super Admin verified.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const superAdmin = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      permissions: ALL_PERMISSIONS,
      authProvider: 'local',
      isActive: true,
      lastLoginAt: null,
    });

    console.log(`[Seed Success] Super Admin account created successfully for: ${superAdmin.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed Super Admin: ${error.message}`);
    process.exit(1);
  }
}

seedSuperAdmin();
