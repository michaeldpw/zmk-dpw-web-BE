module.exports = {
    apps: [
      {
        name: 'my-app',
        script: 'built/server.js',
        env: {
          MONGODB_URI: 'mongodb+srv://peiwend7:lOcSCf7MffBWM23b@cluster0.tz27s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
        }
      }
    ]
  }