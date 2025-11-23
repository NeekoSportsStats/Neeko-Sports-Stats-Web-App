// src/components/AppSidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

import { Home, Trophy, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        {/* MAIN NAV */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              {/* Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* AFL */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/sports/afl/players">
                    <Trophy className="h-4 w-4" />
                    <span>AFL</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* EPL */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/sports/epl/players">
                    <BarChart3 className="h-4 w-4" />
                    <span>EPL</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* NBA */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/sports/nba/players">
                    <BarChart3 className="h-4 w-4" />
                    <span>NBA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ❌ NO Neeko+ sections at all */}
      </SidebarContent>
    </Sidebar>
  );
}
