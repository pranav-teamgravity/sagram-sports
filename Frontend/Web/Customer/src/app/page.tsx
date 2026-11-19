import { JerseyRack } from "@/components/home/jersey-rack";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getRackJerseys } from "@/lib/rack-jerseys";

// The rack is managed from the admin app, so read it fresh on every request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rackJerseys = await getRackJerseys();
  return (
    <>
      <SiteHeader />
      <main>
        <JerseyRack products={rackJerseys} />
        {/* Sections 2 to 4 go here once described. */}
      </main>
      <SiteFooter />
    </>
  );
}
