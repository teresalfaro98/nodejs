"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const token_helper_1 = __importDefault(require("../helpers/token.helper"));
const mongo_helper_1 = __importDefault(require("../helpers/mongo.helper"));
const env_1 = __importDefault(require("../enviroments/env"));
const mongo = mongo_helper_1.default.getInstance(env_1.default.MONGODB);
const tokenHelper = token_helper_1.default(env_1.default, mongo);
exports.default = (mongo) => {
    return {
        actualizarCorreo: (io, socket) => __awaiter(void 0, void 0, void 0, function* () {
            socket.on('actualizarCorreo', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    let result = yield tokenHelper.verify(payload.token, payload.apiKey);
                    let sockets = yield mongo.db.collection('sockets').findOne({ correo: result.tokenDecoded.correo });
                    if (result.ok == true && !sockets) {
                        yield mongo.db.collection('sockets').insertOne({
                            socketId: [socket.id],
                            correo: result.tokenDecoded.correo,
                        });
                    }
                    else if (result.ok == true && sockets) {
                        yield mongo.db.collection('sockets').findOneAndUpdate({
                            _id: sockets._id
                        }, { $push: { socketId: socket.id } });
                    }
                    let conectados = yield mongo.db.collection('sockets').find({}).toArray();
                    io.emit('broadcast-message', conectados);
                }
                catch (error) {
                    console.log(error);
                }
            }));
        }),
        signIn: (io, socket) => {
            socket.on('signIn', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                // Guardar en Base de Datos
                try {
                    let result = yield mongo.db.collection('usuarios')
                        .findOneAndUpdate({ correo: payload.email }, // Criterio de Busqueda
                    {
                        $set: {
                            nombreCompleto: payload.displayName,
                            fotoURL: payload.phtoURL
                        }
                    }, {
                        upsert: true
                    });
                    const token = yield tokenHelper.create({
                        correo: payload.email,
                        nombreCompleto: payload.displayName,
                        fotoUrl: payload.phtoURL
                    }, payload.apiKey);
                    if (token.ok == true)
                        io.to(socket.id).emit('token', token.token);
                    //Guardar en base de datos cliente conectado
                }
                catch (error) {
                    console.log(error);
                }
            }));
        },
        logOut: (io, socket) => {
            socket.on('logOut', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    let token = yield tokenHelper.verify(payload.token, payload.apikey);
                    if (token.ok == true) {
                        let result = yield mongo.db.collection('sockets').findOne({ correo: token.tokenDecoded.correo });
                        if (result) {
                            if (result.socketId.length > 1) {
                                yield mongo.db.collection('sockets').findOneAndUpdate({ _id: result._id }, { $pull: { socketId: socket.id } }, { multi: true });
                            }
                            else {
                                yield mongo.db.collection('sockets').deleteOne({ _id: result._id });
                            }
                        }
                        const conectados = yield mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message', conectados);
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }));
        },
        disconnect: (io, socket) => {
            socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    console.log(`Desconexión del cliente con ID: ${socket.id}`);
                    // Eliminar Socket Desconectado
                    let result = yield mongo.db.collection('sockets').findOne({ socketId: socket.id });
                    if (result) {
                        if (result.socketId.length > 1) {
                            yield mongo.db.collection('sockets').findOneAndUpdate({ _id: result._id }, { $pull: { socketId: socket.id } }, { multi: true });
                        }
                        else {
                            yield mongo.db.collection('sockets').deleteOne({ _id: result._id });
                        }
                        const conectados = yield mongo.db.collection('sockets').find({}).toArray();
                        io.emit('broadcast-message', conectados);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                // TO DO: Guardar Log en Base de Datos
            }));
        }
    };
};
