#!/bin/sh
# shellcheck disable=SC2155

#Exports
export DISCORD_TOKEN="$(cat /run/secrets/bot_account)";
export CLIENT_ID="$(cat /run/secrets/bot_account_id)";
export LOGGER_WEBHOOK="$(cat /run/secrets/bot_account_hook)";
export DATABASE_URL="mysql://$(cat /run/secrets/db_user):$(cat /run/secrets/db_password)@$(cat /run/secrets/db_host):$(cat /run/secrets/db_port)/$(cat /run/secrets/db_name)";

#SED: SQLite->MySQL
sed "s/sqlite/mysql/" "./prisma/schema.prisma" > "./prisma/newschema.prisma";
rm "./prisma/schema.prisma";
mv "./prisma/newschema.prisma" "./prisma/schema.prisma";

#SED: String->Json
sed "s|String //json|Json|" "./prisma/schema.prisma" > "./prisma/newschema.prisma";
rm "./prisma/schema.prisma";
mv "./prisma/newschema.prisma" "./prisma/schema.prisma";

#Apply Prisma changes & launch
bun prodprisma;
bun start;