import type { NextApiRequest } from "next";
import { stringify } from "querystring";

import { HttpError } from "@calcom/lib/http-error";
import { defaultHandler, defaultResponder } from "@calcom/lib/server";
import prisma from "@calcom/prisma";

import { getSlackAppKeys } from "../lib/utils";

const scopes = ["commands", "channel:history", "groups:history", "im:history", "mpim:history"];

async function handler(req: NextApiRequest) {
  if (!req.session?.user?.id) {
    throw new HttpError({ statusCode: 401, message: "You must be logged in to do this" });
  }

  const { client_id } = await getSlackAppKeys();
  // Get user
  await prisma.user.findFirstOrThrow({
    where: {
      id: req.session.user.id,
    },
    select: {
      id: true,
    },
  });
  const params = {
    client_id,
    scope: scopes.join(","),
  };
  const query = stringify(params);
  const url = `https://slack.com/oauth/v2/authorize?${query}&user_`;

  return { url };
}

export default defaultHandler({
  GET: Promise.resolve({ default: defaultResponder(handler) }),
});
