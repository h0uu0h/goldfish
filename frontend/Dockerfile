FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /usr/share/nginx/html
COPY ./cert /etc/nginx/cert

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
