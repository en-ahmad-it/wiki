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
    <nav className="w-full border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight text-gray-900"
          >
            Wikimasters
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList className="flex items-center gap-2">
            {user ? (
              <NavigationMenuItem>
                <UserButton />
              </NavigationMenuItem>
            ) : (
              <>
                <NavigationMenuItem>
                  <Button asChild variant="outline">
                    <Link href="/handler/sign-in">Sign In</Link>
                  </Button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Button asChild>
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
