import type { ServerResponse } from "http";
import type { NextApiResponse } from "next";

import { UserRepository } from "@calcom/lib/server/repository/user";
import type { PrismaClient } from "@calcom/prisma";
import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";

import type { TFindTeamMembersMatchingAttributeLogicInputSchema } from "./findTeamMembersMatchingAttributeLogic.schema";
import { findTeamMembersMatchingAttributeLogic } from "@calcom/routing-forms/lib/findTeamMembersMatchingAttributeLogicOfRoute";

interface FindTeamMembersMatchingAttributeLogicHandlerOptions {
  ctx: {
    prisma: PrismaClient;
    user: NonNullable<TrpcSessionUser>;
    res: ServerResponse | NextApiResponse | undefined;
  };
  input: TFindTeamMembersMatchingAttributeLogicInputSchema;
}

export const findTeamMembersMatchingAttributeLogicHandler = async ({
  ctx,
  input,
}: FindTeamMembersMatchingAttributeLogicHandlerOptions) => {
  const { prisma, user } = ctx;
  const { teamId, attributesQueryValue, isPreview, _enablePerf, _concurrency } = input;
  const {
    teamMembersMatchingAttributeLogic: matchingTeamMembersWithResult,
    mainAttributeLogicBuildingWarnings: mainWarnings,
    fallbackAttributeLogicBuildingWarnings: fallbackWarnings,
    troubleshooter,
  } = await findTeamMembersMatchingAttributeLogic(
    {
      teamId,
      attributesQueryValue
    },
    {
      enablePerf: _enablePerf,
      enableTroubleshooter: _enablePerf,
      concurrency: _concurrency,
    }
  );

  if (!matchingTeamMembersWithResult) {
    return {
      troubleshooter,
      mainWarnings,
      fallbackWarnings,
      result: null,
    };
  }

  const matchingTeamMembersIds = matchingTeamMembersWithResult.map((member) => member.userId);
  const matchingTeamMembers = await UserRepository.findByIds({ ids: matchingTeamMembersIds });

  return {
    mainWarnings,
    fallbackWarnings,
    troubleshooter: troubleshooter,
    result: matchingTeamMembers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  };
};

export default findTeamMembersMatchingAttributeLogicHandler;
