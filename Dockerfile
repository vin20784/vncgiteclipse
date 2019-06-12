
FROM node:carbon

ENV NODE_ENV=production
ENV PORT=98
# Create app directory
WORKDIR /dsx

# Install app dependencies
# RUN npm -g install serve

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# COPY package*.json ./

# RUN npm install

# Bundle app source
COPY . /dsx

# Build react/vue/angular bundle static files
# RUN npm run build

EXPOSE 98

COPY ./start.sh /start.sh
RUN chmod +x /start.sh

# If serving static files
#CMD ["serve", "-s", "dist", "-p", "8080"]
CMD /start.sh
