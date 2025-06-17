
import { auth } from "@clerk/nextjs/server";

const allowedIds = ["user_2sQuCnYT9LTiAEUlUY3Yoz53sRu"];
export const isAdmin = async () => {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  return allowedIds.indexOf(userId) !== -1;
};
