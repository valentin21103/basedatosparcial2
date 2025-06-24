import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';


const USUARIOS = [
  { nombre: 'usuario1', contrasena: 'contrasena1' },
  { nombre: 'usuario2', contrasena: 'contrasena2' }
];

function App() {
  const [remitente, setRemitente] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [logueado, setLogueado] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  // Asignar destinatario automáticamente
  useEffect(() => {
    if (remitente) {
      const otro = USUARIOS.find(u => u.nombre !== remitente);
      setDestinatario(otro ? otro.nombre : '');
    }
  }, [remitente]);

  // Cargar historial al loguearse
  useEffect(() => {
    if (logueado && remitente && destinatario) {
      fetch(`http://localhost:5000/mensajes?remitente=${remitente}&destinatario=${destinatario}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMensajes(data);
            setError('');
          } else {
            setMensajes([]);
            setError(data.error || 'Error al cargar mensajes');
          }
        })
        .catch(() => {
          setMensajes([]);
          setError('Error de conexión al cargar mensajes');
        });
    }
  }, [logueado, remitente, destinatario]);

  // Socket.IO para mensajes en tiempo real
  useEffect(() => {
    if (logueado) {
      socketRef.current = io('http://localhost:5000');
      socketRef.current.on('connect', () => {
        // Eliminado log innecesario
      });
      socketRef.current.on('mensaje', (data) => {
        if (
          (data.remitente === remitente && data.destinatario === destinatario) ||
          (data.remitente === destinatario && data.destinatario === remitente)
        ) {
          setMensajes((prev) => [...prev, data]);
        }
      });
      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [logueado, remitente, destinatario]);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: remitente, contrasena })
      });
      if (!res.ok) {
        setError('Usuario o contraseña incorrectos');
        return;
      }
      setLogueado(true);
    } catch {
      setError('Error de conexión');
    }
  };

  // Enviar mensaje
  const handleEnviar = async (e) => {
    e.preventDefault();
    if (mensaje.trim() && remitente && destinatario) {
      await fetch('http://localhost:5000/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remitente, destinatario, texto: mensaje })
      });
      socketRef.current.emit('mensaje', { remitente, destinatario, texto: mensaje });
      setMensaje('');
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    setLogueado(false);
    setRemitente('');
    setContrasena('');
    setDestinatario('');
    setMensajes([]);
    setError('');
  };

  if (!logueado) {
    return (
      <div className="login-container">
        <h1>
          <span className="icon" role="img" aria-label="chat">💬</span>
          <div>Chat Mensajería</div>
        </h1>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario">¿Quién eres?</label>
            <select id="usuario" value={remitente} onChange={e => setRemitente(e.target.value)} required>
              <option value="">Selecciona tu usuario</option>
              {USUARIOS.map(u => (
                <option key={u.nombre} value={u.nombre}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña:</label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              required
            />
          </div>
          <button type="submit">Entrar al chat</button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      <h1>💬 Chat Mensajería 1 a 1</h1>
      <div className="chat-header">
        <b>Remitente:</b> {remitente} | <b>Destinatario:</b> {destinatario}
      </div>
      <div className="chat-messages">
        {mensajes.length === 0 && <div className="no-messages">No hay mensajes aún.</div>}
        {mensajes.map((msg, idx) => (
          <div
            key={idx}
            className={
              'chat-message ' + (msg.remitente === remitente ? 'sent' : 'received')
            }
          >
            <span className="chat-user">{msg.remitente.charAt(0).toUpperCase()}</span> {msg.texto}
          </div>
        ))}
      </div>
      {/* Mostrar solo errores amigables */}
      {error && !error.includes('Cast to ObjectId') && <div className="error-message">{error}</div>}
      <form onSubmit={handleEnviar} className="chat-form">
        <input
          type="text"
          placeholder="Escribe un mensaje"
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          required
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default App;
