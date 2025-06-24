const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Usuario = require('./Modelos/Usuario');
const Mensaje = require('./Modelos/Mensaje');

// URI de conexión a MongoDB Atlas
const MONGO_URI = 'mongodb+srv://pugster555:joe10086@cluster0.yzbkpnc.mongodb.net/Mensajeria?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permite cualquier origen (ajusta en producción)
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

// Socket.IO básico
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
  });
  socket.on('mensaje', (data) => {
    io.emit('mensaje', data);
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Registrar usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, contrasena } = req.body;
    const usuario = new Usuario({ nombre, contrasena });
    await usuario.save();
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login de usuario
app.post('/login', async (req, res) => {
  try {
    const { nombre, contrasena } = req.body;
    const usuario = await Usuario.findOne({ nombre, contrasena });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    res.json({ ok: true, usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Enviar mensaje
app.post('/mensajes', async (req, res) => {
  try {
    const { remitente, destinatario, texto } = req.body;
    const mensaje = new Mensaje({ remitente, destinatario, texto });
    await mensaje.save();
    res.status(201).json(mensaje);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener mensajes entre dos usuarios
app.get('/mensajes', async (req, res) => {
  try {
    const { remitente, destinatario } = req.query;
    const mensajes = await Mensaje.find({
      $or: [
        { remitente, destinatario },
        { remitente: destinatario, destinatario: remitente }
      ]
    }).sort({ enviadoEn: 1 });
    res.json(mensajes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
