import type { PathRouteProps } from "react-router-dom";
import { Routes } from "./routes";
import { Login, Stream } from "@/pages";
import { AuthLayout } from "@/layout";

export interface RouteBuilderItem extends PathRouteProps {
  Layout?: React.FC<any>;
  Element: React.FC;
  props?: any;
  isProtected?: boolean;
}

export const RouteBuilder: RouteBuilderItem[] = [
  {
    path: Routes.login,
    Element: Login,
    Layout: AuthLayout,
  },
  {
    path: Routes.stream(":id"),
    Element: Stream,
  },
];
