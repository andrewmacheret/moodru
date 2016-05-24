FROM iron/node

# Ensure nodejs is at a specific version
RUN apk add --update nodejs=5.10.1-r0

# Install mongodb
ADD https://raw.githubusercontent.com/mvertes/dosu/0.1.0/dosu /sbin/
RUN chmod +x /sbin/dosu && \
  echo http://dl-4.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
  apk add --no-cache mongodb && \
  rm -f /tmp/* /var/cache/apk/*

VOLUME /data/db

WORKDIR /app
COPY node_modules node_modules
COPY static static
COPY init.js .
COPY moodru.js .
COPY express.json .
COPY facebook.json .

# Expose node port
EXPOSE 80
EXPOSE 27017 28017

# Run node
CMD (mongod&) && node moodru.js
