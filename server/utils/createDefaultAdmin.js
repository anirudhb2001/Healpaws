import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function createDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    const existingAdmin = await User.findOne({ email: adminEmail, role: "admin" });

    if (existingAdmin) {
      console.log("Default admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const adminUser = new User({
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();

    // console.log("Default admin created:");
    // console.log("Email: admin@healpaws.com");
    // console.log("Password: admin123");
  } catch (err) {
    console.error("Error creating default admin:", err);
  }
}
