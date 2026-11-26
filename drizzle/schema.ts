import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("Users", {
    user_id: text("user_id").primaryKey(),
    email: text("email").notNull().unique(),
    hashed_password: text("hashed_password").notNull(),
    username: text("username"),
    image: text("image"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").notNull(),
});

export const sessions = pgTable("Sessions", {
    session_id: text("session_id").primaryKey(),
    user_id: text("user_id").notNull().references(() => users.user_id, { onDelete: "cascade" }),
    expire_at: timestamp("expire_at").notNull(),
});