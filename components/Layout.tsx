import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Crown, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import neekoLogo from "@/assets/neeko-sports-logo.png";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // ...
}