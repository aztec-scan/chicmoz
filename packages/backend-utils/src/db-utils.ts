import { varchar } from "drizzle-orm/pg-core";

export const generateAztecAddressColumn = (name: string) =>
  varchar(name, { length: 66 });
