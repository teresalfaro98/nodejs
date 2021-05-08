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
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const mongo_helper_1 = __importDefault(require("./helpers/mongo.helper"));
const sockets_logic_1 = __importDefault(require("./sockets/sockets.logic"));
const env_1 = __importDefault(require("./enviroments/env"));
const token_helper_1 = __importDefault(require("./helpers/token.helper"));
const mongo = mongo_helper_1.default.getInstance(env_1.default.MONGODB, true);
const tokenHelper = token_helper_1.default(env_1.default, mongo);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongo.connect(env_1.default.MONGODB.DATABASE);
    if (mongo.statusConnection.status == 'success') {
        console.log(`Conexión exitosa a MonngoDB en el puerto ${env_1.default.MONGODB.PORT}`);
        // Correr Express
        const app = express_1.default();
        app.use(express_1.default.json());
        app.use(compression_1.default());
        app.use(cors_1.default({ origin: true, credentials: true }));
        //app.use(cors({origin: true, credentials: true}));
        app.get('/', (req, res) => {
            res.status(200).json({
                ok: true,
                msg: 'API Real-Time funcionando correctamente'
            });
        });
        const httpServer = http_1.default.createServer(app);
        const socketIO = require('socket.io')(httpServer, {
            cors: {
                origin: ["http://localhost:4200", "http://www.teresalfaro.me"]
            },
            allowEIO3: true
        });
        // Funcionalidad Real-Time
        const socketLogic = sockets_logic_1.default(mongo);
        socketIO.on('connection', (socket) => {
            // TO DO: Lógica Real-Time
            console.log(`Nuevo cliente conectado con ID: ${socket.id}`);
            socketLogic.actualizarCorreo(socketIO, socket);
            socketLogic.logOut(socketIO, socket);
            socketLogic.signIn(socketIO, socket);
            socketLogic.disconnect(socketIO, socket);
        });
        httpServer.listen(env_1.default.API.PORT, () => {
            console.log(`Servidor Express funcionando correctamente en puerto ${env_1.default.API.PORT}`);
        });
    }
    else {
        console.log('No se pudo establecer conexión co la base de datos');
    }
}))();
// Handle Errors 
process.on('unhandleRejection', (error, promise) => {
    console.log(`Ocurrio un error no controlado de tipo promise rejection`, promise);
    console.log(`La descripción de error es la siguiente`, error);
    // Close MongoDB
    mongo.close();
    process.exit();
});
