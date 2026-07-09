FROM node:24-alpine

WORKDIR /dockerfilelinter

COPY . ./

RUN apk add --no-cache bash xz
RUN npm install
RUN ln -s /dockerfilelinter/bin/dockerfilelinter.js /usr/local/bin/linter
RUN /bin/bash -c 'chmod +x ./bin/dockerfilelinter.js'

CMD ["linter"]

#example docker run -v /tmp/files/dockerfile:/dockerfilelinter/dockerfile imagename linter -f dockerfile