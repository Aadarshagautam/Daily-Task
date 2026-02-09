/**
 * One-time migration script: Creates an Organization for each existing user
 * and sets orgId on all their business records.
 *
 * Usage: node --experimental-modules src/scripts/migrateToOrg.js
 * (or add "type": "module" to package.json if not already present)
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { ConnectDB } from "../core/config/db.js";
import UserModel from "../core/models/User.js";
import OrganizationModel from "../core/models/Organization.js";
import OrgMemberModel from "../core/models/OrgMember.js";
import NoteModel from "../modules/notes/model.js";
import TodoModel from "../modules/todos/model.js";
import TransactionModel from "../modules/accounting/model.js";
import InventoryModel from "../modules/inventory/model.js";
import CustomerModel from "../modules/customers/model.js";
import InvoiceModel from "../modules/invoices/model.js";

async function migrate() {
  await ConnectDB();

  const users = await UserModel.find({});
  console.log(`Found ${users.length} users to migrate.`);

  for (const user of users) {
    // Skip if user already has an org
    if (user.currentOrgId) {
      const existingOrg = await OrganizationModel.findById(user.currentOrgId);
      if (existingOrg) {
        console.log(`User ${user.username} (${user.email}) already has org: ${existingOrg.name}. Skipping org creation.`);
        // Still update records that may be missing orgId
        const orgId = user.currentOrgId;
        const models = [NoteModel, TodoModel, TransactionModel, InventoryModel, CustomerModel, InvoiceModel];
        for (const Model of models) {
          const result = await Model.updateMany(
            { userId: user._id, $or: [{ orgId: null }, { orgId: { $exists: false } }] },
            { $set: { orgId } }
          );
          if (result.modifiedCount > 0) {
            console.log(`  Updated ${result.modifiedCount} ${Model.modelName} records.`);
          }
        }
        continue;
      }
    }

    console.log(`Migrating user: ${user.username} (${user.email})`);

    // Create organization
    const slug = `${user.username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${user._id.toString().slice(-4)}`;
    const org = new OrganizationModel({
      name: `${user.username}'s Organization`,
      slug,
      ownerId: user._id,
      email: user.email,
    });
    await org.save();
    console.log(`  Created org: ${org.name} (${org.slug})`);

    // Create membership
    const member = new OrgMemberModel({
      orgId: org._id,
      userId: user._id,
      role: "owner",
      permissions: ["*"],
    });
    await member.save();

    // Update user
    user.currentOrgId = org._id;
    await user.save();

    // Update all business records
    const models = [NoteModel, TodoModel, TransactionModel, InventoryModel, CustomerModel, InvoiceModel];
    for (const Model of models) {
      const result = await Model.updateMany(
        { userId: user._id, $or: [{ orgId: null }, { orgId: { $exists: false } }] },
        { $set: { orgId: org._id } }
      );
      if (result.modifiedCount > 0) {
        console.log(`  Updated ${result.modifiedCount} ${Model.modelName} records.`);
      }
    }
  }

  console.log("\nMigration complete!");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
