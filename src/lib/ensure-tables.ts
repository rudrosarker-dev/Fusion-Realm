// src/lib/ensure-tables.ts — রানটাইম DDL প্রতি রিকোয়েস্টে নয়, প্রতি প্রসেসে মাত্র একবার।
// প্রোডাকশনে এগুলো মাইগ্রেশন দিয়ে তৈরি করে DB ইউজারের CREATE অনুমতি তুলে নেওয়াই সবচেয়ে নিরাপদ।
import { sql } from "drizzle-orm";
import { db } from "@/db";

let done: Promise<void> | null = null;

export function ensureTables(): Promise<void> {
  if (!done) {
    done = (async () => {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS store_journal (
        id text PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL, eyebrow text NOT NULL,
        date text NOT NULL, image text NOT NULL, excerpt text NOT NULL, body jsonb NOT NULL,
        created_at timestamp DEFAULT NOW())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS store_content (
        id text PRIMARY KEY, content jsonb NOT NULL, updated_at timestamp DEFAULT NOW())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS store_banners (
        id text PRIMARY KEY, banners jsonb NOT NULL, updated_at timestamp DEFAULT NOW())`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS abandoned_carts (
        id text PRIMARY KEY, customer_name text NOT NULL, customer_email text, customer_phone text NOT NULL,
        items jsonb NOT NULL, total_bdt integer NOT NULL, status text DEFAULT 'PENDING',
        created_at timestamp DEFAULT NOW())`);
    })().catch((e) => {
      done = null;
      throw e;
    });
  }
  return done;
}
