import React from 'react';
import { Footer } from "@/components/footer";
import { Header as HeaderClient } from "@/components/header";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { RetroRestoreClient } from "./client";

async function Header() {
  const supabaseServer = await createServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  return <HeaderClient initialUser={user} />;
}

export default async function RetroRestorePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <RetroRestoreClient />
      <Footer />
    </main>
  )
}