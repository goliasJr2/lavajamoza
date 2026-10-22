import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type StaffRole = "ADMIN" | "STAFF";
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);
