// import { Role } from "@/generated/prisma/enums";
//
// export const SessionDuration = {
//   [Role.User]: 1000 * 60 * 60 * 24, // 24 uur
// } satisfies Record<Role, number>;

export const SessionDuration: Record<string, number> = {
  Admin: 1000 * 60 * 60 * 2, // 2 hours
  Employee: 1000 * 60 * 60 * 24, // 24 hours
};

export const DEFAULT_SESSION_DURATION = 1000 * 60 * 60;
