export interface AdminRoleInfo {
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  displayName?: string;
}

export const ADMIN_ROLES: Record<string, AdminRoleInfo> = {
  "asharkhanggc@gmail.com": {
    title: "Director",
    subtitle: "",
    color: "text-stone-700 dark:text-stone-300",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    border: "border-stone-300 dark:border-stone-600",
    icon: "",
  },
  "aaliyan12345ilf@gmail.com": {
    title: "Backend Developer",
    subtitle: "Logistics Operator",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "code",
  },
  "muhibkhan.dev@gmail.com": {
    title: "Product Engineer",
    subtitle: "Data Analyst",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "zap",
    displayName: "Muhib Khan",
  },
  "muhibkhan2410@gmail.com": {
    title: "Product Engineer",
    subtitle: "Data Analyst",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "zap",
    displayName: "Muhib Khan",
  },
};

export function getAdminRole(email: string): AdminRoleInfo | null {
  return ADMIN_ROLES[email.toLowerCase().trim()] ?? null;
}
