const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  remitente: {
    type: String,
    required: true
  },
  destinatario: {
    type: String,
    required: true
  },
  texto: {
    type: String,
    required: true
  },
  enviadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mensaje', mensajeSchema); 