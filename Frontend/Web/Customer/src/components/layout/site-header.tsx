"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useHydrated } from "@/hooks/use-hydrated";
import { FREE_DELIVERY_FROM } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export const NAV_LINKS = [
  { href: "/jerseys?sport=football", label: "Football" },
  { href: "/jerseys?sport=cricket", label: "Cricket" },
  { href: "/jerseys?sport=basketball", label: "Basketball" },
  { href: "/jerseys?type=national", label: "National teams" },
  { href: "/jerseys?type=club", label: "Clubs" },
  { href: "/jerseys?sport=retro", label: "Retro" },
  { href: "/custom", label: "Custom jerseys" },
];

function SearchForm({ id }: { id: string }) {
  return (
    <form action="/search" role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search jerseys
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        name="q"
        type="search"
        maxLength={80}
        placeholder="Search teams or players"
        className="h-10 bg-white pl-9"
      />
    </form>
  );
}

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  return (
    <span
      className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-shirt px-1 font-display text-[11px] leading-[18px] font-extrabold text-navy"
      aria-label={label}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SiteHeader() {
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const wishCount = useWishlistStore((s) => s.ids.length);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-chalk/95 backdrop-blur supports-backdrop-filter:bg-chalk/80">
      <p className="bg-navy px-4 py-2 text-center text-sm text-white">
        Free delivery on orders over {formatPrice(FREE_DELIVERY_FROM)}. Name and number printing on most jerseys.
      </p>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-lg" className="lg:hidden" />}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-chalk p-6">
            <SheetTitle className="font-display text-2xl font-extrabold">Shop jerseys</SheetTitle>
            <SearchForm id="mobile-search" />
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block border-b border-border py-3 text-lg font-medium hover:text-cobalt"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-baseline gap-1.5" aria-label="Sagram Sports home">
          <span className="font-display text-3xl leading-none font-black tracking-tight text-navy">
            Sagram
          </span>
          <span className="hidden font-display text-lg leading-none font-bold text-cobalt sm:inline">
            Sports
          </span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden lg:block">
          <ul className="flex items-center gap-5 text-[15px] font-medium">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="py-2 transition-colors hover:text-cobalt">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-64 xl:block">
          <SearchForm id="desktop-search" />
        </div>

        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <Button
            variant="ghost"
            size="icon-lg"
            className="relative"
            nativeButton={false}
            render={<Link href="/wishlist" />}
            aria-label="Wishlist"
          >
            <Heart className="size-5" />
            {hydrated && <CountBadge count={wishCount} label={`${wishCount} saved`} />}
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="relative"
            nativeButton={false}
            render={<Link href="/cart" />}
            aria-label="Bag"
          >
            <ShoppingBag className="size-5" />
            {hydrated && <CountBadge count={cartCount} label={`${cartCount} in bag`} />}
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            nativeButton={false}
            render={<Link href="/account" />}
            aria-label="Account"
          >
            <User className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
