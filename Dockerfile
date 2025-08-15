# ADAPTED FROM: https://gist.github.com/yaikohi/1d1f94a343d71857e0f73ef4a23dd071

FROM oven/bun:1-alpine as base
# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
WORKDIR /usr/src/app

FROM base AS install
# install dependencies into temp directory
# this will cache them and speed up future builds
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production


FROM base AS prerelease
# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
ENV SERVER_PRESET=bun

FROM base AS release
# copy production dependencies and source code into final image
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/bun.lock .
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/dockerstart.sh .
COPY --from=prerelease /usr/src/app/tsconfig.json .
COPY --from=prerelease /usr/src/app/src .src
COPY --from=prerelease /usr/src/app/prisma prisma

# run the app
USER bun
ENTRYPOINT [ "sh", "./dockerstart.sh" ]