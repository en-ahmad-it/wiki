import { UserButton } from "@hexclave/next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { hexclaveServerApp } from "@/stack/server";

export async function NavBar() {
  const user = await hexclaveServerApp.getUser();

  return (
    <nav
      className="w-full border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60 sticky top-0 z-50"
      data-testid="navbar"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-gray-900"
            data-testid="navbar-logo"
          >
            Wikimasters
          </Link>
        </div>

        <NavigationMenu>
          <NavigationMenuList className="flex items-center gap-2">
            {user ? (
              <>
                {/* New Article Button */}
                <NavigationMenuItem>
                  <Button
                    asChild
                    variant="outline"
                    data-testid="new-article-btn"
                  >
                    <Link href="/wiki/edit/new">New Article</Link>
                  </Button>
                </NavigationMenuItem>

                {/* Authenticated User Menu */}
                <NavigationMenuItem data-testid="user-menu">
                  <UserButton />
                </NavigationMenuItem>
              </>
            ) : (
              <>
                {/* Sign In */}
                <NavigationMenuItem>
                  <Button asChild variant="outline" data-testid="sign-in-btn">
                    <Link href="/handler/sign-in">Sign In</Link>
                  </Button>
                </NavigationMenuItem>

                {/* Sign Up */}
                <NavigationMenuItem>
                  <Button asChild data-testid="sign-up-btn">
                    <Link href="/handler/sign-up">Sign Up</Link>
                  </Button>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
