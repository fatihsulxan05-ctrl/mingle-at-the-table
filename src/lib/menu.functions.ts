import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { itemSchema, categorySchema } from "./menu-schema";

const createMenuClient = createServerOnlyFn((url: string | undefined, key: string | undefined) => {
  if (!key || !url) throw new Error("Menü bağlantısı kurulamadı.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
});

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const [categories, items] = await Promise.all([
    client.from("menu_categories").select("*").order("position"),
    client.from("menu_items").select("*").eq("available", true).order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Menü yüklenemedi.");
  return { categories: categories.data ?? [], items: items.data ?? [] };
});

// Management is intentionally public at the owner's request. The publishable
// client can access only the menu tables allowed by their explicit RLS policies.
export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const [categories, items] = await Promise.all([
    client.from("menu_categories").select("*").order("position"),
    client.from("menu_items").select("*").order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Panel yüklenemedi.");
  return { categories: categories.data ?? [], items: items.data ?? [] };
});

export const saveItem = createServerFn({ method: "POST" }).inputValidator((input) => itemSchema.parse(input)).handler(async ({ data }) => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const { id, ...values } = data;
  const result = id ? await client.from("menu_items").update(values).eq("id", id).select("id").single() : await client.from("menu_items").insert(values).select("id").single();
  if (result.error) throw new Error("Ürün kaydedilemedi.");
  return result.data;
});
export const saveCategory = createServerFn({ method: "POST" }).inputValidator((input) => categorySchema.parse(input)).handler(async ({ data }) => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const { id, ...values } = data;
  const result = id ? await client.from("menu_categories").update(values).eq("id", id).select("id").single() : await client.from("menu_categories").insert(values).select("id").single();
  if (result.error) throw new Error("Kategori kaydedilemedi.");
  return result.data;
});
export const deleteEntry = createServerFn({ method: "POST" }).inputValidator((input) => z.object({ id: z.string().min(1), kind: z.enum(["item", "category"]) }).parse(input)).handler(async ({ data }) => {
  const client = createMenuClient(process.env['SUPABASE_URL'], process.env['SUPABASE_PUBLISHABLE_KEY']);
  const result = await client.from(data.kind === "item" ? "menu_items" : "menu_categories").delete().eq("id", data.id).select("id").single();
  if (result.error) throw new Error(data.kind === "category" ? "Önce bu kategorideki ürünleri taşıyın veya silin." : "Ürün silinemedi.");
  return { ok: true };
});