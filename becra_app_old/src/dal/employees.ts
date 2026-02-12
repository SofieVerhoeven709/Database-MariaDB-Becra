import "server-only";
import { prismaClient } from "./prismaClient";
import type { Prisma, Employee } from "@/generated/prisma/client";
import { cache } from "react";
import { hashPassword } from "@/lib/passwordUtils";
import type { Profile, SessionWithProfile } from "@/models/employee";
import { profileOmit, sessionWithProfileInclude } from "@/models/employee";
import { SessionDuration } from "@/constants";
import { generateBinaryUuid } from "@/lib/utils";

export type CreateEmployeeParams = Prisma.EmployeeCreateInput;

/**
 * Create a new user with the "User" role.
 *
 * @param data The user's profile data.
 */
export async function createEmployee(
  data: CreateEmployeeParams,
): Promise<Profile> {
  return prismaClient.employee.create({
    data: {
      ...data,
      password_hash: hashPassword(data.password_hash),
    },
    omit: profileOmit,
    include: { Role_Employee_roleIdToRole: true },
  });
}

/**
 * Retrieve a user's information based on their email.
 * DO NOT USE ON THE CLIENT, the response includes the user's hashed password.
 *
 * @param mail The email of the user to retrieve.
 */
export async function getEmployeeByEmail(
  mail: string,
): Promise<Employee | null> {
  return prismaClient.employee.findFirst({ where: { mail } });
}

/**
 * Start a new session.
 *
 * @param employeeId The id of the user for whom to start a new session.
 * @param role The role of the user for whom to start the session.
 */
export async function startSession(
  employeeId: Uint8Array<ArrayBuffer>,
  role: { name: string },
): Promise<SessionWithProfile> {
  return prismaClient.session.create({
    data: {
      id: generateBinaryUuid(),
      employeeId,
      activeUntil: new Date(Date.now() + SessionDuration[role.name]),
    },
    include: sessionWithProfileInclude,
  });
}

/**
 * Retrieve a specific session and the corresponding session.
 *
 * @param id The id of the session to retrieve.
 */
export const getSessionProfile = cache(
  (id: Uint8Array<ArrayBuffer>): Promise<SessionWithProfile | null> => {
    return prismaClient.session.findUnique({
      where: {
        id,
        activeUntil: {
          gt: new Date(),
        },
      },
      include: sessionWithProfileInclude,
    });
  },
);

/**
 * Stop a given session.
 *
 * @param id The id of the session to stop.
 */
export async function stopSession(id: Uint8Array<ArrayBuffer>): Promise<void> {
  await prismaClient.session.update({
    where: { id },
    data: {
      activeUntil: new Date(),
    },
  });
}

export type UpdateEmployeeParams = Prisma.EmployeeUpdateInput & {
  id: Uint8Array<ArrayBuffer>;
};

/**
 * Update a user's profile.
 *
 * @param id The id of the user to update.
 * @param data The updated profile data.
 */
export async function updateEmployee({
  id,
  ...data
}: UpdateEmployeeParams): Promise<Profile> {
  return prismaClient.employee.update({
    where: { id },
    data: {
      ...data,
    },
    omit: profileOmit,
    include: { Role_Employee_roleIdToRole: true },
  });
}

/**
 * Extend the given session so that is remains active for another 24 hours.
 *
 * @param id The id of the session to extend.
 * @param role The role of the user for whom to start the session.
 */
export async function extendSession(
  id: Uint8Array<ArrayBuffer>,
  role: { name: string },
): Promise<SessionWithProfile> {
  return prismaClient.session.update({
    where: { id },
    data: {
      activeUntil: new Date(Date.now() + SessionDuration[role.name]),
    },
    include: sessionWithProfileInclude,
  });
}
