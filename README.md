<p align="center">

**Jellystat** is a free and open source Statistics App for Jellyfin! (This project is still in development - expect some weirdness)

## Current Features

- Session Monitoring and logging
- Statistics for all Libraries and Users
- Watch History
- User Overview and activity
- Watch statisitcs
- Backup and restore Data
- Auto sync library items
- Jellyfin Statistics Plugin Integration

## Required Development
- Responsive UI
- Code Optimizations
- Security Testing
- More Validations and Error Handling
- Multi-Server support
- More to come

## Getting Started with Development
- Clone the project from git
- set your env variables before strating the server (Variable names as per the docker compose file).
- Run `npm install` to install necessary packages
- Run `npm run start-server` to only run the backend nodejs server
- Run `npm run start` to only run the frontend React UI
- Run `npm run start-app` to run both backend and frontend at the same time

When contributing please ensure to log a pull request on the `unstable` branch

### Launching Jellystat using Docker

Check out our dockerhub to run Jellystat:
https://hub.docker.com/r/cyfershepard/jellystat

### Environment variables from files (Docker secrets)
You can set any environment variable from a file by using the prefix `FILE__`

As an example:
```yaml
  jellystat:
    environment:
      FILE__MYVAR: /run/secrets/MYSECRETFILE
```
Will set the environment variable `MYVAR` based on the contents of the `/run/secrets/MYSECRETFILE` file. see [docker secrets](https://docs.docker.com/compose/use-secrets/) for more info.

## Screenshots

<img src="./screenshots/Home.PNG">
<img src="./screenshots/Users.PNG">
<img src="./screenshots/Activity.PNG">
<img src="./screenshots/Libraries.PNG">
<img src="./screenshots/settings.PNG">

## Support

- Bug reports and feature requests can be submitted via [GitHub Issues](https://github.com/CyferShepard/Jellystat/issues).
- Join us in our [Discord](https://discord.gg/9SMBj2RyEe)

## API Documentation

To-do
