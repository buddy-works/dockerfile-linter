# EL0001
### Invalid line
#### Incorrect code:
````Dockerfile
FROM ubuntu:16.04
RUN apt-get update && 
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
Lines not starting with a correct instruction or not being a part of the previous instruction are labeled as invalid.
 
# ED0001
### All parser directives must be at the very top of the Dockerfile.
#### Incorrect code:
````Dockerfile
# Empty line
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
Parser directives must be at the very top of the Dockerfile.

# ED0002
### Directive appears more then once.
#### Incorrect code:
````Dockerfile
# directive=value1
# directive=value2
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
Parser directive cannot be used more than once.

# ED0003
### Directives should be lowercase.
#### Incorrect code:
````Dockerfile
# DIRECTIVE=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
According to the convention, names of parser directives should be typed in lowercase.

# ED0004
### Parser directive will be treated as a comment.
#### Incorrect code:
````Dockerfile
# About my dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
Parser directive is treated as a comment if it appears after a builder instruction, a comment which is not a parser directive, or when it is impossible to recognize it.

# ED0005
### Missing value for directive.
#### Incorrect code:
````Dockerfile
# About my dockerfile
# directive=
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Correct code:
````Dockerfile
# directive=value
FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install -y wget
````
#### Explanation:
If used, parser directives must contain values.

# ER0001
### Set the `SHELL` option `-o` (`-eo` for Alpine image) pipefail before `RUN` with a pipe in.
#### Incorrect code:
````Dockerfile
RUN wget -O - https://some.site | wc -l > /number
````
#### Correct code:
````Dockerfile
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN wget -O - https://some.site | wc -l > /number
````
#### Explanation:
Some `RUN` commands depend on the ability to pipe the output of one command into another using the pipe character (`|`), as in the following example:

```Dockerfile
RUN wget -O - https://some.site | wc -l > /number
```
The commands are executed with the `/bin/sh -c` interpreter, which means that only the exit code of the last operation is evaluated.
The build step from the example above will produce a new image for as long as the `wc -l` succeeds – even if the `wget` command fails.

# EU0001
### Last user should not be `root`.
#### Incorrect code:
````Dockerfile
FROM ubuntu:16.04
USER root
RUN ...
````
#### Correct code:
````Dockerfile
FROM ubuntu:16.04
USER root
RUN ...
USER not-root
````
#### Explanation:
Changing `USER` to `root` creates a risk of unauthorized access into the container. As soon as the instruction that required root access has finished, it should be changed to an unpriviliged user.

# EI0001
### There can only be one instruction like `(CMD, HEALTHCHECK, ENTRYPOINT)`.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
CMD ["npm","install","test"]
CMD ["node","test"]
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
RUN npm install test
CMD ["node","test"]
````
#### Explanation:
Instructions like `CMD`,`HEALTHCHECK` and `ENTRYPOINT` can only appear once in the Dockerfile. If used multiple times, only the last one will be executed.

# EI0002
### `FROM` may only be preceded by one or more `ARG`.
#### Incorrect code:
````Dockerfile
COPY file .
ARG  CODE_VERSION=latest
FROM base:${CODE_VERSION}
````
#### Correct code:
````Dockerfile
ARG  CODE_VERSION=latest
FROM base:${CODE_VERSION}
````
#### Explanation:
According to the documentation, the only instruction that can appear before `FROM` is `ARG`.

# EF0001
### Missing `FROM`.
#### Incorrect code:
````Dockerfile
COPY . .
RUN npm install
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
COPY . .
RUN npm install
````
#### Explanation:
Every Dockerfile must contain `FROM` instructions.

# EC0001
### `COPY --from` cannot reference its own `FROM` alias.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine as build
COPY --from=build . .
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine as build
RUN ...
FROM node:10.16.3-alpine
COPY --from=build . .
````
#### Explanation:
Attempting to copy from the same image in which the instruction is executed will result in an error.

# EC0002
### `COPY --from` should reference a previously defined `FROM` alias.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
RUN ...
FROM node:10.16.3-alpine
COPY --from=build . .
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine as build
RUN ...
FROM node:10.16.3-alpine
COPY --from=build . .
````
#### Explanation:
Attempting to copy from a non-existing image will result in an error.

# EI0003
### `MAINTAINER` is deprecated, instead use `LABEL`.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
MAINTAINER me :)
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine 
LABEL maintainer="me :)"
````
#### Explanation:
The `MAINTAINER` instruction is deprecated and should not be used anymore. It is advised to use the `LABEL` instruction instead.

# EJ0001
### You must use double-quotes (") in JSON array.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
CMD ['node']
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine 
CMD ["node"]
````
#### Explanation:
According to JSON syntax, the arguments in the table must be in double brackets.

# EJ0002
### `CMD` and `ENTRYPOINT` should be written in JSON form.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
CMD node
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine 
CMD ["node"]
````
#### Explanation:
If plain text is used for passing arguments, signals from the OS are not correctly passed to the executables, which is in the majority of the cases what you would expect.

# EJ0003
### `SHELL` must be written in JSON form.
#### Incorrect code:
````Dockerfile
FROM microsoft/windowsservercore
SHELL powershell -command
RUN Write-Host hello
````
#### Correct code:
````Dockerfile
FROM microsoft/windowsservercore
SHELL ["powershell", "-command"]
RUN Write-Host hello
````
#### Explanation:
According to the `SHELL` syntax, arguments must be written in a JSON table.

# EF0002
### `FROM` aliases must be unique.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine as build
RUN ...
FROM node:10.16.3-alpine as build
RUN ...
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine as build1
RUN ...
FROM node:10.16.3-alpine as build2
RUN ...
````
#### Explanation:
Repeating a step name will result in an error.

# EF0003
### Using `latest` is prone to errors if the image will ever update.
#### Incorrect code:
````Dockerfile
FROM node:latest
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
````
#### Explanation:
Using the `latest` tag does not mean it is assigned to a specific image version.

#### Exceptions:
The `latest` tag can be used in case the image name refers to a previously defined alias.

# EF0004
### Always tag the version of an image explicitly.
#### Incorrect code:
````Dockerfile
FROM node
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
````
#### Explanation:
Using the `latest` tag does not mean it is assigned to a specific image version.

````Dockerfile
FROM node:10.16.3-alpine as build
RUN ...
FROM build
RUN ...
````
# ER0002
### Delete the apt-get lists after installing something.
#### Incorrect code:
````Dockerfile
RUN apt-get update && apt-get install -y python
````
#### Correct code:
````Dockerfile
RUN apt-get update && apt-get install -y python \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
````
#### Explanation:
Removing `apt-get` lists will decrease the size of the image. Note: the operation must be performed in the same `RUN` instruction as the installation.

# ER0003
### Use `WORKDIR` to switch to a directory.
#### Incorrect code:
````Dockerfile
RUN cd /usr/src/app
````
#### Correct code:
````Dockerfile
WORKDIR /usr/scr/app
````
#### Explanation:
Most commands run with an absolute path and don't require changing the working directory. If you do need to change the directory, you should use the `WORKDIR` instruction.

# ER0004
### Do not use `sudo`, consider using `gosu`.
#### Incorrect code:
````Dockerfile
RUN sudo apt-get install
````
#### Correct code:
````Dockerfile
RUN apt-get install
````
#### Explanation:
Using sudo to provide permissions is not recommended as it may lead to unexpected behavior. It is advised to use a tool like gosu instead.

# ER0005
### Command `(ssh, vim, shutdown, service, ps, free, top, kill, mount, ifconfig)` does not make sense in a container.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
RUN vim
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
````
#### Explanation:
Commands like `ssh`, `vim`, `shutdown`, `service`, `ps`, `free`, `top`, `kill`, `mount` and `ifconfig` should not be excecuted inside Docker containers.

# ER0006
### Using `(apt-get upgrade, dist-upgrade, apk upgrade, apt)` is not recommended.
#### Incorrect code:
````Dockerfile
FROM debian
RUN apt-get update && apt-get upgrade
````
#### Correct code:
````Dockerfile
FROM debian
RUN apt-get update
````
#### Explanation:

Linux distributions do not endure using `apt` as the tool's interface may suffer changes between versions. It is advised to use `apt-get` and `apt-cache` instead as they are more stable. 
Running `apt-get upgrade`, `dist-upgrade` or `apk upgrade` is not recommended as some of the essential packages from the base images will not upgrade inside a container with no privileges. In case a package from the base image is outdated, it is advised to contact its maintainers.

#### Exceptions:
If some package requires an upgrade, use `apk --cache add packageName` instead of `apk upgrade`.

# EA0001
### Use `curl` or `wget` instead, and delete files when no longer needed.
#### Incorrect code:
````Dockerfile
ADD http://example.com/big.tar.xz /usr/src/things/
RUN tar -xJf /usr/src/things/big.tar.xz -C /usr/src/things
RUN make -C /usr/src/things all
````
#### Correct code:
````Dockerfile
RUN mkdir -p /usr/src/things \
    && curl -SL http://example.com/big.tar.xz \
    | tar -xJC /usr/src/things \
    && make -C /usr/src/things all
````
#### Explanation:
Because image size matters, using `ADD` to fetch packages from remote URLs is strongly discouraged. Instead, you should use `curl` or `wget`. That way you can delete the files you no longer need after they’ve been extracted and you don’t have to add another layer in your image. 

# EC0003
### Use `ADD` for extracting archives into a image.
#### Incorrect code:
````Dockerfile
COPY rootfs.tar.xz /usr/src/things
RUN tar -xJf /usr/src/things/big.tar.xz -C /usr/src/things
````
#### Correct code:
````Dockerfile
ADD rootfs.tar.xz /usr/src/things
````
#### Explanation:
Although both commands are similar in terms of functionality, it is advised to use `COPY` instead of `ADD`. `COPY` only supports basic copying of local files into the container, while `ADD` is better suited for local tar file auto-extraction into the image (e.g. `ADD rootfs.tar.xz /.`)

# ER0007
### Either use `wget` or `curl`, but not both.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
RUN vim
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
````
#### Explanation:
Do not install two tools doing the same thing.

# ER0008
### Use `SHELL` to change the default shell.
#### Incorrect code:
````Dockerfile
RUN ln -sfv /bin/bash /bin/sh
````
#### Correct code:
````Dockerfile
SHELL ["/bin/bash", "-c"]
````
#### Explanation:
Docker supports the `SHELL` instruction which does not require overwriting `/bin/sh` in the container.

# ER0009
### Use the `-y` switch.
#### Incorrect code:
````Dockerfile
RUN apt-get install python
````
#### Correct code:
````Dockerfile
RUN apt-get install -y python
````
#### Explanation:
The build might break without human intervention if the option `-y/--assume-yes` is not applied.

# ER0010
### Avoid additional packages by specifying `--no-install-recommends`.
#### Incorrect code:
````Dockerfile
RUN apt-get install -y python
````
#### Correct code:
````Dockerfile
RUN apt-get install -y --no-install-recommends python
````
#### Explanation:
Avoid installing additional packages that you did not explicitly want.

# EA0002
### Use `COPY` instead of `ADD` for files and folders.
#### Incorrect code:
````Dockerfile
FROM python:3.4
ADD requirements.txt /usr/src/app/
````
#### Correct code:
````Dockerfile
FROM python:3.4
COPY requirements.txt /usr/src/app/
````
#### Explanation:
For other items (files, directories) that do not require `ADD`’s tar auto-extraction capability, you should always use `COPY`.

# EC0004
### `COPY` with more then 2 arguments requires the last argument to end with `/`.
#### Incorrect code:
````Dockerfile
FROM node:10.16.3-alpine
COPY package.json yarn.lock my_app
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
COPY package.json yarn.lock my_app/
````
#### Explanation:
If multiple resources are specified, either directly or due to the use of a wildcard, then it must be a directory and it must end with a slash `/`.

# ER0011
### Use the `--no-cache` switch.
#### Incorrect code:
````Dockerfile
FROM alpine:3.7
RUN apk add --update foo=1.0
    && rm -rf /var/cache/apk/*
````
#### Correct code:
````Dockerfile
FROM alpine:3.7
RUN apk --no-cache add foo=1.0
````
#### Explanation:
From Alpine Linux 3.3 onwards, a new `--no-cache` option for `apk` is available which allows users to install packages with an index that is updated and used on-the-fly and not cached locally. As a result, using `--update` and removing `/var/cache/apk/*` is no longer required during the package install.

# ER0012
### Pin versions in `apt get install`.
#### Incorrect code:
````Dockerfile
RUN apt-get install python
````
#### Correct code:
````Dockerfile
RUN apt-get install python=2.7
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# ER0013
### Pin versions in `pip install`.
#### Incorrect code:
````Dockerfile
RUN pip install django
````
#### Correct code:
````Dockerfile
RUN pip install django==1.9
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# ER0014
### Pin versions in `npm install`.
#### Incorrect code:
````Dockerfile
RUN npm install express
````
#### Correct code:
````Dockerfile
RUN npm install express@4.1.1
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# ER0015
### Pin versions in `apk add`.
#### Incorrect code:
````Dockerfile
RUN apk --no-cache add foo
````
#### Correct code:
````Dockerfile
RUN apk --no-cache add foo=1.2.3
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# ER0016
### Pin versions in `gem install`.
#### Incorrect code:
````Dockerfile
RUN gem install bundler
````
#### Correct code:
````Dockerfile
RUN gem install bundler:1.1
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# EI0004
### Don't use `(ONBUILD,FROM,MAINTAINTER)` in `ONBUILD`.
#### Incorrect code:
````Dockerfile
ONBUILD ONBUILD ADD . /app/src
````
#### Correct code:
````Dockerfile
ONBUILD ADD . /app/src
````
#### Explanation:
Chaining `ONBUILD` instructions using `ONBUILD ONBUILD` isn’t allowed.
The `ONBUILD` instruction may not trigger `FROM` or `MAINTAINER` instructions.

# EW0001
### Use absolute `WORKDIR`.
#### Incorrect code:
````Dockerfile
WORKDIR usr/src/app
````
#### Correct code:
````Dockerfile
WORKDIR /usr/src/app
````
#### Explanation:
Version pinning forces the build to retrieve a particular version regardless of the cache contents. It also reduce failures due to unanticipated changes in required packages.

# EE0001
### Valid UNIX ports range from 0 to 65535.
#### Incorrect code:
````Dockerfile
EXPOSE 80000
````
#### Correct code:
````Dockerfile
EXPOSE 65535
````
#### Explanation:
https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers

# EI0005
### Instructions should be uppercase.
#### Incorrect code:
````Dockerfile
from node:10.16.3-alpine
````
#### Correct code:
````Dockerfile
FROM node:10.16.3-alpine
````
#### Explanation:
According to the convention, names of instructions should be typed in uppercase.